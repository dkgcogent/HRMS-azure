// @ts-nocheck
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Stack } from '@mui/material';

type Props = {
  open: boolean;
  onClose: () => void;
  records: Array<{ id: number; date: string; check_in_time?: string; check_out_time?: string }>;
  onSubmit: (payload: { attendance_id: number; requested_change: string; reason?: string }) => Promise<void>;
};

const RegularizationDialog: React.FC<Props> = ({ open, onClose, records, onSubmit }) => {
  const [form, setForm] = React.useState({ attendance_id: '', requested_change: '', reason: '' });
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ attendance_id: Number(form.attendance_id), requested_change: form.requested_change, reason: form.reason });
      setForm({ attendance_id: '', requested_change: '', reason: '' });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Attendance Regularization</DialogTitle>
      <DialogContent>
        <form onSubmit={submit}>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField select label="Attendance" fullWidth value={form.attendance_id} onChange={(e) => setForm({ ...form, attendance_id: e.target.value })} required>
              {records.map((r) => (
                <MenuItem key={r.id} value={String(r.id)}>
                  {r.date} {r.check_in_time || ''}-{r.check_out_time || ''}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Requested Change" fullWidth value={form.requested_change} onChange={(e) => setForm({ ...form, requested_change: e.target.value })} required />
            <TextField label="Reason" fullWidth value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </Stack>
          <DialogActions sx={{ mt: 2, p: 0 }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>Submit</Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegularizationDialog;


