var express = require("express");
var router = express.Router();
var jwt = require("jsonwebtoken");
var moment = require("moment");

// Secret key for JWT
const secretKey = "secret key";

const authorize = async (req, res, next) => {
  const authorization = req.headers.authorization;
  let token = null;

  if (authorization && authorization.split(" ").length === 2) {
    token = authorization.split(" ")[1];
    console.info("Token:", token);
  } else {
    console.error("Unauthorizaed user");
    res.status(403).json({
      error: true,
      message: "Authorization header not found",
    });
    return;
  }

  // Verify JWT and check expiration date
  try {
    const decoded = jwt.verify(token, secretKey);

    if (decoded.exp < Date.now()) {
      console.log("Token has expired");
      return;
    }
    next();
  } catch (e) {
    console.log("Token is not valid:", err);
  }
};

const containsOnly = (array1, array2) => {
  return array2.some((elem) => array1.includes(elem));
};

/* GET all stocks {name, symbol, industry} */
router.get("/symbols", async (req, res, next) => {
  const queryParams = Object.keys(req.query);
  let industry = undefined;

  // // Logic which accounts for invalid query parameters
  if (
    !(
      (queryParams.length === 1 && queryParams.includes("industry")) ||
      queryParams.length === 0
    )
  ) {
    console.error("Invalid query parameter");
    res.status(400).json({
      error: true,
      message: "Invalid query parameter: only 'industry' is permitted",
    });
    return;
  } else {
    industry = req.query.industry;
  }

  // Variable to hold the query result
  let stocks = undefined;

  // Check if the industry query paramter has been supplied
  if (industry) {
    stocks = req.db
      .from("stocks")
      .select("name", "symbol", "industry")
      // .where("industry", "like", `%${industry}%`);
  } else {
    stocks = req.db.from("stocks").select("name", "symbol", "industry");
  }

  stocks
    .then((stocks) => {
      if (stocks.length === 0) {
        console.error("Industry not found");
        throw new Error("Industry sector not found");
      }
      res.status(200).json(stocks);
    })
    .catch((err) => {
      res.status(404).json({
        error: true,
        message: "Industry sector not found",
      });
    });
});

/* GET users listing. */
router.get("/:symbol", async (req, res, next) => {
  // Check for potential query paramters supplied
  if (req.query.from || req.query.to) {
    console.error("Date query paramters supplied to wrong endpoint");
    res.status(400).json({
      error: true,
      message:
        "Date parameters only available on authenticated route /stocks/authed",
    });
    return;
  }

  // Store the symbol paramter
  const symbol = req.params.symbol;

  // Query the stock database if a stock symbol is provided, retrieves the most recent stock by default
  const queryStocks = req.db
    .from("stocks")
    .select("*")
    .where({ symbol: symbol })

  // If a stock is found, a success response is sent, else a fail response
  queryStocks.then((stocks) => {
    if (stocks.length === 0) {
      console.log("Stock not found");
      res.status(404).json({
        error: true,
        message: "No entry for symbol in stocks database",
      });
      return;
    }

    console.log("Stock found");

    const [stock] = stocks; // Gets index 0, (most recent stock)
    res.status(200).json(stock);
  });
});

/* GET users listing. */
router.get("/authed/:symbol", authorize, async (req, res, next) => {
  // Check if supplied query parameters are valid
  queryParams = Object.keys(req.query);

  if (
    !(
      queryParams.length == 0 ||
      (queryParams.length === 2 &&
        queryParams.includes("from") &&
        queryParams.includes("to")) ||
      (queryParams.length === 1 && queryParams.includes("from")) ||
      queryParams.includes("to")
    )
  ) {
    res.status(400).json({
      error: true,
      message:
        "Parameters allowed are 'from' and 'to', example: /stocks/authed/AAL?from=2020-03-15",
    });
    return;
  }

  const dateIsValid = (date) => {
    if (moment(date).isValid()) {
      return moment(date).format();
    } else {
      console.log("");
      res.status(200).json({
        error: true,
        message:
          "Parameters allowed are 'from' and 'to', example: /stocks/authed/AAL?from=2020-03-15",
      });
      return;
    }
  };

  // Stock symbol
  const symbol = req.params.symbol;

  // check if dates are valid, else they are undefined
  const from_date =
    req.query.from !== undefined ? dateIsValid(req.query.from) : null;

  const to_date = req.query.to !== undefined ? dateIsValid(req.query.to) : null;

  // Get the earliest and latest dates that are within the stocks table
  const db_latest_date = req.db.from("stocks").max("timestamp").first();
  const db_earliest_date = req.db.from("stocks").min("timestamp").first();

  // Initalize the variable to hold the query results
  let stocksQuery = undefined;

  if (from_date && to_date) {
    console.log("from_date and to_date");
    stocksQuery = req.db
      .from("stocks")
      .select("*")
      .where({ symbol: symbol })
      .whereBetween("timestamp", [from_date, to_date]);
  } else if (from_date && !to_date) {
    console.log("from_date and latest_date");
    stocksQuery = req.db
      .from("stocks")
      .select("*")
      .where({ symbol: symbol })
      .whereBetween("timestamp", [from_date, db_latest_date]);
  } else if (!from_date && to_date) {
    console.log("earliest_date and to_date");
    stocksQuery = req.db
      .from("stocks")
      .select("*")
      .where({ symbol: symbol })
      .whereBetween("timestamp", [db_earliest_date, to_date]);
  } else {
    console.log("earliest_date and latest_date");
    stocksQuery = req.db
      .from("stocks")
      .select("*")
      .where({ symbol: symbol })
      .whereBetween("timestamp", [db_earliest_date, db_latest_date]);
  }

  stocksQuery
    .then((stocks) => {
      if (stocks.length === 0) {
        console.error("No entries found");
        throw new Error(
          "No entries available for query symbol for supplied date range"
        );
      }

      console.log("Entries available");

      res.status(200).json(stocks);
    })
    .catch((err) => {
      res.status(404).json({
        error: true,
        message:
          "No entries available for query symbol for supplied date range",
      });
    });
});

module.exports = router;
