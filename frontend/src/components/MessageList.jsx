import { memo } from 'react'; // ✅ ОПТИМИЗАЦИЯ
import { formatDistanceToNow } from '../utils/dateUtils';

const MessageList = memo(({ messages, currentUser }) => {
    const formatTime = (date) => {
        return formatDistanceToNow(new Date(date));
    };

    // ✅ ИСПРАВЛЕНО: Унифицированная проверка отправителя
    const isOwnMessage = (message) => {
        const currentUserId = currentUser?.id || currentUser?._id;
        const senderId = message.sender?.id || message.sender?._id || message.sender;

        return currentUserId && senderId &&
            currentUserId.toString() === senderId.toString();
    };

    // ✅ ИСПРАВЛЕНО: Безопасное получение username
    const getSenderUsername = (message) => {
        return message.sender?.username ||
            message.senderUsername ||
            'Anonymous';
    };

    if (messages.length === 0) {
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
                // ✅ ИСПРАВЛЕНО: Уникальный key (предпочтение _id)
                const messageKey = message._id || `msg-${index}-${message.timestamp}`;
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
                                {formatTime(
                                    message.createdAt ||
                                    message.timestamp ||
                                    new Date()
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

MessageList.displayName = 'MessageList'; // ✅ Для React DevTools

export default MessageList;