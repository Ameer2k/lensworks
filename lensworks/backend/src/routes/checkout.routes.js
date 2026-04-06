import { Router } from 'express';
import { confirmCheckout } from '../controllers/checkout.controller.js';
import { requireAuth } from '../middlewares/require-auth.js';

const router = Router();

router.use(requireAuth);
router.post('/confirm', confirmCheckout);

export default router;