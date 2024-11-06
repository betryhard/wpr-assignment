const mysql = require("mysql2/promise");
const connection = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "12082004",
  port: 3306,
  database: "wpr2201140098",
});

const dbName = "wpr";

connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL server.");

  connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, (err) => {
    if (err) throw err;
    console.log(`Database ${dbName} created or already exists.`);

    connection.query(`USE ${dbName}`, (err) => {
      if (err) throw err;

      const createUsersTable = `
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    full_name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL
                )
            `;
      connection.query(createUsersTable, (err) => {
        if (err) throw err;

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
        connection.query(createEmailsTable, (err) => {
          if (err) throw err;

          const insertUsers = `
                        INSERT INTO users (full_name, email, password) VALUES
                        ('User  One', 'user1@example.com', 'password1'),
                        ('User  Two', 'user2@example.com', 'password2'),
                        ('User  Three', 'a@a.com', '123')
                    `;
          connection.query(insertUsers, (err) => {
            if (err) throw err;

            const insertEmails = `
                            INSERT INTO emails (sender_id, receiver_id, subject, body) VALUES
                            (1, 3, 'Hello from User One', 'This is a message from User One to User Three.'),
                            (2, 3, 'Greetings', 'User  Two sends his regards.'),
                            (3, 1, 'Re: Hello', 'Thanks for your message!'),
                            (3, 2, 'Re: Greetings', 'Appreciate it!'),
                            (1, 2, 'Follow-up', 'Just checking in.'),
                            (2, 1, 'Re: Follow-up', 'All good here.'),
                            (3, 1, 'Meeting Reminder', 'Don\'t forget our meeting.'),
                            (1, 3, 'Thanks', 'Thanks for your help!')
                        `;
            connection.query(insertEmails, (err) => {
              if (err) throw err;
              console.log("Database setup complete.");
              connection.end();
            });
          });
        });
      });
    });
  });
});
