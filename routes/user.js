var express = require("express");
var router = express.Router();

/* POST username and password data and recieve a JWT */
router.post("/login", function (req, res, next) {
  res.send("respond with a resource");
});

/* Post username and password data and register them into the database */
router.post("/register", function (req, res, next) {
  res.send("respond with a resource");
});

module.exports = router;
