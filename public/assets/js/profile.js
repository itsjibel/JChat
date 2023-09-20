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

const token = getCookie('token')

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