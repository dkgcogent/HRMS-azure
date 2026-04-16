
import { Request, Response } from 'express';
import pool from '../db';
import { convertRowsToCamelCase, convertRowToCamelCase } from '../utils/dataConversion';

export const getAllNotificationSettings = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_notification_settings');

    const formattedRows = await Promise.all(rows.map(async (row: any) => {
      // Fetch channels for each category
      const [birthdayChannels]: any = await pool.query('SELECT channel FROM hrms_notification_settings_channels WHERE setting_id = ? AND setting_type = "BIRTHDAY"', [row.id]);
      const [anniversaryChannels]: any = await pool.query('SELECT channel FROM hrms_notification_settings_channels WHERE setting_id = ? AND setting_type = "ANNIVERSARY"', [row.id]);
      const [leaveChannels]: any = await pool.query('SELECT channel FROM hrms_notification_settings_channels WHERE setting_id = ? AND setting_type = "LEAVE"', [row.id]);
      const [policyChannels]: any = await pool.query('SELECT channel FROM hrms_notification_settings_channels WHERE setting_id = ? AND setting_type = "POLICY"', [row.id]);

      return {
        id: row.id,
        birthdayReminders: {
          enabled: row.birthday_enabled === 1,
          daysBefore: row.birthday_days_before,
          notifyManagers: row.birthday_notify_managers === 1,
          notifyHR: row.birthday_notify_hr === 1,
          channels: birthdayChannels.map((c: any) => c.channel),
        },
        anniversaryReminders: {
          enabled: row.anniversary_enabled === 1,
          daysBefore: row.anniversary_days_before,
          notifyManagers: row.anniversary_notify_managers === 1,
          channels: anniversaryChannels.map((c: any) => c.channel),
        },
        leaveReminders: {
          enabled: row.leave_enabled === 1,
          pendingApprovalHours: row.leave_pending_approval_hours,
          unusedLeaveMonths: row.leave_unused_leave_months,
          channels: leaveChannels.map((c: any) => c.channel),
        },
        policyUpdates: {
          enabled: row.policy_updates_enabled === 1,
          requireAcknowledgment: row.policy_updates_require_acknowledgment === 1,
          reminderFrequency: row.policy_updates_reminder_frequency,
          channels: policyChannels.map((c: any) => c.channel),
        }
      };
    }));

    res.json({ success: true, message: "Notification Settings fetched successfully", data: formattedRows });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getNotificationSettingById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT * FROM hrms_notification_settings WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification Setting not found' });
    }

    const row = rows[0];

    // Fetch channels for each category
    const [birthdayChannels]: any = await pool.query('SELECT channel FROM hrms_notification_settings_channels WHERE setting_id = ? AND setting_type = "BIRTHDAY"', [id]);
    const [anniversaryChannels]: any = await pool.query('SELECT channel FROM hrms_notification_settings_channels WHERE setting_id = ? AND setting_type = "ANNIVERSARY"', [id]);
    const [leaveChannels]: any = await pool.query('SELECT channel FROM hrms_notification_settings_channels WHERE setting_id = ? AND setting_type = "LEAVE"', [id]);
    const [policyChannels]: any = await pool.query('SELECT channel FROM hrms_notification_settings_channels WHERE setting_id = ? AND setting_type = "POLICY"', [id]);

    const formattedData = {
      id: row.id,
      birthdayReminders: {
        enabled: row.birthday_enabled === 1,
        daysBefore: row.birthday_days_before,
        notifyManagers: row.birthday_notify_managers === 1,
        notifyHR: row.birthday_notify_hr === 1,
        channels: birthdayChannels.map((c: any) => c.channel),
      },
      anniversaryReminders: {
        enabled: row.anniversary_enabled === 1,
        daysBefore: row.anniversary_days_before,
        notifyManagers: row.anniversary_notify_managers === 1,
        channels: anniversaryChannels.map((c: any) => c.channel),
      },
      leaveReminders: {
        enabled: row.leave_enabled === 1,
        pendingApprovalHours: row.leave_pending_approval_hours,
        unusedLeaveMonths: row.leave_unused_leave_months,
        channels: leaveChannels.map((c: any) => c.channel),
      },
      policyUpdates: {
        enabled: row.policy_updates_enabled === 1,
        requireAcknowledgment: row.policy_updates_require_acknowledgment === 1,
        reminderFrequency: row.policy_updates_reminder_frequency,
        channels: policyChannels.map((c: any) => c.channel),
      }
    };

    res.json({ success: true, message: "Notification Setting fetched successfully", data: formattedData });
  } catch (error) {
    console.error('Error fetching notification setting by ID:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createNotificationSetting = async (req: Request, res: Response) => {
  const { birthdayReminders, anniversaryReminders, leaveReminders, policyUpdates } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result]: any = await connection.query(
      `INSERT INTO hrms_notification_settings (
        birthday_enabled, birthday_days_before, birthday_notify_managers, birthday_notify_hr, 
        anniversary_enabled, anniversary_days_before, anniversary_notify_managers, 
        leave_enabled, leave_pending_approval_hours, leave_unused_leave_months, 
        policy_updates_enabled, policy_updates_require_acknowledgment, policy_updates_reminder_frequency
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        birthdayReminders?.enabled ? 1 : 0, birthdayReminders?.daysBefore, birthdayReminders?.notifyManagers ? 1 : 0, birthdayReminders?.notifyHR ? 1 : 0,
        anniversaryReminders?.enabled ? 1 : 0, anniversaryReminders?.daysBefore, anniversaryReminders?.notifyManagers ? 1 : 0,
        leaveReminders?.enabled ? 1 : 0, leaveReminders?.pendingApprovalHours, leaveReminders?.unusedLeaveMonths,
        policyUpdates?.enabled ? 1 : 0, policyUpdates?.requireAcknowledgment ? 1 : 0, policyUpdates?.reminderFrequency
      ]
    );

    const settingId = result.insertId;

    // Helper to insert channels
    const insertChannels = async (settingId: number, type: string, channels: string[]) => {
      if (channels && Array.isArray(channels)) {
        for (const channel of channels) {
          await connection.query(
            'INSERT INTO hrms_notification_settings_channels (setting_id, setting_type, channel) VALUES (?, ?, ?)',
            [settingId, type, channel]
          );
        }
      }
    };

    if (birthdayReminders?.channels) await insertChannels(settingId, 'BIRTHDAY', birthdayReminders.channels);
    if (anniversaryReminders?.channels) await insertChannels(settingId, 'ANNIVERSARY', anniversaryReminders.channels);
    if (leaveReminders?.channels) await insertChannels(settingId, 'LEAVE', leaveReminders.channels);
    if (policyUpdates?.channels) await insertChannels(settingId, 'POLICY', policyUpdates.channels);

    await connection.commit();
    res.status(201).json({ success: true, message: 'Notification Setting created successfully', id: settingId });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating notification setting:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

export const updateNotificationSetting = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { birthdayReminders, anniversaryReminders, leaveReminders, policyUpdates } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result]: any = await connection.query(
      `UPDATE hrms_notification_settings SET 
        birthday_enabled = ?, birthday_days_before = ?, birthday_notify_managers = ?, birthday_notify_hr = ?, 
        anniversary_enabled = ?, anniversary_days_before = ?, anniversary_notify_managers = ?, 
        leave_enabled = ?, leave_pending_approval_hours = ?, leave_unused_leave_months = ?, 
        policy_updates_enabled = ?, policy_updates_require_acknowledgment = ?, policy_updates_reminder_frequency = ? 
      WHERE id = ?`,
      [
        birthdayReminders?.enabled ? 1 : 0, birthdayReminders?.daysBefore, birthdayReminders?.notifyManagers ? 1 : 0, birthdayReminders?.notifyHR ? 1 : 0,
        anniversaryReminders?.enabled ? 1 : 0, anniversaryReminders?.daysBefore, anniversaryReminders?.notifyManagers ? 1 : 0,
        leaveReminders?.enabled ? 1 : 0, leaveReminders?.pendingApprovalHours, leaveReminders?.unusedLeaveMonths,
        policyUpdates?.enabled ? 1 : 0, policyUpdates?.requireAcknowledgment ? 1 : 0, policyUpdates?.reminderFrequency,
        id
      ]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Notification Setting not found' });
    }

    // Delete and re-insert channels
    await connection.query('DELETE FROM hrms_notification_settings_channels WHERE setting_id = ?', [id]);

    const insertChannels = async (settingId: number, type: string, channels: string[]) => {
      if (channels && Array.isArray(channels)) {
        for (const channel of channels) {
          await connection.query(
            'INSERT INTO hrms_notification_settings_channels (setting_id, setting_type, channel) VALUES (?, ?, ?)',
            [settingId, type, channel]
          );
        }
      }
    };

    if (birthdayReminders?.channels) await insertChannels(Number(id), 'BIRTHDAY', birthdayReminders.channels);
    if (anniversaryReminders?.channels) await insertChannels(Number(id), 'ANNIVERSARY', anniversaryReminders.channels);
    if (leaveReminders?.channels) await insertChannels(Number(id), 'LEAVE', leaveReminders.channels);
    if (policyUpdates?.channels) await insertChannels(Number(id), 'POLICY', policyUpdates.channels);

    await connection.commit();
    res.json({ success: true, message: 'Notification Setting updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating notification setting:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

export const deleteNotificationSetting = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result]: any = await pool.query('DELETE FROM hrms_notification_settings WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification Setting not found' });
    }
    res.json({ success: true, message: 'Notification Setting deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification setting:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
