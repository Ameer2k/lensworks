import { Router } from 'express';
import {
	deliverGalleryForBooking,
	getGallery,
	listMyGalleries
} from '../controllers/gallery.controller.js';
import { requireAuth } from '../middlewares/require-auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', listMyGalleries);
router.post('/deliver', deliverGalleryForBooking);
router.get('/:id', getGallery);

export default router;