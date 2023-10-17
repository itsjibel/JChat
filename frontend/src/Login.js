import React, { useState } from 'react';
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
  const [loginErrorMessage, setLoginErrorMessage] = useState('');

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

            <div class="password-input">
              <input
                type="password"
                id="sign-up-password"
                name="password"
                placeholder="Password"
                value={signupForm.password}
                onChange={handleSignupInputChange}
                required
              />
              <i class="bi bi-eye-slash" id="toggleSignUpPassword"></i>
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

            <div class="password-input">
              <input
                type="password"
                id="login-password"
                name="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={handleLoginInputChange}
                required
              />
              <i class="bi bi-eye-slash" id="toggleLoginPassword"></i>
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
