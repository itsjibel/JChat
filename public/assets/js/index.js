// Your JavaScript code for checking login status and logout here
const token = localStorage.getItem('token'); // Get JWT token from localStorage
const refreshToken = localStorage.getItem('refreshToken'); // Get refresh token from localStorage

if (token) {
    fetch('/api/checkLoggedIn', {
        headers: {
            'Authorization': 'Bearer ' + token // Include JWT token in the headers
        }
    })
    .then((response) => response.json())
    .then((data) => {
        if (data && data.loggedIn) {
            // User is logged in, display user information
            const userInfoDiv = document.getElementById('user-info');
            userInfoDiv.innerHTML = `Hello ${data.username} <a id="logout-link" href="#">Logout</a>`;

            // Add an event listener to the logout link
            const logoutLink = document.getElementById('logout-link');
            logoutLink.addEventListener('click', () => {
                // Perform logout (remove token from localStorage)
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken'); // Remove refresh token
                // Redirect to the login page after logout
                window.location.href = '/login.html';
            });

            // Function to refresh the token when it expires
            function refreshAccessToken() {
                fetch('/api/refresh-token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken }),
                })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        const newToken = data.accessToken;
                        localStorage.setItem('token', newToken);
                        // Schedule the next token refresh based on token expiration time
                        setTimeout(refreshAccessToken, 3600000);
                    } else {
                        // Handle refresh token failure
                        console.error('Failed to refresh access token:', data.message);
                        // Redirect to the login page when token refresh fails
                        window.location.href = '/login.html';
                    }
                })
                .catch((error) => {
                    console.error('Error refreshing access token:', error);
                });
            }

            // Schedule the first token refresh based on token expiration time// Schedule the first token refresh based on token expiration time (1 hour)
            setTimeout(refreshAccessToken, 3600000);
        }
    })
    .catch((error) => {
        console.error('Error checking login status:', error);
    });
} else {
    // User is not logged in, redirect to the login page
    window.location.href = '/login.html';
}