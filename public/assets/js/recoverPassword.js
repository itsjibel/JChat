function getParameterByName(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

document.addEventListener('DOMContentLoaded', function () {
    const token = getParameterByName('token');
    const username = getParameterByName('username');

    fetch('/auth/isValidRecoverPasswordToken?token=' + token + '&username=' + username, {
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.success) {
            document.getElementById('success-message').style.display = 'inline';
            const toggleLoginPassword = document.querySelector('#togglePassword');
            const newPasswordElement = document.getElementById('new-password');
            const confirmPasswordElement = document.getElementById('confirm-password');

            toggleLoginPassword.addEventListener('click', () => {
                let type = newPasswordElement.getAttribute('type') === 'password' ? 'text' : 'password';
                newPasswordElement.setAttribute('type', type);
                type = confirmPasswordElement.getAttribute('type') === 'password' ? 'text' : 'password';
                confirmPasswordElement.setAttribute('type', type);
                toggleLoginPassword.classList.toggle('bi-eye');
                toggleLoginPassword.classList.toggle('bi-eye-slash');
            });

            const confirmButton = document.getElementById('confirm-btn');
            confirmButton.addEventListener('click', () => {
                const newPassword = document.getElementById('new-password').value;
                const confirmPassword = document.getElementById('confirm-password').value;
                if (newPassword != confirmPassword) {
                    showMessage("Please rewrite the password correctly");
                } else if (newPassword === '') {
                    showMessage("Please fill out the password form");
                } else {
                    fetch('/profile/editPassword?token=' + token + '&password=' + newPassword + "&username=" + username, {
                    })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.success) {
                            showMessage("Your password is updated successfully");
                            setTimeout(() => {
                                window.location.href = '/login.html';
                            }, 4000);
                        } else {
                            showMessage(data.message);
                        }
                    })
                    .catch((error) => {
                        console.error('Error fetching user data:', error);
                    });
                }
            });
        } else {
            document.getElementById('failure-message').style.display = 'inline';
        }
    })
    .catch((error) => {
        console.error('Error fetching user data:', error);
    });
});

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