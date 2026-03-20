import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { publicApi, type PublicApp, type AppVersion } from '../services/api'

type Platform = 'ios-safari' | 'ios-other' | 'android' | 'pc'

function detectPlatform(): Platform {
  const ua = navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/i.test(ua)
  const isAndroid = /Android/i.test(ua)
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/i.test(ua)
  if (isIOS && isSafari) return 'ios-safari'
  if (isIOS) return 'ios-other'
  if (isAndroid) return 'android'
  return 'pc'
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function formatRelativeTime(date: string): string {
  const now = Date.now()
  const d = new Date(date).getTime()
  const diff = now - d
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  return new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

/** 彩色顶部条纹 banner */
function ColorBanner() {
  const colors = ['#f97066', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#818cf8', '#c084fc', '#f472b6',
    '#f97066', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#818cf8', '#c084fc', '#f472b6',
    '#f97066', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#818cf8', '#c084fc', '#f472b6']
  return (
    <div className="flex h-[40px] overflow-hidden">
      {colors.map((c, i) => (
        <div key={i} className="flex-1" style={{ backgroundColor: c }} />
      ))}
    </div>
  )
}

export default function DownloadPage() {
  const { appKey, versionId } = useParams<{ appKey: string; versionId?: string }>()
  const [app, setApp] = useState<PublicApp | null>(null)
  const [error, setError] = useState('')
  const [needPassword, setNeedPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [verified, setVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [historyList, setHistoryList] = useState<AppVersion[]>([])
  const [historyPage, setHistoryPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const platform = detectPlatform()

  const fetchHistory = async (page: number, append: boolean = false) => {
    if (!appKey) return
    setLoadingMore(true)
    try {
      const res = await publicApi.getVersions(appKey, page, 5)
      const list = res.data || []
      setHistoryList(prev => append ? [...prev, ...list] : list)
      setHasMore(list.length >= 5)
      setHistoryPage(page)
    } catch { /* ignore */ }
    finally { setLoadingMore(false) }
  }

  useEffect(() => {
    if (!appKey) return
    const request = versionId
      ? publicApi.getAppVersion(appKey, Number(versionId))
      : publicApi.getApp(appKey)
    request.then((res) => {
      setApp(res.data)
      if (res.data.accessType === 2) setNeedPassword(true)
      fetchHistory(1)
    }).catch(() => setError('应用不存在'))
  }, [appKey])

  const handleVerify = async () => {
    if (!appKey || !password) return
    setVerifying(true)
    try { await publicApi.verify(appKey, password); setVerified(true); setNeedPassword(false) }
    catch { alert('密码错误') }
    finally { setVerifying(false) }
  }

  const handleInstall = () => {
    if (!app?.currentVersion) return
    const vid = app.currentVersion.id
    if (platform === 'android') {
      window.location.href = `/api/download/${vid}`
    }
  }

  const iosInstallUrl = app?.currentVersion
    ? `itms-services://?action=download-manifest&url=${encodeURIComponent(`${window.location.origin}/api/manifest/${app.currentVersion.id}.plist`)}`
    : ''

  // 加载中
  if (!app && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa]">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-emerald-400 border-t-transparent" />
      </div>
    )
  }

  // 错误
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow">
            <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="mt-4 text-[16px] font-medium text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  // 密码验证
  if (needPassword && !verified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4">
        <div className="w-full max-w-sm rounded-lg bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f7fa]">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="mt-4 text-[18px] font-medium text-gray-800">请输入安装密码</h2>
          <p className="mt-1 text-[14px] text-gray-400">此应用需要密码才能安装</p>
          <input
            type="password"
            placeholder="安装密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            className="mt-5 h-11 w-full rounded border border-gray-200 px-4 text-center text-[15px] outline-none transition focus:border-emerald-400"
          />
          <button
            onClick={handleVerify}
            disabled={verifying || !password}
            className="mt-3 h-11 w-full rounded-lg bg-emerald-400 text-[16px] font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {verifying ? '验证中...' : '确认'}
          </button>
        </div>
      </div>
    )
  }

  const version = app!.currentVersion

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* 彩色顶部 banner */}
      <ColorBanner />

      {/* 主体内容 */}
      <div className="mx-auto max-w-[600px] px-5">

        {/* 应用信息 + 二维码 + 安装按钮 */}
        <div className="py-10 text-center">
          {/* 图标 */}
          <div className="mx-auto h-[88px] w-[88px] overflow-hidden rounded-[22px] bg-white shadow-sm">
            {app!.iconUrl ? (
              <img src={app!.iconUrl} alt={app!.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[32px] text-gray-300">
                {app!.platform === 1 ? 'iOS' : 'APK'}
              </div>
            )}
          </div>

          {/* 名称 & 平台 */}
          <h1 className="mt-4 text-[22px] font-semibold text-gray-800">{app!.name}</h1>
          <p className="mt-1.5 flex items-center justify-center gap-1.5 text-[14px] text-gray-500">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            适用于 {app!.platform === 1 ? 'iOS' : 'Android'} 设备
          </p>

          {/* 二维码（仅 PC 显示大二维码） */}
          {platform === 'pc' && (
            <div className="mx-auto mt-6 inline-block rounded-lg border border-gray-200 bg-white p-3">
              <img src={`/api/qrcode/${appKey}`} alt="下载二维码" className="h-[160px] w-[160px]" />
            </div>
          )}

          {/* 安装/下载按钮 */}
          {version && (
            <div className="mt-6">
              {platform === 'ios-safari' && (
                <a href={iosInstallUrl}
                  className="mx-auto flex h-[48px] w-[200px] items-center justify-center rounded-full bg-emerald-400 text-[17px] font-medium text-white shadow-sm transition hover:bg-emerald-500">
                  安装
                </a>
              )}
              {platform === 'ios-other' && (
                <div className="mx-auto max-w-sm rounded-lg border border-orange-200 bg-orange-50 p-4 text-center">
                  <p className="text-[14px] font-medium text-orange-700">请使用 Safari 浏览器打开此页面</p>
                  <p className="mt-1 text-[12px] text-orange-500">iOS 应用仅支持通过 Safari 安装</p>
                </div>
              )}
              {platform === 'android' && (
                <button onClick={handleInstall}
                  className="mx-auto flex h-[48px] w-[200px] items-center justify-center rounded-full bg-emerald-400 text-[17px] font-medium text-white shadow-sm transition hover:bg-emerald-500">
                  安装
                </button>
              )}
              {platform === 'pc' && (
                <button onClick={handleInstall}
                  className="mx-auto flex h-[48px] w-[200px] items-center justify-center rounded-full bg-emerald-400 text-[17px] font-medium text-white shadow-sm transition hover:bg-emerald-500">
                  安装
                </button>
              )}
            </div>
          )}
          {!version && (
            <p className="mt-6 text-[14px] text-gray-400">暂无可用版本</p>
          )}
        </div>

        {/* 分割线 */}
        <hr className="border-gray-200" />

        {/* 关于 App */}
        {version && (
          <div className="py-8">
            <h2 className="text-[18px] font-bold text-gray-800">关于{app!.name}</h2>
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-x-8">
                <div className="flex items-center justify-between border-b border-gray-100 py-2.5 text-[14px]">
                  <span className="text-gray-500">大小</span>
                  <span className="text-gray-700">{formatSize(version.fileSize)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 py-2.5 text-[14px]">
                  <span className="text-gray-500">更新时间</span>
                  <span className="text-gray-700">{formatRelativeTime(version.createTime)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 py-2.5 text-[14px]">
                  <span className="text-gray-500">版本</span>
                  <span className="text-gray-700">{version.versionName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 py-2.5 text-[14px]">
                  <span className="text-gray-500">Build</span>
                  <span className="text-gray-700">{version.versionCode}</span>
                </div>
                {version.environment && (
                  <div className="flex items-center justify-between border-b border-gray-100 py-2.5 text-[14px]">
                    <span className="text-gray-500">环境</span>
                    <span className={`inline-block rounded px-2 py-0.5 text-[13px] font-medium ${
                      version.environment === 'release'
                        ? 'bg-emerald-50 text-emerald-600'
                        : version.environment === 'test'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                    }`}>
                      {version.environment}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 更新说明 */}
        {version?.changelog && (
          <>
            <hr className="border-gray-200" />
            <div className="py-8">
              <h2 className="text-[18px] font-bold text-gray-800">{app!.name}更新说明</h2>
              <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-gray-600">{version.changelog}</p>
            </div>
          </>
        )}

        {/* 历史版本 */}
        {historyList.length > 0 && (
          <>
            <hr className="border-gray-200" />
            <div className="py-8">
              <h2 className="text-[18px] font-bold text-gray-800">{app!.name}的其它版本</h2>
              <div className="mt-4 overflow-hidden rounded-lg border border-gray-100 bg-white">
                {historyList.map((v, i) => (
                  <a
                    key={v.id}
                    href={`/d/${appKey}/${v.id}`}
                    className={`flex items-center px-5 py-3 text-[14px] transition hover:bg-gray-50 ${
                      i < historyList.length - 1 ? 'border-b border-gray-50' : ''
                    }`}
                  >
                    <span className="w-[40%] text-gray-700">{v.versionName} (build {v.versionCode})</span>
                    <span className="w-[30%] text-gray-500 capitalize">{v.environment || '-'}</span>
                    <span className="w-[30%] text-right text-gray-400">{formatRelativeTime(v.createTime)}</span>
                  </a>
                ))}
              </div>
              {hasMore && (
                <button
                  onClick={() => fetchHistory(historyPage + 1, true)}
                  disabled={loadingMore}
                  className="mt-4 flex w-full items-center justify-center gap-1 py-2 text-[14px] text-blue-500 transition hover:text-blue-600 disabled:opacity-50"
                >
                  {loadingMore ? '加载中...' : (
                    <>
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                      查看更多
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        )}

        {/* 底部 */}
        <hr className="border-gray-200" />
        <div className="py-8 text-center">
          <p className="text-[12px] text-gray-400">由 纸鸢 提供分发服务</p>
        </div>
      </div>
    </div>
  )
}
