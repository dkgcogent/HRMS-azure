
import { Request, Response } from 'express';
import pool from '../db';

export const getAllTemplateChannels = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hrms_template_channels');
    res.json({ success: true, message: "Template Channels fetched successfully", data: rows });
  } catch (error) {
    console.error('Error fetching template channels:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getTemplateChannelById = async (req: Request, res: Response) => {
  const { template_id, channel } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_template_channels WHERE template_id = ? AND channel = ?', [template_id, channel]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Template Channel not found' });
    }
    res.json({ success: true, message: "Template Channel fetched successfully", data: rows[0] });
  } catch (error) {
    console.error('Error fetching template channel by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createTemplateChannel = async (req: Request, res: Response) => {
  const { template_id, channel } = req.body;
  if (!template_id || !channel) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('INSERT INTO hrms_template_channels (template_id, channel) VALUES (?, ?)', [template_id, channel]);
    res.status(201).json({ success: true, message: 'Template Channel created successfully' });
  } catch (error) {
    console.error('Error creating template channel:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateTemplateChannel = async (req: Request, res: Response) => {
  const { template_id, channel } = req.params;
  const { new_channel } = req.body; // Assuming you might want to change the channel
  if (!template_id || !channel || !new_channel) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }
  try {
    const [result]: any = await pool.query('UPDATE hrms_template_channels SET channel = ? WHERE template_id = ? AND channel = ?', [new_channel, template_id, channel]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Template Channel not found' });
    }
    res.json({ success: true, message: 'Template Channel updated successfully' });
  } catch (error) {
    console.error('Error updating template channel:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteTemplateChannel = async (req: Request, res: Response) => {
  const { template_id, channel } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_template_channels WHERE template_id = ? AND channel = ?', [template_id, channel]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Template Channel not found' });
    }
    res.json({ success: true, message: 'Template Channel deleted successfully' });
  } catch (error) {
    console.error('Error deleting template channel:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
