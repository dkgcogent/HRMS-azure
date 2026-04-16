import { Request, Response } from 'express';
import {
  exportKPIToCSV,
  exportAssetsToCSV,
  exportEmployeeFormsToCSV,
} from '../services/csvExportService';

/**
 * Export KPI data to CSV
 */
export const exportKPI = async (req: Request, res: Response) => {
  try {
    const csvContent = await exportKPIToCSV();
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="kpi_export_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error: any) {
    console.error('Error exporting KPI to CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export KPI data',
      error: error.message,
    });
  }
};

/**
 * Export Asset data to CSV
 */
export const exportAssets = async (req: Request, res: Response) => {
  try {
    const csvContent = await exportAssetsToCSV();
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="assets_export_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error: any) {
    console.error('Error exporting Assets to CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export Asset data',
      error: error.message,
    });
  }
};

/**
 * Export Employee Forms (Leave/Expense) to CSV
 */
export const exportEmployeeForms = async (req: Request, res: Response) => {
  try {
    const { formType } = req.params;
    
    if (!formType || !['LEAVE', 'EXPENSE'].includes(formType.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form type. Must be LEAVE or EXPENSE',
      });
    }

    const csvContent = await exportEmployeeFormsToCSV(formType);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${formType.toLowerCase()}_export_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error: any) {
    console.error(`Error exporting ${req.params.formType} forms to CSV:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to export ${req.params.formType} data`,
      error: error.message,
    });
  }
};










