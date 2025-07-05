import { createPost, updatePost, getPostBySlug, hidePost, updateCommentById, addComment, hideCommentById } from "../models/postModel.js"
import { fileUploadPostMiddleware } from "../middleware/postImageUploadMiddleware.js";
import { validatePost } from "../middleware/postMiddleware.js"
import { validateComment } from "../middleware/commentMiddleware.js"
import { queryDatabase } from "../db.js"; // Use the existing pool
import jwt from "jsonwebtoken";
import CryptoJS from "crypto-js";
import { encode } from "html-entities";
import dotenv from 'dotenv';
import logEvent from "../logger.js";
import stackTraceLogEvent from "../stackTraceLogger.js";

dotenv.config();

export function slugify(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 50); // Limit to 50 characters
}

export const makePost = [
    validatePost,
    async (req, res) => {
        let logData = {
            username: req.user?.username || "Guest",
            role: req.user?.role,
            route: req.originalUrl,
            action: "Create Post",
            status: "Failed",
            ip: req.ip,
            userAgent: req.headers["user-agent"],
        };

        try {
            const { title, content, commentLimit } = req.body;
            const { id, ban_posting, role } = req.user;
            const image = req.file ? req.file.buffer : null;

            if (role !== 'user') {
                logData.status = "Unauthorized posting.";
                throw new Error("Unauthorized posting.");
            }

            if (ban_posting) {
                logData.status = "Unauthorized posting";
                throw new Error("You are banned from posting.");
            }

            // if (role !)

            const safeTitle = encode(title);
            const safeContent = encode(content);

            let slug = slugify(safeTitle);
            const slugCheckQuery = `SELECT COUNT(*) FROM posts WHERE slug LIKE $1`;
            let slugExists = await queryDatabase(slugCheckQuery, [`${slug}%`]);

            if (parseInt(slugExists[0].count) > 0) {
                slug = `${slug}_${slugExists[0].count}`;
            }

            let post;
            if (commentLimit && !isNaN(commentLimit)) {
                post = await createPost(id, safeTitle, safeContent, image, slug, commentLimit);
            } else {
                post = await createPost(id, safeTitle, safeContent, image, slug, null);
            }

            if (post) {
                logData.status = "Success";
                return res.status(201).json({ message: "Post created successfully!", post });
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
    },
];

export const editPost = [
    validatePost,
    async (req, res) => {
        let logData = {
            username: req.user?.username || "Guest",
            role: req.user?.role,
            route: req.originalUrl,
            action: "Edit Post",
            status: "Failed",
            ip: req.ip,
            userAgent: req.headers["user-agent"],
        };
        try {
            const { title, content, removeImage, commentLimit } = req.body;
            const { slug } = req.params;
            const { id, ban_posting, role } = req.user;

            if (role !== 'user') {
                logData.status = "Unauthorized editing of posts.";
                throw new Error("Unauthorized editing of posts.");
            }

            if (ban_posting) {
                logData.status = "Unauthorized editing";
                throw new Error("You are banned from editing posts.");
            }

            const existingPost = await getPostBySlug(slug);

            let image = null;

            if (req.file) {
                image = req.file.buffer;
            }
            else if (removeImage === "true") {
                image = null;
            }
            else {
                image = existingPost.image;
            }

            const safeTitle = encode(title);
            const safeContent = encode(content);

            let newSlug = slugify(safeTitle);

            const slugCheckQuery = `SELECT COUNT(*) FROM posts WHERE slug LIKE $1 AND id <> $2`;
            let slugExists = await queryDatabase(slugCheckQuery, [`${newSlug}%`, existingPost.id]);

            if (parseInt(slugExists[0].count) > 0) {
                newSlug = `${newSlug}_${slugExists[0].count}`;
            }

            let updatedPost;

            if (commentLimit && !isNaN(commentLimit)) {
                updatedPost = await updatePost(existingPost.id, id, safeTitle, newSlug, safeContent, image, commentLimit);
            } else {
                updatedPost = await updatePost(existingPost.id, id, safeTitle, newSlug, safeContent, image, null);
            }

            if (updatedPost) {
                logData.status = "Success";
                res.status(200).json({
                    message: "Post updated successfully",
                    newSlug: updatedPost.slug,
                });
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

export const getPostImage = async (req, res) => {
    try {
        const { slug } = req.params;
        const token = req.query.token;

        if (!token && (req.headers.referer?.includes("/home-posts") || req.headers.referer?.includes("/posts"))) {
            console.log("Serving image for home or post page:", slug);
        } else {
            if (!token) {
                return res.render("404");
            }

            try {
                const decryptedBytes = CryptoJS.AES.decrypt(decodeURIComponent(token), process.env.ENCRYPTION_KEY);
                const decryptedToken = decryptedBytes.toString(CryptoJS.enc.Utf8);
                const decoded = jwt.verify(decryptedToken, process.env.IMAGE_SECRET);
                console.log(decoded)

                if (decoded.exp < Math.floor(Date.now() / 1000)) {
                    return res.status(403).json({ message: "Expired token" });
                }
            } catch (err) {
                return res.render("404");
            }
        }

        const query = "SELECT image FROM posts WHERE slug = $1";
        const result = await queryDatabase(query, [slug]);

        res.setHeader("Content-Type", "image/jpeg");
        res.send(result[0].image);

    } catch (err) {
        res.status(500).json({ message: "Error retrieving image" });
    }
};

export const deletePost = [
    async (req, res) => {
        let logData = {
            username: req.user?.username || "Guest",
            role: req.user?.role,
            route: req.originalUrl,
            action: "Delete Post",
            status: "Failed",
            ip: req.ip,
            userAgent: req.headers["user-agent"],
        };
        try {
            const { slug } = req.params;
            const { id, role } = req.user;

            if (role !== 'user') {
                logData.status = "Unauthorized deleting of posts.";
                throw new Error("Unauthorized deleting of posts.");
            }

            const deletedPost = await hidePost(slug, id);

            if (deletedPost) {
                logData.status = "Success";
                return res.status(200).json({ message: "Post deleted successfully!", deletedPost });
            }

            // res.status(500).json({ message: "Failed to delete post." });
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
    },
];

export const postComment = [
    validateComment,
    async (req, res) => {
        let logData = {
            username: req.user?.username || "Guest",
            role: req.user?.role,
            route: req.originalUrl,
            action: "Post Comment",
            status: "Failed",
            ip: req.ip,
            userAgent: req.headers["user-agent"],
        };
        try {
            const { postId, content } = req.body;
            const { id, ban_commenting, role } = req.user;

            if (role !== 'user') {
                logData.status = "Unauthorized commenting.";
                throw new Error("Unauthorized commenting.");
            }

            if (ban_commenting) {
                logData.status = "Unauthorized commenting";
                throw new Error("You are banned from commenting on posts.");
            }

            const safeContent = encode(content);

            const comment = await addComment(postId, id, safeContent);

            if (comment) {
                logData.status = "Success";
                return res.status(201).json({ message: "Comment added successfully!", comment });
            }

            // res.status(500).json({ message: "Failed to add comment." });
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

export const editComment = [
    validateComment,
    async (req, res) => {
        let logData = {
            username: req.user?.username || "Guest",
            role: req.user?.role,
            route: req.originalUrl,
            action: "Edit Comment",
            status: "Failed",
            ip: req.ip,
            userAgent: req.headers["user-agent"],
        };
        try {
            const { commentId, content } = req.body;
            const { id, ban_commenting, role } = req.user;

            if (role !== 'user') {
                logData.status = "Unauthorized editing of comments.";
                throw new Error("Unauthorized editing of comments.");
            }

            if (ban_commenting) {
                logData.status = "Unauthorized editing of comments";
                throw new Error("You are banned from editing your comments.");
            }

            const safeContent = encode(content);

            const comment = await updateCommentById(commentId, id, safeContent);

            if (comment) {
                logData.status = "Success";
                return res.status(200).json({ message: "Comment updated successfully!", comment });
            }

            // res.status(403).json({ message: "You are not authorized to edit this comment." });
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

export const deleteComment = async (req, res) => {
    let logData = {
        username: req.user?.username || "Guest",
        role: req.user?.role,
        route: req.originalUrl,
        action: "Edit Comment",
        status: "Failed",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
    };
    try {
        console.log("Request body:", req.body);
        const { commentId } = req.body;
        const { id, role } = req.user;

        if (role !== 'user') {
            logData.status = "Unauthorized deleting of comments.";
            throw new Error("Unauthorized deleting of comments.");
        }

        const comment = await hideCommentById(commentId, id);

        if (comment) {
            logData.status = "Success";
            return res.status(200).json({ message: "Comment deleted successfully!" });
        }

        // res.status(403).json({ message: "You are not authorized to delete this comment." });
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
};








