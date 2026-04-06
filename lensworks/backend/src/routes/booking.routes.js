import { Router } from 'express';
import {
	cancelClientBooking,
	getClientBookings,
	payBookingBalance,
	rescheduleClientBooking,
	updateVendorBookingStatus,
	getVendorBookings
} from '../controllers/booking.controller.js';
import { requireAuth } from '../middlewares/require-auth.js';

const router = Router();

router.use(requireAuth);
router.get('/me', getClientBookings);
router.get('/vendor', getVendorBookings);
router.patch('/:id/cancel', cancelClientBooking);
router.patch('/:id/pay-balance', payBookingBalance);
router.patch('/:id/reschedule', rescheduleClientBooking);
router.patch('/:id/vendor-status', updateVendorBookingStatus);

export default router;