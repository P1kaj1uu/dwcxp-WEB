/**
 * 党小组评价相关 API
 */

import { get, post, del } from '@/utils/axios'

/**
 * 获取党小组评价列表
 */
export const getPartyBranchEvaluationListApi = (data: any) => {
  return get<any>('/party-branch/evaluation/list', data)
}

/**
 * 新增
 */
export const addPartyBranchEvaluationApi = (data: any) => {
  return post<any>('/party-branch/evaluation/add', data)
}

/**
 * 删除
 */
export const deletePartyBranchEvaluationByIdApi = (id: number) => {
  return del<any>('/party-branch/evaluation/delete', { params: { id } })
}

/**
 * 编辑
 */
export const editPartyBranchEvaluationByIdApi = (data: any) => {
  return post<any>('/party-branch/evaluation/edit', data)
}
