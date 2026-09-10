// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  TableChart as TableChartIcon,
  AccountBalance as BankIcon,
  Lock as LockIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import * as XLSX from 'xlsx';

interface PaymentSheetRecord {
  id: number;
  month_str: string;
  start_date: string;
  end_date: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  sent_date: string | null;
  sent_by?: number | null;
  approved_by?: number | null;
  approved_date: string | null;
  total_employees: number;
  total_gross: number;
  total_net: number;
  sheet_data: any[] | string;
  notes?: string | null;
}

export const PaymentSheet: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentSheets, setPaymentSheets] = useState<PaymentSheetRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [selectedSheet, setSelectedSheet] = useState<PaymentSheetRecord | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Edit employee rows state
  const [editingRows, setEditingRows] = useState<any[]>([]);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Search inside view modal
  const [viewSearchQuery, setViewSearchQuery] = useState('');

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchPaymentSheets = async () => {
    try {
      setLoading(true);
      const res = await apiService.getPaymentSheets();
      if (res.success && res.data) {
        setPaymentSheets(res.data);
      } else {
        setPaymentSheets([]);
      }
    } catch (error) {
      console.error('Error fetching payment sheets:', error);
      setSnackbar({ open: true, message: 'Failed to load payment sheets', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentSheets();
  }, []);

  // Format date helper: YYYY-MM-DD -> DD/MM/YY
  const formatDateShort = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parts[0].slice(-2);
        const month = parts[1];
        const day = parts[2].slice(0, 2);
        return `${day}/${month}/${year}`;
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = String(d.getFullYear()).slice(-2);
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateStr || '-';
    }
  };

  // Helper to parse sheet_data safely
  const parseSheetData = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  // Filtered sheets list
  const filteredSheets = useMemo(() => {
    return paymentSheets.filter((sheet) => {
      const matchesSearch =
        !searchQuery ||
        sheet.month_str?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sheet.start_date?.includes(searchQuery) ||
        sheet.end_date?.includes(searchQuery);

      const matchesStatus =
        statusFilter === 'ALL' || sheet.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [paymentSheets, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = paymentSheets.length;
    const approved = paymentSheets.filter((s) => s.status === 'APPROVED').length;
    const pending = paymentSheets.filter((s) => s.status === 'PENDING_APPROVAL').length;
    const totalNetPayout = paymentSheets.reduce((sum, s) => sum + Number(s.total_net || 0), 0);
    return { total, approved, pending, totalNetPayout };
  }, [paymentSheets]);

  // Handler: Open View Modal
  const handleOpenView = async (sheet: PaymentSheetRecord) => {
    try {
      setLoading(true);
      const res = await apiService.getPaymentSheetById(sheet.id);
      if (res.success && res.data) {
        setSelectedSheet(res.data);
      } else {
        setSelectedSheet(sheet);
      }
      setViewSearchQuery('');
      setIsViewModalOpen(true);
    } catch (error) {
      setSelectedSheet(sheet);
      setIsViewModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Open Edit Modal
  const handleOpenEdit = async (sheet: PaymentSheetRecord) => {
    if (sheet.status === 'APPROVED' || sheet.status === 'PENDING_APPROVAL') {
      setSnackbar({
        open: true,
        message: 'This payment sheet has already been sent for approval and is frozen from editing.',
        severity: 'warning',
      });
      return;
    }

    try {
      setLoading(true);
      const res = await apiService.getPaymentSheetById(sheet.id);
      const targetSheet = res.success && res.data ? res.data : sheet;
      setSelectedSheet(targetSheet);
      const rows = parseSheetData(targetSheet.sheet_data);
      setEditingRows(JSON.parse(JSON.stringify(rows)));
      setIsEditModalOpen(true);
    } catch (error) {
      setSelectedSheet(sheet);
      setEditingRows(parseSheetData(sheet.sheet_data));
      setIsEditModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Save Edited Sheet
  const handleSaveEdit = async () => {
    if (!selectedSheet) return;
    try {
      setActionLoading(true);
      const res = await apiService.updatePaymentSheet(selectedSheet.id, {
        sheet_data: editingRows,
      });
      if (res.success) {
        setSnackbar({ open: true, message: 'Payment sheet updated successfully!', severity: 'success' });
        setIsEditModalOpen(false);
        fetchPaymentSheets();
      } else {
        setSnackbar({ open: true, message: res.message || 'Failed to update payment sheet', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Error updating payment sheet', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Open Send For Approval Modal
  const handleOpenApprovalDialog = (sheet: PaymentSheetRecord) => {
    if (sheet.status === 'APPROVED' || sheet.status === 'PENDING_APPROVAL') {
      setSnackbar({
        open: true,
        message: 'This payment sheet has already been submitted for approval.',
        severity: 'info',
      });
      return;
    }
    setSelectedSheet(sheet);
    setApprovalNotes('');
    setIsApprovalModalOpen(true);
  };

  // Handler: Submit Send for Approval
  const handleSubmitApproval = async () => {
    if (!selectedSheet) return;
    try {
      setActionLoading(true);
      const res = await apiService.sendPaymentSheetForApproval(selectedSheet.id);
      if (res.success) {
        setSnackbar({
          open: true,
          message: `Payment sheet for ${selectedSheet.month_str} sent for approval successfully!`,
          severity: 'success',
        });
        setIsApprovalModalOpen(false);
        fetchPaymentSheets();
      } else {
        setSnackbar({ open: true, message: res.message || 'Failed to send for approval', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Error sending for approval', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Approve Sheet
  const handleApproveSheet = async (sheetId: number) => {
    try {
      setActionLoading(true);
      const res = await apiService.approvePaymentSheet(sheetId);
      if (res.success) {
        setSnackbar({
          open: true,
          message: 'Payment sheet approved successfully! Edit and Approval actions are now frozen.',
          severity: 'success',
        });
        setIsViewModalOpen(false);
        fetchPaymentSheets();
      } else {
        setSnackbar({ open: true, message: res.message || 'Failed to approve payment sheet', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Error approving payment sheet', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Reject Sheet
  const handleRejectSheet = async () => {
    if (!selectedSheet) return;
    try {
      setActionLoading(true);
      const res = await apiService.rejectPaymentSheet(selectedSheet.id, rejectionReason);
      if (res.success) {
        setSnackbar({
          open: true,
          message: 'Payment sheet marked as rejected.',
          severity: 'warning',
        });
        setIsRejectModalOpen(false);
        setIsViewModalOpen(false);
        fetchPaymentSheets();
      } else {
        setSnackbar({ open: true, message: res.message || 'Failed to reject payment sheet', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Error rejecting payment sheet', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Download Payment Sheet as 34-Column Corporate Salary Register Excel
  const handleDownloadExcel = (sheet: PaymentSheetRecord) => {
    try {
      const rows = parseSheetData(sheet.sheet_data);
      if (rows.length === 0) {
        setSnackbar({ open: true, message: 'No employee records found in this payment sheet to download.', severity: 'warning' });
        return;
      }

      const periodStr = sheet.month_str || `${sheet.start_date} to ${sheet.end_date}`;

      let totals = {
        baseBasic: 0, baseHra: 0, baseOther: 0, baseBonus: 0, baseLeave: 0, baseAdvance: 0, baseGross: 0,
        proBasic: 0, proHra: 0, proOther: 0, proBonus: 0, proLeave: 0, proAdvance: 0, proGross: 0,
        emyPf: 0, emyEsic: 0, pTax: 0, lwfEe: 0, tds: 0, covid: 0, totDedn: 0, netAmt: 0,
        emrPf: 0, pfAdmin: 0, emrEsic: 0, emrLwf: 0, gratuity: 0, totEmr: 0, ctc: 0
      };

      const rowsHtml = rows.map((record: any, index: number) => {
        const proBasic = record.basicSalary ?? 0;
        const proHra = record.allowances?.hra ?? record.hra ?? 0;
        const proOther = record.allowances?.other ?? 0;
        const proBonus = record.allowances?.transport ?? 0;
        const proLeave = record.allowances?.medical ?? 0;
        const proAdvance = record.allowances?.advanceBonus ?? 0;
        const proGross = record.grossSalary ?? (proBasic + proHra + proOther + proBonus + proLeave + proAdvance);

        const emyPf = record.deductions?.pf ?? record.pf ?? 0;
        const emyEsic = record.deductions?.esi ?? record.esic ?? 0;
        const pTax = record.deductions?.tax ?? record.pTax ?? 0;
        const lwfEe = record.deductions?.other ?? record.lwfEe ?? 0;
        const tds = record.deductions?.tds ?? record.tds ?? 0;
        const covid = record.deductions?.covidInsurance ?? record.covid ?? 0;
        const totDedn = record.totalDeductions ?? (emyPf + emyEsic + pTax + lwfEe + tds + covid);
        const netAmt = record.netSalary ?? Math.max(0, proGross - totDedn);

        const emrPf = record.emrPf ?? 0;
        const pfAdmin = record.pfAdminCharges ?? 0;
        const emrEsic = record.emrEsic ?? 0;
        const emrLwf = record.emrLwf ?? 0;
        const gratuity = record.emrGratuity ?? 0;
        const totEmr = record.companyAdditionalCost ?? (emrPf + pfAdmin + emrEsic + emrLwf + gratuity);
        const ctc = record.totalCtc ?? (proGross + totEmr);

        const baseBasic = record.baseBasic ?? record.basicSalary ?? 0;
        const baseHra = record.baseHra ?? record.allowances?.hra ?? record.hra ?? 0;
        const baseOther = record.baseOther ?? record.allowances?.other ?? 0;
        const baseBonus = record.baseBonus ?? record.allowances?.transport ?? 0;
        const baseLeave = record.baseLeave ?? record.allowances?.medical ?? 0;
        const baseAdvance = record.baseAdvance ?? record.allowances?.advanceBonus ?? 0;
        const baseGross = record.baseGrossSalary || (baseBasic + baseHra + baseOther + baseBonus + baseLeave + baseAdvance);

        totals.baseBasic += baseBasic; totals.baseHra += baseHra; totals.baseOther += baseOther;
        totals.baseBonus += baseBonus; totals.baseLeave += baseLeave; totals.baseAdvance += baseAdvance; totals.baseGross += baseGross;
        totals.proBasic += proBasic; totals.proHra += proHra; totals.proOther += proOther;
        totals.proBonus += proBonus; totals.proLeave += proLeave; totals.proAdvance += proAdvance; totals.proGross += proGross;
        totals.emyPf += emyPf; totals.emyEsic += emyEsic; totals.pTax += pTax; totals.lwfEe += lwfEe;
        totals.tds += tds; totals.covid += covid; totals.totDedn += totDedn; totals.netAmt += netAmt;
        totals.emrPf += emrPf; totals.pfAdmin += pfAdmin; totals.emrEsic += emrEsic; totals.emrLwf += emrLwf;
        totals.gratuity += gratuity; totals.totEmr += totEmr; totals.ctc += ctc;

        const bgStyle = index % 2 === 0 ? 'background-color:#ffffff;' : 'background-color:#f8fafc;';

        const fmt = (num: number) => num ? num.toLocaleString('en-IN') : '-';
        const fmtN = (num: number) => num ? num.toLocaleString('en-IN') : '0';

        return `
          <tr style="${bgStyle}">
            <td style="text-align:left;font-weight:bold;border:1px solid #cbd5e1;padding:6px 10px;">${record.employeeName || ''}</td>
            <td style="text-align:center;border:1px solid #cbd5e1;padding:6px 10px;">${record.employeeCode || `EMP-${record.employeeId || ''}`}</td>
            <td style="text-align:center;border:1px solid #cbd5e1;padding:6px 10px;">${record.esicCovered || 'No'}</td>
            <td style="text-align:center;border:1px solid #cbd5e1;padding:6px 10px;">${record.workingDays ?? 0}</td>
            <td style="text-align:center;font-weight:bold;border:1px solid #cbd5e1;border-right:2px solid #64748b;padding:6px 10px;">${record.presentDays ?? 0}</td>

            <!-- Rate of Wages -->
            <td style="text-align:right;border:1px solid #cbd5e1;padding:6px 10px;">${fmt(baseBasic)}</td>
            <td style="text-align:right;border:1px solid #cbd5e1;padding:6px 10px;">${fmt(baseHra)}</td>
            <td style="text-align:right;border:1px solid #cbd5e1;padding:6px 10px;">${fmt(baseOther)}</td>
            <td style="text-align:right;border:1px solid #cbd5e1;padding:6px 10px;">${fmt(baseBonus)}</td>
            <td style="text-align:right;border:1px solid #cbd5e1;padding:6px 10px;">${fmt(baseLeave)}</td>
            <td style="text-align:right;border:1px solid #cbd5e1;padding:6px 10px;">${fmt(baseAdvance)}</td>
            <td style="text-align:right;font-weight:bold;background-color:#eff6ff;color:#1e40af;border:1px solid #cbd5e1;border-right:2px solid #3b82f6;padding:6px 10px;">${fmtN(baseGross)}</td>

            <!-- Earned Wages -->
            <td style="text-align:right;border:1px solid #cbd5e1;padding:6px 10px;">${fmt(proBasic)}</td>
            <td style="text-align:right;border:1px solid #cbd5e1;padding:6px 10px;">${fmt(proHra)}</td>
            <td style="text-align:right;border:1px solid #cbd5e1;padding:6px 10px;">${fmt(proOther)}</td>
            <td style="text-align:right;border:1px solid #cbd5e1;padding:6px 10px;">${fmt(proBonus)}</td>
            <td style="text-align:right;border:1px solid #cbd5e1;padding:6px 10px;">${fmt(proLeave)}</td>
            <td style="text-align:right;border:1px solid #cbd5e1;padding:6px 10px;">${fmt(proAdvance)}</td>
            <td style="text-align:right;font-weight:bold;background-color:#fff1f2;color:#9d174d;border:1px solid #cbd5e1;border-right:2px solid #ec4899;padding:6px 10px;">${fmtN(proGross)}</td>

            <!-- Deductions -->
            <td style="text-align:right;border:1px solid #cbd5e1;padding:6px 10px;">${fmt(emyPf)}</td>
            <td style="text-align:right;border:1px solid #cbd5e1;padding:6px 10px;">${fmt(emyEsic)}</td>
            <td style="text-align:right;border:1px solid #cbd5e1;padding:6px 10px;">${fmt(pTax)}</td>
            <td style="text-align:right;border:1px solid #cbd5e1;padding:6px 10px;">${fmt(lwfEe)}</td>
            <td style="text-align:right;border:1px solid #cbd5e1;padding:6px 10px;">${fmt(tds)}</td>
            <td style="text-align:right;border:1px solid #cbd5e1;padding:6px 10px;">${fmt(covid)}</td>
            <td style="text-align:right;font-weight:bold;background-color:#fef2f2;color:#991b1b;border:1px solid #cbd5e1;border-right:2px solid #ef4444;padding:6px 10px;">${fmtN(totDedn)}</td>

            <!-- Net Amt -->
            <td style="text-align:right;font-weight:bold;background-color:#fef9c3;color:#854d0e;border:1px solid #cbd5e1;border-right:2px solid #eab308;padding:6px 10px;">${fmtN(netAmt)}</td>

            <!-- EMR Contribution -->
            <td style="text-align:right;border:1px solid #cbd5e1;padding:6px 10px;">${fmt(emrPf)}</td>
            <td style="text-align:right;border:1px solid #cbd5e1;padding:6px 10px;">${fmt(pfAdmin)}</td>
            <td style="text-align:right;border:1px solid #cbd5e1;padding:6px 10px;">${fmt(emrEsic)}</td>
            <td style="text-align:right;border:1px solid #cbd5e1;padding:6px 10px;">${fmt(emrLwf)}</td>
            <td style="text-align:right;border:1px solid #cbd5e1;padding:6px 10px;">${fmt(gratuity)}</td>
            <td style="text-align:right;font-weight:bold;background-color:#f0f9ff;color:#0369a1;border:1px solid #cbd5e1;border-right:2px solid #06b6d4;padding:6px 10px;">${fmtN(totEmr)}</td>

            <!-- CTC -->
            <td style="text-align:right;font-weight:bold;background-color:#f0fdf4;color:#166534;border:1px solid #cbd5e1;padding:6px 10px;">${fmtN(ctc)}</td>
          </tr>
        `;
      }).join('');

      const fmtT = (num: number) => num ? num.toLocaleString('en-IN') : '0';

      const totalsHtml = `
        <tr style="background-color:#0f172a;color:#ffffff;font-weight:bold;">
          <td colspan="5" style="text-align:center;border:1px solid #0f172a;padding:8px;font-size:11pt;">TOTAL (All ${rows.length} Employees)</td>
          
          <!-- Rate Totals -->
          <td style="text-align:right;border:1px solid #334155;padding:8px;">${fmtT(totals.baseBasic)}</td>
          <td style="text-align:right;border:1px solid #334155;padding:8px;">${fmtT(totals.baseHra)}</td>
          <td style="text-align:right;border:1px solid #334155;padding:8px;">${fmtT(totals.baseOther)}</td>
          <td style="text-align:right;border:1px solid #334155;padding:8px;">${fmtT(totals.baseBonus)}</td>
          <td style="text-align:right;border:1px solid #334155;padding:8px;">${fmtT(totals.baseLeave)}</td>
          <td style="text-align:right;border:1px solid #334155;padding:8px;">${fmtT(totals.baseAdvance)}</td>
          <td style="text-align:right;border:1px solid #334155;padding:8px;background-color:#1e3a8a;color:#ffffff;">${fmtT(totals.baseGross)}</td>

          <!-- Earned Totals -->
          <td style="text-align:right;border:1px solid #334155;padding:8px;">${fmtT(totals.proBasic)}</td>
          <td style="text-align:right;border:1px solid #334155;padding:8px;">${fmtT(totals.proHra)}</td>
          <td style="text-align:right;border:1px solid #334155;padding:8px;">${fmtT(totals.proOther)}</td>
          <td style="text-align:right;border:1px solid #334155;padding:8px;">${fmtT(totals.proBonus)}</td>
          <td style="text-align:right;border:1px solid #334155;padding:8px;">${fmtT(totals.proLeave)}</td>
          <td style="text-align:right;border:1px solid #334155;padding:8px;">${fmtT(totals.proAdvance)}</td>
          <td style="text-align:right;border:1px solid #334155;padding:8px;background-color:#831843;color:#ffffff;">${fmtT(totals.proGross)}</td>

          <!-- Deduction Totals -->
          <td style="text-align:right;border:1px solid #334155;padding:8px;">${fmtT(totals.emyPf)}</td>
          <td style="text-align:right;border:1px solid #334155;padding:8px;">${fmtT(totals.emyEsic)}</td>
          <td style="text-align:right;border:1px solid #334155;padding:8px;">${fmtT(totals.pTax)}</td>
          <td style="text-align:right;border:1px solid #334155;padding:8px;">${fmtT(totals.lwfEe)}</td>
          <td style="text-align:right;border:1px solid #334155;padding:8px;">${fmtT(totals.tds)}</td>
          <td style="text-align:right;border:1px solid #334155;padding:8px;">${fmtT(totals.covid)}</td>
          <td style="text-align:right;border:1px solid #334155;padding:8px;background-color:#7f1d1d;color:#ffffff;">${fmtT(totals.totDedn)}</td>

          <!-- Net Totals -->
          <td style="text-align:right;border:1px solid #334155;padding:8px;background-color:#713f12;color:#ffffff;">${fmtT(totals.netAmt)}</td>

          <!-- EMR Totals -->
          <td style="text-align:right;border:1px solid #334155;padding:8px;">${fmtT(totals.emrPf)}</td>
          <td style="text-align:right;border:1px solid #334155;padding:8px;">${fmtT(totals.pfAdmin)}</td>
          <td style="text-align:right;border:1px solid #334155;padding:8px;">${fmtT(totals.emrEsic)}</td>
          <td style="text-align:right;border:1px solid #334155;padding:8px;">${fmtT(totals.emrLwf)}</td>
          <td style="text-align:right;border:1px solid #334155;padding:8px;">${fmtT(totals.gratuity)}</td>
          <td style="text-align:right;border:1px solid #334155;padding:8px;background-color:#0369a1;color:#ffffff;">${fmtT(totals.totEmr)}</td>

          <!-- CTC Total -->
          <td style="text-align:right;border:1px solid #334155;padding:8px;background-color:#14532d;color:#ffffff;">${fmtT(totals.ctc)}</td>
        </tr>
      `;

      const htmlTable = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <!--[if gte mso 9]>
        <xml>
         <x:ExcelWorkbook>
          <x:ExcelWorksheets>
           <x:ExcelWorksheet>
            <x:Name>Payroll Register</x:Name>
            <x:WorksheetOptions>
             <x:DisplayGridlines/>
            </x:WorksheetOptions>
           </x:ExcelWorksheet>
          </x:ExcelWorksheets>
         </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        </head>
        <body style="font-family:'Segoe UI',Arial,sans-serif;">
          <table style="border-collapse:collapse;width:100%;">
            <thead>
              <!-- Title Header -->
              <tr>
                <th colspan="35" style="background-color:#0f172a;color:#ffffff;font-size:16pt;font-weight:bold;text-align:center;padding:12px;">
                  COMPANY PAYROLL REGISTER & SALARY SUMMARY
                </th>
              </tr>
              <tr>
                <th colspan="35" style="background-color:#1e293b;color:#cbd5e1;font-size:10pt;text-align:center;padding:6px;">
                  Pay Period: ${periodStr} | Total Records: ${rows.length} Employees | Generated on: ${new Date().toLocaleDateString('en-IN')}
                </th>
              </tr>
              <tr><th colspan="35" style="height:10px;background-color:#ffffff;border:none;"></th></tr>

              <!-- Super Headers -->
              <tr>
                <th colspan="5" style="background-color:#334155;color:#ffffff;font-weight:bold;text-align:center;border:1px solid #475569;padding:8px;">EMPLOYEE INFORMATION</th>
                <th colspan="7" style="background-color:#1e40af;color:#ffffff;font-weight:bold;text-align:center;border:1px solid #3b82f6;padding:8px;">RATE OF WAGES (MONTHLY STRUCTURE)</th>
                <th colspan="7" style="background-color:#9d174d;color:#ffffff;font-weight:bold;text-align:center;border:1px solid #ec4899;padding:8px;">EARNED WAGES (ATTENDANCE PRORATED)</th>
                <th colspan="7" style="background-color:#991b1b;color:#ffffff;font-weight:bold;text-align:center;border:1px solid #ef4444;padding:8px;">EMPLOYEE DEDUCTIONS</th>
                <th style="background-color:#854d0e;color:#ffffff;font-weight:bold;text-align:center;border:1px solid #eab308;padding:8px;">NET TAKE-HOME</th>
                <th colspan="6" style="background-color:#0369a1;color:#ffffff;font-weight:bold;text-align:center;border:1px solid #06b6d4;padding:8px;">COMPANY CONTRIBUTION (EMR)</th>
                <th style="background-color:#166534;color:#ffffff;font-weight:bold;text-align:center;border:1px solid #22c55e;padding:8px;">TOTAL CTC</th>
              </tr>

              <!-- Sub Headers -->
              <tr>
                <th style="background-color:#f1f5f9;color:#0f172a;font-weight:bold;text-align:center;border:1px solid #cbd5e1;padding:8px;min-width:180px;">Employee Name</th>
                <th style="background-color:#f1f5f9;color:#0f172a;font-weight:bold;text-align:center;border:1px solid #cbd5e1;padding:8px;min-width:130px;">Employee ID</th>
                <th style="background-color:#f1f5f9;color:#0f172a;font-weight:bold;text-align:center;border:1px solid #cbd5e1;padding:8px;min-width:100px;">ESIC Covered</th>
                <th style="background-color:#f1f5f9;color:#0f172a;font-weight:bold;text-align:center;border:1px solid #cbd5e1;padding:8px;min-width:100px;">Payable Days</th>
                <th style="background-color:#f1f5f9;color:#0f172a;font-weight:bold;text-align:center;border:1px solid #cbd5e1;border-right:2px solid #64748b;padding:8px;min-width:90px;">Paid Days</th>

                <th style="background-color:#dbeafe;color:#1e40af;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:110px;">Basic</th>
                <th style="background-color:#dbeafe;color:#1e40af;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:110px;">HRA</th>
                <th style="background-color:#dbeafe;color:#1e40af;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:120px;">Other Allow</th>
                <th style="background-color:#dbeafe;color:#1e40af;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:120px;">Perf Bonus</th>
                <th style="background-color:#dbeafe;color:#1e40af;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:130px;">Leave Encash</th>
                <th style="background-color:#dbeafe;color:#1e40af;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:120px;">Adv Bonus</th>
                <th style="background-color:#bfdbfe;color:#1e3a8a;font-weight:bold;text-align:right;border:1px solid #cbd5e1;border-right:2px solid #3b82f6;padding:8px;min-width:130px;">Gross</th>

                <th style="background-color:#fce7f3;color:#9d174d;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:110px;">Basic</th>
                <th style="background-color:#fce7f3;color:#9d174d;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:110px;">HRA</th>
                <th style="background-color:#fce7f3;color:#9d174d;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:120px;">Other Allow</th>
                <th style="background-color:#fce7f3;color:#9d174d;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:120px;">Perf Bonus</th>
                <th style="background-color:#fce7f3;color:#9d174d;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:130px;">Leave Encash</th>
                <th style="background-color:#fce7f3;color:#9d174d;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:120px;">Adv Bonus</th>
                <th style="background-color:#fbcfe8;color:#831843;font-weight:bold;text-align:right;border:1px solid #cbd5e1;border-right:2px solid #ec4899;padding:8px;min-width:130px;">Gross</th>

                <th style="background-color:#fee2e2;color:#991b1b;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:110px;">PF 12%</th>
                <th style="background-color:#fee2e2;color:#991b1b;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:110px;">ESIC 0.75%</th>
                <th style="background-color:#fee2e2;color:#991b1b;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:90px;">P.Tax</th>
                <th style="background-color:#fee2e2;color:#991b1b;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:90px;">LWF EE</th>
                <th style="background-color:#fee2e2;color:#991b1b;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:80px;">TDS</th>
                <th style="background-color:#fee2e2;color:#991b1b;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:90px;">Covid</th>
                <th style="background-color:#fca5a5;color:#7f1d1d;font-weight:bold;text-align:right;border:1px solid #cbd5e1;border-right:2px solid #ef4444;padding:8px;min-width:120px;">Tot Dedn</th>

                <th style="background-color:#fef08a;color:#854d0e;font-weight:bold;text-align:right;border:1px solid #cbd5e1;border-right:2px solid #eab308;padding:8px;min-width:130px;">Net Amt</th>

                <th style="background-color:#e0f2fe;color:#0369a1;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:110px;">EMR PF</th>
                <th style="background-color:#e0f2fe;color:#0369a1;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:110px;">PF Admin</th>
                <th style="background-color:#e0f2fe;color:#0369a1;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:110px;">EMR ESIC</th>
                <th style="background-color:#e0f2fe;color:#0369a1;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:100px;">EMR LWF</th>
                <th style="background-color:#e0f2fe;color:#0369a1;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:100px;">Gratuity</th>
                <th style="background-color:#bae6fd;color:#0369a1;font-weight:bold;text-align:right;border:1px solid #cbd5e1;border-right:2px solid #06b6d4;padding:8px;min-width:130px;">Total EMR</th>

                <th style="background-color:#dcfce7;color:#166534;font-weight:bold;text-align:right;border:1px solid #cbd5e1;padding:8px;min-width:140px;">Total CTC</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              ${totalsHtml}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([htmlTable], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Payroll_Register_${sheet.month_str.replace(/[^a-zA-Z0-9_-]/g, '_')}_${sheet.start_date}_to_${sheet.end_date}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSnackbar({ open: true, message: `Payroll register downloaded successfully!`, severity: 'success' });
    } catch (error) {
      console.error('Error downloading payment sheet Excel:', error);
      setSnackbar({ open: true, message: 'Failed to download Excel file', severity: 'error' });
    }
  };

  // Helper for Status Badge styling
  const renderStatusChip = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Chip label="Approved" size="small" color="success" sx={{ fontWeight: 'bold' }} icon={<CheckCircleIcon />} />;
      case 'PENDING_APPROVAL':
        return <Chip label="Pending Approval" size="small" color="warning" sx={{ fontWeight: 'bold' }} />;
      case 'REJECTED':
        return <Chip label="Rejected" size="small" color="error" sx={{ fontWeight: 'bold' }} />;
      default:
        return <Chip label="Draft" size="small" color="default" sx={{ fontWeight: 'bold' }} />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Navigation and Actions */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/payroll')}
              sx={{ textTransform: 'none', color: 'text.secondary', p: 0, minWidth: 'auto', mr: 1 }}
            >
              Back to Payroll
            </Button>
          </Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TableChartIcon fontSize="large" color="primary" />
            Payment Sheet Records
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monthly employee payment register, salary disbursals, bank sheets, and approval workflow.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchPaymentSheets}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/payroll')}
            sx={{ fontWeight: 'bold' }}
          >
            + Generate Bulk Payroll
          </Button>
        </Box>
      </Box>

      {/* Summary Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', border: '1px solid #90caf9' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase">
                Total Payment Sheets
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ mt: 0.5 }}>
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', border: '1px solid #a5d6a7' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase">
                Approved (Locked)
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ mt: 0.5 }}>
                {stats.approved}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', border: '1px solid #ffcc80' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase">
                Pending Approval
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main" sx={{ mt: 0.5 }}>
                {stats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)', border: '1px solid #ce93d8' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase">
                Total Net Payout
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="secondary.main" sx={{ mt: 0.5 }}>
                ₹{Number(stats.totalNetPayout).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter & Search Bar */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              placeholder="Search by Month, Date (e.g. Aug-26, 2026-08)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-filter-label">Status Filter</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Status Filter"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="PENDING_APPROVAL">Pending Approval</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
              }}
            >
              Reset Filter
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Payment Sheet Table - Matching Screenshot 2 exactly */}
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #cfd8dc' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader sx={{ minWidth: 950 }}>
            <TableHead>
              {/* Main Column Header Row */}
              <TableRow sx={{ '& th': { bgcolor: '#b0bec5', color: '#263238', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #90a4ae' } }}>
                <TableCell align="center" sx={{ width: 60 }}>S.No.</TableCell>
                <TableCell align="center">Month</TableCell>
                <TableCell align="center">Start Date</TableCell>
                <TableCell align="center">End Date</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>View</TableCell>
                <TableCell align="center" sx={{ width: 90 }}>Download</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>Edit</TableCell>
                <TableCell align="center" sx={{ width: 150 }}>Send for Approval</TableCell>
                <TableCell align="center">Sent Date</TableCell>
                <TableCell align="center" sx={{ width: 130 }}>Approved</TableCell>
                <TableCell align="center">Final Approved Date</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading && paymentSheets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={36} />
                    <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
                      Loading payment sheets...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredSheets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 6 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No Payment Sheets Found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Generate payroll in the Bulk Payroll page to automatically create monthly payment sheets.
                    </Typography>
                    <Button variant="contained" onClick={() => navigate('/payroll')}>
                      Go to Bulk Payroll Generation
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSheets.map((sheet, index) => {
                  const isApproved = sheet.status === 'APPROVED';
                  const isPending = sheet.status === 'PENDING_APPROVAL';
                  const isFrozen = isApproved || isPending;

                  return (
                    <TableRow
                      key={sheet.id || index}
                      hover
                      sx={{
                        '&:nth-of-type(even)': { bgcolor: '#f9fbfd' },
                        '& td': { border: '1px solid #cfd8dc', fontSize: '0.875rem' },
                      }}
                    >
                      {/* 1. S.No. */}
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                        {index + 1}
                      </TableCell>

                      {/* 2. Month (e.g. Aug-26) */}
                      <TableCell align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {sheet.month_str || 'N/A'}
                      </TableCell>

                      {/* 3. Start Date (e.g. 01/08/26) */}
                      <TableCell align="center">
                        {formatDateShort(sheet.start_date)}
                      </TableCell>

                      {/* 4. End Date (e.g. 31/08/26) */}
                      <TableCell align="center">
                        {formatDateShort(sheet.end_date)}
                      </TableCell>

                      {/* 5. View Button */}
                      <TableCell align="center">
                        <Tooltip title="View Payment Sheet Details">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenView(sheet)}
                            sx={{ '&:hover': { bgcolor: 'primary.light', color: '#fff' } }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>

                      {/* 6. Download Button */}
                      <TableCell align="center">
                        <Tooltip title="Download Payment Sheet (Excel)">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleDownloadExcel(sheet)}
                            sx={{ '&:hover': { bgcolor: 'success.light', color: '#fff' } }}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>

                      {/* 7. Edit Button (Frozen once sent or approved) */}
                      <TableCell align="center">
                        <Tooltip title={isApproved ? "Frozen: Payment Sheet is Approved" : isPending ? "Frozen: Sent for Approval" : "Edit Payment Details"}>
                          <span>
                            <IconButton
                              size="small"
                              color="secondary"
                              disabled={isFrozen}
                              onClick={() => handleOpenEdit(sheet)}
                              sx={{
                                opacity: isFrozen ? 0.35 : 1,
                                '&:hover': { bgcolor: isFrozen ? 'transparent' : 'secondary.light', color: isFrozen ? 'inherit' : '#fff' },
                              }}
                            >
                              {isFrozen ? <LockIcon fontSize="small" color="disabled" /> : <EditIcon fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>

                      {/* 8. Send for Approval Button (Frozen once sent or approved) */}
                      <TableCell align="center">
                        {isApproved ? (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Approved"
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ fontWeight: 'bold' }}
                          />
                        ) : isPending ? (
                          <Tooltip title="Frozen: Already sent for approval">
                            <span>
                              <Chip
                                icon={<LockIcon sx={{ fontSize: '0.9rem !important' }} />}
                                label="Sent"
                                size="small"
                                color="warning"
                                variant="outlined"
                                sx={{ fontWeight: 'bold', opacity: 0.85 }}
                              />
                            </span>
                          </Tooltip>
                        ) : (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<SendIcon sx={{ fontSize: '0.9rem !important' }} />}
                            onClick={() => handleOpenApprovalDialog(sheet)}
                            sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 'bold', py: 0.4 }}
                          >
                            Send
                          </Button>
                        )}
                      </TableCell>

                      {/* 9. Sent Date */}
                      <TableCell align="center" sx={{ color: sheet.sent_date ? 'text.primary' : 'text.disabled' }}>
                        {formatDateShort(sheet.sent_date)}
                      </TableCell>

                      {/* 10. Approved (Status - Auto Fetch) */}
                      <TableCell align="center">
                        {renderStatusChip(sheet.status)}
                      </TableCell>

                      {/* 11. Final Approved Date (Auto Fetch) */}
                      <TableCell align="center" sx={{ fontWeight: sheet.approved_date ? 'bold' : 'normal', color: sheet.approved_date ? 'success.main' : 'text.disabled' }}>
                        {formatDateShort(sheet.approved_date)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ---------------- VIEW PAYMENT SHEET MODAL ---------------- */}
      <Dialog
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { minHeight: '75vh', borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pb: 1, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight="bold" color="primary.main">
              Payment Sheet Details: {selectedSheet?.month_str} ({formatDateShort(selectedSheet?.start_date)} - {formatDateShort(selectedSheet?.end_date)})
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Status: <strong>{selectedSheet?.status}</strong> | Total Employees: <strong>{selectedSheet?.total_employees || parseSheetData(selectedSheet?.sheet_data).length}</strong> | Total Net Payout: <strong>₹{Number(selectedSheet?.total_net || 0).toLocaleString('en-IN')}</strong>
            </Typography>
          </Box>
          <IconButton onClick={() => setIsViewModalOpen(false)}>
            <ClearIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2 }}>
          {/* Inner Search inside modal */}
          <Box sx={{ mb: 2, mt: 1 }}>
            <TextField
              placeholder="Filter by Employee Name, Code, Department, Bank..."
              size="small"
              value={viewSearchQuery}
              onChange={(e) => setViewSearchQuery(e.target.value)}
              sx={{ width: 350 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Detailed Employee Rows Table */}
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 420 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: '#eceff1', fontWeight: 'bold', fontSize: '0.8rem' } }}>
                  <TableCell>S.No.</TableCell>
                  <TableCell>Employee Code</TableCell>
                  <TableCell>Employee Name</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Bank Name</TableCell>
                  <TableCell>Account Number</TableCell>
                  <TableCell>IFSC Code</TableCell>
                  <TableCell align="right">Present Days</TableCell>
                  <TableCell align="right">Gross Salary (₹)</TableCell>
                  <TableCell align="right">PF Deduct (₹)</TableCell>
                  <TableCell align="right">ESI Deduct (₹)</TableCell>
                  <TableCell align="right">TDS / Tax (₹)</TableCell>
                  <TableCell align="right">Total Deductions (₹)</TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#c8e6c9 !important', fontWeight: 'bold' }}>Net Payable (₹)</TableCell>
                  <TableCell align="center">Payment Mode</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  const rows = parseSheetData(selectedSheet?.sheet_data);
                  const filtered = rows.filter((r: any) => {
                    if (!viewSearchQuery) return true;
                    const q = viewSearchQuery.toLowerCase();
                    return (
                      r.employeeName?.toLowerCase().includes(q) ||
                      r.employeeCode?.toLowerCase().includes(q) ||
                      r.department?.toLowerCase().includes(q) ||
                      r.bankName?.toLowerCase().includes(q)
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={15} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No employee records found in this sheet.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return filtered.map((row: any, idx: number) => (
                    <TableRow key={idx} hover>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{row.employeeCode || `EMP-${row.employeeId}`}</TableCell>
                      <TableCell>{row.employeeName}</TableCell>
                      <TableCell>{row.department || 'N/A'}</TableCell>
                      <TableCell>{row.bankName || 'N/A'}</TableCell>
                      <TableCell>{row.accountNumber || 'N/A'}</TableCell>
                      <TableCell>{row.ifscCode || 'N/A'}</TableCell>
                      <TableCell align="right">{row.presentDays || 0}</TableCell>
                      <TableCell align="right">{Number(row.grossSalary || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">{Number(row.deductions?.pf || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">{Number(row.deductions?.esi || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">{Number(row.deductions?.tds || row.deductions?.tax || 0).toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>
                        {Number(row.totalDeductions || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        ₹{Number(row.netSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={row.paymentMode || 'Bank Transfer'} size="small" variant="outlined" />
                      </TableCell>
                    </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ---------------- EDIT PAYMENT SHEET MODAL ---------------- */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6" fontWeight="bold">
            Edit Payment Sheet - {selectedSheet?.month_str}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Modify payment entries before approval. Once approved, this sheet is permanently frozen.
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            You can adjust Present Days or Net Payable for specific employees prior to approval.
          </Alert>

          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 350 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: '#f5f5f5', fontWeight: 'bold' } }}>
                  <TableCell>Employee</TableCell>
                  <TableCell>Present Days</TableCell>
                  <TableCell>Gross Salary (₹)</TableCell>
                  <TableCell>Total Deductions (₹)</TableCell>
                  <TableCell>Net Payable (₹)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {editingRows.map((row: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{row.employeeName}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.employeeCode}</Typography>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={row.presentDays}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          const updated = [...editingRows];
                          updated[idx].presentDays = val;
                          setEditingRows(updated);
                        }}
                        sx={{ width: 90 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={row.grossSalary}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const updated = [...editingRows];
                          updated[idx].grossSalary = val;
                          updated[idx].netSalary = Math.max(0, val - (updated[idx].totalDeductions || 0));
                          setEditingRows(updated);
                        }}
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={row.totalDeductions}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const updated = [...editingRows];
                          updated[idx].totalDeductions = val;
                          updated[idx].netSalary = Math.max(0, (updated[idx].grossSalary || 0) - val);
                          setEditingRows(updated);
                        }}
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      ₹{Number(row.netSalary || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveEdit}
            disabled={actionLoading}
          >
            {actionLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------------- SEND FOR APPROVAL MODAL ---------------- */}
      <Dialog
        open={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', fontWeight: 'bold' }}>
          Send Payment Sheet for Approval
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to submit the payment sheet for <strong>{selectedSheet?.month_str}</strong> for approval?
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Summary:</strong> {selectedSheet?.total_employees} employees | Total Net Amount: ₹{Number(selectedSheet?.total_net || 0).toLocaleString('en-IN')}
          </Alert>

          <TextField
            fullWidth
            label="Notes / Remarks for Approver (Optional)"
            multiline
            rows={3}
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder="e.g. Salary register generated for August 2026. Ready for verification and final approval."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => setIsApprovalModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SendIcon />}
            onClick={handleSubmitApproval}
            disabled={actionLoading}
          >
            {actionLoading ? 'Submitting...' : 'Submit for Approval'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------------- REJECT MODAL ---------------- */}
      <Dialog
        open={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>
          Reject Payment Sheet
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please enter a reason for rejecting this payment sheet:
          </Typography>
          <TextField
            fullWidth
            label="Rejection Reason"
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsRejectModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRejectSheet}
            disabled={actionLoading || !rejectionReason.trim()}
          >
            {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PaymentSheet;
