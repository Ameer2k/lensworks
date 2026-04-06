import { Router } from 'express';
import {
  createVendorReview,
  createMyVendorPackage,
  deleteMyVendorPackage,
  getVendorBySlug,
  getMyVendorPackages,
  getVendorPackages,
  getVendorReviews,
  listVendors,
  updateMyVendorPackage
} from '../controllers/vendor.controller.js';
import { requireAuth } from '../middlewares/require-auth.js';

const router = Router();

router.get('/', listVendors);
router.get('/me/packages', requireAuth, getMyVendorPackages);
router.post('/me/packages', requireAuth, createMyVendorPackage);
router.patch('/me/packages/:packageId', requireAuth, updateMyVendorPackage);
router.delete('/me/packages/:packageId', requireAuth, deleteMyVendorPackage);
router.get('/:slug', getVendorBySlug);
router.get('/:slug/reviews', getVendorReviews);
router.post('/:slug/reviews', requireAuth, createVendorReview);
router.get('/:slug/packages', getVendorPackages);

export default router;