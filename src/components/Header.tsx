import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  // Store whether the mobile navigation menu is open.
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu when the user presses Escape.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close the mobile menu after a navigation link is selected.
  function handleNavigation() {
    setMenuOpen(false);
  }

  return (
    <header className="site-header">
      <Link
        to="/"
        className="logo"
        onClick={handleNavigation}
      >
        MyDashboard
      </Link>

      <button
        type="button"
        className="nav-toggle"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={menuOpen}
        aria-controls="main-navigation"
        onClick={() => setMenuOpen((currentState) => !currentState)}
      >
        {menuOpen ? 'Close' : 'Menu'}
      </button>

      <nav
        id="main-navigation"
        className={menuOpen ? 'nav-open' : ''}
        aria-label="Main navigation"
      >
        <ul className="nav-links">
          <li>
            <Link to="/" onClick={handleNavigation}>
              Home
            </Link>
          </li>

          <li>
            <Link to="/explore" onClick={handleNavigation}>
              Explore
            </Link>
          </li>

          <li>
            <Link to="/compare" onClick={handleNavigation}>
              Compare
            </Link>
          </li>

          <li>
            <Link to="/about" onClick={handleNavigation}>
              About
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;