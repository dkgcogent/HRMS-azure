import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, LinearProgress, Alert
} from '@mui/material';
import { CloudUpload as UploadIcon, CheckCircle as CheckIcon, Cancel as CancelIcon, Download as DownloadIcon } from '@mui/icons-material';
// Removing mockTemplates import

const KRAImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);

  const handleDownloadFormat = () => {
    alert('Format downloaded');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      handlePreview();
    }
  };

  const handlePreview = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setPreview(true);
    }, 1500);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" mb={3}>Import KRA Data</Typography>

      <Paper 
        sx={{ 
          p: 5, mb: 4, borderRadius: 2, border: '2px dashed #ccc', 
          textAlign: 'center', backgroundColor: '#fafafa', cursor: 'pointer' 
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <UploadIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>Drag & Drop your Excel file here</Typography>
        <Typography variant="body2" color="textSecondary" mb={3}>or</Typography>
        <Button variant="contained" component="label">
          Browse File
          <input type="file" hidden accept=".xlsx, .xls" onChange={(e) => {
            if (e.target.files) {
              setFile(e.target.files[0]);
              handlePreview();
            }
          }} />
        </Button>
        {file && <Typography variant="body1" mt={2} color="primary">{file.name}</Typography>}
      </Paper>

      {uploading && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="body2" mb={1}>Analyzing file...</Typography>
          <LinearProgress />
        </Box>
      )}

      {preview && (
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 1 }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            File analyzed successfully. Found 0 records ready for import.
          </Alert>
          <Typography variant="h6" mb={2}>Data Preview</Typography>
          <TableContainer sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>KRA Name</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell><strong>Frequency</strong></TableCell>
                  <TableCell><strong>Weightage</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadFormat}>
              Download Format
            </Button>
            <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => { setFile(null); setPreview(false); }}>Cancel</Button>
            <Button variant="contained" color="primary" startIcon={<CheckIcon />}>Confirm & Import</Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default KRAImport;
