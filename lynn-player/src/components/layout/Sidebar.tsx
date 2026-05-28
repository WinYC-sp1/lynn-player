import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';

const navItems = [
  {
    path: '/music',
    view: 'music' as const,
    labelKey: 'nav.music',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    path: '/video',
    view: 'video' as const,
    labelKey: 'nav.video',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
      </svg>
    ),
  },
  {
    path: '/online',
    view: 'online' as const,
    labelKey: 'nav.online',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3 15a9 9 0 0118 0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M6 15a6 6 0 0112 0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="17" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    path: '/bilibili',
    view: 'bilibili' as const,
    labelKey: 'nav.bilibili',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="5" width="20" height="15" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M8 2l3 3M16 2l-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="9" cy="13" r="1.5" fill="currentColor" />
        <circle cx="15" cy="13" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    path: '/settings',
    view: 'settings' as const,
    labelKey: 'nav.settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
        <path
          d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  const { sidebarCollapsed, toggleSidebar, setActiveView } = useAppStore();

  return (
    <aside
      className={`app-layout__sidebar ${sidebarCollapsed ? 'app-layout__sidebar--collapsed' : 'app-layout__sidebar--expanded'}`}
    >
      <nav className="sidebar__nav">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`}
              onClick={() => setActiveView(item.view)}
            >
              <span className="sidebar__nav-icon">{item.icon}</span>
              {!sidebarCollapsed && <span className="sidebar__nav-label">{t(item.labelKey)}</span>}
            </Link>
          );
        })}
      </nav>
      <button className={`sidebar__toggle ${sidebarCollapsed ? 'sidebar__toggle--collapsed' : ''}`} onClick={toggleSidebar}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </aside>
  );
}
