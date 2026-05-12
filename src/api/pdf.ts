/**
 * PDF 文件相关 API
 */
import { get, post, del } from '@/utils/axios'
/**
 * 上传 PDF 文件
 */
export const uploadPdfApi = (formData: FormData) => {
  return post<any>('/pdf/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * 获取 PDF 文件列表
 */
export const getPdfListApi = (params: { type: string }) => {
  return get<any>('/pdf/list', params)
}

/**
 * 查看 PDF 文件
 */
export const previewPdfApi = (id: number) => {
  return `/pdf/preview?id=${id}`
}

/**
 * 删除 PDF 文件
 */
export const deletePdfApi = (id: number) => {
  return del<any>('/pdf/delete', { params: { id } })
}
