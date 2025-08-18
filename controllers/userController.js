import bcrypt from "bcryptjs";
import { createUser, findUserByEmail, updateUserPhoneNumber, hideUser, updateUserDetails, updateUserBanStatus } from "../models/userModel.js";
import { validateRegistration } from "../middleware/regMiddleware.js";
import { validateImageType } from "../middleware/fileUploadMiddleware.js";
import { validatePhoneNumberUpdate } from "../middleware/editPhoneNumberMiddleware.js"
import { validateEditUser } from "../middleware/editUserMiddlware.js";
import { queryDatabase } from "../db.js"; // Use the existing pool
import jwt from "jsonwebtoken"
import CryptoJS from "crypto-js";
import { encode } from "html-entities";
import dotenv from 'dotenv';
import logEvent from "../logger.js";
import stackTraceLogEvent from "../stackTraceLogger.js";

dotenv.config();

// Register User
export const registerUser = [
  validateRegistration,
  async (req, res) => {
    let logData = {
      username: "Guest",
      route: req.originalUrl,
      action: "Register User",
      status: "Failed",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    };
    try { //ADDED USERNAME
      const { first_name, last_name, username, email, phone, password } = req.body;
      const profile_image = req.file ? req.file.buffer : null; // Handle the file upload here

      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = await createUser(first_name, last_name, email, username, phone, profile_image, hashedPassword);

      if (newUser) {
        logData.status = "Success";
        return res.status(201).json({ message: "Registration successful. Please log in." });
      }

    } catch (err) {
      if (process.env.DEBUG === "true") {
        stackTraceLogEvent({
          stack: err.stack.split("\n").map(line => line.trim()),
          message: err.message
        });
        res.status(500).json({
          message: [err.message, ...err.stack.split("\n").map(line => line.trim())]
        });
      } else {
        res.status(500).json({
          message: err.message,
        });
      }
    } finally {
      await logEvent(logData);
    }
  }
];

export const editUserFromAdmin = [
  validateEditUser,
  async (req, res) => {
    let logData = {
      username: req.user?.username || "Guest",
      role: req.user?.role,
      route: req.originalUrl,
      action: "Edit User from Admin",
      status: "Failed",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    };
    try { //ADDED USERNAME
      const { currentUsername, email, username, full_name, phone } = req.body;

      const { role } = req.user;

      if (role !== 'admin') {
        logData.status = "Unauthorized editing of user.";
        throw new Error("Unauthorized editing of user.");
      }

      const updatedUser = await updateUserDetails(currentUsername, email, username, full_name, phone);

      if (updatedUser) {
        // logData.oldUsername = currentUsername;
        // logData.newUsername = username;
        logData.status = "Success";
        return res.status(201).json({ message: "Edit user data successful." });
      }

    } catch (err) {
      if (process.env.DEBUG === "true") {
        stackTraceLogEvent({
          stack: err.stack.split("\n").map(line => line.trim()),
          message: err.message
        });
        res.status(500).json({
          message: [err.message, ...err.stack.split("\n").map(line => line.trim())]
        });
      } else {
        res.status(500).json({
          message: err.message,
        });
      }
    } finally {
      await logEvent(logData);
    }
  }
];

export const banUsersFromAdmin = [
  async (req, res) => {
    let logData = {
      username: req.user?.username || "Guest",
      role: req.user?.role,
      route: req.originalUrl,
      action: "Ban User from Admin",
      status: "Failed",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    };
    try { //ADDED USERNAME
      const { role } = req.user;

      if (role !== 'admin') {
        logData.status = "Unauthorized banning of user.";
        throw new Error("Unauthorized banning of user.");
      }

      const changedBanStatuses = JSON.parse(req.body.changedBanStatuses);

        if (!changedBanStatuses || Object.keys(changedBanStatuses).length === 0) {
            return res.status(400).json({ message: "No changes detected." });
        }

        let updates = [];
        let updateSuccess = false; // Flag to check if at least one update worked

        for (const username in changedBanStatuses) {
            const { ban_posting, ban_commenting } = changedBanStatuses[username];

            const updatedUser = await updateUserBanStatus(username, ban_posting, ban_commenting);

            if (updatedUser) {
                updateSuccess = true;
                updates.push({ username, ...updatedUser });
            }
        }

        if (updateSuccess) {
            logData.status = "Success";
            console.log("Updated Ban Statuses:", updates);
            return res.status(200).json({ message: "Ban statuses updated successfully.", updates });
        } else {
            return res.status(500).json({ message: "No updates were applied." });
        }
    } catch (err) {
      if (process.env.DEBUG === "true") {
        stackTraceLogEvent({
          stack: err.stack.split("\n").map(line => line.trim()),
          message: err.message
        });
        res.status(500).json({
          message: [err.message, ...err.stack.split("\n").map(line => line.trim())]
        });
      } else {
        res.status(500).json({
          message: err.message,
        });
      }
    } finally {
      await logEvent(logData);
    }
  }
];

