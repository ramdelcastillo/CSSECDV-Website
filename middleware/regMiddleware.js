import { body, validationResult } from "express-validator";
import logEvent from "../logger.js";

export const validateRegistration = [
  body("first_name")
    .trim()
    .notEmpty().withMessage("First name is required.").bail() 
    .matches(/^[A-Za-zÀ-ÿ'\-.\s]{1,127}$/).withMessage("Invalid first name."),

  body("last_name")
    .trim()
    .notEmpty().withMessage("Last name is required.").bail()
    .matches(/^[A-Za-zÀ-ÿ'\-.\s]{1,127}$/).withMessage("Invalid last name."),

  body("username")
    .trim()
    .notEmpty().withMessage("Username is required.").bail()
    .matches(/^[A-Za-zÀ-ÿ'\-.\s]{1,127}$/).withMessage("Invalid username."), 

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required.").bail()
    .matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/).withMessage("Please provide a valid email address."),

  body("phone")
    .trim()
    .notEmpty().withMessage("Phone number is required.").bail()
    .matches(/^(09|\+639)\d{9}$/).withMessage("Please provide a valid phone number."),

  body("password")
    .trim()
    .notEmpty().withMessage("Password is required.").bail()
    .isLength({ min: 8, max: 16 }).withMessage("Password must be between 8-16 characters.")
    .matches(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,16}$/)
    .withMessage("Password must include at least one number, one lowercase letter, one uppercase letter, and one special character."),

  body("confirm_password")
    .trim()
    .notEmpty().withMessage("Confirm password is required.").bail()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match.");
      }
      return true;
    }),

  (req, res, next) => {
    let errorMessages = [];

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errorMessages.push(...errors.array().map((error) => error.msg));
    }

    if (req.file) {
      const buffer = req.file.buffer;
      const bytes = new Uint8Array(buffer);

      if (!isValidImage(bytes)) {
        errorMessages.push("Invalid file type.");
      }
    }

    if (errorMessages.length > 0) {
      const errorLog = {
        username: "Guest",
        route: req.originalUrl,
        action: "User Registration - Validation Failed",
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

function isValidImage(bytes) {
  const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  const jpgSignature = [0xFF, 0xD8, 0xFF];

  return matchesSignature(bytes, pngSignature) || matchesSignature(bytes.slice(0, 3), jpgSignature);
}

function matchesSignature(bytes, signature) {
  return signature.every((byte, i) => bytes[i] === byte);
}
