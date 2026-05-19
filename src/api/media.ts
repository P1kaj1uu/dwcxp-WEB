/**
 * 图片/视频 相关 API
 */
import { get, post, del } from '@/utils/axios'

/**
 * 上传媒体文件
 */
export const uploadMediaApi = (formData: FormData) => {
  return post<any>('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * 获取媒体文件列表
 */
export const getMediaListApi = (params: { category: string }) => {
  return get<any>('/media/list', params)
}

/**
 * 查看媒体文件
 */
export const previewMediaApi = (id: number) => {
  return `/media/preview?id=${id}`
}

/**
 * 删除媒体文件
 */
export const deleteMediaApi = (id: number) => {
  return del<any>('/media/delete', { params: { id } })
}

/**
 * 返回主页多媒体展示图片还是视频
 */
export const getShowMediaListApi = () => {
  return get<any>('/show-media/list')
}

/**
 * 编辑主页多媒体展示图片还是视频
 */
export const editShowMediaApi = (params: any) => {
  return post<any>('/show-media/edit', params)
}
