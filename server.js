const express = require('express');
const mysql = require('mysql2');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

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

// Middleware to parse JSON requests
const jwtSecretKey = '8f2f5c3d113379d9247386841bb17b8cdbd302f272723beacb0fd4ad13080959'

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
            // Generate JWT token and send it in the response
            const token = jwt.sign({ username }, jwtSecretKey, { expiresIn: '1h' });
            res.json({ success: true, message: 'User added successfully!', token });
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
            const token = jwt.sign({ username }, jwtSecretKey, { expiresIn: '1h' });
            res.json({ success: true, message: 'User can login!', token });
        } else {
            res.status(400).json({ message: "Incorrect username or password." });
        }
    });
});

const revokedTokens = [];

function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        if (revokedTokens.includes(token)) {
            return res.status(403).json({ message: 'Token has been revoked' });
        }

        jwt.verify(token, jwtSecretKey, (err, decoded) => {
            if (err) {
                console.error('Error verifying token:', err);
                return res.status(403).json({ message: 'Invalid token' });
            }
            req.user = decoded;
            next();
        });
    } else {
        return res.status(403).json({ message: 'Token not provided' });
    }
}

app.get('/api/checkLoggedIn', verifyToken, (req, res) => {
    // Check if the user is logged in
    if (req.user) {
        // User is logged in
        res.json({ loggedIn: true, username: req.user.username });
    } else {
        // User is not logged in
        res.json({ loggedIn: false });
    }
});

app.post('/api/refresh-token', (req, res) => {
    const { accessToken, refreshToken } = req.body;

    // Verify that the refresh token is valid
    jwt.verify(refreshToken, jwtSecretKey, (err, decoded) => {
        if (err) {
            console.error('Error verifying refresh token:', err);
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        // Generate a new access token
        const newAccessToken = jwt.sign({ username: decoded.username }, jwtSecretKey, { expiresIn: '1h' });

        // Send the new access token to the client
        res.json({ success: true, message: 'New access token generated', accessToken: newAccessToken });
    });
});

app.post('/api/logout', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token && !revokedTokens.includes(token)) {
        revokedTokens.push(token);
        res.json({ success: true, message: 'Token revoked successfully' });
    } else {
        res.status(400).json({ message: 'Invalid token' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});