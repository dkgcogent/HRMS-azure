import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import path from 'path';
import pool from '../db';
import { uploadBufferToBlob, getBlobUrl, getBlobBuffer } from '../services/azureBlobService';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface AppointmentLetterData {
    candidateName: string;
    address: string;
    date: string;
    designation: string;
    location: string;
    joiningDate: string;
    calculationBasis: 'New Government Rule' | 'Old Basis';
    esicCovered: 'Yes' | 'No';
    basicSalary: number;
    hra: number;
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
    acceptanceCandidateName: string;
    aadhaarNumber: string;
    acceptanceDate: string;
    candidateSignature: string | null;
    probation: string;
    employeeId: number | null;

    // Custom Appointment Letter Fields
    referenceNumber: string;
    dob: string;
    baseLocation: string;
    ctcWord?: string;
    email?: string;
    phone?: string;
}

interface AppointmentLetterRecord extends RowDataPacket {
    id: number;
    candidate_name: string;
    employee_id: number | null;
    designation: string;
    generated_date: string;
    status: 'Draft' | 'Sent' | 'Viewed' | 'Accepted';
    pdf_path: string;
    appointment_data: AppointmentLetterData | string;
    created_at: Date;
    updated_at: Date;
}

/**
 * Helper to format date
 */
const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Helper to format currency values for PDF cells
 */
const formatCellValPDF = (val: any): string => {
    if (val === undefined || val === null || val === '') return '-';
    const num = Number(val);
    if (isNaN(num) || num === 0) return '-';
    return Math.round(num).toLocaleString('en-IN');
};


/**
 * Generate Appointment Letter PDF
 */
