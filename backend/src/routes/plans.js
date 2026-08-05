const router = require("express").Router();
const planController = require("../controllers/planController");
const auth = require("../middleware/auth");

router.get("/", planController.getPlans);
router.post("/upgrade", auth, planController.upgradePlan);

module.exports = router;
