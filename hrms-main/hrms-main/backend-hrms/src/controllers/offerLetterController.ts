import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import path from 'path';
import { PDF_STORAGE_DIR, ASSETS_DIR } from '../config/uploadConfig';
import pool from '../db';
import { uploadBufferToBlob, getBlobUrl, getBlobBuffer, deleteBlob } from '../services/azureBlobService';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface OfferLetterData {
    // Step 1: Candidate Details
    candidateName: string;
    address: string;
    date: string;
    designation: string;
    location: string;
    joiningDate: string;

    // Step 2: Salary & CTC
    calculationBasis: 'New Government Rule' | 'Old Basis';
    esicCovered: 'Yes' | 'No';
    basicSalary: number;
    hra: number;
    variableDearnessAllowance: number;
    otherAllowances: number;
    performanceBonus: number;
    leaveEncashment: number;
    advanceBonus: number;
    grossSalary: number;
    emyPF: number;
    emyESIC: number;
    pTax: number;
    lwfEmployee: number;
    totalDeductions: number;
    netAmount: number;
    emrPF: number;
    emrAdminCharges: number;
    emrESIC: number;
    lwfEmployer: number;
    gratuity: number;
    totalEMRContribution: number;
    monthlySalary: number;
    monthlyCTC: number;
    yearlyCTC: number;

    // Step 3: Acceptance Details
    acceptanceCandidateName: string;
    aadhaarNumber: string;
    acceptanceDate: string;
    candidateSignature: string | null;
    probation: string;
    employeeId: number | null;
}

interface OfferLetterRecord extends RowDataPacket {
    id: number;
    candidate_name: string;
    employee_id: number | null;
    designation: string;
    generated_date: string;
    status: 'Draft' | 'Sent' | 'Viewed' | 'Accepted';
    pdf_path: string;
    offer_data: OfferLetterData | string;
    created_at: Date;
    updated_at: Date;
}

/**
 * Generate Offer Letter PDF matching the exact template layout
 */
