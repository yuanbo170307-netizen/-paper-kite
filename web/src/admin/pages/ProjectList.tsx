import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { projectApi, type Project } from '../../services/api'

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default function ProjectList() {
  const [projectList, setProjectList] = useState<Project[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState<Project | null>(null)
  const [form, setForm] = useState({ projectKey: '', name: '', description: '' })
  const [editForm, setEditForm] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(false)
  const iconRef = useRef<HTMLInputElement>(null)
  const [iconProjectId, setIconProjectId] = useState<number | null>(null)

  const fetchList = async () => {
    try { setProjectList((await projectApi.list()).data) } catch (e) { console.error(e) }
  }

  useEffect(() => { fetchList() }, [])

  const handleCreate = async () => {
    if (!form.projectKey || !form.name) return
    setLoading(true)
    try {
      await projectApi.create(form)
      setForm({ projectKey: '', name: '', description: '' })
      setShowCreate(false)
      fetchList()
    } catch (e: unknown) { alert(e instanceof Error ? e.message : '创建失败') }
    finally { setLoading(false) }
  }

  const handleEdit = (project: Project) => {
    setEditForm({ name: project.name, description: project.description || '' })
    setShowEdit(project)
  }

  const handleSaveEdit = async () => {
    if (!showEdit || !editForm.name) return
    setLoading(true)
    try {
      await projectApi.update(showEdit.id, editForm)
      setShowEdit(null)
      fetchList()
    } catch (e: unknown) { alert(e instanceof Error ? e.message : '保存失败') }
    finally { setLoading(false) }
  }

  const handleIconUpload = async (projectId: number, file: File) => {
    try {
      await projectApi.uploadIcon(projectId, file)
      fetchList()
    } catch (e: unknown) { alert(e instanceof Error ? e.message : '图标上传失败') }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个项目吗？')) return
    try { await projectApi.delete(id); fetchList() }
    catch (e: unknown) { alert(e instanceof Error ? e.message : '删除失败') }
  }

  return (
    <div className="space-y-8">
      {/* 标题区 */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-slate-800">项目</h1>
          <p className="mt-1 text-[14px] text-slate-500">{projectList.length} 个项目</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="admin-button-primary">
          新建项目
        </button>
      </div>

      {/* 新建弹窗 */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[20px] font-bold text-slate-800">新建项目</h2>
            <p className="mt-1 text-[14px] text-slate-500">创建一个新的应用分发空间</p>
            <div className="mt-6 space-y-4">
              <label className="block">
                <div className="mb-1.5 text-[13px] font-medium text-slate-600">项目标识</div>
                <input placeholder="litchat" value={form.projectKey} onChange={(e) => setForm({ ...form, projectKey: e.target.value })} className="admin-input" />
              </label>
              <label className="block">
                <div className="mb-1.5 text-[13px] font-medium text-slate-600">项目名称</div>
                <input placeholder="LitChat" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="admin-input" />
              </label>
              <label className="block">
                <div className="mb-1.5 text-[13px] font-medium text-slate-600">描述</div>
                <textarea placeholder="可选" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="admin-textarea" />
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowCreate(false)} className="admin-button-secondary flex-1 py-3">取消</button>
              <button onClick={handleCreate} disabled={loading} className="admin-button-primary flex-1 py-3 disabled:opacity-40">{loading ? '创建中...' : '创建'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑弹窗 */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={() => setShowEdit(null)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[20px] font-bold text-slate-800">编辑项目</h2>
            <div className="mt-5 flex items-center gap-4">
              <div
                className="group relative flex h-14 w-14 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                onClick={() => { setIconProjectId(showEdit.id); iconRef.current?.click() }}
              >
                {showEdit.iconUrl ? (
                  <img src={showEdit.iconUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[18px] font-bold text-slate-300">{showEdit.name.slice(0, 1)}</span>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                  <span className="text-[11px] text-white">上传图标</span>
                </div>
              </div>
              <div>
                <div className="text-[14px] font-medium text-slate-700">{showEdit.projectKey}</div>
                <div className="mt-0.5 text-[12px] text-slate-400">点击左侧可上传图标</div>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <label className="block">
                <div className="mb-1.5 text-[13px] font-medium text-slate-600">项目名称</div>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="admin-input" />
              </label>
              <label className="block">
                <div className="mb-1.5 text-[13px] font-medium text-slate-600">描述</div>
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="admin-textarea" />
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowEdit(null)} className="admin-button-secondary flex-1 py-3">取消</button>
              <button onClick={handleSaveEdit} disabled={loading} className="admin-button-primary flex-1 py-3 disabled:opacity-40">{loading ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 项目列表 */}
      {projectList.length === 0 ? (
        <div className="py-24 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="h-7 w-7 rounded-lg bg-emerald-200" />
          </div>
          <div className="mt-5 text-[17px] font-semibold text-slate-700">还没有项目</div>
          <p className="mt-1.5 text-[14px] text-slate-400">创建一个项目开始分发应用</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {projectList.map((project) => (
            <Link
              key={project.id}
              to={`/admin/project/${project.id}`}
              className="group admin-panel overflow-hidden transition duration-150 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className="group/icon relative flex h-12 w-12 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                    onClick={(e) => { e.preventDefault(); setIconProjectId(project.id); iconRef.current?.click() }}
                  >
                    {project.iconUrl ? (
                      <img src={project.iconUrl} alt={project.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[18px] font-bold text-slate-300">{project.name.slice(0, 1).toUpperCase()}</span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover/icon:opacity-100">
                      <span className="text-[9px] text-white">换图标</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] text-slate-400">{project.projectKey}</div>
                    <div className="mt-0.5 text-[17px] font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{project.name}</div>
                    <div className="mt-1 line-clamp-1 text-[13px] text-slate-400">{project.description || '暂无描述'}</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex gap-4 text-[12px] text-slate-400">
                    <span>创建 {formatDate(project.createTime)}</span>
                    <span>更新 {formatDate(project.updateTime)}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.preventDefault(); handleEdit(project) }} className="rounded-md px-2 py-1 text-[12px] text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">编辑</button>
                    <button onClick={(e) => { e.preventDefault(); handleDelete(project.id) }} className="rounded-md px-2 py-1 text-[12px] text-slate-400 transition hover:bg-rose-50 hover:text-rose-500">删除</button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <input
        ref={iconRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={() => {
          const f = iconRef.current?.files?.[0]
          if (f && iconProjectId) {
            handleIconUpload(iconProjectId, f)
            setShowEdit((prev) => prev ? { ...prev, iconUrl: URL.createObjectURL(f) } : null)
          }
          if (iconRef.current) iconRef.current.value = ''
        }}
      />
    </div>
  )
}
