import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { findUserByEmail } from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { validateEmail, validatePassword } from '../middleware/logMiddleware.js';
import logEvent from "../logger.js";
import stackTraceLogEvent from "../stackTraceLogger.js";

dotenv.config();
const router = express.Router();

// Set up rate limiting: 5 attempts per 15 minutes
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Max attempts
    standardHeaders: true, // Return `Retry-After` header
    legacyHeaders: false,
    keyGenerator: (req) => req.ip, // Ensure rate limit is applied per IP
    handler: (req, res) => {
        const retryAfter = Math.ceil(req.rateLimit.resetTime / 1000 - Date.now() / 1000); // Time left in seconds
        res.status(429).json({
            success: false,
            message: `Too many login attempts. Try again in ${retryAfter} seconds.`
        });
    }
});

router.post('/login', loginLimiter, async (req, res) => {
    let logData = {
        username: req.body.username || "Guest",
        route: req.originalUrl,
        action: "Login Attempt",
        status: "Failed",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
    };

    try {
        const { email, password } = req.body;

        if (!validateEmail(email) || !validatePassword(password)) {
            throw new Error('Invalid credentials');
        }

        const user = await findUserByEmail(email);

        if (!user || user.role !== 'user' || !await bcrypt.compare(password, user.password)) {
            throw new Error('Invalid credentials');
        }

        if (user.is_hidden) {
            logData.status = "Unauthorized login attempt";
            throw new Error("Invalid credentials"); 
        }

        const payload = { 
            id: user.id, 
            email: user.email, 
            role: user.role, 
            username: user.username, 
            ban_posting: user.ban_posting, 
            ban_commenting: user.ban_commenting, 
            is_hidden: user.is_hidden 
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });

        res.cookie("token", token, { httpOnly: true });

        logData.status = "Success";
        res.json({ success: true, token, username: user.username, role: user.role });
    } catch (err) {
        if (process.env.DEBUG === "true") {
            stackTraceLogEvent({
                stack: err.stack.split("\n").map(line => line.trim()),
                message: err.message
            });
            res.status(401).json({
                message: [err.message, ...err.stack.split("\n").map(line => line.trim())]
            });
        } else {
            res.status(401).json({ message: err.message });
        }
    } finally {
        await logEvent(logData);
    }
});


router.post('/fdf1b191a3e96b81f5fa5761fa57379c', loginLimiter, async (req, res) => {
    let logData = {
        username: req.body.username || "Guest",
        route: req.originalUrl,
        action: "Admin Login Attempt",
        status: "Failed",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
    };

    try {
        const { email, password } = req.body;

        if (!validateEmail(email) || !validatePassword(password)) {
            throw new Error('Invalid credentials');
        }

        const user = await findUserByEmail(email);

        if (!user || user.role !== 'admin' || !await bcrypt.compare(password, user.password)) {
            throw new Error('Invalid credentials');
        }

        const payload = { 
            id: user.id, 
            email: user.email, 
            role: user.role, 
            username: user.username 
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });

        res.cookie("token", token, { httpOnly: true });

        logData.status = "Success";
        res.json({ success: true, token, username: user.username });
    } catch (err) {
        if (process.env.DEBUG === "true") {
            stackTraceLogEvent({
                stack: err.stack.split("\n").map(line => line.trim()),
                message: err.message
            });
            res.status(401).json({
                message: [err.message, ...err.stack.split("\n").map(line => line.trim())]
            });
        } else {
            res.status(401).json({ message: err.message });
        }
    } finally {
        await logEvent(logData);
    }
});

export default router;
