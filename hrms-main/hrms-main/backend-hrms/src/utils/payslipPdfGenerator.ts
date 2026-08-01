import PDFDocument from 'pdfkit';
import { Response } from 'express';
import pool from '../db';
import { RowDataPacket } from 'mysql2';

export const generatePayslipPdf = async (payslipId: number, res: Response) => {
    try {
        // Fetch payslip
        const [payslipRows]: any = await pool.query('SELECT * FROM hrms_payslips WHERE id = ?', [payslipId]);
        if (payslipRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Payslip not found' });
        }
        const payslip = payslipRows[0];
        
        // Parse payroll data
        let payrollData: any = {};
        if (payslip.payroll_data) {
            payrollData = typeof payslip.payroll_data === 'string' ? JSON.parse(payslip.payroll_data) : payslip.payroll_data;
        }

        // Fetch employee details
        const [empRows]: any = await pool.query(`
            SELECT e.*, 
                   d.name as department_name, 
                   desig.name as designation_name, 
                   loc.name as location_name,
                   b.name as bank_name,
                   pm.name as payment_mode_name
            FROM hrms_employees e
            LEFT JOIN hrms_departments d ON e.department_id = d.id
            LEFT JOIN hrms_designations desig ON e.designation_id = desig.id
            LEFT JOIN hrms_work_locations loc ON e.work_location_id = loc.id
            LEFT JOIN hrms_banks b ON e.bank_id = b.id
            LEFT JOIN hrms_payment_modes pm ON e.payment_mode_id = pm.id
            WHERE e.id = ?
        `, [payslip.employee_id]);
        
        const emp = empRows[0] || {};
        
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Payslip_${emp.first_name || ''}_${payslip.month}_${payslip.year}.pdf"`);
        
        doc.pipe(res);
        
        // Fonts & Colors
        const primaryColor = '#0066cc';
        const borderColor = '#000000';
        const headerBgColor = '#d9e1f2';
        
        // --- HEADER ---
        // Logo could be added here if available, using text for now
        doc.font('Helvetica-Bold').fontSize(22).fillColor(primaryColor).text('cogentes', 30, 28);
        
        doc.font('Helvetica-Bold').fontSize(18).fillColor('#000000').text('Cogent Logistics Private Limited', 0, 30, { align: 'center' });
        doc.font('Helvetica').fontSize(10).text('201C/6, Second Floor, D-21, Corporate Park, Sec.-21, Dwarka, New Delhi - 110077 India', 0, 50, { align: 'center' });
        
        doc.text('E mail: ', 150, 70, { continued: true })
           .fillColor('blue').text('career@cogentlogistics.in', { continued: true, link: 'mailto:career@cogentlogistics.in', underline: true })
           .fillColor('black').text(' , Web: ', { continued: true, underline: false })
           .fillColor('blue').text('www.cogentlogistics.in', { link: 'http://www.cogentlogistics.in', underline: true });
           
        doc.fillColor('black');
        
        // Draw top border line
        doc.moveTo(30, 90).lineTo(565, 90).lineWidth(1.5).stroke();
        
        // --- TITLE ---
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthName = monthNames[payslip.month - 1] || payslip.month;
        
        doc.font('Helvetica-Bold').fontSize(12).text(`Pay Slip For The Month Of : ${monthName} ${payslip.year}`, 0, 95, { align: 'center', underline: true });
        
        // Helper function for table borders
        const drawCell = (x: number, y: number, w: number, h: number, text: string, align: 'left' | 'center' | 'right' = 'left', isHeader = false) => {
            doc.rect(x, y, w, h).stroke();
            doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(10);
            
            const strText = String(text);
            let textX = x + 5;
            if (align === 'center') {
                textX = x + (w - doc.widthOfString(strText)) / 2;
            } else if (align === 'right') {
                textX = x + w - 5 - doc.widthOfString(strText);
            }
            
            doc.save();
            doc.rect(x, y, w, h).clip();
            doc.text(strText, textX, y + 5, { lineBreak: false });
            doc.restore();
        };

        // --- EMPLOYEE DETAILS TABLE ---
        let startY = 115;
        const rowHeight = 20;
        const col1W = 120; // Label
        const col2W = 150; // Value
        const col3W = 120; // Label
        const col4W = 145; // Value
        
        const c1X = 30;
        const c2X = c1X + col1W;
        const c3X = c2X + col2W;
        const c4X = c3X + col3W;
        
        const joinDateObj = emp.joining_date ? new Date(emp.joining_date) : null;
        const joinDate = joinDateObj ? joinDateObj.toLocaleDateString('en-GB') : '';
        
        const payDays = payrollData.presentDays || '';
        const workingDays = payrollData.workingDays || 0;
        const lopDays = workingDays > 0 ? workingDays - (payrollData.presentDays || 0) : 0;
        
        const details = [
            ['Employee Code', emp.employee_id || '', 'Pay Mode', emp.payment_mode_name || 'Bank Transfer'],
            ['Name', `${emp.first_name || ''} ${emp.last_name || ''}`, 'Pay Days', String(payDays)],
            ['Date Of Joining', joinDate, 'Loss Of Pay Days', String(lopDays)],
            ['Department', emp.department_name || '', 'Bank Name', emp.bank_name || ''],
            ['Designation', emp.designation_name || '', 'Bank A/C No.', emp.account_number || ''],
            ['Location', emp.location_name || '', 'Bank IFSC', emp.ifsc_code || ''],
            ['PF UAN', '', 'Aadhar No.', ''] // UAN and Aadhar not strictly in emp table by default
        ];
        
        details.forEach((row, i) => {
            const y = startY + (i * rowHeight);
            drawCell(c1X, y, col1W, rowHeight, row[0]);
            drawCell(c2X, y, col2W, rowHeight, row[1]);
            drawCell(c3X, y, col3W, rowHeight, row[2]);
            drawCell(c4X, y, col4W, rowHeight, row[3]);
        });
        
        // --- EARNINGS & DEDUCTIONS TABLE ---
        startY = startY + (details.length * rowHeight);
        
        // Header
        doc.fillColor(headerBgColor).rect(c1X, startY, col1W + col2W, rowHeight).fill();
        doc.fillColor(headerBgColor).rect(c3X, startY, col3W + col4W, rowHeight).fill();
        doc.fillColor('black');
        
        drawCell(c1X, startY, col1W + col2W - 80, rowHeight, 'Earnings', 'left', true);
        drawCell(c1X + col1W + col2W - 80, startY, 80, rowHeight, 'Amount', 'center', true);
        drawCell(c3X, startY, col3W + col4W - 80, rowHeight, 'Deductions', 'left', true);
        drawCell(c3X + col3W + col4W - 80, startY, 80, rowHeight, 'Amount', 'center', true);
        
        // We draw the outer border of the list, and a middle line, but no horizontal lines between items (as per image)
        startY += rowHeight;
        const listHeight = 120;
        
        // Left section (Earnings)
        doc.rect(c1X, startY, col1W + col2W, listHeight).stroke();
        // Dashed line for Amount column
        doc.save().dash(3, {space: 2}).moveTo(c1X + col1W + col2W - 80, startY).lineTo(c1X + col1W + col2W - 80, startY + listHeight).stroke().restore();
        
        // Right section (Deductions)
        doc.rect(c3X, startY, col3W + col4W, listHeight).stroke();
        // Dashed line for Amount column
        doc.save().dash(3, {space: 2}).moveTo(c3X + col3W + col4W - 80, startY).lineTo(c3X + col3W + col4W - 80, startY + listHeight).stroke().restore();
        
        // Write text inside the boxes
        const earnings = [
            ['Basic', payrollData.basicSalary || 0],
            ['HRA', payrollData.allowances?.hra || 0],
            ['Other Allowances', payrollData.allowances?.other || 0],
            ['Monthly Leave Encashment', payrollData.allowances?.medical || 0],
            ['Advance Bonus', payrollData.allowances?.advanceBonus || 0]
        ];
        
        const deductions = [
            ['Provident Fund', payrollData.deductions?.pf || 0],
            ['ESI', payrollData.deductions?.esi || 0],
            ['LWF', payrollData.deductions?.other || 0],
            ['', ''], // Empty row
            ['Advance Deduction', 0] // Static 0 for now as it's not explicitly in payrollData
        ];
        
        // Write Earnings
        earnings.forEach((item, i) => {
            doc.font('Helvetica').fontSize(10);
            doc.text(String(item[0]), c1X + 5, startY + 5 + (i * 18), { width: col1W + col2W - 90, lineBreak: false });
            doc.text(Number(item[1]).toFixed(2), c1X + col1W + col2W - 75, startY + 5 + (i * 18), { width: 70, align: 'right' });
        });
        
        // Write Deductions
        deductions.forEach((item, i) => {
            doc.font('Helvetica').fontSize(10);
            doc.text(String(item[0]), c3X + 5, startY + 5 + (i * 18), { width: col3W + col4W - 90, lineBreak: false });
            if (item[1] !== '') {
                doc.text(Number(item[1]).toFixed(2), c3X + col3W + col4W - 75, startY + 5 + (i * 18), { width: 70, align: 'right' });
            }
        });
        
        startY += listHeight;
        
        // Gross Row
        drawCell(c1X, startY, col1W + col2W - 80, rowHeight, 'Gross Earnings', 'left', true);
        drawCell(c1X + col1W + col2W - 80, startY, 80, rowHeight, Number(payrollData.grossSalary || payslip.gross_salary || 0).toFixed(2), 'right', false);
        
        drawCell(c3X, startY, col3W + col4W - 80, rowHeight, 'Gross Deductions :', 'left', true);
        drawCell(c3X + col3W + col4W - 80, startY, 80, rowHeight, Number(payrollData.totalDeductions || (payslip.gross_salary - payslip.net_salary) || 0).toFixed(2), 'right', false);
        
        startY += rowHeight;
        
        // Empty buffer row
        drawCell(c1X, startY, 535, rowHeight, '');
        startY += rowHeight;
        
        // Net Salary
        doc.rect(c1X, startY, 535, rowHeight * 2).stroke();
        doc.font('Helvetica-Bold').fontSize(10);
        const netValue = Number(payslip.net_salary || 0);
        doc.text(`Net Salary In Hand Rs :`, c1X + 30, startY + 5);
        doc.font('Helvetica').text(netValue.toFixed(0), c1X + 170, startY + 5);
        
        // Convert to words (Indian Numbering System)
        const toWords = (num: number) => {
            const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
            const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
            const numStr = num.toString();
            if (numStr.length > 9) return 'overflow';
            const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!n) return '';
            let str = '';
            str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
            str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
            str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
            str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
            str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
            return 'Rupees ' + str.trim() + ' Only';
        };
        
        doc.font('Helvetica-Bold');
        doc.text(`In Words :`, c1X + 30, startY + 25);
        doc.font('Helvetica').text(toWords(netValue), c1X + 100, startY + 25);
        
        startY += rowHeight * 2;
        
        // Footer Note
        doc.font('Helvetica').fontSize(9);
        doc.rect(c1X, startY, 535, 15).stroke();
        doc.text('** This is a computer generate document and does not require any signature', c1X + 5, startY + 3);
        
        doc.end();

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ success: false, message: 'Error generating PDF' });
    }
};
