import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Render gives you this env var
  ssl: {
    rejectUnauthorized: false, // required for Render’s managed PostgreSQL
  },
});

const queryDatabase = async (queryText, params = []) => {
  try {
    const res = await pool.query(queryText, params);
    return res.rows;
  } catch (err) {
    throw err;
  }
};

// Optional for debugging
const checkConnection = async () => {
  try {
    console.log("Connected to PostgreSQL database");

    const usersRes = await pool.query("SELECT * FROM users");
    console.log("Users:", usersRes.rows);

    const postsRes = await pool.query("SELECT * FROM posts");
    console.log("Posts:", postsRes.rows);

    const commentsRes = await pool.query("SELECT * FROM comments");
    console.log("Comments:", commentsRes.rows);
  } catch (err) {
    console.error("Error connecting or executing query:", err);
  }
};

export { queryDatabase, checkConnection };

// Uncomment for local testing only
// checkConnection();
