import { Conversation, Message } from './support.model.js';
import User from '../user/user.model.js';
import { ApiError } from '../../shared/utils/apiError.js';
import { getRandomAgentName } from './agentNames.js';
import { getSocketInstance } from '../notification/socket.js';

const OPENING_GREETING =
    "Hello! This is TradeHub Support. What problem are you facing? We'll be here to help you right away.";

/*
 * Sends a Socket.IO event to clients inside a specific conversation room.
 */
const emitToConversation = (conversationId, event, payload) => {
    const io = getSocketInstance?.();

    if (!io) {
        console.warn(
            `⚠️ Socket.IO unavailable. Cannot emit ${event} to conversation ${conversationId}`
        );
        return;
    }

    io.to(`conversation:${conversationId}`).emit(event, payload);

    console.log(
        `💬 Socket event "${event}" sent to conversation:${conversationId}`
    );
};

/*
 * Every mobile user joins a private room using their User ObjectId.
 */
const emitToUser = (userId, event, payload) => {
    const io = getSocketInstance?.();

    if (!io) {
        console.warn(
            `⚠️ Socket.IO unavailable. Cannot emit ${event} to user ${userId}`
        );
        return;
    }

    io.to(String(userId)).emit(event, payload);

    console.log(
        `📱 Socket event "${event}" sent to user:${userId}`
    );
};

/*
 * Every authenticated admin joins the shared "admins" room.
 */
const emitToAdmins = (event, payload) => {
    const io = getSocketInstance?.();

    if (!io) {
        console.warn(
            `⚠️ Socket.IO unavailable. Cannot emit ${event} to admins`
        );
        return;
    }

    io.to('admins').emit(event, payload);

    console.log(
        `🛡️ Socket event "${event}" sent to admins room`
    );
};

/*
 * Finds a currently active support conversation.
 * If no active conversation exists, creates a brand-new one and
 * assigns a new random international agent name.
 */
export const getOrCreateConversationForUser = async (userId) => {
    let conversation = await Conversation.findOne({
        userId,
        status: 'open'
    });

    if (conversation) {
        console.log(
            `💬 Existing support conversation opened: ${conversation._id}`
        );

        return {
            conversation,
            isNew: false
        };
    }

    const assignedAgentName = getRandomAgentName();

    conversation = await Conversation.create({
        userId,
        assignedAgentName,
        status: 'open',
        lastMessage: '',
        lastMessageAt: new Date(),
        unreadByAdmin: false,
        unreadByUser: true
    });

    console.log(
        `🆕 Support conversation created: ${conversation._id} | Agent: ${assignedAgentName}`
    );

    /*
     * Only one opening greeting is created here.
     * Do NOT create another greeting when the user sends "Hi".
     */
    const greeting = await Message.create({
        conversationId: conversation._id,
        sender: 'bot',
        senderName: assignedAgentName,
        text: OPENING_GREETING,
        readByAdmin: true,
        readByUser: false
    });

    conversation.lastMessage = OPENING_GREETING;
    conversation.lastMessageAt = greeting.createdAt;

    await conversation.save();

    return {
        conversation,
        isNew: true
    };
};

/*
 * Mobile app fetches its active support chat from this service.
 */
export const getMyConversationService = async ({
    userId,
    page = 1,
    limit = 30
}) => {
    const { conversation } = await getOrCreateConversationForUser(userId);

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(
        100,
        Math.max(1, Number(limit) || 30)
    );

    const messages = await Message.find({
        conversationId: conversation._id
    })
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();

    await Message.updateMany(
        {
            conversationId: conversation._id,
            sender: { $in: ['admin', 'bot'] },
            readByUser: false
        },
        {
            $set: {
                readByUser: true
            }
        }
    );

    await Conversation.findByIdAndUpdate(
        conversation._id,
        {
            unreadByUser: false
        }
    );

    return {
        conversation: {
            id: conversation._id,
            assignedAgentName: conversation.assignedAgentName,
            status: conversation.status
        },
        messages: messages.reverse()
    };
};

