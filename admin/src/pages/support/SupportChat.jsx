import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Search,
    Send,
    Paperclip,
    CheckCheck,
    CircleUserRound,
    RefreshCw,
    CheckCircle2,
    Loader2,
    MessageCircle,
} from 'lucide-react';
import { getAdminToken } from '../../services/api';
import {
    connectAdminSocket,
    joinSupportConversation,
    leaveSupportConversation,
} from '../../services/socket';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
const SERVER_URL = API_URL.replace(/\/api\/v1\/?$/, '');

const formatDate = (value) => {
    if (!value) return '';

    return new Date(value).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
};

const getImageUrl = (url) => {
    if (!url) return '';

    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    return `${SERVER_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const getMessageDisplayName = (message, conversation) => {
    if (message.sender === 'user') {
        return conversation?.user?.fullName || 'User';
    }

    if (message.sender === 'bot') {
        return conversation?.assignedAgentName || 'TradeHub Support';
    }

    if (
        !message.senderName ||
        message.senderName.toLowerCase() === 'admin'
    ) {
        return conversation?.assignedAgentName || 'TradeHub Support';
    }

    return message.senderName;
};

const SupportChat = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [search, setSearch] = useState('');
    const [messageText, setMessageText] = useState('');
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);
    const [isResolving, setIsResolving] = useState(false);

    const messagesRef = useRef(null);
    const fileInputRef = useRef(null);
    const selectedConversationRef = useRef(null);

    useEffect(() => {
        selectedConversationRef.current = selectedConversation;
    }, [selectedConversation]);

    const getHeaders = useCallback(() => {
        const token = getAdminToken();

        return {
            Authorization: `Bearer ${token}`,
        };
    }, []);

    const scrollMessagesToBottom = useCallback(() => {
        setTimeout(() => {
            messagesRef.current?.scrollTo({
                top: messagesRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }, 100);
    }, []);

    const showBrowserNotification = useCallback((payload) => {
        if (
            typeof Notification === 'undefined' ||
            Notification.permission !== 'granted'
        ) {
            return;
        }

        const notification = new Notification(
            `New support message — ${payload.userName || 'User'}`,
            {
                body: payload.text || 'User sent an image attachment',
                icon: '/favicon.ico',
                tag: `support-${payload.conversationId}`,
                renotify: true,
            }
        );

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }, []);

    const fetchConversations = useCallback(async () => {
        try {
            setLoadingConversations(true);

            const response = await fetch(
                `${API_URL}/admin/support/conversations?page=1&limit=100`,
                { headers: getHeaders() }
            );

            const json = await response.json();

            if (!response.ok) {
                throw new Error(
                    json.message || 'Failed to load conversations'
                );
            }

            setConversations(json.data?.conversations || []);
        } catch (error) {
            console.error('Support conversations error:', error);
        } finally {
            setLoadingConversations(false);
        }
    }, [getHeaders]);

    const fetchMessages = useCallback(
        async (conversationId) => {
            if (!conversationId) return;

            try {
                setLoadingMessages(true);

                const response = await fetch(
                    `${API_URL}/admin/support/conversations/${conversationId}/messages?page=1&limit=200`,
                    { headers: getHeaders() }
                );

                const json = await response.json();

                if (!response.ok) {
                    throw new Error(
                        json.message || 'Failed to load messages'
                    );
                }

                setMessages(json.data?.messages || []);
                scrollMessagesToBottom();
            } catch (error) {
                console.error('Support messages error:', error);
            } finally {
                setLoadingMessages(false);
            }
        },
        [getHeaders, scrollMessagesToBottom]
    );

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        const socket = connectAdminSocket();

        if (!socket) {
            setSocketConnected(false);
            return undefined;
        }

        const onConnect = () => {
            console.log('✅ Support inbox socket connected');
            setSocketConnected(true);
        };

        const onDisconnect = (reason) => {
            console.warn('⚠️ Support inbox socket disconnected:', reason);
            setSocketConnected(false);
        };

        const onConnectError = (error) => {
            console.error(
                '❌ Support inbox socket connection error:',
                error.message
            );
            setSocketConnected(false);
        };

        const onNewSupportMessage = (payload) => {
            console.log('💬 New live support message:', payload);
            showBrowserNotification(payload);

            setConversations((current) => {
                const exists = current.some(
                    (conversation) =>
                        String(conversation.id) ===
                        String(payload.conversationId)
                );

                if (!exists) {
                    fetchConversations();
                    return current;
                }

                return current
                    .map((conversation) => {
                        if (
                            String(conversation.id) !==
                            String(payload.conversationId)
                        ) {
                            return conversation;
                        }

                        const isCurrentlyOpen =
                            String(
                                selectedConversationRef.current?.id || ''
                            ) === String(payload.conversationId);

                        return {
                            ...conversation,
                            lastMessage: payload.text || 'Sent an image',
                            lastMessageAt: payload.createdAt,
                            unreadByAdmin: !isCurrentlyOpen,
                        };
                    })
                    .sort(
                        (a, b) =>
                            new Date(b.lastMessageAt) -
                            new Date(a.lastMessageAt)
                    );
            });

            const activeConversation = selectedConversationRef.current;

            if (
                activeConversation &&
                String(activeConversation.id) ===
                String(payload.conversationId)
            ) {
                fetchMessages(payload.conversationId);
            }
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onConnectError);
        socket.on('new_support_message', onNewSupportMessage);

        if (socket.connected) {
            onConnect();
        }

        if (
            typeof Notification !== 'undefined' &&
            Notification.permission === 'default'
        ) {
            Notification.requestPermission().catch(() => { });
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error', onConnectError);
            socket.off('new_support_message', onNewSupportMessage);
        };
    }, [fetchConversations, fetchMessages, showBrowserNotification]);

    const filteredConversations = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return conversations;

        return conversations.filter((conversation) => {
            const name = conversation.user?.fullName?.toLowerCase() || '';
            const phone = conversation.user?.phoneNumber?.toLowerCase() || '';

            return name.includes(term) || phone.includes(term);
        });
    }, [conversations, search]);

    const selectConversation = async (conversation) => {
        const previousConversationId = selectedConversationRef.current?.id;

        if (
            previousConversationId &&
            String(previousConversationId) !== String(conversation.id)
        ) {
            leaveSupportConversation(previousConversationId);
        }

        setSelectedConversation(conversation);
        setMessageText('');

        setConversations((current) =>
            current.map((item) =>
                String(item.id) === String(conversation.id)
                    ? { ...item, unreadByAdmin: false }
                    : item
            )
        );

        joinSupportConversation(conversation.id);
        await fetchMessages(conversation.id);
    };

    const sendMessage = async () => {
        const text = messageText.trim();

        if (
            !text ||
            !selectedConversation ||
            selectedConversation.status === 'resolved' ||
            sending ||
            uploading
        ) {
            return;
        }

        try {
            setSending(true);

            const response = await fetch(
                `${API_URL}/admin/support/conversations/${selectedConversation.id}/messages`,
                {
                    method: 'POST',
                    headers: {
                        ...getHeaders(),
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text }),
                }
            );

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json.message || 'Failed to send message');
            }

            setMessageText('');
            await fetchMessages(selectedConversation.id);
            await fetchConversations();
        } catch (error) {
            alert(error.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const uploadImage = async (event) => {
        const file = event.target.files?.[0];

        if (
            !file ||
            !selectedConversation ||
            selectedConversation.status === 'resolved' ||
            uploading ||
            sending
        ) {
            event.target.value = '';
            return;
        }

        try {
            setUploading(true);

            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch(
                `${API_URL}/admin/support/conversations/${selectedConversation.id}/messages/image`,
                {
                    method: 'POST',
                    headers: getHeaders(),
                    body: formData,
                }
            );

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json.message || 'Image upload failed');
            }

            await fetchMessages(selectedConversation.id);
            await fetchConversations();
        } catch (error) {
            alert(error.message || 'Image upload failed');
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const resolveConversation = async () => {
        if (
            !selectedConversation ||
            selectedConversation.status === 'resolved' ||
            isResolving
        ) {
            return;
        }

        try {
            setIsResolving(true);

            const response = await fetch(
                `${API_URL}/admin/support/conversations/${selectedConversation.id}/resolve`,
                {
                    method: 'PATCH',
                    headers: getHeaders(),
                }
            );

            const json = await response.json();

            if (!response.ok) {
                throw new Error(
                    json.message || 'Failed to resolve conversation'
                );
            }

            setSelectedConversation((current) =>
                current ? { ...current, status: 'resolved' } : null
            );

            setConversations((current) =>
                current.map((conversation) =>
                    String(conversation.id) === String(selectedConversation.id)
                        ? {
                            ...conversation,
                            status: 'resolved',
                            unreadByAdmin: false,
                        }
                        : conversation
                )
            );

            setMessageText('');
            await fetchConversations();
        } catch (error) {
            alert(error.message || 'Failed to resolve conversation');
        } finally {
            setIsResolving(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] min-h-[600px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <aside className="flex w-full max-w-sm flex-col border-r border-gray-200 bg-gray-50">
                <div className="border-b border-gray-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                Support Inbox
                            </h1>

                            <p className="mt-1 text-xs text-gray-500">
                                <span
                                    className={
                                        socketConnected
                                            ? 'text-emerald-600'
                                            : 'text-gray-400'
                                    }
                                >
                                    ●
                                </span>{' '}
                                {socketConnected
                                    ? 'Live connection'
                                    : 'Connecting'}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={fetchConversations}
                            className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-gray-900"
                            title="Refresh conversations"
                        >
                            <RefreshCw
                                size={17}
                                className={
                                    loadingConversations ? 'animate-spin' : ''
                                }
                            />
                        </button>
                    </div>

                    <div className="relative">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={17}
                        />

                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search conversations..."
                            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loadingConversations && conversations.length === 0 ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2
                                className="animate-spin text-blue-600"
                                size={24}
                            />
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-500">
                            <MessageCircle
                                className="mx-auto mb-3 text-gray-300"
                                size={38}
                            />
                            No conversations yet.
                        </div>
                    ) : (
                        filteredConversations.map((conversation) => (
                            <button
                                key={conversation.id}
                                type="button"
                                onClick={() => selectConversation(conversation)}
                                className={`flex w-full gap-3 border-b border-gray-200 p-4 text-left transition hover:bg-white ${selectedConversation?.id === conversation.id
                                    ? 'bg-white'
                                    : ''
                                    }`}
                            >
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                                    {conversation.user?.fullName
                                        ?.charAt(0)
                                        ?.toUpperCase() || 'U'}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate font-semibold text-gray-900">
                                            {conversation.user?.fullName ||
                                                'Unknown User'}
                                        </p>

                                        {conversation.unreadByAdmin && (
                                            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                                        )}
                                    </div>

                                    <p className="truncate text-xs text-gray-500">
                                        {conversation.user?.phoneNumber || '-'}
                                    </p>

                                    <p className="mt-1 truncate text-sm text-gray-600">
                                        {conversation.lastMessage ||
                                            'New conversation'}
                                    </p>

                                    <p className="mt-1 text-[11px] text-gray-400">
                                        {formatDate(conversation.lastMessageAt)}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </aside>

            <section className="hidden min-w-0 flex-1 flex-col md:flex">
                {!selectedConversation ? (
                    <div className="flex flex-1 flex-col items-center justify-center text-gray-400">
                        <MessageCircle
                            size={64}
                            className="mb-4 text-gray-200"
                        />
                        <h2 className="text-lg font-semibold text-gray-700">
                            Select a conversation
                        </h2>
                        <p className="mt-1 text-sm">
                            User messages will appear here in real time.
                        </p>
                    </div>
                ) : (
                    <>
                        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                                    {selectedConversation.user?.fullName
                                        ?.charAt(0)
                                        ?.toUpperCase() || 'U'}
                                </div>

                                <div>
                                    <h2 className="font-bold text-gray-900">
                                        {selectedConversation.user?.fullName ||
                                            'Unknown User'}
                                    </h2>

                                    <p className="text-xs text-gray-500">
                                        {selectedConversation.user?.phoneNumber ||
                                            '-'}{' '}
                                        · Agent:{' '}
                                        {selectedConversation.assignedAgentName ||
                                            'TradeHub Support'}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={resolveConversation}
                                disabled={
                                    selectedConversation?.status === 'resolved' ||
                                    isResolving
                                }
                                className="flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isResolving ? (
                                    <Loader2
                                        className="animate-spin"
                                        size={16}
                                    />
                                ) : (
                                    <CheckCircle2 size={16} />
                                )}

                                {isResolving
                                    ? 'Resolving...'
                                    : selectedConversation?.status ===
                                        'resolved'
                                        ? 'Resolved'
                                        : 'Resolve'}
                            </button>
                        </header>

                        <div
                            ref={messagesRef}
                            className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-5"
                        >
                            {loadingMessages ? (
                                <div className="flex justify-center p-8">
                                    <Loader2
                                        className="animate-spin text-blue-600"
                                        size={24}
                                    />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="py-12 text-center text-sm text-gray-500">
                                    No messages yet.
                                </div>
                            ) : (
                                messages.map((message) => {
                                    const isAdmin = message.sender === 'admin';
                                    const imageUrl = getImageUrl(message.imageUrl);
                                    const displayName = getMessageDisplayName(
                                        message,
                                        selectedConversation
                                    );

                                    return (
                                        <div
                                            key={message._id || message.id}
                                            className={`flex ${isAdmin
                                                ? 'justify-end'
                                                : 'justify-start'
                                                }`}
                                        >
                                            <div
                                                className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${isAdmin
                                                    ? 'rounded-br-md bg-blue-600 text-white'
                                                    : 'rounded-bl-md border border-gray-200 bg-white text-gray-800'
                                                    }`}
                                            >
                                                <div
                                                    className={`mb-1 flex items-center gap-2 text-xs font-semibold ${isAdmin
                                                        ? 'text-blue-100'
                                                        : 'text-blue-600'
                                                        }`}
                                                >
                                                    <CircleUserRound size={13} />
                                                    {displayName}
                                                </div>

                                                {message.text && (
                                                    <p className="whitespace-pre-wrap text-sm">
                                                        {message.text}
                                                    </p>
                                                )}

                                                {imageUrl && (
                                                    <img
                                                        src={imageUrl}
                                                        alt="Support attachment"
                                                        className="mt-2 max-h-72 max-w-full rounded-lg object-contain"
                                                    />
                                                )}

                                                <div
                                                    className={`mt-2 flex items-center justify-end gap-1 text-[10px] ${isAdmin
                                                        ? 'text-blue-100'
                                                        : 'text-gray-400'
                                                        }`}
                                                >
                                                    {formatDate(message.createdAt)}
                                                    {isAdmin && (
                                                        <CheckCheck size={13} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {selectedConversation?.status !== 'resolved' ? (
                            <footer className="border-t border-gray-200 bg-white p-4">
                                <div className="flex items-end gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        onChange={uploadImage}
                                        className="hidden"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        disabled={uploading || sending}
                                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                                        title="Attach image"
                                    >
                                        {uploading ? (
                                            <Loader2
                                                className="animate-spin"
                                                size={19}
                                            />
                                        ) : (
                                            <Paperclip size={19} />
                                        )}
                                    </button>

                                    <textarea
                                        value={messageText}
                                        onChange={(event) =>
                                            setMessageText(event.target.value)
                                        }
                                        onKeyDown={(event) => {
                                            if (
                                                event.key === 'Enter' &&
                                                !event.shiftKey
                                            ) {
                                                event.preventDefault();
                                                sendMessage();
                                            }
                                        }}
                                        rows={1}
                                        placeholder="Write a reply..."
                                        className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                    <button
                                        type="button"
                                        onClick={sendMessage}
                                        disabled={
                                            !messageText.trim() ||
                                            sending ||
                                            uploading
                                        }
                                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {sending ? (
                                            <Loader2
                                                className="animate-spin"
                                                size={19}
                                            />
                                        ) : (
                                            <Send size={19} />
                                        )}
                                    </button>
                                </div>

                                <p className="mt-2 text-xs text-gray-400">
                                    Press Enter to send · Shift + Enter for a
                                    new line
                                </p>
                            </footer>
                        ) : (
                            <div className="flex items-center justify-center border-t border-gray-200 bg-gray-50 px-5 py-5">
                                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                                    <CheckCircle2 size={18} />
                                    This conversation has been resolved. Replies
                                    are disabled.
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
};

export default SupportChat;