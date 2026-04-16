import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { PDF_STORAGE_DIR } from '../config/uploadConfig';
import pool from '../db';

// Ensure PDF storage directory exists
try {
  if (!fs.existsSync(PDF_STORAGE_DIR)) {
    fs.mkdirSync(PDF_STORAGE_DIR, { recursive: true });
    console.log(`✓ Created PDF storage directory: ${PDF_STORAGE_DIR}`);
  }
} catch (error) {
  console.error(`Warning: Could not create PDF storage directory: ${PDF_STORAGE_DIR}`, error);
  // Don't crash - directory creation will be retried when PDF is generated
}

export interface PDFOptions {
  title?: string;
  subtitle?: string;
  companyName?: string;
  companyLogo?: string;
  includePageNumbers?: boolean;
  includeTimestamp?: boolean;
}

export interface KPIPDFData {
  employee: {
    id: number;
    employeeId: string;
    name: string;
    department: string;
    designation: string;
    email?: string;
  };
  kpi: {
    id: number;
    periodYear: number;
    periodMonth: number;
    status: string;
    submittedAt?: string;
    completedAt?: string;
    category: string;
  };
  items: Array<{
    title: string;
    description?: string;
    weight: number;
    employeeTarget: string;
    employeeScore?: number;
    managerScore?: number;
    deptHeadScore?: number;
    hrScore?: number;
    ceoScore?: number;
  }>;
  reviews: Array<{
    reviewerName: string;
    reviewerRole: string;
    action: string;
    fromStatus: string;
    toStatus: string;
    overallScore?: number;
    overallComment?: string;
    createdAt: string;
  }>;
  comments: Array<{
    authorName: string;
    authorRole: string;
    message: string;
    createdAt: string;
  }>;
}

export interface AssetPDFData {
  asset: {
    id: number;
    assetId: string;
    name: string;
    category: string;
    type: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    purchaseDate?: string;
    purchasePrice?: number;
    currentValue?: number;
    vendorName?: string;
    invoiceNumber?: string;
    depreciationMethod?: string;
    depreciationRate?: number;
    usefulLifeYears?: number;
    condition: string;
    status: string;
    location?: string;
    assignedTo?: {
      id: number;
      name: string;
      employeeId: string;
    };
    warrantyExpiry?: string;
    description?: string;
    specifications?: string;
  };
  photos?: Array<{
    photoPath: string;
    photoName: string;
    isPrimary: boolean;
  }>;
  history: Array<{
    actionType: string;
    actionBy?: string;
    actionDate: string;
    description?: string;
    remarks?: string;
  }>;
  assignments?: Array<{
    employeeName: string;
    assignedDate: string;
    returnDate?: string;
    condition: string;
    status: string;
  }>;
}

export interface EmployeeFormPDFData {
  formType: string;
  employee: {
    id: number;
    employeeId: string;
    name: string;
    department: string;
    designation: string;
  };
  formData: any;
  status: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  remarks?: string;
}

class PDFService {
  private defaultOptions: PDFOptions = {
    title: 'HRMS Report',
    companyName: 'DKG HRMS',
    includePageNumbers: true,
    includeTimestamp: true,
  };

  /**
   * Generate PDF with header, footer, and branding
   */
  private createDocument(options: Partial<PDFOptions> = {}): InstanceType<typeof PDFDocument> {
    const opts: PDFOptions = { ...this.defaultOptions, ...options };
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    // Store options in document for later use
    (doc as any).__pdfOptions = opts;
    (doc as any).__pageNumber = 1;

    // Add header and footer on first page immediately
    this.addHeader(doc, opts);
    this.addFooter(doc, 1, opts);
    (doc as any).__pageNumber = 2;

    return doc;
  }

  /**
   * Helper method to add a new page with header and footer
   */
  private addPageWithHeaderFooter(doc: InstanceType<typeof PDFDocument>): void {
    const opts = (doc as any).__pdfOptions || this.defaultOptions;
    let pageNumber = (doc as any).__pageNumber || 1;

    doc.addPage();
    this.addHeader(doc, opts);
    this.addFooter(doc, pageNumber, opts);
    (doc as any).__pageNumber = pageNumber + 1;
  }

  /**
   * Add header with company branding
   */
  private addHeader(doc: InstanceType<typeof PDFDocument>, options: PDFOptions): void {
    const { title, subtitle, companyName } = options;

    // Company name and logo area
    doc.fontSize(16).font('Helvetica-Bold').text(companyName || 'DKG HRMS', 50, 20, { align: 'left' });

    // Title
    doc.fontSize(18).font('Helvetica-Bold').text(title || 'HRMS Report', 50, 45, { align: 'left' });

    // Subtitle if provided
    if (subtitle) {
      doc.fontSize(12).font('Helvetica').text(subtitle, 50, 70, { align: 'left' });
    }

    // Horizontal line
    doc.moveTo(50, 90).lineTo(545, 90).stroke();
  }

