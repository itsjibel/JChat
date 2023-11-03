import React from 'react';
import { BrowserRouter as Router, Routes, Route }
    from 'react-router-dom';
import LoginPage from './components/Login';
import HomePage from './components/Home'; // Fixed the component name

function App() {
  return (
    <Router>
      <header>
        <div class="user-select-none header-content">
          <img src="assets/images/JChat-Logo.png" alt="Logo" class="logo"/>
        </div>
      </header>
      <LoginPage />

      <Routes>
        <Route path="/home" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
