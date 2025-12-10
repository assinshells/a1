// frontend/src/components/MessageList.jsx
import { memo } from 'react';
import { formatDistanceToNow } from '../utils/dateUtils';

const MessageList = memo(({ messages, currentUser }) => {
    // ✅ ИСПРАВЛЕНО: Единый источник истины для времени
    const formatTime = (dateString) => {
        if (!dateString) return 'недавно';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'недавно';
            return formatDistanceToNow(date);
        } catch {
            return 'недавно';
        }
    };

    // ✅ ИСПРАВЛЕНО: Унифицированная проверка отправителя
    const isOwnMessage = (message) => {
        const currentUserId = currentUser?.id || currentUser?._id;
        const senderId = message.sender?.id || message.sender?._id || message.sender;

        if (!currentUserId || !senderId) return false;

        return currentUserId.toString() === senderId.toString();
    };

    // ✅ ИСПРАВЛЕНО: Безопасное получение username
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
                // ✅ ИСПРАВЛЕНО: Приоритет _id, затем комбинация
                const messageKey = message._id || `msg-${index}-${Date.now()}`;
                const isOwn = isOwnMessage(message);

                return (
                    <div
                        key={messageKey}
                        className={`message ${isOwn ? 'message-own' : 'message-other'}`}
                    >
                        {!isOwn && (
                            <div className="message-avatar">
                                {message.sender?.avatar ? (
                                    <img
                                        src={message.sender.avatar}
                                        alt={getSenderUsername(message)}
                                    />
                                ) : (
                                    <i className="bi bi-person-circle"></i>
                                )}
                            </div>
                        )}

                        <div className="message-content">
                            {!isOwn && (
                                <div className="message-author">
                                    {getSenderUsername(message)}
                                </div>
                            )}

                            <div className="message-bubble">
                                <p className="message-text">{message.content}</p>
                                {message.isEdited && (
                                    <span className="message-edited">
                                        <i className="bi bi-pencil-fill"></i> изменено
                                    </span>
                                )}
                            </div>

                            <div className="message-time">
                                {/* ✅ ТОЛЬКО createdAt */}
                                {formatTime(message.createdAt)}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

MessageList.displayName = 'MessageList';

export default MessageList;