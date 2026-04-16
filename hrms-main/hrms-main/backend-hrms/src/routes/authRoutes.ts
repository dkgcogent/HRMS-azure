import express from 'express';
import { login, getCurrentUser } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/login', login);
router.get('/me', authenticateToken, getCurrentUser);

export default router;


