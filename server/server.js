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

function isValidUsername(username) {
    const validUsernameRegex = /^[a-zA-Z][a-zA-Z0-9._]{2,19}$/;
    return validUsernameRegex.test(username);
}

function isValidPassword(password) {
    if (password.length < 5 || password.length > 100)
        return false;

    const validCharactersRegex = /^[a-zA-Z0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]+$/;
    
    return validCharactersRegex.test(password);
}

app.post('/api/addUser', (req, res) => {
    let { username, password, email } = req.body;

    if (!isValidUsername(username)) {
        res.status(400).json({ message: "Invalid username. A username must start with a letter, be between 3 and 20 characters long, and can contain letters, numbers, '.', '_', and no spaces." });
        return;
    }

    if (!isValidPassword(password)) {
        res.status(400).json({ message: "Invalid password. Only use valid characters and lengths between 5-100." });
        return;
    }

    // Check if the username or email already exists
    const checkSql = 'SELECT * FROM Users WHERE username = ? OR email = ?';
    const checkValues = [username, email];

    connection.execute(checkSql, checkValues, (error, results) => {
        if (error) {
            console.error('Error checking for existing user:', error);
            res.status(500).json({ message: 'An error occurred.' });
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
                res.status(500).json({ message: 'An error occurred.' });
                return;
            }

            console.log(`"${username}" user with email of "${email}" was added successfully to the database.`);
            res.json({ success: true, message: 'User added successfully!' });
        });
    });
});

app.get('/api/loginUser', (req, res) => {
    let { username, password, email } = req.body;
    password = crypto.createHash('sha256').update(password).digest('hex');

    const checkSql = 'SELECT * FROM Users WHERE (username = ? OR email = ?) AND password = ?';
    const checkValues = [username, email, password];

    connection.execute(checkSql, checkValues, (error, results) => {
        if (error) {
            console.error('Error checking for existing user:', error);
            res.status(500).json({ message: 'An error occurred.' });
            return;
        }

        if (results.length > 0) {
            res.json({ success: true, message: 'User can login!' });
            return;
        } else {
            res.status(400).json({ message: "Incorrect username or password." });
            return;
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});