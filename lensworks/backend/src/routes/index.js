import { Router } from 'express';
import accountRoutes from './account.routes.js';
import authRoutes from './auth.routes.js';
import bookingRoutes from './booking.routes.js';
import cartRoutes from './cart.routes.js';
import checkoutRoutes from './checkout.routes.js';
import galleryRoutes from './gallery.routes.js';
import healthRoutes from './health.routes.js';
import messageRoutes from './message.routes.js';
import paymentRoutes from './payment.routes.js';
import vendorRoutes from './vendor.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/account', accountRoutes);
router.use('/vendors', vendorRoutes);
router.use('/cart', cartRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/bookings', bookingRoutes);
router.use('/messages', messageRoutes);
router.use('/galleries', galleryRoutes);
router.use('/payments', paymentRoutes);

export default router;