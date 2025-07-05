import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const authenticateToken = (req, res, next) => {
  // console.log("Cookies received:", req.cookies); 
  const token = req.cookies.token;
  if (!token) {
    // console.log("No token found in cookies");
    //   return res.status(401).json({ message: "Access denied. No token provided." });
    return res.status(404).render("404");
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      // console.log("Token verification failed:", err.message);
      res.clearCookie("token", { path: '/' }); // Clear expired token
      //   return res.status(403).json({ message: "Invalid or expired token" });
      return res.redirect("/");
    }
    // console.log("Decoded User:", decoded); 
    req.user = decoded;
    next();
  });
};

export const authenticateHomeAboutToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    // console.log("No token found in cookies for home/about");
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      // console.log("Token verification failed for home/about:", err.message);
      res.clearCookie("token", { path: '/' });
    }

    // console.log("Decoded User for home/about:", decoded);
    req.user = decoded;
    next();
  });
};



