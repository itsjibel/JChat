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

const token = getCookie('token');
const refreshToken = getCookie('refreshToken');

if (refreshToken && token) {
    fetch('/api/checkLoggedIn', {
        headers: {
            'Authorization': 'Bearer ' + refreshToken
        }
    })
    .then((response) => response.json())
    .then((data) => {
        if (data && data.loggedIn) {
            window.location.href = '/index.html';
        }
    })
}

// Function to set a cookie
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + "; " + expires + "; path=/; secure; samesite=None";
}

// Process of eye button of login password
const toggleSignUpPassword = document.querySelector('#toggleSignUpPassword');
const signUpPassword = document.querySelector('#sign-up-password');

toggleSignUpPassword.addEventListener('click', () => {
    const type = signUpPassword.getAttribute('type') === 'password' ? 'text' : 'password';
    signUpPassword.setAttribute('type', type);
    toggleSignUpPassword.classList.toggle('bi-eye');
    toggleSignUpPassword.classList.toggle('bi-eye-slash');
});

// Process of eye button of sign-up password
const toggleLoginPassword = document.querySelector('#toggleLoginPassword');
const loginPassword = document.querySelector('#login-password');

toggleLoginPassword.addEventListener('click', () => {
    const type = loginPassword.getAttribute('type') === 'password' ? 'text' : 'password';
    loginPassword.setAttribute('type', type);
    toggleLoginPassword.classList.toggle('bi-eye');
    toggleLoginPassword.classList.toggle('bi-eye-slash');
});

function signup(e) {
    e.preventDefault(); // Prevent the default form submission

    // Get input values
    const signUpUsername = document.getElementById("sign-up-username").value;
    const signUpEmail = document.getElementById("sign-up-email").value;
    const signUpPassword = document.getElementById("sign-up-password").value;
    const errorMessage = document.getElementById("sign-up-error-message");

    // Create a FormData object
    const formData = new FormData();
    formData.append("username", signUpUsername);
    formData.append("password", signUpPassword);
    formData.append("email", signUpEmail);

    // Make an HTTP POST request to the server
    fetch('/api/signup', {
        method: 'POST',
        body: new URLSearchParams(formData),
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.success) {
            const token = data.token; // Get JWT token from response
            const refreshToken = data.refreshToken; // Get refresh token from response

            // Set tokens as cookies
            setCookie('token', token, 7);
            setCookie('refreshToken', refreshToken, 15);

            // Redirect to the index page after successful sign-up
            window.location.href = "/index.html";
        } else if (data.message) {
            errorMessage.textContent = data.message;
            errorMessage.style.display = "flex";
            adjustMainHeightForSignUp();
        }
    })
    .catch((error) => {
        console.error(error);
    });
}

function login(e) {
    e.preventDefault();

    // Get input values
    const loginUsername = document.getElementById("login-username").value;
    const loginPassword = document.getElementById("login-password").value;
    const errorMessage = document.getElementById("login-error-message");

    // Create a FormData object
    const formData = new FormData();
    formData.append("username", loginUsername);
    formData.append("password", loginPassword);

    // Make an HTTP POST request to the server
    fetch('/auth/login', {
        method: 'POST',
        body: new URLSearchParams(formData),
    })
    .then((response) => response.json())
    .then((data) => {
        console.log(data);
        if (data.accessToken != undefined) {
            const token = data.accessToken; // Get JWT token from response
            const refreshToken = data.refreshToken; // Get refresh token from response

            // Set tokens as cookies
            setCookie('token', token, 7);
            setCookie('refreshToken', refreshToken, 15);

            // Redirect to the index page after successful login
        } else if (data.message) {
            errorMessage.textContent = data.message;
            errorMessage.style.display = "flex";
        }
    })
    .catch((error) => {
        console.error(error);
    });
}

// Function to adjust .main height based on error message height
function adjustMainHeightForSignUp() {
    const main = document.querySelector(".main");
    const errorMessage = document.getElementById("sign-up-error-message");
    main.style.height = 475 + errorMessage.clientHeight + "px";
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

const forgotPasswordLink = document.getElementById('forgot-password');
forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    const formData = new FormData();
    const username = document.getElementById('login-username').value;
    formData.append('username', username);
    
    if (username === '')
    {
        showMessage('Enter your username to recover your password');
        return;
    }

    fetch('/api/sendPasswordRecoveryEmail', {
        method: 'POST',
        body: new URLSearchParams(formData)
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.success) {
            showMessage('The password recovery email was sent successfully');
        } else {
            showMessage(data.message);
        }
    })
    .catch((error) => {
        showMessage(error);
    });
});

document.getElementById("signUpForm").addEventListener("submit", signup);
document.getElementById("loginForm").addEventListener("submit", login);