export const generateOfferLetterPDF = async (req: Request, res: Response) => {
    try {
        const formData: OfferLetterData = req.body;

        // Validate required fields
        if (!formData.candidateName || !formData.designation || !formData.joiningDate) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const fileName = `Offer_Letter_${formData.candidateName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

        // Create PDF document
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 50, bottom: 50, left: 72, right: 72 }
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));

        // Helper function to format date
        const formatDate = (dateStr: string): string => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            const day = date.getDate();
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = monthNames[date.getMonth()];
            const year = date.getFullYear();
            return `${day.toString().padStart(2, '0')}-${month}-${year}`;
        };

        // ==================== PAGE 1 ====================

        // Company Logo and Header
        try {
            const headerBuffer = await getBlobBuffer('assets/offer_header.png');
            // Center the header image
            doc.image(headerBuffer, 50, 40, { width: 495 });
            doc.y = 120;
        } catch (headerError) {
            console.warn('Failed to load header image from Azure, using fallback:', headerError);
            // Fallback for missing image
            doc.fontSize(20)
                .font('Helvetica-Bold')
                .fillColor('#0066cc')
                .text('cogentes', 72, 40);

            doc.fontSize(10)
                .font('Helvetica-Bold')
                .fillColor('#000000')
                .text('Cogent Logistics Private Limited', 72, 65);

            doc.fontSize(8)
                .font('Helvetica')
                .text('201C/6, II Floor, D-21 Corporate Park, Sector - 21, Dwarka, New Delhi - 110077 India', 72, 78);

            doc.fontSize(8)
                .text('E mail: info@cogentlogistics.in , Web: www.cogentlogistics.in', 72, 90);

            // Horizontal line
            doc.moveTo(72, 105).lineTo(540, 105).stroke();
            doc.y = 110;
        }

        // Date and Address
        doc.fontSize(10)
            .font('Helvetica')
            .text(formatDate(formData.date), 450, 130);

        doc.fontSize(10)
            .font('Helvetica')
            .text('To,', 72, 130);

        doc.text(`Mr. ${formData.candidateName},`, 72, 145);

        // Split address into lines if needed
        const addressLines = (formData.address || '').split('\n');
        let addressY = 160;
        addressLines.forEach(line => {
            doc.text(line, 72, addressY);
            addressY += 15;
        });

        // Offer Letter Title
        doc.fontSize(11)
            .font('Helvetica-Bold')
            .text(`Offer Cum Appointment Letter for the position of ${formData.designation}`, 72, addressY + 10, {
                width: 468,
                underline: true
            });

        // Greeting
        doc.fontSize(10)
            .font('Helvetica')
            .text(`Dear ${formData.candidateName ? formData.candidateName.split(' ')[0] : ''},`, 72, addressY + 40);

        // Main content
        const mainContent = `With reference to your application and subsequent interview held, we are pleased to offer you the above post at annual CTC of Rs.${(Number(formData.yearlyCTC) || 0).toLocaleString('en-IN')}/- (details as per annexure - I) on the broad terms and conditions listed below :-`;

        doc.text(mainContent, 72, addressY + 60, {
            width: 468,
            align: 'justify'
        });

        // Job details
        doc.fontSize(10)
            .font('Helvetica-Bold')
            .text('Designation :', 72, addressY + 130);
        doc.font('Helvetica')
            .text(formData.designation, 200, addressY + 130);

        doc.font('Helvetica-Bold')
            .text('Joining Date :', 72, addressY + 145);
        doc.font('Helvetica')
            .text(formatDate(formData.joiningDate), 200, addressY + 145);

        doc.font('Helvetica-Bold')
            .text('Location :', 72, addressY + 160);
        doc.font('Helvetica')
            .text(formData.location, 200, addressY + 160);

        // INFORMATION SECURITY Section
        doc.fontSize(11)
            .font('Helvetica-Bold')
            .text('INFORMATION SECURITY', 72, addressY + 190, {
                underline: true
            });

        const infoSecurityText = `All employees are expected to maintain the confidentiality and integrity of the information assets and comply with the Information Security Policies. Employees are expected to maintain confidentiality of information residing in mobile computing devices such as portable laptops, palmtops, other transportable computers and storage media. The employees are responsible for all information security matters outside the premises of organization and outside the normal working hours. Information, data stored in laptop, computers, etc is assets of the company and you shall use them only for laptops and also after the service period is over. In case you leave the job or your service terminated, you shall hand over all such information assets, data etc. to the Company and shall not carry with you, under any circumstances.`;

        doc.fontSize(9)
            .font('Helvetica')
            .text(infoSecurityText, 72, addressY + 215, {
                width: 468,
                align: 'justify'
            });

        // PROBATION & BOND Section
        doc.fontSize(11)
            .font('Helvetica-Bold')
            .text('PROBATION & BOND', 72, addressY + 315, {
                underline: true
            });

        doc.fontSize(9)
            .font('Helvetica')
            .text(formData.probation, 72, addressY + 335, {
                width: 468,
                align: 'justify'
            });

        // NOTICE FOR TERMINATION Section
        doc.fontSize(11)
            .font('Helvetica-Bold')
            .text('NOTICE FOR TERMINATION', 72, Math.max(doc.y + 20, addressY + 395), {
                underline: true
            });

        // ==================== PAGE 2 ====================
        doc.addPage();

        let page2Y = 50;

        const terminationText1 = `During the probation, your services can be terminated without any notice and without assigning any reason. You may leave the employment by giving one (1) month's notice or salary in lieu of such notice during the probation. However on or after confirmation, this contract of service can be terminated by Company on giving one month's prior written notice or payment in lieu of such notice. After confirmation, you may also leave the employment after giving three (3) months' notice or salary in lieu of such notice.`;

        doc.fontSize(9)
            .font('Helvetica')
            .text(terminationText1, 72, page2Y, {
                width: 468,
                align: 'justify'
            });

        const terminationText2 = `Further, in case of termination of services by the Company or you leaving the Company by resigning due to any reason whatsoever, you covenant and agree that for a period of two (2) years following separation date , you will not solicit or attempt to solicit, contact or indirectly or by assisting others, any employee, vendor, customer or consultant or affiliated with the company in any manner, whatsoever. You will not make any attempt or approach whatsoever, to connect or work with any of the existing employee, vendor, consultant , customer or any person affiliated with the company in any manner, whatsoever. In case of violation of this clause you will be personally responsible for any direct, indirect or consequences losses to company and the Company reserve the right to take all available legal actions as per the law of the land to recover such losses, whatsoever.`;

        doc.text(terminationText2, 72, page2Y + 90, {
            width: 468,
            align: 'justify'
        });

        // KRA & SLA Section
        doc.fontSize(11)
            .font('Helvetica-Bold')
            .text('KRA & SLA', 72, page2Y + 220, {
                underline: true
            });

        const kraText = `Your 'Key Responsibilities Area's' & ' Service Level Agreement' (will be shared in due course ) which will define your role, responsibilities and targets for your appointment in the company and the salary to be paid to you is based on the same and the same is the part of this appointment letter and is binding upon you. Hence, its your prime responsibility to fulfill these KPI & SLA as per the expectations of the company. You are also expected to submit the work done by you to the company and report to management on monthly basis for the review and analysis of your performance.`;

        doc.fontSize(9)
            .font('Helvetica')
            .text(kraText, 72, page2Y + 240, {
                width: 468,
                align: 'justify'
            });

        // JOINING REQUIREMENT Section
        doc.fontSize(11)
            .font('Helvetica-Bold')
            .text('JOINING REQUIREMENT', 72, page2Y + 330, {
                underline: true
            });

        doc.fontSize(9)
            .font('Helvetica')
            .text('You are required to contact HR Department on the date of joining. We would be require you to submit the self-attested photocopies of following documents to the HR Dept. on the day of your joining: -', 72, page2Y + 350, {
                width: 468,
                align: 'justify'
            });

        // Bullet points
        const requirements = [
            'Two recent passport size photograph.',
            'Photocopies of all your educational and other professional qualifications.',
            'Relieving letter and Acceptance of resignation from your Last Employer.',
            'Offer letter or Appointment letter of Last company.',
            'Address Proof.',
            'Your identification proof.',
            'Police Verification.',
            'Two (2) character reference (other than your relative) of your good behaviour/character.'
        ];

        let reqY = page2Y + 380;
        requirements.forEach(req => {
            doc.fontSize(9)
                .font('Helvetica')
                .text('•', 85, reqY);
            doc.text(req, 100, reqY, { width: 440 });
            reqY += 15;
        });

        const disclaimerText = `This offer for appointment given to you by the Company is subject to successful completion of background verification and submission of all facts, particulars details and documents submitted by you. Submission of any wrong or false facts/particulars/details or fake/forged documents or any other falsification of any particulars including but not limited to, suppression of any of the facts details/particulars/documents shall result in automatic disqualification from further consideration of your candidature, withdrawal of offer or immediate termination from employment without recourse. This is without prejudice to all other rights and remedies, which the company may have against you.`;

        doc.fontSize(9)
            .font('Helvetica')
            .text(disclaimerText, 72, reqY + 10, {
                width: 468,
                align: 'justify'
            });

        const liabilityText = `Further, in such an event, you shall be responsible to pay for all financial expenses and damage incurred by M/s Cogent Logistics Private Limited in your training, dislocation of customer projects, and any direct, indirect, and consequential costs. You shall also not claim any compensation from M/s Cogent Logistics Private Limited in above circumstance.`;

        doc.text(liabilityText, 72, reqY + 90, {
            width: 468,
            align: 'justify'
        });

        // ==================== PAGE 3 ====================
        doc.addPage();

        let page3Y = 50;

        const employmentText = `The employment is offered on the project basis and as per Cogent's agreement/projects with their customer and in case the agreement expired / terminated the employment may be stand terminated automatically. Also, Cogent may transfer / terminate the employee as per business compulsions / requirements with or without assigning any reason.`;

        doc.fontSize(9)
            .font('Helvetica')
            .text(employmentText, 72, page3Y, {
                width: 468,
                align: 'justify'
            });

        const termsText = `The Company reserves the right to change the terms and conditions of employment and its policies and procedures at any time. Should you require further information or have any queries, please do not hesitate to contact.`;

        doc.text(termsText, 72, page3Y + 60, {
            width: 468,
            align: 'justify'
        });

        const closingText = `We are quite excited about your decision to join the Company and wish you a long and successful career with our company. We look forward to working with you in building M/s Cogent Logistics Private Limited to be a premier Company in India.`;

        doc.text(closingText, 72, page3Y + 110, {
            width: 468,
            align: 'justify'
        });

        doc.text('Yours', 72, page3Y + 170);
        doc.text('For Cogent Logistics Pvt Ltd', 72, page3Y + 200);

        // Authorised Signatory Signature
        try {
            const signatoryBuffer = await getBlobBuffer('assets/authorised_signatory.png');
            // Place signature image above the text
            doc.image(signatoryBuffer, 72, page3Y + 215, { width: 120, height: 40 });
            doc.fontSize(10)
                .font('Helvetica-Oblique')
                .text('(Authorised Signatory)', 72, page3Y + 260);
        } catch (signatoryError) {
            console.warn('Failed to load signatory image from Azure, using fallback text:', signatoryError);
            doc.fontSize(10)
                .font('Helvetica-Oblique')
                .text('(Authorised Signatory)', 72, page3Y + 260);
        }

        // Separator line
        doc.moveTo(72, page3Y + 300).lineTo(540, page3Y + 300).stroke();

        // Acceptance Section
        doc.fontSize(11)
            .font('Helvetica-Bold')
            .text('Acceptance of Offer Cum Appointment Letter', 72, page3Y + 320);

        doc.fontSize(10)
            .font('Helvetica')
            .text('Signature :', 72, page3Y + 360);
        doc.text('Date :', 350, page3Y + 360);

        // Add candidate signature if provided
        if (formData.candidateSignature) {
            try {
                // Remove data URL prefix if present
                const base64Data = formData.candidateSignature.replace(/^data:image\/\w+;base64,/, '');
                const imageBuffer = Buffer.from(base64Data, 'base64');

                // Add image to PDF directly from buffer
                doc.image(imageBuffer, 150, page3Y + 345, { width: 100, height: 40 });
            } catch (err: any) {
                console.error('Error adding signature image:', err.message);
            }
        }

        doc.text(formatDate(formData.acceptanceDate), 400, page3Y + 360);

        doc.text('Name :', 72, page3Y + 380);
        doc.text(formData.acceptanceCandidateName, 150, page3Y + 380);

        doc.text('Aadhar No.', 350, page3Y + 380);
        doc.text(formData.aadhaarNumber, 420, page3Y + 380);

        // ==================== ANNEXURE - I ====================
        doc.addPage();

        let annexureY = 50;

        doc.fontSize(12)
            .font('Helvetica-Bold')
            .text('Annexure - I', 250, annexureY, { align: 'center' });

        doc.fontSize(10)
            .font('Helvetica-Oblique')
            .text(`(Calculation Basis: ${formData.calculationBasis})`, 250, annexureY + 15, { align: 'center' });

        annexureY += 45;

        // Create salary table
        const tableTop = annexureY;
        const col1X = 72;
        const col2X = 300;
        const col3X = 400;
        const col4X = 480;
        const rowHeight = 20;

        // Table header
        doc.rect(col1X, tableTop, 468, rowHeight).stroke();
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('S.No.', col1X + 5, tableTop + 5);
        doc.text('Description', col1X + 50, tableTop + 5);
        doc.text('Per Month', col2X + 5, tableTop + 5);
        doc.text('Yearly', col4X + 5, tableTop + 5);

        let currentY = tableTop + rowHeight;

        // Salary components
        const basic = Number(formData.basicSalary) || 0;
        const hra = Number(formData.hra) || 0;
        const other = Number(formData.otherAllowances) || 0;
        const bonus = Number(formData.performanceBonus) || 0;
        const leaveEnc = Number(formData.leaveEncashment) || 0;
        const advBonus = Number(formData.advanceBonus) || 0;
        const gross = Number(formData.grossSalary) || 0;

        const emyPF = Number(formData.emyPF) || 0;
        const emyESIC = Number(formData.emyESIC) || 0;
        const pTax = Number(formData.pTax) || 0;
        const lwfEE = Number(formData.lwfEmployee) || 0;

        const netAmount = Number(formData.netAmount) || 0;

        const emrPF = Number(formData.emrPF) || 0;
        const emrAdmin = Number(formData.emrAdminCharges) || 0;
        const emrESIC = Number(formData.emrESIC) || 0;
        const lwfER = Number(formData.lwfEmployer) || 0;
        const gratuity = Number(formData.gratuity) || 0;
        const totalEMR = Number(formData.totalEMRContribution) || 0;
        const yearlyCtc = Number(formData.yearlyCTC) || 0;

        const salaryData = [
            { sno: 'I', desc: 'Basic', monthly: basic, yearly: basic * 12 },
            { sno: '', desc: 'HRA (50% of Basic)', monthly: hra, yearly: hra * 12 },
            { sno: '', desc: 'Other Allowances', monthly: other, yearly: other * 12 },
            { sno: '', desc: 'Statutory Bonus (8.33% of Basic)', monthly: bonus, yearly: bonus * 12 },
            { sno: '', desc: 'Monthly Leave Encashment', monthly: leaveEnc, yearly: leaveEnc * 12 },
            { sno: '', desc: 'Advance Bonus', monthly: advBonus, yearly: advBonus * 12 },
            { sno: '', desc: 'Gross Salary (Monthly Rate)', monthly: gross, yearly: gross * 12, highlight: true },
            { sno: '', desc: '', monthly: '', yearly: '' },
            { sno: 'II', desc: 'Deductions (Employee Contribution)', monthly: '', yearly: '' },
            { sno: '', desc: 'Employee PF (12%)', monthly: emyPF, yearly: emyPF * 12 },
            { sno: '', desc: `Employee ESIC (${formData.esicCovered === 'Yes' ? '0.75%' : 'N/A'})`, monthly: emyESIC, yearly: emyESIC * 12 },
            { sno: '', desc: 'Professional Tax', monthly: pTax, yearly: pTax * 12 },
            { sno: '', desc: 'Labour Welfare Fund (EE)', monthly: lwfEE, yearly: lwfEE * 12 },
            { sno: '', desc: 'Total Deductions', monthly: Number(formData.totalDeductions), yearly: Number(formData.totalDeductions) * 12 },
            { sno: '', desc: 'Net Take Home Salary (Approx)', monthly: netAmount, yearly: netAmount * 12, highlight: true },
            { sno: '', desc: '', monthly: '', yearly: '' },
            { sno: 'III', desc: 'Employer Contribution', monthly: '', yearly: '' },
            { sno: '', desc: 'Employer PF (12%)', monthly: emrPF, yearly: emrPF * 12 },
            { sno: '', desc: 'PF Admin Charges (1%)', monthly: emrAdmin, yearly: emrAdmin * 12 },
            { sno: '', desc: `Employer ESIC (${formData.esicCovered === 'Yes' ? '3.25%' : 'N/A'})`, monthly: emrESIC, yearly: emrESIC * 12 },
            { sno: '', desc: 'Labour Welfare Fund (ER)', monthly: lwfER, yearly: lwfER * 12 },
            { sno: '', desc: 'Gratuity (4.81% of Basic)', monthly: gratuity, yearly: gratuity * 12 },
            { sno: '', desc: 'Total Employer Contribution', monthly: totalEMR, yearly: totalEMR * 12 },
            { sno: '', desc: '', monthly: '', yearly: '' },
            { sno: '', desc: 'Annual CTC (Gross + Employer Cont.)', monthly: formData.monthlyCTC, yearly: yearlyCtc, highlight: true }
        ];

        doc.font('Helvetica');
        salaryData.forEach((row, index) => {
            if (row.highlight) {
                doc.rect(col1X, currentY, 468, rowHeight).fillAndStroke('#f0f0f0', '#000000');
                doc.fillColor('#000000').font('Helvetica-Bold');
            } else {
                doc.rect(col1X, currentY, 468, rowHeight).stroke();
                doc.fillColor('#000000').font('Helvetica');
            }

            doc.fontSize(8);
            if (row.sno) doc.text(row.sno, col1X + 5, currentY + 5);
            doc.text(row.desc, col1X + 50, currentY + 5);
            if (row.monthly !== '') doc.text(typeof row.monthly === 'number' ? Math.round(row.monthly).toLocaleString('en-IN') : row.monthly, col2X + 50, currentY + 5);
            if (row.yearly !== '') doc.text(typeof row.yearly === 'number' ? Math.round(row.yearly).toLocaleString('en-IN') : row.yearly, col4X + 5, currentY + 5);

            currentY += rowHeight;
            doc.fillColor('#000000');
        });

        doc.end();

        doc.on('end', async () => {
            try {
                const pdfData = Buffer.concat(buffers);
                const blobName = await uploadBufferToBlob(pdfData, fileName, 'pdfs/', 'application/pdf');
                const webPath = getBlobUrl(blobName);

                // Insert into database BEFORE sending the PDF
                const [result] = await pool.query<ResultSetHeader>(
                    `INSERT INTO hrms_offer_letters 
                    (candidate_name, employee_id, designation, generated_date, joining_date, status, monthly_ctc, yearly_ctc, offer_data, pdf_path) 
                    VALUES (?, ?, ?, ?, ?, 'Draft', ?, ?, ?, ?)`,
                    [
                        formData.candidateName,
                        formData.employeeId,
                        formData.designation,
                        formData.date,
                        formData.joiningDate,
                        formData.monthlyCTC,
                        formData.yearlyCTC,
                        JSON.stringify(formData),
                        webPath
                    ]
                );

                console.log(`Offer letter created with ID: ${result.insertId}`);

                // Set headers for PDF download
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                res.setHeader('Content-Length', pdfData.length);
                res.setHeader('X-Offer-Letter-Id', result.insertId.toString());
                res.setHeader('Access-Control-Expose-Headers', 'X-Offer-Letter-Id');

                // Stream the file directly from memory
                res.send(pdfData);
            } catch (dbError: any) {
                console.error('Error saving offer letter to database:', dbError);
                res.status(500).json({
                    success: false,
                    message: 'Failed to save offer letter to database',
                    error: dbError.message
                });
            }
        });

        doc.on('error', (error) => {
            console.error('Error generating offer letter PDF:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate PDF',
                error: error.message
            });
        });

    } catch (error: any) {
        console.error('Error in generateOfferLetterPDF:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate offer letter PDF',
            error: error.message
        });
    }
};

