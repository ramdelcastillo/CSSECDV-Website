import { queryDatabase } from "../db.js";
import dotenv from 'dotenv';
dotenv.config();

// Function to create a new user
export const createUser = async (firstName, lastName, email, username, phone, profilePhoto, passwordHash) => {
  try {
    const query = `
      INSERT INTO users (full_name, email, username, phone_number, profile_image, password, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `;

    const fullName = `${firstName} ${lastName}`;
    const values = [fullName, email, username, phone, profilePhoto, passwordHash, "user"];

    const result = await queryDatabase(query, values);

    return result[0].id; 
  } catch (err) {
    if (process.env.DEBUG === "true") {
      throw err;
    } else {
      throw new Error("Error creating user.");
    }
  }
};

export const findUserByEmail = async (email) => {
  try {
    const query = `SELECT * FROM users WHERE email = $1`;
    const values = [email];
    const result = await queryDatabase(query, values);

    return result.length > 0 ? result[0] : null; 
  } catch (err) {
    if (process.env.DEBUG === "true") {
      throw err;
    } else {
      throw new Error("Error fetching user.");
    }
  }
};

export const findUserByUsername = async (username) => {
  try {
    const query = `SELECT * FROM users WHERE username = $1`;
    const values = [username];
    const result = await queryDatabase(query, values);
    return result.length > 0 ? result[0] : null; 
  } catch (err) {
    if (process.env.DEBUG === "true") {
      throw err;
    } else {
      throw new Error("Error finding user.");
    }
  }
};

export const updateUserPhoneNumber = async (username, newPhoneNumber) => {
  try {
    const query = `
      UPDATE users 
      SET phone_number = $1 
      WHERE username = $2
      RETURNING phone_number;
    `;

    const values = [newPhoneNumber, username];
    const result = await queryDatabase(query, values);

    return result.length > 0 ? result[0].phone_number : null; 
  } catch (err) {
    if (process.env.DEBUG === "true") {
      throw err;
    } else {
      throw new Error("Error updating phone number.");
    }
  }
};

export const updateUserDetails = async (username, newEmail, newUsername, newFullName, newPhoneNumber) => {
  try {
    const query = `
      UPDATE users 
      SET 
        email = $1,
        username = $2,
        full_name = $3,
        phone_number = $4
      WHERE username = $5
      RETURNING email, username, full_name, phone_number;
    `;

    const values = [newEmail, newUsername, newFullName, newPhoneNumber, username];
    const result = await queryDatabase(query, values);

    return result.length > 0 ? result[0] : null; 
  } catch (err) {
    if (process.env.DEBUG === "true") {
      throw err;
    } else {
      throw new Error("Error updating user details.");
    }
  }
};

export const updateUserBanStatus = async (username, banPosting, banCommenting) => {
  try {
    const query = `
      UPDATE users 
      SET 
        ban_posting = COALESCE($1, ban_posting), 
        ban_commenting = COALESCE($2, ban_commenting) 
      WHERE username = $3
      RETURNING ban_posting, ban_commenting;
    `;

    const values = [banPosting, banCommenting, username];
    const result = await queryDatabase(query, values);

    return result.length > 0 ? result[0] : null;
  } catch (err) {
    if (process.env.DEBUG === "true") {
      throw err;
    } else {
      throw new Error("Error updating user ban status.");
    }
  }
};


export const updateUserBanPosting = async (username, banStatus) => {
  try {
    const query = `
      UPDATE users 
      SET ban_posting = $1 
      WHERE username = $2
      RETURNING ban_posting;
    `;

    const values = [banStatus, username];
    const result = await queryDatabase(query, values);

    return result.length > 0 ? result[0].ban_posting : null;
  } catch (err) {
    if (process.env.DEBUG === "true") {
      throw err;
    } else {
      throw new Error("Error updating ban posting status.");
    }
  }
};

export const updateUserBanCommenting = async (username, banStatus) => {
  try {
    const query = `
      UPDATE users 
      SET ban_commenting = $1 
      WHERE username = $2
      RETURNING ban_commenting;
    `;

    const values = [banStatus, username];
    const result = await queryDatabase(query, values);

    return result.length > 0 ? result[0].ban_commenting : null;
  } catch (err) {
    if (process.env.DEBUG === "true") {
      throw err;
    } else {
      throw new Error("Error updating commenting ban status.");
    }
  }
};

export const hideUser = async (username) => {
  try {
    const query = `
      UPDATE users 
      SET is_hidden = true 
      WHERE username = $1
      RETURNING is_hidden;
    `;

    const values = [username];
    const result = await queryDatabase(query, values);

    return result.length > 0 ? result[0].is_hidden : null;
  } catch (err) {
    if (process.env.DEBUG === "true") {
      throw err;
    } else {
      throw new Error("Error hiding user.");
    }
  }
};

export const getAllUsers = async () => {
  try {
    const query = `
      SELECT id, email, username, full_name, phone_number, created_at, 
             ban_posting, ban_commenting
      FROM users
      WHERE role = 'user' AND is_hidden = false
      ORDER BY created_at DESC;
    `;

    const result = await queryDatabase(query);
    return result;
  } catch (err) {
    if (process.env.DEBUG === "true") {
      throw err;
    } else {
      throw new Error("Error retrieving users.");
    }
  }
};


export const getRoleUserOnlyByUsername = async (username) => {
  try {
    const query = `SELECT * FROM users WHERE username = $1 AND role = 'user'`;
    const values = [username];
    const result = await queryDatabase(query, values);
    return result.length > 0 ? result[0] : null;
  } catch (err) {
    if (process.env.DEBUG === "true") {
      throw err;
    } else {
      throw new Error("Error retrieving user.");
    }
  }
};






