// backend/src/middleware/validate.js
import { appLogger } from "../config/logger.js";

/**
 * Middleware для валидации данных с использованием Joi схем
 * @param {Object} schema - Joi схема для валидации
 * @param {String} source - Источник данных ('body', 'query', 'params')
 */
export const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const dataToValidate = req[source];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Возвращать все ошибки
      stripUnknown: true, // Удалять неизвестные поля
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      appLogger.warn(
        {
          errors,
          source,
          data: dataToValidate,
        },
        "Validation error"
      );

      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    // ✅ ИСПРАВЛЕНО: Специальная обработка для req.query (readonly в Express 5.x)
    if (source === "query") {
      // Вместо перезаписи req.query, создаём новое свойство
      req.validatedQuery = value;

      // Опционально: логируем предупреждение если данные были изменены
      if (JSON.stringify(dataToValidate) !== JSON.stringify(value)) {
        appLogger.debug(
          {
            original: dataToValidate,
            validated: value,
          },
          "Query parameters were sanitized"
        );
      }
    } else {
      // ✅ Для body и params работает как раньше
      req[source] = value;
    }

    next();
  };
};

export default validate;
