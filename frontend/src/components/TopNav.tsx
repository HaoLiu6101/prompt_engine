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
            {t('nav:connect')}
          </NavLink>
          <NavLink to="/workspace" className={({ isActive }) => (isActive ? 'active' : '')}>
            {t('nav:workspace')}
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
            {t('nav:settings')}
          </NavLink>
        </nav>
        <LanguageSwitcher />
      </div>
    </header>
  );
}

export default TopNav;
