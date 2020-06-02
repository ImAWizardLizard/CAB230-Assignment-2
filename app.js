var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

var knex = require("../knex/knex.js");
var docsRouter = require("./routes/docs");
var userRouter = require("./routes/user");
var stocksRouter = require("./routes/stocks");

var app = express();
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Pass knex as middleware
app.use((req, res, next) => {
  req.db = knex;
  next();
});

// Configure the
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/user", userRouter);
app.use("/stocks", stocksRouter);

module.exports = app;
