import { Menu, Globe } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useLocation } from 'react-router-dom';

interface MobileTopBarProps {
  onMenuClick: () => void;
}

const pageTitleKeys: Record<string, string> = {
  '/': 'dashboard',
  '/customers': 'customers',
  '/sales': 'sales',
  '/products': 'products',
  '/expenses': 'expense',
  '/events': 'events',
  '/marketing': 'marketing',
  '/settings': 'settings',
};

export const MobileTopBar = ({ onMenuClick }: MobileTopBarProps) => {
  const { locale, toggleLocale, t } = useLocale();
  const location = useLocation();

  const matchedPath = Object.keys(pageTitleKeys).find(
    (p) => p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)
  ) || '/';

  const title = t(pageTitleKeys[matchedPath] as any) || '';

  return (
    <div className="flex items-center justify-between border-b bg-card px-4 py-3 lg:hidden">
      <button onClick={onMenuClick} className="text-foreground">
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>
      <button onClick={toggleLocale} className="text-muted-foreground">
        <Globe className="h-4 w-4" />
      </button>
    </div>
  );
};
