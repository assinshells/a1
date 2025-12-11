import { useSocket } from '../contexts/SocketContext';
import ROOMS from '../config/rooms';

const RightSidebar = ({ currentRoom, onRoomChange, roomStats = {}, totalOnline = 0 }) => {
    const { activeUsers } = useSocket();

    return (
        <div className="chat-rightsidebar flex-lg-column me-lg-1 ms-lg-0">
            {/* ✅ Общая статистика */}
            <div className="sidebar-section p-3">
                <h6 className="section-title mb-3">
                    <i className="bi bi-globe me-2"></i>
                    В чате: {totalOnline}
                </h6>
                
                {/* ✅ Список комнат со счётчиками */}
                <div className="rooms-list">
                    {ROOMS.map((room) => {
                        const count = roomStats[room.id] || 0;
                        const isActive = currentRoom === room.id;
                        
                        return (
                            <button
                                key={room.id}
                                className={`btn btn-link btn-sm room-item w-100 text-start d-flex align-items-center justify-content-between ${
                                    isActive ? 'active' : ''
                                }`}
                                onClick={() => onRoomChange(room.id)}
                            >
                                <div className="d-flex align-items-center">
                                    <i 
                                        className={`bi ${room.icon} me-2`}
                                        style={{ color: isActive ? '#06e023' : room.color }}
                                    ></i>
                                    <span>{room.name}</span>
                                </div>
                                <span className="badge bg-secondary rounded-pill">
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ✅ ОНЛАЙН пользователи */}
            <div className="sidebar-section p-3 border-top">
                <h6 className="section-title mb-3">
                    <i className="bi bi-people-fill me-2"></i>
                    ОНЛАЙН ({activeUsers.length})
                </h6>
                <div className="users-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {activeUsers.length === 0 ? (
                        <p className="text-muted small">Нет пользователей онлайн</p>
                    ) : (
                        activeUsers.map((u) => (
                            <div key={u.userId} className="user-item d-flex align-items-center mb-2">
                                <i className="bi bi-circle-fill text-success me-2" style={{ fontSize: '8px' }}></i>
                                <span>{u.username}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default RightSidebar;