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

function addUser(e) {
    e.preventDefault(); // Prevent the default form submission

    // Get input values
    const signUpUsername = document.getElementById("sign-up-username").value;
    const signUpEmail = document.getElementById("sign-up-email").value;
    const signUpPassword = document.getElementById("sign-up-password").value;
    const errorMessage = document.getElementById("error-message");

    // Check if the username is valid
    if (!isValidUsername(signUpUsername)) {
        errorMessage.textContent = "Invalid username. A username must start with a letter, be between 3 and 20 characters long, and can contain letters, numbers, '.', '_', and no spaces.";
        errorMessage.style.display = "flex"; // Show the error message
        // Adjust .main height based on error message height
        adjustMainHeight();
        return;
    }

    // Check if the password is valid
    if (!isValidPassword(signUpPassword)) {
        errorMessage.textContent = "Invalid password. Only use valid characters and lengths between 5-100.";
        errorMessage.style.display = "flex";
        // Adjust .main height based on error message height
        adjustMainHeight();
        return;
    }

    // If there are no errors, hide the error message
    errorMessage.style.display = "none";

    // Create a FormData object
    const formData = new FormData();
    formData.append("username", signUpUsername);
    formData.append("password", signUpPassword);
    formData.append("email", signUpEmail);

    // Make an HTTP POST request to the server
    fetch('/api/addUser', {
        method: 'POST',
        body: new URLSearchParams(formData),
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.success) {
            window.location.href = "/index.html";
        } else if (data.message) {
            errorMessage.textContent = data.message;
            errorMessage.style.display = "flex";
            adjustMainHeight();
        }
    })
    .catch((error) => {
        console.log(error);
    });
}

// Function to adjust .main height based on error message height
function adjustMainHeight() {
    const main = document.querySelector(".main");
    const errorMessage = document.getElementById("error-message");
    main.style.height = 475 + errorMessage.clientHeight + "px";
}

document.getElementById("signUpForm").addEventListener("submit", addUser);