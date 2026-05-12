/**
 * 认证相关 API
 */

import { post } from '@/utils/axios'

export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  password: string
  email?: string
}

export interface RegisterResponse {
  code: number
  message?: string
  data?: any
}

/**
 * 用户登录
 */
export const loginApi = (data: LoginParams) => {
  return post<any>('/user/login', data)
}

/**
 * 用户注册
 */
export const registerApi = (data: RegisterParams) => {
  return post<RegisterResponse>('/user/register', data)
}
