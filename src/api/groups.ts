/**
 * 党小组相关 API
 */

import { get, post, del } from '@/utils/axios'

export interface PartyGroupListParams {
  pageNum: number
  pageSize: number
}

/**
 * 获取党小组列表
 */
export const getGroupListApi = (data: PartyGroupListParams) => {
  return get<any>('/group/list', data)
}

/**
 * 单个新增党小组
 */
export const addGroupApi = (data: any) => {
  return post<any>('/group/add', data)
}

/**
 * 删除党小组
 */
export const delGroupApi = (id: number) => {
  return del<any>('/group/delete', { params: { id } })
}

/**
 * 编辑党小组
 */
export const editGroupApi = (data: any) => {
  return post<any>('/group/edit', data)
}

/**
 * 批量新增党小组
 */
export const batchAddGroupApi = (data: any[]) => {
  return post<any>('/group/batch/add', data)
}
