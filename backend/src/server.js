require("dotenv").config();

const fs = require("fs");
const path = require("path");
const app = require("./app");
const config = require("./config");
const logger = require("./utils/logger");
const cookies = process.env.YTDLP_COOKIES;
const tempDir = path.join(__dirname, "..", "temp");
if (cookies) {
  const cookiePath = path.join(process.cwd(), "cookies.txt");
  fs.writeFileSync(cookiePath, cookies, "utf8");
  console.log("cookies.txt created");
}
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
  logger.info("Cleaned old temp files");
}
fs.mkdirSync(tempDir, { recursive: true });
logger.info("Created fresh temp directory");

const server = app.listen(config.port, "0.0.0.0", () => {
  logger.info(
    `Server running in ${config.nodeEnv} mode on port ${config.port}`,
  );
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});
