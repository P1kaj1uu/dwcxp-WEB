/**
 * 基本情况相关 API
 */

import { get, post, del } from '@/utils/axios'

export interface BasicListParams {
  pageNum: number
  pageSize: number
}

/**
 * 获取基本情况列表
 */
export const getBasicListApi = (data: BasicListParams) => {
  return get<any>('/basic/list', data)
}

/**
 * 按部门筛选
 */
export const getBasicByTypeApi = (type: string) => {
  return get<any>('/basic/find', { type })
}

/**
 * 新增基本情况
 */
export const addBasicApi = (data: any) => {
  return post<any>('/basic/add', data)
}

/**
 * 删除基本情况
 */
export const delBasicApi = (id: number) => {
  return del<any>('/basic/delete', { params: { id } })
}

/**
 * 编辑基本情况
 */
export const editBasicApi = (data: any) => {
  return post<any>('/basic/edit', data)
}

/**
 * 上传照片
 */
export const uploadPhotoApi = (formData: FormData) => {
  return post<any>('/basic/upload-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
