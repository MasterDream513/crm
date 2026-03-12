import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Receipt, Package, TrendingUp, Settings, LogOut, Globe } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';

interface AppSidebarProps {
  onClose?: () => void;
}

const navItems = [
  { key: 'dashboard' as const, path: '/', icon: LayoutDashboard },
  { key: 'customers' as const, path: '/customers', icon: Users },
  { key: 'sales' as const, path: '/sales', icon: Receipt },
  { key: 'products' as const, path: '/products', icon: Package },
  { key: 'marketing' as const, path: '/marketing', icon: TrendingUp },
  { key: 'settings' as const, path: '/settings', icon: Settings },
];

export const AppSidebar = ({ onClose }: AppSidebarProps) => {
  const { t, toggleLocale, locale } = useLocale();
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-full w-[260px] flex-col" style={{ backgroundColor: 'hsl(var(--sidebar-bg))' }}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
          経
        </div>
        <div>
          <h1 className="text-sm font-bold" style={{ color: 'hsl(var(--sidebar-accent-foreground))' }}>
            {t('brandTitle')}
          </h1>
          {user?.tenantName && (
            <p className="text-xs" style={{ color: 'hsl(var(--sidebar-muted))' }}>
              {user.tenantName}
            </p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map(({ key, path, icon: Icon }) => {
          const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
          return (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-l-2'
                  : 'border-l-2 border-transparent'
              }`}
              style={{
                backgroundColor: isActive ? 'hsl(var(--sidebar-active))' : undefined,
                color: isActive ? 'hsl(var(--sidebar-accent-foreground))' : 'hsl(var(--sidebar-fg))',
                borderLeftColor: isActive ? 'hsl(var(--sidebar-accent-border))' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'hsl(var(--sidebar-hover))';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {t(key)}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t px-4 py-4 space-y-2" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        {user?.email && (
          <p className="truncate text-xs" style={{ color: 'hsl(var(--sidebar-muted))' }}>
            {user.email}
          </p>
        )}
        <div className="flex items-center justify-between">
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1.5 text-xs transition-colors"
            style={{ color: 'hsl(var(--sidebar-muted))' }}
          >
            <Globe className="h-3.5 w-3.5" />
            {locale === 'ja' ? 'English' : '日本語'}
          </button>
          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
            style={{ color: 'hsl(var(--sidebar-muted))' }}
          >
            <LogOut className="h-3.5 w-3.5" />
            {t('logout')}
          </button>
        </div>
      </div>
    </div>
  );
};
