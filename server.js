const express = require('express');
const mysql = require('mysql2');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const https = require('https');
const cookieParser = require('cookie-parser');

const app = express();

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use(express.json()); // To parse JSON requests
app.use(express.urlencoded({ extended: true })); // To parse form data
app.use(cookieParser());

// Middleware to parse JSON requests
const jwtSecretKey = '8f2f5c3d113379d9247386841bb17b8cdbd302f272723beacb0fd4ad13080959'
const accessTokenExpiry = '15m';
const refreshTokenExpiry = '15d';

const connection = mysql.createConnection({
    host: 'jchat.com',
    user: 'jibel',
    password: 'Arman@511!',
    database: 'JChat',
});

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
        const sql = 'INSERT INTO Users (username, password, email, pfp) VALUES (?, ?, ?, ?)';
        password = crypto.createHash('sha256').update(password).digest('hex'); // Hash the password with the sha256 algorithm
        const defaultProfilePicturePath = 'public/assets/images/new_user_pfp.jpg';

        // Read the default profile picture file as binary data
        fs.readFile(defaultProfilePicturePath, (readError, imageBinaryData) => {
            if (readError) {
                console.error('Error reading default profile picture:', readError);
                res.status(500).json({ message: 'An error occurred.' });
                return;
            }

            const values = [username, password, email, imageBinaryData]; // Include the image binary data in values

            connection.execute(sql, values, (error) => {
                if (error) {
                    console.error('Error in adding user!');
                    res.status(500).json({ message: 'An error occurred.' });
                    return;
                }

                console.log(`'${username}' successfully signed up!`)

                // Generate JWT token and send it in the response
                const token = jwt.sign({ username }, jwtSecretKey, { expiresIn: accessTokenExpiry });
                const refreshToken = jwt.sign({ username }, jwtSecretKey, { expiresIn: refreshTokenExpiry });

                res.json({ success: true, message: 'User added successfully!', token, refreshToken });
            });
        });
    });
});

app.post('/api/loginUser', (req, res) => {
    let { username, password } = req.body;
    // Hash the password with the sha256 algorithm to check it with the hashed password
    password = crypto.createHash('sha256').update(password).digest('hex');

    // Check if any user exists with the given username or email address and password
    const checkSql = 'SELECT * FROM Users WHERE (username = ? OR email = ?) AND password = ?';
    const checkValues = [username, username, password];

    connection.execute(checkSql, checkValues, (error, results) => {
        if (error) {
            console.error('Error checking for existing user:', error);
            res.status(500).json({ message: 'An error occurred.' });
            return;
        }

        if (results.length > 0) {
            // So SQL query worked and found the user, so the user successfully logged in
            // Generate JWT token and send it in the response
            console.log(`'${username}' successfully logged in!`)

            const token = jwt.sign({ username }, jwtSecretKey, { expiresIn: accessTokenExpiry });
            const refreshToken = jwt.sign({ username }, jwtSecretKey, { expiresIn: refreshTokenExpiry });

            res.json({ success: true, message: 'User can login!', token, refreshToken });
        } else {
            res.status(400).json({ message: "Incorrect username or password." });
        }
    });
});

function verifyTokenForCheckLoggedIn(req, res, next) {
    const refreshToken = req.headers.authorization?.split(' ')[1];
    if (refreshToken) {
        jwt.verify(refreshToken, jwtSecretKey, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid refresh token' });
            }
            req.user = decoded;
            next();
        });
    } else {
        return res.status(403).json({ message: 'Refresh token not provided' });
    }
}

app.get('/api/checkLoggedIn', verifyTokenForCheckLoggedIn, (req, res) => {
    // Check if the user is logged in
    if (req.user) {
        // User is logged in
        const token = jwt.sign({ username: req.user.username }, jwtSecretKey, { expiresIn: accessTokenExpiry });
        res.json({ loggedIn: true, username: req.user.username, accessToken: token });
    } else {
        // User is not logged in
        res.json({ loggedIn: false });
    }
});

function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: 'Access token not provided' });
    }

    jwt.verify(token, jwtSecretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid access token' });
        }

        req.user = decoded; // Attach the user information to the request object
        next(); // Continue to the next middleware or route handler
    });
}

app.get('/api/getUserProfile/:username', verifyToken, (req, res) => {
    const requestedUsername = req.params.username;
    const sql = 'SELECT username, pfp FROM Users WHERE username = ?';

    connection.execute(sql, [requestedUsername], (error, results) => {
        if (error) {
            console.error('Error fetching user profile:', error);
            res.status(500).json({ message: 'An error occurred.' });
            return;
        }

        if (results.length === 0) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }

        const userData = results[0];

        res.json({
            success: true,
            username: userData.username,
            profilePicture: userData.pfp,
        });
    });
});

app.post('/api/refresh-token', (req, res) => {
    const { refreshToken } = req.body;

    // Verify the refresh token
    jwt.verify(refreshToken, jwtSecretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        // Generate a new access token with the updated expiration time
        const newAccessToken = jwt.sign({ username: decoded.username }, jwtSecretKey, { expiresIn: accessTokenExpiry });

        // Send only the new access token to the client
        res.json({ success: true, message: 'New access token generated', accessToken: newAccessToken });
    });
});

const revokedTokens = [];

app.post('/api/logout', (req, res) => {
    const token = req.cookies.token; // Retrieve access token from cookies
    if (token && !revokedTokens.includes(token)) {
        revokedTokens.push(token);
        const username = jwt.decode(token).username; // Decode the token to get the username
        console.log(`'${username}' successfully logged out!`);
        res.clearCookie('token'); // Clear the access token cookie
        res.json({ success: true, message: 'Token revoked successfully' });
    } else {
        res.status(400).json({ message: 'Invalid token' });
    }
});

// Load SSL certificate and private key
const privateKey = fs.readFileSync('key.pem', 'utf8');
const certificate = fs.readFileSync('cert.pem', 'utf8');

const credentials = { 
    key: privateKey, 
    cert: certificate,
    passphrase: 'Arman@511!'
};

const httpsServer = https.createServer(credentials, app);
const port = 443;

// Start the server
httpsServer.listen(port, () => {
    console.log(`Server is running on port https://jchat.com`);
});