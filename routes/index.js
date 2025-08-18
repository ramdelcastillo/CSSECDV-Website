import express from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import { registerUser, getProfileImage, updatePhoneNumber, deleteUser, registerUserFromAdmin, editUserFromAdmin, banUsersFromAdmin } from "../controllers/userController.js";
import { makePost, getPostImage, editPost, deletePost, postComment, editComment, deleteComment } from "../controllers/postController.js"
import { authenticateToken, authenticateHomeAboutToken } from "../middleware/authMiddleware.js";
import { findUserByUsername } from "../models/userModel.js";
import { getAllPosts, getPostBySlug, getCommentsFromAPostBySlug } from "../models/postModel.js";
import { getAllUsers, getRoleUserOnlyByUsername } from "../models/userModel.js";
import authRouter from "../routes/authRouter.js";
import CryptoJS from "crypto-js";
import dotenv from 'dotenv';
dotenv.config();
const router = express.Router();

// Multer setup for handling file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use("/auth", authRouter);

// Home Route
router.get("/", authenticateHomeAboutToken, (req, res) => {
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];

  let isLoggedOn = !!token; // Default to false if no token

  if (!token) {
    return res.render("home", { title: "Home", page: "home", user: null, isLoggedOn });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      res.clearCookie("token", { path: "/" });
      return res.render("home", { title: "Home", page: "home", user: null, isLoggedOn: false });
    }

    const user = await findUserByUsername(decoded.username);
    res.render("home", { title: "Home", page: "home", user, isLoggedOn: !!user });
  });
});


// About Route
router.get("/about", authenticateHomeAboutToken, (req, res) => {
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];

  let isLoggedOn = !!token;

  if (!token) {
    return res.render("about", { title: "About", user: null, isLoggedOn });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    res.render("about", { title: "About", user: err ? null : user, isLoggedOn });
  });
});


// Register Route
router.get("/register", (req, res) => {
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (!err) {
        return res.render('404');
      }
    });

    return;
  }

  return res.render("register");
});

router.post("/register", upload.single("profile_image"), registerUser);

router.post("/profile/:username/edit-phone", authenticateToken, updatePhoneNumber);

router.get("/profile/:username/signed-url", async (req, res) => {
  try {
    const { username } = req.params;
    const expiryTime = Math.floor(Date.now() / 1000) + 10; // 10 min expiry

    const token = jwt.sign({ username }, process.env.IMAGE_SECRET, { expiresIn: "30m" });

    const encryptedToken = CryptoJS.AES.encrypt(token, process.env.ENCRYPTION_KEY).toString();

    const signedUrl = `/profile/${username}/profile-picture?token=${encodeURIComponent(encryptedToken)}`;

    res.json({ url: signedUrl, expiry: expiryTime });
  } catch (err) {
    console.error("Error generating signed URL:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Login Route
router.get("/login", (req, res) => {
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (!err) {
        return res.render('404');
      }
    });

    return;
  }

  return res.render("login");
});


// Admin Login Route 
router.get("/fdf1b191a3e96b81f5fa5761fa57379c", (req, res) => {
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (!err) {
        return res.render('404');
      }
    });

    return;
  }

  return res.render("admin-login", { user: null });
});

// Profile Route
router.get("/profile/:username", authenticateHomeAboutToken, async (req, res) => {
  const { username } = req.params;
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];

  let isLoggedOn = false;
  let loggedInUser = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      isLoggedOn = true;
      loggedInUser = await getRoleUserOnlyByUsername(decoded.username);
      console.log(loggedInUser);
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }

  try {
    const user = await getRoleUserOnlyByUsername(username);
    console.log("Fetched user:", user);
    if (!user) {
      return res.render("404");
    }

    res.render("profile", { user, isLoggedOn, loggedInUser });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).send("Internal server error");
  }
});

router.get("/make-posts", authenticateHomeAboutToken, async (req, res) => {
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.render("home", { isLoggedOn: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await findUserByUsername(decoded.username);

    if (!user || user.role !== "user") {
      return res.render("home", { isLoggedOn: true, user });
    }

    res.render("make-posts", { user, isLoggedOn: true });
  } catch (err) {
    console.error("Invalid token:", err);
    res.clearCookie("token", { path: "/" }); // Clear expired token
    return res.render("home", { isLoggedOn: false });
  }
});

router.post("/make-posts", authenticateToken, upload.single("post_image"), makePost);

router.get("/home-posts", authenticateHomeAboutToken, async (req, res) => {
  try {
    const posts = await getAllPosts() || [];
    const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];

    let isLoggedOn = !!token;
    let user = null;

    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
        if (!err) {
          user = decodedUser;
        }
        res.render("home-posts", { posts, isLoggedOn, user });
      });
    } else {
      res.render("home-posts", { posts, isLoggedOn, user });
    }
  } catch (error) {
    console.error("Error loading posts:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/admin-panel", authenticateHomeAboutToken, async (req, res) => {
  try {
    const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];

    let isLoggedOn = false;
    let user = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await findUserByUsername(decoded.username);
        isLoggedOn = true;
      } catch (err) {
        console.error("Invalid token:", err);
      }
    }

    if (!isLoggedOn || !user || user.role !== "admin") {
      return res.render("home", { isLoggedOn, user: null });
    }

    const users = await getAllUsers() || [];

    res.render("admin-panel", { users, isLoggedOn, user });
  } catch (error) {
    console.error("Error loading admin panel:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/posts/:slug", authenticateHomeAboutToken, async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await getPostBySlug(slug);

    if (!post) {
      return res.status(404).render("404");
    }

    const comments = await getCommentsFromAPostBySlug(slug);

    const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];
    let isLoggedOn = !!token;
    let user = null;

    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
        if (!err) {
          user = decodedUser;
        }
        res.render("post", { post, comments, isLoggedOn, user });
      });
    } else {
      res.render("post", { post, comments, isLoggedOn, user });
    }
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.post("/posts/:slug/post-comment", authenticateToken, upload.none(), postComment);

router.post("/posts/:slug/edit-comment", authenticateToken, upload.none(), editComment);

router.post("/posts/:slug/delete-comment", authenticateToken, upload.none(), deleteComment);

router.post("/posts/:slug/edit", authenticateToken, upload.single("image"), editPost);

router.post("/posts/:slug/delete", authenticateToken, deletePost);

router.post("/admin-panel/delete-user/:username", authenticateToken, upload.none(), deleteUser);

router.post("/admin-panel/edit-user", authenticateToken, upload.none(), editUserFromAdmin);

router.post("/admin-panel/ban-user", authenticateToken, upload.none(), banUsersFromAdmin);

router.post("/admin-panel/add-user", authenticateToken, upload.single("profile_image"), registerUserFromAdmin);


router.get("/posts/:slug/signed-url", async (req, res) => {
  try {
    const { slug } = req.params;
    const expiryTime = Math.floor(Date.now() / 1000) + 10; // 10 min expiry

    const token = jwt.sign({ slug }, process.env.IMAGE_SECRET, { expiresIn: "30m" });

    const encryptedToken = CryptoJS.AES.encrypt(token, process.env.ENCRYPTION_KEY).toString();

    const signedUrl = `/posts/${slug}/image?token=${encodeURIComponent(encryptedToken)}`;

    res.json({ url: signedUrl, expiry: expiryTime });
  } catch (err) {
    console.error("Error generating signed URL:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Profile Image Route
router.get("/profile/:username/profile-picture", getProfileImage);

router.get("/posts/:slug/image", getPostImage);
// Logout Route
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

export default router;
