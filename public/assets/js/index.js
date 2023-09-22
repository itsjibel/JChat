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

let token = getCookie('token');
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

            // Function to fetch user data
            function fetchUserData() {
                refreshAccessToken();
                token = getCookie('token');
                const tokenData = parseJwt(token);

                fetch('/api/getUserProfile/' + tokenData.username, {
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                })
                .then((response) => response.json())
                .then((userData) => {
                    if (userData) {
                        userProfileData.profilePicture = userData.profilePicture;
                        userProfileData.userName = userData.username;

                        const userNameElement = document.querySelector('.user-name');
                
                        if (userData.profilePicture) {
                            const arrayBufferView = new Uint8Array(userData.profilePicture.data);
                            const blob = new Blob([arrayBufferView], { type: userData.profilePicture.type });
                            const imageUrl = URL.createObjectURL(blob);
                            
                            const profilePictureElement = document.querySelector('.profile-picture-template img');
                            profilePictureElement.src = imageUrl;
                        }
                        userNameElement.textContent = userProfileData.userName;
                    }
                })
                .catch((error) => {
                    console.error('Error fetching user data:', error);
                });
            }

            // Call the function to fetch user data
            fetchUserData();

            // Schedule the first token refresh
            refreshAccessToken();
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