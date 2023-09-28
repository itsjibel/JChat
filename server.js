const express = require('express');
const mysql = require('mysql2');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const https = require('https');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const mailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use(express.json()); // To parse JSON requests
app.use(express.urlencoded({ extended: true })); // To parse form data
app.use(cookieParser());
app.use(cors());
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

app.post('/api/signup', (req, res) => {
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
    const checkSql = 'SELECT * FROM Users WHERE BINARY username = ? OR email = ?';
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
        password = crypto.createHash('sha256').update(password).digest('hex'); // Hash the password with the sha256 algorithm
        const defaultProfilePicturePath = 'public/assets/images/new_user_pfp.jpg';
        
        // Read the default profile picture file as binary data
        fs.readFile(defaultProfilePicturePath, (readError, imageBinaryData) => {
            if (readError) {
                console.error('Error reading default profile picture:', readError);
                res.status(500).json({ message: 'An error occurred.' });
                return;
            }
            
            const sql = 'INSERT INTO Users (username, password, email, pfp) VALUES (?, ?, ?, ?)';
            const values = [username, password, email, imageBinaryData]; // Include the image binary data in values
            connection.execute(sql, values, (error) => {
                if (error) {
                    console.error(error);
                    res.status(500).json({ message: 'An error occurred.' });
                    return;
                }

                console.log(`'${username}' successfully signed up!`)

                // Generate JWT token and send it in the response
                const token = jwt.sign({ username }, jwtSecretKey, { expiresIn: accessTokenExpiry });
                const refreshToken = jwt.sign({ username }, jwtSecretKey, { expiresIn: refreshTokenExpiry });

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
                    subject: "Welcome to the JChat community",
                    html:
                    `<body style="height: 100%; margin: 0; padding: 0; display: flex;">
                        <div style="width: 450px; height: 600px; background: linear-gradient(to bottom left, #78e5e5, #3dc6cb, #169a95); margin: auto; text-align: center; border-radius: 10px; padding: 20px; font-family: sans-serif;">
                            <a href="https://imageupload.io/6Nq3FH5HcSYhRcF"><img src="https://imageupload.io/ib/QDbvQI5KsU7QLr8_1695304766.png"alt="JChat-Logo.png"style="height:60px;width:auto;"></a>
                            <h1>Hello ` + username + `</h1>
                            <h2>You signed up for the JChat successfully!</h2>
                            <h3>A warm welcome to you from the JChat team.</h3>
                            <h4>Thank you,<br/>The JChat Team</h4>
                        </div>
                    </body>`
                }
        
                smtpProtocol.sendMail(mailoption, (err) => {
                    if (err) {
                        console.log(err);
                        res.status(400).json({ message: "An error occurred while sending the welcome email" });
                    } else {
                        console.log("The welcome email was sent for '" + results[0].email + "'");
                        res.json({ success: true, message: "The welcome email was sent successfully" });
                        smtpProtocol.close();
                    }
                });

                res.json({ success: true, message: 'User added successfully!', token, refreshToken });
            });
        });
    });
});

app.post('/api/login', (req, res) => {
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

function verifyRefreshToken(req, res, next) {
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

app.get('/api/checkLoggedIn', verifyRefreshToken, (req, res) => {
    // Check if the user is logged in
    if (req.user) {
        const checkSql = 'SELECT * FROM Users WHERE BINARY username = ?';
        const checkValue = [req.user.username];

        connection.execute(checkSql, checkValue, (error, results) => {
            if (error) {
                console.error('Error checking for existing user:', error);
                res.status(500).json({ message: 'An error occurred.' });
                return;
            }

            if (results.length === 0) {
                // User doesn't exist
                res.json({ loggedIn: false });
            } else {
                // User exists
                const token = jwt.sign({ username: req.user.username }, jwtSecretKey, { expiresIn: accessTokenExpiry });
                res.json({ loggedIn: true, username: req.user.username, accessToken: token });
            }
        });
    } else {
        // User is not logged in
        res.json({ loggedIn: false });
    }
});

function verifyAccessToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: 'Access token not provided' });
    }

    jwt.verify(token, jwtSecretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid access token' + token });
        }

        req.user = decoded; // Attach the user information to the request object
        next(); // Continue to the next middleware or route handler
    });
}

