// frontend/src/components/auth/RoomSelector.jsx
import { useState } from 'react';
import ROOMS, { getDefaultRoom } from '../../config/rooms';

const RoomSelector = ({ selectedRoom, onRoomChange }) => {
    const [showRooms, setShowRooms] = useState(false);

    const handleRoomSelect = (roomId) => {
        onRoomChange(roomId);
        setShowRooms(false);
    };

    const selectedRoomData = ROOMS.find(r => r.id === selectedRoom) || getDefaultRoom();

    return (
        <div className="mb-3">
            <label className="form-label fw-bold">
                <i className="bi bi-door-open me-2"></i>
                Выберите комнату
            </label>
            
            {/* Кнопка для показа списка комнат */}
            <button
                type="button"
                className="btn btn-outline-primary w-100 text-start d-flex align-items-center justify-content-between"
                onClick={() => setShowRooms(!showRooms)}
            >
                <div className="d-flex align-items-center">
                    <i className={`bi ${selectedRoomData.icon} me-2`} style={{ color: selectedRoomData.color }}></i>
                    <div>
                        <div className="fw-bold">{selectedRoomData.name}</div>
                        <small className="text-muted">{selectedRoomData.description}</small>
                    </div>
                </div>
                <i className={`bi bi-chevron-${showRooms ? 'up' : 'down'}`}></i>
            </button>

            {/* Список комнат */}
            {showRooms && (
                <div className="mt-2 border rounded p-2">
                    {ROOMS.map((room) => (
                        <div
                            key={room.id}
                            className={`room-option p-2 rounded mb-1 cursor-pointer ${
                                selectedRoom === room.id ? 'bg-primary text-white' : 'hover-bg-light'
                            }`}
                            onClick={() => handleRoomSelect(room.id)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="d-flex align-items-center">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="room"
                                        id={`room-${room.id}`}
                                        checked={selectedRoom === room.id}
                                        onChange={() => handleRoomSelect(room.id)}
                                    />
                                </div>
                                <label
                                    className="ms-2 flex-grow-1 cursor-pointer"
                                    htmlFor={`room-${room.id}`}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="d-flex align-items-center">
                                        <i 
                                            className={`bi ${room.icon} me-2 fs-4`}
                                            style={{ 
                                                color: selectedRoom === room.id ? 'white' : room.color 
                                            }}
                                        ></i>
                                        <div>
                                            <div className="fw-bold">{room.name}</div>
                                            <small className={selectedRoom === room.id ? 'text-white-50' : 'text-muted'}>
                                                {room.description}
                                            </small>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .hover-bg-light:hover {
                    background-color: #f8f9fa;
                }
                .cursor-pointer {
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};

export default RoomSelector;