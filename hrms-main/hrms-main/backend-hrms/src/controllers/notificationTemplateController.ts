
import { Request, Response } from 'express';
import pool from '../db';
import { convertRowsToCamelCase, convertRowToCamelCase } from '../utils/dataConversion';

export const getAllNotificationTemplates = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_notification_templates');

    // For each template, fetch its channels and variables
    const templatesWithDetails = await Promise.all(rows.map(async (template: any) => {
      const [channelRows]: any = await pool.query(
        'SELECT channel FROM hrms_template_channels WHERE template_id = ?',
        [template.id]
      );
      const [variableRows]: any = await pool.query(
        'SELECT variable_name FROM hrms_template_variables WHERE template_id = ?',
        [template.id]
      );
      return {
        ...template,
        channels: channelRows.map((c: any) => c.channel),
        variables: variableRows.map((v: any) => v.variable_name)
      };
    }));

    // Group schedule fields into a schedule object for frontend
    const formattedTemplates = templatesWithDetails.map((t: any) => {
      const { schedule_frequency, schedule_time, schedule_days_before, ...rest } = t;
      return {
        ...rest,
        schedule: {
          frequency: schedule_frequency,
          time: schedule_time,
          daysBefore: schedule_days_before
        }
      };
    });

    res.json({
      success: true,
      message: "Notification Templates fetched successfully",
      data: convertRowsToCamelCase(formattedTemplates)
    });
  } catch (error) {
    console.error('Error fetching notification templates:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getNotificationTemplateById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_notification_templates WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification Template not found' });
    }

    const [channelRows]: any = await pool.query(
      'SELECT channel FROM hrms_template_channels WHERE template_id = ?',
      [id]
    );
    const [variableRows]: any = await pool.query(
      'SELECT variable_name FROM hrms_template_variables WHERE template_id = ?',
      [id]
    );

    const templateData = {
      ...rows[0],
      channels: channelRows.map((c: any) => c.channel),
      variables: variableRows.map((v: any) => v.variable_name)
    };

    // Format for frontend
    const { schedule_frequency, schedule_time, schedule_days_before, ...rest } = templateData;
    const formattedData = {
      ...rest,
      schedule: {
        frequency: schedule_frequency,
        time: schedule_time,
        daysBefore: schedule_days_before
      }
    };

    res.json({
      success: true,
      message: "Notification Template fetched successfully",
      data: convertRowToCamelCase(formattedData)
    });
  } catch (error) {
    console.error('Error fetching notification template by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createNotificationTemplate = async (req: Request, res: Response) => {
  const {
    name, type, subject, content, recipients, isActive, schedule, channels, variables
  } = req.body;

  if (!name || !type || !subject || !content || !recipients) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result]: any = await connection.query(
      `INSERT INTO hrms_notification_templates (
        name, type, subject, content, recipients, is_active, 
        schedule_frequency, schedule_time, schedule_days_before
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, type, subject, content, recipients, isActive ? 1 : 0,
        schedule?.frequency, schedule?.time, schedule?.daysBefore
      ]
    );

    const templateId = result.insertId;

    if (channels && Array.isArray(channels)) {
      for (const channel of channels) {
        await connection.query(
          'INSERT INTO hrms_template_channels (template_id, channel) VALUES (?, ?)',
          [templateId, channel]
        );
      }
    }

    if (variables && Array.isArray(variables)) {
      for (const variable of variables) {
        await connection.query(
          'INSERT INTO hrms_template_variables (template_id, variable_name) VALUES (?, ?)',
          [templateId, variable]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ success: true, message: 'Notification Template created successfully', id: templateId });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating notification template:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

export const updateNotificationTemplate = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name, type, subject, content, recipients, isActive, schedule, channels, variables
  } = req.body;

  if (!name || !type || !subject || !content || !recipients) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result]: any = await connection.query(
      `UPDATE hrms_notification_templates SET 
        name = ?, type = ?, subject = ?, content = ?, recipients = ?, is_active = ?, 
        schedule_frequency = ?, schedule_time = ?, schedule_days_before = ? 
      WHERE id = ?`,
      [
        name, type, subject, content, recipients, isActive ? 1 : 0,
        schedule?.frequency, schedule?.time, schedule?.daysBefore, id
      ]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Notification Template not found' });
    }

    // Update channels
    await connection.query('DELETE FROM hrms_template_channels WHERE template_id = ?', [id]);
    if (channels && Array.isArray(channels)) {
      for (const channel of channels) {
        await connection.query(
          'INSERT INTO hrms_template_channels (template_id, channel) VALUES (?, ?)',
          [id, channel]
        );
      }
    }

    // Update variables
    await connection.query('DELETE FROM hrms_template_variables WHERE template_id = ?', [id]);
    if (variables && Array.isArray(variables)) {
      for (const variable of variables) {
        await connection.query(
          'INSERT INTO hrms_template_variables (template_id, variable_name) VALUES (?, ?)',
          [id, variable]
        );
      }
    }

    await connection.commit();
    res.json({ success: true, message: 'Notification Template updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating notification template:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

export const sendNotificationTemplate = async (req: Request, res: Response) => {
  const { id } = req.params;

  const connection = await pool.getConnection();
  try {
    // Fetch template details
    const [templateRows]: any = await connection.query(
      'SELECT * FROM hrms_notification_templates WHERE id = ?',
      [id]
    );
    if (templateRows.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Notification Template not found' });
    }

    const template = templateRows[0];

    // Fetch channels for this template
    const [channelRows]: any = await connection.query(
      'SELECT channel FROM hrms_template_channels WHERE template_id = ?',
      [id]
    );
    const channels = channelRows.map((c: any) => c.channel);

    if (channels.length === 0) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Template has no channels configured. Please edit the template and add at least one channel.' });
    }

    await connection.beginTransaction();

    // Insert one notification_history record per channel
    for (const channel of channels) {
      await connection.query(
        `INSERT INTO hrms_notification_history 
        (template_id, template_name, sent_date, sent_time, channel, status, subject, content, is_read) 
        VALUES (?, ?, CURDATE(), CURTIME(), ?, 'SENT', ?, ?, 0)`,
        [id, template.name, channel, template.subject, template.content]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: `Notification template "${template.name}" sent successfully via ${channels.join(', ')}!`,
      channelsSent: channels
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error sending notification template:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

export const deleteNotificationTemplate = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_notification_templates WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification Template not found' });
    }
    res.json({ success: true, message: 'Notification Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification template:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
