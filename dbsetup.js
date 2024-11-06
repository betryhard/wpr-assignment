const mysql = require("mysql2/promise");

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "Van122004!",
    port: 3306,
  });

  const dbName = "wpr";

  try {
    console.log("Connected to MySQL server.");

    // Create the database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database ${dbName} created or already exists.`);

    // Use the newly created database
    await connection.query(`USE \`${dbName}\``);

    // Create the users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fullName varchar(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL
      )
    `;
    await connection.query(createUsersTable);
    console.log("Users table created or already exists.");

    // Create the emails table
    const createEmailsTable = `
      CREATE TABLE IF NOT EXISTS emails (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        subject VARCHAR(255),
        body TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id),
        FOREIGN KEY (receiver_id) REFERENCES users(id)
      )
    `;
    await connection.query(createEmailsTable);
    console.log("Emails table created or already exists.");

    // Insert users into the users table
    const users = [
      { fullName: "Abc", email: "vanss1@gmail.com", password: "password1" },
      { fullName: "ABC", email: "vanss2@gmail.com", password: "password2" },
      { fullName: "BBB", email: "a@a.com", password: "123" },
    ];
    
    async function insertUsers() {
      for (const user of users) {
        try {
          const [existingUser] = await connection.query('SELECT * FROM users WHERE email = ?', [user.email]);
          if (existingUser.length === 0) {
            await connection.query('INSERT INTO users (user_no, email, password) VALUES (?, ?, ?)', [user.user_no, user.email, user.password]);
            console.log(`User ${user.email} inserted.`);
          } else {
            console.log(`User ${user.email} already exists, skipping insert.`);
          }
        } catch (err) {
          console.error("An error occurred:", err);
        }
      }
    }
    
    await insertUsers();

    // Insert emails into the emails table
    const insertEmails = `
      INSERT INTO emails (sender_id, receiver_id, subject, body) VALUES
      (1, 3, 'Hello from User One', 'This is a message from User One to User Three.'),
      (2, 3, 'Greetings', 'User  Two sends his regards.'),
      (3, 1, 'Re: Hello', 'Thanks for your message!'),
      (3, 2, 'Re: Greetings', 'Appreciate it!'),
      (1, 2, 'Follow-up', 'Just checking in.'),
      (2, 1, 'Re: Follow-up', 'All good here.'),
      (3, 1, 'Meeting Reminder', 'Do not forget our meeting.'),
      (1, 3, 'Thanks', 'Thanks for your help!')
    `;
    await connection.query(insertEmails);
    console.log("Emails inserted into the emails table.");
  } catch (err) {
    console.error("An error occurred:", err);
  } finally {
    await connection.end();
    console.log("Connection closed.");
  }
}

// Run the setup function
setupDatabase();
