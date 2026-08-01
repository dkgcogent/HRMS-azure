import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActions, Button } from '@mui/material';
import { Download as DownloadIcon, InsertDriveFile as FileIcon, Assessment as TemplateIcon, People as UsersIcon } from '@mui/icons-material';

const KRAExport: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" mb={3}>Export KRA Data</Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 2 }}>
            <CardContent sx={{ flexGrow: 1, textAlign: 'center', py: 4 }}>
              <FileIcon sx={{ fontSize: 60, color: '#1976d2', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Blank Template</Typography>
              <Typography variant="body2" color="textSecondary">
                Download an empty Excel structure to fill in KRA data manually for bulk import.
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
              <Button variant="contained" startIcon={<DownloadIcon />}>Export Blank Template</Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 2 }}>
            <CardContent sx={{ flexGrow: 1, textAlign: 'center', py: 4 }}>
              <TemplateIcon sx={{ fontSize: 60, color: '#ed6c02', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Existing Templates</Typography>
              <Typography variant="body2" color="textSecondary">
                Export all active and draft KRA templates currently configured in the system.
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
              <Button variant="contained" color="warning" startIcon={<DownloadIcon />}>Export Templates</Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 2 }}>
            <CardContent sx={{ flexGrow: 1, textAlign: 'center', py: 4 }}>
              <UsersIcon sx={{ fontSize: 60, color: '#2e7d32', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Assigned KRA Data</Typography>
              <Typography variant="body2" color="textSecondary">
                Export the live data of all KRA sheets currently assigned to employees.
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
              <Button variant="contained" color="success" startIcon={<DownloadIcon />}>Export Assigned Data</Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default KRAExport;
