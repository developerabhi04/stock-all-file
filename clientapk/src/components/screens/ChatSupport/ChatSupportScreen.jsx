import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { io } from 'socket.io-client';

import ApiService from '../../../services/ApiService';
import AuthStorage from '../../../services/AuthStorage';
import { ENDPOINTS, SERVER_URL } from '../../../config/api.config';

const COLORS = {
    bg: '#000000',
    surface: '#1A1A1A',
    border: '#2A2A2A',
    text: '#FFFFFF',
    textSecondary: '#999999',
    primary: '#00C896',
    primarySoft: 'rgba(0, 200, 150, 0.15)',
    userBubble: '#00C896',
};

const createLocalId = () => `local-${Date.now()}-${Math.random()}`;

const normalizeMessage = (message = {}) => ({
    id: String(message._id || message.id || createLocalId()),
    sender: message.sender || 'bot',
    senderName: message.senderName || '',
    content: message.text || message.content || '',
    imageUrl: message.imageUrl || null,
    createdAt: message.createdAt || new Date().toISOString(),
    optimistic: Boolean(message.optimistic),
});

const getApiErrorMessage = (error) =>
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong';

const getAbsoluteImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${SERVER_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const getSenderName = (message, conversation) => {
    if (message.sender === 'user') return 'You';

    if (message.sender === 'admin' || message.sender === 'bot') {
        return (
            conversation?.assignedAgentName ||
            message.senderName ||
            'TradeHub Support'
        );
    }

    return message.senderName || 'TradeHub Support';
};

export default function ChatSupportScreen({ navigation }) {
    const insets = useSafeAreaInsets();

    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);
    const [isResolved, setIsResolved] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const socketRef = useRef(null);
    const listRef = useRef(null);
    const inputRef = useRef(null);
    const conversationRef = useRef(null);

    useEffect(() => {
        conversationRef.current = conversation;
    }, [conversation]);

    useEffect(() => {
        if (Platform.OS !== 'android') return undefined;

        const showEvent = Keyboard.addListener('keyboardDidShow', (event) => {
            setKeyboardHeight(event.endCoordinates?.height || 0);
        });

        const hideEvent = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
        });

        return () => {
            showEvent.remove();
            hideEvent.remove();
        };
    }, []);

    const scrollToEnd = useCallback((animated = true) => {
        requestAnimationFrame(() => {
            listRef.current?.scrollToEnd({ animated });
        });
    }, []);

    const appendIncomingMessages = useCallback(
        (incomingMessages) => {
            const incoming = Array.isArray(incomingMessages)
                ? incomingMessages
                : [incomingMessages];

            setMessages((current) => {
                const existingIds = new Set(
                    current.map((item) => String(item.id))
                );

                const additions = incoming
                    .map(normalizeMessage)
                    .filter((item) => !existingIds.has(String(item.id)));

                return additions.length ? [...current, ...additions] : current;
            });

            setTimeout(() => scrollToEnd(true), 150);
        },
        [scrollToEnd]
    );

    const loadConversation = useCallback(async () => {
        try {
            setLoading(true);
            setIsResolved(false);

            const response = await ApiService.get(
                ENDPOINTS.SUPPORT_CONVERSATION,
                { params: { page: 1, limit: 100 } }
            );

            const payload =
                response?.data?.data || response?.data || response;

            const nextConversation = payload?.conversation || null;
            const nextMessages = Array.isArray(payload?.messages)
                ? payload.messages.map(normalizeMessage)
                : [];

            setConversation(nextConversation);
            setMessages(nextMessages);

            const conversationId =
                nextConversation?.id || nextConversation?._id;

            if (conversationId && socketRef.current?.connected) {
                socketRef.current.emit('join_conversation', conversationId);
            }

            setTimeout(() => scrollToEnd(false), 250);
        } catch (error) {
            Alert.alert('Support Chat', getApiErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }, [scrollToEnd]);

    const connectSocket = useCallback(async () => {
        const token = await AuthStorage.getToken();

        if (!token) {
            setSocketConnected(false);
            return null;
        }

        const socket = io(SERVER_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            timeout: 20000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setSocketConnected(true);

            const activeConversation = conversationRef.current;
            const conversationId =
                activeConversation?.id || activeConversation?._id;

            if (conversationId) {
                socket.emit('join_conversation', conversationId);
            }
        });

        socket.on('disconnect', () => setSocketConnected(false));

        socket.on('connect_error', (error) => {
            console.warn('Support socket connection error:', error?.message);
            setSocketConnected(false);
        });

        socket.on('new_message', appendIncomingMessages);

        socket.on('conversation_resolved', (payload) => {
            const activeConversation = conversationRef.current;
            const currentId = String(
                activeConversation?.id || activeConversation?._id || ''
            );
            const resolvedId = String(payload?.conversationId || '');

            if (currentId && resolvedId && currentId !== resolvedId) {
                return;
            }

            setConversation(null);
            setMessages([]);
            setText('');
            setIsResolved(true);

            Alert.alert(
                'Support Request Resolved',
                payload?.message ||
                'Your support request has been resolved. Start a new chat whenever you need help.'
            );
        });

        return socket;
    }, [appendIncomingMessages]);

    useEffect(() => {
        let mounted = true;
        let socket;

        const start = async () => {
            await loadConversation();
            if (!mounted) return;
            socket = await connectSocket();
        };

        start();

        return () => {
            mounted = false;
            socket?.disconnect();
            socketRef.current?.disconnect();
            socketRef.current = null;
        };
    }, [connectSocket, loadConversation]);

    const sendMessage = async () => {
        const trimmedText = text.trim();

        if (!trimmedText || sending || uploading || isResolved) return;

        setText('');
        setSending(true);

        try {
            const response = await ApiService.post(
                ENDPOINTS.SUPPORT_MESSAGES,
                { text: trimmedText }
            );

            const payload =
                response?.data?.data || response?.data || response;
            const serverMessages = payload?.messages || [];

            if (serverMessages.length) {
                appendIncomingMessages(serverMessages);
            }
        } catch (error) {
            setText(trimmedText);
            Alert.alert('Message Failed', getApiErrorMessage(error));
        } finally {
            setSending(false);
        }
    };

    const chooseImage = async () => {
        if (isResolved || uploading || sending) return;

        try {
            const result = await launchImageLibrary({
                mediaType: 'photo',
                selectionLimit: 1,
                quality: 0.8,
                maxWidth: 1600,
                maxHeight: 1600,
            });

            if (
                result.didCancel ||
                !result.assets ||
                result.assets.length === 0
            ) {
                return;
            }

            const asset = result.assets[0];

            if (!asset?.uri) {
                Alert.alert(
                    'Image Upload Failed',
                    'Selected image URI was not found.'
                );
                return;
            }

            const formData = new FormData();
            formData.append('image', {
                uri: asset.uri,
                type: asset.type || 'image/jpeg',
                name:
                    asset.fileName || `support-image-${Date.now()}.jpg`,
            });

            setUploading(true);

            const response = await ApiService.post(
                ENDPOINTS.SUPPORT_MESSAGES_IMAGE,
                formData
            );

            const payload =
                response?.data?.data || response?.data || response;
            const serverMessages = payload?.messages || [];

            if (serverMessages.length) {
                appendIncomingMessages(serverMessages);
            }
        } catch (error) {
            console.log(
                'Support image upload error:',
                error?.response?.data || error?.message || error
            );

            Alert.alert(
                'Image Upload Failed',
                getApiErrorMessage(error)
            );
        } finally {
            setUploading(false);
        }
    };

    const renderMessage = ({ item }) => {
        const isUser = item.sender === 'user';
        const imageUrl = getAbsoluteImageUrl(item.imageUrl);
        const senderName = getSenderName(item, conversation);

        return (
            <View
                style={[
                    styles.messageRow,
                    isUser ? styles.userRow : styles.supportRow,
                ]}
            >
                {!isUser && (
                    <View style={styles.supportIcon}>
                        <Icon
                            name="headset"
                            size={16}
                            color={COLORS.primary}
                        />
                    </View>
                )}

                <View
                    style={[
                        styles.bubble,
                        isUser
                            ? styles.userBubble
                            : styles.supportBubble,
                    ]}
                >
                    <Text
                        style={[
                            styles.senderName,
                            isUser && styles.userSenderName,
                        ]}
                    >
                        {senderName}
                    </Text>

                    {!!item.content && (
                        <Text
                            style={[
                                styles.messageText,
                                isUser && styles.userMessageText,
                            ]}
                        >
                            {item.content}
                        </Text>
                    )}

                    {!!imageUrl && (
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.messageImage}
                            resizeMode="cover"
                        />
                    )}
                </View>
            </View>
        );
    };

    const androidKeyboardPadding =
        Platform.OS === 'android' && keyboardHeight > 0
            ? keyboardHeight
            : 0;

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle="light-content"
                backgroundColor={COLORS.bg}
            />

            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon
                            name="arrow-left"
                            size={22}
                            color={COLORS.text}
                        />
                    </TouchableOpacity>

                    <View style={styles.headerContent}>
                        <Text style={styles.title}>
                            TradeHub Support
                        </Text>

                        <Text style={styles.status}>
                            <Text style={styles.statusDot}>●</Text>{' '}
                            {socketConnected ? 'Online' : 'Connecting...'}
                        </Text>
                    </View>

                    <View style={styles.headerIcon}>
                        <Icon
                            name="headset"
                            size={22}
                            color={COLORS.primary}
                        />
                    </View>
                </View>
            </SafeAreaView>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator
                        color={COLORS.primary}
                        size="large"
                    />
                    <Text style={styles.loadingText}>
                        Loading support chat...
                    </Text>
                </View>
            ) : (
                <KeyboardAvoidingView
                    style={styles.keyboardView}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={0}
                >
                    {!conversation || isResolved ? (
                        <View style={styles.resolvedContainer}>
                            <View style={styles.resolvedIcon}>
                                <Icon
                                    name="check-circle-outline"
                                    size={42}
                                    color={COLORS.primary}
                                />
                            </View>

                            <Text style={styles.resolvedTitle}>
                                Support Request Resolved
                            </Text>

                            <Text style={styles.resolvedText}>
                                Your previous support chat has been closed.
                                Start a new chat whenever you need help again.
                            </Text>

                            <TouchableOpacity
                                style={styles.startNewChatButton}
                                onPress={loadConversation}
                            >
                                <Icon
                                    name="message-plus-outline"
                                    size={19}
                                    color="#00150F"
                                />
                                <Text style={styles.startNewChatText}>
                                    Start New Chat
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.chatContainer}>
                            <FlatList
                                ref={listRef}
                                data={messages}
                                keyExtractor={(item) => String(item.id)}
                                renderItem={renderMessage}
                                contentContainerStyle={styles.messagesContent}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="always"
                                keyboardDismissMode={
                                    Platform.OS === 'ios'
                                        ? 'interactive'
                                        : 'on-drag'
                                }
                                onContentSizeChange={() => {
                                    scrollToEnd(false);
                                }}
                                onLayout={() => {
                                    scrollToEnd(false);
                                }}
                            />

                            <Text style={styles.disclaimer}>
                                Never share your password, OTP, PIN, or CVV with anyone.
                            </Text>

                            <View
                                style={[
                                    styles.composerContainer,
                                    {
                                        paddingBottom: Math.max(insets.bottom, 8),
                                        transform: [
                                            {
                                                translateY:
                                                    androidKeyboardPadding > 0
                                                        ? -androidKeyboardPadding
                                                        : 0,
                                            },
                                        ],
                                    },
                                ]}
                            >
                                <TouchableOpacity
                                    onPress={chooseImage}
                                    disabled={uploading || sending}
                                    style={styles.attachButton}
                                    activeOpacity={0.7}
                                >
                                    {uploading ? (
                                        <ActivityIndicator
                                            color={COLORS.primary}
                                            size="small"
                                        />
                                    ) : (
                                        <Icon
                                            name="paperclip"
                                            size={22}
                                            color={COLORS.primary}
                                        />
                                    )}
                                </TouchableOpacity>

                                <TextInput
                                    ref={inputRef}
                                    value={text}
                                    onChangeText={setText}
                                    placeholder="Write your problem..."
                                    placeholderTextColor={COLORS.textSecondary}
                                    multiline
                                    numberOfLines={1}
                                    scrollEnabled
                                    returnKeyType="default"
                                    blurOnSubmit={false}
                                    textAlign="left"
                                    textAlignVertical="center"
                                    includeFontPadding={false}
                                    style={styles.input}
                                    editable={!sending && !uploading}
                                    onFocus={() => {
                                        setTimeout(() => {
                                            scrollToEnd(true);
                                        }, 250);
                                    }}
                                />

                                <TouchableOpacity
                                    onPress={sendMessage}
                                    disabled={
                                        sending ||
                                        uploading ||
                                        !text.trim()
                                    }
                                    activeOpacity={0.75}
                                    style={[
                                        styles.sendButton,
                                        (!text.trim() ||
                                            sending ||
                                            uploading) &&
                                        styles.sendButtonDisabled,
                                    ]}
                                >
                                    {sending ? (
                                        <ActivityIndicator
                                            color="#00150F"
                                            size="small"
                                        />
                                    ) : (
                                        <Icon
                                            name="send"
                                            size={20}
                                            color="#00150F"
                                        />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </KeyboardAvoidingView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    safeArea: {
        backgroundColor: COLORS.bg,
    },
    keyboardView: {
        flex: 1,
    },
    chatContainer: {
        flex: 1,
        overflow: 'visible',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#141414',
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
    },
    headerContent: {
        flex: 1,
        marginLeft: 12,
    },
    title: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '800',
    },
    status: {
        color: COLORS.primary,
        fontSize: 11,
        marginTop: 3,
        fontWeight: '600',
    },
    statusDot: {
        color: COLORS.primary,
    },
    headerIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primarySoft,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: COLORS.textSecondary,
        marginTop: 12,
        fontSize: 13,
    },
    messagesContent: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 14,
        alignItems: 'flex-end',
    },
    userRow: {
        justifyContent: 'flex-end',
    },
    supportRow: {
        justifyContent: 'flex-start',
    },
    supportIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primarySoft,
        marginRight: 8,
    },
    bubble: {
        maxWidth: '82%',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 11,
    },
    userBubble: {
        backgroundColor: COLORS.userBubble,
        borderBottomRightRadius: 4,
    },
    supportBubble: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderBottomLeftRadius: 4,
    },
    senderName: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: '800',
        marginBottom: 4,
    },
    userSenderName: {
        color: '#004936',
    },
    messageText: {
        color: COLORS.text,
        fontSize: 13.5,
        lineHeight: 20,
    },
    userMessageText: {
        color: '#00150F',
        fontWeight: '700',
    },
    messageImage: {
        width: 210,
        height: 180,
        borderRadius: 10,
        marginTop: 6,
        backgroundColor: '#111111',
    },
    disclaimer: {
        color: '#666666',
        fontSize: 10,
        textAlign: 'center',
        paddingHorizontal: 16,
        paddingTop: 5,
        paddingBottom: 6,
        backgroundColor: COLORS.bg,
    },
    composerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.bg,
        zIndex: 100,
        elevation: 20,
    },
    attachButton: {
        width: 42,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        height: 48,
        minHeight: 48,
        maxHeight: 110,
        color: COLORS.text,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingTop: 0,
        paddingBottom: 0,
        fontSize: 14,
        lineHeight: 20,
        includeFontPadding: false,
    },
    sendButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        marginLeft: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
    },
    sendButtonDisabled: {
        opacity: 0.4,
    },
    resolvedContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    resolvedIcon: {
        width: 82,
        height: 82,
        borderRadius: 41,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primarySoft,
        marginBottom: 18,
    },
    resolvedTitle: {
        color: COLORS.text,
        fontSize: 19,
        fontWeight: '800',
        textAlign: 'center',
    },
    resolvedText: {
        color: COLORS.textSecondary,
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 22,
    },
    startNewChatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 13,
    },
    startNewChatText: {
        color: '#00150F',
        fontSize: 14,
        fontWeight: '800',
        marginLeft: 8,
    },
});