/*
 * Saves and broadcasts a user text message.
 */
export const sendUserMessageService = async ({
    userId,
    text,
    imageUrl
}) => {
    const trimmedText = String(text || '').trim();

    if (!trimmedText && !imageUrl) {
        throw new ApiError(
            400,
            'Message text or image is required'
        );
    }

    const { conversation } = await getOrCreateConversationForUser(userId);

    const userMessage = await Message.create({
        conversationId: conversation._id,
        sender: 'user',
        senderName: 'You',
        text: trimmedText,
        imageUrl: imageUrl || null,
        readByAdmin: false,
        readByUser: true
    });

    conversation.lastMessage =
        trimmedText || 'Sent a photo';

    conversation.lastMessageAt = userMessage.createdAt;
    conversation.unreadByAdmin = true;

    await conversation.save();

    console.log(
        `📨 User message saved: ${userMessage._id} | Conversation: ${conversation._id}`
    );

    /*
     * The mobile user may receive this Socket.IO event too.
     * The mobile UI must dedupe by MongoDB message _id.
     */
    emitToConversation(
        conversation._id,
        'new_message',
        userMessage
    );

    const user = await User.findById(userId)
        .select('fullName phoneNumber')
        .lean();

    /*
     * This event creates the live admin sidebar update and
     * Chrome desktop notification.
     */
    emitToAdmins(
        'new_support_message',
        {
            conversationId: String(conversation._id),
            userId: String(userId),
            userName: user?.fullName || 'Unknown User',
            userPhone: user?.phoneNumber || '',
            text: userMessage.text,
            imageUrl: userMessage.imageUrl,
            createdAt: userMessage.createdAt
        }
    );

    /*
     * Important:
     * No automatic extra greeting here.
     * The opening greeting already exists when conversation is created.
     */
    return {
        messages: [userMessage]
    };
};

/*
 * Image upload becomes a normal chat message with imageUrl.
 */
export const uploadChatImageService = async ({
    userId,
    fileUrl
}) => {
    if (!fileUrl) {
        throw new ApiError(
            400,
            'No image was uploaded'
        );
    }

    return sendUserMessageService({
        userId,
        text: '',
        imageUrl: fileUrl
    });
};

/*
 * Admin dashboard conversation list.
 */
export const getAllConversationsService = async ({
    page = 1,
    limit = 20,
    status = ''
}) => {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(
        100,
        Math.max(1, Number(limit) || 20)
    );

    const filter = {};

    if (status) {
        filter.status = status;
    }

    const [conversations, count] = await Promise.all([
        Conversation.find(filter)
            .populate(
                'userId',
                'fullName phoneNumber countryCode'
            )
            .sort({
                lastMessageAt: -1
            })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean(),

        Conversation.countDocuments(filter)
    ]);

    return {
        conversations: conversations.map(
            (conversation) => ({
                id: conversation._id,
                user: conversation.userId
                    ? {
                        id: conversation.userId._id,
                        fullName:
                            conversation.userId.fullName,
                        phoneNumber:
                            conversation.userId.phoneNumber,
                        countryCode:
                            conversation.userId.countryCode
                    }
                    : null,
                assignedAgentName:
                    conversation.assignedAgentName,
                status: conversation.status,
                lastMessage: conversation.lastMessage,
                lastMessageAt:
                    conversation.lastMessageAt,
                unreadByAdmin:
                    conversation.unreadByAdmin
            })
        ),
        totalPages: Math.ceil(count / limitNum),
        currentPage: pageNum,
        totalConversations: count
    };
};

/*
 * Admin opens a particular chat.
 */
