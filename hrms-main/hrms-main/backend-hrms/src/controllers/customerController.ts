import { Request, Response } from 'express';
import db from '../db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

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

// Utility function to generate the next Customer Code (e.g., CUST001, CUST002, etc.)
const generateCustomerCode = async (): Promise<string> => {
    try {
        const [rows]: any = await db.query(`
            SELECT code
            FROM hrms_customers
            WHERE code LIKE 'CUST%'
            ORDER BY CAST(SUBSTRING(code, 5) AS UNSIGNED) DESC
            LIMIT 1
        `);

        let nextNumber = 1;
        if (rows.length > 0 && rows[0].code) {
            const currentNumber = parseInt(rows[0].code.substring(4), 10);
            nextNumber = currentNumber + 1;
        }

        return `CUST${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating customer code:', error);
        throw error;
    }
};

// Get all customers
export const getAllCustomers = async (req: Request, res: Response) => {
    try {
        const [rows] = await db.query<RowDataPacket[]>(
            'SELECT * FROM hrms_customers ORDER BY name'
        );
        const camelCaseRows = convertRowsToCamelCase(rows);
        res.json({ success: true, message: 'Customers retrieved successfully', data: camelCaseRows });
    } catch (error: any) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch customers', error: error.message });
    }
};

// Get customer by ID
export const getCustomerById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query<RowDataPacket[]>(
            'SELECT * FROM hrms_customers WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        const camelCaseRow = convertRowToCamelCase(rows[0]);
        res.json({ success: true, message: 'Customer retrieved successfully', data: camelCaseRow });
    } catch (error: any) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch customer', error: error.message });
    }
};

// Create customer
export const createCustomer = async (req: Request, res: Response) => {
    try {
        const { name, code, description, isActive } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Customer name is required' });
        }

        // Handle isActive default
        const is_active = isActive === undefined ? 1 : (isActive ? 1 : 0);

        // Auto-generate code if not provided
        let finalCode = code;
        if (!finalCode) {
            finalCode = await generateCustomerCode();
        }

        const [result] = await db.query<ResultSetHeader>(
            'INSERT INTO hrms_customers (name, code, description, is_active) VALUES (?, ?, ?, ?)',
            [name, finalCode, description || null, is_active]
        );

        res.status(201).json({
            success: true,
            message: 'Customer created successfully',
            data: { id: result.insertId, name, code: finalCode, description, isActive: is_active === 1 }
        });
    } catch (error: any) {
        console.error('Error creating customer:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Customer name or code already exists' });
        }
        res.status(500).json({ success: false, message: 'Failed to create customer', error: error.message });
    }
};

// Update customer
export const updateCustomer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, code, description, isActive } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Customer name is required' });
        }

        const is_active = isActive === undefined ? 1 : (isActive ? 1 : 0);

        const [result] = await db.query<ResultSetHeader>(
            'UPDATE hrms_customers SET name = ?, code = ?, description = ?, is_active = ? WHERE id = ?',
            [name, code || null, description || null, is_active, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        res.json({ success: true, message: 'Customer updated successfully', data: { id, name, code, description, isActive: is_active === 1 } });
    } catch (error: any) {
        console.error('Error updating customer:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Customer name or code already exists' });
        }
        res.status(500).json({ success: false, message: 'Failed to update customer', error: error.message });
    }
};

// Delete customer
export const deleteCustomer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const [result] = await db.query<ResultSetHeader>(
            'DELETE FROM hrms_customers WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        res.json({ success: true, message: 'Customer deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ success: false, message: 'Failed to delete customer', error: error.message });
    }
};