app.get('/api/profile/:username', verifyAccessToken, (req, res) => {
    const requestedUsername = req.params.username;
    const sql = 'SELECT username, email, is_email_verified, pfp FROM Users WHERE BINARY username = ?';

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
            isEmailVerified: userData.is_email_verified,
        });
    });
});

app.post('/api/refreshAccessToken', (req, res) => {
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

app.post('/api/editProfile/:username', verifyAccessToken, upload.single('pfp'), (req, res) => {
    let { old_password, old_username, old_email, username, password, email } = req.body;
    password = password != '' ? password : old_password;

    if (!isValidUsername(username)) {
        res.status(400).json({ message: "Invalid username. A username must start with a letter, be between 3 and 20 characters long, and can contain letters, numbers, '.', '_', and no spaces." });
        return;
    }

    if (!isValidPassword(password)) {
        res.status(400).json({ message: "Invalid password. Only use valid characters and lengths between 5-100." });
        return;
    }

    const checkSqlDuplicate = 'SELECT username, email FROM Users WHERE BINARY username = ? OR email = ?';
    const checkValuesDuplicate = [username, email];

    connection.execute(checkSqlDuplicate, checkValuesDuplicate, (error, results) => {
        if (error) {
            console.error('Error checking for an existing user:', error);
            res.status(500).json({ message: 'An error occurred.' });
            return;
        }

        if (results.length === 2 || (results.length === 1 && (results[0].username != old_username && results[0].email != old_email))) {
            console.log('Old email:', old_email, 'Old username:', old_username, 'Result username', results[0].username, 'Result email', results[0].email);
            res.status(400).json({ message: 'This email or username is already in use.' });
            return;
        }

        // Check if the username or email already exists
        const checkSql = 'SELECT * FROM Users WHERE BINARY ' + (results.length === 0 ? 'username' : old_username != results[0].username ? 'email' : 'username') + ' = ? AND password = ?';
        old_password = crypto.createHash('sha256').update(old_password).digest('hex');
        const checkValues = [results.length === 0 ? old_username : old_username != results[0].username ? old_email : old_username, old_password];

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
                password = crypto.createHash('sha256').update(password).digest('hex'); // Hash the password with the sha256 algorithm

                // Check if a new profile picture is provided
                let pfp = null;
                if (req.file) {
                    pfp = req.file.buffer; // Set pfp to the binary data of the uploaded file
                } else {
                    pfp = existingUser.pfp;
                }
                
                let is_email_verified = results[0].is_email_verified;

                if (email != results[0].email) {
                    is_email_verified = 0;
                }

                const values = [username, password, email, pfp, is_email_verified, existingUser.user_id]; // Include the user's ID for updating
                const updateSql = 'UPDATE Users SET username = ?, password = ?, email = ?, pfp = ?, is_email_verified = ? WHERE user_id = ?';

                connection.execute(updateSql, values, (updateError) => {
                    if (updateError) {
                        console.error('Error updating user data:', updateError);
                        res.status(500).json({ message: 'An error occurred while updating user data.' });
                        return;
                    }

                    // Generate JWT token and send it in the response
                    const token = jwt.sign({ username }, jwtSecretKey, { expiresIn: accessTokenExpiry });
                    const refreshToken = jwt.sign({ username }, jwtSecretKey, { expiresIn: refreshTokenExpiry });
                    console.log(`'${username}' updated his/her profile`);

                    res.json({ success: true, message: 'User profile updated successfully!', token, refreshToken });
                });
            } else {
                res.status(400).json({ message: 'The password is incorrect.' });
            }
        });
    });
});

