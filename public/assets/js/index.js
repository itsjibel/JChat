const token = localStorage.getItem('token');
const refreshToken = localStorage.getItem('refreshToken');

if (token) {
    // Function to refresh the token
    function refreshAccessToken() {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!token || !refreshToken) {
            // Tokens are missing, redirect to login
            window.location.href = '/login.html';
            return;
        }
    
        const tokenData = parseJwt(token);
        const refreshTokenData = parseJwt(refreshToken);
        const tokenExpirationTime = new Date(tokenData.exp * 1000);
        const refreshTokenExpirationTime = new Date(refreshTokenData.exp * 1000);
    
        if (refreshTokenExpirationTime > new Date()) {
            // Access token has expired, but refresh token is still valid
            fetch('/api/refresh-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ refreshToken: refreshToken })
            })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    const newToken = data.accessToken;
                    localStorage.setItem('token', newToken); // Store the new access token
                    setTimeout(refreshAccessToken, 50000); // Schedule the next token refresh
                } else {
                    // Handle refresh token failure
                    console.error('Failed to refresh access token:', data.message);
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login.html'; // Redirect to the login page on failure
                }
            })
            .catch((error) => {
                console.error('Error refreshing access token:', error);
            });
        } else {
            // Both access and refresh tokens are expired, redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login.html';
        }
    }

    const tokenData = parseJwt(token);
    const expirationTime = new Date(tokenData.exp * 1000);

    if (expirationTime <= new Date()) {
        // Token has expired, refresh it
        refreshAccessToken();
    }

    fetch('/api/checkLoggedIn', {
        headers: {
            'Authorization': 'Bearer ' + refreshToken
        }
    })
    .then((response) => response.json())
    .then((data) => {
        if (data && data.loggedIn) {
            // User is logged in, continue as before
            const userInfoDiv = document.getElementById('user-info');
            userInfoDiv.innerHTML = `Hello ${data.username} <a id="logout-link" href="#">Logout</a>`;
            
            // Add an event listener to the logout link
            const logoutLink = document.getElementById('logout-link');
            logoutLink.addEventListener('click', () => {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login.html';
            });

            // Schedule the first token refresh
            setTimeout(refreshAccessToken, 50000);
        }
    })
    .catch((error) => {
        console.error('Error checking login status:', error);
    });
} else {
    // User is not logged in, redirect to the login page
    window.location.href = '/login.html';
}

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
}