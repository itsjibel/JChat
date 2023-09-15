const toggleSignUpPassword = document.querySelector('#toggleSignUpPassword');
const signUpPassword = document.querySelector('#sign-up-password');

toggleSignUpPassword.addEventListener('click', () => {
    const type = signUpPassword.getAttribute('type') === 'password' ? 'text' : 'password';
    signUpPassword.setAttribute('type', type);
    toggleSignUpPassword.classList.toggle('bi-eye');
    toggleSignUpPassword.classList.toggle('bi-eye-slash');
});

const toggleLoginPassword = document.querySelector('#toggleLoginPassword');
const loginPassword = document.querySelector('#login-password');

toggleLoginPassword.addEventListener('click', () => {
    const type = loginPassword.getAttribute('type') === 'password' ? 'text' : 'password';
    loginPassword.setAttribute('type', type);
    toggleLoginPassword.classList.toggle('bi-eye');
    toggleLoginPassword.classList.toggle('bi-eye-slash');
});

// Function to validate the password
function isValidPassword(password) {
    // Define a regular expression to match valid characters
    const validCharactersRegex = /^[a-zA-Z0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]+$/;

    // Check if the password length is within the specified limits
    if (password.length < 5 || password.length > 100) {
        return false;
    }

    // Check if the password contains only valid characters
    return validCharactersRegex.test(password);
}

function addUser(e) {
    e.preventDefault(); // Prevent the default form submission

    // Get input values
    const signUpUsername = document.getElementById("sign-up-username").value;
    const signUpEmail = document.getElementById("sign-up-email").value;
    const signUpPassword = document.getElementById("sign-up-password").value;

    // Check if the password is valid
    if (!isValidPassword(signUpPassword)) {
        document.getElementById("error-message").textContent = "Invalid password. Only use valid characters and lengths between 5-100.";
        return;
    }

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
            if (data.message.code === "ER_DUP_ENTRY") {
                // Handle the "Duplicate entry" error
                document.getElementById("error-message").textContent = "This username or email is already in use.";
            } else {
                document.getElementById("error-message").textContent = "An error occurred.";
            }
        }
    })
    .catch((error) => {
        console.log(error);
    });
}

// Attach the addUser function to the form's submit event
document.getElementById("signUpForm").addEventListener("submit", addUser);