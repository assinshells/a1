import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';

const ChatSidebar = ({ currentRoom, onRoomChange }) => {
    const [showProfile, setShowProfile] = useState(false);
    const { user, logout } = useAuth();
    const { activeUsers, connected } = useSocket();
    const navigate = useNavigate();

    const rooms = [
        { id: 'general', name: 'Общий', icon: 'bi-chat-dots' },
        { id: 'random', name: 'Случайное', icon: 'bi-dice-3' },
        { id: 'tech', name: 'Технологии', icon: 'bi-code-slash' },
        { id: 'games', name: 'Игры', icon: 'bi-controller' },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="chat-sidebar">
            <div className="sidebar-header">
                <div className="d-flex align-items-center">
                    <i className="bi bi-chat-dots-fill text-primary fs-3 me-2"></i>
                    <h5 className="mb-0">Chat App</h5>
                </div>
                <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
                    <i className={`bi ${connected ? 'bi-circle-fill' : 'bi-circle'}`}></i>
                </div>
            </div>

            <div className="user-profile" onClick={() => setShowProfile(!showProfile)}>
                <div className="d-flex align-items-center">
                    <div className="user-avatar">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.username} />
                        ) : (
                            <i className="bi bi-person-circle"></i>
                        )}
                    </div>
                    <div className="user-info">
                        <div className="user-name">{user?.username}</div>
                        <div className="user-status">
                            <i className="bi bi-circle-fill text-success"></i>
                            <span>В сети</span>
                        </div>
                    </div>
                </div>
                <i className={`bi bi-chevron-${showProfile ? 'up' : 'down'}`}></i>
            </div>

            {showProfile && (
                <div className="profile-menu">
                    <button className="profile-menu-item">
                        <i className="bi bi-gear"></i>
                        Настройки
                    </button>
                    <button className="profile-menu-item text-danger" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right"></i>
                        Выйти
                    </button>
                </div>
            )}

            <div className="sidebar-section">
                <h6 className="section-title">КОМНАТЫ</h6>
                <div className="rooms-list">
                    {rooms.map((room) => (
                        <button
                            key={room.id}
                            className={`room-item ${currentRoom === room.id ? 'active' : ''}`}
                            onClick={() => onRoomChange(room.id)}
                        >
                            <i className={`bi ${room.icon}`}></i>
                            <span>{room.name}</span>
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
                            <div className="user-avatar-small">
                                <i className="bi bi-person-circle"></i>
                            </div>
                            <span>{u.username}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChatSidebar;