// @ts-nocheck
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Alert, Stack } from '@mui/material';

type Props = {
  open: boolean;
  onClose: () => void;
  onMark: (payload: { latitude?: number; longitude?: number; accuracy?: number; address?: string }) => Promise<void>;
};

const MarkAttendanceDialog: React.FC<Props> = ({ open, onClose, onMark }) => {
  const [coords, setCoords] = React.useState<{ lat?: number; lng?: number; acc?: number }>({});
  const [error, setError] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);

  const getLocation = () => {
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy });
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const mark = async () => {
    setLoading(true);
    try {
      await onMark({ latitude: coords.lat, longitude: coords.lng, accuracy: coords.acc });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Mark Attendance</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {error && <Alert severity="warning">{error}</Alert>}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label="Latitude" value={coords.lat ?? ''} fullWidth InputProps={{ readOnly: true }} />
            <TextField label="Longitude" value={coords.lng ?? ''} fullWidth InputProps={{ readOnly: true }} />
            <TextField label="Accuracy (m)" value={coords.acc ?? ''} fullWidth InputProps={{ readOnly: true }} />
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Button onClick={getLocation}>Fetch GPS</Button>
            <DialogActions sx={{ p: 0 }}>
              <Button onClick={onClose}>Cancel</Button>
              <Button onClick={mark} variant="contained" disabled={loading}>Mark Now</Button>
            </DialogActions>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default MarkAttendanceDialog;


