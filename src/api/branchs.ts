/**
 * 党支部相关 API
 */

import { get, post, del } from '@/utils/axios'

export interface PartyBranchListParams {
  pageNum: number
  pageSize: number
}

/**
 * 获取党支部列表
 */
export const getBranchListApi = (data: PartyBranchListParams) => {
  return get<any>('/branch/list', data)
}

/**
 * 单个新增党支部
 */
export const addBranchApi = (data: any) => {
  return post<any>('/branch/add', data)
}

/**
 * 删除党支部
 */
export const delBranchApi = (id: number) => {
  return del<any>('/branch/delete', { params: { id } })
}

/**
 * 编辑党支部
 */
export const editBranchApi = (data: any) => {
  return post<any>('/branch/edit', data)
}

/**
 * 批量新增党支部
 */
export const batchAddBranchApi = (data: any[]) => {
  return post<any>('/branch/batch/add', data)
}
