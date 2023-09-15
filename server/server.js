const express = require('express');
const mysql = require('mysql2');
const crypto = require('crypto');
const app = express();
const port = 8000;

// Database connection configuration
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'jibel',
    password: 'Arman@511!',
    database: 'JChat',
});

// Serve static files from the 'public' directory
app.use(express.static('../public'));

// Middleware to parse JSON requests
app.use(express.urlencoded({ extended: true }));

app.post('/api/addUser', (req, res) => {
    let { username, password, email } = req.body;

    // Check if the username or email already exists
    const checkSql = 'SELECT * FROM Users WHERE username = ? OR email = ?';
    const checkValues = [username, email];

    connection.execute(checkSql, checkValues, (error, results) => {
        if (error) {
            console.error('Error checking for existing user:', error);
            res.status(500).json({ message: error });
            return;
        }

        if (results.length > 0) {
            // User with the same username or email already exists
            res.status(400).json({ message: 'Username or email already in use.' });
            return;
        }

        // If no user with the same username or email exists, proceed with insertion
        const sql = 'INSERT INTO Users (username, password, email) VALUES (?, ?, ?)';
        password = crypto.createHash('sha256').update(password).digest('hex');
        const values = [username, password, email];

        connection.execute(sql, values, (insertError) => {
            if (insertError) {
                console.error('Error in adding user!');
                res.status(500).json({ message: insertError });
                return;
            }

            console.log(`"${username}" user with email of "${email}" was added successfully to the database.`);
            res.json({ success: true, message: 'User added successfully!' });
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});