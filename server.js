const express = require('express');
const mysql = require('mysql2');
const crypto = require('crypto');
const cors = require('cors');
const session = require('express-session');

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
app.use(express.static('public'));
app.use(express.json()); // To parse JSON requests
app.use(express.urlencoded({ extended: true })); // To parse form data
app.use(cors());

// Middleware to parse JSON requests
const secretKey = crypto.randomBytes(32).toString('hex');
console.log('Generated Secret Key:', secretKey);
app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
}));

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

app.post('/api/loginUser', (req, res) => {
    let { username, password } = req.body;
    password = crypto.createHash('sha256').update(password).digest('hex');

    const checkSql = 'SELECT * FROM Users WHERE (username = ? OR email = ?) AND password = ?';
    const checkValues = [username, username, password];

    connection.execute(checkSql, checkValues, (error, results) => {
        if (error) {
            console.error('Error checking for existing user:', error);
            res.status(500).json({ message: 'An error occurred.' });
            return;
        }

        if (results.length > 0) {
            // User successfully logged in
            req.session.user = { username: username };
            console.log(`"${username}" user logged in!`);
            res.json({ success: true, message: 'User can login!' });
            return;
        } else {
            res.status(400).json({ message: "Incorrect username or password." });
            return;
        }
    });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).json({ success: false, message: 'Error logging out.' });
        } else {
            res.json({ success: true, message: 'User logged out successfully.' });
        }
    });
});

app.get('/api/checkLoggedIn', (req, res) => {
    if (!req.session.user) {
        // User is not logged in, redirect to the login page
        res.redirect('/login.html');
        return; // Important: Add return to prevent further execution
    }

    // User is logged in
    res.json({ loggedIn: true, username: req.session.user.username });
});

app.get('/index.html', (req, res) => {
    if (req.session.user) {
        // User is logged in, render index.html with user data
        const username = req.session.user.username;
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>JChat</title>
            </head>
            <body>
                <p>Hello ${username}</p>
                <a href="/api/logout">Logout</a>
            </body>
            </html>
        `;
        res.send(html);
    } else {
        // User is not logged in, redirect to the login page
        res.redirect('/login.html');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});