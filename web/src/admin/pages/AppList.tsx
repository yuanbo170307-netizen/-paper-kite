import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { appApi, type App } from '../../services/api'

const ENV_OPTIONS = [
  { value: 'test', label: 'Test', active: 'bg-sky-50 text-sky-600 border-sky-300' },
  { value: 'release', label: 'Release', active: 'bg-emerald-50 text-emerald-600 border-emerald-300' },
]

export default function AppList() {
  const [appList, setAppList] = useState<App[]>([])
  const [uploading, setUploading] = useState(false)
  const [environment, setEnvironment] = useState('test')
  const [changelog, setChangelog] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const iconRef = useRef<HTMLInputElement>(null)
  const [iconAppId, setIconAppId] = useState<number | null>(null)

  const fetchList = async () => {
    try { setAppList((await appApi.list()).data) } catch (e) { console.error(e) }
  }

  useEffect(() => { fetchList() }, [])

  const doUpload = async (file: File) => {
    const name = file.name.toLowerCase()
    if (!name.endsWith('.ipa') && !name.endsWith('.apk')) { alert('仅支持 IPA 和 APK 文件'); return }
    setUploading(true)
    setProgress(0)
    try {
      await appApi.upload(file, {
        environment,
        changelog,
        onProgress: (percent) => setProgress(percent),
      })
      setProgress(100)
      setChangelog('')
      setSelectedFile(null)
      if (fileRef.current) fileRef.current.value = ''
      fetchList()
    } catch (e: unknown) { alert(e instanceof Error ? e.message : '上传失败') }
    finally { setTimeout(() => { setUploading(false); setProgress(0) }, 500) }
  }

  const handleSelectFile = (file: File) => {
    const name = file.name.toLowerCase()
    if (!name.endsWith('.ipa') && !name.endsWith('.apk')) { alert('仅支持 IPA 和 APK 文件'); return }
    setSelectedFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleSelectFile(file)
  }

  const handleIconUpload = async (appId: number, file: File) => {
    try { await appApi.uploadIcon(appId, file); fetchList() }
    catch (e: unknown) { alert(e instanceof Error ? e.message : '图标上传失败') }
  }

  return (
    <div className="space-y-10">
      {/* 标题 */}
      <div>
        <h1 className="text-[36px] font-bold tracking-[-0.04em] text-slate-800">应用</h1>
        <p className="mt-1 text-[16px] text-slate-500">{appList.length} 个应用</p>
      </div>

      {/* 上传区 */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`admin-panel overflow-hidden transition duration-200 ${dragOver ? 'border-sky-400/40' : ''} ${uploading ? 'pointer-events-none opacity-70' : ''}`}
      >
        <div className="p-8">
          {selectedFile ? (
            <div className="space-y-6">
              {/* 已选文件 */}
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-[14px] font-bold text-slate-600">
                  {selectedFile.name.toLowerCase().endsWith('.ipa') ? 'IPA' : 'APK'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[16px] font-medium text-slate-800">{selectedFile.name}</div>
                  <div className="mt-0.5 text-[14px] text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</div>
                </div>
                {!uploading && (
                  <button onClick={() => { setSelectedFile(null); if (fileRef.current) fileRef.current.value = '' }} className="text-[13px] text-slate-500 hover:text-slate-700">移除</button>
                )}
              </div>

              {uploading ? (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[16px] font-medium text-slate-800">正在上传</span>
                    <span className="text-[14px] text-slate-500">{Math.round(progress)}%</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-slate-800 transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : (
                <>
                  {/* 更新说明 */}
                  <label className="block">
                    <div className="mb-2 text-[14px] font-medium text-slate-600">更新说明</div>
                    <input placeholder="可选" value={changelog} onChange={(e) => setChangelog(e.target.value)} className="admin-input" />
                  </label>

                  {/* 环境 */}
                  <div>
                    <div className="mb-2 text-[14px] font-medium text-slate-600">发布环境</div>
                    <div className="flex gap-2">
                      {ENV_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setEnvironment(opt.value)}
                          className={`flex-1 rounded-xl border py-3 text-[14px] font-medium transition ${
                            environment === opt.value ? opt.active : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => doUpload(selectedFile)} className="admin-button-primary w-full rounded-2xl py-4 text-[16px]">
                    上传
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="text-[18px] font-semibold text-slate-800">拖拽安装包到这里</div>
              <p className="mt-2 text-[15px] text-slate-500">支持 .ipa 和 .apk 文件</p>
              <button onClick={() => fileRef.current?.click()} className="admin-button-primary mt-6">
                选择文件
              </button>
              <input ref={fileRef} type="file" accept=".ipa,.apk" className="hidden" onChange={() => { const f = fileRef.current?.files?.[0]; if (f) handleSelectFile(f) }} />
            </div>
          )}
        </div>
      </div>

      {/* 应用列表 */}
      {appList.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-[18px] font-semibold text-slate-800">还没有应用</div>
          <p className="mt-2 text-[15px] text-slate-500">上传安装包后自动创建</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appList.map((app) => (
            <Link
              key={app.id}
              to={`/admin/app/${app.id}/versions`}
              className="group admin-panel-soft flex items-center gap-5 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300"
            >
              <div
                className="group/icon relative flex h-14 w-14 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[16px] border border-slate-200 bg-slate-100"
                onClick={(e) => { e.preventDefault(); setIconAppId(app.id); iconRef.current?.click() }}
              >
                {app.iconUrl ? (
                  <img src={app.iconUrl} alt={app.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[16px] font-bold text-slate-400">{app.platform === 1 ? 'iOS' : 'APK'}</span>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover/icon:opacity-100">
                  <span className="text-[10px] text-white">换图标</span>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-[17px] font-semibold text-slate-800 group-hover:text-amber-600 transition-colors">{app.name}</span>
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                    app.platform === 1 ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {app.platform === 1 ? 'iOS' : 'Android'}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-4 text-[13px] text-slate-500">
                  <span className="font-mono">{app.bundleId}</span>
                  <span>{app.downloadCount} 次下载</span>
                </div>
              </div>

              <span className="text-[14px] text-slate-400 group-hover:text-slate-600 transition-colors">&rarr;</span>
            </Link>
          ))}
        </div>
      )}

      <input ref={iconRef} type="file" accept="image/*" className="hidden"
        onChange={() => { const f = iconRef.current?.files?.[0]; if (f && iconAppId) handleIconUpload(iconAppId, f); if (iconRef.current) iconRef.current.value = '' }} />
    </div>
  )
}
