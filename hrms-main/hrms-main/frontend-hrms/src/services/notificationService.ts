// @ts-nocheck
import { AlertColor } from '@mui/material';

export interface NotificationOptions {
  message: string;
  severity?: AlertColor;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface Notification extends NotificationOptions {
  id: string;
  timestamp: number;
}

class NotificationService {
  private listeners: ((notifications: Notification[]) => void)[] = [];
  private notifications: Notification[] = [];

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  show(options: NotificationOptions): string {
    const notification: Notification = {
      id: this.generateId(),
      timestamp: Date.now(),
      severity: 'info',
      duration: 6000,
      ...options
    };

    this.notifications.push(notification);
    this.notify();

    // Auto-remove after duration
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.remove(notification.id);
      }, notification.duration);
    }

    return notification.id;
  }

  remove(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notify();
  }

  clear() {
    this.notifications = [];
    this.notify();
  }

  // Convenience methods
  success(message: string, duration?: number): string {
    return this.show({
      message,
      severity: 'success',
      duration
    });
  }

  error(message: string, duration?: number): string {
    return this.show({
      message,
      severity: 'error',
      duration: duration || 8000 // Errors stay longer
    });
  }

  warning(message: string, duration?: number): string {
    return this.show({
      message,
      severity: 'warning',
      duration
    });
  }

  info(message: string, duration?: number): string {
    return this.show({
      message,
      severity: 'info',
      duration
    });
  }

  // Operation-specific notifications
  operationSuccess(operation: string, entity?: string): string {
    const entityText = entity ? ` ${entity}` : '';
    return this.success(`${operation}${entityText} successfully!`);
  }

  operationError(operation: string, entity?: string, error?: string): string {
    const entityText = entity ? ` ${entity}` : '';
    const errorText = error ? `: ${error}` : '';
    return this.error(`Failed to ${operation.toLowerCase()}${entityText}${errorText}`);
  }

  // CRUD operation notifications
  createSuccess(entity: string): string {
    return this.operationSuccess('Created', entity);
  }

  updateSuccess(entity: string): string {
    return this.operationSuccess('Updated', entity);
  }

  deleteSuccess(entity: string): string {
    return this.operationSuccess('Deleted', entity);
  }

  createError(entity: string, error?: string): string {
    return this.operationError('Create', entity, error);
  }

  updateError(entity: string, error?: string): string {
    return this.operationError('Update', entity, error);
  }

  deleteError(entity: string, error?: string): string {
    return this.operationError('Delete', entity, error);
  }

  loadError(entity: string, error?: string): string {
    return this.operationError('Load', entity, error);
  }

  // Validation notifications
  validationError(message?: string): string {
    return this.error(message || 'Please fix the validation errors and try again');
  }

  // Network notifications
  networkError(): string {
    return this.error('Network error. Please check your connection and try again');
  }

  // Authentication notifications
  loginSuccess(): string {
    return this.success('Logged in successfully');
  }

  logoutSuccess(): string {
    return this.success('Logged out successfully');
  }

  authError(): string {
    return this.error('Authentication failed. Please login again');
  }

  // File upload notifications
  uploadSuccess(fileName?: string): string {
    const fileText = fileName ? ` ${fileName}` : '';
    return this.success(`File${fileText} uploaded successfully`);
  }

  uploadError(fileName?: string, error?: string): string {
    const fileText = fileName ? ` ${fileName}` : '';
    const errorText = error ? `: ${error}` : '';
    return this.error(`Failed to upload file${fileText}${errorText}`);
  }

  // Export notifications
  exportSuccess(type?: string): string {
    const typeText = type ? ` ${type}` : '';
    return this.success(`${typeText} exported successfully`);
  }

  exportError(type?: string): string {
    const typeText = type ? ` ${type}` : '';
    return this.error(`Failed to export${typeText}`);
  }

  // Confirmation with action
  confirmAction(message: string, onConfirm: () => void, onCancel?: () => void): string {
    return this.show({
      message,
      severity: 'warning',
      duration: 0, // Don't auto-dismiss
      action: {
        label: 'Confirm',
        onClick: onConfirm
      }
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
