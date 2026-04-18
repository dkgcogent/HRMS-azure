// @ts-nocheck
import { Request, Response } from 'express';
import pool from '../db';
import { AuthUser } from '../middleware/auth';
import {
  createAsset,
  updateAsset,
  getAssetById,
  getAssetHistory,
  addAssetPhoto,
  logAssetHistory,
  calculateDepreciation,
  Asset,
} from '../services/assetService';
import path from 'path';
import { uploadBufferToBlob, getBlobUrl, deleteBlob } from '../services/azureBlobService';

// Get all assets with filters
export const getAllAssets = async (req: Request, res: Response) => {
  try {
    const { category, status, search, assignedTo } = req.query;
    
    // Check if asset_photos table exists, if not use NULL for primary_photo
    // IMPORTANT: Always include assigned_to in SELECT to show employee ID even if JOIN fails
    // CRITICAL: Use proper JOIN to get employee names
    // Note: Removed e.is_active check from JOIN to ensure we get employee data even if is_active column doesn't exist or is different
    let query = `
      SELECT a.*, 
             e.first_name, e.last_name, e.employee_id as emp_id,
             COALESCE(e.id, a.assigned_to) as assigned_employee_id,
             NULL as primary_photo
      FROM hrms_assets a
      LEFT JOIN hrms_employees e ON a.assigned_to = e.id
      WHERE a.is_active = 1
    `;
    
    // Try to add photo subquery if table exists (will be handled gracefully if it doesn't)
    try {
      const [tableCheck]: any = await pool.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'hrms_asset_photos'
      `);
      
      if (tableCheck && tableCheck.length > 0 && tableCheck[0].count > 0) {
        query = `
          SELECT a.*, 
                 e.first_name, e.last_name, e.employee_id as emp_id,
                 COALESCE(e.id, a.assigned_to) as assigned_employee_id,
                 (SELECT photo_path FROM hrms_asset_photos WHERE asset_id = a.id AND is_primary = 1 LIMIT 1) as primary_photo
          FROM hrms_assets a
          LEFT JOIN hrms_employees e ON a.assigned_to = e.id
          WHERE a.is_active = 1
        `;
      }
    } catch (checkError) {
      // If check fails, use the simple query without photos
      console.warn('Could not check for asset_photos table, using simple query');
    }
    const params: any[] = [];

    if (category) {
      query += ' AND a.category = ?';
      params.push(category);
    }

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (assignedTo) {
      query += ' AND a.assigned_to = ?';
      params.push(assignedTo);
    }

    if (search) {
      query += ' AND (a.name LIKE ? OR a.asset_id LIKE ? OR a.serial_number LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY a.created_at DESC';

    console.log(`[getAllAssets] Executing query:`, query);
    console.log(`[getAllAssets] Query params:`, params);
    
    const [rows]: any = await pool.query(query, params);
    
    // CRITICAL DEBUG: Log raw query results for ALL ASSIGNED assets
    const assignedAssetsDebug = rows.filter((a: any) => a.status === 'ASSIGNED');
    if (assignedAssetsDebug.length > 0) {
      console.log(`[getAllAssets] 🔍🔍🔍 DETAILED DEBUG FOR ${assignedAssetsDebug.length} ASSIGNED ASSET(S) 🔍🔍🔍`);
      for (const asset of assignedAssetsDebug) {
        console.log(`\n[getAllAssets] Asset ${asset.id} (${asset.name}):`);
        console.log(`  Raw data from query:`, {
          assigned_to: asset.assigned_to,
          first_name: asset.first_name,
          last_name: asset.last_name,
          emp_id: asset.emp_id,
          assigned_employee_id: asset.assigned_employee_id
        });
        
        // Test direct employee query to verify employee exists
        if (asset.assigned_to) {
          try {
            const [testEmp]: any = await pool.query(
              'SELECT id, first_name, last_name, employee_id FROM hrms_employees WHERE id = ?',
              [asset.assigned_to]
            );
            if (testEmp.length > 0) {
              console.log(`  ✅ Employee exists in DB:`, testEmp[0]);
              console.log(`  ❓ Why JOIN didn't return name? Checking...`);
              
              // Test the exact JOIN query
              const [joinTest]: any = await pool.query(
                `SELECT a.id, a.assigned_to, e.id as emp_db_id, e.first_name, e.last_name 
                 FROM hrms_assets a 
                 LEFT JOIN hrms_employees e ON a.assigned_to = e.id 
                 WHERE a.id = ?`,
                [asset.id]
              );
              console.log(`  JOIN test result:`, joinTest[0]);
              
              // If employee exists but JOIN didn't work, manually fix it
              if (testEmp.length > 0 && !asset.first_name) {
                asset.first_name = testEmp[0].first_name;
                asset.last_name = testEmp[0].last_name;
                asset.emp_id = testEmp[0].employee_id;
                console.log(`  ✅✅✅ MANUALLY FIXED: Added employee data to response`);
              }
            } else {
              console.log(`  ❌ Employee ${asset.assigned_to} NOT FOUND in employees table!`);
            }
          } catch (err: any) {
            console.error(`  ❌ Error checking employee:`, err.message);
          }
        }
      }
      console.log(`[getAllAssets] 🔍🔍🔍 END DETAILED DEBUG 🔍🔍🔍\n`);
    }
    
    // CRITICAL: Fix data inconsistency - if status is ASSIGNED but assigned_to is NULL, fix it IMMEDIATELY
    // This handles cases where data got into an inconsistent state
    const inconsistentAssets = rows.filter((a: any) => a.status === 'ASSIGNED' && (!a.assigned_to || a.assigned_to === null || a.assigned_to === 0));
    if (inconsistentAssets.length > 0) {
      console.warn(`[getAllAssets] Found ${inconsistentAssets.length} assets with inconsistent state (ASSIGNED but no assigned_to). Fixing immediately...`);
      
      // Fix all inconsistent assets in a single transaction
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        
      for (const asset of inconsistentAssets) {
        try {
            await connection.query(
            'UPDATE hrms_assets SET status = ? WHERE id = ? AND (assigned_to IS NULL OR assigned_to = 0)',
            ['AVAILABLE', asset.id]
          );
          console.log(`[getAllAssets] Fixed asset ${asset.id}: Changed status from ASSIGNED to AVAILABLE (no assigned employee)`);
            // Update the row in memory so response has correct data
          asset.status = 'AVAILABLE';
            asset.assigned_to = null;
        } catch (fixError: any) {
          console.error(`[getAllAssets] Error fixing asset ${asset.id}:`, fixError.message);
        }
        }
        
        await connection.commit();
        console.log(`[getAllAssets] Successfully fixed ${inconsistentAssets.length} inconsistent assets`);
      } catch (transactionError: any) {
        await connection.rollback();
        console.error(`[getAllAssets] Transaction error while fixing assets:`, transactionError.message);
      } finally {
        connection.release();
      }
    }
    
    // Debug: Log assignment data for ASSIGNED assets
    const assignedAssets = rows.filter((a: any) => a.status === 'ASSIGNED');
    console.log(`[getAllAssets] Found ${assignedAssets.length} ASSIGNED assets out of ${rows.length} total`);
    assignedAssets.forEach((asset: any) => {
      console.log(`[getAllAssets] Asset ${asset.id} (${asset.name}):`);
      console.log(`  - Status: ${asset.status}`);
      console.log(`  - assigned_to (from hrms_assets table): ${asset.assigned_to}`);
      console.log(`  - first_name (from JOIN): ${asset.first_name || 'NULL'}`);
      console.log(`  - last_name (from JOIN): ${asset.last_name || 'NULL'}`);
      console.log(`  - emp_id (from JOIN): ${asset.emp_id || 'NULL'}`);
      
      // If assigned_to exists but no employee name, check database directly and fix SYNCHRONOUSLY
      if (asset.assigned_to && !asset.first_name) {
        console.warn(`[getAllAssets] ⚠️ WARNING: Asset ${asset.id} has assigned_to=${asset.assigned_to} but JOIN returned no employee data!`);
        // This will be fixed synchronously below before response is sent
      } else if (asset.assigned_to && asset.first_name) {
        console.log(`[getAllAssets] ✅ Asset ${asset.id} properly assigned to: ${asset.first_name} ${asset.last_name} (${asset.emp_id})`);
      }
    });
    
    // CRITICAL: Fix missing employee data SYNCHRONOUSLY before sending response
    const assetsNeedingFix = rows.filter((a: any) => a.status === 'ASSIGNED' && a.assigned_to && !a.first_name);
    if (assetsNeedingFix.length > 0) {
      console.log(`[getAllAssets] Fixing ${assetsNeedingFix.length} assets with missing employee data...`);
      for (const asset of assetsNeedingFix) {
        try {
          const [empRows]: any = await pool.query(
            'SELECT id, first_name, last_name, employee_id FROM hrms_employees WHERE id = ?',
            [asset.assigned_to]
          );
            if (empRows.length > 0) {
            const emp = empRows[0];
            // Update the row in memory with employee data
            asset.first_name = emp.first_name;
            asset.last_name = emp.last_name;
            asset.emp_id = emp.employee_id;
            console.log(`[getAllAssets] ✅ Fixed employee data for asset ${asset.id}: ${emp.first_name} ${emp.last_name}`);
            } else {
            console.error(`[getAllAssets] ❌ Employee ${asset.assigned_to} NOT FOUND in employees table!`);
            }
        } catch (err: any) {
          console.error(`[getAllAssets] Error fetching employee ${asset.assigned_to}:`, err.message);
        }
      }
    }
    
    // Final verification: Log all ASSIGNED assets with their employee data
    const finalAssignedAssets = rows.filter((a: any) => a.status === 'ASSIGNED');
    console.log(`[getAllAssets] ===== FINAL VERIFICATION =====`);
    console.log(`[getAllAssets] Total ASSIGNED assets in response: ${finalAssignedAssets.length}`);
    finalAssignedAssets.forEach((asset: any) => {
      console.log(`[getAllAssets] Asset ${asset.id} (${asset.name}):`);
      console.log(`  - assigned_to: ${asset.assigned_to}`);
      console.log(`  - first_name: ${asset.first_name || 'NULL'}`);
      console.log(`  - last_name: ${asset.last_name || 'NULL'}`);
      console.log(`  - emp_id: ${asset.emp_id || 'NULL'}`);
      if (asset.assigned_to && !asset.first_name) {
        console.error(`[getAllAssets] ⚠️ WARNING: Asset ${asset.id} has assigned_to but no employee name!`);
      } else if (asset.assigned_to && asset.first_name) {
        console.log(`[getAllAssets] ✅ Asset ${asset.id} has employee: ${asset.first_name} ${asset.last_name}`);
      }
    });
    console.log(`[getAllAssets] ===== END VERIFICATION =====`);
    
    res.json({
      success: true,
      message: 'Assets fetched successfully',
      data: rows,
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get asset by ID
export const getAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assetId = parseInt(id);
    
    if (isNaN(assetId)) {
      return res.status(400).json({ success: false, message: 'Invalid asset ID' });
    }
    
    console.log(`[getAsset] Fetching asset with ID: ${assetId}`);
    const asset = await getAssetById(assetId);

    if (!asset) {
      console.log(`[getAsset] Asset ${assetId} not found`);
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    console.log(`[getAsset] Asset ${assetId} fetched successfully`);
    res.json({
      success: true,
      message: 'Asset fetched successfully',
      data: asset,
    });
  } catch (error: any) {
    console.error('[getAsset] Error fetching asset:', error);
    console.error('[getAsset] Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new asset
export const createNewAsset = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  
  try {
    const assetData: Partial<Asset> = {
      name: req.body.name,
      category: req.body.category,
      type: req.body.type,
      brand: req.body.brand,
      model: req.body.model,
      serialNumber: req.body.serialNumber,
      purchaseDate: req.body.purchaseDate,
      purchasePrice: (() => {
        if (req.body.purchasePrice === undefined || req.body.purchasePrice === null || req.body.purchasePrice === '') {
          return undefined;
        }
        const purchasePrice = typeof req.body.purchasePrice === 'string' 
          ? parseFloat(req.body.purchasePrice.replace(/,/g, '')) 
          : req.body.purchasePrice;
        
        // Validate purchase price: DECIMAL(10,2) max value is 99,999,999.99
        if (isNaN(purchasePrice)) {
          throw new Error('Invalid purchase price. Please provide a valid number.');
        }
        if (purchasePrice < 0) {
          throw new Error('Purchase price cannot be negative.');
        }
        if (purchasePrice > 99999999.99) {
          throw new Error('Purchase price exceeds maximum allowed value (₹99,999,999.99). Please enter a smaller amount.');
        }
        return purchasePrice;
      })(),
      vendorName: req.body.vendorName,
      invoiceNumber: req.body.invoiceNumber,
      depreciationMethod: req.body.depreciationMethod || 'STRAIGHT_LINE',
      depreciationRate: req.body.depreciationRate ? parseFloat(req.body.depreciationRate) : 10,
      usefulLifeYears: req.body.usefulLifeYears ? parseInt(req.body.usefulLifeYears) : 5,
      condition: req.body.condition,
      status: req.body.status || 'AVAILABLE',
      location: req.body.location,
      warrantyExpiry: req.body.warrantyExpiry,
      description: req.body.description,
      specifications: req.body.specifications,
    };

    // Handle assignment when creating new asset
    if (req.body.assignedTo !== undefined && req.body.assignedTo !== null && req.body.assignedTo !== '') {
      const employeeId = parseInt(String(req.body.assignedTo));
      
      // Validate employee exists
      const [employeeCheck]: any = await pool.query(
        'SELECT id, first_name, last_name FROM hrms_employees WHERE id = ?',
        [employeeId]
      );
      
      if (employeeCheck.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Employee with ID ${employeeId} not found. Cannot assign asset.`,
        });
      }
      
      console.log(`[createNewAsset] Employee ${employeeId} found: ${employeeCheck[0].first_name} ${employeeCheck[0].last_name}`);
      
      assetData.assignedTo = employeeId;
      assetData.assignmentDate = req.body.assignmentDate || new Date().toISOString().split('T')[0];
      assetData.status = 'ASSIGNED';
      console.log(`[createNewAsset] Creating asset assigned to employee ${assetData.assignedTo}`);
    } else if (req.body.status === 'ASSIGNED') {
      // Cannot create asset with ASSIGNED status without an employee
      return res.status(400).json({
        success: false,
        message: 'Cannot set status to ASSIGNED without assigning to an employee. Please select an employee.',
      });
    }

    console.log(`[createNewAsset] Final assetData:`, {
      assignedTo: assetData.assignedTo,
      assignmentDate: assetData.assignmentDate,
      status: assetData.status,
    });

    // Validation
    if (!assetData.name || !assetData.category || !assetData.type || !assetData.condition) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, type, and condition are required',
      });
    }

    const assetId = await createAsset(assetData, user);

    // CRITICAL: Fetch and return the created asset with employee data
    // This ensures the frontend gets the employee name immediately
    const newAsset = await getAssetById(assetId);
    
    if (!newAsset) {
      return res.status(500).json({
        success: false,
        message: 'Asset created but could not be retrieved',
      });
    }

    // Ensure employee data is included
    if (newAsset.assigned_to && !newAsset.first_name) {
      console.log(`[createNewAsset] Employee data missing, fetching...`);
      try {
        const [empRows]: any = await pool.query(
          'SELECT id, first_name, last_name, employee_id FROM hrms_employees WHERE id = ?',
          [newAsset.assigned_to]
        );
        if (empRows.length > 0) {
          newAsset.first_name = empRows[0].first_name;
          newAsset.last_name = empRows[0].last_name;
          newAsset.emp_id = empRows[0].employee_id;
          console.log(`[createNewAsset] ✅ Added employee data: ${newAsset.first_name} ${newAsset.last_name}`);
        }
      } catch (err: any) {
        console.error(`[createNewAsset] Error fetching employee:`, err.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      data: newAsset, // Return full asset with employee data
    });
  } catch (error: any) {
    console.error('Error creating asset:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// Update asset
export const updateExistingAsset = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const { id } = req.params;

  try {
    const assetData: Partial<Asset> = {};

    // Only include fields that are provided
    if (req.body.name !== undefined) assetData.name = req.body.name;
    if (req.body.category !== undefined) assetData.category = req.body.category;
    if (req.body.type !== undefined) assetData.type = req.body.type;
    if (req.body.brand !== undefined) assetData.brand = req.body.brand;
    if (req.body.model !== undefined) assetData.model = req.body.model;
    if (req.body.serialNumber !== undefined) assetData.serialNumber = req.body.serialNumber;
    if (req.body.purchaseDate !== undefined) assetData.purchaseDate = req.body.purchaseDate;
    if (req.body.purchasePrice !== undefined) {
      const purchasePrice = typeof req.body.purchasePrice === 'string' 
        ? parseFloat(req.body.purchasePrice.replace(/,/g, '')) 
        : req.body.purchasePrice;
      
      // Validate purchase price: DECIMAL(10,2) max value is 99,999,999.99
      if (isNaN(purchasePrice)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid purchase price. Please provide a valid number.',
        });
      }
      if (purchasePrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Purchase price cannot be negative.',
        });
      }
      if (purchasePrice > 99999999.99) {
        return res.status(400).json({
          success: false,
          message: 'Purchase price exceeds maximum allowed value (₹99,999,999.99). Please enter a smaller amount.',
        });
      }
      assetData.purchasePrice = purchasePrice;
    }
    if (req.body.vendorName !== undefined) assetData.vendorName = req.body.vendorName;
    if (req.body.invoiceNumber !== undefined) assetData.invoiceNumber = req.body.invoiceNumber;
    if (req.body.depreciationMethod !== undefined) assetData.depreciationMethod = req.body.depreciationMethod;
    if (req.body.depreciationRate !== undefined) assetData.depreciationRate = parseFloat(req.body.depreciationRate);
    if (req.body.usefulLifeYears !== undefined) assetData.usefulLifeYears = parseInt(req.body.usefulLifeYears);
    if (req.body.condition !== undefined) assetData.condition = req.body.condition;
    if (req.body.status !== undefined) assetData.status = req.body.status;
    if (req.body.location !== undefined) assetData.location = req.body.location;
    if (req.body.warrantyExpiry !== undefined) assetData.warrantyExpiry = req.body.warrantyExpiry;
    if (req.body.description !== undefined) assetData.description = req.body.description;
    if (req.body.specifications !== undefined) assetData.specifications = req.body.specifications;
    
    // Handle assignment - CRITICAL: This must be set for employee name to show
    console.log(`[updateExistingAsset] ===== ASSIGNMENT HANDLING START =====`);
    console.log(`[updateExistingAsset] req.body.assignedTo: ${req.body.assignedTo} (type: ${typeof req.body.assignedTo})`);
    console.log(`[updateExistingAsset] req.body.status: ${req.body.status}`);
    console.log(`[updateExistingAsset] req.body.assignedTo !== undefined: ${req.body.assignedTo !== undefined}`);
    console.log(`[updateExistingAsset] req.body.assignedTo !== null: ${req.body.assignedTo !== null}`);
    
    // CRITICAL: Process assignedTo FIRST - if provided, it takes precedence
    if (req.body.assignedTo !== undefined) {
      const assignedToValue = req.body.assignedTo;
      
      if (assignedToValue === null || assignedToValue === '') {
        // Explicitly clearing assignment
        assetData.assignedTo = null;
        assetData.assignmentDate = null;
        // If status was ASSIGNED, change to AVAILABLE
        if (req.body.status === 'ASSIGNED' || req.body.status === undefined) {
          assetData.status = 'AVAILABLE';
        }
        console.log(`[updateExistingAsset] Clearing assignment for asset ${id}`);
        } else {
        // assignedTo has a value - validate and assign
        const employeeId = parseInt(String(assignedToValue));
        
        if (isNaN(employeeId)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid employee ID provided.',
          });
        }
        
        // Validate employee exists
        const [employeeCheck]: any = await pool.query(
          'SELECT id, first_name, last_name, is_active FROM hrms_employees WHERE id = ?',
          [employeeId]
        );
        
        if (employeeCheck.length === 0) {
          return res.status(400).json({
            success: false,
            message: `Employee with ID ${employeeId} not found. Cannot assign asset.`,
          });
        }
        
        if (employeeCheck[0].is_active !== 1 && employeeCheck[0].is_active !== null) {
          console.warn(`[updateExistingAsset] Warning: Employee ${employeeId} is not active`);
        }
        
        console.log(`[updateExistingAsset] ✅ Employee ${employeeId} found: ${employeeCheck[0].first_name} ${employeeCheck[0].last_name}`);
        
        // CRITICAL: Always set assignment when assignedTo is provided
        assetData.assignedTo = employeeId;
        assetData.assignmentDate = req.body.assignmentDate || new Date().toISOString().split('T')[0];
        assetData.status = 'ASSIGNED'; // Force status to ASSIGNED when employee is assigned
        console.log(`[updateExistingAsset] ✅ Assigning asset ${id} to employee ${assetData.assignedTo}, date: ${assetData.assignmentDate}, status: ASSIGNED`);
      }
    } else if (req.body.status === 'ASSIGNED') {
      // assignedTo is undefined but status is ASSIGNED - try to preserve existing assignment
      console.log(`[updateExistingAsset] Status is ASSIGNED but no assignedTo provided. Checking existing assignment...`);
      const [existingAsset]: any = await pool.query(
        'SELECT assigned_to, assignment_date, status FROM hrms_assets WHERE id = ?',
        [id]
      );
      if (existingAsset.length > 0 && existingAsset[0].assigned_to) {
        console.log(`[updateExistingAsset] Preserving existing assignment: ${existingAsset[0].assigned_to}`);
        assetData.assignedTo = existingAsset[0].assigned_to;
        assetData.assignmentDate = existingAsset[0].assignment_date || new Date().toISOString().split('T')[0];
        assetData.status = 'ASSIGNED';
      } else {
        // CRITICAL: Cannot set status to ASSIGNED without an employee
        console.error(`[updateExistingAsset] ERROR: Cannot set status to ASSIGNED without assignedTo and no existing assignment found!`);
        return res.status(400).json({
          success: false,
          message: 'Cannot set status to ASSIGNED without assigning to an employee. Please select an employee.',
        });
      }
    }

    console.log(`[updateExistingAsset] ===== ASSIGNMENT HANDLING END =====`);
    console.log(`[updateExistingAsset] Final assetData before update:`, {
      assignedTo: assetData.assignedTo,
      assignmentDate: assetData.assignmentDate,
      status: assetData.status,
    });
    
    // CRITICAL: Ensure assignment data is explicitly set
    if (req.body.assignedTo !== undefined) {
      // Double-check assignment is in assetData
      if (assetData.assignedTo === undefined) {
        console.error(`[updateExistingAsset] ERROR: assignedTo was in req.body but not in assetData!`);
        console.error(`[updateExistingAsset] req.body.assignedTo: ${req.body.assignedTo}`);
        assetData.assignedTo = req.body.assignedTo ? parseInt(String(req.body.assignedTo)) : null;
        assetData.assignmentDate = req.body.assignmentDate || new Date().toISOString().split('T')[0];
        if (assetData.assignedTo) {
          assetData.status = 'ASSIGNED';
        }
        console.log(`[updateExistingAsset] FIXED: Set assignedTo=${assetData.assignedTo} in assetData`);
      }
    }
    
    // CRITICAL: Ensure assignment data is explicitly set
    if (req.body.assignedTo !== undefined) {
      // Double-check assignment is in assetData
      if (assetData.assignedTo === undefined) {
        console.error(`[updateExistingAsset] ERROR: assignedTo was in req.body but not in assetData!`);
        console.error(`[updateExistingAsset] req.body.assignedTo: ${req.body.assignedTo}`);
        assetData.assignedTo = req.body.assignedTo ? parseInt(String(req.body.assignedTo)) : null;
        assetData.assignmentDate = req.body.assignmentDate || new Date().toISOString().split('T')[0];
        if (assetData.assignedTo) {
          assetData.status = 'ASSIGNED';
        }
        console.log(`[updateExistingAsset] FIXED: Set assignedTo=${assetData.assignedTo} in assetData`);
      }
    }

    await updateAsset(parseInt(id), assetData, user);

    // CRITICAL: Fetch and return the updated asset with employee data
    // This ensures the frontend gets the employee name immediately
    const updatedAsset = await getAssetById(parseInt(id));
    
    if (!updatedAsset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found after update',
      });
    }

    // Ensure employee data is included
    if (updatedAsset.assigned_to && !updatedAsset.first_name) {
      console.log(`[updateExistingAsset] Employee data missing, fetching...`);
      try {
        const [empRows]: any = await pool.query(
          'SELECT id, first_name, last_name, employee_id FROM hrms_employees WHERE id = ?',
          [updatedAsset.assigned_to]
        );
        if (empRows.length > 0) {
          updatedAsset.first_name = empRows[0].first_name;
          updatedAsset.last_name = empRows[0].last_name;
          updatedAsset.emp_id = empRows[0].employee_id;
          console.log(`[updateExistingAsset] ✅ Added employee data: ${updatedAsset.first_name} ${updatedAsset.last_name}`);
        }
      } catch (err: any) {
        console.error(`[updateExistingAsset] Error fetching employee:`, err.message);
      }
    }

    res.json({
      success: true,
      message: 'Asset updated successfully',
      data: updatedAsset, // Return full asset with employee data
    });
  } catch (error: any) {
    console.error('Error updating asset:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// Delete asset (soft delete)
export const deleteAsset = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const { id } = req.params;

  try {
    // Get asset before deletion
    const asset = await getAssetById(parseInt(id));
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Soft delete
    await pool.query('UPDATE hrms_assets SET is_active = 0 WHERE id = ?', [id]);

    // Log deletion
    await logAssetHistory(
      parseInt(id),
      'DELETED',
      user,
      `Asset ${asset.asset_id} deleted`,
      asset,
      null,
      req.body.remarks
    );

    res.json({
      success: true,
      message: 'Asset deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Upload asset photos
export const uploadPhotos = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const { assetId } = req.params;
  const files = req.files as Express.Multer.File[];

  try {
    console.log(`[Upload Photos] Request for asset ${assetId}, files:`, files?.length || 0);
    
    if (!files || files.length === 0) {
      console.error('[Upload Photos] No files in request');
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    // Verify asset exists
    const asset = await getAssetById(parseInt(assetId));
    if (!asset) {
      console.error(`[Upload Photos] Asset ${assetId} not found`);
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    console.log(`[Upload Photos] Asset found, existing photos: ${asset.photos?.length || 0}`);

    const uploadedPhotos: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`[Upload Photos] Processing file ${i + 1}/${files.length}: ${file.originalname}, size: ${file.size}, type: ${file.mimetype}`);
      
      try {
        // Upload to Azure instead of using local path
        const folderPrefix = 'assets/photos';
        const blobName = await uploadBufferToBlob(
          file.buffer,
          file.originalname,
          folderPrefix,
          file.mimetype
        );

        // Get the public URL for the blob
        const photoPath = getBlobUrl(blobName);
        const isPrimary = i === 0 && !asset.photos?.length; // First photo is primary if no photos exist

        const photoId = await addAssetPhoto(
          parseInt(assetId),
          {
            photoPath,
            photoName: file.originalname,
            photoSize: file.size,
            photoType: file.mimetype,
            isPrimary,
          },
          user.id
        );

        console.log(`[Upload Photos] Photo saved to Azure with ID: ${photoId}, URL: ${photoPath}`);
        uploadedPhotos.push({ id: photoId, path: photoPath });
      } catch (photoError: any) {
        console.error(`[Upload Photos] Error uploading/saving photo ${file.originalname}:`, photoError);
        throw new Error(`Failed to upload/save photo ${file.originalname}: ${photoError.message}`);
      }
    }

    // Log photo upload
    try {
      await logAssetHistory(
        parseInt(assetId),
        'UPDATED',
        user,
        `${uploadedPhotos.length} photo(s) uploaded`,
        null,
        { photos: uploadedPhotos.length }
      );
    } catch (historyError) {
      console.warn('[Upload Photos] Could not log history:', historyError);
      // Don't fail the request if history logging fails
    }

    console.log(`[Upload Photos] Successfully uploaded ${uploadedPhotos.length} photos`);
    res.json({
      success: true,
      message: 'Photos uploaded successfully',
      data: { photos: uploadedPhotos },
    });
  } catch (error: any) {
    console.error('[Upload Photos] Error uploading photos:', error);
    console.error('[Upload Photos] Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete asset photo
export const deletePhoto = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const { assetId, photoId } = req.params;

  try {
    // Verify asset exists
    const asset = await getAssetById(parseInt(assetId));
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Get photo info before deletion
    const [photoRows]: any = await pool.query(
      'SELECT * FROM hrms_asset_photos WHERE id = ? AND asset_id = ?',
      [photoId, assetId]
    );

    if (photoRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Photo not found' });
    }

    const photo = photoRows[0];
    
    // Delete from Azure Blob Storage if it's an Azure URL
    if (photo.photo_path && photo.photo_path.includes('blob.core.windows.net')) {
      try {
        // Extract blob name from URL
        const urlParts = photo.photo_path.split('/');
        const tmsfilesIndex = urlParts.indexOf('tmsfiles');
        const blobName = urlParts.slice(tmsfilesIndex + 1).join('/');
        
        if (blobName) {
          await deleteBlob(blobName);
          console.log(`[Delete Photo] Deleted blob from Azure: ${blobName}`);
        }
      } catch (deleteError) {
        console.warn(`[Delete Photo] Failed to delete blob from Azure:`, deleteError);
      }
    }

    // Delete photo from database
    await pool.query('DELETE FROM hrms_asset_photos WHERE id = ? AND asset_id = ?', [photoId, assetId]);

    // If deleted photo was primary, set another photo as primary if available
    if (photo.is_primary) {
      const [remainingPhotos]: any = await pool.query(
        'SELECT id FROM hrms_asset_photos WHERE asset_id = ? ORDER BY uploaded_at ASC LIMIT 1',
        [assetId]
      );
      if (remainingPhotos.length > 0) {
        await pool.query(
          'UPDATE hrms_asset_photos SET is_primary = 1 WHERE id = ?',
          [remainingPhotos[0].id]
        );
      }
    }

    // Log photo deletion
    try {
      await logAssetHistory(
        parseInt(assetId),
        'UPDATED',
        user,
        `Photo deleted: ${photo.photo_name || 'Unknown'}`,
        null,
        { photoId: parseInt(photoId) }
      );
    } catch (historyError) {
      console.warn('Could not log photo deletion in history');
    }

    res.json({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get asset history
export const getHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const history = await getAssetHistory(parseInt(id));

    res.json({
      success: true,
      message: 'Asset history fetched successfully',
      data: history,
    });
  } catch (error) {
    console.error('Error fetching asset history:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Calculate depreciation
export const calculateAssetDepreciation = async (req: Request, res: Response) => {
  try {
    const { purchasePrice, purchaseDate, depreciationMethod, depreciationRate, usefulLifeYears } = req.body;

    if (!purchasePrice || !purchaseDate) {
      return res.status(400).json({
        success: false,
        message: 'Purchase price and date are required',
      });
    }

    const currentValue = calculateDepreciation(
      parseFloat(purchasePrice),
      purchaseDate,
      depreciationMethod || 'STRAIGHT_LINE',
      parseFloat(depreciationRate) || 10,
      parseInt(usefulLifeYears) || 5
    );

    res.json({
      success: true,
      data: { currentValue },
    });
  } catch (error) {
    console.error('Error calculating depreciation:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Assign asset to employee
export const assignAsset = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const { id } = req.params;
  const { employeeId, assignmentDate, condition, purpose, remarks } = req.body;

  try {
    const asset = await getAssetById(parseInt(id));
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    const oldStatus = asset.status;
    const oldAssignedTo = asset.assigned_to;

    // Update asset
    await pool.query(
      'UPDATE hrms_assets SET assigned_to = ?, assignment_date = ?, status = ? WHERE id = ?',
      [employeeId, assignmentDate || new Date().toISOString().split('T')[0], 'ASSIGNED', id]
    );

    // Create assignment record
    await pool.query(
      `INSERT INTO hrms_asset_assignments (asset_id, employee_id, assigned_date, \`condition\`, purpose, remarks, status)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [id, employeeId, assignmentDate || new Date().toISOString().split('T')[0], condition || asset.condition, purpose, remarks]
    );

    // Log assignment
    await logAssetHistory(
      parseInt(id),
      'ASSIGNED',
      user,
      `Asset assigned to employee ${employeeId}`,
      { status: oldStatus, assignedTo: oldAssignedTo },
      { status: 'ASSIGNED', assignedTo: employeeId },
      remarks
    );

    res.json({
      success: true,
      message: 'Asset assigned successfully',
    });
  } catch (error) {
    console.error('Error assigning asset:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Return asset from employee
// Get all assets assigned to a specific employee
export const getAssetsByEmployee = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    
    const [assets]: any = await pool.query(`
      SELECT 
        a.*,
        (SELECT photo_path FROM hrms_asset_photos WHERE asset_id = a.id AND is_primary = 1 LIMIT 1) as primary_photo
      FROM hrms_assets a
      WHERE a.assigned_to = ? AND a.is_active = 1
      ORDER BY a.assignment_date DESC, a.created_at DESC
    `, [employeeId]);

    // Convert to camelCase
    const camelCaseAssets = assets.map((asset: any) => {
      const camelAsset: any = {};
      for (const key in asset) {
        if (asset.hasOwnProperty(key)) {
          const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
          camelAsset[camelKey] = asset[key];
        }
      }
      return camelAsset;
    });

    res.json({ 
      success: true, 
      message: 'Assets fetched successfully', 
      data: camelCaseAssets 
    });
  } catch (error: any) {
    console.error('Error fetching employee assets:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error: ' + error.message 
    });
  }
};

export const returnAsset = async (req: Request, res: Response) => {
  const user = req.user as AuthUser;
  const { id } = req.params;
  const { returnDate, condition, remarks } = req.body;

  try {
    const asset = await getAssetById(parseInt(id));
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Update asset
    await pool.query(
      'UPDATE hrms_assets SET assigned_to = NULL, assignment_date = NULL, status = ?, `condition` = ? WHERE id = ?',
      ['AVAILABLE', condition || asset.condition, id]
    );

    // Update assignment record
    await pool.query(
      'UPDATE hrms_asset_assignments SET return_date = ?, status = "RETURNED" WHERE asset_id = ? AND status = "ACTIVE"',
      [returnDate || new Date().toISOString().split('T')[0], id]
    );

    // Log return
    await logAssetHistory(
      parseInt(id),
      'RETURNED',
      user,
      `Asset returned from employee ${asset.assigned_to}`,
      { status: asset.status, assignedTo: asset.assigned_to },
      { status: 'AVAILABLE', assignedTo: null, condition: condition || asset.condition },
      remarks
    );

    res.json({
      success: true,
      message: 'Asset returned successfully',
    });
  } catch (error) {
    console.error('Error returning asset:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Fix all inconsistent asset records (assets with ASSIGNED status but no assigned_to)
export const fixInconsistentAssets = async (req: Request, res: Response) => {
  try {
    console.log('[fixInconsistentAssets] ===== ENDPOINT CALLED =====');
    console.log('[fixInconsistentAssets] Request method:', req.method);
    console.log('[fixInconsistentAssets] Request path:', req.path);
    console.log('[fixInconsistentAssets] Request url:', req.url);
    console.log('[fixInconsistentAssets] Starting to fix inconsistent assets...');
    
    // Find all assets with ASSIGNED status but no assigned_to
    const [inconsistentRows]: any = await pool.query(
      `SELECT id, name, status, assigned_to 
       FROM hrms_assets 
       WHERE status = 'ASSIGNED' 
       AND (assigned_to IS NULL OR assigned_to = 0) 
       AND is_active = 1`
    );
    
    if (inconsistentRows.length === 0) {
      return res.json({
        success: true,
        message: 'No inconsistent assets found',
        data: { fixed: 0 },
      });
    }
    
    console.log(`[fixInconsistentAssets] Found ${inconsistentRows.length} inconsistent assets to fix`);
    
    const connection = await pool.getConnection();
    let fixedCount = 0;
    
    try {
      await connection.beginTransaction();
      
      for (const asset of inconsistentRows) {
        try {
          await connection.query(
            'UPDATE hrms_assets SET status = ?, assigned_to = NULL, assignment_date = NULL WHERE id = ?',
            ['AVAILABLE', asset.id]
          );
          fixedCount++;
          console.log(`[fixInconsistentAssets] Fixed asset ${asset.id} (${asset.name})`);
        } catch (fixError: any) {
          console.error(`[fixInconsistentAssets] Error fixing asset ${asset.id}:`, fixError.message);
        }
      }
      
      await connection.commit();
      console.log(`[fixInconsistentAssets] Successfully fixed ${fixedCount} out of ${inconsistentRows.length} inconsistent assets`);
      
      res.json({
        success: true,
        message: `Fixed ${fixedCount} inconsistent asset(s)`,
        data: {
          found: inconsistentRows.length,
          fixed: fixedCount,
          assets: inconsistentRows.map((a: any) => ({ id: a.id, name: a.name })),
        },
      });
    } catch (transactionError: any) {
      await connection.rollback();
      console.error('[fixInconsistentAssets] Transaction error:', transactionError);
      throw transactionError;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('[fixInconsistentAssets] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fixing inconsistent assets',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