export const generateAppointmentLetterPDF = async (req: Request, res: Response) => {
    try {
        const formData: AppointmentLetterData = req.body;
        const showAnnexure = req.body.showAnnexure !== false; // Default to true if not provided

        if (!formData.candidateName || !formData.designation || !formData.joiningDate) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const fileName = `Appointment_Letter_${formData.candidateName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

        // Create PDF document
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 50, bottom: 50, left: 72, right: 72 }
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));

        // ==================== PAGE 1 ====================
        // Reference Number & Date
        doc.fontSize(11).font('Times-Bold').fillColor('#000000');
        doc.text(formData.referenceNumber || 'CLPL/xx-xx/xxx', 72, 160);
        doc.font('Times-Roman').text(`Date : ${formatDate(formData.date)}`, 430, 160);

        // To Section
        doc.fontSize(11).font('Times-Roman').text('To,', 72, 190);
        doc.font('Times-Bold').text(`Mr./Miss. ${formData.candidateName}`, 72, 205);

        const addressLines = (formData.address || '').split('\n');
        let addressY = 220;
        addressLines.forEach(line => {
            doc.font('Times-Roman').text(line, 72, addressY);
            addressY += 15;
        });

        // Title
        doc.fontSize(13)
            .font('Times-Bold')
            .text('APPOINTMENT LETTER', 72, addressY + 20, { align: 'center', underline: true });

        // Greeting
        doc.fontSize(12)
            .font('Times-Roman')
            .text(`Dear ${formData.candidateName ? formData.candidateName.split(' ')[0] : ''},`, 72, addressY + 50);

        // Main Text Intro
        const introText = 'This has reference to your application and the subsequent discussions you had with us. We are pleased to appoint you on the following terms and conditions:';
        doc.fontSize(12).font('Times-Roman').text(introText, 72, addressY + 70, { width: 451, align: 'justify' });

        // Points 1 - 5 (Page 1)
        doc.y = addressY + 110;

        // 1. Position
        doc.font('Times-Bold').text('1.   Position: ', { continued: true })
            .font('Times-Roman').text(`You are being appointed as "${formData.designation}".`, { width: 451, align: 'justify' });
        doc.y += 14;

        // 2. Location
        doc.font('Times-Bold').text('2.   ', { continued: true })
            .font('Times-Roman').text(`You will be initially based at ${formData.baseLocation || formData.location}.`, { width: 451, align: 'justify' });
        doc.y += 14;

        // 3. Fitness
        doc.font('Times-Bold').text('3.   ', { continued: true })
            .font('Times-Roman').text('Your appointment is subject to you being medically fit at all times.', { width: 451, align: 'justify' });
        doc.y += 14;

        // 4. Joining Date
        doc.font('Times-Bold').text('4.   Date of Appointment: ', { continued: true })
            .font('Times-Roman').text(formatDate(formData.joiningDate), { width: 451, align: 'justify' });
        doc.y += 14;

        // 5. Salary & CTC
        doc.font('Times-Bold').text('5.   Compensation and Benefits: ', { continued: true })
            .font('Times-Roman').text(`You will receive compensation of Rs. ${(Number(formData.yearlyCTC) || 0).toLocaleString('en-IN')} /- (Rupees ${formData.ctcWord}) per annum as outlined in the attached sheet (Annexure-I). Income Tax or any other statutory deductions will be done at source. You will be eligible for leave and other such benefits in accordance with the Company’s rules and regulations. The perquisites applicable to your grade are subject to alteration and amendment, and you will be entitled to the same as per the rules of the company. It is in the terms and conditions that your salary should be kept confidential and should not be disclosed to anyone in or outside the organization.`, { width: 451, align: 'justify' });
        doc.y += 18;

        // 6. Posting & Transfer
        doc.fontSize(12).font('Times-Bold').text('6.   Posting & Transfer: ', { continued: true })
            .font('Times-Roman').text('Your place of work, in the first instant, is as indicated above. However, you can be transferred temporarily or permanently for duty anywhere in India, depending upon the needs of the organization. Your service may be transferred to any office of the Company or its associate organizations in the country depending upon the exigencies of work. You will be governed by the transfer rules prevailing in the company at any given point of time.', { width: 451, align: 'justify' });
        doc.y += 16;

        // 7. Probation
        doc.font('Times-Bold').text('7.   Probation: ', { continued: true })
            .font('Times-Roman').text('You will be on probation for a period of 6 months, from your date of joining, after which your performance will be appraised. You will be confirmed in your appointment in writing on successful completion of the said probationary period. It may get extended by further period of 6 months if your performance is not found satisfactory. If no confirmation is made in writing at the end of the probationary period, it will be deemed to have been extended until the company confirms you in writing.', { width: 451, align: 'justify' });

        // ==================== PAGE 2 ====================
        doc.addPage();
        doc.y = 150;

        // 8. Termination (Probation)
        doc.fontSize(12).font('Times-Bold').text('8.   ', { continued: true })
            .font('Times-Roman').text('During the probation period either party may terminate this agreement by giving 07 days’ notice or salary in lieu thereof is given.', { width: 451, align: 'justify' });
        doc.y += 16;

        // 9. Notice Period
        doc.font('Times-Bold').text('9.   Notice period: ', { continued: true })
            .font('Times-Roman').text('After confirmation, either party, by stating their intention to do so, in writing may terminate this employment at any time, provided that at least two month’s notice or salary in lieu thereof is given.', { width: 451, align: 'justify' });
        doc.y += 16;

        // 10. Misconduct
        doc.font('Times-Bold').text('10.  ', { continued: true })
            .font('Times-Roman').text('However, in the event of you being guilty of misconduct or inattention or negligence in the discharge of your duties or in the conduct of the Company’s business, or such misdemeanor which is likely to affect, or affects the reputation of the Company’s working or of any breach of the terms and conditions herein, the Company reserves its right to terminate your services at any given point of time, with immediate effect, without any compensation or notice.', { width: 451, align: 'justify' });
        doc.y += 16;

        // 11. Date of Birth
        doc.font('Times-Bold').text('11.  Date of Birth: ', { continued: true })
            .font('Times-Roman').text(`The date of birth declared by you is ${formatDate(formData.dob)} and you will be bound by this date of birth in all service matters with the Company.`, { width: 451, align: 'justify' });
        doc.y += 16;

        // 12. Retirement Age
        doc.font('Times-Bold').text('12.  Retirement Age: ', { continued: true })
            .font('Times-Roman').text('You will retire from the services of the Company on attaining the age of 58 years.', { width: 451, align: 'justify' });
        doc.y += 16;

        // 13. Confidentiality
        doc.font('Times-Bold').text('13.  ', { continued: true })
            .font('Times-Roman').text("You will treat matters pertaining to the Company's business interests with utmost confidentiality and such confidentiality has to be maintained during your employment with the Company and thereafter.", { width: 451, align: 'justify' });
        doc.y += 16;

        // 14. Governing Rules
        doc.font('Times-Bold').text('14.  ', { continued: true })
            .font('Times-Roman').text('During your services with the company, you will be governed by the rules and regulations in respect to conduct & discipline and other matters as may be framed by the company from time to time.', { width: 451, align: 'justify' });
        doc.y += 16;

        // 15. Company Interest
        doc.fontSize(12).font('Times-Bold').text('15.  ', { continued: true })
            .font('Times-Roman').text('You will not, at any time, work against the interest of the company or otherwise act, in the manner, which may adversely affect the interest of the Company. You shall work conscientiously in the interest of the Management and shall utilize your ordinary prudence and intelligence in the discharge of the duties. Any violation of this norm shall constitute a gross misconduct for which the Management shall be competent to terminate your services.', { width: 451, align: 'justify' });
        doc.y += 16;

        // 16. Performance Reviews
        doc.font('Times-Bold').text('16.  ', { continued: true })
            .font('Times-Roman').text('Your increment and future prospects in the company shall extremely depend on your efficiency, hard work, regular attendance punctuality, sincerely good conduct, company performance and such other relevant as adjudged by the management. Generally, employee’s performance is reviewed once a year.', { width: 451, align: 'justify' });

        // ==================== PAGE 3 ====================
        doc.addPage();
        doc.y = 150;

        // 17. Restrictive Covenants
        doc.fontSize(12).font('Times-Bold').text('17.  ', { continued: true })
            .font('Times-Roman').text('You will undertake, that while in the employment of the Company, and for a period of 12 months after separation from the Company, for any reason whatsoever, you will:', { width: 451, align: 'justify' });
        doc.y += 14;

        const bullet1 = `I. Keep confidential and not disclose to any unauthorized persons\n  (a) All Company information, business and financial interests,\n  (b) Company intelligence, consisting of sensitive research, either acquired or in the process of being carried out\n  (c) Technical capability and\n  (d) Commercial intelligence disclosed to you and/ or acquired by you in the course of your employment.`;
        doc.font('Times-Roman').text(bullet1, 102, doc.y, { width: 421, align: 'justify' });
        doc.y += 14;

        const bullet2 = `II. Not employ, use and/ or engage the confidential information for any purposes other than the business of the Company and only during the course of your employment with the Company.`;
        doc.text(bullet2, 102, doc.y, { width: 421, align: 'justify' });
        doc.y += 14;

        const bullet3 = `III. Not seek or obtain employment or consultancy directly or indirectly with any other Company entity/ organization or their associates/ affiliates, which is in competition with Company Name Cogent Logistics Pvt Ltd.`;
        doc.text(bullet3, 102, doc.y, { width: 421, align: 'justify' });
        doc.y += 14;

        const bullet4 = `IV. Solicit or endeavor to entice any employee or person involved, directly or indirectly, from any of the Company's operations.`;
        doc.text(bullet4, 102, doc.y, { width: 421, align: 'justify' });
        doc.y += 18;

        // 18. Exclusive Service
        doc.font('Times-Bold').text('18.  ', { continued: true })
            .font('Times-Roman').text('You are employed in the Company full time. You will not be employed by any other Company or offer your services with or without pay to any physical person, legal entity or public authority or to be occupied in your own business without the prior written permission of the Company.', { width: 451, align: 'justify' });
        doc.y += 16;

        // 19. Amendments
        doc.font('Times-Bold').text('19.  ', { continued: true })
            .font('Times-Roman').text('Amendments to the above terms and conditions, if any will be made in writing.', { width: 451, align: 'justify' });
        doc.y += 16;

        // 20. Duplicate Copy
        doc.font('Times-Bold').text('20.  ', { continued: true })
            .font('Times-Roman').text('Please sign and return the duplicate copy of this letter of appointment (initialing each page) as a token of your acceptance the above terms and conditions.', { width: 451, align: 'justify' });
        doc.y += 24;

        // Best wishes & Signatures
        doc.font('Times-Roman').text('Wish you all the very best in your new assignment.', 72, doc.y);
        doc.text('Thanking You', 72, doc.y + 20);

        const sigY = doc.y + 45;
        doc.font('Times-Bold').text('For Cogent Logistics Pvt Ltd', 72, sigY);
        doc.text('Accepted & Agreed', 380, sigY);

        // Signatures placement

        if (formData.candidateSignature) {
            try {
                const base64Data = formData.candidateSignature.replace(/^data:image\/\w+;base64,/, '');
                const imageBuffer = Buffer.from(base64Data, 'base64');
                doc.image(imageBuffer, 380, sigY + 15, { width: 100, height: 30 });
            } catch (e) { }
        }

        doc.fontSize(10).font('Times-Italic')
            .text('(Authorized Signatory)', 72, sigY + 55);
        doc.text('(Name & Signature)', 380, sigY + 55);

        if (!showAnnexure) {
            doc.end();
        } else {
            // ==================== PAGE 4 ====================
            doc.addPage();
            let annexureY = 150;

            doc.fontSize(12).font('Times-Bold').text('ANNEXURE - I (Salary Breakup Details)', 72, annexureY, { align: 'center', underline: true });
            doc.fontSize(10).font('Times-Italic').text(`Candidate Name: Mr./Ms. ${formData.candidateName || '...............................'}`, 72, annexureY + 18, { align: 'center' });

            annexureY += 45;

            // Table drawing
            const tableTop = annexureY;
            const col1X = 72;
            const col1Width = 38;
            const col2Width = 242;
            const col3Width = 94;
            const col4Width = 94;
            const rowHeight = 20;

            const cellX = [
                col1X,
                col1X + col1Width,
                col1X + col1Width + col2Width,
                col1X + col1Width + col2Width + col3Width
            ];
            const cellWidth = [
                col1Width,
                col2Width,
                col3Width,
                col4Width
            ];

            // Draw Table Header
            doc.save();
            const headerY = tableTop;
            for (let c = 0; c < 4; c++) {
                doc.fillColor('#f0f4ff').rect(cellX[c], headerY, cellWidth[c], rowHeight).fill();
                doc.strokeColor('#000000').lineWidth(0.5).rect(cellX[c], headerY, cellWidth[c], rowHeight).stroke();
            }

            doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9);
            doc.text('S.No.', cellX[0] + 8, headerY + 5.5);
            doc.text('Description', cellX[1] + 8, headerY + 5.5);
            doc.text('Per Month (₹)', cellX[2], headerY + 5.5, { width: cellWidth[2] - 8, align: 'right' });
            doc.text('Yearly (₹)', cellX[3], headerY + 5.5, { width: cellWidth[3] - 8, align: 'right' });
            doc.restore();

            let currentTableY = headerY + rowHeight;

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
            const monthlyCTC = Number(formData.monthlyCTC) || 0;

            const salaryData = [
                // Section I
                { sno: 'I', desc: 'Basic', monthly: basic, yearly: basic * 12, isBasicRow: true },
                { sno: '', desc: 'HRA', monthly: hra, yearly: hra * 12 },
                { sno: '', desc: 'Other Allowances', monthly: other, yearly: other * 12 },
                { sno: '', desc: 'Monthly_Leave_Encashment', monthly: leaveEnc, yearly: leaveEnc * 12 },
                { sno: '', desc: 'Advance_Bonus', monthly: advBonus, yearly: advBonus * 12 },
                { sno: '', desc: 'Gross Salary on Pay Slip (A)', monthly: gross, yearly: gross * 12, highlight: true },
                // Spacer
                { sno: '', desc: '', monthly: '', yearly: '', isSpacer: true },
                // Section II
                { sno: 'II', desc: 'P.F.Deduction (Self Contribution)', monthly: emyPF, yearly: emyPF * 12, isSectionHeaderRow: true },
                { sno: '', desc: 'ESI Deduction (Self Contribution)', monthly: emyESIC, yearly: emyESIC * 12 },
                { sno: '', desc: 'Professional Tax', monthly: pTax, yearly: pTax * 12 },
                { sno: '', desc: 'Labor Welfare Fund', monthly: lwfEE, yearly: lwfEE * 12 },
                { sno: '', desc: 'Gross Deduction (B)', monthly: Number(formData.totalDeductions), yearly: Number(formData.totalDeductions) * 12, highlight: true },
                { sno: '', desc: 'Employee Take Home Salary (C=A-B)', monthly: netAmount, yearly: netAmount * 12, blackRow: true },
                // Spacer
                { sno: '', desc: '', monthly: '', yearly: '', isSpacer: true },
                // Section III
                { sno: 'III', desc: "P.F.Deduction (Company's Contribution)", monthly: emrPF + emrAdmin, yearly: (emrPF + emrAdmin) * 12, isSectionHeaderRow: true },
                { sno: '', desc: "ESI Deduction (Company's Contribution)", monthly: emrESIC, yearly: emrESIC * 12 },
                { sno: '', desc: 'Gratuity', monthly: gratuity, yearly: gratuity * 12 },
                { sno: '', desc: 'Labor Welfare Fund', monthly: lwfER, yearly: lwfER * 12 },
                { sno: '', desc: "Company's Additional Cost", monthly: totalEMR, yearly: totalEMR * 12, highlight: true },
                { sno: '', desc: 'Total CTC of Company', monthly: monthlyCTC, yearly: yearlyCtc, blackRow: true }
            ];

            salaryData.forEach((row, rowIndex) => {
                doc.save();

                // Determine background colors for the 4 cells in this row
                let bgColors = ['#ffffff', '#ffffff', '#ffffff', '#ffffff'];

                if (row.isSpacer) {
                    bgColors = ['#fafafa', '#fafafa', '#fafafa', '#fafafa'];
                } else if (row.blackRow) {
                    bgColors = ['#222222', '#222222', '#222222', '#222222'];
                } else if (row.highlight) {
                    bgColors = ['#e2ebf0', '#e2ebf0', '#e2ebf0', '#e2ebf0'];
                } else {
                    bgColors = ['#ffffff', '#ffffff', '#ffffff', '#ffffff'];
                }

                // Draw background and cell border for each of the 4 cells
                const currentRowHeight = row.isSpacer ? 6 : rowHeight;
                for (let c = 0; c < 4; c++) {
                    doc.fillColor(bgColors[c]).rect(cellX[c], currentTableY, cellWidth[c], currentRowHeight).fill();
                    doc.strokeColor('#000000').lineWidth(0.5).rect(cellX[c], currentTableY, cellWidth[c], currentRowHeight).stroke();
                }

                // Draw text if it's not a spacer row
                if (!row.isSpacer) {
                    // Determine font weight and text colors
                    let textColors = ['#000000', '#000000', '#000000', '#000000'];
                    let isBold = [false, false, false, false];

                    if (row.blackRow) {
                        textColors = ['#ffffff', '#ffffff', '#ffffff', '#ffffff'];
                        isBold = [true, true, true, true];
                    } else if (row.highlight) {
                        textColors = ['#000000', '#000000', '#000000', '#000000'];
                        isBold = [true, true, true, true];
                    } else if (row.isBasicRow || row.isSectionHeaderRow) {
                        textColors = ['#000000', '#000000', '#000000', '#000000'];
                        isBold = [true, true, false, true];
                    } else {
                        textColors = ['#000000', '#000000', '#000000', '#000000'];
                        isBold = [false, false, false, false];
                    }

                    const textY = currentTableY + 5.5;

                    // Draw S.No
                    if (row.sno) {
                        doc.fillColor(textColors[0])
                            .font(isBold[0] ? 'Helvetica-Bold' : 'Helvetica')
                            .fontSize(8.5)
                            .text(row.sno, cellX[0] + 8, textY);
                    }

                    // Draw Description
                    doc.fillColor(textColors[1])
                        .font(isBold[1] ? 'Helvetica-Bold' : 'Helvetica')
                        .fontSize(8.5)
                        .text(row.desc, cellX[1] + 8, textY);

                    // Draw Per Month Value
                    const monthlyText = formatCellValPDF(row.monthly);
                    doc.fillColor(textColors[2])
                        .font(isBold[2] ? 'Helvetica-Bold' : 'Helvetica')
                        .fontSize(8.5)
                        .text(monthlyText, cellX[2], textY, { width: cellWidth[2] - 8, align: 'right' });

                    // Draw Yearly Value
                    const yearlyText = formatCellValPDF(row.yearly);
                    doc.fillColor(textColors[3])
                        .font(isBold[3] ? 'Helvetica-Bold' : 'Helvetica')
                        .fontSize(8.5)
                        .text(yearlyText, cellX[3], textY, { width: cellWidth[3] - 8, align: 'right' });
                }

                doc.restore();
                currentTableY += currentRowHeight;
            });

            doc.end();
        }

        doc.on('end', async () => {
            try {
                const pdfData = Buffer.concat(buffers);
                const blobName = await uploadBufferToBlob(pdfData, fileName, 'pdfs/', 'application/pdf');
                const webPath = getBlobUrl(blobName);

                // Write db record
                const [result] = await pool.query<ResultSetHeader>(
                    `INSERT INTO hrms_appointment_letters 
                    (candidate_name, employee_id, designation, generated_date, joining_date, status, monthly_ctc, yearly_ctc, email, phone, appointment_data, pdf_path) 
                    VALUES (?, ?, ?, ?, ?, 'Draft', ?, ?, ?, ?, ?, ?)`,
                    [
                        formData.candidateName,
                        formData.employeeId,
                        formData.designation,
                        formData.date,
                        formData.joiningDate,
                        formData.monthlyCTC,
                        formData.yearlyCTC,
                        formData.email || null,
                        formData.phone || null,
                        JSON.stringify(formData),
                        webPath
                    ]
                );

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                res.setHeader('Content-Length', pdfData.length);
                res.setHeader('X-Offer-Letter-Id', result.insertId.toString());
                res.setHeader('Access-Control-Expose-Headers', 'X-Offer-Letter-Id');
                res.send(pdfData);

            } catch (dbError: any) {
                console.error('Error saving appointment letter:', dbError);
                res.status(500).json({ success: false, message: 'DB Error saving appointment letter', error: dbError.message });
            }
        });

        doc.on('error', (err) => {
            console.error('PDF Generation Error:', err);
            res.status(500).json({ success: false, message: 'PDF Kit Generation Error', error: err.message });
        });

    } catch (error: any) {
        console.error('Error in generateAppointmentLetterPDF:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
};

/**
 * Get appointment letters list
 */
export const getAppointmentLetters = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query<AppointmentLetterRecord[]>(
            `SELECT id, candidate_name, employee_id, designation, generated_date, joining_date, status, pdf_path, monthly_ctc, yearly_ctc, appointment_data, created_at 
             FROM hrms_appointment_letters 
             ORDER BY created_at DESC`
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error fetching appointment letters', error: error.message });
    }
};

