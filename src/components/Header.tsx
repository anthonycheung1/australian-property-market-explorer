import { Link } from 'react-router-dom';
// import './Header.css';

function Header() {
  return (
    <header className="site-header">
      <Link to="/" className="logo">
        MyDashboard
      </Link>

      <nav aria-label="Main navigation">
        <ul className="nav-links">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/explore">Explore</Link>
          </li>
          <li>
            <Link to="/compare">Compare</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;