export const getConversationMessagesService = async ({
    conversationId,
    page = 1,
    limit = 50
}) => {
    const conversation = await Conversation.findById(
        conversationId
    ).populate(
        'userId',
        'fullName phoneNumber countryCode'
    );

    if (!conversation) {
        throw new ApiError(
            404,
            'Conversation not found'
        );
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(
        200,
        Math.max(1, Number(limit) || 50)
    );

    const messages = await Message.find({
        conversationId
    })
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();

    await Message.updateMany(
        {
            conversationId,
            sender: 'user',
            readByAdmin: false
        },
        {
            $set: {
                readByAdmin: true
            }
        }
    );

    await Conversation.findByIdAndUpdate(
        conversationId,
        {
            unreadByAdmin: false
        }
    );

    return {
        conversation: {
            id: conversation._id,
            user: conversation.userId
                ? {
                    id: conversation.userId._id,
                    fullName: conversation.userId.fullName,
                    phoneNumber:
                        conversation.userId.phoneNumber
                }
                : null,
            assignedAgentName:
                conversation.assignedAgentName,
            status: conversation.status
        },
        messages: messages.reverse()
    };
};

/*
 * Admin replies are always shown to the mobile user under the
 * conversation's assigned agent identity.
 *
 * Example:
 * Agent assigned when chat was created: Chloe Robinson
 * Actual admin writes response: "Please wait"
 * User sees sender name: Chloe Robinson
 */
export const sendAdminMessageService = async ({
    conversationId,
    adminName,
    text,
    imageUrl
}) => {
    const trimmedText = String(text || '').trim();

    if (!trimmedText && !imageUrl) {
        throw new ApiError(
            400,
            'Message text or image is required'
        );
    }

    const conversation = await Conversation.findById(
        conversationId
    );

    if (!conversation) {
        throw new ApiError(
            404,
            'Conversation not found'
        );
    }

    /*
     * Public display identity must always be the agent assigned to
     * this conversation. adminName is retained only as fallback.
     */
    const agentDisplayName =
        conversation.assignedAgentName ||
        String(adminName || '').trim() ||
        'TradeHub Support';

    const adminMessage = await Message.create({
        conversationId,
        sender: 'admin',
        senderName: agentDisplayName,
        text: trimmedText,
        imageUrl: imageUrl || null,
        readByAdmin: true,
        readByUser: false
    });

    conversation.lastMessage =
        trimmedText || 'Sent a photo';

    conversation.lastMessageAt = adminMessage.createdAt;
    conversation.unreadByUser = true;

    await conversation.save();

    console.log(
        `🛡️ Admin reply saved: ${adminMessage._id} | Public agent: ${agentDisplayName}`
    );

    emitToConversation(
        conversationId,
        'new_message',
        adminMessage
    );

    emitToUser(
        conversation.userId,
        'new_message',
        adminMessage
    );

    return {
        message: adminMessage
    };
};

/*
 * Admin resolves a conversation.
 *
 * Old messages stay permanently in MongoDB for the admin dashboard.
 * The mobile app receives a real-time event and clears only its UI.
 * The next time user starts Support Chat, getOrCreateConversationForUser
 * creates a new open conversation with a new random agent name.
 */
export const resolveConversationService = async ({
    conversationId
}) => {
    const conversation = await Conversation.findByIdAndUpdate(
        conversationId,
        {
            status: 'resolved',
            unreadByAdmin: false,
            unreadByUser: false
        },
        {
            new: true
        }
    );

    if (!conversation) {
        throw new ApiError(
            404,
            'Conversation not found'
        );
    }

    console.log(
        `✅ Support conversation resolved: ${conversation._id}`
    );

    const payload = {
        conversationId: String(conversation._id),
        message:
            'This support conversation has been resolved. Start a new chat whenever you need help.'
    };

    /*
     * Conversation room: users/admins that opened the exact thread.
     */
    emitToConversation(
        conversationId,
        'conversation_resolved',
        payload
    );

    /*
     * Private mobile user room: guarantees user receives event even
     * when a room join failed due to poor network/reconnect timing.
     */
    emitToUser(
        conversation.userId,
        'conversation_resolved',
        payload
    );

    emitToAdmins(
        'support_conversation_resolved',
        {
            conversationId: String(conversation._id),
            userId: String(conversation.userId),
            status: 'resolved'
        }
    );

    return {
        conversation: {
            id: conversation._id,
            userId: conversation.userId,
            status: conversation.status
        }
    };
};