import { body, validationResult } from "express-validator";
import logEvent from "../logger.js";

export const validateEditUser = [
    body("email")
    .trim()
    .notEmpty().withMessage("Email is required.").bail()
    .matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/).withMessage("Please provide a valid email address."),

    body("username")
    .trim()
    .notEmpty().withMessage("Username is required.").bail()
    .matches(/^[A-Za-zÀ-ÿ'\-.\s]{1,127}$/).withMessage("Invalid username."), 

    body("full_name")
    .trim()
    .notEmpty().withMessage("Full name is required.").bail() 
    .matches(/^[A-Za-zÀ-ÿ'\-.\s]{1,255}$/).withMessage("Invalid full name."),

    body("phone")
    .trim()
    .notEmpty().withMessage("Phone number is required.").bail()
    .matches(/^(09|\+639)\d{9}$/).withMessage("Please provide a valid phone number."),

  (req, res, next) => {
    let errorMessages = [];

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errorMessages.push(...errors.array().map((error) => error.msg));
    }

    if (errorMessages.length > 0) {
      const errorLog = {
        username: req.user?.username || "Guest",
        route: req.originalUrl,
        action: "Edit User - Validation Failed",
        status: "Failed",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        errorDetails: errorMessages.join(" | "),
      };

      logEvent(errorLog);

      return res.status(400).json({
        message: errorMessages.join("\n"),
        errors: errorMessages,
      });
    }

    next();
  },
];
