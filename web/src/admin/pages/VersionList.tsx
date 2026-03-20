import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { versionApi, appApi, type AppVersion, type App } from '../../services/api'

function formatDate(date: string) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

export default function VersionList() {
  const { appId } = useParams<{ appId: string }>()
  const [versionList, setVersionList] = useState<AppVersion[]>([])
  const [showQr, setShowQr] = useState(false)
  const [qrUrl, setQrUrl] = useState('')
  const [qrTitle, setQrTitle] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [appInfo, setAppInfo] = useState<App | null>(null)
  const [appKey, setAppKey] = useState('')
  const aid = Number(appId)

  const fetchData = async () => {
    try {
      const [versionsRes, appRes] = await Promise.all([versionApi.list(aid), appApi.get(aid)])
      setVersionList(versionsRes.data)
      setAppInfo(appRes.data)
      setAppKey(appRes.data.appKey)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { fetchData() }, [appId])

  const copyToClipboard = async (text: string, id: string) => {
    try { await navigator.clipboard.writeText(text) } catch {
      const input = document.createElement('input'); input.value = text; document.body.appendChild(input); input.select(); document.execCommand('copy'); document.body.removeChild(input)
    }
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const showShareQr = (versionId?: number, label?: string) => {
    const url = versionId ? `${window.location.origin}/d/${appKey}/${versionId}` : `${window.location.origin}/d/${appKey}`
    setQrUrl(url)
    setQrTitle(label || '应用下载页')
    setShowQr(true)
  }

  const handleDelete = async (versionId: number) => {
    if (!confirm('确定删除这个版本吗？')) return
    try { await versionApi.delete(versionId); fetchData() }
    catch (e: unknown) { alert(e instanceof Error ? e.message : '删除失败') }
  }

  const handleSetCurrent = async (versionId: number) => {
    try { await appApi.setCurrentVersion(aid, versionId); alert('设置成功'); fetchData() }
    catch (e: unknown) { alert(e instanceof Error ? e.message : '设置失败') }
  }

  const totalDownloads = versionList.reduce((sum, item) => sum + item.downloadCount, 0)

  return (
    <div className="space-y-10">
      {/* APP 信息 + 标题 */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-5">
          {appInfo && (
            <div className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center overflow-hidden rounded-[20px] border border-slate-200 bg-slate-100">
              {appInfo.iconUrl ? (
                <img src={appInfo.iconUrl} alt={appInfo.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-[22px] font-bold text-slate-400">{appInfo.platform === 1 ? 'iOS' : 'APK'}</span>
              )}
            </div>
          )}
          <div>
            <h1 className="text-[32px] font-bold tracking-[-0.04em] text-slate-800">{appInfo?.name || '版本'}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-[15px] text-slate-500">
              {appInfo && (
                <>
                  <span className={`rounded-md px-2 py-0.5 text-[12px] font-semibold ${
                    appInfo.platform === 1 ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {appInfo.platform === 1 ? 'iOS' : 'Android'}
                  </span>
                  <span className="font-mono text-[13px] text-slate-500">{appInfo.bundleId}</span>
                </>
              )}
              <span>{versionList.length} 个版本</span>
              <span>{totalDownloads} 次下载</span>
            </div>
          </div>
        </div>
        <button onClick={() => showShareQr()} className="admin-button-secondary flex-shrink-0">
          分享下载页
        </button>
      </div>

      {/* 二维码弹窗 */}
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-md" onClick={() => setShowQr(false)}>
          <div className="admin-panel w-full max-w-lg p-10 text-center" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[28px] font-bold tracking-[-0.04em] text-slate-800">{qrTitle}</h2>
            <p className="mt-2 text-[16px] text-slate-500">扫描二维码在手机上打开下载页</p>

            <div className="mx-auto mt-8 inline-flex rounded-[28px] border border-slate-200 bg-white p-6">
              <QRCodeSVG value={qrUrl} size={240} level="M" fgColor="#1e293b" bgColor="transparent" />
            </div>

            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="min-w-0 flex-1 break-all text-left text-[14px] leading-6 text-slate-500 select-all">{qrUrl}</p>
              <button
                onClick={() => copyToClipboard(qrUrl, 'qr')}
                className={`flex-shrink-0 rounded-xl px-5 py-2.5 text-[14px] font-semibold transition ${
                  copied === 'qr' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {copied === 'qr' ? '已复制' : '复制链接'}
              </button>
            </div>

            <button onClick={() => setShowQr(false)} className="admin-button-secondary mt-8 w-full rounded-2xl py-4 text-[15px]">
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 版本列表 */}
      {versionList.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-[18px] font-semibold text-slate-800">还没有版本</div>
          <p className="mt-2 text-[15px] text-slate-500">上传安装包后自动生成</p>
        </div>
      ) : (
        <div className="admin-panel overflow-hidden">
          {versionList.map((version, index) => (
            <div key={version.id} className={`px-6 py-5 transition hover:bg-slate-50 ${index > 0 ? 'border-t border-slate-100' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* 版本号 + 标签 */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[20px] font-bold tracking-[-0.03em] text-slate-800">v{version.versionName}</span>
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      version.environment === 'release' ? 'bg-emerald-50 text-emerald-600'
                      : version.environment === 'dev' ? 'bg-amber-50 text-amber-600'
                      : 'bg-sky-50 text-sky-600'
                    }`}>
                      {version.environment === 'release' ? 'Release' : version.environment === 'dev' ? 'Dev' : 'Test'}
                    </span>
                    {index === 0 && (
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">当前</span>
                    )}
                  </div>

                  {/* 元信息 */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[14px] text-slate-500">
                    <span>Build {version.versionCode}</span>
                    <span>{formatSize(version.fileSize)}</span>
                    <span>{version.downloadCount} 次下载</span>
                    <span>{formatDate(version.createTime)}</span>
                  </div>

                  {/* 更新说明 */}
                  {version.changelog && (
                    <div className="mt-3 text-[14px] leading-6 text-slate-500">{version.changelog}</div>
                  )}
                </div>

                {/* 操作 */}
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/d/${appKey}/${version.id}`, `v${version.id}`)}
                    className={`rounded-lg px-3 py-1.5 text-[13px] transition ${
                      copied === `v${version.id}` ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                  >
                    {copied === `v${version.id}` ? '已复制' : '复制链接'}
                  </button>
                  <button onClick={() => showShareQr(version.id, `v${version.versionName}`)} className="rounded-lg px-3 py-1.5 text-[13px] text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
                    二维码
                  </button>
                  <button onClick={() => handleSetCurrent(version.id)} className="rounded-lg px-3 py-1.5 text-[13px] text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
                    设为当前
                  </button>
                  <button onClick={() => handleDelete(version.id)} className="rounded-lg px-3 py-1.5 text-[13px] text-slate-500 transition hover:bg-rose-50 hover:text-rose-500">
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
