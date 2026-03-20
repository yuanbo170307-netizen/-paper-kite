import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { appApi, versionApi, type App, type AppVersion } from '../services/api'

function formatDate(date: string) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function CopyIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`inline-block h-3.5 w-3.5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75m11.25-2.25h-9.75A1.125 1.125 0 007.125 5.625v12.75c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125z" />
    </svg>
  )
}

/** 带中心图标的二维码 */
function QrWithIcon({ value, size, iconUrl }: { value: string; size: number; iconUrl?: string }) {
  const iconSize = Math.round(size * 0.28)
  const iconOffset = Math.round((size - iconSize) / 2)
  const radius = Math.round(iconSize * 0.2)
  const pad = Math.round(iconSize * 0.12)
  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <QRCodeSVG value={value} size={size} level="H" fgColor="#1e293b" bgColor="#ffffff" />
      {iconUrl && (
        <div
          className="absolute overflow-hidden bg-white"
          style={{
            left: iconOffset - pad,
            top: iconOffset - pad,
            width: iconSize + pad * 2,
            height: iconSize + pad * 2,
            borderRadius: radius + pad * 0.3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={iconUrl}
            alt=""
            style={{ width: iconSize, height: iconSize, borderRadius: radius, objectFit: 'cover' }}
          />
        </div>
      )}
    </div>
  )
}

function UploadIcon() {
  return (
    <svg className="inline-block h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3.75 3.75 0 013.547 5.596A4.5 4.5 0 0118 19.5H6.75z" />
    </svg>
  )
}

/** 上传步骤 */
type UploadStep = 'idle' | 'select' | 'confirm' | 'uploading'

/** 上传后解析的信息（后端返回） */
interface ParsedInfo {
  name: string
  versionName: string
  versionCode: number
  platform: number
  iconUrl: string
  bundleId: string
  fileSize: number
}

export default function Dashboard() {
  const { appId } = useParams<{ appId?: string }>()
  const navigate = useNavigate()
  const aid = appId ? Number(appId) : null

  const [allApps, setAllApps] = useState<App[]>([])
  const [selectedApp, setSelectedApp] = useState<App | null>(null)
  const [versionList, setVersionList] = useState<AppVersion[]>([])
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('app')

  // 上传流程（整页）
  const [uploadStep, setUploadStep] = useState<UploadStep>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedInfo, setParsedInfo] = useState<ParsedInfo | null>(null)
  const [changelog, setChangelog] = useState('')
  const [environment, setEnvironment] = useState('test')
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // 二维码弹窗
  const [showQr, setShowQr] = useState(false)
  const [qrUrl, setQrUrl] = useState('')
  const [qrTitle, setQrTitle] = useState('')

  // 下载二维码弹窗（多尺寸）
  const [showQrDownload, setShowQrDownload] = useState(false)
  const [qrDownloadUrl, setQrDownloadUrl] = useState('')

  // 操作下拉
  const [openAction, setOpenAction] = useState<number | null>(null)

  const username = localStorage.getItem('appspaces_user') || ''

  const fetchAll = async () => {
    try {
      const res = await appApi.list()
      setAllApps(res.data)
      if (!appId && res.data.length > 0) {
        navigate(`/admin/app/${res.data[0].id}`, { replace: true })
      }
    } catch (e) { console.error(e) }
  }

  const fetchAppDetail = async (id: number) => {
    try {
      const [appRes, versionsRes] = await Promise.all([appApi.get(id), versionApi.list(id)])
      setSelectedApp(appRes.data)
      setVersionList(versionsRes.data)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { fetchAll() }, [])
  useEffect(() => {
    if (aid) { fetchAppDetail(aid); setActiveTab('app') }
    else { setSelectedApp(null); setVersionList([]) }
  }, [appId])

  useEffect(() => {
    const handler = () => setOpenAction(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const filteredApps = useMemo(() => {
    if (!search.trim()) return allApps
    const q = search.toLowerCase()
    return allApps.filter((a) => a.name.toLowerCase().includes(q) || a.bundleId.toLowerCase().includes(q))
  }, [allApps, search])

  const selectApp = (app: App) => {
    setUploadStep('idle')
    navigate(`/admin/app/${app.id}`)
  }

  /** 图片加载失败时隐藏自己、显示兄弟占位 */
  const onImgErr = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    img.style.display = 'none'
    const sib = img.nextElementSibling as HTMLElement | null
    if (sib) sib.style.display = 'flex'
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

  const openQrDownload = () => {
    if (!selectedApp) return
    setQrDownloadUrl(`${window.location.origin}/d/${selectedApp.appKey}`)
    setShowQrDownload(true)
  }

  const downloadQrCode = async (sizePx: number) => {
    const svgEl = document.getElementById('qr-download-svg')?.querySelector('svg')
    if (!svgEl) return
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const canvas = document.createElement('canvas')
    canvas.width = sizePx
    canvas.height = sizePx
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 画二维码
    await new Promise<void>((resolve) => {
      const qrImg = new Image()
      qrImg.onload = () => {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, sizePx, sizePx)
        ctx.drawImage(qrImg, 0, 0, sizePx, sizePx)
        resolve()
      }
      qrImg.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    })

    // 在中心画 App 图标（先 fetch 转 base64 避免跨域污染 canvas）
    const iconUrl = selectedApp?.iconUrl
    if (iconUrl) {
      try {
        const resp = await fetch(iconUrl)
        const blob = await resp.blob()
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })
        await new Promise<void>((resolve) => {
          const iconImg = new Image()
          iconImg.onload = () => {
            const iconSize = Math.round(sizePx * 0.28)
            const iconX = Math.round((sizePx - iconSize) / 2)
            const iconY = Math.round((sizePx - iconSize) / 2)
            const radius = Math.round(iconSize * 0.18)
            const pad = Math.round(iconSize * 0.1)
            ctx.fillStyle = '#ffffff'
            ctx.beginPath()
            ctx.roundRect(iconX - pad, iconY - pad, iconSize + pad * 2, iconSize + pad * 2, radius + pad * 0.3)
            ctx.fill()
            ctx.save()
            ctx.beginPath()
            ctx.roundRect(iconX, iconY, iconSize, iconSize, radius)
            ctx.clip()
            ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize)
            ctx.restore()
            resolve()
          }
          iconImg.onerror = () => resolve()
          iconImg.src = base64
        })
      } catch {
        // 图标加载失败，不影响二维码下载
      }
    }

    const link = document.createElement('a')
    link.download = `qrcode_${sizePx}px.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  /** 选择文件后，进入确认步骤 */
  const handleFileSelected = (file: File) => {
    const name = file.name.toLowerCase()
    if (!name.endsWith('.ipa') && !name.endsWith('.apk')) { alert('仅支持 IPA 和 APK 文件'); return }
    setSelectedFile(file)

    // 从文件名推断基本信息（实际解析由后端完成）
    const isIpa = name.endsWith('.ipa')
    const baseName = file.name.replace(/\.(ipa|apk)$/i, '')
    setParsedInfo({
      name: baseName,
      versionName: '',
      versionCode: 0,
      platform: isIpa ? 1 : 2,
      iconUrl: '',
      bundleId: '',
      fileSize: file.size,
    })
    setUploadStep('confirm')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelected(file)
  }

  /** 发布应用（上传） */
  const doPublish = async () => {
    if (!selectedFile) return
    setUploadStep('uploading'); setProgress(0)
    try {
      const res = await appApi.upload(selectedFile, {
        environment, changelog,
        onProgress: (p) => setProgress(p),
      })
      // 上传成功，刷新列表，跳转到新应用
      setUploadStep('idle')
      setSelectedFile(null); setParsedInfo(null); setChangelog(''); setEnvironment('test')
      if (fileRef.current) fileRef.current.value = ''
      await fetchAll()
      // 跳到刚上传的 app
      if (res.data?.id) {
        navigate(`/admin/app/${res.data.id}`)
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '上传失败')
      setUploadStep('confirm')
    }
  }

  const cancelUpload = () => {
    setUploadStep('idle')
    setSelectedFile(null); setParsedInfo(null); setChangelog(''); setEnvironment('test')
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleDelete = async (versionId: number) => {
    if (!confirm('确定删除这个版本吗？')) return
    try { await versionApi.delete(versionId); if (aid) fetchAppDetail(aid) }
    catch (e: unknown) { alert(e instanceof Error ? e.message : '删除失败') }
  }

  const handleSetCurrent = async (versionId: number) => {
    if (!aid) return
    try { await appApi.setCurrentVersion(aid, versionId); fetchAppDetail(aid) }
    catch (e: unknown) { alert(e instanceof Error ? e.message : '设置失败') }
  }

  const currentVersion = versionList.length > 0 ? versionList[0] : null
  const downloadPageUrl = selectedApp ? `${window.location.origin}/d/${selectedApp.appKey}` : ''

  const TABS = [
    { key: 'app', label: '应用' },
    { key: 'version', label: '版本' },
    { key: 'settings', label: '设置' },
  ]

  /** 是否显示整页上传 */
  const showingUpload = uploadStep !== 'idle'

  return (
    <div className="flex h-screen flex-col">
      {/* ====== 全局顶栏 ====== */}
      <header className="flex h-[50px] flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="纸鸢" className="h-7 w-7" />
          <span className="text-[14px] font-bold tracking-wide text-slate-700">纸鸢</span>
        </div>
        <div className="flex items-center gap-4 text-[13px]">
          <span className="text-slate-600">{username}</span>
          <button
            onClick={() => { localStorage.removeItem('appspaces_token'); localStorage.removeItem('appspaces_user'); navigate('/login') }}
            className="text-slate-400 hover:text-slate-600"
          >
            退出
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ====== 左侧边栏 ====== */}
        <aside className="flex w-[170px] flex-shrink-0 flex-col border-r border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
            <svg className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索您的应用"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-slate-600 outline-none placeholder:text-slate-400"
            />
          </div>
          <nav className="flex-1 overflow-y-auto py-1">
            {filteredApps.map((app) => (
              <button
                key={app.id}
                onClick={() => selectApp(app)}
                className={`flex w-full items-center gap-2.5 px-3 py-[7px] text-left transition-colors ${
                  !showingUpload && aid === app.id ? 'bg-emerald-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="h-[32px] w-[32px] flex-shrink-0 overflow-hidden rounded-[8px] border border-slate-200 bg-slate-50">
                  {app.iconUrl && <img src={app.iconUrl} alt="" className="h-full w-full object-cover" onError={onImgErr} />}
                  <div className="items-center justify-center text-[9px] font-bold text-slate-300" style={{ display: app.iconUrl ? 'none' : 'flex', width: '100%', height: '100%' }}>
                    {app.platform === 1 ? 'iOS' : 'APK'}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[14px] leading-tight font-medium text-slate-700">{app.name}</div>
                  <div className="text-[12px] leading-tight text-slate-400">{app.platform === 1 ? 'iOS' : 'Android'}</div>
                </div>
              </button>
            ))}
            {filteredApps.length === 0 && (
              <div className="px-3 py-8 text-center text-[12px] text-slate-400">暂无应用</div>
            )}
          </nav>
        </aside>

        {/* ====== 右侧内容 ====== */}
        <main className="flex flex-1 flex-col overflow-hidden bg-white">

          {/* ======== 整页上传流程 ======== */}
          {showingUpload ? (
            <div className="flex flex-1 flex-col overflow-y-auto">
              {/* 上传顶栏 */}
              <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-8 py-3">
                <h2 className="text-[18px] font-bold text-slate-800">
                  {uploadStep === 'select' ? '发布应用' : '即将完成'}
                </h2>
                <div className="flex items-center gap-4 text-[13px] text-slate-500">
                  {uploadStep === 'select' && <span>发布应用，仅需两步</span>}
                  {uploadStep === 'confirm' && <span>简单设置下面的信息，您的应用发布即可完成</span>}
                  <button onClick={cancelUpload} className="text-slate-400 hover:text-slate-600">取消</button>
                </div>
              </div>

              <div className="flex-1 px-8 py-8">
                {/* 步骤一：选择文件 */}
                {uploadStep === 'select' && (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`mx-auto flex max-w-[900px] flex-col items-center justify-center rounded-lg border-2 border-dashed py-32 transition ${
                      dragOver ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-200'
                    }`}
                  >
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2 rounded-lg bg-emerald-400 px-8 py-3 text-[15px] font-medium text-white transition hover:bg-emerald-500"
                    >
                      <UploadIcon />
                      立刻上传
                    </button>
                    <p className="mt-4 text-[14px] text-slate-500">
                      点击按钮选择应用的安装包，或拖拽文件到此区域
                    </p>
                    <p className="mt-1 text-[13px] text-slate-400">
                      （支持 ipa、apk 文件）
                    </p>
                    <input ref={fileRef} type="file" accept=".ipa,.apk" className="hidden"
                      onChange={() => { const f = fileRef.current?.files?.[0]; if (f) handleFileSelected(f) }} />
                  </div>
                )}

                {/* 步骤二：确认信息 & 发布 */}
                {(uploadStep === 'confirm' || uploadStep === 'uploading') && parsedInfo && selectedFile && (
                  <div className="mx-auto max-w-[900px]">
                    {/* 解析出的应用信息 */}
                    <div className="rounded-lg border border-slate-200 p-6">
                      <div className="flex items-start gap-5">
                        <div className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                          {parsedInfo.iconUrl ? (
                            <img src={parsedInfo.iconUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="text-[20px] font-bold text-slate-300">
                              {parsedInfo.platform === 1 ? 'iOS' : 'APK'}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 pt-1">
                          <div className="text-[18px] font-bold text-slate-800">{parsedInfo.name || selectedFile.name}</div>
                          <div className="mt-1 text-[13px] text-slate-500">
                            {parsedInfo.versionName && <>版本: {parsedInfo.versionName} {parsedInfo.versionCode ? `(Build: ${parsedInfo.versionCode})` : ''}</>}
                            {!parsedInfo.versionName && <>文件大小: {formatSize(parsedInfo.fileSize)}</>}
                          </div>
                          <div className="mt-0.5 text-[13px] text-slate-400">
                            适用于 {parsedInfo.platform === 1 ? 'iOS' : 'Android'} 所有设备
                          </div>
                        </div>
                        <button
                          onClick={doPublish}
                          disabled={uploadStep === 'uploading'}
                          className="flex items-center gap-2 rounded-lg bg-emerald-400 px-6 py-2.5 text-[14px] font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          发布应用
                        </button>
                      </div>

                      {/* 上传进度 */}
                      {uploadStep === 'uploading' && (
                        <div className="mt-5">
                          <div className="flex justify-between text-[12px]">
                            <span className="text-slate-600">上传中...</span>
                            <span className="text-slate-400">{Math.round(progress)}%</span>
                          </div>
                          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-emerald-400 transition-all duration-300" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 发布设置 */}
                    <div className="mt-6 space-y-5">
                      <div>
                        <div className="mb-1.5 text-[13px] text-slate-500">发布环境</div>
                        <div className="flex gap-2">
                          {[{ value: 'test', label: 'Test' }, { value: 'release', label: 'Release' }].map((opt) => (
                            <button key={opt.value} onClick={() => setEnvironment(opt.value)}
                              className={`rounded-lg border px-6 py-2 text-[13px] font-medium transition ${
                                environment === opt.value ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                              }`}>{opt.label}</button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="mb-1.5 text-[13px] text-slate-500">版本更新说明</div>
                        <textarea
                          placeholder="请输入该版本的更新说明"
                          value={changelog}
                          onChange={(e) => setChangelog(e.target.value)}
                          className="h-32 w-full resize-y rounded-lg border border-slate-200 px-4 py-3 text-[14px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-400"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : selectedApp ? (
            <>
              {/* ======== Tab 导航栏 ======== */}
              <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-8">
                <div className="flex gap-0">
                  {TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`relative px-5 py-3 text-[14px] font-medium transition-colors ${
                        activeTab === tab.key ? 'text-emerald-500' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {tab.label}
                      {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500" />}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setUploadStep('select')}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-400 px-5 py-2 text-[13px] font-medium text-white transition hover:bg-emerald-500"
                >
                  <span className="text-[16px] leading-none">+</span>
                  上传新版本
                </button>
              </div>

              {/* ======== 内容区 ======== */}
              <div className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-[1100px] px-8 py-6">

                  {activeTab === 'app' && (
                    <>
                      {/* 应用信息头 */}
                      <div className="flex items-start gap-5">
                        <div className="h-[80px] w-[80px] flex-shrink-0 overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50">
                          {selectedApp.iconUrl && (
                            <img src={selectedApp.iconUrl} alt="" className="h-full w-full object-cover" onError={onImgErr} />
                          )}
                          <div className="items-center justify-center text-[22px] font-bold text-slate-300" style={{ display: selectedApp.iconUrl ? 'none' : 'flex', width: '100%', height: '100%' }}>
                            {selectedApp.platform === 1 ? 'iOS' : 'APK'}
                          </div>
                        </div>
                        <div className="min-w-0 pt-1">
                          <div className="flex items-baseline gap-3">
                            <h1 className="text-[24px] font-bold text-slate-800">{selectedApp.name}</h1>
                            <span className="text-[18px] text-slate-300">{selectedApp.platform === 1 ? 'iOS' : 'Android'}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-1 text-[13px] text-slate-500">
                            <span className="font-medium text-slate-600">App Key</span>
                            <span className="ml-2 font-mono text-slate-500">{selectedApp.appKey}</span>
                            <button onClick={() => copyToClipboard(selectedApp.appKey, 'appkey')} className="ml-1 text-slate-400 hover:text-emerald-500"><CopyIcon /></button>
                          </div>
                        </div>
                      </div>

                      <hr className="my-6 border-slate-200" />

                      {/* 安装页面 */}
                      <h2 className="text-[18px] font-bold text-slate-800">安装页面</h2>
                      <div className="mt-4 flex items-start gap-5">
                        <div className="rounded-lg border border-slate-200 p-2">
                          <QrWithIcon value={downloadPageUrl} size={80} iconUrl={selectedApp.iconUrl} />
                        </div>
                        <div className="min-w-0 flex-1 pt-1">
                          <p className="text-[13px] text-slate-500">将下载链接以聊天、邮件发送给用户，或在您的官网中链接</p>
                          <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5">
                            <span className="font-mono text-[13px] text-slate-600">{downloadPageUrl}</span>
                            <button onClick={() => copyToClipboard(downloadPageUrl, 'dl')} className="text-slate-400 hover:text-emerald-500"><CopyIcon /></button>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px]">
                            <button onClick={() => copyToClipboard(downloadPageUrl, 'dl2')} className="text-emerald-500 hover:underline">
                              {copied === 'dl' || copied === 'dl2' ? '✓ 已复制' : '复制链接'}
                            </button>
                            <a href={downloadPageUrl} target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline">直接打开</a>
                            <button onClick={() => openQrDownload()} className="text-emerald-500 hover:underline">下载二维码</button>
                          </div>
                        </div>
                      </div>

                      <hr className="my-6 border-slate-200" />

                      {/* Build 信息 */}
                      <h2 className="text-[18px] font-bold text-slate-800">Build 信息</h2>
                      {currentVersion ? (
                        <div className="mt-4 grid grid-cols-2 gap-y-5 text-[13px]">
                          <div>
                            <div className="text-slate-400">应用版本</div>
                            <div className="mt-1 flex items-center gap-1.5 text-slate-800">
                              {currentVersion.versionName}
                              <button onClick={() => copyToClipboard(currentVersion.versionName, 'ver')} className="text-slate-400 hover:text-emerald-500"><CopyIcon /></button>
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400">Build 版本</div>
                            <div className="mt-1 flex items-center gap-1.5 text-slate-800">
                              {currentVersion.versionCode}
                              <button onClick={() => copyToClipboard(String(currentVersion.versionCode), 'build')} className="text-slate-400 hover:text-emerald-500"><CopyIcon /></button>
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400">Package ID</div>
                            <div className="mt-1 flex items-center gap-1.5 text-slate-800">
                              <span className="font-mono">{selectedApp.bundleId}</span>
                              <button onClick={() => copyToClipboard(selectedApp.bundleId, 'pkg')} className="text-slate-400 hover:text-emerald-500"><CopyIcon /></button>
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400">文件大小</div>
                            <div className="mt-1 text-slate-800">{formatSize(currentVersion.fileSize)}</div>
                          </div>
                          <div>
                            <div className="text-slate-400">发布环境</div>
                            <div className="mt-1">
                              <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                                currentVersion.environment === 'release' ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'
                              }`}>
                                {currentVersion.environment === 'release' ? 'Release' : 'Test'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400">上传时间</div>
                            <div className="mt-1 text-slate-800">{formatDate(currentVersion.createTime)}</div>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 text-[13px] text-slate-400">暂无版本信息</p>
                      )}

                      <hr className="my-6 border-slate-200" />

                      {/* 安装设置 */}
                      <h2 className="text-[18px] font-bold text-slate-800">安装设置</h2>
                      <div className="mt-4 grid grid-cols-2 gap-y-5 text-[13px]">
                        <div>
                          <div className="text-slate-400">分发模式</div>
                          <div className="mt-1 text-slate-800">内测模式</div>
                        </div>
                        <div>
                          <div className="text-slate-400">安装方式</div>
                          <div className="mt-1 text-slate-800">{selectedApp.accessType === 2 ? '密码安装' : '公开安装'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">下载状态</div>
                          <div className="mt-1 text-slate-800">开启</div>
                        </div>
                        <div>
                          <div className="text-slate-400">下载有效期</div>
                          <div className="mt-1 text-slate-800">长期有效</div>
                        </div>
                        <div>
                          <div className="text-slate-400">累计下载</div>
                          <div className="mt-1 text-slate-800">{selectedApp.downloadCount} 次</div>
                        </div>
                        <div>
                          <div className="text-slate-400">平台</div>
                          <div className="mt-1 text-slate-800">{selectedApp.platform === 1 ? 'iOS' : 'Android'}</div>
                        </div>
                      </div>

                      <hr className="my-6 border-slate-200" />

                      {/* 版本列表 */}
                      <div className="flex items-baseline justify-between">
                        <h2 className="text-[18px] font-bold text-slate-800">版本列表</h2>
                        {versionList.length > 5 && (
                          <button onClick={() => setActiveTab('version')} className="text-[13px] text-emerald-500 hover:underline">查看更多</button>
                        )}
                      </div>
                      {versionList.length > 0 ? (
                        <table className="mt-4 w-full text-[13px]">
                          <thead>
                            <tr className="border-b border-slate-200 text-left">
                              <th className="pb-3 pr-4 font-medium text-slate-500">版本</th>
                              <th className="pb-3 pr-4 font-medium text-slate-500">Build</th>
                              <th className="pb-3 pr-4 font-medium text-slate-500">大小</th>
                              <th className="pb-3 pr-4 font-medium text-slate-500">环境</th>
                              <th className="pb-3 pr-4 font-medium text-slate-500">下载次数</th>
                              <th className="pb-3 pr-4 font-medium text-slate-500">更新时间</th>
                              <th className="pb-3 font-medium text-slate-500">操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {versionList.slice(0, 5).map((version, index) => (
                              <tr key={version.id} className="border-b border-slate-100">
                                <td className="py-3 pr-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="h-[26px] w-[26px] flex-shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                                      {selectedApp.iconUrl && <img src={selectedApp.iconUrl} alt="" className="h-full w-full object-cover" onError={onImgErr} />}
                                      <div className="items-center justify-center text-[7px] font-bold text-slate-300" style={{ display: selectedApp.iconUrl ? 'none' : 'flex', width: '100%', height: '100%' }}>{selectedApp.platform === 1 ? 'iOS' : 'APK'}</div>
                                    </div>
                                    <span className="text-emerald-500">
                                      {version.versionName}
                                      {index === 0 && <span className="ml-1.5 text-slate-400">(最新版本)</span>}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 pr-4 text-slate-600">{version.versionCode}</td>
                                <td className="py-3 pr-4 text-slate-600">{formatSize(version.fileSize)}</td>
                                <td className="py-3 pr-4">
                                  <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                                    version.environment === 'release' ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'
                                  }`}>{version.environment === 'release' ? 'Release' : 'Test'}</span>
                                </td>
                                <td className="py-3 pr-4 text-slate-600">{version.downloadCount}</td>
                                <td className="py-3 pr-4 text-slate-600">{formatDate(version.createTime)}</td>
                                <td className="py-3">
                                  <div className="relative">
                                    <button onClick={(e) => { e.stopPropagation(); setOpenAction(openAction === version.id ? null : version.id) }} className="text-emerald-500 hover:underline">操作 ▾</button>
                                    {openAction === version.id && (
                                      <div className="absolute right-0 top-full z-20 mt-1 min-w-[130px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                                        <button onClick={() => { copyToClipboard(`${window.location.origin}/d/${selectedApp.appKey}/${version.id}`, `v${version.id}`); setOpenAction(null) }} className="flex w-full items-center px-4 py-2 text-left text-[12px] text-slate-600 hover:bg-slate-50">{copied === `v${version.id}` ? '已复制' : '复制链接'}</button>
                                        <button onClick={() => { showShareQr(version.id, `v${version.versionName}`); setOpenAction(null) }} className="flex w-full items-center px-4 py-2 text-left text-[12px] text-slate-600 hover:bg-slate-50">二维码</button>
                                        <button onClick={() => { handleSetCurrent(version.id); setOpenAction(null) }} className="flex w-full items-center px-4 py-2 text-left text-[12px] text-slate-600 hover:bg-slate-50">设为当前</button>
                                        <button onClick={() => { handleDelete(version.id); setOpenAction(null) }} className="flex w-full items-center px-4 py-2 text-left text-[12px] text-rose-500 hover:bg-rose-50">删除</button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="mt-4 text-[13px] text-slate-400">暂无版本，上传安装包后自动生成</p>
                      )}
                    </>
                  )}

                  {activeTab === 'version' && (
                    <>
                      <h2 className="text-[18px] font-bold text-slate-800">全部版本 <span className="text-[14px] font-normal text-slate-400">共 {versionList.length} 个</span></h2>
                      {versionList.length > 0 ? (
                        <table className="mt-4 w-full text-[13px]">
                          <thead>
                            <tr className="border-b border-slate-200 text-left">
                              <th className="pb-3 pr-4 font-medium text-slate-500">版本</th>
                              <th className="pb-3 pr-4 font-medium text-slate-500">Build</th>
                              <th className="pb-3 pr-4 font-medium text-slate-500">大小</th>
                              <th className="pb-3 pr-4 font-medium text-slate-500">环境</th>
                              <th className="pb-3 pr-4 font-medium text-slate-500">下载次数</th>
                              <th className="pb-3 pr-4 font-medium text-slate-500">更新时间</th>
                              <th className="pb-3 font-medium text-slate-500">更新说明</th>
                              <th className="pb-3 font-medium text-slate-500">操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {versionList.map((version, index) => (
                              <tr key={version.id} className="border-b border-slate-100">
                                <td className="py-3 pr-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="h-[26px] w-[26px] flex-shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                                      {selectedApp.iconUrl && <img src={selectedApp.iconUrl} alt="" className="h-full w-full object-cover" onError={onImgErr} />}
                                      <div className="items-center justify-center text-[7px] font-bold text-slate-300" style={{ display: selectedApp.iconUrl ? 'none' : 'flex', width: '100%', height: '100%' }}>{selectedApp.platform === 1 ? 'iOS' : 'APK'}</div>
                                    </div>
                                    <span className="text-emerald-500">{version.versionName}{index === 0 && <span className="ml-1.5 text-slate-400">(最新版本)</span>}</span>
                                  </div>
                                </td>
                                <td className="py-3 pr-4 text-slate-600">{version.versionCode}</td>
                                <td className="py-3 pr-4 text-slate-600">{formatSize(version.fileSize)}</td>
                                <td className="py-3 pr-4">
                                  <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${version.environment === 'release' ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}>{version.environment === 'release' ? 'Release' : 'Test'}</span>
                                </td>
                                <td className="py-3 pr-4 text-slate-600">{version.downloadCount}</td>
                                <td className="py-3 pr-4 text-slate-600">{formatDate(version.createTime)}</td>
                                <td className="max-w-[150px] truncate py-3 pr-4 text-slate-400">{version.changelog || '-'}</td>
                                <td className="py-3">
                                  <div className="relative">
                                    <button onClick={(e) => { e.stopPropagation(); setOpenAction(openAction === version.id ? null : version.id) }} className="text-emerald-500 hover:underline">操作 ▾</button>
                                    {openAction === version.id && (
                                      <div className="absolute right-0 top-full z-20 mt-1 min-w-[130px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                                        <button onClick={() => { copyToClipboard(`${window.location.origin}/d/${selectedApp.appKey}/${version.id}`, `v${version.id}`); setOpenAction(null) }} className="flex w-full items-center px-4 py-2 text-left text-[12px] text-slate-600 hover:bg-slate-50">{copied === `v${version.id}` ? '已复制' : '复制链接'}</button>
                                        <button onClick={() => { showShareQr(version.id, `v${version.versionName}`); setOpenAction(null) }} className="flex w-full items-center px-4 py-2 text-left text-[12px] text-slate-600 hover:bg-slate-50">二维码</button>
                                        <button onClick={() => { handleSetCurrent(version.id); setOpenAction(null) }} className="flex w-full items-center px-4 py-2 text-left text-[12px] text-slate-600 hover:bg-slate-50">设为当前</button>
                                        <button onClick={() => { handleDelete(version.id); setOpenAction(null) }} className="flex w-full items-center px-4 py-2 text-left text-[12px] text-rose-500 hover:bg-rose-50">删除</button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="mt-4 text-[13px] text-slate-400">暂无版本，上传安装包后自动生成</p>
                      )}
                    </>
                  )}

                  {activeTab === 'settings' && (
                    <>
                      <h2 className="text-[18px] font-bold text-slate-800">应用设置</h2>
                      <div className="mt-6 grid grid-cols-2 gap-y-6 text-[13px]">
                        <div>
                          <div className="text-slate-400">应用名称</div>
                          <div className="mt-1 text-slate-800">{selectedApp.name}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Bundle ID</div>
                          <div className="mt-1 font-mono text-slate-800">{selectedApp.bundleId}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">平台</div>
                          <div className="mt-1 text-slate-800">{selectedApp.platform === 1 ? 'iOS' : 'Android'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">安装方式</div>
                          <div className="mt-1 text-slate-800">{selectedApp.accessType === 2 ? '密码安装' : '公开安装'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">App Key</div>
                          <div className="mt-1 flex items-center gap-1.5 font-mono text-slate-800">
                            {selectedApp.appKey}
                            <button onClick={() => copyToClipboard(selectedApp.appKey, 'appkey2')} className="text-slate-400 hover:text-emerald-500"><CopyIcon /></button>
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">累计下载</div>
                          <div className="mt-1 text-slate-800">{selectedApp.downloadCount} 次</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* 空状态：没有应用 或 没有选中 */
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="h-6 w-6 rounded-lg bg-emerald-200" />
                </div>
                <div className="mt-4 text-[16px] font-medium text-slate-600">
                  {allApps.length === 0 ? '还没有应用' : '选择一个应用'}
                </div>
                <p className="mt-1 text-[13px] text-slate-400">
                  {allApps.length === 0 ? '点击下方按钮上传安装包' : '从左侧列表中选择'}
                </p>
                <button
                  onClick={() => setUploadStep('select')}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-400 px-6 py-2.5 text-[14px] font-medium text-white hover:bg-emerald-500"
                >
                  <UploadIcon />
                  立刻上传
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ====== 二维码弹窗 ====== */}
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowQr(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-7 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[18px] font-bold text-slate-800">{qrTitle}</h2>
            <p className="mt-1 text-[13px] text-slate-500">扫描二维码安装</p>
            <div className="mx-auto mt-5 inline-flex rounded-xl border border-slate-200 p-4">
              <QrWithIcon value={qrUrl} size={180} iconUrl={selectedApp?.iconUrl} />
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="min-w-0 flex-1 break-all text-left text-[12px] text-slate-500 select-all">{qrUrl}</p>
              <button onClick={() => copyToClipboard(qrUrl, 'qr')} className="text-[12px] text-emerald-500 hover:underline">{copied === 'qr' ? '已复制' : '复制'}</button>
            </div>
            <button onClick={() => setShowQr(false)} className="mt-4 w-full rounded-lg border border-slate-200 py-2.5 text-[13px] text-slate-600 hover:bg-slate-50">关闭</button>
          </div>
        </div>
      )}

      {/* ====== 下载二维码弹窗（多尺寸） ====== */}
      {showQrDownload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowQrDownload(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-slate-800">更多尺寸</h2>
              <button onClick={() => setShowQrDownload(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 隐藏的 SVG 用于生成下载 */}
            <div id="qr-download-svg" className="absolute -left-[9999px]">
              <QRCodeSVG value={qrDownloadUrl} size={1024} level="H" fgColor="#1e293b" bgColor="#ffffff" />
            </div>

            <table className="mt-5 w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="pb-2.5 font-medium text-slate-500">二维码边长(cm)</th>
                  <th className="pb-2.5 font-medium text-slate-500">建议扫描距离(m)</th>
                  <th className="pb-2.5 font-medium text-slate-500">下载二维码</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { cm: '8cm', distance: '0.5m', px: 302 },
                  { cm: '12cm', distance: '0.8m', px: 454 },
                  { cm: '15cm', distance: '1m', px: 567 },
                  { cm: '30cm', distance: '1.5m', px: 1134 },
                  { cm: '50cm', distance: '2.5m', px: 1890 },
                ].map((item) => (
                  <tr key={item.cm} className="border-b border-slate-100">
                    <td className="py-3 text-slate-700">{item.cm}</td>
                    <td className="py-3 text-slate-700">{item.distance}</td>
                    <td className="py-3">
                      <button onClick={() => downloadQrCode(item.px)} className="text-emerald-500 hover:underline">下载</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="mt-4 text-[12px] text-slate-400">二维码尺寸请按照43像素的整数倍缩放，以保持最佳效果</p>

            <div className="mt-4 flex justify-end">
              <button onClick={() => setShowQrDownload(false)} className="rounded-lg border border-slate-200 px-6 py-2 text-[13px] text-slate-600 hover:bg-slate-50">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
