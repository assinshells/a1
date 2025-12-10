import { useState, useEffect, useRef } from 'react';
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

    useEffect(() => {
        loadMessages();
    }, [currentRoom]);

    useEffect(() => {
        if (socket) {
            socket.on('message:receive', handleNewMessage);
            socket.on('typing:user', handleTyping);
            socket.on('typing:stop', handleStopTyping);

            return () => {
                socket.off('message:receive');
                socket.off('typing:user');
                socket.off('typing:stop');
            };
        }
    }, [socket]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const data = await messageAPI.getMessages({ room: currentRoom, limit: 50 }, token);
            setMessages(data.messages || []);
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewMessage = (message) => {
        setMessages((prev) => [...prev, message]);
    };

    const handleTyping = (data) => {
        if (data.userId !== user.id) {
            setTypingUsers((prev) => [...prev, data]);
            setTimeout(() => {
                setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
            }, 3000);
        }
    };

    const handleStopTyping = (data) => {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    };

    const handleSendMessage = (content) => {
        const messageData = {
            room: currentRoom,
            content,
            type: 'text',
        };
        sendMessage(messageData);
    };

    const handleRoomChange = (room) => {
        setCurrentRoom(room);
        joinRoom(room);
    };

    // ✅ ИСПРАВЛЕНО: Добавлена функция handleLogout
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
            <ChatSidebar currentRoom={currentRoom} onRoomChange={handleRoomChange} />

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
                                    <span>{typingUsers[0].username} печатает...</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                <MessageInput onSendMessage={handleSendMessage} />
            </div>
        </div>
    );
};

export default Chat;