export const registerUserFromAdmin = [
  validateRegistration,
  async (req, res) => {
    let logData = {
      username: req.user?.username || "Guest",
      role: req.user?.role,
      route: req.originalUrl,
      action: "Register User from Admin",
      status: "Failed",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    };
    try { //ADDED USERNAME
      const { role } = req.user;
      const { first_name, last_name, username, email, phone, password } = req.body;
      const profile_image = req.file ? req.file.buffer : null; // Handle the file upload here

      if (role !== 'admin') {
        logData.status = "Unauthorized registration of user.";
        throw new Error("Unauthorized registration of user.");
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = await createUser(first_name, last_name, email, username, phone, profile_image, hashedPassword);

      if (newUser) {
        logData.newUser = username;
        logData.status = "Success";
        return res.status(201).json({ message: "Registration successful in admin panel successful." });
      }

    } catch (err) {
      if (process.env.DEBUG === "true") {
        stackTraceLogEvent({
          stack: err.stack.split("\n").map(line => line.trim()),
          message: err.message
        });
        res.status(500).json({
          message: [err.message, ...err.stack.split("\n").map(line => line.trim())]
        });
      } else {
        res.status(500).json({
          message: err.message,
        });
      }
    } finally {
      await logEvent(logData);
    }
  }
];

export const updatePhoneNumber = [
  validatePhoneNumberUpdate, // Middleware to validate phone number
  async (req, res) => {
    let logData = {
      username: req.user?.username || "Guest",
      role: req.user?.role,
      route: req.originalUrl,
      action: "Update Phone Number",
      status: "Failed",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    };
    try {
      const { username, role } = req.user;
      const { phone } = req.body;

      if (role !== 'user') {
        logData.status = "Unauthorized updating of phone number.";
        throw new Error("Unauthorized updating of phone number.");
      }

      const success = await updateUserPhoneNumber(username, phone);

      if (success) {
        logData.status = "Success";
        res.status(200).json({ message: "Phone number updated successfully." });
      }
    } catch (err) {
      if (process.env.DEBUG === "true") {
        stackTraceLogEvent({
          stack: err.stack.split("\n").map(line => line.trim()),
          message: err.message
        });
        res.status(500).json({
          message: [err.message, ...err.stack.split("\n").map(line => line.trim())]
        });
      } else {
        res.status(500).json({
          message: err.message,
        });
      }
    } finally {
      await logEvent(logData);
    }
  }
];

export const deleteUser = [
  async (req, res) => {
    let logData = {
      username: req.user?.username || "Guest",
      role: req.user?.role,
      route: req.originalUrl,
      action: "Delete User",
      status: "Failed",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    };
    try {
      const { role } = req.user;
      const { deleteUsername } = req.body;

      if (role !== 'admin') {
        logData.status = "Unauthorized deleting of users.";
        throw new Error("Unauthorized deleting of users.");
      }

      const success = await hideUser(deleteUsername);

      if (success) {
        logData.status = "Success";
        res.status(200).json({ message: "Deleted user successfully." });
      }
    } catch (err) {
      if (process.env.DEBUG === "true") {
        stackTraceLogEvent({
          stack: err.stack.split("\n").map(line => line.trim()),
          message: err.message
        });
        res.status(500).json({
          message: [err.message, ...err.stack.split("\n").map(line => line.trim())]
        });
      } else {
        res.status(500).json({
          message: err.message,
        });
      }
    } finally {
      await logEvent(logData);
    }
  }
];

export const getProfileImage = async (req, res) => {
  try {
    const { username } = req.params;
    const token = req.query.token;

    if (!token && req.headers.referer?.includes("/profile")) {
      console.log("Serving profile image for:", username);
    } else {
      if (!token) {
        return res.render("404");
      }

      try {
        const decryptedBytes = CryptoJS.AES.decrypt(decodeURIComponent(token), process.env.ENCRYPTION_KEY);
        const decryptedToken = decryptedBytes.toString(CryptoJS.enc.Utf8);

        const decoded = jwt.verify(decryptedToken, process.env.IMAGE_SECRET);
        // console.log("Decrypted Token:", decryptedToken);
        // console.log("Token verified:", decoded);

        if (decoded.exp < Math.floor(Date.now() / 1000)) {
          return res.status(403).json({ message: "Expired token" });
        }
      } catch (err) {
        console.error("JWT Verification Error:", err);
        return res.status(403).json({ message: "Invalid or expired token" });
      }
    }

    const query = "SELECT profile_image FROM users WHERE username = $1";
    const result = await queryDatabase(query, [username]);

    if (result.length === 0 || !result[0].profile_image) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.setHeader("Content-Type", "image/jpeg");
    res.send(result[0].profile_image);

  } catch (err) {
    // console.error("Error fetching profile image:", err);
    res.status(500).json({ message: "Error retrieving image" });
  }
};

