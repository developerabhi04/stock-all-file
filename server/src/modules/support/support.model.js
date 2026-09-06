import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        assignedAgentName: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: ['open', 'resolved'],
            default: 'open'
        },

        lastMessage: {
            type: String,
            default: ''
        },

        lastMessageAt: {
            type: Date,
            default: Date.now
        },

        unreadByAdmin: {
            type: Boolean,
            default: false
        },

        unreadByUser: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

conversationSchema.index({ status: 1, lastMessageAt: -1 });
conversationSchema.index({ userId: 1, status: 1 });

const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
            index: true
        },

        sender: {
            type: String,
            enum: ['user', 'admin', 'bot'],
            required: true
        },

        senderName: {
            type: String,
            required: true
        },

        text: {
            type: String,
            default: ''
        },

        imageUrl: {
            type: String,
            default: null
        },

        readByAdmin: {
            type: Boolean,
            default: false
        },

        readByUser: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
export const Message = mongoose.model('Message', messageSchema);