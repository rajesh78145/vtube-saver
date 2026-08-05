const router = require("express").Router();
const profileController = require("../controllers/profileController");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

router.get("/", auth, profileController.getProfile);
router.put("/", auth, profileController.updateProfile);
router.put("/password", auth, profileController.changePassword);

router.put("/email", auth, profileController.changeEmail);
router.post(
  "/change-email-request",
  auth,
  profileController.changeEmailRequest,
);
router.post("/verify-email-change", auth, profileController.verifyEmailChange);
router.put(
  "/avatar",
  auth,
  upload.single("avatar"),
  profileController.updateAvatar,
);
router.post("/set-password-otp", auth, profileController.requestSetPasswordOTP);
router.post("/set-password", auth, profileController.setPassword);
module.exports = router;
