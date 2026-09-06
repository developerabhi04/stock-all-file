import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { ApiResponse } from '../../shared/utils/apiResponse.js';
import { ApiError } from '../../shared/utils/apiError.js';

import {
    getMyConversationService,
    sendUserMessageService,
    uploadChatImageService,
    getAllConversationsService,
    getConversationMessagesService,
    sendAdminMessageService,
    resolveConversationService
} from './support.service.js';

const getAuthenticatedUserId = (req) => {
    const userId =
        req.user?._id ||
        req.user?.id ||
        req.user?.userId;

    if (!userId) {
        throw new ApiError(
            401,
            'Authenticated user id not found in token'
        );
    }

    return userId;
};

/*
 * Gets a readable admin name if the middleware/token provides one.
 * The support service still uses assignedAgentName as the public name
 * shown to the TradeHub user.
 */
const getAdminDisplayName = (req) => {
    return (
        req.admin?.fullName ||
        req.admin?.name ||
        req.admin?.username ||
        req.admin?.email ||
        'TradeHub Support'
    );
};

// ==================== USER SUPPORT CHAT ====================

export const getMyConversation = asyncHandler(async (req, res) => {
    const data = await getMyConversationService({
        userId: getAuthenticatedUserId(req),
        page: req.query.page,
        limit: req.query.limit
    });

    res.status(200).json(
        new ApiResponse(
            200,
            data,
            'Conversation fetched successfully'
        )
    );
});

export const sendUserMessage = asyncHandler(async (req, res) => {
    const data = await sendUserMessageService({
        userId: getAuthenticatedUserId(req),
        text: req.body.text,
        imageUrl: req.body.imageUrl
    });

    res.status(201).json(
        new ApiResponse(
            201,
            data,
            'Message sent successfully'
        )
    );
});

export const uploadChatImageController = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(
            400,
            'Image file is required'
        );
    }

    const PUBLIC_BASE_URL = (
        process.env.PUBLIC_BASE_URL || ''
    ).replace(/\/$/, '');

    const fileUrl = `${PUBLIC_BASE_URL}/uploads/chat/${req.file.filename}`;

    const data = await uploadChatImageService({
        userId: getAuthenticatedUserId(req),
        fileUrl
    });

    res.status(201).json(
        new ApiResponse(
            201,
            data,
            'Image sent successfully'
        )
    );
});

// ==================== ADMIN SUPPORT CHAT ====================

export const getAllConversations = asyncHandler(async (req, res) => {
    const data = await getAllConversationsService(req.query);

    res.status(200).json(
        new ApiResponse(
            200,
            data,
            'Conversations fetched successfully'
        )
    );
});

export const getConversationMessages = asyncHandler(async (req, res) => {
    const data = await getConversationMessagesService({
        conversationId: req.params.conversationId,
        page: req.query.page,
        limit: req.query.limit
    });

    res.status(200).json(
        new ApiResponse(
            200,
            data,
            'Messages fetched successfully'
        )
    );
});

export const sendAdminMessage = asyncHandler(async (req, res) => {
    const data = await sendAdminMessageService({
        conversationId: req.params.conversationId,
        adminName: getAdminDisplayName(req),
        text: req.body.text,
        imageUrl: req.body.imageUrl
    });

    res.status(201).json(
        new ApiResponse(
            201,
            data,
            'Message sent successfully'
        )
    );
});

export const uploadAdminChatImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(
            400,
            'Image file is required'
        );
    }

    const PUBLIC_BASE_URL = (
        process.env.PUBLIC_BASE_URL || ''
    ).replace(/\/$/, '');

    const fileUrl = `${PUBLIC_BASE_URL}/uploads/chat/${req.file.filename}`;

    const data = await sendAdminMessageService({
        conversationId: req.params.conversationId,
        adminName: getAdminDisplayName(req),
        text: '',
        imageUrl: fileUrl
    });

    res.status(201).json(
        new ApiResponse(
            201,
            data,
            'Image sent successfully'
        )
    );
});

export const resolveConversation = asyncHandler(async (req, res) => {
    const data = await resolveConversationService({
        conversationId: req.params.conversationId
    });

    res.status(200).json(
        new ApiResponse(
            200,
            data,
            'Conversation marked as resolved'
        )
    );
});