/**
 * Get all offer letters
 */
export const getOfferLetters = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query<OfferLetterRecord[]>(
            `SELECT id, candidate_name, employee_id, designation, generated_date, 
                    status, pdf_path, monthly_ctc, yearly_ctc, created_at, updated_at 
             FROM hrms_offer_letters 
             ORDER BY created_at DESC`
        );

        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error: any) {
        console.error('Error fetching offer letters:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch offer letters',
            error: error.message
        });
    }
};

/**
 * Get offer letter by ID
 */
export const getOfferLetterById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query<OfferLetterRecord[]>(
            'SELECT * FROM hrms_offer_letters WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Offer letter not found'
            });
        }

        // Parse offer_data if it's a string (though mysql2 usually handles JSON columns if configured)
        // But since we selected all, and mysql2 might return JSON as object or string depending on config.
        // We know we sent it as stringified JSON.
        // If the column type is JSON, mysql2 returns object.

        res.status(200).json({
            success: true,
            data: rows[0]
        });
    } catch (error: any) {
        console.error('Error fetching offer letter:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch offer letter',
            error: error.message
        });
    }
};

/**
 * Update offer letter status
 */
export const updateOfferLetterStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, employeeId } = req.body;

        if (!['Draft', 'Sent', 'Viewed', 'Accepted'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        if (employeeId) {
            await pool.query(
                'UPDATE hrms_offer_letters SET status = ?, employee_id = ? WHERE id = ?',
                [status, employeeId, id]
            );
        } else {
            await pool.query(
                'UPDATE hrms_offer_letters SET status = ? WHERE id = ?',
                [status, id]
            );
        }

        res.status(200).json({
            success: true,
            message: 'Status updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating offer letter status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update status',
            error: error.message
        });
    }
};

