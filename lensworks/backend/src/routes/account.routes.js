import { Router } from 'express';
import {
  getAccountSettings,
  updateContact,
  updateNotifications,
  updatePassword,
  updateProfile,
  updateSocial
} from '../controllers/account.controller.js';
import { requireAuth } from '../middlewares/require-auth.js';

const router = Router();

router.use(requireAuth);
router.get('/settings', getAccountSettings);
router.put('/profile', updateProfile);
router.put('/contact', updateContact);
router.put('/social', updateSocial);
router.put('/password', updatePassword);
router.put('/notifications', updateNotifications);

export default router;
