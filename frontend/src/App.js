import React from 'react';
import { BrowserRouter as Router, Routes, Route }
    from 'react-router-dom';
import Login from './components/Login';
import Home from './components/Home'; // Fixed the component name

function App() {
  return (
    <Router>
      <header>
        <div class="user-select-none header-content">
          <img src="assets/images/JChat-Logo.png" alt="Logo" class="logo"/>
        </div>
      </header>
      <Login />

      <Routes>
        <Route path="/home" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
