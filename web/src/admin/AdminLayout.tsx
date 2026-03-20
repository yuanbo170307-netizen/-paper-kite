import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/admin'

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* 全局顶栏 */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="flex h-14 items-center justify-between px-5">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                <div className="h-3 w-3 rounded bg-white" />
              </div>
              <span className="text-[15px] font-semibold text-slate-800">Appspaces</span>
            </Link>
            <div className="hidden h-4 w-px bg-slate-200 sm:block" />
            {!isHome && (
              <button onClick={() => navigate('/admin')} className="hidden text-[13px] text-slate-500 hover:text-slate-700 sm:block">
                ← 返回首页
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-md bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-700 sm:inline-flex">
              内部分发平台
            </span>
            <button
              onClick={() => { localStorage.removeItem('appspaces_token'); localStorage.removeItem('appspaces_user'); navigate('/login') }}
              className="text-[13px] text-slate-400 transition hover:text-slate-600"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      {/* 内容区 */}
      <main className="mx-auto w-full max-w-6xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  )
}
