import React, { useState } from 'react';
import { Button, CircularProgress, Tooltip } from '@mui/material';
import { Download, PictureAsPdf } from '@mui/icons-material';
import { apiService } from '../services/api';

interface PDFDownloadButtonProps {
  moduleType: 'KPI' | 'ASSET' | 'LEAVE' | 'EXPENSE';
  recordId: number;
  fileName?: string;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  fullWidth?: boolean;
  disabled?: boolean;
}

const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({
  moduleType,
  recordId,
  fileName,
  variant = 'outlined',
  size = 'medium',
  color = 'primary',
  fullWidth = false,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      let blob: Blob;
      let defaultFileName: string;

      switch (moduleType) {
        case 'KPI':
          blob = await apiService.downloadKPIPDF(recordId);
          defaultFileName = `KPI_Report_${recordId}.pdf`;
          break;
        case 'ASSET':
          blob = await apiService.downloadAssetPDF(recordId);
          defaultFileName = `Asset_Report_${recordId}.pdf`;
          break;
        case 'LEAVE':
          blob = await apiService.downloadEmployeeFormPDF('LEAVE', recordId);
          defaultFileName = `Leave_Request_${recordId}.pdf`;
          break;
        case 'EXPENSE':
          blob = await apiService.downloadEmployeeFormPDF('EXPENSE', recordId);
          defaultFileName = `Expense_Request_${recordId}.pdf`;
          break;
        default:
          throw new Error(`Unsupported module type: ${moduleType}`);
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
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      const errorMessage = error?.message || 'Failed to download PDF. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title={`Download ${moduleType} Report as PDF`}>
      <span>
        <Button
          variant={variant}
          size={size}
          color={color}
          fullWidth={fullWidth}
          disabled={disabled || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <PictureAsPdf />}
          onClick={handleDownload}
        >
          {loading ? 'Generating...' : 'Download PDF'}
        </Button>
      </span>
    </Tooltip>
  );
};

export default PDFDownloadButton;

