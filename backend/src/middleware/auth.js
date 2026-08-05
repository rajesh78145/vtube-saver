const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    logger.error("JWT verification failed:", err.message);
    return res
      .status(401)
      .json({ success: false, message: "Session expired, please login again" });
  }
};

module.exports = auth;
