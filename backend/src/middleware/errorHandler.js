const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error(err);
  logger.error(err.stack);
  logger.error(err.stderr);

  res.status(err.status || 500).json({
    success: false,
    message: err.message,
    status: err.status || 500,
  });
};

module.exports = errorHandler;
