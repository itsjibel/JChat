import React from 'react';
import Login from './Login'; // Make sure the path is correct

function App() {
  return (
    <div className="App">
      <header>
        <div class="user-select-none header-content">
          <img src="assets/images/JChat-Logo.png" alt="Logo" class="logo"/>
        </div>
      </header>
      <Login /> {/* Render the Login component here */}
    </div>
  );
}

export default App;
