
import { Request, Response } from 'express';
import pool from '../db';
import { convertRowsToCamelCase, convertRowToCamelCase, formatDateForDisplay } from '../utils/dataConversion';

// Get Bell Notifications (IN_APP channel only, used for the header bell icon)
export const getBellNotifications = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT * FROM hrms_notification_history 
       WHERE channel = 'IN_APP' OR channel = 'IN_APP'
       ORDER BY sent_date DESC, sent_time DESC 
       LIMIT 50`
    );
    const camelCaseRows = convertRowsToCamelCase(rows);
    camelCaseRows.forEach((row: any) => {
      row.sentDate = formatDateForDisplay(row.sentDate);
      row.isRead = row.isRead === 1;
    });
    res.json({ success: true, data: camelCaseRows });
  } catch (error) {
    console.error('Error fetching bell notifications:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Mark a bell notification as read
export const markBellNotificationRead = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE hrms_notification_history SET is_read = 1 WHERE id = ?', [id]);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Mark all bell notifications as read
export const markAllBellNotificationsRead = async (req: Request, res: Response) => {
  try {
    await pool.query("UPDATE hrms_notification_history SET is_read = 1 WHERE channel = 'IN_APP'");
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getAllNotificationHistory = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_notification_history ORDER BY sent_date DESC, sent_time DESC');

    const historyWithRecipients = await Promise.all(rows.map(async (item: any) => {
      const [recipientRows]: any = await pool.query(
        'SELECT recipient_address FROM hrms_notification_recipient_history WHERE history_id = ?',
        [item.id]
      );
      return {
        ...item,
        recipients: recipientRows.map((r: any) => r.recipient_address)
      };
    }));

    const camelCaseRows = convertRowsToCamelCase(historyWithRecipients);
    camelCaseRows.forEach((row: any) => {
      row.sentDate = formatDateForDisplay(row.sentDate);
    });

    res.json({ success: true, message: "Notification History fetched successfully", data: camelCaseRows });
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getNotificationHistoryById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_notification_history WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification History not found' });
    }

    const [recipientRows]: any = await pool.query(
      'SELECT recipient_address FROM hrms_notification_recipient_history WHERE history_id = ?',
      [id]
    );

    const historyData = {
      ...rows[0],
      recipients: recipientRows.map((r: any) => r.recipient_address)
    };

    const camelCaseRow = convertRowToCamelCase(historyData);
    camelCaseRow.sentDate = formatDateForDisplay(camelCaseRow.sentDate);

    res.json({ success: true, message: "Notification History fetched successfully", data: camelCaseRow });
  } catch (error) {
    console.error('Error fetching notification history by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createNotificationHistory = async (req: Request, res: Response) => {
  const { templateId, templateName, sentDate, sentTime, channel, status, subject, content, errorMessage, recipients } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result]: any = await connection.query(
      'INSERT INTO hrms_notification_history (template_id, template_name, sent_date, sent_time, channel, status, subject, content, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [templateId, templateName, sentDate, sentTime, channel, status, subject, content, errorMessage]
    );

    const historyId = result.insertId;

    if (recipients && Array.isArray(recipients)) {
      for (const recipient of recipients) {
        await connection.query(
          'INSERT INTO hrms_notification_recipient_history (history_id, recipient_address) VALUES (?, ?)',
          [historyId, recipient]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ success: true, message: 'Notification History created successfully', id: historyId });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating notification history:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

export const updateNotificationHistory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { templateId, templateName, sentDate, sentTime, channel, status, subject, content, errorMessage, recipients } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result]: any = await connection.query(
      'UPDATE hrms_notification_history SET template_id = ?, template_name = ?, sent_date = ?, sent_time = ?, channel = ?, status = ?, subject = ?, content = ?, error_message = ? WHERE id = ?',
      [templateId, templateName, sentDate, sentTime, channel, status, subject, content, errorMessage, id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Notification History not found' });
    }

    await connection.query('DELETE FROM hrms_notification_recipient_history WHERE history_id = ?', [id]);
    if (recipients && Array.isArray(recipients)) {
      for (const recipient of recipients) {
        await connection.query(
          'INSERT INTO hrms_notification_recipient_history (history_id, recipient_address) VALUES (?, ?)',
          [id, recipient]
        );
      }
    }

    await connection.commit();
    res.json({ success: true, message: 'Notification History updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating notification history:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

export const deleteNotificationHistory = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_notification_history WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification History not found' });
    }
    res.json({ success: true, message: 'Notification History deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification history:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
