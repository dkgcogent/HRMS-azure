import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import masterDataRouter from './routes/masterData';
import employeeRoutes from './routes/employeeRoutes';
import assetRoutes from './routes/assetRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import benefitsRoutes from './routes/benefitsRoutes';
import communicationRoutes from './routes/communicationRoutes';
import documentRoutes from './routes/documentRoutes';
import expenseRoutes from './routes/expenseRoutes';
import leaveRoutes from './routes/leaveRoutes';
import payrollRoutes from './routes/payrollRoutes';
import performanceRoutes from './routes/performanceRoutes';
import policyRoutes from './routes/policyRoutes';
import recruitmentRoutes from './routes/recruitmentRoutes';
import trainingRoutes from './routes/trainingRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import { testConnection } from './db';
import authRoutes from './routes/authRoutes';
import { ensureCoreTables } from './utils/bootstrap';
import { login } from './controllers/authController';
import adminAttendanceRoutes from './routes/adminAttendanceRoutes';
import pdfRoutes from './routes/pdfRoutes';
import kpiRoutes from './routes/kpiRoutes';
import csvExportRoutes from './routes/csvExportRoutes';
import taskRoutes from './routes/taskRoutes';
import offerLetterRoutes from './routes/offerLetterRoutes';
import promotionRoutes from './routes/promotionRoutes';
import awardRoutes from './routes/awardRoutes';
import complianceRoutes from './routes/complianceRoutes';
import cardRoutes from './routes/cardRoutes';
import { UPLOAD_BASE_DIR, PHOTOS_DIR, DOCUMENTS_DIR, PDF_STORAGE_DIR, ASSETS_DIR } from './config/uploadConfig';

const app = express();
const port = process.env.PORT || 8080;

// Function to ensure upload directories exist
const ensureUploadDirectories = () => {
  const uploadDirs = [
    PHOTOS_DIR,
    DOCUMENTS_DIR,
    PDF_STORAGE_DIR,
    ASSETS_DIR,
    path.join(UPLOAD_BASE_DIR, 'tasks')
  ];

  uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✓ Created upload directory: ${dir}`);
    } else {
      console.log(`✓ Upload directory exists: ${dir}`);
    }
  });
};

// CORS configuration - allow multiple frontend ports for development + Vercel deployments
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow any vercel.app subdomain (preview + production deployments)
    if (origin.endsWith('.vercel.app') || origin === 'https://vercel.app') {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

console.log(`[CORS] Allowed origins: ${allowedOrigins.join(', ')}`);
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for signature images
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from uploads directory on D: drive
// This serves files from UPLOAD_BASE_DIR at /uploads route
// So /uploads/assets/filename.jpg maps to D:/HRMS_Uploads/assets/filename.jpg
app.use('/uploads', express.static(UPLOAD_BASE_DIR, {
  setHeaders: (res, filePath) => {
    // Set proper headers for image files
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (ext === '.png') {
      res.setHeader('Content-Type', 'image/png');
    } else if (ext === '.gif') {
      res.setHeader('Content-Type', 'image/gif');
    } else if (ext === '.webp') {
      res.setHeader('Content-Type', 'image/webp');
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));

// Fallback route for asset photos (in case static middleware has issues)
app.get('/uploads/assets/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(ASSETS_DIR, filename);

  console.log(`[Asset Photo Request] Filename: ${filename}, Path: ${filePath}, Exists: ${fs.existsSync(filePath)}`);

  // Security: prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    console.error(`[Asset Photo Request] Invalid filename: ${filename}`);
    return res.status(400).json({ success: false, message: 'Invalid filename' });
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`[Asset Photo Request] File not found: ${filePath}`);
    return res.status(404).json({ success: false, message: 'File not found', path: filePath });
  }

  // Determine content type
  const ext = path.extname(filename).toLowerCase();
  let contentType = 'application/octet-stream';
  if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  else if (ext === '.png') contentType = 'image/png';
  else if (ext === '.gif') contentType = 'image/gif';
  else if (ext === '.webp') contentType = 'image/webp';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  console.log(`[Asset Photo Request] Serving file: ${filePath} with content-type: ${contentType}`);
  res.sendFile(filePath);
});

app.get('/', (req, res) => {
  res.send('HRMS Backend is running!');
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

// Health check endpoint with database connectivity test
app.get('/api/health', async (req, res) => {
  try {
    const { testConnection } = await import('./db');
    await testConnection();
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Fallback direct mount to ensure auth is reachable
app.post('/api/auth/login', login);

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/master-data', masterDataRouter);
app.use('/api/employees', employeeRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin/attendance', adminAttendanceRoutes);
app.use('/api/benefits', benefitsRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/recruitment', recruitmentRoutes);
console.log('Registering training routes...');
app.use('/api/training', trainingRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/kpi', kpiRoutes);
app.use('/api/csv-export', csvExportRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/promotions', promotionRoutes);
console.log('Registering award routes...');
app.use('/api/awards', awardRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/cards', cardRoutes);

// Test route
app.get('/api/test-route', (req, res) => res.json({ message: 'working' }));

console.log('--- DEBUG: Registering offer letter routes ---');
console.log('Type of offerLetterRoutes:', typeof offerLetterRoutes);
if (offerLetterRoutes && typeof offerLetterRoutes === 'function') {
  console.log('offerLetterRoutes is a function/router');
} else {
  console.error('offerLetterRoutes is NOT a function/router:', offerLetterRoutes);
}
app.use('/api/offer-letters', offerLetterRoutes);
console.log('--- DEBUG: Offer letter routes registered ---');

// Global 404 handler for unmatched routes (must be last, after all routes)
app.use((req, res) => {
  // Only handle API routes, let other routes fall through
  if (req.path.startsWith('/api/')) {
    console.error(`[Global 404] API route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.method} ${req.originalUrl}. Please check the route and ensure the backend server is running correctly.`,
      availableRoutes: {
        kpi: [
          'GET /api/kpi/',
          'GET /api/kpi/categories',
          'GET /api/kpi/hr/review',
          'GET /api/kpi/admin/review',
          'GET /api/kpi/manager/review',
          'GET /api/kpi/:id',
        ]
      }
    });
  } else {
    res.status(404).json({ success: false, message: 'Route not found' });
  }
});

const startServer = async () => {
  try {
    // Ensure upload directories exist before starting server
    console.log('Checking upload directories...');
    ensureUploadDirectories();

    await testConnection();
    await ensureCoreTables();

    // Vercel handles the port listening in serverless mode
    if (process.env.VERCEL !== '1') {
      app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
      });
    }
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

if (process.env.VERCEL !== '1') {
  startServer().catch((error) => {
    console.error('Fatal error during server startup:', error);
    process.exit(1);
  });
}

// Export the Express API for Vercel Serverless Functions
module.exports = app;

