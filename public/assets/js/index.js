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
    document.cookie = name + "=" + value + "; " + expires + "; path=/; secure; samesite=None";
}

let token = getCookie('token');
const refreshToken = getCookie('refreshToken');
let tokenData;

if (token) {
    // Function to refresh the token
    function refreshAccessToken() {
        if (!token || !refreshToken) {
            // Tokens are missing, redirect to login
            window.location.href = '/login.html';
            return Promise.reject("Tokens missing");
        }
    
        const refreshTokenData = parseJwt(refreshToken);
        const refreshTokenExpirationTime = new Date(refreshTokenData.exp * 1000);
    
        if (refreshTokenExpirationTime > new Date()) {
            // Access token has expired, but refresh token is still valid
            return fetch('/api/refreshAccessToken', {
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
            return Promise.reject("Tokens expired");
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

            // Call the function to fetch user data
            refreshAccessToken()
            .then(() => {
                const dropdownMenuLink = document.getElementById('dropdownMenuLink');
                const dropdownMenu = document.getElementById('dropdownMenu');
                const addFriendButton = document.getElementById('add-friend-button');

                document.body.addEventListener('click', () => {
                    dropdownMenu.style.display = dropdownMenu.style.display === 'inline' ? 'inline-block' : dropdownMenu.style.display === 'inline-block' ? 'none' : dropdownMenu.style.display;
                });

                dropdownMenuLink.addEventListener('click', () => {
                    dropdownMenu.style.display = dropdownMenu.style.display === 'inline-block' ? 'none' : 'inline';
                });

                addFriendButton.addEventListener('click', () => {
                    document.getElementById("chats").style.display = 'none';
                    document.getElementById("add-firend-section").style.display = 'inline';

                    const backButton = document.getElementById('back-button');
                    backButton.addEventListener('click', () => {
                        document.getElementById('user-found').style.cssText = 'display:none !important';
                        document.getElementById("add-firend-section").style.display = 'none';
                        document.getElementById("chats").style.display = 'inline';
                    });

                    const searchButton = document.getElementById('search-button');
                    searchButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        token = getCookie('token');
                        tokenData = parseJwt(token);
                        document.getElementById('user-found').style.cssText = 'display:flex !important';

                        fetch('/api/profile/' + document.getElementById('search-bar').value, {
                            headers: {
                                'Authorization': 'Bearer ' + token
                            }
                        })
                        .then((response) => response.json())
                        .then((userData) => {
                            if (userData) {
                                const userProfileData = {
                                    profilePicture: userData.profilePicture,
                                    userName: userData.username,
                                };
        
                                const userNameElement = document.getElementById('username');
                        
                                if (userData.profilePicture) {
                                    const arrayBufferView = new Uint8Array(userData.profilePicture.data);
                                    const blob = new Blob([arrayBufferView], { type: userData.profilePicture.type });
                                    const imageUrl = URL.createObjectURL(blob);
                                    
                                    const profilePictureElement = document.getElementById('pfp');
                                    profilePictureElement.src = imageUrl;
                                }
                                userNameElement.textContent = userProfileData.userName;
                            }
                        })
                        .catch((error) => {
                            console.error('Error fetching user data:', error);
                        });
                    });
                });

            });
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