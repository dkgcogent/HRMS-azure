
import express from 'express';
import {
    getAllPromotions,
    getPromotionById,
    getPromotionsByEmployeeId,
    createPromotion,
    updatePromotion,
    deletePromotion
} from '../controllers/promotionController';

const router = express.Router();

router.get('/', getAllPromotions);
router.get('/:id', getPromotionById);
router.get('/employee/:employeeId', getPromotionsByEmployeeId);
router.post('/', createPromotion);
router.put('/:id', updatePromotion);
router.delete('/:id', deletePromotion);

export default router;
