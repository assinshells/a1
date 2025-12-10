import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';
import { messageAPI } from '../services/api';
import LeftSidebar from '../components/LeftSidebar';
import ChatSidebar from '../components/ChatSidebar';
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

    // ✅ ИСПРАВЛЕНО: loadMessages зависит от currentRoom и token
    const loadMessages = useCallback(async () => {
        if (!token || !currentRoom) return;

        try {
            setLoading(true);
            console.log(`📥 Loading messages for room: ${currentRoom}`);

            const data = await messageAPI.getMessages(
                { room: currentRoom, limit: 50 },
                token
            );

            console.log(`✅ Loaded ${data.messages?.length || 0} messages`, data.messages);
            setMessages(data.messages || []);
        } catch (error) {
            console.error('❌ Error loading messages:', error);
            setMessages([]); // ✅ Очищаем при ошибке
        } finally {
            setLoading(false);
        }
    }, [currentRoom, token]); // ✅ ДОБАВЛЕНЫ зависимости

    // ✅ ИСПРАВЛЕНО: Загрузка при смене комнаты
    useEffect(() => {
        loadMessages();
    }, [loadMessages]); // ✅ Теперь loadMessages в зависимостях

    // ✅ ИСПРАВЛЕНО: Мемоизированные обработчики Socket
    const handleNewMessage = useCallback((message) => {
        console.log('📨 New message received:', message);

        setMessages((prev) => {
            // ✅ Проверяем дубликаты по _id
            const exists = prev.some(m => m._id === message._id);
            if (exists) {
                console.log('⚠️ Duplicate message ignored');
                return prev;
            }
            return [...prev, message];
        });
    }, []); // ✅ Нет зависимостей - стабильная функция

    const handleTyping = useCallback((data) => {
        if (data.userId !== user?.id && data.userId !== user?._id) {
            setTypingUsers((prev) => {
                // ✅ Проверяем дубликаты
                if (prev.some(u => u.userId === data.userId)) {
                    return prev;
                }
                return [...prev, data];
            });

            // ✅ Авто-удаление через 3 секунды
            setTimeout(() => {
                setTypingUsers((prev) =>
                    prev.filter((u) => u.userId !== data.userId)
                );
            }, 3000);
        }
    }, [user]); // ✅ ДОБАВЛЕНО: user в зависимостях

    const handleStopTyping = useCallback((data) => {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    }, []);

    // ✅ ИСПРАВЛЕНО: Правильная подписка на события Socket
    useEffect(() => {
        if (!socket) return;

        console.log('🔌 Subscribing to socket events');

        socket.on('message:receive', handleNewMessage);
        socket.on('message:sent', handleNewMessage); // ✅ Для отправителя
        socket.on('typing:user', handleTyping);
        socket.on('typing:stop', handleStopTyping);

        // ✅ Обработка ошибок
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
    // ✅ ВСЕ обработчики в зависимостях

    // ✅ ИСПРАВЛЕНО: Автоскролл
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // ✅ УПРОЩЕНО: Отправка только через Socket (БД обрабатывает сервер)
    const handleSendMessage = useCallback((content) => {
        if (!content.trim()) return;

        console.log(`📤 Sending message to room: ${currentRoom}`);

        const messageData = {
            room: currentRoom,
            content: content.trim(),
            type: 'text',
        };

        sendMessage(messageData);
    }, [currentRoom, sendMessage]); // ✅ ДОБАВЛЕНЫ зависимости

    // ✅ ИСПРАВЛЕНО: Смена комнаты с очисткой состояния
    const handleRoomChange = useCallback((room) => {
        console.log(`🚪 Changing room from ${currentRoom} to ${room}`);

        setCurrentRoom(room);
        setMessages([]); // ✅ Очищаем старые сообщения
        setTypingUsers([]); // ✅ Очищаем typing
        joinRoom(room);
    }, [currentRoom, joinRoom]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="chat-container">
            <LeftSidebar handleLogout={handleLogout} />
            <ChatSidebar
                currentRoom={currentRoom}
                onRoomChange={handleRoomChange}
            />

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
        </div>
    );
};

export default Chat;