const router = require("express").Router();
const historyController = require("../controllers/historyController");
const auth = require("../middleware/auth");

router.get("/", auth, historyController.getHistory);
router.delete("/:id", auth, historyController.deleteRecord);

module.exports = router;
