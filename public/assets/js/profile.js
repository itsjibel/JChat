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
let refreshToken = getCookie('refreshToken');

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

function fetchUserData() {
    refreshAccessToken();
    token = getCookie('token');
    const tokenData = parseJwt(token);
    fetch('/api/checkLoggedIn', {
        headers: {
            'Authorization': 'Bearer ' + refreshToken
        }
    })
    .then((response) => response.json())
    .then((data) => {
        if (data && data.loggedIn) {
            // Function to fetch user data
            function fetchUserData() {
                token = getCookie('token');
                fetch('/api/profile/' + tokenData.username, {
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
                            email: userData.email,
                            isEmailVerified: userData.isEmailVerified,
                        };

                        const userNameElement = document.getElementById('username');
                        const emailElement = document.getElementById('email');
                
                        if (userData.profilePicture) {
                            const arrayBufferView = new Uint8Array(userData.profilePicture.data);
                            const blob = new Blob([arrayBufferView], { type: userData.profilePicture.type });
                            const imageUrl = URL.createObjectURL(blob);
                            
                            const profilePictureElement = document.querySelector('.profile-picture-template img');
                            profilePictureElement.src = imageUrl;
                        }
                        userNameElement.value = userProfileData.userName;
                        emailElement.value = userProfileData.email;
                        if (userProfileData.isEmailVerified === 0) {
                            document.getElementById('verify-email-button').style.display = 'inline';
                        }
                    }
                })
                .catch((error) => {
                    console.error('Error fetching user data:', error);
                });
            }

            // Call the function to fetch user data
            fetchUserData();
        }
    })
    .catch((error) => {
        console.error('Error checking login status:', error);
    });
}

refreshAccessToken()
.then(() => {
    fetchUserData();
});

// Add an event listener to the logout button
const logoutButton = document.getElementById('logout-btn');
logoutButton.addEventListener('click', () => {
    // Call the logout API here
    refreshAccessToken()
    .then(() => {
        token = getCookie('token');
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
});

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

// Add an event listener to the logout button
const applyChangesButton = document.getElementById('apply-changes-btn');
applyChangesButton.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    const passwordModal = new bootstrap.Modal(document.getElementById('passwordModal'));
    passwordModal.show();
    document.getElementById('confirmPasswordBtn').addEventListener('click', () => {
        refreshAccessToken()
            .then(() => {
                token = getCookie('token');
                const tokenData = parseJwt(token);
                const currentPassword = document.getElementById('currentPassword').value;
                const usernameElement = document.getElementById('username');
                const emailElement = document.getElementById('email');
                const passwordElement = document.getElementById('password');

                const newUsername = usernameElement.value;
                const newEmail = emailElement.value;
                const newPassword = passwordElement.value;

                // Check if the Cropper instance exists and is not null
                if (cropper) {
                    // Disable the crop button while cropping is in progress
                    document.getElementById('cropImageBtn').disabled = true;
                    
                    // Get the cropped image as a blob
                    cropper.getCroppedCanvas().toBlob((blob) => {
                        if (blob) {
                            // Create a FormData object to send the data as a multipart/form-data request
                            const formData = new FormData();
                            formData.append('old_username', tokenData.username);
                            formData.append('old_password', currentPassword);
                            formData.append('username', newUsername);
                            formData.append('email', newEmail);
                            formData.append('password', newPassword);
                            formData.append('pfp', blob, 'profile_picture.jpg'); // Append the blob as 'pfp'

                            // Send the data to the server using a fetch POST request
                            fetch('/api/editProfile/' + tokenData.username, {
                                method: 'POST',
                                headers: {
                                    'Authorization': 'Bearer ' + token
                                },
                                body: formData // Use the FormData object as the request body
                            })
                            .then((response) => response.json())
                            .then((data) => {
                                if (data.success) {
                                    // Handle successful profile edit, such as displaying a success message or redirecting
                                    const token = data.token; // Get JWT token from response
                                    const refreshToken = data.refreshToken; // Get refresh token from response
                
                                    setCookie('token', token, 7);
                                    setCookie('refreshToken', refreshToken, 15);
                
                                    showMessage('Profile updated successfully');
                                } else {
                                    // Handle edit failure, display an error message or take appropriate action
                                    showMessage(data.message);
                                }
                            })
                            .catch((error) => {
                                console.error('Error updating profile:', error);
                            })
                            .finally(() => {
                                // Re-enable the crop button and destroy the Cropper instance
                                document.getElementById('cropImageBtn').disabled = false;
                                cropper.destroy();
                                passwordModal.hide();
                            });
                        }
                    }, 'image/jpeg'); // Specify the desired image format
                }
            });
    });
});

const verifyEmailButton = document.getElementById('verify-email-btn');
verifyEmailButton.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    refreshAccessToken()
    .then(() => {
        token = getCookie('token');
        const tokenData = parseJwt(token);

        const formData = new FormData();
        const email = document.getElementById('email').value;
        formData.append('email', email);
        formData.append('username', tokenData.username);

        fetch('/api/sendVerificationEmail', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            body: new URLSearchParams(formData)
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                showMessage('The verification email was sent successfully');
            } else {
                showMessage(data.message);
            }
        })
        .catch((error) => {
            showMessage(error);
        });
    });
});

let cropper = null; // Initialize cropper as null

document.getElementById('profile-picture-input').addEventListener('change', function (event) {
    const selectedImage = event.target.files[0];
    
    if (selectedImage) {
        const imageUrl = URL.createObjectURL(selectedImage);

        // Destroy the previous Cropper instance if it exists
        if (cropper) {
            cropper.destroy();
        }

        const cropModal = new bootstrap.Modal(document.getElementById('cropModal'));
        cropModal.show();

        const cropImage = document.getElementById('cropImage');
        cropImage.src = imageUrl;

        cropper = new Cropper(cropImage, {
            aspectRatio: 1, // Set the aspect ratio (in this case, 1:1 for a square crop)
            viewMode: 1, // Set the view mode to restrict the crop box to the container
        });
    }
});

document.getElementById('cropImageBtn').addEventListener('click', () => {
    const canvas = cropper.getCroppedCanvas();
    const croppedImage = canvas.toDataURL(); // This will be your cropped image in base64 format
    
    const profilePictureElement = document.querySelector('.profile-picture-template img');
    profilePictureElement.src = croppedImage;

    const cropModal = bootstrap.Modal.getInstance(document.getElementById('cropModal'));
    cropModal.hide();
});

const toggleLoginPassword = document.getElementById('togglePassword');
const newPassword = document.getElementById('password');
toggleLoginPassword.addEventListener('click', () => {
    const type = newPassword.getAttribute('type') === 'password' ? 'text' : 'password';
    newPassword.setAttribute('type', type);
    toggleLoginPassword.classList.toggle('bi-eye');
    toggleLoginPassword.classList.toggle('bi-eye-slash');
});