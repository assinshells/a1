import ROOMS, { getRoomName, getRoomIcon, getRoomColor } from '../config/rooms';

const ChatHeader = ({ room, connected, totalOnline = 0, roomCount = 0 }) => {
    const roomData = ROOMS.find(r => r.id === room);
    const roomName = roomData?.name || room;
    const roomIcon = roomData?.icon || 'bi-chat-dots';
    const roomColor = roomData?.color || '#3498db';

    return (
        <div className="chat-header">
            <div className="d-flex align-items-center justify-content-between w-100">
                {/* ✅ Информация о комнате */}
                <div className="d-flex align-items-center">
                    <i 
                        className={`bi ${roomIcon} fs-4 me-2`}
                        style={{ color: roomColor }}
                    ></i>
                    <div>
                        <h5 className="mb-0">{roomName}</h5>
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

                {/* ✅ НОВОЕ: Статистика комнаты */}
                <div className="d-flex align-items-center gap-3">
                    <div className="text-center">
                        <small className="text-muted d-block">В комнате</small>
                        <strong className="fs-5">{roomCount}</strong>
                    </div>
                    <div className="text-center">
                        <small className="text-muted d-block">Всего онлайн</small>
                        <strong className="fs-5" style={{ color: '#06e023' }}>
                            {totalOnline}
                        </strong>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatHeader;