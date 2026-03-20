import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// 请求拦截：自动带 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('appspaces_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data.code === 401) {
      localStorage.removeItem('appspaces_token')
      window.location.href = '/login'
      return Promise.reject(new Error(data.message))
    }
    if (data.code !== 200) {
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    return data
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('appspaces_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

// 登录
export const authApi = {
  login: (username: string, password: string) =>
    api.post<unknown, ApiResponse<{ token: string; username: string }>>('/auth/login', { username, password }),
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface Project {
  id: number
  projectKey: string
  name: string
  description: string
  iconUrl: string
  createTime: string
  updateTime: string
}

export interface App {
  id: number
  projectId: number
  appKey: string
  bundleId: string
  name: string
  iconUrl: string
  platform: number
  accessType: number
  currentVersionId: number
  downloadCount: number
  createTime: string
  updateTime: string
}

export interface AppVersion {
  id: number
  appId: number
  versionName: string
  versionCode: number
  fileSize: number
  changelog: string
  environment: string
  minOsVersion: string
  downloadUrl: string
  expireTime: string
  downloadCount: number
  createTime: string
}

export interface PublicApp {
  appKey: string
  name: string
  iconUrl: string
  platform: number
  accessType: number
  currentVersion: AppVersion
}

// 项目
export const projectApi = {
  list: () => api.get<unknown, ApiResponse<Project[]>>('/project/list'),
  create: (data: { projectKey: string; name: string; description?: string }) =>
    api.post<unknown, ApiResponse<Project>>('/project', data),
  update: (id: number, data: { name?: string; description?: string }) =>
    api.put<unknown, ApiResponse<Project>>(`/project/${id}`, data),
  delete: (id: number) => api.delete(`/project/${id}`),
  uploadIcon: (id: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<unknown, ApiResponse<Project>>(`/project/${id}/icon`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// 应用
export const appApi = {
  get: (appId: number) =>
    api.get<unknown, ApiResponse<App>>(`/app/${appId}`),
  list: () =>
    api.get<unknown, ApiResponse<App[]>>('/app/list'),
  upload: (file: File, opts?: { versionName?: string; environment?: string; changelog?: string; onProgress?: (percent: number) => void }) => {
    const formData = new FormData()
    formData.append('file', file)
    if (opts?.versionName) formData.append('versionName', opts.versionName)
    if (opts?.environment) formData.append('environment', opts.environment)
    if (opts?.changelog) formData.append('changelog', opts.changelog)
    return api.post<unknown, ApiResponse<App>>('/app/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 600000,
      onUploadProgress: (e) => {
        if (e.total && opts?.onProgress) {
          opts.onProgress(Math.round((e.loaded / e.total) * 100))
        }
      },
    })
  },
  update: (appId: number, data: { name?: string; accessType?: number; accessPassword?: string }) =>
    api.put<unknown, ApiResponse<App>>(`/app/${appId}`, data),
  uploadIcon: (appId: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<unknown, ApiResponse<App>>(`/app/${appId}/icon`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  setCurrentVersion: (appId: number, versionId: number) =>
    api.put(`/app/${appId}/current`, { versionId }),
}

// 版本
export const versionApi = {
  list: (appId: number) =>
    api.get<unknown, ApiResponse<AppVersion[]>>(`/app/${appId}/versions`),
  delete: (versionId: number) => api.delete(`/app/version/${versionId}`),
}

// 公开接口
export const publicApi = {
  getApp: (appKey: string) =>
    api.get<unknown, ApiResponse<PublicApp>>(`/public/${appKey}`),
  getAppVersion: (appKey: string, versionId: number) =>
    api.get<unknown, ApiResponse<PublicApp>>(`/public/${appKey}/${versionId}`),
  verify: (appKey: string, password: string) =>
    api.post<unknown, ApiResponse<boolean>>(`/public/${appKey}/verify`, { password }),
  getVersions: (appKey: string, page: number = 1, size: number = 5) =>
    api.get<unknown, ApiResponse<AppVersion[]>>(`/public/${appKey}/versions`, { params: { page, size } }),
}
