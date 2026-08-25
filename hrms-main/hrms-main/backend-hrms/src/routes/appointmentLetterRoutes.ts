import express from 'express';
import {
    generateAppointmentLetterPDF,
    getAppointmentLetters,
    getAppointmentLetterById,
    updateAppointmentLetterStatus,
    deleteAppointmentLetter,
    getMyAppointmentLetters,
    uploadSignedAppointmentLetter
} from '../controllers/appointmentLetterController';
import { uploadSingleTaskFile } from '../middleware/taskUpload';

const router = express.Router();

// Generate PDF & save record
router.post('/generate', generateAppointmentLetterPDF);

// List and operations
router.get('/list', getAppointmentLetters);
router.get('/my-letters/:employeeId', getMyAppointmentLetters);
router.get('/:id', getAppointmentLetterById);
router.put('/:id/status', updateAppointmentLetterStatus);
router.delete('/:id', deleteAppointmentLetter);
router.post('/:id/upload-signed', uploadSingleTaskFile, uploadSignedAppointmentLetter);

export default router;
