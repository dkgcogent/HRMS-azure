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

// Utility function to generate the next Project Code (e.g., PROJ001, PROJ002, etc.)
const generateProjectCode = async (): Promise<string> => {
    try {
        const [rows]: any = await db.query(`
            SELECT code
            FROM hrms_projects
            WHERE code LIKE 'PROJ%'
            ORDER BY CAST(SUBSTRING(code, 5) AS UNSIGNED) DESC
            LIMIT 1
        `);

        let nextNumber = 1;
        if (rows.length > 0 && rows[0].code) {
            const currentNumber = parseInt(rows[0].code.substring(4), 10);
            nextNumber = currentNumber + 1;
        }

        return `PROJ${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating project code:', error);
        throw error;
    }
};

// Get all projects
export const getAllProjects = async (req: Request, res: Response) => {
    try {
        const [rows] = await db.query<RowDataPacket[]>(
            'SELECT * FROM hrms_projects ORDER BY name'
        );
        const camelCaseRows = convertRowsToCamelCase(rows);
        res.json({ success: true, message: 'Projects retrieved successfully', data: camelCaseRows });
    } catch (error: any) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch projects', error: error.message });
    }
};

// Get project by ID
export const getProjectById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query<RowDataPacket[]>(
            'SELECT * FROM hrms_projects WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const camelCaseRow = convertRowToCamelCase(rows[0]);
        res.json({ success: true, message: 'Project retrieved successfully', data: camelCaseRow });
    } catch (error: any) {
        console.error('Error fetching project:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch project', error: error.message });
    }
};

// Create project
export const createProject = async (req: Request, res: Response) => {
    try {
        const { name, code, description, isActive } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Project name is required' });
        }

        // Handle isActive default
        const is_active = isActive === undefined ? 1 : (isActive ? 1 : 0);

        // Auto-generate code if not provided
        let finalCode = code;
        if (!finalCode) {
            finalCode = await generateProjectCode();
        }

        const [result] = await db.query<ResultSetHeader>(
            'INSERT INTO hrms_projects (name, code, description, is_active) VALUES (?, ?, ?, ?)',
            [name, finalCode, description || null, is_active]
        );

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: { id: result.insertId, name, code: finalCode, description, isActive: is_active === 1 }
        });
    } catch (error: any) {
        console.error('Error creating project:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Project name or code already exists' });
        }
        res.status(500).json({ success: false, message: 'Failed to create project', error: error.message });
    }
};

// Update project
export const updateProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, code, description, isActive } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Project name is required' });
        }

        const is_active = isActive === undefined ? 1 : (isActive ? 1 : 0);

        const [result] = await db.query<ResultSetHeader>(
            'UPDATE hrms_projects SET name = ?, code = ?, description = ?, is_active = ? WHERE id = ?',
            [name, code || null, description || null, is_active, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        res.json({ success: true, message: 'Project updated successfully', data: { id, name, code, description, isActive: is_active === 1 } });
    } catch (error: any) {
        console.error('Error updating project:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Project name or code already exists' });
        }
        res.status(500).json({ success: false, message: 'Failed to update project', error: error.message });
    }
};

// Delete project
export const deleteProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const [result] = await db.query<ResultSetHeader>(
            'DELETE FROM hrms_projects WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting project:', error);
        res.status(500).json({ success: false, message: 'Failed to delete project', error: error.message });
    }
};
