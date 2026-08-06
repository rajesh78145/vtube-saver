const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const errorHandler = require("./middleware/errorHandler");
const routes = require("./routes");

const app = express();

// Allow all Vercel domains (production + preview)
const allowedOrigins = [
  "https://vtube-saver.vercel.app",
  /^https:\/\/vtube-saver-.*\.vercel\.app$/,
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.options("*", cors({ origin: allowedOrigins, credentials: true }));
app.use(morgan("dev"));

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

module.exports = app;
