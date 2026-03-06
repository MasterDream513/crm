'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Users, ShoppingCart, Package,
  Settings, LogOut, AlertTriangle, Menu, X
} from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/',          label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/customers', label: '顧客管理',       icon: Users },
  { href: '/sales',     label: '売上入力',        icon: ShoppingCart },
  { href: '/products',  label: '商品管理',        icon: Package },
  { href: '/settings',  label: '設定',            icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [overdueCount, setOverdueCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('crm_access_token')
    if (!token) { router.push('/login'); return }
    const stored = localStorage.getItem('crm_user')
    if (stored) setUser(JSON.parse(stored))

    api.followLogs.overdueCount()
      .then((d) => setOverdueCount(d.count))
      .catch(() => {})
  }, [router])

  async function handleLogout() {
    await api.auth.logout().catch(() => {})
    localStorage.removeItem('crm_access_token')
    localStorage.removeItem('crm_user')
    router.push('/login')
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <h1 className="text-lg font-bold text-white tracking-tight">経営ダッシュボード</h1>
        {user && <p className="text-xs text-slate-400 mt-0.5">{user.tenantName}</p>}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-slate-700 text-white'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            )}
          >
            <Icon size={18} />
            {label}
            {href === '/customers' && overdueCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {overdueCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs text-white font-medium">
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white truncate">{user?.email}</p>
            <p className="text-xs text-slate-400">{user?.role === 'ADMIN' ? '管理者' : '閲覧者'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors w-full"
        >
          <LogOut size={14} /> ログアウト
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 bg-slate-800 flex-col flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-60 bg-slate-800 flex flex-col">
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500">
            <Menu size={22} />
          </button>
          <h1 className="text-base font-semibold text-gray-800">経営ダッシュボード</h1>
          {overdueCount > 0 && (
            <span className="ml-auto flex items-center gap-1 text-xs text-red-600 font-medium">
              <AlertTriangle size={14} /> {overdueCount}件 フォロー期限超過
            </span>
          )}
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
