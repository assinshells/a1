// frontend/src/pages/Chat.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';
import { messageAPI } from '../services/api';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import ChatHeader from '../components/ChatHeader';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentRoom, setCurrentRoom] = useState('general');
    const [typingUsers, setTypingUsers] = useState([]);
    const { user, token, logout } = useAuth();
    const { socket, connected, sendMessage, joinRoom } = useSocket();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    // ✅ ДОБАВЛЕНО: Ref для отслеживания отмены загрузки
    const loadingAbortRef = useRef(null);

    // ✅ ИСПРАВЛЕНО: loadMessages с поддержкой отмены
    const loadMessages = useCallback(async (room, abortSignal) => {
        if (!token || !room) return;

        try {
            setLoading(true);
            console.log(`📥 Loading messages for room: ${room}`);

            const data = await messageAPI.getMessages(
                { room, limit: 50 },
                token
            );

            // ✅ Проверяем отмену
            if (abortSignal?.aborted) {
                console.log('⚠️ Load cancelled for room:', room);
                return;
            }

            console.log(`✅ Loaded ${data.messages?.length || 0} messages`);
            setMessages(data.messages || []);
        } catch (error) {
            if (error.name === 'AbortError') return;

            console.error('❌ Error loading messages:', error);
            setMessages([]);
        } finally {
            if (!abortSignal?.aborted) {
                setLoading(false);
            }
        }
    }, [token]);

    // ✅ ИСПРАВЛЕНО: Загрузка при смене комнаты с отменой предыдущих
    useEffect(() => {
        // Отменяем предыдущую загрузку
        if (loadingAbortRef.current) {
            loadingAbortRef.current.abort();
        }

        // Создаём новый AbortController
        const abortController = new AbortController();
        loadingAbortRef.current = abortController;

        // Очищаем старые сообщения сразу
        setMessages([]);
        setTypingUsers([]);

        // Загружаем новые
        loadMessages(currentRoom, abortController.signal);

        return () => {
            abortController.abort();
        };
    }, [currentRoom, loadMessages]);

    // ✅ ИСПРАВЛЕНО: Мемоизированные обработчики Socket
    const handleNewMessage = useCallback((message) => {
        console.log('📨 New message received:', message);

        // ✅ Проверяем соответствие комнате
        if (message.room !== currentRoom) {
            console.log('⚠️ Message for different room, ignoring');
            return;
        }

        setMessages((prev) => {
            // ✅ Проверяем дубликаты по _id
            if (message._id && prev.some(m => m._id === message._id)) {
                console.log('⚠️ Duplicate message ignored');
                return prev;
            }
            return [...prev, message];
        });
    }, [currentRoom]); // ✅ ДОБАВЛЕНО: currentRoom в зависимостях

    const handleTyping = useCallback((data) => {
        if (data.userId !== user?.id && data.userId !== user?._id) {
            setTypingUsers((prev) => {
                if (prev.some(u => u.userId === data.userId)) {
                    return prev;
                }
                return [...prev, data];
            });

            setTimeout(() => {
                setTypingUsers((prev) =>
                    prev.filter((u) => u.userId !== data.userId)
                );
            }, 3000);
        }
    }, [user]);

    const handleStopTyping = useCallback((data) => {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    }, []);

    // ✅ ИСПРАВЛЕНО: Подписка на Socket события
    useEffect(() => {
        if (!socket) return;

        console.log('🔌 Subscribing to socket events');

        socket.on('message:receive', handleNewMessage);
        socket.on('message:sent', handleNewMessage);
        socket.on('typing:user', handleTyping);
        socket.on('typing:stop', handleStopTyping);

        socket.on('message:error', (error) => {
            console.error('❌ Socket message error:', error);
            alert(`Failed to send message: ${error.details || error.error}`);
        });

        return () => {
            console.log('🔌 Unsubscribing from socket events');
            socket.off('message:receive', handleNewMessage);
            socket.off('message:sent', handleNewMessage);
            socket.off('typing:user', handleTyping);
            socket.off('typing:stop', handleStopTyping);
            socket.off('message:error');
        };
    }, [socket, handleNewMessage, handleTyping, handleStopTyping]);

    // ✅ ИСПРАВЛЕНО: Автоскролл
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ✅ УПРОЩЕНО: Отправка только через Socket
    const handleSendMessage = useCallback((content) => {
        if (!content.trim()) return;

        console.log(`📤 Sending message to room: ${currentRoom}`);

        sendMessage({
            room: currentRoom,
            content: content.trim(),
            type: 'text',
        });
    }, [currentRoom, sendMessage]);

    // ✅ ИСПРАВЛЕНО: Смена комнаты
    const handleRoomChange = useCallback((room) => {
        if (room === currentRoom) return; // Игнорируем если та же комната

        console.log(`🚪 Changing room from ${currentRoom} to ${room}`);

        setCurrentRoom(room);
        joinRoom(room);
    }, [currentRoom, joinRoom]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="chat-container">
            <LeftSidebar handleLogout={handleLogout} />


            <div className="chat-main">
                <ChatHeader room={currentRoom} connected={connected} />

                <div className="chat-messages">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Загрузка...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <MessageList messages={messages} currentUser={user} />
                            {typingUsers.length > 0 && (
                                <div className="typing-indicator">
                                    <span>
                                        {typingUsers.map(u => u.username).join(', ')} печатает...
                                    </span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                <MessageInput
                    onSendMessage={handleSendMessage}
                    currentRoom={currentRoom}
                />
            </div>
            <RightSidebar
                currentRoom={currentRoom}
                onRoomChange={handleRoomChange}
            />
        </div>
    );
};

export default Chat;