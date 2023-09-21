const express = require('express');
const mysql = require('mysql2');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const https = require('https');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const mailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use(express.json()); // To parse JSON requests
app.use(express.urlencoded({ extended: true })); // To parse form data
app.use(cookieParser());
const storage = multer.memoryStorage(); // Store the uploaded file in memory as binary data
const upload = multer({ storage: storage });

// Middleware to parse JSON requests
const jwtSecretKey = process.env.JWT_SECRET;
const accessTokenExpiry = '15m';
const refreshTokenExpiry = '15d';

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
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
    const sql = 'SELECT username, email, pfp FROM Users WHERE username = ?';

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
            email: userData.email,
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

app.post('/api/editUser/:username', verifyToken, upload.single('pfp'), (req, res) => {
    let { old_password, old_username, username, password, email } = req.body;
    password = password != '' ? password : old_password;

    if (!isValidUsername(username)) {
        res.status(400).json({ message: "Invalid username. A username must start with a letter, be between 3 and 20 characters long, and can contain letters, numbers, '.', '_', and no spaces." });
        return;
    }

    if (!isValidPassword(password)) {
        res.status(400).json({ message: "Invalid password. Only use valid characters and lengths between 5-100." });
        return;
    }

    // Check if the username or email already exists
    const checkSql = 'SELECT * FROM Users WHERE username = ? AND password = ?';
    old_password = crypto.createHash('sha256').update(old_password).digest('hex');
    const checkValues = [old_username, old_password];

    connection.execute(checkSql, checkValues, (error, results) => {
        if (error) {
            console.error('Error checking for an existing user:', error);
            res.status(500).json({ message: 'An error occurred.' });
            return;
        }

        if (results.length > 0) {
            // User with the same username or email already exists
            // Update the existing user's data
            const existingUser = results[0];
            const updateSql = 'UPDATE Users SET username = ?, password = ?, email = ?, pfp = ? WHERE user_id = ?';
            password = crypto.createHash('sha256').update(password).digest('hex'); // Hash the password with the sha256 algorithm

            // Check if a new profile picture is provided
            let pfp = null;
            if (req.file) {
                pfp = req.file.buffer; // Set pfp to the binary data of the uploaded file
            } else {
                pfp = existingUser.pfp;
            }
            
            const values = [username, password, email, pfp, existingUser.user_id]; // Include the user's ID for updating

            connection.execute(updateSql, values, (updateError) => {
                if (updateError) {
                    console.error('Error updating user data:', updateError);
                    res.status(500).json({ message: 'An error occurred while updating user data.' });
                    return;
                }

                // Generate JWT token and send it in the response
                const token = jwt.sign({ username }, jwtSecretKey, { expiresIn: accessTokenExpiry });
                const refreshToken = jwt.sign({ username }, jwtSecretKey, { expiresIn: refreshTokenExpiry });

                res.json({ success: true, message: 'User profile updated successfully!', token, refreshToken });
            });
        } else {
            res.status(400).json({ message: 'The password is incorrect.' });
        }
    });
});

app.post('/api/sendVerificationEmail', (req, res) => {
    let { email, username } = req.body;

    const sql = 'SELECT user_id FROM Users WHERE email = ? AND username = ?';
    const checkValues = [email, username];

    connection.execute(sql, checkValues, (error, results) => {
        if (error) {
            console.error('Error checking for existing email:', error);
            res.status(500).json({ message: 'An error occurred.' });
            return;
        }

        if (results.length === 0) {
            res.status(400).json({ message: "This email is not for your user or does not exist" });
            return;
        }

        smtpProtocol = mailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.JCHAT_EMAIL_ADDR,
                pass: process.env.JCHAT_APP_PASS,
            }
        });

        let mailoption = {
            from: process.env.JCHAT_EMAIL_ADDR,
            to: email,
            subject: "Please verify your JChat account email address",
            html: `<body style="height:100%;margin:0;padding:0;display:flex;"><div style="width:450px;height:600px;background:linear-gradient(to bottom left,#78e5e5,#3dc6cb,#169a95);margin:auto;text-align:center;border-radius:10px;padding:20px;font-family:sans-serif;"><a href="https://imageupload.io/6Nq3FH5HcSYhRcF"><img src="https://imageupload.io/ib/QDbvQI5KsU7QLr8_1695304766.png"alt="JChat-Logo.png"style="height:60px;width:auto;"></a><h2>Please verify your JChat account email address.</h2><h5 style="color:rgb(242,242,242);">When you verify your email, you can change your password</h5><div style="background-color:#006aff;border-radius:5px;height:50px;width:160px;margin:auto;display:flex;"><a href="https://jchat.com"style="color:white;text-decoration:none;font-size:20px;margin:auto;font-weight:bold;">Verify</a></div><h4>Thank you,<br/>The JChat Team</h4></div></body>`,
        }

        smtpProtocol.sendMail(mailoption, (err) => {
            if (err) {
                console.log(err);
                res.status(400).json({ message: "An error occurred while sending the verification email" });
            } else {
                console.log("The verification email was sent for '" + username + "'");
                res.json({ success: true, message: "The verification email was sent successfully" });
                smtpProtocol.close();
            }
        });
    });
});

// Load SSL certificate and private key
const privateKey = fs.readFileSync('key.pem', 'utf8');
const certificate = fs.readFileSync('cert.pem', 'utf8');

const credentials = { 
    key: privateKey, 
    cert: certificate,
    passphrase: process.env.CREDENTIALS_PASSPHRASE,
};

const httpsServer = https.createServer(credentials, app);
const port = 443;

// Start the server
httpsServer.listen(port, () => {
    console.log(`Server is running on port https://jchat.com`);
});