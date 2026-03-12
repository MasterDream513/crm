import { Menu, Globe } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useLocation } from 'react-router-dom';

interface MobileTopBarProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, { ja: string; en: string }> = {
  '/': { ja: 'ダッシュボード', en: 'Dashboard' },
  '/customers': { ja: '顧客管理', en: 'Customers' },
  '/sales': { ja: '売上入力', en: 'Sales' },
  '/products': { ja: '商品管理', en: 'Products' },
  '/marketing': { ja: 'マーケティング', en: 'Marketing' },
  '/settings': { ja: '設定', en: 'Settings' },
};

export const MobileTopBar = ({ onMenuClick }: MobileTopBarProps) => {
  const { locale, toggleLocale } = useLocale();
  const location = useLocation();

  const matchedPath = Object.keys(pageTitles).find(
    (p) => p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)
  ) || '/';

  const title = pageTitles[matchedPath]?.[locale] || '';

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
