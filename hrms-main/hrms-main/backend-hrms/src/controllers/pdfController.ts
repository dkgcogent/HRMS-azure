import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import pdfService from '../services/pdfService';
import { PDF_STORAGE_DIR } from '../config/uploadConfig';

/**
 * Generate KPI PDF
 */
export const generateKPIPDF = async (req: Request, res: Response) => {
  try {
    const { kpiId } = req.params;

    if (!kpiId) {
      return res.status(400).json({ success: false, message: 'KPI ID is required' });
    }

    const filePath = await pdfService.generateKPIPDF(parseInt(kpiId));

    // Return file path for download
    res.json({
      success: true,
      message: 'PDF generated successfully',
      filePath,
      fileName: filePath.split('/').pop(),
    });
  } catch (error: any) {
    console.error('Error generating KPI PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message,
    });
  }
};

/**
 * Download KPI PDF
 */
export const downloadKPIPDF = async (req: Request, res: Response) => {
  try {
    const { kpiId } = req.params;

    if (!kpiId) {
      return res.status(400).json({ success: false, message: 'KPI ID is required' });
    }

    // Ensure PDF directory exists
    if (!fs.existsSync(PDF_STORAGE_DIR)) {
      fs.mkdirSync(PDF_STORAGE_DIR, { recursive: true });
      console.log(`✓ Created PDF storage directory: ${PDF_STORAGE_DIR}`);
    }

    let filePath: string;
    let actualFileName: string;

    // Try to find existing PDF file
    // PDF filename format: KPI_{employeeId}_{year}_{month}.pdf
    // We need to check all KPI files and match by KPI ID from database
    try {
      const files = fs.readdirSync(PDF_STORAGE_DIR);
      const kpiFiles = files.filter(f => f.startsWith('KPI_') && f.endsWith('.pdf'));
      
      // Try to find file by checking if it matches the KPI
      // Since we can't easily match by filename, we'll generate if not found quickly
      let matchingFile: string | undefined;
      
      // First, try to find any file that might match (this is a fallback)
      // The best approach is to generate the PDF if we're not sure
      if (kpiFiles.length > 0) {
        // Check if any file might be for this KPI by trying to match
        // For now, we'll generate a new one to ensure it's correct
        matchingFile = undefined;
      }

      if (!matchingFile) {
        // Generate PDF if not exists or if we can't find a match
        console.log(`[PDF Download] Generating PDF for KPI ${kpiId}...`);
        try {
          filePath = await pdfService.generateKPIPDF(parseInt(kpiId));
          actualFileName = path.basename(filePath);
          console.log(`[PDF Download] PDF generated successfully: ${filePath}`);
        } catch (genError: any) {
          console.error(`[PDF Download] Error generating PDF:`, genError);
          console.error(`[PDF Download] Error stack:`, genError.stack);
          throw new Error(`Failed to generate PDF: ${genError.message || 'Unknown error'}`);
        }
      } else {
        filePath = path.join(PDF_STORAGE_DIR, matchingFile);
        actualFileName = matchingFile;
      }
    } catch (dirError: any) {
      // If directory read fails, generate the PDF
      console.log(`[PDF Download] Directory read failed, generating PDF for KPI ${kpiId}...`);
      console.log(`[PDF Download] Directory error:`, dirError.message);
      try {
        filePath = await pdfService.generateKPIPDF(parseInt(kpiId));
        actualFileName = path.basename(filePath);
        console.log(`[PDF Download] PDF generated successfully after directory error: ${filePath}`);
      } catch (genError: any) {
        console.error(`[PDF Download] Error generating PDF after directory error:`, genError);
        throw new Error(`Failed to generate PDF: ${genError.message || 'Unknown error'}`);
      }
    }

    // Verify file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file not found: ${filePath}`);
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${actualFileName}"`);
    res.setHeader('Content-Length', fs.statSync(filePath).size);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (streamError: any) => {
      console.error('[PDF Download] Stream error:', streamError);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Failed to stream PDF file',
          error: streamError.message,
        });
      }
    });

  } catch (error: any) {
    console.error('[PDF Download] Error downloading KPI PDF:', error);
    console.error('[PDF Download] Error stack:', error.stack);
    
    // If headers already sent, we can't send JSON response
    if (res.headersSent) {
      return res.end();
    }

    // Return error response
    res.status(500).json({
      success: false,
      message: 'Failed to download PDF',
      error: error.message || 'Unknown error',
    });
  }
};

/**
 * Generate Asset PDF
 */
export const generateAssetPDF = async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;

    if (!assetId) {
      return res.status(400).json({ success: false, message: 'Asset ID is required' });
    }

    const filePath = await pdfService.generateAssetPDF(parseInt(assetId));

    res.json({
      success: true,
      message: 'PDF generated successfully',
      filePath,
      fileName: filePath.split('/').pop(),
    });
  } catch (error: any) {
    console.error('Error generating Asset PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message,
    });
  }
};

/**
 * Download Asset PDF
 */
export const downloadAssetPDF = async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;

    // Find the actual file
    const files = fs.readdirSync(PDF_STORAGE_DIR);
    const matchingFile = files.find(f => f.startsWith(`Asset_`) && f.includes(`_${assetId}.pdf`));

    if (!matchingFile) {
      // Generate if not exists
      const filePath = await pdfService.generateAssetPDF(parseInt(assetId));
      const actualFileName = path.basename(filePath);
      const fullPath = path.join(PDF_STORAGE_DIR, actualFileName);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${actualFileName}"`);
      fs.createReadStream(fullPath).pipe(res);
    } else {
      const fullPath = path.join(PDF_STORAGE_DIR, matchingFile);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${matchingFile}"`);
      fs.createReadStream(fullPath).pipe(res);
    }
  } catch (error: any) {
    console.error('Error downloading Asset PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download PDF',
      error: error.message,
    });
  }
};

/**
 * Generate Employee Form PDF (Leave, Expense, etc.)
 */
export const generateEmployeeFormPDF = async (req: Request, res: Response) => {
  try {
    const { formType, formId } = req.params;

    if (!formType || !formId) {
      return res.status(400).json({ success: false, message: 'Form type and ID are required' });
    }

    const filePath = await pdfService.generateEmployeeFormPDF(formType, parseInt(formId));

    res.json({
      success: true,
      message: 'PDF generated successfully',
      filePath,
      fileName: filePath.split('/').pop(),
    });
  } catch (error: any) {
    console.error('Error generating Employee Form PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message,
    });
  }
};

/**
 * Download Employee Form PDF
 */
export const downloadEmployeeFormPDF = async (req: Request, res: Response) => {
  try {
    const { formType, formId } = req.params;

    // Find the actual file
    const files = fs.readdirSync(PDF_STORAGE_DIR);
    const matchingFile = files.find(f => 
      f.startsWith(`${formType.toUpperCase()}_`) && f.includes(`_${formId}.pdf`)
    );

    if (!matchingFile) {
      // Generate if not exists
      const filePath = await pdfService.generateEmployeeFormPDF(formType, parseInt(formId));
      const actualFileName = path.basename(filePath);
      const fullPath = path.join(PDF_STORAGE_DIR, actualFileName);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${actualFileName}"`);
      fs.createReadStream(fullPath).pipe(res);
    } else {
      const fullPath = path.join(PDF_STORAGE_DIR, matchingFile);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${matchingFile}"`);
      fs.createReadStream(fullPath).pipe(res);
    }
  } catch (error: any) {
    console.error('Error downloading Employee Form PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download PDF',
      error: error.message,
    });
  }
};

