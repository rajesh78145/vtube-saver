const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const errorHandler = require("./middleware/errorHandler");
const routes = require("./routes");

const app = express();

// Allow all origins for now – we can restrict later
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

module.exports = app;
