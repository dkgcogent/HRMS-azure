// @ts-nocheck
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack } from '@mui/material';

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { date: string; check_in_time?: string; check_out_time?: string; reason?: string }) => Promise<void>;
};

const ManualPunchDialog: React.FC<Props> = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = React.useState({ date: '', check_in_time: '', check_out_time: '', reason: '' });
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(form);
      setForm({ date: '', check_in_time: '', check_out_time: '', reason: '' });
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
            <TextField label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} required />
            <Stack direction="row" spacing={2}>
              <TextField label="In" type="time" value={form.check_in_time} onChange={(e) => setForm({ ...form, check_in_time: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label="Out" type="time" value={form.check_out_time} onChange={(e) => setForm({ ...form, check_out_time: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
            </Stack>
            <TextField label="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} fullWidth />
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

export default ManualPunchDialog;