app.post('/api/sendVerificationEmail', verifyAccessToken, (req, res) => {
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

        let token = crypto.randomBytes(64).toString('hex');

        let mailoption = {
            from: process.env.JCHAT_EMAIL_ADDR,
            to: email,
            subject: "Please verify your JChat account email address",
            html:
            `<body style="height: 100%; margin: 0; padding: 0; display: flex;">
                <div style="width: 450px; height: 600px; background: linear-gradient(to bottom left, #78e5e5, #3dc6cb, #169a95); margin: auto; text-align: center; border-radius: 10px; padding: 20px; font-family: sans-serif;">
                    <img src="public/assets/images/JChat-Logo.png" alt="" style="height: 60px; width: auto;">
                    <h2>Hello `+ username + `, please verify your JChat account email address.</h2>
                    <h5 style="color: rgb(242, 242, 242);">When you verify your email, you can change your password</h5>
                    <div style="background-color: #006aff; border-radius: 5px; height: 50px; width: 160px; margin: auto; display: flex;">
                        <a href="https://jchat.com/api/verifyUserEmail?token=` + token + '&username=' + username + `"style="color:white;text-decoration:none;font-size:20px;margin:auto;font-weight:bold;">Verify</a>
                    </div>
                    <h4>Thank you,<br/>The JChat Team</h4>
                </div>
            </body>`,
        }

        smtpProtocol.sendMail(mailoption, (err) => {
            if (err) {
                console.log(err);
                res.status(400).json({ message: "An error occurred while sending the verification email" });
            } else {
                const updateSql = 'UPDATE Users SET verify_email_token = ? WHERE BINARY username = ?';
                const updateValues = [token, username];
                connection.execute(updateSql, updateValues, (error) => {
                    if (error) {
                        console.error('Error while setting verify_email_token column:', error);
                        res.status(500).json({ message: 'An error occurred.' });
                        return;
                    }
                });

                console.log("The verification email was sent for '" + email + "'");
                res.json({ success: true, message: "The verification email was sent successfully" });
                smtpProtocol.close();
            }
        });
    });
});

app.get('/api/verifyUserEmail', (req, res) => {
    const { token, username } = req.query;
    const sql = 'SELECT email, verify_email_token FROM Users WHERE BINARY username = ?';
    const checkValue = [username];

    connection.execute(sql, checkValue, (error, results) => {
        if (error || results.length === 0) {
            res.redirect("https://jchat.com/emailVerification.html?success=false");
            return;
        }

        if (token === results[0].verify_email_token) {
            const updateSql = 'UPDATE Users SET is_email_verified = 1, verify_email_token = NULL WHERE BINARY username = ?';
            connection.execute(updateSql, checkValue, (updateError) => {
                if (updateError) {
                    res.redirect("https://jchat.com/emailVerification.html?success=false");
                    return;
                }
            });

            smtpProtocol = mailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.JCHAT_EMAIL_ADDR,
                    pass: process.env.JCHAT_APP_PASS,
                }
            });

            let mailoption = {
                from: process.env.JCHAT_EMAIL_ADDR,
                to: results[0].email,
                subject: "Your email is verified successfully",
                html:
                `<body style="height: 100%; margin: 0; padding: 0; display: flex;">
                    <div style="width: 450px; height: 600px; background: linear-gradient(to bottom left, #78e5e5, #3dc6cb, #169a95); margin: auto; text-align: center; border-radius: 10px; padding: 20px; font-family: sans-serif;">
                        <a href="https://imageupload.io/6Nq3FH5HcSYhRcF"><img src="https://imageupload.io/ib/QDbvQI5KsU7QLr8_1695304766.png"alt="JChat-Logo.png"style="height:60px;width:auto;"></a>
                        <h1>Hello ` + username + `</h1>
                        <h2>You verified your JChat account email successfully!</h2>
                        <h4>Thank you,<br/>The JChat Team</h4>
                    </div>
                </body>`
            }
    
            smtpProtocol.sendMail(mailoption, (err) => {
                if (err) {
                    console.log(err);
                    res.status(400).json({ message: "An error occurred while sending the successful email verification email" });
                } else {
                    res.json({ success: true, message: "The successful email verification email was sent successfully" });
                    smtpProtocol.close();
                }
            });

            console.log("'" + username + "' verified his/her email")
            res.redirect("https://jchat.com/emailVerification.html?success=true");
        } else {
            res.redirect("https://jchat.com/emailVerification.html?success=false");
        }
    });
});

