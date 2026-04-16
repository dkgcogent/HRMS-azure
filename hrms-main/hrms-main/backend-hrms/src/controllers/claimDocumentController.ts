
import { Request, Response } from 'express';
import pool from '../db';

export const getAllClaimDocuments = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_claim_documents');
    res.json({ success: true, message: "Claim Documents fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching claim documents:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getClaimDocumentById = async (req: Request, res: Response) => {
  const { claim_id, document_path } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_claim_documents WHERE claim_id = ? AND document_path = ?', [claim_id, document_path]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Claim Document not found' });
    }
    res.json({ success: true, message: "Claim Document fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching claim document by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createClaimDocument = async (req: Request, res: Response) => {
  const { claim_id, document_path } = req.body;
  if (!claim_id || !document_path) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_claim_documents (claim_id, document_path) VALUES (?, ?)', [claim_id, document_path]);
    res.status(201).json({ success: true, message: 'Claim Document created successfully' });
  } catch (error) {
    console.error('Error creating claim document:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateClaimDocument = async (req: Request, res: Response) => {
  const { claim_id, document_path } = req.params;
  const { new_document_path } = req.body; // Assuming you might want to change the document_path
  if (!claim_id || !document_path || !new_document_path) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('UPDATE hrms_claim_documents SET document_path = ? WHERE claim_id = ? AND document_path = ?', [new_document_path, claim_id, document_path]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Claim Document not found' });
    }
    res.json({ success: true, message: 'Claim Document updated successfully' });
  } catch (error) {
    console.error('Error updating claim document:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteClaimDocument = async (req: Request, res: Response) => {
  const { claim_id, document_path } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_claim_documents WHERE claim_id = ? AND document_path = ?', [claim_id, document_path]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Claim Document not found' });
    }
    res.json({ success: true, message: 'Claim Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting claim document:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
