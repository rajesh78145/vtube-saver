const historyService = require("../services/historyService");

const getHistory = async (req, res, next) => {
  try {
    const history = await historyService.getHistory(req.user.id);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};

const deleteRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await historyService.deleteRecord(req.user.id, id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getHistory, deleteRecord };
