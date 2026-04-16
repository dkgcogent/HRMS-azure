
import { Request, Response } from 'express';
import pool from '../db';

export const getAllNotificationSettingsChannels = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_notification_settings_channels');
    res.json({ success: true, message: "Notification Settings Channels fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching notification settings channels:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getNotificationSettingsChannelById = async (req: Request, res: Response) => {
  const { setting_id, setting_type, channel } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_notification_settings_channels WHERE setting_id = ? AND setting_type = ? AND channel = ?', [setting_id, setting_type, channel]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification Settings Channel not found' });
    }
    res.json({ success: true, message: "Notification Settings Channel fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching notification settings channel by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createNotificationSettingsChannel = async (req: Request, res: Response) => {
  const { setting_id, setting_type, channel } = req.body;
  if (!setting_id || !setting_type || !channel) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_notification_settings_channels (setting_id, setting_type, channel) VALUES (?, ?, ?)', [setting_id, setting_type, channel]);
    res.status(201).json({ success: true, message: 'Notification Settings Channel created successfully' });
  } catch (error) {
    console.error('Error creating notification settings channel:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteNotificationSettingsChannel = async (req: Request, res: Response) => {
  const { setting_id, setting_type, channel } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_notification_settings_channels WHERE setting_id = ? AND setting_type = ? AND channel = ?', [setting_id, setting_type, channel]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification Settings Channel not found' });
    }
    res.json({ success: true, message: 'Notification Settings Channel deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification settings channel:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