  /**
   * Add footer with page numbers and timestamp
   */
  private addFooter(doc: InstanceType<typeof PDFDocument>, pageNumber: number, options: PDFOptions): void {
    const pageHeight = doc.page.height;
    const pageWidth = doc.page.width;

    // Footer line
    doc.moveTo(50, pageHeight - 40).lineTo(545, pageHeight - 40).stroke();

    // Page number
    if (options.includePageNumbers) {
      doc.fontSize(10).font('Helvetica').text(
        `Page ${pageNumber}`,
        pageWidth - 100,
        pageHeight - 30,
        { align: 'right' }
      );
    }

    // Timestamp
    if (options.includeTimestamp) {
      doc.fontSize(10).font('Helvetica').text(
        `Generated: ${new Date().toLocaleString()}`,
        50,
        pageHeight - 30,
        { align: 'left' }
      );
    }
  }

  /**
   * Generate KPI Report PDF
   */
  async generateKPIPDF(kpiId: number, options?: PDFOptions): Promise<string> {
    // Set timeout for PDF generation (30 seconds)
    let timeout: NodeJS.Timeout;

    return new Promise((resolve, reject) => {
      timeout = setTimeout(() => {
        reject(new Error('PDF generation timed out after 30 seconds'));
      }, 30000);

      // Use async IIFE to handle async operations
      (async () => {
        try {
          console.log(`[PDF Service] Starting PDF generation for KPI ${kpiId}...`);

          // Ensure PDF directory exists
          if (!fs.existsSync(PDF_STORAGE_DIR)) {
            fs.mkdirSync(PDF_STORAGE_DIR, { recursive: true });
            console.log(`[PDF Service] Created PDF storage directory: ${PDF_STORAGE_DIR}`);
          }

          // Fetch KPI data
          console.log(`[PDF Service] Fetching KPI data for ID ${kpiId}...`);
          const kpiData = await this.fetchKPIData(kpiId);
          if (!kpiData) {
            clearTimeout(timeout);
            reject(new Error('KPI not found'));
            return;
          }

          console.log(`[PDF Service] KPI data fetched successfully for employee: ${kpiData.employee.name}`);

          const fileName = `KPI_${kpiData.employee.employeeId}_${kpiData.kpi.periodYear}_${kpiData.kpi.periodMonth}.pdf`;
          const filePath = path.join(PDF_STORAGE_DIR, fileName);

          console.log(`[PDF Service] Creating PDF document: ${filePath}`);

          const doc = this.createDocument({
            title: 'KPI Performance Report',
            subtitle: `${kpiData.employee.name} - ${this.getMonthName(kpiData.kpi.periodMonth)} ${kpiData.kpi.periodYear}`,
            ...options,
          });

          const stream = fs.createWriteStream(filePath);
          doc.pipe(stream);

          let yPosition = 100;

          // Employee Information Section
          doc.fontSize(14).font('Helvetica-Bold').text('Employee Information', 50, yPosition);
          yPosition += 25;

          doc.fontSize(10).font('Helvetica');
          doc.text(`Employee ID: ${kpiData.employee.employeeId}`, 50, yPosition);
          yPosition += 15;
          doc.text(`Name: ${kpiData.employee.name}`, 50, yPosition);
          yPosition += 15;
          doc.text(`Department: ${kpiData.employee.department}`, 50, yPosition);
          yPosition += 15;
          doc.text(`Designation: ${kpiData.employee.designation}`, 50, yPosition);
          yPosition += 15;
          if (kpiData.employee.email) {
            doc.text(`Email: ${kpiData.employee.email}`, 50, yPosition);
            yPosition += 15;
          }

          yPosition += 10;

          // KPI Details Section
          doc.fontSize(14).font('Helvetica-Bold').text('KPI Details', 50, yPosition);
          yPosition += 25;

          doc.fontSize(10).font('Helvetica');
          doc.text(`Period: ${this.getMonthName(kpiData.kpi.periodMonth)} ${kpiData.kpi.periodYear}`, 50, yPosition);
          yPosition += 15;
          doc.text(`Category: ${kpiData.kpi.category}`, 50, yPosition);
          yPosition += 15;
          doc.text(`Status: ${kpiData.kpi.status}`, 50, yPosition);
          yPosition += 15;
          if (kpiData.kpi.submittedAt) {
            doc.text(`Submitted: ${new Date(kpiData.kpi.submittedAt).toLocaleString()}`, 50, yPosition);
            yPosition += 15;
          }
          if (kpiData.kpi.completedAt) {
            doc.text(`Completed: ${new Date(kpiData.kpi.completedAt).toLocaleString()}`, 50, yPosition);
            yPosition += 15;
          }

          yPosition += 10;

          // KPI Items Section
          if (kpiData.items && kpiData.items.length > 0) {
            doc.fontSize(14).font('Helvetica-Bold').text('KPI Items', 50, yPosition);
            yPosition += 25;

            kpiData.items.forEach((item: any, index: number) => {
              if (yPosition > 700) {
                this.addPageWithHeaderFooter(doc);
                yPosition = 100;
              }

              doc.fontSize(11).font('Helvetica-Bold').text(`${index + 1}. ${item.title}`, 50, yPosition);
              yPosition += 18;

              if (item.description) {
                doc.fontSize(9).font('Helvetica-Oblique').text(`Description: ${item.description}`, 60, yPosition, { width: 480 });
                yPosition += 15;
              }

              doc.fontSize(9).font('Helvetica');
              doc.text(`Target: ${item.employeeTarget}`, 60, yPosition);
              yPosition += 12;
              doc.text(`Weight: ${item.weight}%`, 60, yPosition);
              yPosition += 12;

              // Scores
              const scores: string[] = [];
              if (item.employeeScore !== null && item.employeeScore !== undefined) {
                scores.push(`Employee: ${item.employeeScore}`);
              }
              if (item.managerScore !== null && item.managerScore !== undefined) {
                scores.push(`Manager: ${item.managerScore}`);
              }
              if (item.deptHeadScore !== null && item.deptHeadScore !== undefined) {
                scores.push(`Dept Head: ${item.deptHeadScore}`);
              }
              if (item.hrScore !== null && item.hrScore !== undefined) {
                scores.push(`HR: ${item.hrScore}`);
              }
              if (item.ceoScore !== null && item.ceoScore !== undefined) {
                scores.push(`CEO: ${item.ceoScore}`);
              }

              if (scores.length > 0) {
                doc.text(`Scores: ${scores.join(' | ')}`, 60, yPosition);
                yPosition += 15;
              }

              yPosition += 10;
            });
          }

          // Reviews Section
          if (kpiData.reviews && kpiData.reviews.length > 0) {
            if (yPosition > 650) {
              this.addPageWithHeaderFooter(doc);
              yPosition = 100;
            }

            doc.fontSize(14).font('Helvetica-Bold').text('Approval History', 50, yPosition);
            yPosition += 25;

            kpiData.reviews.forEach((review: any) => {
              if (yPosition > 700) {
                this.addPageWithHeaderFooter(doc);
                yPosition = 100;
              }

              doc.fontSize(10).font('Helvetica-Bold').text(
                `${review.reviewerName} (${review.reviewerRole})`,
                50,
                yPosition
              );
              yPosition += 15;

              doc.fontSize(9).font('Helvetica');
              doc.text(`Action: ${review.action}`, 60, yPosition);
              yPosition += 12;
              doc.text(`Status: ${review.fromStatus} → ${review.toStatus}`, 60, yPosition);
              yPosition += 12;
              if (review.overallScore !== null && review.overallScore !== undefined) {
                doc.text(`Overall Score: ${review.overallScore}`, 60, yPosition);
                yPosition += 12;
              }
              if (review.overallComment) {
                doc.text(`Comment: ${review.overallComment}`, 60, yPosition, { width: 480 });
                yPosition += 15;
              }
              doc.text(`Date: ${new Date(review.createdAt).toLocaleString()}`, 60, yPosition);
              yPosition += 20;
            });
          }

          // Comments Section
          if (kpiData.comments && kpiData.comments.length > 0) {
            if (yPosition > 650) {
              this.addPageWithHeaderFooter(doc);
              yPosition = 100;
            }

            doc.fontSize(14).font('Helvetica-Bold').text('Comments', 50, yPosition);
            yPosition += 25;

            kpiData.comments.forEach((comment: any) => {
              if (yPosition > 700) {
                this.addPageWithHeaderFooter(doc);
                yPosition = 100;
              }

              doc.fontSize(10).font('Helvetica-Bold').text(
                `${comment.authorName} (${comment.authorRole})`,
                50,
                yPosition
              );
              yPosition += 15;

              doc.fontSize(9).font('Helvetica');
              doc.text(comment.message, 60, yPosition, { width: 480 });
              yPosition += 20;
              doc.text(`Date: ${new Date(comment.createdAt).toLocaleString()}`, 60, yPosition);
              yPosition += 20;
            });
          }

          doc.end();

          stream.on('finish', () => {
            clearTimeout(timeout);
            console.log(`[PDF Service] KPI PDF file written successfully: ${filePath}`);
            // Verify file was created
            if (fs.existsSync(filePath)) {
              const stats = fs.statSync(filePath);
              console.log(`[PDF Service] PDF file size: ${stats.size} bytes`);
              resolve(filePath);
            } else {
              reject(new Error(`PDF file was not created at: ${filePath}`));
            }
          });

          stream.on('error', (error) => {
            clearTimeout(timeout);
            console.error(`[PDF Service] Stream error while writing KPI PDF:`, error);
            reject(error);
          });

          doc.on('error', (error) => {
            clearTimeout(timeout);
            console.error(`[PDF Service] PDF document error in KPI generation:`, error);
            reject(error);
          });
        } catch (error: any) {
          clearTimeout(timeout);
          console.error(`[PDF Service] Error in generateKPIPDF for KPI ${kpiId}:`, error);
          console.error(`[PDF Service] Error stack:`, error.stack);
          reject(error);
        }
      })(); // Close async IIFE
    }); // Close Promise
  }

