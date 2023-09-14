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

function addUser(e) {
    e.preventDefault(); // Prevent the default form submission

    // Get input values
    const signUpUsername = document.getElementById("sign-up-username").value;
    const signUpEmail = document.getElementById("sign-up-email").value;
    const signUpPassword = document.getElementById("sign-up-password").value;

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
        } else {
            console.log("Error adding user. Please try again.");
        }
    })
    .catch((error) => {
        console.log(error);
    });
}

// Attach the addUser function to the form's submit event
document.getElementById("signUpForm").addEventListener("submit", addUser);