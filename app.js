var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var helmet = require("helmet");
const cors = require("cors");

const swaggerUi = require("swagger-ui-express");
const yaml = require("yamljs");
swaggerDocument = yaml.load("./swagger.yaml");

var knex = require("./knex/knex.js"); // Database handler
var userRouter = require("./routes/user"); // User routes
var stocksRouter = require("./routes/stocks"); // Stock routes

var app = express();
app.use(helmet()); // Helmet will set various HTTP headers to help protect the app
app.use(cors()); // Use this package to allow tests to work
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, "public")));

// Pass knex as middleware
app.use((req, res, next) => {
  req.db = knex;
  // TODO: Might need to include morgan for logging
  next();
});

// Configure the
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/user", userRouter);
app.use("/stocks", stocksRouter);

module.exports = app;
