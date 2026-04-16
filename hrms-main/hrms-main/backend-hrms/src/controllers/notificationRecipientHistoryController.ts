
import { Request, Response } from 'express';
import pool from '../db';

export const getAllNotificationRecipientsHistory = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM notification_recipients_history');
    res.json({ success: true, message: "Notification Recipients History fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching notification recipients history:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getNotificationRecipientHistoryById = async (req: Request, res: Response) => {
  const { history_id, recipient_email } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM notification_recipients_history WHERE history_id = ? AND recipient_email = ?', [history_id, recipient_email]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification Recipient History not found' });
    }
    res.json({ success: true, message: "Notification Recipient History fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching notification recipient history by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createNotificationRecipientHistory = async (req: Request, res: Response) => {
  const { history_id, recipient_email } = req.body;
  if (!history_id || !recipient_email) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO notification_recipients_history (history_id, recipient_email) VALUES (?, ?)', [history_id, recipient_email]);
    res.status(201).json({ success: true, message: 'Notification Recipient History created successfully' });
  } catch (error) {
    console.error('Error creating notification recipient history:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteNotificationRecipientHistory = async (req: Request, res: Response) => {
  const { history_id, recipient_email } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM notification_recipients_history WHERE history_id = ? AND recipient_email = ?', [history_id, recipient_email]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification Recipient History not found' });
    }
    res.json({ success: true, message: 'Notification Recipient History deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification recipient history:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