app.post('/api/sendPasswordRecoveryEmail', (req, res) => {
    let { username, } = req.body;

    const sql = 'SELECT email FROM Users WHERE BINARY username = ? AND is_email_verified = 1';
    const checkValues = [username];

    connection.execute(sql, checkValues, (error, results) => {
        if (error) {
            console.error('Error checking for existing user:', error);
            res.status(500).json({ message: 'An error occurred.' });
            return;
        }

        if (results.length === 0) {
            res.status(400).json({ message: "This user email is not verified or this user does not exist" });
            return;
        }


        const updateSql = 'UPDATE Users SET recover_password_token = ? WHERE BINARY username = ?';
        let token = crypto.randomBytes(64).toString('hex');
        const updateValues = [token, username];
        connection.execute(updateSql, updateValues, (error) => {
            if (error) {
                console.error('Error while setting recover_password_token column:', error);
                res.status(500).json({ message: 'An error occurred.' });
                return;
            }
        });

        smtpProtocol = mailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.JCHAT_EMAIL_ADDR,
                pass: process.env.JCHAT_APP_PASS,
            }
        });

        let mailoption = {
            from: process.env.JCHAT_EMAIL_ADDR,
            to: results[0].email,
            subject: "Recover your JChat account password",
            html:
            `<body style="height: 100%; margin: 0; padding: 0; display: flex;">
                <div style="width: 450px; height: 600px; background: linear-gradient(to bottom left, #78e5e5, #3dc6cb, #169a95); margin: auto; text-align: center; border-radius: 10px; padding: 20px; font-family: sans-serif;">
                    <a href="https://imageupload.io/6Nq3FH5HcSYhRcF"><img src="https://imageupload.io/ib/QDbvQI5KsU7QLr8_1695304766.png"alt="JChat-Logo.png"style="height:60px;width:auto;"></a>
                    <h1>Hello ` + username + `</h1>
                    <h2>To recover your user password, please click on the button below:</h2>
                    <div style="background-color: #006aff; border-radius: 5px; height: 50px; width: 240px; margin: auto; display: flex;">
                        <a href="https://jchat.com/recoverPassword.html?token=` + token + '&username=' + username + `" style="color: white; text-decoration: none; font-size: 20px; margin: auto; font-weight: bold;">Recover Password</a>
                    </div>
                    <h4>Thank you,<br/>The JChat Team</h4>
                </div>
            </body>`
        }

        smtpProtocol.sendMail(mailoption, (err) => {
            if (err) {
                console.log(err);
                res.status(400).json({ message: "An error occurred while sending the password recovery email" });
            } else {
                console.log("The password recovery email was sent for '" + results[0].email + "'");
                res.json({ success: true, message: "The password recovery email was sent successfully" });
                smtpProtocol.close();
            }
        });
    });
});

app.get('/api/isValidRecoverPasswordToken', (req, res) => {
    const { token, username } = req.query;
    const sql = 'SELECT recover_password_token FROM Users WHERE BINARY username = ?';
    const checkValue = [username];

    connection.execute(sql, checkValue, (error, results) => {
        if (error || results.length === 0) {
            res.status(500).json({ message: "An error occurred" });
            return;
        }

        if (token === results[0].recover_password_token && results[0].recover_password_token != null) {
            res.json({ success: true, message: "The password recovery token is valid" });
        } else {
            res.status(400).json({ message: "Invalid password recovery token" });
        }
    });
});

