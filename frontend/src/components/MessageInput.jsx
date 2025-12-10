import { useState, useRef, useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';

const MessageInput = ({ onSendMessage, currentRoom = 'general' }) => {
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const { startTyping, stopTyping } = useSocket();

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // ✅ ОПТИМИЗИРОВАНО: Дебаунсинг для typing события
    const handleTypingStart = useCallback(() => {
        if (!isTyping) {
            setIsTyping(true);
            startTyping({ room: currentRoom });
        }
    }, [isTyping, startTyping, currentRoom]);

    const handleTypingStop = useCallback(() => {
        setIsTyping(false);
        stopTyping({ room: currentRoom });
    }, [stopTyping, currentRoom]);

    const handleChange = (e) => {
        const newValue = e.target.value;
        setMessage(newValue);

        // ✅ ОПТИМИЗИРОВАНО: Отправляем typing только если есть текст
        if (newValue.trim()) {
            handleTypingStart();

            // Сбрасываем таймер
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Устанавливаем новый таймер на остановку typing
            typingTimeoutRef.current = setTimeout(() => {
                handleTypingStop();
            }, 1000);
        } else {
            // Если поле пустое, останавливаем typing сразу
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            handleTypingStop();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const trimmedMessage = message.trim();
        if (trimmedMessage) {
            onSendMessage(trimmedMessage);
            setMessage('');
            handleTypingStop();

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    // ✅ ОПТИМИЗИРОВАНО: Очистка таймера при размонтировании
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (isTyping) {
                stopTyping({ room: currentRoom });
            }
        };
    }, [isTyping, stopTyping, currentRoom]);

    return (
        <div className="chat-input">
            <form onSubmit={handleSubmit} className="d-flex gap-2">
                <button
                    type="button"
                    className="btn btn-light btn-icon"
                    title="Прикрепить файл"
                >
                    <i className="bi bi-paperclip"></i>
                </button>

                <div className="input-wrapper flex-grow-1">
                    <input
                        ref={inputRef}
                        type="text"
                        className="form-control"
                        placeholder="Введите сообщение..."
                        value={message}
                        onChange={handleChange}
                        onKeyPress={handleKeyPress}
                        maxLength={2000}
                    />
                </div>

                <button
                    type="button"
                    className="btn btn-light btn-icon"
                    title="Эмодзи"
                >
                    <i className="bi bi-emoji-smile"></i>
                </button>

                <button
                    type="submit"
                    className="btn btn-primary btn-icon"
                    disabled={!message.trim()}
                >
                    <i className="bi bi-send-fill"></i>
                </button>
            </form>
        </div>
    );
};

export default MessageInput;