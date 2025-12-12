// frontend/src/contexts/SocketContext.jsx
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getDefaultRoom, isValidRoom } from '../config/rooms';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [activeUsers, setActiveUsers] = useState([]);
    const { token, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated && token) {
            const newSocket = io('http://localhost:5000', {
                auth: { token },
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
            });

            newSocket.on('connect', () => {
                console.log('✅ Socket connected');
                setConnected(true);
                
                // ✅ НОВОЕ: Автоматически присоединяемся к сохранённой комнате
                const savedRoom = localStorage.getItem('selectedRoom');
                const roomToJoin = (savedRoom && isValidRoom(savedRoom)) 
                    ? savedRoom 
                    : getDefaultRoom().id;
                
                console.log(`🚪 Auto-joining room: ${roomToJoin}`);
                newSocket.emit('room:join', roomToJoin);
            });

            newSocket.on('disconnect', () => {
                console.log('❌ Socket disconnected');
                setConnected(false);
            });

            newSocket.on('connected', (data) => {
                console.log('📊 Connected data:', data);
                setActiveUsers(data.activeUsers || []);
            });

            // ✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Слушаем ТОЛЬКО stats:update
            newSocket.on('stats:update', (data) => {
                console.log('📊 Stats update received:', data);
                
                // Обновляем список активных пользователей при необходимости
                if (data.event === 'user:online' && data.userId && data.username) {
                    setActiveUsers((prev) => {
                        if (prev.some(u => u.userId === data.userId)) {
                            return prev;
                        }
                        return [...prev, { userId: data.userId, username: data.username }];
                    });
                } else if (data.event === 'user:offline' && data.userId) {
                    setActiveUsers((prev) => prev.filter((u) => u.userId !== data.userId));
                }
            });

            setSocket(newSocket);

            return () => {
                console.log('🔌 Closing socket connection');
                newSocket.close();
            };
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
                setConnected(false);
            }
        }
    }, [isAuthenticated, token]);

    const sendMessage = useCallback((data) => {
        if (socket && connected) {
            socket.emit('message:send', data);
        }
    }, [socket, connected]);

    const joinRoom = useCallback((roomName) => {
        if (socket && connected) {
            console.log(`🚪 Joining room: ${roomName}`);
            socket.emit('room:join', roomName);
        }
    }, [socket, connected]);

    const leaveRoom = useCallback((roomName) => {
        if (socket && connected) {
            console.log(`🚪 Leaving room: ${roomName}`);
            socket.emit('room:leave', roomName);
        }
    }, [socket, connected]);

    const startTyping = useCallback((data) => {
        if (socket && connected) {
            socket.emit('typing:start', data);
        }
    }, [socket, connected]);

    const stopTyping = useCallback((data) => {
        if (socket && connected) {
            socket.emit('typing:stop', data);
        }
    }, [socket, connected]);

    const value = useMemo(() => ({
        socket,
        connected,
        activeUsers,
        sendMessage,
        joinRoom,
        leaveRoom,
        startTyping,
        stopTyping,
    }), [socket, connected, activeUsers, sendMessage, joinRoom, leaveRoom, startTyping, stopTyping]);

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};