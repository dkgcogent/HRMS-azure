// @ts-nocheck
import React, { useMemo, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack } from '@mui/material';

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { date: string; check_in_time?: string; check_out_time?: string; reason?: string }) => Promise<void>;
  records?: any[];
};

const ManualPunchDialog: React.FC<Props> = ({ open, onClose, onSubmit, records = [] }) => {
  const getTodayIST = () => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  };

  const getCurrentTimeIST = () => {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date());
  };

  const [form, setForm] = React.useState({ 
    date: getTodayIST(), 
    check_in_time: getCurrentTimeIST(), 
    check_out_time: '', 
    reason: '' 
  });
  const [loading, setLoading] = React.useState(false);

  // Helper to format date to YYYY-MM-DD
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    if (dateString.includes('T')) return dateString.split('T')[0];
    try {
      const d = new Date(dateString);
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    } catch {
      return dateString;
    }
  };

  // Detect existing record for the manually selected date
  const existingRecord = useMemo(() => {
    if (!form.date) return null;
    return records.find(r => formatDate(r.date) === form.date);
  }, [form.date, records]);

  // Sync form with existing record or current system time
  useEffect(() => {
    if (open) {
      if (existingRecord) {
        setForm(prev => ({
          ...prev,
          date: formatDate(existingRecord.date) || getTodayIST(),
          check_in_time: existingRecord.check_in_time ? String(existingRecord.check_in_time).slice(0, 5) : getCurrentTimeIST(),
          check_out_time: existingRecord.check_out_time ? String(existingRecord.check_out_time).slice(0, 5) : prev.check_out_time,
        }));
      } else {
        setForm({
          date: getTodayIST(),
          check_in_time: getCurrentTimeIST(),
          check_out_time: '',
          reason: ''
        });
      }
    }
  }, [open, existingRecord]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(form);
      setForm({ 
        date: getTodayIST(), 
        check_in_time: getCurrentTimeIST(), 
        check_out_time: '', 
        reason: '' 
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Manual Punch</DialogTitle>
      <DialogContent>
        <form onSubmit={submit}>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField 
              label="Date" 
              type="date" 
              value={form.date} 
              fullWidth 
              InputLabelProps={{ shrink: true }} 
              InputProps={{ readOnly: true }}
              disabled 
              required 
            />
            <Stack direction="row" spacing={2}>
              <TextField 
                label="In" 
                type="time" 
                value={form.check_in_time} 
                fullWidth 
                InputLabelProps={{ shrink: true }} 
                InputProps={{ readOnly: true }}
                disabled
              />
              <TextField 
                label="Out" 
                type="time" 
                value={form.check_out_time} 
                onChange={(e) => setForm({ ...form, check_out_time: e.target.value })} 
                fullWidth 
                InputLabelProps={{ shrink: true }} 
                disabled={!!existingRecord && !!existingRecord.check_in_time && !!existingRecord.check_out_time}
              />
            </Stack>
            <TextField 
              label="Reason" 
              value={form.reason} 
              onChange={(e) => setForm({ ...form, reason: e.target.value })} 
              fullWidth 
              disabled={!!existingRecord && !!existingRecord.check_in_time && !!existingRecord.check_out_time}
            />
          </Stack>
          <DialogActions sx={{ mt: 2, p: 0 }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading || (!!existingRecord && !!existingRecord.check_in_time && !!existingRecord.check_out_time)}
            >
              {existingRecord && existingRecord.check_in_time && existingRecord.check_out_time ? 'Completed' : 'Submit'}
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManualPunchDialog;


