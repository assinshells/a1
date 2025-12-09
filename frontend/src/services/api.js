/**
 * API Service для взаимодействия с backend
 */

const API_BASE_URL = "/api";

/**
 * Базовая функция для выполнения HTTP запросов
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Ошибка запроса");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

/**
 * API методы
 */
export const api = {
  // Health check
  healthCheck: () => fetchAPI("/health"),

  // Получить информацию об API
  getInfo: () => fetchAPI("/"),

  // Тестовый async запрос
  testAsync: () => fetchAPI("/test-async"),

  // Пример POST запроса
  createMessage: (message) =>
    fetchAPI("/messages", {
      method: "POST",
      body: JSON.stringify(message),
    }),

  // Пример GET запроса с параметрами
  getMessages: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchAPI(`/messages${queryString ? `?${queryString}` : ""}`);
  },
};

export default api;
