const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const mysql = require("mysql2");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv").config();
const multer = require("multer");
const app = express();
const port = 8000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "vanvan202020",
    resave: false,
    saveUninitialized: true,
  })
);

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "12082004",
  port: 3306,
  database: "wpr2201140098",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL database.");
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect("/access_denied");
}

// Routes
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", (req, res) => {
  const { fullName, email, password, rePassword } = req.body;
  // Add validation logic here
  const query =
    "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)";
  db.query(query, [fullName, email, password], (err) => {
    if (err) {
      // Handle error (e.g., email already exists)
      return res.redirect("/signup");
    }
    res.redirect("/");
  });
});

app.get("/inbox", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const query = "SELECT * FROM emails WHERE receiver_id = ?";
  db.query(query, [userId], (err, results) => {
    if (err) throw err;
    res.render("inbox", { emails: results });
  });
});

app.get("/outbox", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const query = "SELECT * FROM emails WHERE sender_id = ?";
  db.query(query, [userId], (err, results) => {
    if (err) throw err;
    res.render("outbox", { emails: results });
  });
});

app.get("/compose", isAuthenticated, (req, res) => {
  const query = "SELECT * FROM users WHERE id != ?";
  db.query(query, [req.session.user.id], (err, users) => {
    if (err) throw err;
    res.render("compose", { users });
  });
});

app.post("/compose", isAuthenticated, (req, res) => {
  const { recipientId, subject, body } = req.body;
  const query =
    "INSERT INTO emails (sender_id, receiver_id, subject, body) VALUES (?, ?, ?, ?)";
  db.query(query, [req.session.user.id, recipientId, subject, body], (err) => {
    if (err) throw err;
    res.redirect("/outbox");
  });
});

app.get("/detail/:id", isAuthenticated, (req, res) => {
  const emailId = req.params.id;
  const query = "SELECT * FROM emails WHERE id = ?";
  db.query(query, [emailId], (err, results) => {
    if (err) throw err;
    res.render("detail", { email: results[0] });
  });
});

app.get("/signout", (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect("/");
  });
});

app.get("/access_denied", (req, res) => {
  res.status(403).render("access_denied");
});

app.post("/api/delete-emails", isAuthenticated, (req, res) => {
  const emailIds = req.body.emailIds;
  const query = "DELETE FROM emails WHERE id IN (?) AND receiver_id = ?";
  db.query(query, [emailIds, req.session.user.id], (err) => {
    if (err) {
      return res.json({ success: false });
    }
    res.json({ success: true });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
