var express = require("express");
var router = express.Router();


const table = knex({ stocks: "stocks" });

/* GET users listing. */
router.get("/symbols", function (req, res, next) {
  console.log(table.select());
  res.send("hi");
});

/* GET users listing. */
router.get("/:symbol", function (req, res, next) {
  res.send("Symbol");
});

/* GET users listing. */
router.get("/authed/:symbol", function (req, res, next) {
  res.send("Authed Symbol");
});

module.exports = router;
