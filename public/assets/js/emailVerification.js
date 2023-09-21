function getParameterByName(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

document.addEventListener('DOMContentLoaded', function () {
    const successParam = getParameterByName('success');

    if (successParam === 'true') {
        document.getElementById('success-message').style.display = 'inline';
        const homeButton = document.getElementById('home-btn');
        homeButton.addEventListener('click', () => {
            window.location.href = '/';
        });
    } else {
        document.getElementById('failure-message').style.display = 'inline';
    }
});