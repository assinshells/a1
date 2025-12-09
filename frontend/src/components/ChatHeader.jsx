const ChatHeader = ({ room, connected }) => {
    const getRoomName = (roomId) => {
        const rooms = {
            general: 'Общий',
            random: 'Случайное',
            tech: 'Технологии',
            games: 'Игры',
        };
        return rooms[roomId] || roomId;
    };

    const getRoomIcon = (roomId) => {
        const icons = {
            general: 'bi-chat-dots',
            random: 'bi-dice-3',
            tech: 'bi-code-slash',
            games: 'bi-controller',
        };
        return icons[roomId] || 'bi-chat-dots';
    };

    return (
        <div className="chat-header">
            <div className="d-flex align-items-center">
                <i className={`bi ${getRoomIcon(room)} fs-4 me-2`}></i>
                <div>
                    <h5 className="mb-0">{getRoomName(room)}</h5>
                    <small className="text-muted">
                        {connected ? (
                            <>
                                <i className="bi bi-circle-fill text-success me-1"></i>
                                Подключено
                            </>
                        ) : (
                            <>
                                <i className="bi bi-circle-fill text-danger me-1"></i>
                                Отключено
                            </>
                        )}
                    </small>
                </div>
            </div>
        </div>
    );
};

export default ChatHeader;