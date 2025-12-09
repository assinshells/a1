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

    // Заменяем данные на валидированные и очищенные
    req[source] = value;
    next();
  };
};

export default validate;
