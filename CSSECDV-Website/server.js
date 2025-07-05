import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import flash from "connect-flash";
import path from "path";
import { fileURLToPath } from "url";
import routes from "./routes/index.js";
import authRouter from './routes/authRouter.js';
import { authenticateToken } from './middleware/authMiddleware.js';
import cookieParser from "cookie-parser";
import https from "https";
import fs from "fs";
const options = {
  key: fs.readFileSync("server.key"),
  cert: fs.readFileSync("server.cert"),
};

// Initialize
dotenv.config();
const app = express();
const port = process.env.SERVER_PORT;

// Setup EJS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(flash());

app.use("/", routes);

app.all('*', (req, res) => {
  res.render('404');
});

// Start Server
// app.listen(port, () => console.log(`Server running on http://localhost:${port}`));

https.createServer(options, app).listen(port, () => {
  console.log(`HTTPS Server running on https://localhost:${port}`);
});
