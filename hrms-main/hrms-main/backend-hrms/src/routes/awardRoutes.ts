import express from 'express';
import {
    getAllAwards, getAwardById, createAward, updateAward, deleteAward,
    getAllCertifications, createCertification, updateCertification, deleteCertification
} from '../controllers/awardController';

const router = express.Router();

// Certifications - nested under /certifications (must be defined BEFORE /:id to avoid conflict)
router.get('/certifications', getAllCertifications);
router.post('/certifications', createCertification);
router.put('/certifications/:id', updateCertification);
router.delete('/certifications/:id', deleteCertification);

// Awards - GET / lists all, POST creates, /:id for individual
router.get('/', getAllAwards);
router.get('/:id', getAwardById);
router.post('/', createAward);
router.put('/:id', updateAward);
router.delete('/:id', deleteAward);

export default router;
