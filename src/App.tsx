import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, } from 'react-router-dom';

import Header from './components/Header';
import Explore from './pages/Explore';
import Suburb from './pages/Suburb';
import Compare from './pages/Compare';
import './App.css';

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches? 'dark': 'light';
}

function Home() {
  return (
    <h1>Home Page</h1>
  );
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Apply the selected theme and persist the user's preference.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Switch between light and dark themes.
  function handleToggleTheme() {
    setTheme((currentTheme) => currentTheme === 'light' ? 'dark' : 'light');
  }

  return (
    <BrowserRouter basename="/australian-property-market-explorer">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <Header
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/suburb/:state/:suburb" element={<Suburb />} />
          <Route path="/compare" element={<Compare />} />
          {/* <Route path="/about" element={<About />} /> */}
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
