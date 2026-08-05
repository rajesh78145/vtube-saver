const router = require("express").Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

router.post("/register", authController.register);
router.post("/verify-otp", authController.verifyOTP);
router.post("/resend-otp", authController.resendOTP);
router.post("/login", authController.login);
router.post("/google", authController.googleLogin);
router.get("/me", authMiddleware, authController.me);
router.post("/logout", authMiddleware, authController.logout);

module.exports = router;
