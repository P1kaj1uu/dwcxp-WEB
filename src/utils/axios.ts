/**
 * Axios 实例封装
 * 包含请求拦截器、响应拦截器、错误处理等
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { message } from 'antd'
import { getToken, removeToken, clearStorage } from './token'

// 创建 Axios 实例
const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    // 添加 Authorization header
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response

    // 处理业务错误（后端返回的 success: false）
    if (data.success === false) {
      message.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }

    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // 处理 401 未授权
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // 清除登录状态
      removeToken()
      clearStorage()

      message.error('登录已过期，请重新登录')

      // 跳转到登录页
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // 处理 403 禁止访问
    if (error.response?.status === 403) {
      message.error('没有权限访问该资源')
      return Promise.reject(error)
    }

    // 处理 404 未找到
    if (error.response?.status === 404) {
      message.error('请求的资源不存在')
      return Promise.reject(error)
    }

    // 处理 500 服务器错误
    if (error.response?.status === 500) {
      message.error('服务器错误，请稍后重试')
      return Promise.reject(error)
    }

    // 处理网络错误
    if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请稍后重试')
      return Promise.reject(error)
    }

    if (!navigator.onLine) {
      message.error('网络连接已断开，请检查网络')
      return Promise.reject(error)
    }

    // 处理其他错误
    const errorMessage =
      (error.response?.data as any)?.message ||
      error.message ||
      '请求失败，请稍后重试'

    if (errorMessage && errorMessage !== '请求失败') {
      message.error(errorMessage)
    }

    return Promise.reject(error)
  }
)

/**
 * 封装 GET 请求
 */
export const get = <T = any>(
  url: string,
  params?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return axiosInstance.get(url, { params, ...config })
}

/**
 * 封装 POST 请求
 */
export const post = <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return axiosInstance.post(url, data, config)
}

/**
 * 封装 PUT 请求
 */
export const put = <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return axiosInstance.put(url, data, config)
}

/**
 * 封装 DELETE 请求
 */
export const del = <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return axiosInstance.delete(url, config)
}

/**
 * 封装 PATCH 请求
 */
export const patch = <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return axiosInstance.patch(url, data, config)
}

export default axiosInstance