/**
 * Get specific letter by ID
 */
export const getAppointmentLetterById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query<AppointmentLetterRecord[]>(
            'SELECT * FROM hrms_appointment_letters WHERE id = ?',
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Appointment letter not found' });
        }
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error fetching appointment letter details', error: error.message });
    }
};

/**
 * Update letter status / employee association
 */
export const updateAppointmentLetterStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, employeeId } = req.body;

        if (employeeId) {
            await pool.query(
                'UPDATE hrms_appointment_letters SET status = ?, employee_id = ? WHERE id = ?',
                [status, employeeId, id]
            );
        } else {
            await pool.query(
                'UPDATE hrms_appointment_letters SET status = ? WHERE id = ?',
                [status, id]
            );
        }
        res.status(200).json({ success: true, message: 'Appointment letter status updated successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error updating status', error: error.message });
    }
};

/**
 * Delete appointment letter
 */
export const deleteAppointmentLetter = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM hrms_appointment_letters WHERE id = ?', [id]);
        res.status(200).json({ success: true, message: 'Appointment letter deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error deleting appointment letter', error: error.message });
    }
};

/**
 * Get logged-in employee letters
 */
export const getMyAppointmentLetters = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;
        if (!employeeId) {
            return res.status(400).json({ success: false, message: 'Employee ID is required' });
        }

        const [rows] = await pool.query<AppointmentLetterRecord[]>(
            `SELECT id, candidate_name, designation, generated_date, status, pdf_path, monthly_ctc, yearly_ctc 
             FROM hrms_appointment_letters 
             WHERE employee_id = ? AND status != 'Draft' 
             ORDER BY created_at DESC`,
            [employeeId]
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error fetching employee appointment letters', error: error.message });
    }
};
