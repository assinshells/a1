import Joi from "joi";

// Схема регистрации (email теперь опционален)
export const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).alphanum().required().messages({
    "string.min": "Username must be at least 3 characters",
    "string.max": "Username cannot exceed 30 characters",
    "string.alphanum": "Username must contain only letters and numbers",
    "any.required": "Username is required",
  }),
  email: Joi.string().email().optional().allow("").messages({
    "string.email": "Please provide a valid email",
  }),
  password: Joi.string().min(6).max(128).required().messages({
    "string.min": "Password must be at least 6 characters",
    "string.max": "Password cannot exceed 128 characters",
    "any.required": "Password is required",
  }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords must match",
    "any.required": "Password confirmation is required",
  }),
});

// Схема входа (можно использовать username или email)
export const loginSchema = Joi.object({
  login: Joi.string().required().messages({
    "any.required": "Username or email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

// Альтернативная схема входа (для совместимости)
export const loginSchemaLegacy = Joi.object({
  email: Joi.string().optional(),
  username: Joi.string().optional(),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
}).or("email", "username");

// Схема запроса на сброс пароля
export const forgotPasswordSchema = Joi.object({
  identifier: Joi.string().required().messages({
    "any.required": "Username or email is required",
  }),
});

// Схема сброса пароля
export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "Reset token is required",
  }),
  newPassword: Joi.string().min(6).max(128).required().messages({
    "string.min": "Password must be at least 6 characters",
    "string.max": "Password cannot exceed 128 characters",
    "any.required": "New password is required",
  }),
  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Passwords must match",
      "any.required": "Password confirmation is required",
    }),
});

// Схема обновления профиля
export const updateProfileSchema = Joi.object({
  username: Joi.string().min(3).max(30).alphanum().optional(),
  email: Joi.string().email().optional().allow(""),
  avatar: Joi.string().uri().optional().allow(null),
  status: Joi.string().valid("online", "offline", "away").optional(),
}).min(1);

// Схема смены пароля
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "any.required": "Current password is required",
  }),
  newPassword: Joi.string().min(6).max(128).required().messages({
    "string.min": "New password must be at least 6 characters",
    "string.max": "New password cannot exceed 128 characters",
    "any.required": "New password is required",
  }),
  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Passwords must match",
      "any.required": "Password confirmation is required",
    }),
});

// Схема создания сообщения
export const createMessageSchema = Joi.object({
  receiver: Joi.string().hex().length(24).optional().allow(null),
  room: Joi.string().min(1).max(50).optional(),
  content: Joi.string().min(1).max(2000).required().messages({
    "string.min": "Message cannot be empty",
    "string.max": "Message cannot exceed 2000 characters",
    "any.required": "Message content is required",
  }),
  type: Joi.string().valid("text", "image", "file").default("text"),
  attachments: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().uri().required(),
        filename: Joi.string().required(),
        mimetype: Joi.string().required(),
        size: Joi.number().positive().required(),
      })
    )
    .optional(),
});

// Схема редактирования сообщения
export const editMessageSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required().messages({
    "string.min": "Message cannot be empty",
    "string.max": "Message cannot exceed 2000 characters",
    "any.required": "Message content is required",
  }),
});

// Схема параметров получения сообщений
export const getMessagesSchema = Joi.object({
  targetId: Joi.string().hex().length(24).optional(),
  room: Joi.string().min(1).max(50).optional(),
  limit: Joi.number().integer().min(1).max(100).default(50),
  skip: Joi.number().integer().min(0).default(0),
}).or("targetId", "room");