/**
 * Delete offer letter
 */
export const deleteOfferLetter = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Get file path first
        const [rows] = await pool.query<OfferLetterRecord[]>(
            'SELECT pdf_path FROM hrms_offer_letters WHERE id = ?',
            [id]
        );

        if (rows.length > 0) {
            const filePath = rows[0].pdf_path;
            if (filePath && filePath.includes('blob.core.windows.net')) {
                try {
                    // Extract blob name from Azure URL
                    const urlParts = filePath.split('/');
                    const tmsfilesIndex = urlParts.indexOf('tmsfiles');
                    const blobName = urlParts.slice(tmsfilesIndex + 1).join('/');
                    if (blobName) {
                        await deleteBlob(blobName);
                        console.log(`[Delete Offer Letter] Deleted blob from Azure: ${blobName}`);
                    }
                } catch (deleteError) {
                    console.warn('Failed to delete offer letter from Azure Storage:', deleteError);
                }
            }
        }

        await pool.query('DELETE FROM hrms_offer_letters WHERE id = ?', [id]);

        res.status(200).json({
            success: true,
            message: 'Offer letter deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting offer letter:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete offer letter',
            error: error.message
        });
    }
};

/**
 * Get offer letters for the logged-in employee
 */
export const getMyOfferLetters = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params; // In a real app, this would come from the auth token

        if (!employeeId) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID is required'
            });
        }

        const [rows] = await pool.query<OfferLetterRecord[]>(
            `SELECT id, candidate_name, designation, generated_date, 
                    status, pdf_path, monthly_ctc, yearly_ctc, created_at, updated_at 
             FROM hrms_offer_letters 
             WHERE employee_id = ? AND status != 'Draft'
             ORDER BY created_at DESC`,
            [employeeId]
        );

        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error: any) {
        console.error('Error fetching my offer letters:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch offer letters',
            error: error.message
        });
    }
};
