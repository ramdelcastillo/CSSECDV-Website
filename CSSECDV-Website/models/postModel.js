import { queryDatabase } from "../db.js";
import dotenv from 'dotenv';
dotenv.config();

export async function getAllPosts() {
    try {
        const result = await queryDatabase(`
            SELECT posts.*, users.username
            FROM posts 
            JOIN users ON posts.user_id = users.id 
            WHERE posts.is_hidden = FALSE 
            AND users.is_hidden = FALSE  -- Ensure the user is not hidden
            ORDER BY posts.created_at DESC
        `);

        return result;
    } catch (err) {
        if (process.env.DEBUG === "true") {
            throw err;
        } else {
            throw new Error("Error retrieving posts.");
        }
    }
}


export const createPost = async (userId, title, content, image, slug, commentLimit = null) => {
    try {
        const query = `
            INSERT INTO posts (user_id, title, content, image, slug, comment_limit)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;

        const values = [userId, title, content, image, slug, commentLimit];
        const result = await queryDatabase(query, values);

        return result.length > 0 ? result[0] : null;
    } catch (err) {
        if (process.env.DEBUG === "true") {
            throw err;
        } else {
            throw new Error("Error while creating post.");
        }
    }
};

export async function getPostBySlug(slug) {
    try {
        const query = `
        SELECT posts.*, users.username 
        FROM posts 
        JOIN users ON posts.user_id = users.id 
        WHERE posts.slug = $1 
        AND posts.is_hidden = FALSE
        AND users.is_hidden = FALSE  -- Ensure the user is not hidden
    `;

        const result = await queryDatabase(query, [slug]);

        return result.length > 0 ? result[0] : null;
    } catch (err) {
        if (process.env.DEBUG === "true") {
            throw err;
        } else {
            throw new Error("Error retrieving post.");
        }
    }
}

export async function getCommentsFromAPostBySlug(slug) {
    try {
        const query = `
        SELECT comments.*, users.username, posts.comment_limit
        FROM comments
        JOIN posts ON comments.post_id = posts.id
        JOIN users ON comments.user_id = users.id
        WHERE posts.slug = $1 
        AND comments.is_hidden = FALSE
        AND users.is_hidden = FALSE  -- Ensure the user is not hidden
        ORDER BY comments.created_at ASC
        LIMIT COALESCE((SELECT comment_limit FROM posts WHERE slug = $1), NULL)
    `;

        const result = await queryDatabase(query, [slug]);

        return result;
    } catch (err) {
        if (process.env.DEBUG === "true") {
            throw err;
        } else {
            throw new Error("Error retrieving comments from post.");
        }
    }
}

export async function updateCommentById(commentId, userId, newContent) {
    try {
        const query = `
            UPDATE comments
            SET content = $1, is_edited = TRUE
            WHERE id = $2 AND user_id = $3
            RETURNING *;
        `;

        const result = await queryDatabase(query, [newContent, commentId, userId]);

        return result.length > 0 ? result[0] : null;
    } catch (err) {
        if (process.env.DEBUG === "true") {
            throw err;
        } else {
            throw new Error("Error updating comment.");
        }
    }
}


export async function hideCommentById(commentId, userId) {
    try {
        const query = `
            UPDATE comments
            SET is_hidden = TRUE
            WHERE id = $1 AND user_id = $2
            RETURNING *;
        `;

        const result = await queryDatabase(query, [commentId, userId]);

        return result.length > 0 ? result[0] : null;
    } catch (err) {
        if (process.env.DEBUG === "true") {
            throw err;
        } else {
            throw new Error("Error hiding comment.");
        }
    }
}


export async function addComment(postId, userId, content) {
    try {
        const countQuery = `
            SELECT COUNT(*) AS comment_count 
            FROM comments 
            WHERE post_id = $1 AND is_hidden = FALSE;
        `;

        const countResult = await queryDatabase(countQuery, [postId]);

        const visibleCommentCount = parseInt(countResult[0].comment_count, 10);

        const limitQuery = `
            SELECT comment_limit FROM posts WHERE id = $1;
        `;
        const limitResult = await queryDatabase(limitQuery, [postId]);

        const commentLimit = limitResult[0].comment_limit;

        if (commentLimit !== null && visibleCommentCount >= commentLimit) {
            throw new Error("Comment limit reached for this post.");
        }

        const insertQuery = `
            INSERT INTO comments (post_id, user_id, content)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;

        const result = await queryDatabase(insertQuery, [postId, userId, content]);

        return result.length > 0 ? result[0] : null;
    } catch (err) {
        if (process.env.DEBUG === "true") {
            throw err;
        } else {
            throw new Error("Error adding comment.");
        }
    }
}


export const updatePost = async (postId, userId, title, slug, content, image, commentLimit = null) => {
    try {
        const query = `
            UPDATE posts 
            SET 
                title = $1, 
                slug = $2, 
                content = $3, 
                image = $4, 
                comment_limit = $5,
                is_edited = TRUE
            WHERE id = $6 AND user_id = $7
            RETURNING *;
        `;

        const values = [title, slug, content, image, commentLimit, postId, userId];
        const result = await queryDatabase(query, values);
        return result.length > 0 ? result[0] : null;
    } catch (err) {
        if (process.env.DEBUG === "true") {
            throw err;
        } else {
            throw new Error("Error editing post.");
        }
    }
};


export const hidePost = async (slug, userId) => {
    try {
        const query = `
            UPDATE posts 
            SET is_hidden = TRUE
            WHERE slug = $1 AND user_id = $2
            RETURNING *;
        `;

        const values = [slug, userId];
        const result = await queryDatabase(query, values);

        return result.length > 0 ? result[0] : null;
    } catch (err) {
        if (process.env.DEBUG === "true") {
            throw err;
        } else {
            throw new Error("Error deleting post.");
        }
    }
};








