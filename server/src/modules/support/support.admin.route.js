import express from 'express';
import { authenticateAdmin } from '../../shared/middleware/adminAuth.middleware.js';
import { canManageUsers } from '../../shared/middleware/checkPermissions.middleware.js';
import { uploadChatImage } from '../../shared/middleware/upload.middleware.js';
import {
    getAllConversations,
    getConversationMessages,
    sendAdminMessage,
    uploadAdminChatImage,
    resolveConversation
} from './support.controller.js';

const router = express.Router();

router.use(authenticateAdmin);

router.get('/conversations', canManageUsers, getAllConversations);

router.get('/conversations/:conversationId/messages', canManageUsers, getConversationMessages);

router.post('/conversations/:conversationId/messages', canManageUsers, sendAdminMessage);

router.post('/conversations/:conversationId/messages/image', canManageUsers, uploadChatImage, uploadAdminChatImage);

router.patch('/conversations/:conversationId/resolve', canManageUsers, resolveConversation);

export default router;