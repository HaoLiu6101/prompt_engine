import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import './top-nav.css';

function TopNav() {
  const { t } = useTranslation(['nav', 'common']);

  return (
    <header className="top-nav">
      <Link className="logo" to="/">
        {t('common:appName')}
      </Link>
      <div className="nav-cluster">
        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            {t('nav:welcome')}
          </NavLink>
          <NavLink to="/home" className={({ isActive }) => (isActive ? 'active' : '')}>
            {t('nav:home')}
          </NavLink>
          <NavLink to="/prompts" className={({ isActive }) => (isActive ? 'active' : '')}>
            {t('nav:prompts')}
          </NavLink>
        </nav>
        <LanguageSwitcher />
      </div>
    </header>
  );
}

export default TopNav;
