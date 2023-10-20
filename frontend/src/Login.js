import React, { useState, useEffect } from 'react';
import './Login.css';
import './bootstrap.min.css'

function Login() {
  const [signupForm, setSignupForm] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  });

  const [signupErrorMessage, setSignupErrorMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loginErrorMessage, setLoginErrorMessage] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false); // State to track signup password visibility
  const [showLoginPassword, setShowLoginPassword] = useState(false); // State to track login password visibility

  function toggleSignupPasswordVisibility() {
    setShowSignupPassword(!showSignupPassword);
  }

  function toggleLoginPasswordVisibility() {
    setShowLoginPassword(!showLoginPassword);
  }


  function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = 'expires=' + date.toUTCString();
    document.cookie = name + '=' + value + '; ' + expires + '; path=/; secure; samesite=None';
  }

  // Process of eye button for password
  const togglePassword = (inputId, toggleId) => {
    const passwordInput = document.getElementById(inputId);
    const toggleButton = document.getElementById(toggleId);

    toggleButton.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      toggleButton.classList.toggle('bi-eye');
      toggleButton.classList.toggle('bi-eye-slash');
    });
  };

  useEffect(() => {
    togglePassword('sign-up-password', 'toggleSignUpPassword');
    togglePassword('login-password', 'toggleLoginPassword');
  }, []);

  // Function to set tokens as cookies
  function setTokensCookies(data) {
    const { token, refreshToken } = data;
    setCookie('token', token, 7);
    setCookie('refreshToken', refreshToken, 15);
  }

  function signup(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('username', signupForm.username);
    formData.append('password', signupForm.password);
    formData.append('email', signupForm.email);

    sendRequest(
      '/auth/signup',
      formData,
      (data) => {
        setTokensCookies(data);
        // Redirect to the index page after successful sign-up
        window.location.href = '/index.html';
      },
      (errorMessageText) => {
        setErrorMessage(errorMessageText);
        // Adjust main height for sign-up (if needed)
        // adjustMainHeightForSignUp();
      }
    );
  }
  
  function login(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('username', loginForm.username);
    formData.append('password', loginForm.password);

    sendRequest(
      '/auth/login',
      formData,
      (data) => {
        setTokensCookies(data);
        // Redirect to the index page after successful login
        window.location.href = '/index.html';
      },
      (errorMessageText) => {
        setErrorMessage(errorMessageText);
      }
    );
  }

  function handleForgotPassword(e) {
    e.preventDefault();
    const username = loginForm.username;

    if (username === '') {
      showMessage('Enter your username to recover your password');
      return;
    }

    const formData = new FormData();
    formData.append('username', username);

    sendRequest(
      '/email/passwordRecovery',
      formData,
      (data) => {
        showMessage('The password recovery email was sent successfully');
      },
      (errorMessageText) => {
        showMessage(errorMessageText);
      }
    );
  }

  // Function to send a request to the server and handle signup or login
  function sendRequest(url, formData, successCallback, errorCallback) {
    fetch(url, {
      method: 'POST',
      body: new URLSearchParams(formData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          successCallback(data);
        } else if (data.message) {
          errorCallback(data.message);
        }
      })
      .catch((error) => {
        errorCallback(error);
      });
  }

  function showMessage(message) {
    setErrorMessage(message);
  }

  const handleSignupInputChange = (e) => {
    const { name, value } = e.target;
    setSignupForm({
      ...signupForm,
      [name]: value,
    });
  };

  const handleLoginInputChange = (e) => {
    const { name, value } = e.target;
    setLoginForm({
      ...loginForm,
      [name]: value,
    });
  };

  const handleSignup = (e) => {
    e.preventDefault();
    // Implement your signup logic here
    console.log('Signup form data:', signupForm);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Implement your login logic here
    console.log('Login form data:', loginForm);
  };

  return (
    <div className="body">
      <div className="main">
        <input type="checkbox" id="chk" aria-hidden="true" />
        <div className="signup">
          <form onSubmit={handleSignup}>
            <label htmlFor="chk" aria-hidden="true" className="user-select-none">
              Sign up
            </label>
            <input
              type="text"
              id="sign-up-username"
              name="username"
              placeholder="User name"
              value={signupForm.username}
              onChange={handleSignupInputChange}
              required
            />
            <input
              type="email"
              id="sign-up-email"
              name="email"
              placeholder="Email"
              value={signupForm.email}
              onChange={handleSignupInputChange}
              required
            />

            <div className="password-input">
              <input
                type={showSignupPassword ? 'text' : 'password'} // Toggle signup password visibility
                id="sign-up-password"
                name="password"
                placeholder="Password"
                value={signupForm.password}
                onChange={handleSignupInputChange}
                required
              />
              <i
                className={`bi ${showSignupPassword ? 'bi-eye' : 'bi-eye-slash'}`}
                id="toggleSignUpPassword"
                onClick={toggleSignupPasswordVisibility}
              ></i>
            </div>

            <p className="error-message text-center">{signupErrorMessage}</p>
            <input className="button" type="submit" value="Sign Up" />
          </form>
        </div>

        <div className="login text-center">
          <form onSubmit={handleLogin}>
            <label htmlFor="chk" aria-hidden="true" className="user-select-none">
              Login
            </label>
            <input
              type="text"
              id="login-username"
              name="username"
              placeholder="User name"
              value={loginForm.username}
              onChange={handleLoginInputChange}
              required
            />

            <div className="password-input">
              <input
                type={showLoginPassword ? 'text' : 'password'} // Toggle login password visibility
                id="login-password"
                name="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={handleLoginInputChange}
                required
              />
              <i
                className={`bi ${showLoginPassword ? 'bi-eye' : 'bi-eye-slash'}`}
                id="toggleLoginPassword"
                onClick={toggleLoginPasswordVisibility}
              ></i>
            </div>

            <a href="" id="forgot-password">
              Forgot password?
            </a>
            <p className="error-message text-center">{loginErrorMessage}</p>
            <input className="button" type="submit" value="Login" />
          </form>
        </div>

        <div id="message-box" className="message-box">
          <div className="message-content">
            <p id="message-text"></p>
            <div id="message-progress"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
