import express from 'express';
import {
    generateOfferLetterPDF,
    saveOfferLetter,
    getOfferLetters,
    getOfferLetterById,
    updateOfferLetterStatus,
    deleteOfferLetter,
    getMyOfferLetters
} from '../controllers/offerLetterController';

const router = express.Router();

console.log('--- DEBUG: Initializing offerLetterRoutes router file --');
// Offer Letter Generation Route
router.post('/generate', generateOfferLetterPDF);
router.post('/save', saveOfferLetter);

// Offer Letter List & Management Routes
router.get('/list', getOfferLetters);
router.get('/my-letters/:employeeId', getMyOfferLetters);
router.get('/:id', getOfferLetterById);
router.put('/:id/status', updateOfferLetterStatus);
router.delete('/:id', deleteOfferLetter);

export default router;
