import { Router } from 'express';
import { forgotPassword, login, logout, me, register } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/logout', logout);
router.get('/me', me);

export default router;