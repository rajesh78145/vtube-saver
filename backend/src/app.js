const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const errorHandler = require("./middleware/errorHandler");
const routes = require("./routes");

const app = express();

app.use(cors({ origin: "https://vtube-saver.vercel.app", credentials: true }));
app.use(express.json());
app.options('*', cors());
app.use(morgan("dev"));

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

module.exports = app;