  /**
   * Generate Asset Report PDF
   */
  async generateAssetPDF(assetId: number, options?: PDFOptions): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const assetData = await this.fetchAssetData(assetId);
        if (!assetData) {
          throw new Error('Asset not found');
        }

        const fileName = `Asset_${assetData.asset.assetId}.pdf`;
        const filePath = path.join(PDF_STORAGE_DIR, fileName);

        const doc = this.createDocument({
          title: 'Asset Management Report',
          subtitle: assetData.asset.name,
          ...options,
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        let yPosition = 100;

        // Asset Basic Information
        doc.fontSize(14).font('Helvetica-Bold').text('Asset Information', 50, yPosition);
        yPosition += 25;

        doc.fontSize(10).font('Helvetica');
        doc.text(`Asset ID: ${assetData.asset.assetId}`, 50, yPosition);
        yPosition += 15;
        doc.text(`Name: ${assetData.asset.name}`, 50, yPosition);
        yPosition += 15;
        doc.text(`Category: ${assetData.asset.category}`, 50, yPosition);
        yPosition += 15;
        doc.text(`Type: ${assetData.asset.type}`, 50, yPosition);
        yPosition += 15;
        if (assetData.asset.brand) {
          doc.text(`Brand: ${assetData.asset.brand}`, 50, yPosition);
          yPosition += 15;
        }
        if (assetData.asset.model) {
          doc.text(`Model: ${assetData.asset.model}`, 50, yPosition);
          yPosition += 15;
        }
        if (assetData.asset.serialNumber) {
          doc.text(`Serial Number: ${assetData.asset.serialNumber}`, 50, yPosition);
          yPosition += 15;
        }
        doc.text(`Condition: ${assetData.asset.condition}`, 50, yPosition);
        yPosition += 15;
        doc.text(`Status: ${assetData.asset.status}`, 50, yPosition);
        yPosition += 15;
        if (assetData.asset.location) {
          doc.text(`Location: ${assetData.asset.location}`, 50, yPosition);
          yPosition += 15;
        }

        yPosition += 10;

        // Purchase Information
        if (assetData.asset.purchaseDate || assetData.asset.purchasePrice) {
          doc.fontSize(14).font('Helvetica-Bold').text('Purchase Information', 50, yPosition);
          yPosition += 25;

          doc.fontSize(10).font('Helvetica');
          if (assetData.asset.purchaseDate) {
            doc.text(`Purchase Date: ${new Date(assetData.asset.purchaseDate).toLocaleDateString()}`, 50, yPosition);
            yPosition += 15;
          }
          if (assetData.asset.purchasePrice) {
            doc.text(`Purchase Price: ₹${assetData.asset.purchasePrice.toLocaleString('en-IN')}`, 50, yPosition);
            yPosition += 15;
          }
          if (assetData.asset.vendorName) {
            doc.text(`Vendor: ${assetData.asset.vendorName}`, 50, yPosition);
            yPosition += 15;
          }
          if (assetData.asset.invoiceNumber) {
            doc.text(`Invoice Number: ${assetData.asset.invoiceNumber}`, 50, yPosition);
            yPosition += 15;
          }
          if (assetData.asset.warrantyExpiry) {
            doc.text(`Warranty Expiry: ${new Date(assetData.asset.warrantyExpiry).toLocaleDateString()}`, 50, yPosition);
            yPosition += 15;
          }

          yPosition += 10;
        }

        // Depreciation Information
        if (assetData.asset.depreciationMethod) {
          doc.fontSize(14).font('Helvetica-Bold').text('Depreciation Information', 50, yPosition);
          yPosition += 25;

          doc.fontSize(10).font('Helvetica');
          doc.text(`Method: ${assetData.asset.depreciationMethod}`, 50, yPosition);
          yPosition += 15;
          if (assetData.asset.depreciationRate) {
            doc.text(`Depreciation Rate: ${assetData.asset.depreciationRate}%`, 50, yPosition);
            yPosition += 15;
          }
          if (assetData.asset.usefulLifeYears) {
            doc.text(`Useful Life: ${assetData.asset.usefulLifeYears} years`, 50, yPosition);
            yPosition += 15;
          }
          if (assetData.asset.currentValue) {
            doc.text(`Current Value: ₹${assetData.asset.currentValue.toLocaleString('en-IN')}`, 50, yPosition);
            yPosition += 15;
          }

          yPosition += 10;
        }

        // Assignment Information
        if (assetData.asset.assignedTo) {
          doc.fontSize(14).font('Helvetica-Bold').text('Current Assignment', 50, yPosition);
          yPosition += 25;

          doc.fontSize(10).font('Helvetica');
          doc.text(`Assigned To: ${assetData.asset.assignedTo.name} (${assetData.asset.assignedTo.employeeId})`, 50, yPosition);
          yPosition += 15;

          yPosition += 10;
        }

        // Assignment History
        if (assetData.assignments && assetData.assignments.length > 0) {
          if (yPosition > 650) {
            doc.addPage();
            yPosition = 100;
          }

          doc.fontSize(14).font('Helvetica-Bold').text('Assignment History', 50, yPosition);
          yPosition += 25;

          assetData.assignments.forEach((assignment) => {
            if (yPosition > 700) {
              doc.addPage();
              yPosition = 100;
            }

            doc.fontSize(10).font('Helvetica');
            doc.text(`Employee: ${assignment.employeeName}`, 50, yPosition);
            yPosition += 15;
            doc.text(`Assigned Date: ${new Date(assignment.assignedDate).toLocaleDateString()}`, 50, yPosition);
            yPosition += 15;
            if (assignment.returnDate) {
              doc.text(`Return Date: ${new Date(assignment.returnDate).toLocaleDateString()}`, 50, yPosition);
              yPosition += 15;
            }
            doc.text(`Condition: ${assignment.condition}`, 50, yPosition);
            yPosition += 15;
            doc.text(`Status: ${assignment.status}`, 50, yPosition);
            yPosition += 20;
          });
        }

        // History
        if (assetData.history.length > 0) {
          if (yPosition > 650) {
            doc.addPage();
            yPosition = 100;
          }

          doc.fontSize(14).font('Helvetica-Bold').text('Asset History', 50, yPosition);
          yPosition += 25;

          assetData.history.forEach((historyItem) => {
            if (yPosition > 700) {
              doc.addPage();
              yPosition = 100;
            }

            doc.fontSize(10).font('Helvetica-Bold').text(historyItem.actionType, 50, yPosition);
            yPosition += 15;

            doc.fontSize(9).font('Helvetica');
            if (historyItem.actionBy) {
              doc.text(`By: ${historyItem.actionBy}`, 60, yPosition);
              yPosition += 12;
            }
            doc.text(`Date: ${new Date(historyItem.actionDate).toLocaleString()}`, 60, yPosition);
            yPosition += 12;
            if (historyItem.description) {
              doc.text(`Description: ${historyItem.description}`, 60, yPosition, { width: 480 });
              yPosition += 15;
            }
            if (historyItem.remarks) {
              doc.text(`Remarks: ${historyItem.remarks}`, 60, yPosition, { width: 480 });
              yPosition += 15;
            }
            yPosition += 10;
          });
        }

        // Description and Specifications
        if (assetData.asset.description || assetData.asset.specifications) {
          if (yPosition > 650) {
            doc.addPage();
            yPosition = 100;
          }

          doc.fontSize(14).font('Helvetica-Bold').text('Additional Information', 50, yPosition);
          yPosition += 25;

          doc.fontSize(10).font('Helvetica');
          if (assetData.asset.description) {
            doc.text('Description:', 50, yPosition);
            yPosition += 15;
            doc.text(assetData.asset.description, 60, yPosition, { width: 480 });
            yPosition += 20;
          }
          if (assetData.asset.specifications) {
            doc.text('Specifications:', 50, yPosition);
            yPosition += 15;
            doc.text(assetData.asset.specifications, 60, yPosition, { width: 480 });
            yPosition += 20;
          }
        }

        doc.end();

        stream.on('finish', () => {
          resolve(filePath);
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate Employee Form PDF (Leave, Expense, etc.)
   */
  async generateEmployeeFormPDF(formType: string, formId: number, options?: PDFOptions): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const formData = await this.fetchEmployeeFormData(formType, formId);
        if (!formData) {
          throw new Error(`${formType} form not found`);
        }

        const fileName = `${formType}_${formData.employee.employeeId}_${formId}.pdf`;
        const filePath = path.join(PDF_STORAGE_DIR, fileName);

        const doc = this.createDocument({
          title: `${formType} Request Report`,
          subtitle: formData.employee.name,
          ...options,
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        let yPosition = 100;

        // Employee Information
        doc.fontSize(14).font('Helvetica-Bold').text('Employee Information', 50, yPosition);
        yPosition += 25;

        doc.fontSize(10).font('Helvetica');
        doc.text(`Employee ID: ${formData.employee.employeeId}`, 50, yPosition);
        yPosition += 15;
        doc.text(`Name: ${formData.employee.name}`, 50, yPosition);
        yPosition += 15;
        doc.text(`Department: ${formData.employee.department}`, 50, yPosition);
        yPosition += 15;
        doc.text(`Designation: ${formData.employee.designation}`, 50, yPosition);
        yPosition += 20;

        // Form Details
        doc.fontSize(14).font('Helvetica-Bold').text('Request Details', 50, yPosition);
        yPosition += 25;

        doc.fontSize(10).font('Helvetica');
        Object.entries(formData.formData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            const label = this.formatLabel(key);
            if (typeof value === 'object') {
              doc.text(`${label}: ${JSON.stringify(value)}`, 50, yPosition);
            } else {
              doc.text(`${label}: ${value}`, 50, yPosition);
            }
            yPosition += 15;
          }
        });

        yPosition += 10;

        // Status Information
        doc.fontSize(14).font('Helvetica-Bold').text('Status Information', 50, yPosition);
        yPosition += 25;

        doc.fontSize(10).font('Helvetica');
        doc.text(`Status: ${formData.status}`, 50, yPosition);
        yPosition += 15;
        if (formData.submittedAt) {
          doc.text(`Submitted: ${new Date(formData.submittedAt).toLocaleString()}`, 50, yPosition);
          yPosition += 15;
        }
        if (formData.approvedAt) {
          doc.text(`Approved: ${new Date(formData.approvedAt).toLocaleString()}`, 50, yPosition);
          yPosition += 15;
        }
        if (formData.approvedBy) {
          doc.text(`Approved By: ${formData.approvedBy}`, 50, yPosition);
          yPosition += 15;
        }
        if (formData.remarks) {
          doc.text(`Remarks: ${formData.remarks}`, 50, yPosition, { width: 480 });
          yPosition += 20;
        }

        doc.end();

        stream.on('finish', () => {
          resolve(filePath);
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Fetch KPI data from database
   */
  private async fetchKPIData(kpiId: number): Promise<KPIPDFData | null> {
    try {
      console.log(`[PDF Service] Fetching KPI data for KPI ID: ${kpiId}`);

      // Fetch KPI
      const [kpiRows]: any = await pool.query(
        `SELECT k.*, ac.name as category_name, e.employee_id AS employee_code, e.first_name, e.last_name, e.email,
                d.name as department_name, des.name as designation_name
         FROM hrms_kpis k
         JOIN hrms_appraisal_categories ac ON k.appraisal_category_id = ac.id
         JOIN hrms_employees e ON k.employee_id = e.id
         LEFT JOIN hrms_departments d ON e.department_id = d.id
         LEFT JOIN hrms_designations des ON e.designation_id = des.id
         WHERE k.id = ?`,
        [kpiId]
      );

      if (kpiRows.length === 0) {
        console.error(`[PDF Service] KPI not found for ID: ${kpiId}`);
        return null;
      }

      const kpi = kpiRows[0];
      console.log(`[PDF Service] Found KPI: ${kpi.id}, Employee: ${kpi.first_name} ${kpi.last_name}`);

      // Fetch KPI items
      const [items]: any = await pool.query(
        'SELECT * FROM hrms_kpi_items WHERE kpi_id = ? ORDER BY id',
        [kpiId]
      );

      // Fetch reviews
      const [reviews]: any = await pool.query(
        `SELECT kr.*, e.first_name, e.last_name
         FROM hrms_kpi_reviews kr
         JOIN hrms_employees e ON kr.reviewer_id = e.id
         WHERE kr.kpi_id = ? ORDER BY kr.created_at`,
        [kpiId]
      );

      // Fetch comments
      const [comments]: any = await pool.query(
        `SELECT kc.*, e.first_name, e.last_name
         FROM hrms_kpi_comments kc
         JOIN hrms_employees e ON kc.author_id = e.id
         WHERE kc.kpi_id = ? ORDER BY kc.created_at`,
        [kpiId]
      );

      return {
        employee: {
          id: kpi.employee_id,
          employeeId: kpi.employee_code || `EMP${kpi.employee_id}`,
          name: `${kpi.first_name || ''} ${kpi.last_name || ''}`.trim() || 'Unknown Employee',
          department: kpi.department_name || 'N/A',
          designation: kpi.designation_name || 'N/A',
          email: kpi.email || undefined,
        },
        kpi: {
          id: kpi.id,
          periodYear: kpi.period_year,
          periodMonth: kpi.period_month,
          status: kpi.status,
          submittedAt: kpi.submitted_at,
          completedAt: kpi.completed_at,
          category: kpi.category_name,
        },
        items: items.map((item: any) => ({
          title: item.title,
          description: item.description,
          weight: item.weight,
          employeeTarget: item.employee_target,
          employeeScore: item.employee_self_score,
          managerScore: item.manager_score,
          deptHeadScore: item.dept_head_score,
          hrScore: item.hr_score,
          ceoScore: item.ceo_score,
        })),
        reviews: reviews.map((review: any) => ({
          reviewerName: `${review.first_name} ${review.last_name}`,
          reviewerRole: review.reviewer_role,
          action: review.action,
          fromStatus: review.from_status,
          toStatus: review.to_status,
          overallScore: review.overall_score,
          overallComment: review.overall_comment,
          createdAt: review.created_at,
        })),
        comments: comments.map((comment: any) => ({
          authorName: `${comment.first_name} ${comment.last_name}`,
          authorRole: comment.author_role,
          message: comment.message,
          createdAt: comment.created_at,
        })),
      };
    } catch (error: any) {
      console.error(`[PDF Service] Error fetching KPI data for ID ${kpiId}:`, error);
      console.error(`[PDF Service] Error stack:`, error.stack);
      throw new Error(`Failed to fetch KPI data: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Fetch Asset data from database
   */
  private async fetchAssetData(assetId: number): Promise<AssetPDFData | null> {
    try {
      // Fetch asset
      const [assetRows]: any = await pool.query(
        `SELECT a.*, e.employee_id, e.first_name, e.last_name
         FROM hrms_assets a
         LEFT JOIN hrms_employees e ON a.assigned_to = e.id
         WHERE a.id = ?`,
        [assetId]
      );

      if (assetRows.length === 0) return null;

      const asset = assetRows[0];

      // Fetch photos
      const [photos]: any = await pool.query(
        'SELECT photo_path, photo_name, is_primary FROM hrms_asset_photos WHERE asset_id = ?',
        [assetId]
      );

      // Fetch history
      const [history]: any = await pool.query(
        `SELECT ah.*, e.first_name, e.last_name
         FROM hrms_asset_history ah
         LEFT JOIN hrms_users u ON ah.action_by = u.id
         LEFT JOIN hrms_employees e ON u.employee_id = e.id
         WHERE ah.asset_id = ? ORDER BY ah.action_date DESC`,
        [assetId]
      );

      // Fetch assignments
      const [assignments]: any = await pool.query(
        `SELECT aa.*, e.first_name, e.last_name
         FROM hrms_asset_assignments aa
         JOIN hrms_employees e ON aa.employee_id = e.id
         WHERE aa.asset_id = ? ORDER BY aa.assigned_date DESC`,
        [assetId]
      );

      return {
        asset: {
          id: asset.id,
          assetId: asset.asset_id,
          name: asset.name,
          category: asset.category,
          type: asset.type,
          brand: asset.brand,
          model: asset.model,
          serialNumber: asset.serial_number,
          purchaseDate: asset.purchase_date,
          purchasePrice: asset.purchase_price ? parseFloat(asset.purchase_price) : undefined,
          currentValue: asset.current_value ? parseFloat(asset.current_value) : undefined,
          vendorName: asset.vendor_name,
          invoiceNumber: asset.invoice_number,
          depreciationMethod: asset.depreciation_method,
          depreciationRate: asset.depreciation_rate ? parseFloat(asset.depreciation_rate) : undefined,
          usefulLifeYears: asset.useful_life_years,
          condition: asset.condition,
          status: asset.status,
          location: asset.location,
          assignedTo: asset.assigned_to ? {
            id: asset.assigned_to,
            name: `${asset.first_name} ${asset.last_name}`,
            employeeId: asset.employee_id,
          } : undefined,
          warrantyExpiry: asset.warranty_expiry,
          description: asset.description,
          specifications: asset.specifications,
        },
        photos: photos.map((photo: any) => ({
          photoPath: photo.photo_path,
          photoName: photo.photo_name,
          isPrimary: photo.is_primary === 1,
        })),
        history: history.map((h: any) => ({
          actionType: h.action_type,
          actionBy: h.first_name && h.last_name ? `${h.first_name} ${h.last_name}` : undefined,
          actionDate: h.action_date,
          description: h.description,
          remarks: h.remarks,
        })),
        assignments: assignments.map((a: any) => ({
          employeeName: `${a.first_name} ${a.last_name}`,
          assignedDate: a.assigned_date,
          returnDate: a.return_date,
          condition: a.condition,
          status: a.status,
        })),
      };
    } catch (error) {
      console.error('Error fetching asset data:', error);
      return null;
    }
  }

  /**
   * Fetch Employee Form data from database
   */
  private async fetchEmployeeFormData(formType: string, formId: number): Promise<EmployeeFormPDFData | null> {
    try {
      let query = '';
      let tableName = '';

      switch (formType.toUpperCase()) {
        case 'LEAVE':
          tableName = 'hrms_leave_requests';
          query = `SELECT lr.*, e.employee_id, e.first_name, e.last_name,
                          d.name as department_name, des.name as designation_name,
                          lt.name as leave_type_name,
                          approver.first_name as approver_first_name, approver.last_name as approver_last_name
                   FROM hrms_leave_requests lr
                   JOIN hrms_employees e ON lr.employee_id = e.id
                   JOIN hrms_departments d ON e.department_id = d.id
                   JOIN hrms_designations des ON e.designation_id = des.id
                   JOIN hrms_leave_types lt ON lr.leave_type_id = lt.id
                   LEFT JOIN hrms_employees approver ON lr.approved_by = approver.id
                   WHERE lr.id = ?`;
          break;
        case 'EXPENSE':
          tableName = 'hrms_expense_requests';
          query = `SELECT er.*, e.employee_id, e.first_name, e.last_name,
                          d.name as department_name, des.name as designation_name,
                          ec.name as expense_category_name,
                          approver.first_name as approver_first_name, approver.last_name as approver_last_name
                   FROM hrms_expense_requests er
                   JOIN hrms_employees e ON er.employee_id = e.id
                   JOIN hrms_departments d ON e.department_id = d.id
                   JOIN hrms_designations des ON e.designation_id = des.id
                   JOIN hrms_expense_categories ec ON er.expense_category_id = ec.id
                   LEFT JOIN hrms_employees approver ON er.approved_by = approver.id
                   WHERE er.id = ?`;
          break;
        default:
          throw new Error(`Unsupported form type: ${formType}`);
      }

      const [rows]: any = await pool.query(query, [formId]);

      if (rows.length === 0) return null;

      const row = rows[0];

      const formData: any = {};
      if (formType.toUpperCase() === 'LEAVE') {
        formData.leaveType = row.leave_type_name;
        formData.startDate = row.start_date;
        formData.endDate = row.end_date;
        formData.reason = row.reason;
        formData.days = Math.ceil((new Date(row.end_date).getTime() - new Date(row.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      } else if (formType.toUpperCase() === 'EXPENSE') {
        formData.expenseCategory = row.expense_category_name;
        formData.amount = `₹${parseFloat(row.amount).toLocaleString('en-IN')}`;
        formData.description = row.description;
      }

      return {
        formType: formType,
        employee: {
          id: row.employee_id,
          employeeId: row.employee_id || `EMP${row.employee_id}`,
          name: `${row.first_name} ${row.last_name}`,
          department: row.department_name,
          designation: row.designation_name,
        },
        formData,
        status: row.status,
        submittedAt: row.created_at,
        approvedAt: row.updated_at && row.status === 'APPROVED' ? row.updated_at : undefined,
        approvedBy: row.approver_first_name && row.approver_last_name
          ? `${row.approver_first_name} ${row.approver_last_name}`
          : undefined,
        remarks: row.reason || row.description,
      };
    } catch (error) {
      console.error('Error fetching employee form data:', error);
      return null;
    }
  }

  /**
   * Helper: Get month name
   */
  private getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || `Month ${month}`;
  }

  /**
   * Helper: Format label from key
   */
  private formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Get PDF file path if exists
   */
  getPDFPath(fileName: string): string | null {
    const filePath = path.join(PDF_STORAGE_DIR, fileName);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    return null;
  }

  /**
   * Delete PDF file
   */
  deletePDF(fileName: string): boolean {
    try {
      const filePath = path.join(PDF_STORAGE_DIR, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting PDF:', error);
      return false;
    }
  }
}

export default new PDFService();

