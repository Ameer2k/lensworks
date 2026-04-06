import { Router } from 'express';
import {
  addCartItem,
  applyPromo,
  deleteCartItem,
  getCart,
  updateCartItem
} from '../controllers/cart.controller.js';
import { requireAuth } from '../middlewares/require-auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', getCart);
router.post('/items', addCartItem);
router.patch('/items/:id', updateCartItem);
router.delete('/items/:id', deleteCartItem);
router.post('/promo', applyPromo);

export default router;