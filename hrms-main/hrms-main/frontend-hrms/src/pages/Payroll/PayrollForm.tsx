// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  Tooltip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  PlayArrow as PlayArrowIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService, API_BASE_URL } from '../../services/api';
import axios from 'axios';
import * as XLSX from 'xlsx';

interface PayrollRecord {
  id?: number;
  employeeId: number;
  employeeName?: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: {
    hra: number;
    transport: number;     // represents Performance Bonus Earned
    medical: number;       // represents Leave Encashment Earned
    other: number;         // represents Other Allowances Earned
    advanceBonus: number;  // represents Advance Bonus Earned
  };
  deductions: {
    pf: number;
    esi: number;
    tax: number;           // represents Professional Tax
    other: number;         // represents Labor Welfare Fund (Self)
  };
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  workingDays: number;
  presentDays: number;
  status: 'DRAFT' | 'PROCESSED' | 'PAID';
  calculationBasis: 'New Government Rule' | 'Old Basis';
  esicCovered: 'Yes' | 'No';
  baseGrossSalary: number;

  // Base excel components (White cells)
  baseBasic: number;
  baseHra: number;
  baseOther: number;
  baseBonus: number;
  baseLeave: number;
  baseAdvance: number;
  pTax: number;
  lwfSelf: number;
  lwfCompany: number;
  usePfCap: boolean;

  // Employer contributions (Section III)
  emrPf: number;
  emrEsic: number;
  emrGratuity: number;
  emrLwf: number;
  companyAdditionalCost: number;
  totalCtc: number;
}

interface BatchRecord {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  workingDays: number;
  presentDays: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  payrollStatus: string;
  payslipId?: number;
  payslipGenerated?: boolean;
  error?: string;
  payrollPayload?: any;

  // Detailed fields matching Excel structure
  esicCovered?: string;
  baseBasic?: number;
  baseHra?: number;
  baseOther?: number;
  baseBonus?: number;
  baseLeave?: number;
  baseAdvance?: number;
  baseGrossSalary?: number;
  basicSalary?: number;
  allowances?: {
    hra: number;
    transport: number;     // Performance Bonus
    medical: number;       // Leave Encashment
    other: number;         // Other Allowances
    advanceBonus: number;  // Advance Bonus
  };
  deductions?: {
    pf: number;
    esi: number;
    tax: number;           // P.Tax
    other: number;         // LWF Self
    tds?: number;
    covidInsurance?: number;
  };
  emrPf?: number;
  pfAdminCharges?: number;
  emrEsic?: number;
  emrLwf?: number;
  emrGratuity?: number;
  companyAdditionalCost?: number;
  totalCtc?: number;
}

interface SummaryStats {
  totalEmployees: number;
  payrollGenerated: number;
  payslipsGenerated: number;
  failedCount: number;
  completed: boolean;
}

const PayrollForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);


  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [summaryViewMode, setSummaryViewMode] = useState<'compact' | 'detailed'>('detailed');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning'
  });

  // Bulk Generation Date Range & Batch State
  const today = new Date();
  const firstDayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const lastDayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

  const [fromDate, setFromDate] = useState<string>(() => sessionStorage.getItem('bulkPayroll_fromDate') || firstDayStr);
  const [toDate, setToDate] = useState<string>(() => sessionStorage.getItem('bulkPayroll_toDate') || lastDayStr);
  const [bulkStatus, setBulkStatus] = useState<'DRAFT' | 'PROCESSED' | 'PAID'>(() => (sessionStorage.getItem('bulkPayroll_bulkStatus') as any) || 'DRAFT');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isGeneratingPayslips, setIsGeneratingPayslips] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressText, setProgressText] = useState<string>('');

  const [batchRecords, setBatchRecords] = useState<BatchRecord[]>(() => {
    try {
      const cached = sessionStorage.getItem('bulkPayroll_batchRecords');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [summaryStats, setSummaryStats] = useState<SummaryStats>(() => {
    try {
      const cached = sessionStorage.getItem('bulkPayroll_summaryStats');
      return cached ? JSON.parse(cached) : {
        totalEmployees: 0,
        payrollGenerated: 0,
        payslipsGenerated: 0,
        failedCount: 0,
        completed: false
      };
    } catch {
      return {
        totalEmployees: 0,
        payrollGenerated: 0,
        payslipsGenerated: 0,
        failedCount: 0,
        completed: false
      };
    }
  });

  useEffect(() => {
    sessionStorage.setItem('bulkPayroll_fromDate', fromDate);
    sessionStorage.setItem('bulkPayroll_toDate', toDate);
    sessionStorage.setItem('bulkPayroll_bulkStatus', bulkStatus);
    sessionStorage.setItem('bulkPayroll_batchRecords', JSON.stringify(batchRecords));
    sessionStorage.setItem('bulkPayroll_summaryStats', JSON.stringify(summaryStats));
  }, [fromDate, toDate, bulkStatus, batchRecords, summaryStats]);

  // Export to Excel handler matching exact corporate structure
  const handleExportExcel = () => {
    if (batchRecords.length === 0) {
      setSnackbar({
        open: true,
        message: 'No payroll records available to export.',
        severity: 'warning'
      });
      return;
    }

    // Row 1: Super Headers (Categories)
    const row1 = [
      "", "", "", "", "",
      "Rate of Wages", "", "", "", "", "", "",
      "Earned Wages", "", "", "", "", "", "",
      "Deductions", "", "", "", "", "", "",
      "Net Amt",
      "EMR Contribution", "", "", "", "", "",
      "CTC"
    ];

    // Row 2: Sub Headers (Exact columns as user's template)
    const row2 = [
      "Employee Name",
      "Employee ID",
      "ESIC Covered",
      "Total Payable Days",
      "Total Paid Days",
      "Basic",
      "HRA",
      "Other Allowances",
      "Performance Bonus",
      "Monthly_Leave_Encashment",
      "Advance_Bonus",
      "Gross",
      "Basic",
      "HRA",
      "Other Allowances",
      "Performance Bonus",
      "Monthly_Leave_Encashment",
      "Advance_Bonus",
      "Gross",
      "EMY PF12%",
      "E.S.I.C 0.75%",
      "P.Tax",
      "LWF EE",
      "TDS",
      "Covid19 Insurance Charges",
      "Tot Dedn",
      "Net Amt",
      "EMR PF 13.36%",
      "PF Admin Charges",
      "EMR ESIC 3.25%",
      "EMR LWF",
      "Gratuity",
      "Total EMR'S Cont.",
      "CTC"
    ];

    const dataRows = batchRecords.map(record => {
      const proBasic = record.basicSalary ?? 0;
      const proHra = record.allowances?.hra ?? 0;
      const proOther = record.allowances?.other ?? 0;
      const proBonus = record.allowances?.transport ?? 0;
      const proLeave = record.allowances?.medical ?? 0;
      const proAdvance = record.allowances?.advanceBonus ?? 0;
      const proGross = record.grossSalary ?? (proBasic + proHra + proOther + proBonus + proLeave + proAdvance);

      const emyPf = record.deductions?.pf ?? 0;
      const emyEsic = record.deductions?.esi ?? 0;
      const pTax = record.deductions?.tax ?? 0;
      const lwfEe = record.deductions?.other ?? 0;
      const tds = record.deductions?.tds ?? 0;
      const covid = record.deductions?.covidInsurance ?? 0;
      const totDedn = record.totalDeductions ?? (emyPf + emyEsic + pTax + lwfEe + tds + covid);
      const netAmt = record.netSalary ?? Math.max(0, proGross - totDedn);

      const emrPf = record.emrPf ?? 0;
      const pfAdmin = record.pfAdminCharges ?? (proBasic > 0 ? Math.round(proBasic * 0.01) : 0);
      const emrEsic = record.emrEsic ?? 0;
      const emrLwf = record.emrLwf ?? 0;
      const gratuity = record.emrGratuity ?? 0;
      const totEmr = record.companyAdditionalCost ?? (emrPf + pfAdmin + emrEsic + emrLwf + gratuity);
      const ctc = record.totalCtc ?? (proGross + totEmr);

      return [
        record.employeeName || '',
        record.employeeCode || '',
        record.esicCovered || 'No',
        record.workingDays ?? 0,
        record.presentDays ?? 0,
        record.baseBasic ?? 0,
        record.baseHra ?? 0,
        record.baseOther ?? 0,
        record.baseBonus ?? 0,
        record.baseLeave ?? 0,
        record.baseAdvance ?? 0,
        record.baseGrossSalary ?? 0,
        proBasic,
        proHra,
        proOther,
        proBonus,
        proLeave,
        proAdvance,
        proGross,
        emyPf,
        emyEsic,
        pTax,
        lwfEe,
        tds,
        covid,
        totDedn,
        netAmt,
        emrPf,
        pfAdmin,
        emrEsic,
        emrLwf,
        gratuity,
        totEmr,
        ctc
      ];
    });

    const aoa = [row1, row2, ...dataRows];
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);

    // Merge super-headers matching categories
    worksheet['!merges'] = [
      { s: { r: 0, c: 5 }, e: { r: 0, c: 11 } },  // Rate of Wages (cols F to L)
      { s: { r: 0, c: 12 }, e: { r: 0, c: 18 } }, // Earned Wages (cols M to S)
      { s: { r: 0, c: 19 }, e: { r: 0, c: 25 } }, // Deductions (cols T to Z)
      { s: { r: 0, c: 27 }, e: { r: 0, c: 32 } }, // EMR Contribution (cols AB to AG)
    ];

    // Column widths
    worksheet['!cols'] = [
      { wch: 22 }, // Employee Name
      { wch: 18 }, // Employee ID
      { wch: 14 }, // ESIC Covered
      { wch: 18 }, // Total Payable Days
      { wch: 16 }, // Total Paid Days
      { wch: 12 }, // Basic (Rate)
      { wch: 12 }, // HRA (Rate)
      { wch: 16 }, // Other Allowances (Rate)
      { wch: 18 }, // Performance Bonus (Rate)
      { wch: 24 }, // Monthly_Leave_Encashment (Rate)
      { wch: 16 }, // Advance_Bonus (Rate)
      { wch: 14 }, // Gross (Rate)
      { wch: 12 }, // Basic (Earned)
      { wch: 12 }, // HRA (Earned)
      { wch: 16 }, // Other Allowances (Earned)
      { wch: 18 }, // Performance Bonus (Earned)
      { wch: 24 }, // Monthly_Leave_Encashment (Earned)
      { wch: 16 }, // Advance_Bonus (Earned)
      { wch: 14 }, // Gross (Earned)
      { wch: 14 }, // EMY PF12%
      { wch: 14 }, // E.S.I.C 0.75%
      { wch: 10 }, // P.Tax
      { wch: 10 }, // LWF EE
      { wch: 10 }, // TDS
      { wch: 24 }, // Covid19 Insurance Charges
      { wch: 12 }, // Tot Dedn
      { wch: 14 }, // Net Amt
      { wch: 16 }, // EMR PF 13.36%
      { wch: 16 }, // PF Admin Charges
      { wch: 16 }, // EMR ESIC 3.25%
      { wch: 12 }, // EMR LWF
      { wch: 12 }, // Gratuity
      { wch: 18 }, // Total EMR'S Cont.
      { wch: 14 }  // CTC
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll Summary");
    XLSX.writeFile(workbook, `Payroll_Summary_${Date.now()}.xlsx`);
  };

  // Single-employee payroll state for Edit mode
  const [payroll, setPayroll] = useState<PayrollRecord>({
    employeeId: 0,
    month: new Date().toISOString().slice(0, 7),
    year: new Date().getFullYear(),
    basicSalary: 0,
    allowances: { hra: 0, transport: 0, medical: 0, other: 0, advanceBonus: 0 },
    deductions: { pf: 0, esi: 0, tax: 0, other: 0 },
    grossSalary: 0,
    totalDeductions: 0,
    netSalary: 0,
    workingDays: 27,
    presentDays: 27,
    status: 'DRAFT',
    calculationBasis: 'Old Basis',
    esicCovered: 'No',
    baseGrossSalary: 29057,
    baseBasic: 0,
    baseHra: 0,
    baseOther: 0,
    baseBonus: 0,
    baseLeave: 0,
    baseAdvance: 0,
    pTax: 0,
    lwfSelf: 0,
    lwfCompany: 0,
    usePfCap: false,
    emrPf: 0,
    emrEsic: 0,
    emrGratuity: 0,
    emrLwf: 0,
    companyAdditionalCost: 0,
    totalCtc: 0,
  });

  useEffect(() => {
    loadEmployees();
    if (isEdit && id) {
      loadPayrollRecord(parseInt(id));
    }
  }, [isEdit, id]);

  useEffect(() => {
    if (isEdit && payroll.employeeId && payroll.month) {
      const [yearStr, monthStr] = payroll.month.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      
      const fetchAttendance = async () => {
        try {
          const response = await apiService.getEmployeeAttendanceStats(payroll.employeeId, year, month);
          if (response.success && response.data) {
             setPayroll(prev => ({
               ...prev,
               workingDays: response.data.workingDays || 0,
               presentDays: response.data.presentDays || 0,
             }));
          }
        } catch(error) {
          console.warn('Error fetching attendance stats', error);
        }
      };
      fetchAttendance();
    }
  }, [isEdit, payroll.employeeId, payroll.month]);

  useEffect(() => {
    if (isEdit) {
      calculateSalary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    payroll.workingDays,
    payroll.presentDays,
    payroll.esicCovered,
    payroll.usePfCap,
    payroll.baseBasic,
    payroll.baseHra,
    payroll.baseOther,
    payroll.baseBonus,
    payroll.baseLeave,
    payroll.baseAdvance,
    payroll.pTax,
    payroll.lwfSelf,
    payroll.lwfCompany
  ]);

  const loadEmployees = async () => {
    try {
      const response = await apiService.getEmployees(1, 1000);
      setEmployees(response.data?.content || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
    }
  };

  const loadPayrollRecord = async (payrollId: number) => {
    try {
      setLoading(true);
      const response = await apiService.getPayslipById(payrollId);
      if (response.success && response.data) {
        const data = response.data as any;
        const monthStr = data.month < 10 ? `0${data.month}` : `${data.month}`;
        setPayroll(prev => ({
          ...prev,
          employeeId: data.employee_id,
          month: `${data.year}-${monthStr}`,
          year: data.year,
          baseGrossSalary: data.gross_salary,
          grossSalary: data.gross_salary,
          netSalary: data.net_salary,
          basicSalary: data.gross_salary,
          allowances: { hra: 0, transport: 0, medical: 0, other: 0 },
          deductions: { pf: 0, esi: 0, tax: 0, other: data.gross_salary - data.net_salary },
        }));
      }
    } catch (error) {
      console.error('Error loading payroll record:', error);
    } finally {
      setLoading(false);
    }
  };

  // Salary calculation formula (Reused exactly across single and bulk workflows)
  const computeSalaryForEmployee = (
    workingDays: number,
    presentDays: number,
    salStructure: {
      baseBasic: number;
      baseHra: number;
      baseOther: number;
      baseBonus: number;
      baseLeave: number;
      baseAdvance: number;
      pTax: number;
      lwfSelf: number;
      lwfCompany: number;
      usePfCap: boolean;
      esicCovered: string;
      calculationBasis?: string;
    }
  ) => {
    const ratio = workingDays > 0 ? (presentDays / workingDays) : 0;

    const baseBasic = Number(salStructure.baseBasic) || 0;
    const baseHra = Number(salStructure.baseHra) || 0;
    const baseOther = Number(salStructure.baseOther) || 0;
    const baseBonus = Number(salStructure.baseBonus) || 0;
    const baseLeave = Number(salStructure.baseLeave) || 0;
    const baseAdvance = Number(salStructure.baseAdvance) || 0;

    const proBasic = Math.round(baseBasic * ratio);
    const proHra = Math.round(baseHra * ratio);
    const proOther = Math.round(baseOther * ratio);
    const proBonus = Math.round(baseBonus * ratio);
    const proLeave = Math.round(baseLeave * ratio);
    const proAdvance = Math.round(baseAdvance * ratio);
    const proGross = proBasic + proHra + proOther + proBonus + proLeave + proAdvance;

    // Employee Deductions
    let emyPF = 0;
    if (proGross > 0) {
      if (salStructure.usePfCap) {
        emyPF = proBasic > 15000 ? 1800 : Math.round(proBasic * 0.12);
      } else {
        emyPF = Math.round(proBasic * 0.12);
      }
    }

    const emyESIC = (proGross > 0 && salStructure.esicCovered === 'Yes' && proGross < 21001) ? Math.round(proGross * 0.0075) : 0;

    // Fixed deductions (P.Tax and LWF) apply ONLY if there are positive gross earnings (proGross > 0)
    let rawPTax = proGross > 0 ? Number(salStructure.pTax) || 0 : 0;
    if (rawPTax > 200) rawPTax = 200; // Cap monthly P.Tax at statutory max 200
    const pTax = rawPTax;

    let rawLwfSelf = proGross > 0 ? Number(salStructure.lwfSelf) || 0 : 0;
    if (rawLwfSelf > 25) rawLwfSelf = 10; // Cap monthly LWF at 10
    const lwfSelf = rawLwfSelf;

    let rawLwfCompany = proGross > 0 ? Number(salStructure.lwfCompany) || 0 : 0;
    if (rawLwfCompany > 50) rawLwfCompany = 20; // Cap monthly LWF Employer at 20
    const lwfCompany = rawLwfCompany;

    const totalDeductions = emyPF + emyESIC + pTax + lwfSelf;
    const netSalary = Math.max(0, Math.round(proGross - totalDeductions));

    let emrPf = 0;
    if (proGross > 0) {
      if (salStructure.usePfCap) {
        emrPf = proBasic > 15000 ? 1950 : Math.round(proBasic * 0.13);
      } else {
        emrPf = Math.round(proBasic * 0.13);
      }
    }

    const emrEsic = (proGross > 0 && salStructure.esicCovered === 'Yes' && proGross < 21001) ? Math.round(proGross * 0.0325) : 0;
    const gratuity = proGross > 0 ? Math.round(proBasic * 15 / 26 / 12) : 0;

    const companyAdditionalCost = emrPf + emrEsic + gratuity + lwfCompany;
    const totalCtc = proGross + companyAdditionalCost;

    return {
      basicSalary: proBasic,
      allowances: {
        hra: proHra,
        transport: proBonus,
        medical: proLeave,
        other: proOther,
        advanceBonus: proAdvance,
      },
      deductions: {
        pf: emyPF,
        esi: emyESIC,
        tax: pTax,
        other: lwfSelf,
      },
      grossSalary: proGross,
      totalDeductions,
      netSalary,
      emrPf,
      emrEsic,
      emrGratuity: gratuity,
      emrLwf: lwfCompany,
      companyAdditionalCost,
      totalCtc,
      baseBasic,
      baseHra,
      baseOther,
      baseBonus,
      baseLeave,
      baseAdvance,
      pTax: Number(salStructure.pTax) || 0,
      lwfSelf: Number(salStructure.lwfSelf) || 0,
      lwfCompany: Number(salStructure.lwfCompany) || 0,
      usePfCap: salStructure.usePfCap,
      esicCovered: salStructure.esicCovered,
      calculationBasis: salStructure.calculationBasis || 'Old Basis'
    };
  };

  const calculateSalary = () => {
    const calc = computeSalaryForEmployee(payroll.workingDays, payroll.presentDays, {
      baseBasic: payroll.baseBasic,
      baseHra: payroll.baseHra,
      baseOther: payroll.baseOther,
      baseBonus: payroll.baseBonus,
      baseLeave: payroll.baseLeave,
      baseAdvance: payroll.baseAdvance,
      pTax: payroll.pTax,
      lwfSelf: payroll.lwfSelf,
      lwfCompany: payroll.lwfCompany,
      usePfCap: payroll.usePfCap,
      esicCovered: payroll.esicCovered,
      calculationBasis: payroll.calculationBasis
    });

    setPayroll(prev => ({
      ...prev,
      ...calc
    }));
  };

  // Helper to load salary structure from appointment letter, offer letter, or employee record
  const fetchEmployeeSalaryStructure = async (emp: any) => {
    const employeeId = emp.id;
    const firstName = emp.firstName ? emp.firstName.trim() : '';

    // 1. Try Appointment Letter by employee_id or candidate_name
    try {
      const myRes = await axios.get(`${API_BASE_URL}/api/appointment-letters/my-letters/${employeeId}`);
      let targetLetterId: number | null = null;
      let letterDetailsData: any = null;

      if (myRes.data.success && myRes.data.data && myRes.data.data.length > 0) {
        targetLetterId = myRes.data.data[0].id;
      } else {
        const listRes = await axios.get(`${API_BASE_URL}/api/appointment-letters/list`);
        if (listRes.data.success && Array.isArray(listRes.data.data)) {
          const matched = listRes.data.data.find((l: any) => 
            (l.employee_id && Number(l.employee_id) === Number(employeeId)) ||
            (l.candidate_name && firstName && l.candidate_name.toLowerCase().includes(firstName.toLowerCase()))
          );
          if (matched) {
            targetLetterId = matched.id;
          }
        }
      }

      if (targetLetterId) {
        const detailsResponse = await axios.get(`${API_BASE_URL}/api/appointment-letters/${targetLetterId}`);
        if (detailsResponse.data.success && detailsResponse.data.data) {
          letterDetailsData = detailsResponse.data.data;
          const offerData = typeof letterDetailsData.appointment_data === 'string' 
            ? JSON.parse(letterDetailsData.appointment_data) 
            : (letterDetailsData.appointment_data || {});
          
          const baseGross = Number(offerData.grossSalary) || Number(letterDetailsData.monthly_ctc) || Number(offerData.monthlyCTC) || 0;
          if (baseGross > 0) {
            const baseBasic = Number(offerData.basicSalary) || Number(offerData.baseBasic) || Math.round(baseGross * 0.5);
            const baseHra = Number(offerData.hra) || Number(offerData.baseHra) || 0;
            
            const baseBonus = Number(offerData.performanceBonus) || Number(offerData.baseBonus) || 0;
            const baseLeave = Number(offerData.leaveEncashment) || Number(offerData.baseLeave) || 0;
            const baseAdvance = Number(offerData.advanceBonus) || Number(offerData.baseAdvance) || 0;

            const baseOther = Number(offerData.otherAllowances) || Number(offerData.baseOther) || Math.max(0, baseGross - (baseBasic + baseHra + baseBonus + baseLeave + baseAdvance));

            return {
              baseGrossSalary: baseGross,
              baseBasic,
              baseHra,
              baseOther,
              baseBonus,
              baseLeave,
              baseAdvance,
              pTax: Number(offerData.pTax) || (baseGross > 0 ? 200 : 0),
              lwfSelf: Number(offerData.lwfEmployee) || Number(offerData.lwfSelf) || (baseGross > 0 ? 10 : 0),
              lwfCompany: Number(offerData.lwfEmployer) || Number(offerData.lwfCompany) || (baseGross > 0 ? 20 : 0),
              usePfCap: offerData.usePfCap !== undefined ? Boolean(offerData.usePfCap) : true,
              esicCovered: offerData.esicCovered || 'No',
              calculationBasis: offerData.calculationBasis || 'Old Basis'
            };
          }
        }
      }
    } catch (error) {
      console.warn(`Error loading appointment letter for employee ${employeeId}:`, error);
    }

    // 2. Try Offer Letter by employee_id or candidate_name
    try {
      const myRes = await axios.get(`${API_BASE_URL}/api/offer-letters/my-letters/${employeeId}`);
      let targetOfferId: number | null = null;
      let offerDetailsData: any = null;

      if (myRes.data.success && myRes.data.data && myRes.data.data.length > 0) {
        targetOfferId = myRes.data.data[0].id;
      } else {
        const listRes = await axios.get(`${API_BASE_URL}/api/offer-letters/list`);
        if (listRes.data.success && Array.isArray(listRes.data.data)) {
          const matched = listRes.data.data.find((l: any) => 
            (l.employee_id && Number(l.employee_id) === Number(employeeId)) ||
            (l.candidate_name && firstName && l.candidate_name.toLowerCase().includes(firstName.toLowerCase()))
          );
          if (matched) {
            targetOfferId = matched.id;
          }
        }
      }

      if (targetOfferId) {
        const detailsResponse = await axios.get(`${API_BASE_URL}/api/offer-letters/${targetOfferId}`);
        if (detailsResponse.data.success && detailsResponse.data.data) {
          offerDetailsData = detailsResponse.data.data;
          const offerData = typeof offerDetailsData.offer_data === 'string' 
            ? JSON.parse(offerDetailsData.offer_data) 
            : (offerDetailsData.offer_data || {});
          
          const baseGross = Number(offerData.grossSalary) || Number(offerDetailsData.monthly_ctc) || Number(offerData.monthlyCTC) || 0;
          if (baseGross > 0) {
            const baseBasic = Number(offerData.basicSalary) || Number(offerData.baseBasic) || Math.round(baseGross * 0.5);
            const baseHra = Number(offerData.hra) || Number(offerData.baseHra) || 0;
            
            const baseBonus = Number(offerData.performanceBonus) || Number(offerData.baseBonus) || 0;
            const baseLeave = Number(offerData.leaveEncashment) || Number(offerData.baseLeave) || 0;
            const baseAdvance = Number(offerData.advanceBonus) || Number(offerData.baseAdvance) || 0;

            const baseOther = Number(offerData.otherAllowances) || Number(offerData.baseOther) || Math.max(0, baseGross - (baseBasic + baseHra + baseBonus + baseLeave + baseAdvance));

            return {
              baseGrossSalary: baseGross,
              baseBasic,
              baseHra,
              baseOther,
              baseBonus,
              baseLeave,
              baseAdvance,
              pTax: Number(offerData.pTax) || (baseGross > 0 ? 200 : 0),
              lwfSelf: Number(offerData.lwfEmployee) || Number(offerData.lwfSelf) || (baseGross > 0 ? 10 : 0),
              lwfCompany: Number(offerData.lwfEmployer) || Number(offerData.lwfCompany) || (baseGross > 0 ? 20 : 0),
              usePfCap: offerData.usePfCap !== undefined ? Boolean(offerData.usePfCap) : true,
              esicCovered: offerData.esicCovered || 'No',
              calculationBasis: offerData.calculationBasis || 'Old Basis'
            };
          }
        }
      }
    } catch (error) {
      console.warn(`Error loading offer letter for employee ${employeeId}:`, error);
    }

    // 3. Check employee's own salary column if present in employee record
    const empSalary = Number(emp.salary) || Number(emp.monthly_ctc) || 0;
    if (empSalary > 0) {
      const baseBasic = Math.round(empSalary * 0.5);
      const baseHra = 0;
      const baseOther = Math.max(0, empSalary - (baseBasic + baseHra));
      return {
        baseGrossSalary: empSalary,
        baseBasic,
        baseHra,
        baseOther,
        baseBonus: 0,
        baseLeave: 0,
        baseAdvance: 0,
        pTax: 200,
        lwfSelf: 10,
        lwfCompany: 20,
        usePfCap: true,
        esicCovered: 'No',
        calculationBasis: 'Old Basis'
      };
    }

    // Default to 0 for all salary components if no offer letter / appointment letter / salary exists
    return {
      baseGrossSalary: 0,
      baseBasic: 0,
      baseHra: 0,
      baseOther: 0,
      baseBonus: 0,
      baseLeave: 0,
      baseAdvance: 0,
      pTax: 0,
      lwfSelf: 0,
      lwfCompany: 0,
      usePfCap: false,
      esicCovered: 'No',
      calculationBasis: 'Old Basis'
    };
  };


  // Bulk Payroll Generation handler
  const handleGenerateBulkPayroll = async () => {
    if (!fromDate || !toDate) {
      setSnackbar({ open: true, message: 'Please select both From Date and To Date', severity: 'error' });
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      setSnackbar({ open: true, message: 'From Date cannot be after To Date', severity: 'error' });
      return;
    }

    try {
      setIsProcessing(true);
      setProgressPercent(5);
      setProgressText('Fetching active employees...');
      setBatchRecords([]);
      setSummaryStats({
        totalEmployees: 0,
        payrollGenerated: 0,
        payslipsGenerated: 0,
        failedCount: 0,
        completed: false
      });

      // 1. Fetch active employees
      const empRes = await apiService.getEmployees(1, 1000);
      let allEmps: any[] = [];
      if (empRes.success && empRes.data?.content) {
        allEmps = empRes.data.content;
      }

      // Filter active employees
      const activeEmps = allEmps.filter((e: any) => e.status === 'ACTIVE' || !e.status);

      if (activeEmps.length === 0) {
        setSnackbar({ open: true, message: 'No active employees found to generate payroll.', severity: 'warning' });
        setIsProcessing(false);
        return;
      }

      // 2. Fetch existing payslips for duplicate handling
      const payslipRes = await apiService.getPayslips();
      const existingPayslips: any[] = payslipRes.success && payslipRes.data ? payslipRes.data : [];

      const fromDateObj = new Date(fromDate);
      const selectedMonth = fromDateObj.getMonth() + 1;
      const selectedYear = fromDateObj.getFullYear();

      const records: BatchRecord[] = [];
      let generatedCount = 0;
      let failedCount = 0;

      // 3. Loop through every employee
      for (let i = 0; i < activeEmps.length; i++) {
        const emp = activeEmps[i];
        const pct = Math.round(((i + 1) / activeEmps.length) * 80) + 10;
        setProgressPercent(pct);
        setProgressText(`Processing ${i + 1} of ${activeEmps.length}: ${emp.firstName} ${emp.lastName} (${emp.employeeId || 'EMP-' + emp.id})`);

        try {
          // Calculate attendance for date range
          let workingDays = 0;
          let presentDays = 0;

          const rangeRes = await apiService.getEmployeeAttendanceRangeStats(emp.id, fromDate, toDate);
          if (rangeRes.success && rangeRes.data) {
            workingDays = rangeRes.data.workingDays || 0;
            presentDays = rangeRes.data.presentDays || 0;
          } else {
            const start = new Date(fromDate);
            const end = new Date(toDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            workingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            presentDays = 0;
          }

          // Fetch employee salary structure
          const salStruct = await fetchEmployeeSalaryStructure(emp);


          // Calculate salary components using existing logic
          const calcRes = computeSalaryForEmployee(workingDays, presentDays, salStruct);

          const payrollDataPayload = {
            employeeId: emp.id,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            fromDate,
            toDate,
            month: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`,
            year: selectedYear,
            workingDays,
            presentDays,
            status: bulkStatus,
            baseGrossSalary: salStruct.baseGrossSalary || calcRes.grossSalary,
            basicSalary: calcRes.basicSalary,
            allowances: calcRes.allowances,
            deductions: calcRes.deductions,
            grossSalary: calcRes.grossSalary,
            totalDeductions: calcRes.totalDeductions,
            netSalary: calcRes.netSalary,
            baseBasic: calcRes.baseBasic,
            baseHra: calcRes.baseHra,
            baseOther: calcRes.baseOther,
            baseBonus: calcRes.baseBonus,
            baseLeave: calcRes.baseLeave,
            baseAdvance: calcRes.baseAdvance,
            pTax: calcRes.pTax,
            lwfSelf: calcRes.lwfSelf,
            lwfCompany: calcRes.lwfCompany,
            usePfCap: calcRes.usePfCap,
            esicCovered: calcRes.esicCovered,
            calculationBasis: calcRes.calculationBasis,
            emrPf: calcRes.emrPf,
            emrEsic: calcRes.emrEsic,
            emrGratuity: calcRes.emrGratuity,
            emrLwf: calcRes.emrLwf,
            companyAdditionalCost: calcRes.companyAdditionalCost,
            totalCtc: calcRes.totalCtc,
          };

          const payslipPayload = {
            employee_id: emp.id,
            month: selectedMonth,
            year: selectedYear,
            gross_salary: calcRes.grossSalary,
            net_salary: calcRes.netSalary,
            payroll_data: payrollDataPayload,
          };

          // Keep track of existing duplicate but DO NOT save to DB yet (save when Generate Payslip is clicked)
          const existing = existingPayslips.find(
            (p: any) => p.employee_id === emp.id && Number(p.month) === selectedMonth && Number(p.year) === selectedYear
          );

          let createdPayslipId: number | undefined = existing ? existing.id : undefined;

          generatedCount++;

          const pfAdminCharges = (calcRes.basicSalary > 0 ? (calcRes.usePfCap && calcRes.basicSalary > 15000 ? 150 : Math.round(calcRes.basicSalary * 0.01)) : 0);

          records.push({
            employeeId: emp.id,
            employeeCode: emp.employeeId || `EMP-${emp.id}`,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            department: emp.departmentName || emp.department?.name || 'N/A',
            designation: emp.designationName || emp.designation?.name || 'N/A',
            workingDays,
            presentDays,
            grossSalary: calcRes.grossSalary,
            totalDeductions: calcRes.totalDeductions,
            netSalary: calcRes.netSalary,
            payrollStatus: bulkStatus,
            payslipId: createdPayslipId,
            payslipGenerated: false,
            payrollPayload: payslipPayload,

            // Detailed Excel structure values
            esicCovered: calcRes.esicCovered || 'No',
            baseBasic: calcRes.baseBasic || 0,
            baseHra: calcRes.baseHra || 0,
            baseOther: calcRes.baseOther || 0,
            baseBonus: calcRes.baseBonus || 0,
            baseLeave: calcRes.baseLeave || 0,
            baseAdvance: calcRes.baseAdvance || 0,
            baseGrossSalary: calcRes.baseGrossSalary || 0,
            basicSalary: calcRes.basicSalary || 0,
            allowances: calcRes.allowances || { hra: 0, transport: 0, medical: 0, other: 0, advanceBonus: 0 },
            deductions: calcRes.deductions || { pf: 0, esi: 0, tax: 0, other: 0, tds: 0, covidInsurance: 0 },
            emrPf: calcRes.emrPf || 0,
            pfAdminCharges,
            emrEsic: calcRes.emrEsic || 0,
            emrLwf: calcRes.emrLwf || 0,
            emrGratuity: calcRes.emrGratuity || 0,
            companyAdditionalCost: calcRes.companyAdditionalCost || 0,
            totalCtc: calcRes.totalCtc || 0
          });

        } catch (err: any) {
          console.error(`Failed to generate payroll for employee ${emp.id}:`, err);
          failedCount++;
          records.push({
            employeeId: emp.id,
            employeeCode: emp.employeeId || `EMP-${emp.id}`,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            department: emp.departmentName || emp.department?.name || 'N/A',
            designation: emp.designationName || emp.designation?.name || 'N/A',
            workingDays: 0,
            presentDays: 0,
            grossSalary: 0,
            totalDeductions: 0,
            netSalary: 0,
            payrollStatus: 'FAILED',
            error: err.message || 'Failed to generate payroll record'
          });
        }
      }

      setBatchRecords(records);
      setProgressPercent(100);
      setProgressText('Payroll generation completed!');

      setSummaryStats({
        totalEmployees: activeEmps.length,
        payrollGenerated: generatedCount,
        payslipsGenerated: 0,
        failedCount,
        completed: true
      });

      setSnackbar({
        open: true,
        message: `Bulk payroll generated successfully! ${generatedCount} generated, ${failedCount} failed.`,
        severity: failedCount === 0 ? 'success' : 'warning'
      });

    } catch (error: any) {
      console.error('Error during bulk payroll generation:', error);
      setSnackbar({ open: true, message: 'Bulk payroll generation failed. Please try again.', severity: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk Payslip PDF Generation handler
  const handleGenerateBulkPayslips = async () => {
    if (batchRecords.length === 0) {
      setSnackbar({ open: true, message: 'No payroll records found to generate payslips.', severity: 'warning' });
      return;
    }

    const validRecords = batchRecords.filter(r => r.payrollStatus !== 'FAILED');
    if (validRecords.length === 0) {
      setSnackbar({ open: true, message: 'No valid payroll records found for payslip PDF generation.', severity: 'warning' });
      return;
    }

    try {
      setIsGeneratingPayslips(true);
      let payslipsCount = 0;
      let payslipFailures = 0;

      const updatedRecords = [...batchRecords];

      for (let i = 0; i < updatedRecords.length; i++) {
        const rec = updatedRecords[i];
        if (rec.payrollStatus === 'FAILED') continue;

        setProgressText(`Generating Payslip PDF ${i + 1} of ${updatedRecords.length}: ${rec.employeeName}`);

        try {
          let finalPayslipId = rec.payslipId;
          if (rec.payrollPayload) {
            if (finalPayslipId) {
              await apiService.updatePayslip(finalPayslipId, rec.payrollPayload as any);
            } else {
              const createRes = await apiService.createPayslip(rec.payrollPayload as any);
              finalPayslipId = createRes.id || (createRes.data ? createRes.data.id : undefined);
              rec.payslipId = finalPayslipId;
            }
          }

          if (!finalPayslipId) {
            throw new Error('No Payslip ID available');
          }

          const pdfUrl = `${API_BASE_URL}/api/payroll/${finalPayslipId}/pdf`;
          const res = await fetch(pdfUrl);
          if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Payslip_${rec.employeeName.replace(/\s+/g, '_')}_${rec.month}_${rec.year}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            rec.payslipGenerated = true;
            payslipsCount++;
          } else {
            rec.payslipGenerated = false;
            rec.error = rec.error ? `${rec.error}; PDF fetch failed` : 'Payslip PDF generation failed';
            payslipFailures++;
          }
        } catch (err: any) {
          console.error(`Error generating payslip PDF for ID ${rec.payslipId}:`, err);
          rec.payslipGenerated = false;
          rec.error = rec.error ? `${rec.error}; PDF error` : err.message || 'PDF error';
          payslipFailures++;
        }
      }

      setBatchRecords(updatedRecords);
      setSummaryStats(prev => ({
        ...prev,
        payslipsGenerated: payslipsCount,
        failedCount: prev.failedCount + payslipFailures
      }));

      setSnackbar({
        open: true,
        message: `Payslips generated successfully for ${payslipsCount} employees!`,
        severity: payslipFailures === 0 ? 'success' : 'warning'
      });
    } catch (error: any) {
      console.error('Error generating bulk payslips:', error);
      setSnackbar({ open: true, message: 'Error generating payslips.', severity: 'error' });
    } finally {
      setIsGeneratingPayslips(false);
    }
  };

  const handleViewPdf = (payslipId: number) => {
    window.open(`${API_BASE_URL}/api/payroll/${payslipId}/pdf`, '_blank');
  };

  const handleDownloadPdf = async (payslipId: number, empName: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payroll/${payslipId}/pdf`);
      if (!res.ok) throw new Error('Failed to fetch PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payslip_${empName.replace(/\s+/g, '_')}_${payslipId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download PDF.');
    }
  };

  const handleSingleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      const [yearStr, monthStr] = payroll.month.split('-');
      const payslipPayload = {
        employee_id: payroll.employeeId,
        month: parseInt(monthStr, 10),
        year: parseInt(yearStr, 10),
        gross_salary: payroll.grossSalary,
        net_salary: payroll.netSalary,
        payroll_data: payroll,
      };

      if (isEdit && id) {
        await apiService.updatePayslip(parseInt(id), payslipPayload as any);
        setSnackbar({ open: true, message: 'Payslip updated successfully!', severity: 'success' });
      }
      setTimeout(() => navigate('/payslips'), 1500);
    } catch (error) {
      console.error('Error saving payroll:', error);
      setSnackbar({ open: true, message: 'Error saving payroll. Please try again.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Render Single-Employee Edit Form
  if (isEdit) {
    return (
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Edit Payroll
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Edit payroll record for employee.
        </Typography>
        <Paper elevation={2} sx={{ p: 3 }}>
          <form onSubmit={handleSingleSubmit}>
            <Grid container spacing={3}>
              <Grid size={12}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth required>
                  <InputLabel id="payroll-employee-label" shrink>Employee</InputLabel>
                  <Select
                    labelId="payroll-employee-label"
                    value={payroll.employeeId || ''}
                    label="Employee"
                    disabled
                  >
                    {employees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName} ({employee.employeeId})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Month"
                  type="month"
                  required
                  value={payroll.month}
                  onChange={(e) => setPayroll({ ...payroll, month: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel id="payroll-status-label" shrink>Status</InputLabel>
                  <Select
                    labelId="payroll-status-label"
                    value={payroll.status}
                    label="Status"
                    onChange={(e) => setPayroll({ ...payroll, status: e.target.value as any })}
                  >
                    <MenuItem value="DRAFT">Draft</MenuItem>
                    <MenuItem value="PROCESSED">Processed</MenuItem>
                    <MenuItem value="PAID">Paid</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                  <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => navigate('/payslips')}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                    sx={{
                      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                      color: 'white',
                    }}
                  >
                    {loading ? 'Saving...' : 'Update Payroll'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    );
  }

  // Render Bulk Payroll & Payslip Generation View
  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Bulk Payroll & Payslip Generation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generate bulk payroll and payslips for all active employees for the selected Date Range.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => navigate('/payslips')}
          sx={{ fontWeight: 'bold' }}
        >
          View Payslip History
        </Button>
      </Box>

      {/* Date Range Selection Controls */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
          Select Date Range for Bulk Processing
        </Typography>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="From Date"
              type="date"
              required
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={summaryStats.completed}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="To Date"
              type="date"
              required
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={summaryStats.completed}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel id="bulk-status-label" shrink>Payroll Status</InputLabel>
              <Select
                labelId="bulk-status-label"
                value={bulkStatus}
                label="Payroll Status"
                onChange={(e) => setBulkStatus(e.target.value as any)}
                disabled={summaryStats.completed}
              >
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="PROCESSED">Processed</MenuItem>
                <MenuItem value="PAID">Paid</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                disabled={isProcessing || isGeneratingPayslips || summaryStats.completed}
                onClick={handleGenerateBulkPayroll}
                sx={{
                  px: 4,
                  py: 1.2,
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                  boxShadow: '0 4px 12px rgba(30, 60, 114, 0.25)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #152954 0%, #1c3d75 100%)',
                    boxShadow: '0 6px 16px rgba(30, 60, 114, 0.4)',
                  }
                }}
              >
                {isProcessing ? 'Processing...' : 'Generate Payroll'}
              </Button>
              {summaryStats.completed && (
                <>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => {
                      setBatchRecords([]);
                      setSummaryStats({
                        totalEmployees: 0,
                        payrollGenerated: 0,
                        payslipsGenerated: 0,
                        failedCount: 0,
                        completed: false,
                      });
                    }}
                    sx={{
                      ml: 2,
                      px: 4,
                      py: 1.2,
                      fontWeight: 'bold',
                      fontSize: '1rem',
                    }}
                  >
                    Reset Selection
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="large"
                    onClick={() => navigate('/payslips')}
                    sx={{
                      ml: 2,
                      px: 4,
                      py: 1.2,
                      fontWeight: 'bold',
                      fontSize: '1rem',
                    }}
                  >
                    View Payslip History
                  </Button>
                </>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Progress Indicator */}
        {(isProcessing || isGeneratingPayslips) && (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="primary" fontWeight="bold">
                {progressText}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {progressPercent}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={progressPercent} sx={{ height: 8, borderRadius: 4 }} />
          </Box>
        )}
      </Paper>

      {/* Summary Cards & Banner */}
      {summaryStats.completed && (
        <Box sx={{ mb: 4 }}>
          <Alert severity={summaryStats.failedCount === 0 ? "success" : "warning"} icon={<CheckCircleIcon fontSize="inherit" />} sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Payroll Generated Successfully
            </Typography>
            <Typography variant="body2">
              Batch processing executed from <strong>{fromDate}</strong> to <strong>{toDate}</strong>.
            </Typography>
          </Alert>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', border: '1px solid #90caf9' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase">
                    Total Employees
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ mt: 0.5 }}>
                    {summaryStats.totalEmployees}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', border: '1px solid #a5d6a7' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase">
                    Payroll Generated
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ mt: 0.5 }}>
                    {summaryStats.payrollGenerated}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)', border: '1px solid #ce93d8' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase">
                    Payslips Generated
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="secondary.main" sx={{ mt: 0.5 }}>
                    {summaryStats.payslipsGenerated}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ background: summaryStats.failedCount > 0 ? 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' : '#fafafa', border: summaryStats.failedCount > 0 ? '1px solid #ef9a9a' : '1px solid #e0e0e0' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase">
                    Failed
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color={summaryStats.failedCount > 0 ? "error.main" : "text.secondary"} sx={{ mt: 0.5 }}>
                    {summaryStats.failedCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Payroll Summary Table */}
      {batchRecords.length > 0 && (
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Payroll Summary Table ({batchRecords.length} Employees)
              </Typography>
              <Box sx={{ display: 'inline-flex', bgcolor: '#f0f4f8', p: 0.5, borderRadius: 1.5 }}>
                <Button
                  size="small"
                  variant={summaryViewMode === 'detailed' ? 'contained' : 'text'}
                  color="primary"
                  onClick={() => setSummaryViewMode('detailed')}
                  sx={{ textTransform: 'none', fontWeight: 'bold', fontSize: '0.8rem', py: 0.5 }}
                >
                  Full Wage Breakdown (Excel Format)
                </Button>
                <Button
                  size="small"
                  variant={summaryViewMode === 'compact' ? 'contained' : 'text'}
                  color="primary"
                  onClick={() => setSummaryViewMode('compact')}
                  sx={{ textTransform: 'none', fontWeight: 'bold', fontSize: '0.8rem', py: 0.5 }}
                >
                  Compact Summary
                </Button>
              </Box>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={handleExportExcel}
              disabled={batchRecords.length === 0}
              sx={{
                borderRadius: 2,
                px: 3,
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #107c41 0%, #1f8a4c 100%)',
                boxShadow: '0 4px 12px rgba(16, 124, 65, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0b5c30 0%, #15733e 100%)',
                }
              }}
            >
              Export to Excel (34 Columns)
            </Button>
          </Box>

          <TableContainer sx={{ maxHeight: 600, border: '1px solid #e0e0e0', borderRadius: 1.5 }}>
            {summaryViewMode === 'compact' ? (
              <Table size="small" stickyHeader>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell><strong>Employee ID</strong></TableCell>
                    <TableCell><strong>Employee Code</strong></TableCell>
                    <TableCell><strong>Employee Name</strong></TableCell>
                    <TableCell><strong>Department</strong></TableCell>
                    <TableCell><strong>Designation</strong></TableCell>
                    <TableCell align="center"><strong>Payable Days</strong></TableCell>
                    <TableCell align="center"><strong>Paid Days</strong></TableCell>
                    <TableCell align="right"><strong>Gross Salary</strong></TableCell>
                    <TableCell align="right"><strong>Total Deductions</strong></TableCell>
                    <TableCell align="right"><strong>Net Salary</strong></TableCell>
                    <TableCell align="center"><strong>Payroll Status</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {batchRecords.map((row) => (
                    <TableRow key={row.employeeId} hover>
                      <TableCell>{row.employeeId}</TableCell>
                      <TableCell><strong>{row.employeeCode}</strong></TableCell>
                      <TableCell>{row.employeeName}</TableCell>
                      <TableCell>{row.department}</TableCell>
                      <TableCell>{row.designation}</TableCell>
                      <TableCell align="center">{row.workingDays}</TableCell>
                      <TableCell align="center">{row.presentDays}</TableCell>
                      <TableCell align="right">₹{row.grossSalary.toLocaleString('en-IN')}</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>₹{row.totalDeductions.toLocaleString('en-IN')}</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                        ₹{row.netSalary.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.payrollStatus}
                          color={row.payrollStatus === 'FAILED' ? 'error' : row.payrollStatus === 'PROCESSED' ? 'primary' : 'success'}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {row.payslipId ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            {row.payslipGenerated && (
                              <Chip label="Generated" color="success" size="small" icon={<CheckCircleIcon fontSize="small" />} sx={{ height: 20, fontSize: '0.65rem' }} />
                            )}
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <Tooltip title="View Payslip PDF">
                                <IconButton color="info" size="small" onClick={() => handleViewPdf(row.payslipId!)}>
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Download Payslip PDF">
                                <IconButton color="success" size="small" onClick={() => handleDownloadPdf(row.payslipId!, row.employeeName)}>
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Table size="small" stickyHeader sx={{ minWidth: 2600 }}>
                {/* Tier 1: Category Super-headers */}
                <TableHead>
                  <TableRow>
                    <TableCell colSpan={5} sx={{ backgroundColor: '#e2e8f0', fontWeight: 'bold', textAlign: 'center', borderRight: '2px solid #cbd5e1' }}>
                      EMPLOYEE BASIC INFO
                    </TableCell>
                    <TableCell colSpan={7} sx={{ backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 'bold', textAlign: 'center', borderRight: '2px solid #93c5fd' }}>
                      RATE OF WAGES
                    </TableCell>
                    <TableCell colSpan={7} sx={{ backgroundColor: '#fce7f3', color: '#9d174d', fontWeight: 'bold', textAlign: 'center', borderRight: '2px solid #f9a8d4' }}>
                      EARNED WAGES
                    </TableCell>
                    <TableCell colSpan={7} sx={{ backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: 'bold', textAlign: 'center', borderRight: '2px solid #fca5a5' }}>
                      DEDUCTIONS
                    </TableCell>
                    <TableCell sx={{ backgroundColor: '#fef08a', color: '#854d0e', fontWeight: 'bold', textAlign: 'center', borderRight: '2px solid #fde047' }}>
                      NET AMOUNT
                    </TableCell>
                    <TableCell colSpan={6} sx={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 'bold', textAlign: 'center', borderRight: '2px solid #7dd3fc' }}>
                      EMR CONTRIBUTION
                    </TableCell>
                    <TableCell sx={{ backgroundColor: '#dcfce7', color: '#166534', fontWeight: 'bold', textAlign: 'center' }}>
                      CTC
                    </TableCell>
                  </TableRow>

                  {/* Tier 2: Exact Column Sub-headers */}
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ minWidth: 160, fontWeight: 'bold' }}>Employee Name</TableCell>
                    <TableCell sx={{ minWidth: 130, fontWeight: 'bold' }}>Employee ID</TableCell>
                    <TableCell sx={{ minWidth: 90, textAlign: 'center', fontWeight: 'bold' }}>ESIC</TableCell>
                    <TableCell sx={{ minWidth: 90, textAlign: 'center', fontWeight: 'bold' }}>Payable</TableCell>
                    <TableCell sx={{ minWidth: 80, textAlign: 'center', fontWeight: 'bold', borderRight: '2px solid #cbd5e1' }}>Paid</TableCell>

                    {/* Rate of Wages */}
                    <TableCell sx={{ minWidth: 100, textAlign: 'right', fontWeight: 'bold', bgcolor: '#eff6ff' }}>Basic</TableCell>
                    <TableCell sx={{ minWidth: 100, textAlign: 'right', fontWeight: 'bold', bgcolor: '#eff6ff' }}>HRA</TableCell>
                    <TableCell sx={{ minWidth: 100, textAlign: 'right', fontWeight: 'bold', bgcolor: '#eff6ff' }}>Other Allow</TableCell>
                    <TableCell sx={{ minWidth: 100, textAlign: 'right', fontWeight: 'bold', bgcolor: '#eff6ff' }}>Perf Bonus</TableCell>
                    <TableCell sx={{ minWidth: 110, textAlign: 'right', fontWeight: 'bold', bgcolor: '#eff6ff' }}>Leave Encash</TableCell>
                    <TableCell sx={{ minWidth: 100, textAlign: 'right', fontWeight: 'bold', bgcolor: '#eff6ff' }}>Adv Bonus</TableCell>
                    <TableCell sx={{ minWidth: 110, textAlign: 'right', fontWeight: 'bold', bgcolor: '#dbeafe', color: '#1e40af', borderRight: '2px solid #93c5fd' }}>Gross</TableCell>

                    {/* Earned Wages */}
                    <TableCell sx={{ minWidth: 100, textAlign: 'right', fontWeight: 'bold', bgcolor: '#fdf2f8' }}>Basic</TableCell>
                    <TableCell sx={{ minWidth: 100, textAlign: 'right', fontWeight: 'bold', bgcolor: '#fdf2f8' }}>HRA</TableCell>
                    <TableCell sx={{ minWidth: 100, textAlign: 'right', fontWeight: 'bold', bgcolor: '#fdf2f8' }}>Other Allow</TableCell>
                    <TableCell sx={{ minWidth: 100, textAlign: 'right', fontWeight: 'bold', bgcolor: '#fdf2f8' }}>Perf Bonus</TableCell>
                    <TableCell sx={{ minWidth: 110, textAlign: 'right', fontWeight: 'bold', bgcolor: '#fdf2f8' }}>Leave Encash</TableCell>
                    <TableCell sx={{ minWidth: 100, textAlign: 'right', fontWeight: 'bold', bgcolor: '#fdf2f8' }}>Adv Bonus</TableCell>
                    <TableCell sx={{ minWidth: 110, textAlign: 'right', fontWeight: 'bold', bgcolor: '#fce7f3', color: '#9d174d', borderRight: '2px solid #f9a8d4' }}>Gross</TableCell>

                    {/* Deductions */}
                    <TableCell sx={{ minWidth: 100, textAlign: 'right', fontWeight: 'bold', bgcolor: '#fef2f2' }}>PF 12%</TableCell>
                    <TableCell sx={{ minWidth: 90, textAlign: 'right', fontWeight: 'bold', bgcolor: '#fef2f2' }}>ESIC 0.75%</TableCell>
                    <TableCell sx={{ minWidth: 80, textAlign: 'right', fontWeight: 'bold', bgcolor: '#fef2f2' }}>P.Tax</TableCell>
                    <TableCell sx={{ minWidth: 80, textAlign: 'right', fontWeight: 'bold', bgcolor: '#fef2f2' }}>LWF EE</TableCell>
                    <TableCell sx={{ minWidth: 70, textAlign: 'right', fontWeight: 'bold', bgcolor: '#fef2f2' }}>TDS</TableCell>
                    <TableCell sx={{ minWidth: 80, textAlign: 'right', fontWeight: 'bold', bgcolor: '#fef2f2' }}>Covid</TableCell>
                    <TableCell sx={{ minWidth: 100, textAlign: 'right', fontWeight: 'bold', bgcolor: '#fee2e2', color: '#991b1b', borderRight: '2px solid #fca5a5' }}>Tot Dedn</TableCell>

                    {/* Net Amt */}
                    <TableCell sx={{ minWidth: 120, textAlign: 'right', fontWeight: 'bold', bgcolor: '#fef08a', color: '#854d0e', borderRight: '2px solid #fde047' }}>Net Amt</TableCell>

                    {/* EMR Contribution */}
                    <TableCell sx={{ minWidth: 100, textAlign: 'right', fontWeight: 'bold', bgcolor: '#f0f9ff' }}>EMR PF</TableCell>
                    <TableCell sx={{ minWidth: 90, textAlign: 'right', fontWeight: 'bold', bgcolor: '#f0f9ff' }}>PF Admin</TableCell>
                    <TableCell sx={{ minWidth: 90, textAlign: 'right', fontWeight: 'bold', bgcolor: '#f0f9ff' }}>EMR ESIC</TableCell>
                    <TableCell sx={{ minWidth: 80, textAlign: 'right', fontWeight: 'bold', bgcolor: '#f0f9ff' }}>EMR LWF</TableCell>
                    <TableCell sx={{ minWidth: 90, textAlign: 'right', fontWeight: 'bold', bgcolor: '#f0f9ff' }}>Gratuity</TableCell>
                    <TableCell sx={{ minWidth: 110, textAlign: 'right', fontWeight: 'bold', bgcolor: '#e0f2fe', color: '#0369a1', borderRight: '2px solid #7dd3fc' }}>Tot EMR</TableCell>

                    {/* CTC */}
                    <TableCell sx={{ minWidth: 120, textAlign: 'right', fontWeight: 'bold', bgcolor: '#dcfce7', color: '#166534' }}>CTC</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {batchRecords.map((row) => {
                    const proBasic = row.basicSalary ?? 0;
                    const proHra = row.allowances?.hra ?? 0;
                    const proOther = row.allowances?.other ?? 0;
                    const proBonus = row.allowances?.transport ?? 0;
                    const proLeave = row.allowances?.medical ?? 0;
                    const proAdvance = row.allowances?.advanceBonus ?? 0;
                    const proGross = row.grossSalary ?? (proBasic + proHra + proOther + proBonus + proLeave + proAdvance);

                    const emyPf = row.deductions?.pf ?? 0;
                    const emyEsic = row.deductions?.esi ?? 0;
                    const pTax = row.deductions?.tax ?? 0;
                    const lwfEe = row.deductions?.other ?? 0;
                    const tds = row.deductions?.tds ?? 0;
                    const covid = row.deductions?.covidInsurance ?? 0;
                    const totDedn = row.totalDeductions ?? (emyPf + emyEsic + pTax + lwfEe + tds + covid);
                    const netAmt = row.netSalary ?? Math.max(0, proGross - totDedn);

                    const emrPf = row.emrPf ?? 0;
                    const pfAdmin = row.pfAdminCharges ?? (proBasic > 0 ? Math.round(proBasic * 0.01) : 0);
                    const emrEsic = row.emrEsic ?? 0;
                    const emrLwf = row.emrLwf ?? 0;
                    const gratuity = row.emrGratuity ?? 0;
                    const totEmr = row.companyAdditionalCost ?? (emrPf + pfAdmin + emrEsic + emrLwf + gratuity);
                    const ctc = row.totalCtc ?? (proGross + totEmr);

                    return (
                      <TableRow key={row.employeeId} hover>
                        <TableCell sx={{ fontWeight: 'bold' }}>{row.employeeName}</TableCell>
                        <TableCell>{row.employeeCode}</TableCell>
                        <TableCell align="center">
                          <Chip label={row.esicCovered || 'No'} size="small" variant="outlined" color={row.esicCovered === 'Yes' ? 'primary' : 'default'} sx={{ height: 20, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell align="center">{row.workingDays}</TableCell>
                        <TableCell align="center" sx={{ borderRight: '2px solid #cbd5e1', fontWeight: 'bold' }}>{row.presentDays}</TableCell>

                        {/* Rate of Wages */}
                        <TableCell align="right">₹{(row.baseBasic ?? 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">₹{(row.baseHra ?? 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">₹{(row.baseOther ?? 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">{row.baseBonus ? `₹${row.baseBonus.toLocaleString('en-IN')}` : '-'}</TableCell>
                        <TableCell align="right">{row.baseLeave ? `₹${row.baseLeave.toLocaleString('en-IN')}` : '-'}</TableCell>
                        <TableCell align="right">{row.baseAdvance ? `₹${row.baseAdvance.toLocaleString('en-IN')}` : '-'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#f0f7ff', borderRight: '2px solid #93c5fd' }}>
                          ₹{(row.baseGrossSalary ?? 0).toLocaleString('en-IN')}
                        </TableCell>

                        {/* Earned Wages */}
                        <TableCell align="right">₹{proBasic.toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">₹{proHra.toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">₹{proOther.toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">{proBonus ? `₹${proBonus.toLocaleString('en-IN')}` : '-'}</TableCell>
                        <TableCell align="right">{proLeave ? `₹${proLeave.toLocaleString('en-IN')}` : '-'}</TableCell>
                        <TableCell align="right">{proAdvance ? `₹${proAdvance.toLocaleString('en-IN')}` : '-'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#fff1f2', borderRight: '2px solid #f9a8d4' }}>
                          ₹{proGross.toLocaleString('en-IN')}
                        </TableCell>

                        {/* Deductions */}
                        <TableCell align="right">₹{emyPf.toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">₹{emyEsic.toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">₹{pTax.toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">₹{lwfEe.toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">{tds ? `₹${tds.toLocaleString('en-IN')}` : '-'}</TableCell>
                        <TableCell align="right">{covid ? `₹${covid.toLocaleString('en-IN')}` : '-'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main', bgcolor: '#fef2f2', borderRight: '2px solid #fca5a5' }}>
                          ₹{totDedn.toLocaleString('en-IN')}
                        </TableCell>

                        {/* Net Amt */}
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: '#854d0e', bgcolor: '#fef9c3', borderRight: '2px solid #fde047' }}>
                          ₹{netAmt.toLocaleString('en-IN')}
                        </TableCell>

                        {/* EMR Contribution */}
                        <TableCell align="right">₹{emrPf.toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">₹{pfAdmin.toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">₹{emrEsic.toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">₹{emrLwf.toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">₹{gratuity.toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#f0f9ff', borderRight: '2px solid #7dd3fc' }}>
                          ₹{totEmr.toLocaleString('en-IN')}
                        </TableCell>

                        {/* CTC */}
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.dark', bgcolor: '#f0fdf4' }}>
                          ₹{ctc.toLocaleString('en-IN')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TableContainer>

          {/* Generate Payslip Button below table */}
          {summaryStats.payslipsGenerated === 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  startIcon={isGeneratingPayslips ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdfIcon />}
                  disabled={isProcessing || isGeneratingPayslips || batchRecords.length === 0}
                  onClick={handleGenerateBulkPayslips}
                  sx={{
                    px: 4,
                    py: 1.2,
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    boxShadow: '0 4px 12px rgba(156, 39, 176, 0.25)',
                  }}
                >
                  {isGeneratingPayslips ? 'Generating Payslips...' : 'Generate Payslip'}
                </Button>
              </Box>
            </>
          )}
        </Paper>
      )}

      {/* Failed Employees Summary Log (if any) */}
      {batchRecords.filter(r => r.payrollStatus === 'FAILED' || r.error).length > 0 && (
        <Alert severity="error" icon={<ErrorIcon fontSize="inherit" />} sx={{ mb: 4, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Failed Employees Summary
          </Typography>
          {batchRecords.filter(r => r.payrollStatus === 'FAILED' || r.error).map(r => (
            <Typography key={r.employeeId} variant="body2">
              • <strong>{r.employeeName}</strong> ({r.employeeCode}): {r.error || 'Failed during processing'}
            </Typography>
          ))}
        </Alert>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
          sx={{ whiteSpace: 'pre-line', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PayrollForm;
