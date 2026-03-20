import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { appApi, versionApi, type App, type AppVersion } from '../../services/api'

function formatDate(date: string) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

const ENV_OPTIONS = [
  { value: 'test', label: 'Test' },
  { value: 'release', label: 'Release' },
]

export default function ProjectDashboard() {
  const { appId } = useParams<{ appId?: string }>()
  const navigate = useNavigate()
  const aid = appId ? Number(appId) : null

  const [appList, setAppList] = useState<App[]>([])
  const [selectedApp, setSelectedApp] = useState<App | null>(null)
  const [versionList, setVersionList] = useState<AppVersion[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  // 上传相关
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [changelog, setChangelog] = useState('')
  const [environment, setEnvironment] = useState('test')
  const fileRef = useRef<HTMLInputElement>(null)
  const iconRef = useRef<HTMLInputElement>(null)
  const [iconAppId, setIconAppId] = useState<number | null>(null)

  // 二维码弹窗
  const [showQr, setShowQr] = useState(false)
  const [qrUrl, setQrUrl] = useState('')
  const [qrTitle, setQrTitle] = useState('')

  const fetchAppList = async () => {
    try {
      const res = await appApi.list()
      setAppList(res.data)
      // 如果没有指定 appId，自动选第一个
      if (!appId && res.data.length > 0) {
        navigate(`/admin/app/${res.data[0].id}`, { replace: true })
      }
    } catch (e) { console.error(e) }
  }

  const fetchAppDetail = async (id: number) => {
    try {
      const [appRes, versionsRes] = await Promise.all([
        appApi.get(id),
        versionApi.list(id),
      ])
      setSelectedApp(appRes.data)
      setVersionList(versionsRes.data)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { fetchAppList() }, [])

  useEffect(() => {
    if (aid) fetchAppDetail(aid)
    else { setSelectedApp(null); setVersionList([]) }
  }, [appId])

  const selectApp = (app: App) => {
    navigate(`/admin/app/${app.id}`)
  }

  const copyToClipboard = async (text: string, id: string) => {
    try { await navigator.clipboard.writeText(text) } catch {
      const input = document.createElement('input'); input.value = text; document.body.appendChild(input); input.select(); document.execCommand('copy'); document.body.removeChild(input)
    }
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const showShareQr = (versionId?: number, label?: string) => {
    if (!selectedApp) return
    const url = versionId
      ? `${window.location.origin}/d/${selectedApp.appKey}/${versionId}`
      : `${window.location.origin}/d/${selectedApp.appKey}`
    setQrUrl(url)
    setQrTitle(label || '应用下载页')
    setShowQr(true)
  }

  const handleSelectFile = (file: File) => {
    const name = file.name.toLowerCase()
    if (!name.endsWith('.ipa') && !name.endsWith('.apk')) { alert('仅支持 IPA 和 APK 文件'); return }
    setSelectedFile(file)
  }

  const doUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    setProgress(0)
    try {
      const res = await appApi.upload(selectedFile, {
        environment,
        changelog,
        onProgress: (percent) => setProgress(percent),
      })
      setProgress(100)
      setChangelog('')
      setSelectedFile(null)
      setEnvironment('test')
      if (fileRef.current) fileRef.current.value = ''
      setShowUpload(false)
      await fetchAppList()
      const uploadedAppId = res.data?.id
      if (uploadedAppId) {
        navigate(`/admin/app/${uploadedAppId}`)
        fetchAppDetail(uploadedAppId)
      } else if (aid) {
        fetchAppDetail(aid)
      }
    } catch (e: unknown) { alert(e instanceof Error ? e.message : '上传失败') }
    finally { setTimeout(() => { setUploading(false); setProgress(0) }, 500) }
  }

  const handleDelete = async (versionId: number) => {
    if (!confirm('确定删除这个版本吗？')) return
    try { await versionApi.delete(versionId); if (aid) fetchAppDetail(aid) }
    catch (e: unknown) { alert(e instanceof Error ? e.message : '删除失败') }
  }

  const handleSetCurrent = async (versionId: number) => {
    if (!aid) return
    try { await appApi.setCurrentVersion(aid, versionId); alert('设置成功'); fetchAppDetail(aid) }
    catch (e: unknown) { alert(e instanceof Error ? e.message : '设置失败') }
  }

  const handleIconUpload = async (appIdToUpload: number, file: File) => {
    try { await appApi.uploadIcon(appIdToUpload, file); fetchAppList(); if (aid) fetchAppDetail(aid) }
    catch (e: unknown) { alert(e instanceof Error ? e.message : '图标上传失败') }
  }

  const totalDownloads = versionList.reduce((sum, v) => sum + v.downloadCount, 0)
  const currentVersion = versionList.length > 0 ? versionList[0] : null
  const downloadPageUrl = selectedApp ? `${window.location.origin}/d/${selectedApp.appKey}` : ''

  return (
    <div className="pgyer-layout">
      {/* ====== 左侧边栏 ====== */}
      <aside className="pgyer-sidebar">
        <div className="pgyer-sidebar-header">全部应用</div>
        <nav className="pgyer-sidebar-nav">
          {appList.map((app) => (
            <button
              key={app.id}
              onClick={() => selectApp(app)}
              className={`pgyer-sidebar-item ${aid === app.id ? 'active' : ''}`}
            >
              <div className="pgyer-sidebar-icon">
                {app.iconUrl ? (
                  <img src={app.iconUrl} alt={app.name} />
                ) : (
                  <span>{app.platform === 1 ? 'iOS' : 'APK'}</span>
                )}
              </div>
              <div className="pgyer-sidebar-name">{app.name}</div>
            </button>
          ))}
          {appList.length === 0 && (
            <div className="px-4 py-8 text-center text-[13px] text-slate-400">
              暂无应用，上传安装包后自动创建
            </div>
          )}
        </nav>
      </aside>

      {/* ====== 右侧内容区 ====== */}
      <div className="pgyer-main">
        {/* 顶部操作栏 */}
        <div className="pgyer-toolbar">
          <div className="flex items-center gap-3">
            {selectedApp && (
              <span className="text-[15px] font-medium text-slate-700">{selectedApp.name}</span>
            )}
          </div>
          <button onClick={() => setShowUpload(true)} className="pgyer-btn-publish">
            发布应用
          </button>
        </div>

        {/* 内容 */}
        <div className="pgyer-content">
          {selectedApp ? (
            <div className="space-y-8">
              {/* ---- 应用信息头 ---- */}
              <div className="pgyer-section">
                <div className="flex items-start gap-5">
                  <div
                    className="group relative flex h-[72px] w-[72px] flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50"
                    onClick={() => { setIconAppId(selectedApp.id); iconRef.current?.click() }}
                  >
                    {selectedApp.iconUrl ? (
                      <img src={selectedApp.iconUrl} alt={selectedApp.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[24px] font-bold text-slate-300">{selectedApp.platform === 1 ? 'iOS' : 'APK'}</span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                      <span className="text-[11px] text-white">换图标</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-[22px] font-bold text-slate-800">{selectedApp.name}</h2>
                      <span className={`rounded px-2 py-0.5 text-[12px] font-medium ${
                        selectedApp.platform === 1 ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {selectedApp.platform === 1 ? 'iOS' : 'Android'}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-[13px] text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">App Key:</span>
                        <span className="font-mono">{selectedApp.appKey}</span>
                        <button
                          onClick={() => copyToClipboard(selectedApp.appKey, 'appkey')}
                          className="text-[12px] text-emerald-600 hover:underline"
                        >
                          {copied === 'appkey' ? '已复制' : '复制'}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Bundle ID:</span>
                        <span className="font-mono">{selectedApp.bundleId}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ---- 安装页面 & Build 信息 ---- */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* 安装页面 */}
                <div className="pgyer-section">
                  <h3 className="pgyer-section-title">安装页面</h3>
                  <div className="mt-4 flex items-start gap-5">
                    <div className="rounded-lg border border-slate-200 bg-white p-2">
                      <QRCodeSVG value={downloadPageUrl} size={120} level="M" fgColor="#1e293b" bgColor="#ffffff" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-3">
                      <p className="text-[13px] text-slate-500">手机扫描二维码，或在 Safari 中打开链接安装应用</p>
                      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <span className="min-w-0 flex-1 truncate text-[13px] text-slate-500">{downloadPageUrl}</span>
                        <button
                          onClick={() => copyToClipboard(downloadPageUrl, 'dl')}
                          className="flex-shrink-0 text-[12px] text-emerald-600 hover:underline"
                        >
                          {copied === 'dl' ? '已复制' : '复制'}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => showShareQr()} className="pgyer-btn-outline text-[12px]">
                          分享二维码
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Build 信息 */}
                <div className="pgyer-section">
                  <h3 className="pgyer-section-title">Build 信息</h3>
                  {currentVersion ? (
                    <div className="mt-4">
                      <table className="pgyer-info-table">
                        <tbody>
                          <tr>
                            <td className="pgyer-info-label">当前版本</td>
                            <td>v{currentVersion.versionName} (Build {currentVersion.versionCode})</td>
                          </tr>
                          <tr>
                            <td className="pgyer-info-label">文件大小</td>
                            <td>{formatSize(currentVersion.fileSize)}</td>
                          </tr>
                          <tr>
                            <td className="pgyer-info-label">环境</td>
                            <td>
                              <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                                currentVersion.environment === 'release' ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'
                              }`}>
                                {currentVersion.environment === 'release' ? 'Release' : 'Test'}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="pgyer-info-label">上传时间</td>
                            <td>{formatDate(currentVersion.createTime)}</td>
                          </tr>
                          <tr>
                            <td className="pgyer-info-label">累计下载</td>
                            <td>{totalDownloads} 次</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-4 text-[13px] text-slate-400">暂无版本信息</p>
                  )}
                </div>
              </div>

              {/* ---- 版本列表 ---- */}
              <div className="pgyer-section">
                <div className="flex items-center justify-between">
                  <h3 className="pgyer-section-title">版本列表 <span className="font-normal text-slate-400">共 {versionList.length} 个</span></h3>
                </div>
                {versionList.length > 0 ? (
                  <div className="mt-4 overflow-x-auto">
                    <table className="pgyer-table">
                      <thead>
                        <tr>
                          <th>版本</th>
                          <th>Build</th>
                          <th>大小</th>
                          <th>环境</th>
                          <th>下载次数</th>
                          <th>上传时间</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {versionList.map((version, index) => (
                          <tr key={version.id}>
                            <td>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-800">v{version.versionName}</span>
                                {index === 0 && (
                                  <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">当前</span>
                                )}
                              </div>
                            </td>
                            <td>{version.versionCode}</td>
                            <td>{formatSize(version.fileSize)}</td>
                            <td>
                              <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                                version.environment === 'release' ? 'bg-emerald-50 text-emerald-600'
                                : version.environment === 'dev' ? 'bg-amber-50 text-amber-600'
                                : 'bg-sky-50 text-sky-600'
                              }`}>
                                {version.environment === 'release' ? 'Release' : version.environment === 'dev' ? 'Dev' : 'Test'}
                              </span>
                            </td>
                            <td>{version.downloadCount}</td>
                            <td>{formatDate(version.createTime)}</td>
                            <td>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => copyToClipboard(`${window.location.origin}/d/${selectedApp.appKey}/${version.id}`, `v${version.id}`)}
                                  className="pgyer-action-btn"
                                >
                                  {copied === `v${version.id}` ? '已复制' : '复制链接'}
                                </button>
                                <button onClick={() => showShareQr(version.id, `v${version.versionName}`)} className="pgyer-action-btn">
                                  二维码
                                </button>
                                <button onClick={() => handleSetCurrent(version.id)} className="pgyer-action-btn">
                                  设为当前
                                </button>
                                <button onClick={() => handleDelete(version.id)} className="pgyer-action-btn text-rose-500 hover:bg-rose-50 hover:text-rose-600">
                                  删除
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-4 text-[13px] text-slate-400">暂无版本，上传安装包后自动生成</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[20px] border border-slate-200 bg-slate-50">
                <div className="h-8 w-8 rounded-xl bg-emerald-200" />
              </div>
              <div className="mt-6 text-[18px] font-semibold text-slate-700">
                {appList.length === 0 ? '还没有应用' : '选择一个应用'}
              </div>
              <p className="mt-2 text-[14px] text-slate-400">
                {appList.length === 0 ? '点击「发布应用」上传安装包' : '从左侧列表中选择要查看的应用'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ====== 上传弹窗 ====== */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={() => !uploading && setShowUpload(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[20px] font-bold text-slate-800">发布应用</h2>
            <p className="mt-1 text-[14px] text-slate-500">上传 IPA 或 APK 安装包</p>

            <div className="mt-6 space-y-5">
              {/* 文件选择 */}
              {selectedFile ? (
                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-[13px] font-bold text-emerald-600">
                    {selectedFile.name.toLowerCase().endsWith('.ipa') ? 'IPA' : 'APK'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium text-slate-700">{selectedFile.name}</div>
                    <div className="text-[13px] text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</div>
                  </div>
                  {!uploading && (
                    <button onClick={() => { setSelectedFile(null); if (fileRef.current) fileRef.current.value = '' }} className="text-[13px] text-slate-400 hover:text-slate-600">
                      移除
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className="cursor-pointer rounded-xl border-2 border-dashed border-slate-200 px-6 py-10 text-center transition hover:border-emerald-300 hover:bg-emerald-50/30"
                  onClick={() => fileRef.current?.click()}
                >
                  <div className="text-[15px] font-medium text-slate-600">点击选择或拖拽文件到此处</div>
                  <p className="mt-1 text-[13px] text-slate-400">支持 .ipa 和 .apk 文件</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept=".ipa,.apk" className="hidden" onChange={() => { const f = fileRef.current?.files?.[0]; if (f) handleSelectFile(f) }} />

              {/* 更新说明 */}
              <label className="block">
                <div className="mb-1.5 text-[13px] font-medium text-slate-600">更新说明</div>
                <input placeholder="可选" value={changelog} onChange={(e) => setChangelog(e.target.value)} className="pgyer-form-input" />
              </label>

              {/* 环境 */}
              <div>
                <div className="mb-1.5 text-[13px] font-medium text-slate-600">发布环境</div>
                <div className="flex gap-2">
                  {ENV_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setEnvironment(opt.value)}
                      className={`flex-1 rounded-lg border py-2.5 text-[13px] font-medium transition ${
                        environment === opt.value
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 上传进度 */}
              {uploading && (
                <div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-600">上传中...</span>
                    <span className="text-slate-400">{Math.round(progress)}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={() => { setShowUpload(false); setSelectedFile(null); setChangelog(''); setEnvironment('test') }} disabled={uploading} className="flex-1 rounded-xl border border-slate-200 py-3 text-[14px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40">
                取消
              </button>
              <button onClick={doUpload} disabled={!selectedFile || uploading} className="flex-1 rounded-xl bg-emerald-500 py-3 text-[14px] font-medium text-white transition hover:bg-emerald-600 disabled:opacity-40">
                {uploading ? '上传中...' : '上传'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== 二维码弹窗 ====== */}
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={() => setShowQr(false)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[20px] font-bold text-slate-800">{qrTitle}</h2>
            <p className="mt-1 text-[14px] text-slate-500">扫描二维码在手机上打开下载页</p>
            <div className="mx-auto mt-6 inline-flex rounded-xl border border-slate-200 bg-white p-4">
              <QRCodeSVG value={qrUrl} size={200} level="M" fgColor="#1e293b" bgColor="#ffffff" />
            </div>
            <div className="mt-6 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="min-w-0 flex-1 break-all text-left text-[13px] text-slate-500 select-all">{qrUrl}</p>
              <button onClick={() => copyToClipboard(qrUrl, 'qr')} className="flex-shrink-0 text-[13px] text-emerald-600 hover:underline">
                {copied === 'qr' ? '已复制' : '复制'}
              </button>
            </div>
            <button onClick={() => setShowQr(false)} className="mt-6 w-full rounded-xl border border-slate-200 py-3 text-[14px] font-medium text-slate-600 transition hover:bg-slate-50">
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 隐藏的图标上传 input */}
      <input ref={iconRef} type="file" accept="image/*" className="hidden"
        onChange={() => { const f = iconRef.current?.files?.[0]; if (f && iconAppId) handleIconUpload(iconAppId, f); if (iconRef.current) iconRef.current.value = '' }} />
    </div>
  )
}
