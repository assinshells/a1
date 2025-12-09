const API_BASE_URL = "/api";

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "API Error");
  }

  return data.data || data;
}

export const authAPI = {
  register: (username, email, password) =>
    fetchAPI("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username,
        email,
        password,
        confirmPassword: password,
      }),
    }),

  login: (email, password) =>
    fetchAPI("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: (token) =>
    fetchAPI("/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }),

  getMe: (token) =>
    fetchAPI("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateProfile: (updates, token) =>
    fetchAPI("/auth/profile", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    }),

  changePassword: (currentPassword, newPassword, token) =>
    fetchAPI("/auth/change-password", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword: newPassword,
      }),
    }),
};

export const messageAPI = {
  getMessages: (params, token) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/messages${query ? `?${query}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  createMessage: (message, token) =>
    fetchAPI("/messages", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(message),
    }),

  editMessage: (id, content, token) =>
    fetchAPI(`/messages/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content }),
    }),

  deleteMessage: (id, token) =>
    fetchAPI(`/messages/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),

  markAsRead: (id, token) =>
    fetchAPI(`/messages/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export const api = {
  healthCheck: () => fetchAPI("/health"),
  getInfo: () => fetchAPI("/"),
};
