import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const queryDatabase = async (queryText, params = []) => {
  try {
    const res = await pool.query(queryText, params);
    return res.rows;
  } catch (err) {
    // console.error("Database query error:", err);
    throw err;
  }
};

// Function to check the connection and run a sample query
const checkConnection = async () => {
  try {
    console.log('Connected to PostgreSQL database');

    // Fetch users
    const usersRes = await pool.query('SELECT * FROM users');
    console.log('Users:', usersRes.rows);

    // Fetch posts
    const postsRes = await pool.query('SELECT * FROM posts');
    console.log('Posts:', postsRes.rows);

    // Fetch comments
    const commentsRes = await pool.query('SELECT * FROM comments');
    console.log('Comments:', commentsRes.rows);

  } catch (err) {
    console.error('Error connecting or executing query:', err);
  }
};


export { queryDatabase, checkConnection };

// optional for debugging dont forget to comment it out
checkConnection();
