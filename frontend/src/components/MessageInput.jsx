import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';

const MessageInput = ({ onSendMessage }) => {
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const { startTyping, stopTyping } = useSocket();

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleChange = (e) => {
        setMessage(e.target.value);

        if (!isTyping) {
            setIsTyping(true);
            startTyping({ room: 'general' });
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            stopTyping({ room: 'general' });
        }, 1000);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (message.trim()) {
            onSendMessage(message.trim());
            setMessage('');
            setIsTyping(false);
            stopTyping({ room: 'general' });

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