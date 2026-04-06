import { Router } from 'express';
import { listConversations, listMessages, openConversation, sendMessage } from '../controllers/message.controller.js';
import { requireAuth } from '../middlewares/require-auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', listConversations);
router.post('/open', openConversation);
router.get('/:id/messages', listMessages);
router.post('/:id/messages', sendMessage);

export default router;