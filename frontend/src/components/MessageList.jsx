// frontend/src/components/MessageList.jsx
import { memo } from 'react';

const MessageList = memo(({ messages, currentUser }) => {
    // ✅ Форматирование времени: "14:32"
    const formatTime = (dateString) => {
        if (!dateString) return '';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';

            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        } catch {
            return '';
        }
    };

    // ✅ Безопасное получение username
    const getSenderUsername = (message) => {
        return message.sender?.username || 'Anonymous';
    };

    if (!messages || messages.length === 0) {
        return (
            <div className="empty-messages">
                <i className="bi bi-chat-dots text-muted" style={{ fontSize: '4rem' }}></i>
                <p className="text-muted mt-3">Пока нет сообщений</p>
                <p className="text-muted small">Будьте первым, кто напишет!</p>
            </div>
        );
    }

    return (
        <div className="message-list">
            {messages.map((message, index) => {
                const messageKey = message._id || `msg-${index}-${Date.now()}`;
                const time = formatTime(message.createdAt);
                const username = getSenderUsername(message);

                return (
                    <div key={messageKey} className="message-item">
                        {/* ✅ ФОРМАТ: время — пользователь — сообщение */}
                        <span className="message-time">{time}</span>
                        <span className="message-separator">  </span>
                        <span className="message-author">{username}</span>
                        <span className="message-separator">  </span>
                        <span className="message-text">{message.content}</span>

                        {message.isEdited && (
                            <span className="message-edited"> (изменено)</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
});

MessageList.displayName = 'MessageList';

export default MessageList;