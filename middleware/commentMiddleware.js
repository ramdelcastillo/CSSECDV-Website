import { body, validationResult } from "express-validator";
import sanitizeHtml from "sanitize-html";
import logEvent from "../logger.js"; 

export const validateComment = [
  body("content")
    .trim()
    .notEmpty().withMessage("Content is required.")
    .customSanitizer((value) => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })) // Strip all HTML
    .escape()
    .isLength({ min: 1 }).withMessage("Comment must be at least 1 character."),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);

      // Log the validation failure
      const errorLog = {
        username: req.user?.username || "Guest",
        role: req.user?.role,
        route: req.originalUrl,
        action: "Create Comment - Validation Failed",
        status: "Failed",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        errorDetails: errorMessages.join(" | "),
      };

      logEvent(errorLog);

      return res.status(400).json({
        message: errorMessages.join("\n"),
        errors: errors.array(),
      });
    }
    next();
  },
];