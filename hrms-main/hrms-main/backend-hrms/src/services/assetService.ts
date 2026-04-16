// @ts-nocheck
import pool from '../db';
import { AuthUser } from '../middleware/auth';

export interface Asset {
  id?: number;
  assetId: string;
  name: string;
  category: 'IT_EQUIPMENT' | 'FURNITURE' | 'VEHICLE' | 'OFFICE_EQUIPMENT' | 'OTHER';
  type: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue?: number;
  vendorName?: string;
  invoiceNumber?: string;
  depreciationMethod?: 'STRAIGHT_LINE' | 'PERCENTAGE';
  depreciationRate?: number;
  usefulLifeYears?: number;
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED';
  status: 'AVAILABLE' | 'ASSIGNED' | 'UNDER_MAINTENANCE' | 'DISPOSED' | 'LOST';
  location?: string;
  assignedTo?: number;
  assignmentDate?: string;
  warrantyExpiry?: string;
  description?: string;
  specifications?: string;
  isActive?: boolean;
}

export interface AssetPhoto {
  id?: number;
  assetId: number;
  photoPath: string;
  photoName: string;
  photoSize?: number;
  photoType?: string;
  isPrimary?: boolean;
  uploadedBy?: number;
  uploadedAt?: string;
}

export interface AssetHistory {
  id?: number;
  assetId: number;
  actionType: 'CREATED' | 'UPDATED' | 'ASSIGNED' | 'RETURNED' | 'TRANSFERRED' | 'MAINTENANCE' | 'CONDITION_CHANGED' | 'STATUS_CHANGED' | 'DISPOSED' | 'DELETED';
  actionBy?: number;
  actionDate?: string;
  oldValue?: any;
  newValue?: any;
  description?: string;
  remarks?: string;
}

/**
 * Generate unique Asset ID in format: AST-YYYY-XXXXX
 * Example: AST-2024-00001
 */
export async function generateAssetId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = 'AST';

  try {
    // Get or create sequence for current year
    const [rows]: any = await pool.query(
      'SELECT sequence FROM hrms_asset_id_sequence WHERE prefix = ? AND year = ?',
      [prefix, currentYear]
    );

    let sequence = 1;
    if (rows.length > 0) {
      sequence = rows[0].sequence + 1;
      // Update sequence
      await pool.query(
        'UPDATE hrms_asset_id_sequence SET sequence = ? WHERE prefix = ? AND year = ?',
        [sequence, prefix, currentYear]
      );
    } else {
      // Create new sequence for this year
      await pool.query(
        'INSERT INTO hrms_asset_id_sequence (prefix, year, sequence) VALUES (?, ?, ?)',
        [prefix, currentYear, sequence]
      );
    }

    // Format: AST-2024-00001
    const paddedSequence = String(sequence).padStart(5, '0');
    return `${prefix}-${currentYear}-${paddedSequence}`;
  } catch (error) {
    console.error('Error generating asset ID:', error);
    // Fallback: use timestamp-based ID
    const timestamp = Date.now();
    return `${prefix}-${currentYear}-${String(timestamp).slice(-5)}`;
  }
}

/**
 * Calculate asset depreciation
 */
export function calculateDepreciation(
  purchasePrice: number,
  purchaseDate: string,
  depreciationMethod: 'STRAIGHT_LINE' | 'PERCENTAGE',
  depreciationRate: number,
  usefulLifeYears: number,
  currentDate: Date = new Date()
): number {
  if (!purchasePrice || !purchaseDate) {
    return purchasePrice || 0;
  }

  const purchase = new Date(purchaseDate);
  const yearsElapsed = (currentDate.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  if (yearsElapsed <= 0) {
    return purchasePrice;
  }

  if (depreciationMethod === 'STRAIGHT_LINE') {
    // Straight-line: (Purchase Price / Useful Life) * Years Elapsed
    const annualDepreciation = purchasePrice / usefulLifeYears;
    const totalDepreciation = annualDepreciation * yearsElapsed;
    return Math.max(0, purchasePrice - totalDepreciation);
  } else {
    // Percentage-based: Purchase Price * (1 - Rate/100) ^ Years Elapsed
    const rate = depreciationRate / 100;
    const currentValue = purchasePrice * Math.pow(1 - rate, yearsElapsed);
    return Math.max(0, currentValue);
  }
}

/**
 * Create asset with auto-generated ID and depreciation calculation
 */
export async function createAsset(assetData: Partial<Asset>, user: AuthUser): Promise<number> {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Validate purchase price range: DECIMAL(10,2) max is 99,999,999.99
    if (assetData.purchasePrice !== undefined && assetData.purchasePrice !== null) {
      if (assetData.purchasePrice < 0) {
        throw new Error('Purchase price cannot be negative.');
      }
      if (assetData.purchasePrice > 99999999.99) {
        throw new Error('Purchase price exceeds maximum allowed value (₹99,999,999.99).');
      }
    }

    // Generate Asset ID
    const assetId = await generateAssetId();

    // Calculate current value if purchase details provided
    let currentValue = assetData.currentValue;
    if (assetData.purchasePrice && assetData.purchaseDate) {
      currentValue = calculateDepreciation(
        assetData.purchasePrice,
        assetData.purchaseDate,
        assetData.depreciationMethod || 'STRAIGHT_LINE',
        assetData.depreciationRate || 10,
        assetData.usefulLifeYears || 5
      );
    }

    // Check which columns exist in the database
    const [columns]: any = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hrms_assets'`
    );
    const existingColumns = columns.map((col: any) => col.COLUMN_NAME);

    // Build dynamic INSERT query based on existing columns
    const baseFields = [
      'asset_id', 'name', 'category', 'type', 'brand', 'model', 'serial_number',
      'purchase_date', 'purchase_price', 'current_value', '`condition`', 
      'status', 'location', 'assigned_to', 'assignment_date', 'warranty_expiry', 
      'description', 'specifications'
    ];
    
    const optionalFields = [
      { db: 'vendor_name', data: assetData.vendorName },
      { db: 'invoice_number', data: assetData.invoiceNumber },
      { db: 'depreciation_method', data: assetData.depreciationMethod || 'STRAIGHT_LINE' },
      { db: 'depreciation_rate', data: assetData.depreciationRate || 10 },
      { db: 'useful_life_years', data: assetData.usefulLifeYears || 5 },
    ];

    const fields: string[] = [];
    const values: any[] = [];

    // Add base fields
    baseFields.forEach(field => {
      if (existingColumns.includes(field.replace('`', '').replace('`', ''))) {
        fields.push(field);
        switch (field) {
          case 'asset_id': values.push(assetId); break;
          case 'name': values.push(assetData.name); break;
          case 'category': values.push(assetData.category); break;
          case 'type': values.push(assetData.type); break;
          case 'brand': values.push(assetData.brand || null); break;
          case 'model': values.push(assetData.model || null); break;
          case 'serial_number': values.push(assetData.serialNumber || null); break;
          case 'purchase_date': values.push(assetData.purchaseDate || null); break;
          case 'purchase_price': values.push(assetData.purchasePrice || null); break;
          case 'current_value': values.push(currentValue || null); break;
          case '`condition`': values.push(assetData.condition); break;
          case 'status': values.push(assetData.status || 'AVAILABLE'); break;
          case 'location': values.push(assetData.location || null); break;
          case 'assigned_to': 
            console.log(`[createAsset] Setting assigned_to: ${assetData.assignedTo} (type: ${typeof assetData.assignedTo})`);
            values.push(assetData.assignedTo || null); 
            break;
          case 'assignment_date': 
            console.log(`[createAsset] Setting assignment_date: ${assetData.assignmentDate}`);
            values.push(assetData.assignmentDate || null); 
            break;
          case 'warranty_expiry': values.push(assetData.warrantyExpiry || null); break;
          case 'description': values.push(assetData.description || null); break;
          case 'specifications': values.push(assetData.specifications || null); break;
        }
      }
    });

    // Add optional fields if they exist in DB
    optionalFields.forEach(field => {
      if (existingColumns.includes(field.db)) {
        fields.push(field.db);
        values.push(field.data || null);
      }
    });

    const placeholders = fields.map(() => '?').join(', ');
    console.log(`[createAsset] Inserting asset with fields:`, fields);
    console.log(`[createAsset] Values:`, values.map((v, i) => `${fields[i]}=${v}`).join(', '));
    const [result]: any = await connection.query(
      `INSERT INTO hrms_assets (${fields.join(', ')}) VALUES (${placeholders})`,
      values
    );
    console.log(`[createAsset] Asset created with ID: ${result.insertId}`);

    const newAssetId = result.insertId;

    // Log creation in history (best effort - don't fail if table doesn't exist)
    try {
      await connection.query(
        `INSERT INTO hrms_asset_history (asset_id, action_type, action_by, description, new_value)
         VALUES (?, 'CREATED', ?, ?, ?)`,
        [
          newAssetId,
          user.id,
          `Asset ${assetId} created`,
          JSON.stringify({ assetId, name: assetData.name, category: assetData.category })
        ]
      );
    } catch (historyError: any) {
      console.warn('Could not log asset history (table may not exist):', historyError.message);
      // Continue without failing - history is optional
    }

    await connection.commit();
    return newAssetId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Update asset and log changes in history
 */
export async function updateAsset(
  assetId: number,
  assetData: Partial<Asset>,
  user: AuthUser
): Promise<void> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get old values for history
    const [oldRows]: any = await connection.query(
      'SELECT * FROM hrms_assets WHERE id = ?',
      [assetId]
    );

    if (oldRows.length === 0) {
      throw new Error('Asset not found');
    }

    const oldAsset = oldRows[0];

    // Recalculate current value if purchase details changed
    let currentValue = assetData.currentValue;
    const purchasePrice = assetData.purchasePrice ?? oldAsset.purchase_price;
    const purchaseDate = assetData.purchaseDate ?? oldAsset.purchase_date;

    // Validate purchase price range: DECIMAL(10,2) max is 99,999,999.99
    if (purchasePrice !== undefined && purchasePrice !== null) {
      if (purchasePrice < 0) {
        throw new Error('Purchase price cannot be negative.');
      }
      if (purchasePrice > 99999999.99) {
        throw new Error('Purchase price exceeds maximum allowed value (₹99,999,999.99).');
      }
    }

    if (purchasePrice && purchaseDate) {
      currentValue = calculateDepreciation(
        purchasePrice,
        purchaseDate,
        assetData.depreciationMethod || oldAsset.depreciation_method || 'STRAIGHT_LINE',
        assetData.depreciationRate || oldAsset.depreciation_rate || 10,
        assetData.usefulLifeYears || oldAsset.useful_life_years || 5
      );
    }

    // Check which columns exist in the database
    const [columns]: any = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hrms_assets'`
    );
    const existingColumns = columns.map((col: any) => col.COLUMN_NAME);

    // Build update query dynamically - only include columns that exist
    const updates: string[] = [];
    const values: any[] = [];

    const fields: Record<string, any> = {
      name: assetData.name,
      category: assetData.category,
      type: assetData.type,
      brand: assetData.brand,
      model: assetData.model,
      serial_number: assetData.serialNumber,
      purchase_date: assetData.purchaseDate,
      purchase_price: assetData.purchasePrice,
      current_value: currentValue,
      vendor_name: assetData.vendorName,
      invoice_number: assetData.invoiceNumber,
      depreciation_method: assetData.depreciationMethod,
      depreciation_rate: assetData.depreciationRate,
      useful_life_years: assetData.usefulLifeYears,
      condition: assetData.condition,
      status: assetData.status,
      location: assetData.location,
      assigned_to: assetData.assignedTo !== undefined ? assetData.assignedTo : undefined,  // CRITICAL: Explicitly check undefined
      assignment_date: assetData.assignmentDate !== undefined ? assetData.assignmentDate : undefined,  // CRITICAL: Explicitly check undefined
      warranty_expiry: assetData.warrantyExpiry,
      description: assetData.description,
      specifications: assetData.specifications,
    };
    
    // Debug: Log assignment fields BEFORE processing
    console.log(`[updateAsset] ===== ASSIGNMENT DEBUG START =====`);
    console.log(`[updateAsset] assetData.assignedTo: ${assetData.assignedTo} (type: ${typeof assetData.assignedTo})`);
    console.log(`[updateAsset] assetData.assignmentDate: ${assetData.assignmentDate}`);
    console.log(`[updateAsset] Fields object - assigned_to: ${fields.assigned_to} (type: ${typeof fields.assigned_to})`);
    console.log(`[updateAsset] Fields object - assignment_date: ${fields.assignment_date}`);
    console.log(`[updateAsset] Fields object - assigned_to is undefined: ${fields.assigned_to === undefined}`);
    console.log(`[updateAsset] Fields object - assigned_to is null: ${fields.assigned_to === null}`);
    
    // CRITICAL: Always ensure assigned_to and assignment_date are in fields if provided
    // This ensures they're always included in the update query
    if (assetData.assignedTo !== undefined) {
      fields.assigned_to = assetData.assignedTo;
      console.log(`[updateAsset] ✅✅✅ ASSIGNED_TO SET in fields: ${fields.assigned_to} (type: ${typeof fields.assigned_to})`);
    }
    if (assetData.assignmentDate !== undefined) {
      fields.assignment_date = assetData.assignmentDate;
      console.log(`[updateAsset] ✅✅✅ ASSIGNMENT_DATE SET in fields: ${fields.assignment_date}`);
    }
    if (assetData.status !== undefined) {
      fields.status = assetData.status;
      console.log(`[updateAsset] ✅✅✅ STATUS SET in fields: ${fields.status}`);
    }
    console.log(`[updateAsset] ===== ASSIGNMENT DEBUG END =====`);

    // CRITICAL: Process assignment fields FIRST to ensure they're always included
    const assignmentFields: Array<[string, any]> = [];
    const otherFields: Array<[string, any]> = [];
    
    Object.entries(fields).forEach(([key, value]) => {
      const isAssignmentField = (key === 'assigned_to' || key === 'assignment_date');
      if (isAssignmentField) {
        assignmentFields.push([key, value]);
      } else {
        otherFields.push([key, value]);
      }
    });
    
    // Process assignment fields FIRST with special handling
    // CRITICAL: These fields MUST be included if they exist in the database
    assignmentFields.forEach(([key, value]) => {
      if (!existingColumns.includes(key)) {
        console.warn(`[updateAsset] Column '${key}' does not exist in database, skipping`);
        return;
      }
      
      // Include the field even if value is null (to clear assignment)
        const escapedKey = key === 'condition' ? '`condition`' : key;
        updates.push(`${escapedKey} = ?`);
        values.push(value === null ? null : value);
        
        if (key === 'assigned_to') {
          console.log(`[updateAsset] ✅✅✅ INCLUDING assigned_to = ${value} (type: ${typeof value}) for asset ${assetId}`);
        }
        if (key === 'assignment_date') {
        console.log(`[updateAsset] ✅✅✅ INCLUDING assignment_date = ${value} for asset ${assetId}`);
      }
    });
    
    // Process other fields
    otherFields.forEach(([key, value]) => {
      if (value !== undefined && existingColumns.includes(key)) {
        const escapedKey = key === 'condition' ? '`condition`' : key;
        updates.push(`${escapedKey} = ?`);
        values.push(value === null ? null : value);
        
        if (key === 'status' && value === 'ASSIGNED') {
          console.log(`[updateAsset] ✅ INCLUDING status = ASSIGNED for asset ${assetId}`);
        }
      }
    });

    if (updates.length === 0) {
      await connection.commit();
      return;
    }

    values.push(assetId);

    const updateQuery = `UPDATE hrms_assets SET ${updates.join(', ')} WHERE id = ?`;
    console.log(`[updateAsset] Executing update query for asset ${assetId}:`, updateQuery);
    console.log(`[updateAsset] Update values:`, values.slice(0, -1)); // Exclude assetId from log
    console.log(`[updateAsset] Fields being updated:`, Object.keys(fields).filter(k => fields[k] !== undefined));
    
    await connection.query(updateQuery, values);
    
    // CRITICAL: Verify assignment was saved correctly and fix inconsistencies
    const [verifyRows]: any = await connection.query(
      'SELECT assigned_to, assignment_date, status FROM hrms_assets WHERE id = ?',
      [assetId]
    );
    if (verifyRows.length > 0) {
      const saved = verifyRows[0];
      console.log(`[updateAsset] Verified after update:`, saved);
      
      // Check for data inconsistency: status is ASSIGNED but assigned_to is NULL
      if (saved.status === 'ASSIGNED' && (!saved.assigned_to || saved.assigned_to === null)) {
        console.error(`[updateAsset] ❌❌❌ DATA INCONSISTENCY: Status is ASSIGNED but assigned_to is NULL!`);
        console.log(`[updateAsset] 🔧 FIXING: Setting status to AVAILABLE...`);
        
        // Fix inconsistency by setting status to AVAILABLE
        await connection.query(
          'UPDATE hrms_assets SET status = ? WHERE id = ?',
          ['AVAILABLE', assetId]
        );
        console.log(`[updateAsset] ✅ FIXED: Changed status from ASSIGNED to AVAILABLE (no assigned employee)`);
      }
      
      // Verify assignment if it was supposed to be set
      if (assetData.assignedTo !== undefined) {
        console.log(`[updateAsset] Expected: assigned_to=${assetData.assignedTo}, status=${assetData.status}`);
        console.log(`[updateAsset] Actual: assigned_to=${saved.assigned_to}, status=${saved.status}`);
        
        // If assignment wasn't saved correctly, fix it directly
        if (saved.assigned_to !== assetData.assignedTo) {
          console.error(`[updateAsset] ❌❌❌ MISMATCH! Expected assigned_to=${assetData.assignedTo} but got ${saved.assigned_to}`);
          console.log(`[updateAsset] 🔧 FIXING: Directly updating assigned_to in database...`);
          
          // Direct update to fix the issue
          await connection.query(
            'UPDATE hrms_assets SET assigned_to = ?, assignment_date = ?, status = ? WHERE id = ?',
            [
              assetData.assignedTo,
              assetData.assignmentDate || null,
              assetData.status || 'ASSIGNED',
              assetId
            ]
          );
          
          // Verify fix
          const [fixedRows]: any = await connection.query(
            'SELECT assigned_to, assignment_date, status FROM hrms_assets WHERE id = ?',
            [assetId]
          );
          if (fixedRows.length > 0) {
            console.log(`[updateAsset] ✅ FIXED: assigned_to is now ${fixedRows[0].assigned_to}`);
          }
        } else {
          console.log(`[updateAsset] ✅ Assignment saved correctly: assigned_to=${saved.assigned_to}`);
        }
      }
    } else {
      console.error(`[updateAsset] Asset ${assetId} not found after update!`);
    }

    // Log changes in history
    const changes: any = {};
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && oldAsset[key] !== value) {
        changes[key] = { old: oldAsset[key], new: value };
      }
    });

    if (Object.keys(changes).length > 0) {
      try {
        await connection.query(
          `INSERT INTO hrms_asset_history (asset_id, action_type, action_by, old_value, new_value, description)
           VALUES (?, 'UPDATED', ?, ?, ?, ?)`,
          [
            assetId,
            user.id,
            JSON.stringify(oldAsset),
            JSON.stringify(changes),
            'Asset details updated'
          ]
        );
      } catch (historyError: any) {
        console.warn('Could not log asset history (table may not exist):', historyError.message);
        // Continue without failing - history is optional
      }
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get asset by ID with photos
 */
export async function getAssetById(assetId: number, includeInactive: boolean = false): Promise<any> {
  try {
    console.log(`[getAssetById] Starting fetch for asset ID: ${assetId}`);
    
    // Check if assigned_to column exists, if not use NULL
    // IMPORTANT: Always include assigned_to to show employee ID even if JOIN fails
    // CRITICAL: Use proper JOIN to get employee names
    // Removed is_active check from JOIN to ensure we get employee data
    let query = `SELECT a.*, 
       COALESCE(e.first_name, NULL) as first_name, 
       COALESCE(e.last_name, NULL) as last_name, 
       COALESCE(e.employee_id, NULL) as emp_id,
       COALESCE(e.id, a.assigned_to) as assigned_employee_id
       FROM hrms_assets a
       LEFT JOIN hrms_employees e ON a.assigned_to = e.id
       WHERE a.id = ?`;
    
    // Only filter by is_active if includeInactive is false and column exists
    if (!includeInactive) {
      // Try to add is_active filter, but handle gracefully if column doesn't exist
      try {
        const [columnCheck]: any = await pool.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.columns 
          WHERE table_schema = DATABASE() 
          AND table_name = 'hrms_assets' 
          AND column_name = 'is_active'
        `);
        
        if (columnCheck && columnCheck.length > 0 && columnCheck[0].count > 0) {
          query += ' AND (a.is_active = 1 OR a.is_active IS NULL)';
        }
      } catch (checkError: any) {
        // Column might not exist, continue without filter
        console.log('[getAssetById] is_active column check failed, proceeding without filter:', checkError.message);
      }
    }
    
    console.log(`[getAssetById] Executing query: ${query} with params: [${assetId}]`);
    const [rows]: any = await pool.query(query, [assetId]);
    console.log(`[getAssetById] Query returned ${rows.length} row(s)`);

    if (rows.length === 0) {
      console.log(`[getAssetById] Asset with ID ${assetId} not found`);
      return null;
    }

    const asset = rows[0];
    console.log(`[getAssetById] Asset found: ID=${asset.id}, Name=${asset.name}, Status=${asset.status}, AssignedTo=${asset.assigned_to}`);

    // CRITICAL: Fix data inconsistency - if status is ASSIGNED but assigned_to is NULL, fix it IMMEDIATELY
    if (asset.status === 'ASSIGNED' && (!asset.assigned_to || asset.assigned_to === null || asset.assigned_to === 0)) {
      console.warn(`[getAssetById] Asset ${asset.id} has inconsistent state (ASSIGNED but no assigned_to). Fixing immediately...`);
      try {
        const connection = await pool.getConnection();
        try {
          await connection.beginTransaction();
          await connection.query(
            'UPDATE hrms_assets SET status = ?, assigned_to = NULL, assignment_date = NULL WHERE id = ?',
          ['AVAILABLE', assetId]
        );
          await connection.commit();
          
          // Update the asset object to reflect the fix
        asset.status = 'AVAILABLE';
          asset.assigned_to = null;
          asset.assignment_date = null;
          asset.first_name = null;
          asset.last_name = null;
          asset.emp_id = null;
          
          console.log(`[getAssetById] ✅ Successfully fixed asset ${assetId}: Changed status from ASSIGNED to AVAILABLE (no assigned employee)`);
        } catch (transactionError: any) {
          await connection.rollback();
          throw transactionError;
        } finally {
          connection.release();
        }
      } catch (fixError: any) {
        console.error(`[getAssetById] ❌ Error fixing asset ${assetId}:`, fixError.message);
        // Still update the object to prevent showing inconsistent data
        asset.status = 'AVAILABLE';
        asset.assigned_to = null;
      }
    }

    // Get photos - handle case where asset_photos table might not exist
    let photos: any[] = [];
    try {
      console.log(`[getAssetById] Fetching photos for asset ${assetId}`);
      const [photoRows]: any = await pool.query(
        'SELECT * FROM hrms_asset_photos WHERE asset_id = ? ORDER BY is_primary DESC, uploaded_at DESC',
        [assetId]
      );
      photos = photoRows || [];
      console.log(`[getAssetById] Found ${photos.length} photos for asset ${assetId}`);
    } catch (photoError: any) {
      console.warn(`[getAssetById] Could not fetch photos (table might not exist):`, photoError.message);
      photos = [];
    }

    asset.photos = photos;
    
    console.log(`[getAssetById] Asset ${assetId} loaded successfully with ${photos.length} photos`);

    return asset;
  } catch (error: any) {
    console.error(`[getAssetById] Error fetching asset ${assetId}:`, error);
    console.error(`[getAssetById] Error message:`, error.message);
    console.error(`[getAssetById] Error stack:`, error.stack);
    throw error;
  }
}

/**
 * Get asset history
 */
export async function getAssetHistory(assetId: number): Promise<AssetHistory[]> {
  try {
    const [rows]: any = await pool.query(
      `SELECT h.*, u.username, u.full_name
       FROM hrms_asset_history h
       LEFT JOIN hrms_users u ON h.action_by = u.id
       WHERE h.asset_id = ?
       ORDER BY h.action_date DESC`,
      [assetId]
    );

    return rows.map((row: any) => ({
      id: row.id,
      assetId: row.asset_id,
      actionType: row.action_type,
      actionBy: row.action_by,
      actionDate: row.action_date,
      oldValue: row.old_value ? JSON.parse(row.old_value) : null,
      newValue: row.new_value ? JSON.parse(row.new_value) : null,
      description: row.description,
      remarks: row.remarks,
      actionByUser: row.username || row.full_name,
    }));
  } catch (error: any) {
    // If table doesn't exist, return empty array
    if (error.message && error.message.includes("doesn't exist")) {
      console.warn('Asset history table does not exist. Please run the migration script.');
      return [];
    }
    throw error;
  }
}

/**
 * Ensure asset_photos table exists
 */
async function ensureAssetPhotosTable(): Promise<void> {
  try {
    // Check if table exists
    const [tables]: any = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'hrms_asset_photos'
    `);

    if (tables && tables.length > 0 && tables[0].count === 0) {
      console.log('Creating hrms_asset_photos table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS hrms_asset_photos (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          asset_id INT NOT NULL,
          photo_path VARCHAR(500) NOT NULL,
          photo_name VARCHAR(255) NOT NULL,
          photo_size INT DEFAULT NULL,
          photo_type VARCHAR(50) DEFAULT NULL,
          is_primary TINYINT(1) DEFAULT 0,
          uploaded_by INT DEFAULT NULL,
          uploaded_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
          KEY asset_id (asset_id),
          KEY is_primary (is_primary)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
      `);
      console.log('✓ hrms_asset_photos table created');
    }
  } catch (error: any) {
    console.warn('Could not ensure asset_photos table exists:', error.message);
    // Don't throw - let the INSERT attempt happen and fail gracefully if needed
  }
}

/**
 * Add asset photo
 */
export async function addAssetPhoto(
  assetId: number,
  photoData: Partial<AssetPhoto>,
  userId: number
): Promise<number> {
  // Ensure table exists before inserting
  await ensureAssetPhotosTable();

  try {
    const [result]: any = await pool.query(
      `INSERT INTO hrms_asset_photos (asset_id, photo_path, photo_name, photo_size, photo_type, is_primary, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        assetId,
        photoData.photoPath,
        photoData.photoName,
        photoData.photoSize || null,
        photoData.photoType || null,
        photoData.isPrimary ? 1 : 0,
        userId,
      ]
    );

    // If this is primary, unset others
    if (photoData.isPrimary) {
      await pool.query(
        'UPDATE hrms_asset_photos SET is_primary = 0 WHERE asset_id = ? AND id != ?',
        [assetId, result.insertId]
      );
    }

    return result.insertId;
  } catch (error: any) {
    // If table still doesn't exist, try creating it one more time
    if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes("doesn't exist")) {
      console.log('Table missing, attempting to create asset_photos table...');
      await ensureAssetPhotosTable();
      // Retry the insert
      const [result]: any = await pool.query(
        `INSERT INTO hrms_asset_photos (asset_id, photo_path, photo_name, photo_size, photo_type, is_primary, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          assetId,
          photoData.photoPath,
          photoData.photoName,
          photoData.photoSize || null,
          photoData.photoType || null,
          photoData.isPrimary ? 1 : 0,
          userId,
        ]
      );

      if (photoData.isPrimary) {
        await pool.query(
          'UPDATE hrms_asset_photos SET is_primary = 0 WHERE asset_id = ? AND id != ?',
          [assetId, result.insertId]
        );
      }

      return result.insertId;
    }
    throw error;
  }
}

/**
 * Log asset history
 */
export async function logAssetHistory(
  assetId: number,
  actionType: AssetHistory['actionType'],
  user: AuthUser,
  description?: string,
  oldValue?: any,
  newValue?: any,
  remarks?: string
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO hrms_asset_history (asset_id, action_type, action_by, description, old_value, new_value, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        assetId,
        actionType,
        user.id,
        description || null,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        remarks || null,
      ]
    );
  } catch (error: any) {
    // If table doesn't exist, log warning but don't fail
    if (error.message && error.message.includes("doesn't exist")) {
      console.warn('Asset history table does not exist. Please run the migration script.');
      return;
    }
    // For other errors, log but don't throw (history is optional)
    console.warn('Could not log asset history:', error.message);
  }
}

