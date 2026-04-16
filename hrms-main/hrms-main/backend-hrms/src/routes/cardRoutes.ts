import express from 'express';
import {
    getAllIdCards, getIdCardByEmployee, createOrUpdateIdCard, updateIdCardStatus, deleteIdCard,
    getAllVisitingCards, createVisitingCard, updateVisitingCard, deleteVisitingCard
} from '../controllers/cardController';

const router = express.Router();

// ID Cards
router.get('/id-cards', getAllIdCards);
router.get('/id-cards/employee/:employeeId', getIdCardByEmployee);
router.post('/id-cards', createOrUpdateIdCard);
router.put('/id-cards/:id/status', updateIdCardStatus);
router.delete('/id-cards/:id', deleteIdCard);

// Visiting Cards
router.get('/visiting-cards', getAllVisitingCards);
router.post('/visiting-cards', createVisitingCard);
router.put('/visiting-cards/:id', updateVisitingCard);
router.delete('/visiting-cards/:id', deleteVisitingCard);

export default router;
