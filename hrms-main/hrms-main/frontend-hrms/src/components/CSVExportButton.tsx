import React, { useState } from 'react';
import { Button, CircularProgress, Tooltip } from '@mui/material';
import { FileDownload } from '@mui/icons-material';
import { apiService } from '../services/api';

interface CSVExportButtonProps {
  exportType: 'KPI' | 'ASSETS' | 'LEAVE' | 'EXPENSE';
  fileName?: string;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  fullWidth?: boolean;
  disabled?: boolean;
  startIcon?: React.ReactNode;
}

const CSVExportButton: React.FC<CSVExportButtonProps> = ({
  exportType,
  fileName,
  variant = 'outlined',
  size = 'medium',
  color = 'primary',
  fullWidth = false,
  disabled = false,
  startIcon,
}) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      let blob: Blob;
      let defaultFileName: string;

      switch (exportType) {
        case 'KPI':
          blob = await apiService.exportKPIToCSV();
          defaultFileName = `KPI_Export_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'ASSETS':
          blob = await apiService.exportAssetsToCSV();
          defaultFileName = `Assets_Export_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'LEAVE':
          blob = await apiService.exportEmployeeFormsToCSV('LEAVE');
          defaultFileName = `Leave_Requests_Export_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'EXPENSE':
          blob = await apiService.exportEmployeeFormsToCSV('EXPENSE');
          defaultFileName = `Expense_Requests_Export_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        default:
          throw new Error(`Unsupported export type: ${exportType}`);
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || defaultFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title={`Export ${exportType} data to CSV`}>
      <span>
        <Button
          variant={variant}
          size={size}
          color={color}
          fullWidth={fullWidth}
          disabled={disabled || loading}
          startIcon={loading ? <CircularProgress size={16} /> : (startIcon || <FileDownload />)}
          onClick={handleExport}
        >
          {loading ? 'Exporting...' : 'EXPORT CSV'}
        </Button>
      </span>
    </Tooltip>
  );
};

export default CSVExportButton;










