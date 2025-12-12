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
    <label className="form-label fw-bold">Выберите комнату</label>

    <div className="row mt-2">
        {ROOMS.map((room) => (
            <div className="col-12 col-md-4 mb-2" key={room.id}>
                <div 
                    className={`p-2 border rounded d-flex align-items-center ${
                        selectedRoom === room.id ? "bg-primary text-white" : ""
                    }`}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleRoomSelect(room.id)}
                >
                    <input
                        className="form-check-input me-2"
                        type="radio"
                        name="room"
                        id={`room-${room.id}`}
                        checked={selectedRoom === room.id}
                        onChange={() => handleRoomSelect(room.id)}
                    />

                    <label
                        htmlFor={`room-${room.id}`}
                        className="flex-grow-1"
                        style={{ cursor: "pointer" }}
                    >
                        {room.name}
                    </label>
                </div>
            </div>
        ))}
    </div>
</div>
    );
};

export default RoomSelector;