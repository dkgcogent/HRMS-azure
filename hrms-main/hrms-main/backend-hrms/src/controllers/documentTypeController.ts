
import { Request, Response } from 'express';
import pool from '../db';

// Utility function to convert snake_case to camelCase
const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

// Utility function to convert database row (snake_case) to camelCase object
const convertRowToCamelCase = (row: any): any => {
  if (!row) return row;
  const camelCaseRow: any = {};
  for (const key in row) {
    if (row.hasOwnProperty(key)) {
      const camelKey = toCamelCase(key);
      // Convert MySQL boolean (1/0) to JavaScript boolean for isActive field
      if (camelKey === 'isActive') {
        camelCaseRow[camelKey] = row[key] === 1;
      } else {
        camelCaseRow[camelKey] = row[key];
      }
    }
  }
  return camelCaseRow;
};

// Utility function to convert array of rows to camelCase
const convertRowsToCamelCase = (rows: any[]): any[] => {
  return rows.map(row => convertRowToCamelCase(row));
};

export const getAllDocumentTypes = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_document_types');
    const camelCaseRows = convertRowsToCamelCase(rows);
    res.json({ success: true, message: "Document Types fetched successfully", data: camelCaseRows });
  } catch (error) {
    console.error('Error fetching document types:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getDocumentTypeById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_document_types WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document Type not found' });
    }
    const camelCaseRow = convertRowToCamelCase(rows[0]);
    res.json({ success: true, message: "Document Type fetched successfully", data: camelCaseRow });
  } catch (error) {
    console.error('Error fetching document type by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createDocumentType = async (req: Request, res: Response) => {
  const { name, code, description, isMandatory, allowedExtensions, maxFileSizeMb, isActive } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_document_types (name, code, description, is_mandatory, allowed_extensions, max_file_size_mb, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, code, description, isMandatory, allowedExtensions, maxFileSizeMb, isActive === undefined ? true : isActive]);
    const newDocumentType = { id: result.insertId, name, code, description, isMandatory, allowedExtensions, maxFileSizeMb, isActive: isActive === undefined ? true : isActive };
    res.status(201).json({ success: true, message: 'Document Type created successfully', data: newDocumentType });
  } catch (error) {
    console.error('Error creating document type:', error);
    res.status(500).json({ success: false, message: 'Failed to create document type' });
  }
};

export const updateDocumentType = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, code, description, isMandatory, allowedExtensions, maxFileSizeMb, isActive } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  try {
    const [result]: any = await pool.query('UPDATE hrms_document_types SET name = ?, code = ?, description = ?, is_mandatory = ?, allowed_extensions = ?, max_file_size_mb = ?, is_active = ? WHERE id = ?', [name, code, description, isMandatory, allowedExtensions, maxFileSizeMb, isActive, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Document Type not found' });
    }
    const updatedDocumentType = { id: parseInt(id, 10), name, code, description, isMandatory, allowedExtensions, maxFileSizeMb, isActive };
    res.json({ success: true, message: 'Document Type updated successfully', data: updatedDocumentType });
  } catch (error) {
    console.error('Error updating document type:', error);
    res.status(500).json({ success: false, message: 'Failed to update document type' });
  }
};

export const deleteDocumentType = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_document_types WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Document Type not found' });
    }
    res.json({ success: true, message: 'Document Type deleted successfully' });
  } catch (error) {
    console.error('Error deleting document type:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
