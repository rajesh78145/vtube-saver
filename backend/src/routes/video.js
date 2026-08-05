const router = require("express").Router();
const videoController = require("../controllers/videoController");
const auth = require("../middleware/auth");

router.post("/info", videoController.info);
router.post("/download", auth, videoController.download);
router.post("/cancel/:downloadId", auth, videoController.cancel);

module.exports = router;
