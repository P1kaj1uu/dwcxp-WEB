/**
 * 考核本支部结果 API
 */

import { get, post } from '@/utils/axios'

/**
 * 获取考核本支部结果列表
 */
export const getEvaluationResultList = (data: any) => {
  return get<any>('/result/list', data)
}

/**
 * 新增
 */
export const addEvaluationResult = (data: any) => {
  return post<any>('/result/add', data)
}

/**
 * 编辑
 */
export const editEvaluationResultById = (data: any) => {
  return post<any>('/result/edit', data)
}
