/**
 * 党员相关 API
 */

import { get, post, del } from '@/utils/axios'

export interface PartyMemberListParams {
  pageNum: number
  pageSize: number
}

/**
 * 获取党员列表
 */
export const getMemberListApi = (data: PartyMemberListParams) => {
  return get<any>('/member/list', data)
}

/**
 * 单个新增党员
 */
export const addMemberApi = (data: any) => {
  return post<any>('/member/add', data)
}

/**
 * 删除党员
 */
export const delMemberApi = (id: number) => {
  return del<any>('/member/delete', { params: { id } })
}

/**
 * 编辑党员
 */
export const editMemberApi = (data: any) => {
  return post<any>('/member/edit', data)
}

/**
 * 批量新增党员
 */
export const batchAddMemberApi = (data: any[]) => {
  return post<any>('/member/batch/add', data)
}
