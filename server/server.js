const express = require('express');
const mysql = require('mysql2');
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
app.use(express.json());

// Add an item to the database using parameterized query
app.post('/api/addUser', (req, res) => {
    // Retrieve item data from the request body
    const { username, password, email } = req.body;

    // Insert the new item into the database with parameterized query
    const sql = 'INSERT INTO Users (username, password, email) VALUES (?, ?, ?)';
    const values = [username, password, email];

    connection.execute(sql, values, (error) => {
        if (error) {
            console.error('Error inserting item:', error);
            res.status(500).json({ message: 'Error adding item. Please try again.' });
            return;
        }

        console.log(`A user with the username of \"${username}\" and the email of \"${email}\" was added successfully to the database.`);
        res.json({ message: 'Item added successfully!' });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});