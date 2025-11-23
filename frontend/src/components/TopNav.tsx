import { Link, NavLink } from 'react-router-dom';
import './top-nav.css';

function TopNav() {
  return (
    <header className="top-nav">
      <Link className="logo" to="/">
        Prompt Engine
      </Link>
      <nav className="nav-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Launcher
        </NavLink>
        <NavLink to="/home" className={({ isActive }) => (isActive ? 'active' : '')}>
          Home
        </NavLink>
        <NavLink to="/prompts" className={({ isActive }) => (isActive ? 'active' : '')}>
          Prompts
        </NavLink>
      </nav>
    </header>
  );
}

export default TopNav;