app.get('/api/recoverUserPassword', (req, res) => {
    let { token, password, username } = req.query;

    const sql = 'SELECT email, recover_password_token FROM Users WHERE BINARY username = ?';
    const checkValue = [username];

    connection.execute(sql, checkValue, (error, results) => {
        if (error || results.length === 0) {
            res.status(500).json({ message: "An error occurred" });
            return;
        }

        if (token === results[0].recover_password_token && results[0].recover_password_token != null) {
            if (!isValidPassword(password)) {
                res.status(400).json({ message: "Invalid password. Only use valid characters and lengths between 5-100." });
                return;
            }

            const updateSql = 'UPDATE Users SET password = ?, recover_password_token = NULL WHERE BINARY username = ?';
            password = crypto.createHash('sha256').update(password).digest('hex');
            const updateValues = [password, username];
            const email = results[0].email;

            connection.execute(updateSql, updateValues, (error, results) => {
                if (error) {
                    res.status(500).json({ message: "An error occurred" });
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
                    subject: "Your password is updated successfully",
                    html:
                    `<body style="height: 100%; margin: 0; padding: 0; display: flex;">
                        <div style="width: 450px; height: 600px; background: linear-gradient(to bottom left, #78e5e5, #3dc6cb, #169a95); margin: auto; text-align: center; border-radius: 10px; padding: 20px; font-family: sans-serif;">
                            <a href="https://imageupload.io/6Nq3FH5HcSYhRcF"><img src="https://imageupload.io/ib/QDbvQI5KsU7QLr8_1695304766.png"alt="JChat-Logo.png"style="height:60px;width:auto;"></a>
                            <h1>Hello ` + username + `</h1>
                            <h2>You changed your JChat account password successfully.</h2>
                            <h4>Thank you,<br/>The JChat Team</h4>
                        </div>
                    </body>`
                }
        
                smtpProtocol.sendMail(mailoption, (err) => {
                    if (err) {
                        console.log(err);
                        res.status(400).json({ message: "An error occurred while sending the password recovery email" });
                    } else {
                        res.json({ success: true, message: "The password recovery email was sent successfully" });
                        smtpProtocol.close();
                    }
                });

                res.json({ success: true, message: "The password is updated successfully" });
                console.log("'" + username + "' updated the password successfully");
            });
        } else {
            res.status(400).json({ message: "Invalid password recovery token" });
        }
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
const io = require('socket.io')(httpsServer);

// Maintain a list of connected sockets
const connectedSockets = new Set();

// Middleware to verify WebSocket connections
io.use((socket, next) => {
    const token = socket.handshake.query.token; // Get the token from the WebSocket handshake query

    // Verify the token (similar to how you verify access tokens)
    jwt.verify(token, jwtSecretKey, (err, decoded) => {
        if (err) {
            return next(new Error('Authentication error'));
        }
        socket.user = decoded; // Attach the user information to the socket
        connectedSockets.add(socket); // Add the socket to the connectedSockets set
        next();
    });
});

// WebSocket connection event
io.on('connection', (socket) => {
    // Access the authenticated user information via socket.user
    console.log(`'${socket.user.username}' connected`);
    const sql = 'SELECT sender_username, receiver_username, is_accepted FROM FriendRequests WHERE BINARY sender_username = ? OR BINARY receiver_username = ?';
    const values = [socket.user.username, socket.user.username]; // Include the image binary data in values
    connection.execute(sql, values, (error, results) => {
        if (error) {
            console.error(error);
            return;
        }

        io.to(socket.id).emit('friendRequest', results);
    });

    socket.on('refreshFriendRequests', () => {
        const sql = 'SELECT sender_username, receiver_username, is_accepted FROM FriendRequests WHERE BINARY sender_username = ? OR BINARY receiver_username = ?';
        const values = [socket.user.username, socket.user.username]; // Include the image binary data in values
        connection.execute(sql, values, (error, results) => {
            if (error) {
                console.log(error);
                res.status(500).json({ message: "An error occurred" });
                return;
            }

            io.to(socket.id).emit('friendRequest', results);
        });
    });

    // Handle other WebSocket events here

    // Handle disconnection
    socket.on('disconnect', () => {
        connectedSockets.delete(socket); // Remove the socket from the connectedSockets set
    });
});

// Update all connected sockets with friend request count
function updateFriendRequestCount(results, username) {
    for (const socket of connectedSockets) {
        if (username === socket.user.username) {
            io.to(socket.id).emit('friendRequest', results);
        }
    }
}

app.post('/api/sendFriendRequest/:username', verifyAccessToken, (req, res) => {
    const senderUsername = req.body.sender_username;
    const receiverUsername = req.params.username;
    const sql = 'INSERT INTO FriendRequests (sender_username, receiver_username, is_accepted) VALUES (?, ?, false)';
    const values = [senderUsername, receiverUsername]; // Include the image binary data in values

    connection.execute(sql, values, (error) => {
        if (error) {
            console.error(error);
            res.status(500).json({ message: 'An error occurred.' });
            return;
        }

        console.log(`'${senderUsername}' sent a friend request to '${receiverUsername}'`);

        const countFriendRequestsSql = 'SELECT sender_username, is_accepted FROM FriendRequests WHERE BINARY receiver_username = ?';
        const countFriendRequestsValues = [receiverUsername]; // Include the image binary data in values
        connection.execute(countFriendRequestsSql, countFriendRequestsValues, (error, results) => {
            if (error) {
                console.error(error);
                res.status(500).json({ message: 'An error occurred.' });
                return;
            }

            // Emit the friendRequest event to all connected sockets
            updateFriendRequestCount(results, receiverUsername);

            res.json({ success: true, message: "The friend request was sent successfully" });
        });
    });
});

app.post('/api/acceptFriendRequest/:username', verifyAccessToken, (req, res) => {
    const senderUsername = req.body.sender_username;
    const receiverUsername = req.params.username;

    const values = [receiverUsername, senderUsername];
    const updateSql = 'UPDATE FriendRequests SET is_accepted = true WHERE BINARY sender_username = ? AND BINARY receiver_username = ?';

    connection.execute(updateSql, values, (error) => {
        if (error) {
            console.error(error);
            res.status(500).json({ message: 'An error occurred.' });
            return;
        }

        console.log(`'${senderUsername}' accepted a friend request from '${receiverUsername}'`);

        const countFriendRequestsSql = 'SELECT sender_username, is_accepted FROM FriendRequests WHERE BINARY receiver_username = ?';
        const countFriendRequestsValues = [receiverUsername]; // Include the image binary data in values
        connection.execute(countFriendRequestsSql, countFriendRequestsValues, (error, results) => {
            if (error) {
                console.error(error);
                res.status(500).json({ message: 'An error occurred.' });
                return;
            }

            // Emit the friendRequest event to all connected sockets
            updateFriendRequestCount(results, senderUsername);

            res.json({ success: true, message: "The friend request was sent successfully" });
        });
    });
});

// Handle checking friend requests
app.post('/api/checkFriendRequest', verifyRefreshToken, (req, res) => {
    const { sender_username, receiver_username } = req.body;

    const sql = 'SELECT is_accepted FROM FriendRequests WHERE (BINARY sender_username = ? AND BINARY receiver_username = ?) OR (BINARY receiver_username = ? AND BINARY sender_username = ?)';
    const values = [sender_username, receiver_username, sender_username, receiver_username]; // Include the image binary data in values

    connection.execute(sql, values, (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).json({ message: 'An error occurred.' });
            return;
        }

        if (results.length > 0) {
            res.json({ success: true, message: results[0].is_accepted });
        } else {
            res.json({ success: false, message: "This request hasn't been sent before" });
        }
    });
});

// Start the server
httpsServer.listen(port, () => {
    console.log(`Server is running on port https://jchat.com`);
});