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
  const [form, setForm] = React.useState({ 
    date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()), 
    check_in_time: '', 
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

  // Sync form with existing record
  useEffect(() => {
    if (existingRecord) {
      setForm(prev => ({
        ...prev,
        check_in_time: existingRecord.check_in_time || '',
        check_out_time: existingRecord.check_out_time || prev.check_out_time,
      }));
    } else {
      setForm(prev => ({ ...prev, check_in_time: '', check_out_time: '' }));
    }
  }, [existingRecord]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(form);
      setForm({ 
        date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()), 
        check_in_time: '', 
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
              onChange={(e) => setForm({ ...form, date: e.target.value })} 
              fullWidth 
              InputLabelProps={{ shrink: true }} 
              required 
              disabled={!!existingRecord && !!existingRecord.check_in_time && !existingRecord.check_out_time}
            />
            <Stack direction="row" spacing={2}>
              <TextField 
                label="In" 
                type="time" 
                value={form.check_in_time} 
                onChange={(e) => setForm({ ...form, check_in_time: e.target.value })} 
                fullWidth 
                InputLabelProps={{ shrink: true }} 
                disabled={!!existingRecord && !!existingRecord.check_in_time}
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


