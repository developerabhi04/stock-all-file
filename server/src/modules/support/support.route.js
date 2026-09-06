import express from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { rateLimiter } from '../../shared/middleware/rateLimiter.middleware.js';
import { uploadChatImage } from '../../shared/middleware/upload.middleware.js';
import {
    getMyConversation,
    sendUserMessage,
    uploadChatImageController
} from './support.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/conversation', getMyConversation);

router.post('/messages', rateLimiter(30, 1), sendUserMessage);

router.post('/messages/image', rateLimiter(10, 1), uploadChatImage, uploadChatImageController);

export default router;