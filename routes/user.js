var express = require("express");
var router = express.Router();
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");

// Secret key for JWT
const secretKey = "secret key";

/* POST username and password data and recieve a JWT */
router.post("/login", async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  // Check if the client has sent an incomplete body
  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: "Request body invalid - email and password are required",
    });
    return;
  }

  const queryUsers = req.db.from("users").select("*").where({ email: email });

  // If a user is found, a success response is sent, else a fail response
  queryUsers
    .then((users) => {
      // Could not find email given
      if (users.length === 0) {
        console.log("Login unsuccessfull: user does not exist");
        throw new Error("Incorrect email or password");
      }

      console.log("User exists");

      // Compare password hashes
      const [user] = users;
      return bcrypt.compare(password, user.hash);
    })
    .then((match) => {
      // Unsuccessfull login response
      if (!match) {
        console.log("Loging unsuccessfull: passwords do not match");
        throw new Error("Incorrect email or password");
      } else {
        console.log("Login successfull: passwords match");

        console.log("Generating a JWT for successfully logged in user");
        // Create and return a JWT token
        const expires_in = 60 * 60 * 24; // 1 Day
        const exp = Date.now() + expires_in + 1000;
        const token = jwt.sign({ email, exp }, secretKey);

        console.log("Sending JWT token to user");
        // Successfull login response
        res.status(200).json({
          token_type: "Bearer",
          token,
          expires_in,
        });
      }
    })
    .catch((err) => {
      res.status(401).json({
        error: true,
        message: "Incorrect email or password",
      });
    });
});

/* Post username and password data and register them into the database */
router.post("/register", async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  // Check if the client has sent an incomplete body
  if (!email || !password) {
    console.log("Request body incomplete - email and password needed");
    res.status(400).json({
      error: true,
      message: "Request body incomplete - email and password needed",
    });
    return;
  }

  // Get an array of users which have the email
  const queryUsers = req.db.from("users").select("*").where({ email: email });

  // If a user is found with the email, respond with a fail response,
  // else store the new user email and password has in the users table and respond with a success response
  queryUsers
    .then((users) => {
      if (users.length > 0) {
        console.log("Register unsuccessfull: user already exists");
        throw new Error("Register unsuccessfull: user already exists");
        // return;
      } else {
        // Generate the hash from the password
        const saltRounds = 10;
        const hash = bcrypt.hashSync(password, saltRounds);
        console.log("Generated password hash");

        // Insert the email and password has into the users table
        console.log("Inserted user into database");
        return req.db.from("users").insert({ email, hash });
      }
    })
    .then(() => {
      console.log("Register successfull");
      res.status(201).json({
        success: true,
        message: "User created",
      });
    })
    .catch((err) => {
      res.status(409).json({
        error: true,
        message: "User already exists!",
      });
    });
});

module.exports = router;
