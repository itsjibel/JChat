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
var friendRequestList = null;

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
            // Refresh the access token for POST and GET APIs without problems
            refreshAccessToken()
            .then(() => {
                const socket = io.connect('https://jchat.com', {
                    query: { token: token },
                });

                // Listen for WebSocket events and handle them
                socket.on('friendRequest', (requests) => {
                    // Update the UI with the friend request count
                    let unAcceptedRequests = 0;
                    if (requests.length > 0) {
                        document.getElementById('friend-requests-notif-text').style.display = 'inline-block';
                        for (const request of requests) {
                            if (!request.is_accepted) {
                                unAcceptedRequests++;
                            }
                        }
                        if (unAcceptedRequests > 0) {
                            document.getElementById('friend-requests-notif-text').textContent = unAcceptedRequests;
                        } else {
                            document.getElementById('friend-requests-notif-text').style.display = 'none';
                        }

                        const contactsList = document.getElementById("contacts-list");
                        while (contactsList.firstChild) {
                            contactsList.removeChild(contactsList.firstChild);
                        }

                        for (const request of requests) {
                            if (request.is_accepted) {
                                fetch('/api/profile/' + request.sender_username, {
                                    headers: {
                                        'Authorization': 'Bearer ' + token
                                    }
                                })
                                .then((response) => response.json())
                                .then((userData) => {
                                    const userProfileData = {
                                        profilePicture: userData.profilePicture,
                                        userName: userData.username,
                                    };

                                    const contactPFP = document.createElement("img");
                                    contactPFP.classList.add("contact-pfp");
                                    if (userProfileData.profilePicture) {
                                        const arrayBufferView = new Uint8Array(userProfileData.profilePicture.data);
                                        const blob = new Blob([arrayBufferView], { type: userProfileData.profilePicture.type });
                                        const imageUrl = URL.createObjectURL(blob);
                                        
                                        contactPFP.src = imageUrl;
                                    }

                                    const contactUsername = document.createElement("p");
                                    contactUsername.classList.add("contact-username");
                                    contactUsername.textContent = userProfileData.userName;

                                    const contact = document.createElement("div");
                                    contact.classList.add("contact");
                                    contact.appendChild(contactPFP);
                                    contact.appendChild(contactUsername);
                                    contactsList.appendChild(contact);
                                })
                                .catch((error) => {
                                    console.error('Error fetching user data:', error);
                                });
                            }
                        }
                    }

                    friendRequestList = unAcceptedRequests != 0 ? requests : null;
                });

                const dropdownMenuLink = document.getElementById('dropdownMenuLink');
                const dropdownMenu = document.getElementById('dropdownMenu');
                const addFriendButton = document.getElementById('add-friend-button');
                const friendRequestsNotifButton = document.getElementById('friend-requests-notif');

                // Hide dropdown menu after user clicks on any element in the site
                document.body.addEventListener('click', () => {
                    dropdownMenu.style.height = dropdownMenu.style.height === '10px' ? '130px' : dropdownMenu.style.height === '130px' ? '0px' : dropdownMenu.style.height;
                });

                // Show dropdown menu after user clicks on the three line icon
                dropdownMenuLink.addEventListener('click', () => {
                    dropdownMenu.style.height = dropdownMenu.style.height === '130px' ? '0px' : '10px';
                });

                friendRequestsNotifButton.addEventListener('click', () => {
                    if (!friendRequestList || friendRequestList.length === 0) {
                        return;
                    }

                    const friendRequestsTitleDiv = document.getElementById("friend-requests-list");
                    while (friendRequestsTitleDiv.firstChild) {
                        friendRequestsTitleDiv.removeChild(friendRequestsTitleDiv.firstChild);
                    }

                    document.getElementById("chats").style.display = 'none';
                    document.getElementById("friend-requests-section").style.display = 'inline';

                    for (const request of friendRequestList) {
                        fetch('/api/profile/' + request.sender_username, {
                            headers: {
                                'Authorization': 'Bearer ' + token
                            }
                        })
                        .then((response) => response.json())
                        .then((userData) => {
                            const userProfileData = {
                                profilePicture: userData.profilePicture,
                                userName: userData.username,
                            };
                            
                            const pfpElement = document.createElement("img");
                            pfpElement.classList.add("pfp");
                            if (userProfileData.profilePicture) {
                                const arrayBufferView = new Uint8Array(userProfileData.profilePicture.data);
                                const blob = new Blob([arrayBufferView], { type: userProfileData.profilePicture.type });
                                const imageUrl = URL.createObjectURL(blob);
                                
                                pfpElement.src = imageUrl;
                            }

                            const pElement = document.createElement("p");
                            pElement.classList.add("friend-requests-username");
                            pElement.textContent = request.sender_username;

                            const acceptButtonElement = document.createElement("button");
                            acceptButtonElement.classList.add("btn");
                            acceptButtonElement.classList.add("btn-success");
                            acceptButtonElement.classList.add("accept-button");
                            acceptButtonElement.textContent = "Accept";

                            const friendRequestsTitleDiv = document.getElementById("friend-requests-list");
                            const friendRequestProfile = document.createElement("div");
                            friendRequestProfile.classList.add("friend-request-profile");

                            friendRequestProfile.appendChild(pfpElement);
                            friendRequestProfile.appendChild(pElement);
                            friendRequestProfile.appendChild(acceptButtonElement);

                            // Append the <p> element to the div
                            if (!request.is_accepted) {
                                friendRequestsTitleDiv.appendChild(friendRequestProfile);
                            }

                            const formData = new FormData();
                            token = getCookie('token');
                            tokenData = parseJwt(token);
                            formData.append('sender_username', tokenData.username);

                            acceptButtonElement.addEventListener("click", () => {
                                fetch('/api/acceptFriendRequest/' + userProfileData.userName, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': 'Bearer ' + token
                                    },
                                    body: new URLSearchParams(formData)
                                })
                                .then((response) => response.json())
                                .then((data) => {
                                    if (data.success) {
                                        showMessage(userProfileData.userName + ' added to your friends');
                                        friendRequestProfile.classList.add("fade-out");
                                        setTimeout(() => {
                                            // After the transition completes, remove the element
                                            friendRequestProfile.remove();
                                    
                                            if (friendRequestsTitleDiv.childElementCount === 0) {
                                                const pElement = document.createElement("p");
                                                pElement.classList.add("no-request-available");
                                                pElement.textContent = 'No friend requests are available';
                                    
                                                friendRequestsTitleDiv.appendChild(pElement);
                                            }
                                        }, 500);
                                    } else {
                                        showMessage('An error occurred while accepting a friend request from ' + userProfileData.userName + '.');
                                    }
                                })
                                .catch((error) => {
                                    console.error('Error updating profile:', error);
                                });
                            });

                        })
                        .catch((error) => {
                            console.error('Error fetching user data:', error);
                        });
                    }

                });
                const backButton = document.getElementById('friend-requests-back-button');
                backButton.addEventListener('click', () => {
                    socket.emit('refreshFriendRequests');
                    document.getElementById("chats").style.display = 'inline';
                    document.getElementById("friend-requests-section").style.display = 'none';
                });

                addFriendButton.addEventListener('click', () => {
                    // Hide the chats section, and show the search section for search for users friend
                    document.getElementById("chats").style.display = 'none';
                    document.getElementById("add-firend-section").style.display = 'inline';

                    // Hide the search friend section, and show the chats section for user can come back to the chats
                    const backButton = document.getElementById('back-button');
                    backButton.addEventListener('click', () => {
                        document.getElementById('user-found').style.cssText = 'display:none !important';
                        document.getElementById("add-firend-section").style.display = 'none';
                        document.getElementById("chats").style.display = 'inline';
                        document.getElementById('error-msg').style.cssText = 'display: none !important';
                        document.getElementById('search-bar').value = "";
                    });

                    const searchButton = document.getElementById('search-button');
                    searchButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        token = getCookie('token');
                        tokenData = parseJwt(token);

                        // Reset the elements for user search
                        document.getElementById('user-found').style.cssText = 'display:none !important';
                        document.getElementById('add-friend-text').textContent = "Send friend request";
                        document.getElementById('add-friend').style.cssText = 'background-color: #0325ff;';
                        document.getElementById('error-msg').style.cssText = 'display: none !important';

                        if (tokenData.username === document.getElementById('search-bar').value) {
                            return;
                        }

                        fetch('/api/profile/' + document.getElementById('search-bar').value, {
                            headers: {
                                'Authorization': 'Bearer ' + token
                            }
                        })
                        .then((response) => response.json())
                        .then((userData) => {
                            if (userData.username) {
                                document.getElementById('user-found').style.cssText = 'display:flex !important';
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


                                const formData = new FormData();
                                formData.append('sender_username', tokenData.username);
                                formData.append('receiver_username', userProfileData.userName);

                                fetch('/api/checkFriendRequest', {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': 'Bearer ' + token
                                    },
                                    body: new URLSearchParams(formData)
                                })
                                .then((response) => response.json())
                                .then((data) => {
                                    if (data.success) {
                                        document.getElementById('add-friend-text').textContent = "Friend request sent";
                                        document.getElementById('add-friend').style.cssText = 'background-color: #a2a2a2;';
                                    } else {
                                        const sendFriendRequestButton = document.getElementById('add-friend');
                                        sendFriendRequestButton.addEventListener('click', () => {
                                            if (document.getElementById('add-friend-text').textContent === "Friend request sent") {
                                                return;
                                            }

                                            fetch('/api/sendFriendRequest/' + userProfileData.userName, {
                                                method: 'POST',
                                                headers: {
                                                    'Authorization': 'Bearer ' + token
                                                },
                                                body: new URLSearchParams(formData)
                                            })
                                            .then((response) => response.json())
                                            .then((data) => {
                                                if (data.success) {
                                                    showMessage('You successfully sent a friend request to ' + userProfileData.userName + '.');
                                                    document.getElementById('add-friend-text').textContent = "Friend request sent";
                                                    document.getElementById('add-friend').style.cssText = 'background-color: #a2a2a2;';
                                                } else {
                                                    showMessage('An error occurred while sending a friend request to ' + userProfileData.userName + '.');
                                                }
                                            })
                                            .catch((error) => {
                                                console.error('An error occurred while sending a friend request:', error);
                                            });
                                        });
                                    }
                                })
                                .catch((error) => {
                                    console.error('Error updating profile:', error);
                                });
                            } else {
                                document.getElementById('error-msg').style.cssText = 'display:flex !important';
                            }
                        })
                        .catch((error) => {
                            console.error('Error fetching user data:', error);
                        });
                    });
                });
            });
        } else {
            var cookies = document.cookie.split(';');

            for (var i = 0; i < cookies.length; i++) {
                var cookie = cookies[i];
                var eqPos = cookie.indexOf('=');
                var name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
            }
            // Redirect to the login page or perform other actions as needed
            window.location.href = '/login.html';
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

const messageQueue = []; // Queue to store messages

function showMessage(message) {
    messageQueue.push(message); // Add the message to the queue

    // If there is no message currently displayed, show the next one
    if (messageQueue.length === 1) {
        showNextMessage();
    }
}

function showNextMessage() {
    if (messageQueue.length > 0) {
        const message = messageQueue[0];
        const messageBox = document.getElementById('message-box');
        const messageText = document.getElementById('message-text');
        const messageProgress = document.getElementById('message-progress');

        // Set the message text
        messageText.textContent = message;

        // Show the message box
        messageBox.style.display = 'inline-block';

        // Center the message box
        messageBox.style.top = '0';
        messageBox.style.left = '50%';
        messageBox.style.transform = 'translateX(-50%)';

        // Hide the message box after 3 seconds
        setTimeout(() => {
            messageBox.style.display = 'none';
            messageQueue.shift(); // Remove the displayed message from the queue
            showNextMessage(); // Show the next message, if any
        }, 4000);

        // Update the progress bar (optional)
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 100) {
                clearInterval(interval);
            } else {
                width++;
                messageProgress.style.width = width + '%';
            }
        }, 40);
    }
}