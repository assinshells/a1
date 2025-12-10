import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

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
                console.log('Socket connected');
                setConnected(true);
            });

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected');
                setConnected(false);
            });

            newSocket.on('connected', (data) => {
                console.log('Connected data:', data);
                setActiveUsers(data.activeUsers);
            });

            newSocket.on('user:online', (data) => {
                setActiveUsers((prev) => [...prev, data]);
            });

            newSocket.on('user:offline', (data) => {
                setActiveUsers((prev) => prev.filter((u) => u.userId !== data.userId));
            });

            setSocket(newSocket);

            return () => {
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

    // ✅ ОПТИМИЗИРОВАНО: Мемоизированные функции
    const sendMessage = useCallback((data) => {
        if (socket && connected) {
            socket.emit('message:send', data);
        }
    }, [socket, connected]);

    const joinRoom = useCallback((roomName) => {
        if (socket && connected) {
            socket.emit('room:join', roomName);
        }
    }, [socket, connected]);

    const leaveRoom = useCallback((roomName) => {
        if (socket && connected) {
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

    // ✅ ОПТИМИЗИРОВАНО: Мемоизированное значение контекста
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