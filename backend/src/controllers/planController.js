const planService = require("../services/planService");

const getPlans = async (req, res, next) => {
  try {
    const plans = await planService.getPlans();
    res.json({ success: true, data: plans });
  } catch (err) {
    next(err);
  }
};

const upgradePlan = async (req, res, next) => {
  try {
    const { planId } = req.body;
    if (!planId)
      throw Object.assign(new Error("Plan ID is required"), { status: 400 });
    const result = await planService.upgradePlan(req.user.id, planId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPlans, upgradePlan };
