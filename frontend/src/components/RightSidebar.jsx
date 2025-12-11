import { useSocket } from '../contexts/SocketContext';
import ROOMS from '../config/rooms';

const RightSidebar = ({ currentRoom, onRoomChange }) => {
    const { activeUsers, connected } = useSocket();

    return (
        <div className="chat-rightsidebar flex-lg-column me-lg-1 ms-lg-0">
            <div className="flex-lg-column my-auto">
                <span className="section-title">В чаті: 173</span>
                <div className="rooms-list">
                    {ROOMS.map((room) => (
                        <button
                            key={room.id}
                            className={`btn btn-link btn-sm room-item ${currentRoom === room.id ? 'active' : ''}`}
                            onClick={() => onRoomChange(room.id)}
                        >
                            <span>{room.name} (1)</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="sidebar-section">
                <h6 className="section-title">
                    ОНЛАЙН ({activeUsers.length})
                </h6>
                <div className="users-list">
                    {activeUsers.map((u) => (
                        <div key={u.userId} className="user-item">
                            <span>{u.username}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RightSidebar;