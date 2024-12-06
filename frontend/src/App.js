// ... remove all existing code ...
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createGlobalStyle } from 'styled-components';
import LandingPage from './components/LandingPage';
import Menu from './components/Menu';
import MusicPage from './components/MusicPage';
import AdminPanel from './components/AdminPanel';  // or './components/AdminPanel.js'
import MoviePage from './components/MoviePage';

const GlobalStyle = createGlobalStyle`
    @font-face {
    font-family: 'CustomFont1';
    src: url('/fonts/Chopsic.otf') format('opentype');
  }
  
  @font-face {
    font-family: 'CustomFont2';
    src: url('/fonts/Chomsky.otf') format('opentype');
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    background-color: black;
    font-family: Arial, sans-serif;
  }
`;

function App() {
  return (
    <Router>
      <GlobalStyle />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/music" element={<MusicPage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/movies" element={<MoviePage />} />
      </Routes>
    </Router>
  );
}

export default App;