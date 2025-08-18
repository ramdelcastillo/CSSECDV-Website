import { body, validationResult } from "express-validator";
import logEvent from "../logger.js";

export const validatePhoneNumberUpdate = [
  body("phone")
    .trim()
    .notEmpty().withMessage("Phone number is required.").bail()
    .matches(/^(09|\+639)\d{9}$/).withMessage("Please provide a valid phone number."),

  async (req, res, next) => {
    let errorMessages = [];
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      errorMessages.push(...errors.array().map((error) => error.msg));
    }

    if (errorMessages.length > 0) {
      const errorLog = {
        username: req.user?.username || "Guest",
        role: req.user?.role,
        route: req.originalUrl,
        action: "Update Phone Number - Validation Failed",
        status: "Failed",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        errorDetails: errorMessages.join(" | "),
      };

      await logEvent(errorLog);

      return res.status(400).json({
        message: errorMessages.join("\n"),
        errors: errorMessages,
      });
    }

    next();
  },
];
