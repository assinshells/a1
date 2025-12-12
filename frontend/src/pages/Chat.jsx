// frontend/src/pages/Chat.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { messageAPI } from '../services/api';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import ChatHeader from '../components/ChatHeader';
import { getDefaultRoom, isValidRoom } from '../config/rooms';

const Chat = () => {
    const [searchParams] = useSearchParams();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // ✅ ИСПРАВЛЕНО: Читаем комнату из URL или localStorage
    const getInitialRoom = () => {
        const urlRoom = searchParams.get('room');
        const savedRoom = localStorage.getItem('selectedRoom');
        
        if (urlRoom && isValidRoom(urlRoom)) {
            return urlRoom;
        }
        if (savedRoom && isValidRoom(savedRoom)) {
            return savedRoom;
        }
        return getDefaultRoom().id;
    };
    
    const [currentRoom, setCurrentRoom] = useState(getInitialRoom);
    const [typingUsers, setTypingUsers] = useState([]);
    const [roomStats, setRoomStats] = useState({});
    const [totalOnline, setTotalOnline] = useState(0);
    
    const { user, token, logout } = useAuth();
    const { socket, connected, sendMessage, joinRoom, leaveRoom } = useSocket();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const loadingAbortRef = useRef(null);
    const currentRoomRef = useRef(currentRoom);

    // ✅ Синхронизация ref с state
    useEffect(() => {
        currentRoomRef.current = currentRoom;
        // ✅ НОВОЕ: Обновляем URL при смене комнаты
        navigate(`/chat?room=${currentRoom}`, { replace: true });
        // ✅ НОВОЕ: Сохраняем в localStorage
        localStorage.setItem('selectedRoom', currentRoom);
    }, [currentRoom, navigate]);

    // ✅ Загрузка сообщений
    const loadMessages = useCallback(async (room, abortSignal) => {
        if (!token || !room) return;

        try {
            setLoading(true);
            console.log(`📥 Loading messages for room: ${room}`);

            const data = await messageAPI.getMessages({ room, limit: 50 }, token);

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

    // ✅ Смена комнаты
    useEffect(() => {
        if (loadingAbortRef.current) {
            loadingAbortRef.current.abort();
        }

        const abortController = new AbortController();
        loadingAbortRef.current = abortController;

        setMessages([]);
        setTypingUsers([]);

        loadMessages(currentRoom, abortController.signal);

        return () => {
            abortController.abort();
        };
    }, [currentRoom, loadMessages]);

    // ✅ Обработка новых сообщений
    const handleNewMessage = useCallback((message) => {
        console.log('📨 New message received:', message);

        if (message.room !== currentRoomRef.current) {
            console.log(`⚠️ Message for room ${message.room}, current is ${currentRoomRef.current}`);
            return;
        }

        setMessages((prev) => {
            if (message._id && prev.some(m => m._id === message._id)) {
                console.log('⚠️ Duplicate message ignored');
                return prev;
            }
            return [...prev, message];
        });
    }, []);

    // ✅ Обработка typing
    const handleTyping = useCallback((data) => {
        if (data.userId !== user?.id && data.userId !== user?._id) {
            setTypingUsers((prev) => {
                if (prev.some(u => u.userId === data.userId)) return prev;
                return [...prev, data];
            });

            setTimeout(() => {
                setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
            }, 3000);
        }
    }, [user]);

    const handleStopTyping = useCallback((data) => {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    }, []);

    // ✅ Обработка статистики
    const handleUserStats = useCallback((data) => {
        console.log('📊 Stats update:', data);
        
        if (data.totalOnline !== undefined) {
            setTotalOnline(data.totalOnline);
        }
        if (data.roomStats) {
            setRoomStats(data.roomStats);
            console.log('📊 Updated room stats:', data.roomStats);
        }
    }, []);

    // ✅ Socket события
    useEffect(() => {
        if (!socket) return;

        console.log('🔌 Subscribing to socket events');

        socket.on('message:receive', handleNewMessage);
        socket.on('typing:user', handleTyping);
        socket.on('typing:stop', handleStopTyping);
        
        // ✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Единое событие для всех обновлений статистики
        socket.on('connected', handleUserStats);
        socket.on('stats:update', handleUserStats);

        socket.on('message:error', (error) => {
            console.error('❌ Socket message error:', error);
            alert(`Failed to send message: ${error.details || error.error}`);
        });

        return () => {
            console.log('🔌 Unsubscribing from socket events');
            socket.off('message:receive', handleNewMessage);
            socket.off('typing:user', handleTyping);
            socket.off('typing:stop', handleStopTyping);
            socket.off('connected', handleUserStats);
            socket.off('stats:update', handleUserStats);
            socket.off('message:error');
        };
    }, [socket, handleNewMessage, handleTyping, handleStopTyping, handleUserStats]);

    // ✅ Автоскролл
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ✅ Отправка сообщений
    const handleSendMessage = useCallback((content) => {
        if (!content.trim()) return;

        console.log(`📤 Sending message to room: ${currentRoom}`);

        sendMessage({
            room: currentRoom,
            content: content.trim(),
            type: 'text',
        });
    }, [currentRoom, sendMessage]);

    // ✅ Смена комнаты
    const handleRoomChange = useCallback((room) => {
        if (room === currentRoom) return;

        console.log(`🚪 Changing room from ${currentRoom} to ${room}`);

        if (currentRoom !== 'general') {
            leaveRoom(currentRoom);
        }

        joinRoom(room);
        setCurrentRoom(room);
    }, [currentRoom, joinRoom, leaveRoom]);

    const handleLogout = async () => {
        localStorage.removeItem('selectedRoom');
        await logout();
        navigate('/login');
    };

    return (
        <div className="chat-container">
            <LeftSidebar handleLogout={handleLogout} />

            <div className="chat-main">
                <ChatHeader 
                    room={currentRoom} 
                    connected={connected}
                    totalOnline={totalOnline}
                    roomCount={roomStats[currentRoom] || 0}
                />

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
                roomStats={roomStats}
                totalOnline={totalOnline}
            />
        </div>
    );
};

export default Chat;