
import express from 'express';
import { getAllNotificationTemplates, getNotificationTemplateById, createNotificationTemplate, updateNotificationTemplate, deleteNotificationTemplate, sendNotificationTemplate } from '../controllers/notificationTemplateController';
import { getAllTemplateChannels, getTemplateChannelById, createTemplateChannel, updateTemplateChannel, deleteTemplateChannel } from '../controllers/templateChannelController';
import { getAllTemplateVariables, getTemplateVariableById, createTemplateVariable, updateTemplateVariable, deleteTemplateVariable } from '../controllers/templateVariableController';
import { getAllTemplateSpecificRecipients, getTemplateSpecificRecipientById, createTemplateSpecificRecipient, deleteTemplateSpecificRecipient } from '../controllers/templateSpecificRecipientController';
import { getAllNotificationHistory, getNotificationHistoryById, createNotificationHistory, updateNotificationHistory, deleteNotificationHistory, getBellNotifications, markBellNotificationRead, markAllBellNotificationsRead } from '../controllers/notificationHistoryController';
import { getAllNotificationRecipientsHistory, getNotificationRecipientHistoryById, createNotificationRecipientHistory, deleteNotificationRecipientHistory } from '../controllers/notificationRecipientHistoryController';
import { getAllBirthdayReminders, getBirthdayReminderById, createBirthdayReminder, updateBirthdayReminder, deleteBirthdayReminder } from '../controllers/birthdayReminderController';
import { getAllNotificationSettings, getNotificationSettingById, createNotificationSetting, updateNotificationSetting, deleteNotificationSetting } from '../controllers/notificationSettingController';
import { getAllNotificationSettingsChannels, getNotificationSettingsChannelById, createNotificationSettingsChannel, deleteNotificationSettingsChannel } from '../controllers/notificationSettingsChannelController';

const router = express.Router();

// Notification Templates Routes
router.get('/notification-templates', getAllNotificationTemplates);
router.post('/notification-templates', createNotificationTemplate);
// IMPORTANT: /send must come before /:id to avoid route conflict
router.post('/notification-templates/:id/send', sendNotificationTemplate);
router.get('/notification-templates/:id', getNotificationTemplateById);
router.put('/notification-templates/:id', updateNotificationTemplate);
router.delete('/notification-templates/:id', deleteNotificationTemplate);

// Template Channels Routes
router.get('/template-channels', getAllTemplateChannels);
router.get('/template-channels/:template_id/:channel', getTemplateChannelById);
router.post('/template-channels', createTemplateChannel);
router.put('/template-channels/:template_id/:channel', updateTemplateChannel);
router.delete('/template-channels/:template_id/:channel', deleteTemplateChannel);

// Template Variables Routes
router.get('/template-variables', getAllTemplateVariables);
router.get('/template-variables/:template_id/:variable_name', getTemplateVariableById);
router.post('/template-variables', createTemplateVariable);
router.put('/template-variables/:template_id/:variable_name', updateTemplateVariable);
router.delete('/template-variables/:template_id/:variable_name', deleteTemplateVariable);

// Template Specific Recipients Routes
router.get('/template-specific-recipients', getAllTemplateSpecificRecipients);
router.get('/template-specific-recipients/:template_id/:employee_id', getTemplateSpecificRecipientById);
router.post('/template-specific-recipients', createTemplateSpecificRecipient);
router.delete('/template-specific-recipients/:template_id/:employee_id', deleteTemplateSpecificRecipient);

// Notification History Routes
router.get('/notification-history', getAllNotificationHistory);
router.get('/notification-history/:id', getNotificationHistoryById);
router.post('/notification-history', createNotificationHistory);
router.put('/notification-history/:id', updateNotificationHistory);
router.delete('/notification-history/:id', deleteNotificationHistory);

// Notification Recipients History Routes
router.get('/notification-recipients-history', getAllNotificationRecipientsHistory);
router.get('/notification-recipients-history/:history_id/:recipient_email', getNotificationRecipientHistoryById);
router.post('/notification-recipients-history', createNotificationRecipientHistory);
router.delete('/notification-recipients-history/:history_id/:recipient_email', deleteNotificationRecipientHistory);

// Birthday Reminders Routes
router.get('/birthday-reminders', getAllBirthdayReminders);
router.get('/birthday-reminders/:id', getBirthdayReminderById);
router.post('/birthday-reminders', createBirthdayReminder);
router.put('/birthday-reminders/:id', updateBirthdayReminder);
router.delete('/birthday-reminders/:id', deleteBirthdayReminder);

// Notification Settings Routes
router.get('/notification-settings', getAllNotificationSettings);
router.get('/notification-settings/:id', getNotificationSettingById);
router.post('/notification-settings', createNotificationSetting);
router.put('/notification-settings/:id', updateNotificationSetting);
router.delete('/notification-settings/:id', deleteNotificationSetting);

// Notification Settings Channels Routes
router.get('/notification-settings-channels', getAllNotificationSettingsChannels);
router.get('/notification-settings-channels/:setting_id/:setting_type/:channel', getNotificationSettingsChannelById);
router.post('/notification-settings-channels', createNotificationSettingsChannel);
router.delete('/notification-settings-channels/:setting_id/:setting_type/:channel', deleteNotificationSettingsChannel);

// Bell Notification Routes (for Header bell icon)
// IMPORTANT: /read-all must be registered BEFORE /:id/read to avoid route conflict
router.get('/bell-notifications', getBellNotifications);
router.patch('/bell-notifications/read-all', markAllBellNotificationsRead);
router.patch('/bell-notifications/:id/read', markBellNotificationRead);

export default router;
