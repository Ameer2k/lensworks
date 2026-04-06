import { Router } from 'express';
import { listMyPayments, listVendorPayments } from '../controllers/payment.controller.js';
import { requireAuth } from '../middlewares/require-auth.js';

const router = Router();

router.use(requireAuth);
router.get('/me', listMyPayments);
router.get('/vendor', listVendorPayments);

export default router;
