// frontend/src/config/rooms.js

/**
 * Конфигурация доступных комнат чата
 * Легко добавлять/удалять комнаты из этого списка
 */
export const ROOMS = [
    {
        id: 'general',
        name: 'Общий',
        icon: 'bi-chat-dots',
        description: 'Основной чат для общения',
        color: '#3498db',
        default: true
    },
    {
        id: 'random',
        name: 'Случайное',
        icon: 'bi-dice-3',
        description: 'Обсуждаем всё подряд',
        color: '#9b59b6'
    },
    {
        id: 'tech',
        name: 'Технологии',
        icon: 'bi-code-slash',
        description: 'Программирование и IT',
        color: '#2ecc71'
    },
    {
        id: 'games',
        name: 'Игры',
        icon: 'bi-controller',
        description: 'Обсуждаем игры',
        color: '#e74c3c'
    }
];

/**
 * Получить комнату по умолчанию
 */
export const getDefaultRoom = () => {
    return ROOMS.find(room => room.default) || ROOMS[0];
};

/**
 * Получить комнату по ID
 */
export const getRoomById = (id) => {
    return ROOMS.find(room => room.id === id);
};

/**
 * Получить имя комнаты по ID
 */
export const getRoomName = (roomId) => {
    const room = getRoomById(roomId);
    return room ? room.name : roomId;
};

/**
 * Получить иконку комнаты по ID
 */
export const getRoomIcon = (roomId) => {
    const room = getRoomById(roomId);
    return room ? room.icon : 'bi-chat-dots';
};

/**
 * Получить цвет комнаты по ID
 */
export const getRoomColor = (roomId) => {
    const room = getRoomById(roomId);
    return room ? room.color : '#3498db';
};

/**
 * Валидация ID комнаты
 */
export const isValidRoom = (roomId) => {
    return ROOMS.some(room => room.id === roomId);
};

export default ROOMS;