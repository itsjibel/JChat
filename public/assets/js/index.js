function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=');
        if (cookieName === name) {
            return decodeURIComponent(cookieValue);
        }
    }
    return null;
}

function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + "; " + expires + "; path=/; domain=jchat.com; secure; samesite=None";
}

const token = getCookie('token');
const refreshToken = getCookie('refreshToken');

if (token) {
    // Function to refresh the token
    function refreshAccessToken() {
        if (!token || !refreshToken) {
            // Tokens are missing, redirect to login
            window.location.href = '/login.html';
            return;
        }

        const refreshTokenData = parseJwt(refreshToken);
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
                    setCookie('token', newToken, 7); // Store the new access token in a cookie
                    setTimeout(refreshAccessToken, 50000); // Schedule the next token refresh
                } else {
                    // Handle refresh token failure
                    window.location.href = '/login.html'; // Redirect to the login page on failure
                }
            })
            .catch((error) => {
                console.error('Error refreshing access token:', error);
            });
        } else {
            // Both access and refresh tokens are expired, redirect to login
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
            const userProfileData = {
                profilePictureUrl: '',
                userName: data.username,
            };

            const profilePictureElement = document.querySelector('.profile-picture');
            const userNameElement = document.querySelector('.user-name');

            // Set the profile picture and username
            if (userProfileData.profilePictureUrl) {
                profilePictureElement.style.backgroundImage = `url(${userProfileData.profilePictureUrl})`;
            }
            userNameElement.textContent = userProfileData.userName;
            
            // Add an event listener to the logout button
            const logoutButton = document.getElementById('logout-btn');
            logoutButton.addEventListener('click', () => {
                // Call the logout API here
                fetch('/api/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    }
                })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        // Clear the access token and refresh token cookies
                        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=jchat.com;';
                        document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=jchat.com;';
                        // Redirect to the login page or perform other actions as needed
                        window.location.href = '/login.html';
                    } else {
                        // Handle logout failure
                        console.error('Failed to log out:', data.message);
                    }
                })
                .catch((error) => {
                    console.error('Error logging out:', error);
                });
            });

            // Schedule the first token refresh
            setTimeout(refreshAccessToken, 50000);
        }
    })
    .catch((error) => {
        console.error('Error checking login status:', error);
    });
} else {
    // Token does not exist
    window.location.href = '/login.html';
}

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
}