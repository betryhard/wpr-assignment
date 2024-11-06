const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const mysql = require("mysql2");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv").config();
const app = express();


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "Van122004!",
  port: 3306,
  database: "wpr",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL database.");
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.cookies.userId) {
    return next();
  }
  res.redirect("/access_denied");
}

// Routes
app.get("/", (req, res) => {
  res.render("signin");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", (req, res) => {
  const { fullName, email, password, rePassword } = req.body;
  // Add validation logic here
  if (password !== rePassword) {
    return res.redirect("/signup"); // Handle password mismatch
  }

  const query = "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)";
  db.query(query, [fullName, email, password], (err) => {
    if (err) {
      // Handle error (e.g., email already exists)
      return res.redirect("/signup");
    }
    res.redirect("/");
  });
});

app.get("/signin", (req, res) => {
  res.render("signin");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const query = "SELECT * FROM users WHERE email = ? AND password = ?";
  db.query(query, [email, password], (err, results) => {
    if (err || results.length === 0) {
      return res.redirect("/login"); // Handle user not found or incorrect password
    }
    // Set cookie with user ID
    res.cookie("userId", results[0].id, { httpOnly: true });
    res.redirect("/inbox");
  });
});

app.get("/inbox", isAuthenticated, (req, res) => {
  const userId = req.cookies.userId;
  const query = "SELECT * FROM emails WHERE receiver_id = ?";
  db.query(query, [userId], (err, results) => {
    if (err) throw err;
    res.render("inbox", { emails: results });
  });
});

app.get("/outbox", isAuthenticated, (req, res) => {
  const userId = req.cookies.userId;
  const query = "SELECT * FROM emails WHERE sender_id = ?";
  db.query(query, [userId], (err, results) => {
    if (err) throw err;
    res.render("outbox", { emails: results });
  });
});

app.get("/compose", isAuthenticated, (req, res) => {
  const userId = req.cookies.userId;
  const query = "SELECT * FROM users WHERE id != ?";
  db.query(query, [userId], (err, users) => {
    if (err) throw err;
    res.render("compose", { users });
  });
});

app.post("/compose", isAuthenticated, (req, res) => {
  const { recipientId, subject, body } = req.body;
  const userId = req.cookies.userId;
  const query = "INSERT INTO emails (sender_id, receiver_id, subject, body) VALUES (?, ?, ?, ?)";
  db.query(query, [userId, recipientId, subject, body], (err) => {
    if (err) throw err;
    res.redirect("/outbox");
  });
});

app.get("/detail/:id", isAuthenticated, (req, res) => {
  const emailId = req.params.id;
  const query = "SELECT * FROM emails WHERE id = ?";
  db.query(query, [emailId], ( err, results) => {
    if (err) throw err;
    res.render("detail", { email: results[0] });
  });
});

app.get("/signout", (req, res) => {
  res.clearCookie("userId");
  res.redirect("/");
});

app.get("/access_denied", (req, res) => {
  res.status(403).render("access_denied");
});

app.post("/api/delete-emails", isAuthenticated, (req, res) => {
  const emailIds = req.body.emailIds;
  const userId = req.cookies.userId;
  const query = "DELETE FROM emails WHERE id IN (?) AND receiver_id = ?";
  db.query(query, [emailIds, userId], (err) => {
    if (err) {
      return res.json({ success: false });
    }
    res.json({ success: true });
  });
});

app.listen(8000, () => {
  console.log('Server running at http://localhost:8000/');
}); 