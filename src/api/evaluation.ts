/**
 * 评价相关 API
 */

import { get, post, del } from '@/utils/axios'

export interface EvaluationListParams {
  pageNum: number
  pageSize: number
}

/**
 * 获取评价列表
 */
export const getEvaluationListApi = (data: EvaluationListParams) => {
  return get<any>('/evaluation/list', data)
}

/**
 * 单个新增评价
 */
export const addEvaluationApi = (data: any) => {
  return post<any>('/evaluation/add', data)
}

/**
 * 删除评价
 */
export const delEvaluationApi = (id: number) => {
  return del<any>('/evaluation/delete', { params: { id } })
}

/**
 * 编辑评价
 */
export const editEvaluationApi = (data: any) => {
  return post<any>('/evaluation/edit', data)
}

/**
 * 批量新增评价
 */
export const batchAddEvaluationApi = (data: any[]) => {
  return post<any>('/evaluation/batch/add', data)
}
