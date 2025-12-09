import { formatDistanceToNow } from '../utils/dateUtils';

const MessageList = ({ messages, currentUser }) => {
    const formatTime = (date) => {
        return formatDistanceToNow(new Date(date));
    };

    const isOwnMessage = (message) => {
        return message.sender?.id === currentUser?.id ||
            message.sender?._id === currentUser?.id ||
            message.sender === currentUser?.id;
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
            {messages.map((message, index) => (
                <div
                    key={message._id || index}
                    className={`message ${isOwnMessage(message) ? 'message-own' : 'message-other'}`}
                >
                    {!isOwnMessage(message) && (
                        <div className="message-avatar">
                            {message.sender?.avatar ? (
                                <img src={message.sender.avatar} alt={message.sender?.username} />
                            ) : (
                                <i className="bi bi-person-circle"></i>
                            )}
                        </div>
                    )}

                    <div className="message-content">
                        {!isOwnMessage(message) && (
                            <div className="message-author">
                                {message.sender?.username || message.senderUsername || 'Anonymous'}
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
                            {formatTime(message.createdAt || message.timestamp)}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MessageList;