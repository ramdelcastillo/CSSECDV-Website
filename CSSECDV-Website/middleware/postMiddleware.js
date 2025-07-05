import { body, validationResult } from "express-validator";
import sanitizeHtml from "sanitize-html";
import logEvent from "../logger.js"; 

export const validatePost = [
  body("title")
    .trim()
    .notEmpty().withMessage("Title is required.")
    .isLength({ max: 255 }).withMessage("Title must be at most 255 characters.")
    .customSanitizer((value) => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })) 
    .escape(), 

  body("content")
    .trim()
    .notEmpty().withMessage("Content is required.")
    .customSanitizer((value) => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })) 
    .escape(), 

    body("commentLimit")
    .trim()
    .optional({ checkFalsy: true }) 
    .customSanitizer((value) => value.trim())
    .matches(/^\d+$/).withMessage("Comment limit must be a non-negative integer or blank."),

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
          errorMessages.push("Invalid file type");
        }
      }
  
      if (errorMessages.length > 0) {
        const errorLog = {
          username: req.user?.username || "Guest",
          role: req.user?.role,
          route: req.originalUrl,
          action: "Create Post - Validation Failed",
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