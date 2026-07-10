import React, { useState, useEffect } from 'react'
import { Card, Upload, Button, message, Space, Table, Popconfirm, Radio } from 'antd'
import { UploadOutlined, DeleteOutlined, FilePdfOutlined, FileImageOutlined, PlayCircleOutlined, PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { uploadPdfApi, getPdfListApi, deletePdfApi } from '@/api/pdf'
import { uploadMediaApi, getMediaListApi, deleteMediaApi, getShowMediaListApi, editShowMediaApi } from '@/api/media'

interface PdfItem {
  id: number
  fileName: string
  fileType: string
  fileContent?: string | null
}

interface MediaItem {
  id: number
  fileName: string
  fileType: string
  fileUrl: string
  thumbnailUrl?: string
  mediaType: 'image' | 'video'
}

const labelToKey: Record<string, string> = {
  '重点工作': 'keyWork',
  '党务公开': 'partyAffairs',
  '光荣榜': 'integrity',
  '组织生活': 'orgLife',
  '活动风采': 'activityStyle',
}

const categoryMap: Record<string, { label: string; color: string; icon: string }> = {
  keyWork: { label: '重点工作', color: '#E74C3C', icon: '' },
  partyAffairs: { label: '党务公开', color: '#3498DB', icon: '' },
  integrity: { label: '光荣榜', color: '#F39C12', icon: '' },
  orgLife: { label: '组织生活', color: '#9B59B6', icon: '' },
  activityStyle: { label: '活动风采', color: '#1ABC9C', icon: '' },
}

const categories = [
  { key: 'keyWork', label: '重点工作', color: '#E74C3C' },
  { key: 'partyAffairs', label: '党务公开', color: '#3498DB' },
  { key: 'integrity', label: '光荣榜', color: '#F39C12' },
]

// 媒体类别（支持多文件上传）
const mediaCategories = [
  { key: 'orgLife', label: '组织生活', color: '#9B59B6', accept: 'image/*,video/*' },
  { key: 'activityStyle', label: '活动风采', color: '#1ABC9C', accept: 'image/*,video/*' },
]

const UploadPDF: React.FC = () => {
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [fileListMap, setFileListMap] = useState<Record<string, PdfItem[]>>({})
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})
  
  // 媒体文件相关状态
  const [mediaListMap, setMediaListMap] = useState<Record<string, MediaItem[]>>({})
  const [mediaLoadingMap, setMediaLoadingMap] = useState<Record<string, boolean>>({})
  const [uploadingMediaKey, setUploadingMediaKey] = useState<string | null>(null)
  const [showType, setShowType] = useState('')

  useEffect(() => {
    categories.forEach(cat => fetchFilesByCategory(cat.label))
    mediaCategories.forEach(cat => fetchMediaByCategory(cat.key))
    fetchShowMediaList()
  }, [])

  // PDF 上传
  const handleUpload = async (file: File, key: string, label: string) => {
    const isPdf = file.type === 'application/pdf'
    if (!isPdf) {
      message.error('只能上传 PDF 文件!')
      return false
    }
    const isLt50M = file.size / 1024 / 1024 < 50
    if (!isLt50M) {
      message.error('文件大小不能超过 50MB!')
      return false
    }

    const existingFiles = fileListMap[key] || []
    if (existingFiles.length > 0) {
      message.warning(`${label} 已有文件，请先删除现有文件后再上传`)
      return false
    }

    setUploadingKey(key)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', label)
    try {
      const res = await uploadPdfApi(formData)
      if (res.data.code === 200) {
        message.success(`PDF 上传成功`)
        fetchFilesByCategory(label)
      } else {
        message.error(res.data.message || '上传失败')
      }
    } catch (error) {
      message.error('上传失败，请重试')
      console.error(error)
    } finally {
      setUploadingKey(null)
    }

    return false
  }

  // 媒体文件上传（支持多文件）
  const handleMediaUpload = async (file: File, categoryKey: string, categoryLabel: string) => {
    const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/')
    if (!isValidType) {
      message.error('只能上传图片或视频文件!')
      return false
    }
    
    const isLt100M = file.size / 1024 / 1024 < 100
    if (!isLt100M) {
      message.error('文件大小不能超过 100MB!')
      return false
    }

    setUploadingMediaKey(categoryKey)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', categoryLabel)
    formData.append('category', categoryKey)
    
    try {
      const res = await uploadMediaApi(formData)
      if (res.data.code === 200) {
        message.success(`${file.name} 上传成功`)
        fetchMediaByCategory(categoryKey)
      } else {
        message.error(res.data.message || '上传失败')
      }
    } catch (error) {
      message.error('上传失败，请重试')
      console.error(error)
    } finally {
      setUploadingMediaKey(null)
    }

    return false
  }

  const fetchFilesByCategory = async (category: string) => {
    const key = labelToKey[category] ?? category
    setLoadingMap(prev => ({ ...prev, [key]: true }))
    try {
      const res = await getPdfListApi({ type: category })
      if (res.data.code === 200) {
        const files: PdfItem[] = res.data.data || []
        setFileListMap(prev => ({ ...prev, [key]: files }))
      }
    } catch (error) {
      console.error('获取文件列表失败', error)
    } finally {
      setLoadingMap(prev => ({ ...prev, [key]: false }))
    }
  }

  const fetchShowMediaList = async () => {
    try {
      const res = await getShowMediaListApi()
      if (res.data.code === 200) {
        let type = res.data.data[0].type
        setShowType(type)
      }
    } catch (error) {
      console.error('获取主页多媒体展示图片还是视频失败', error)
    }
  }

  const onShowTypeChange = async (e: any) => {
    let type = e.target.value
    const res = await editShowMediaApi({ id: 1, type })
    if (res.data.code === 200) {
      setShowType(type)
      message.success('修改成功')
    } else {
      message.error('修改失败')
    }
  };

  const fetchMediaByCategory = async (categoryKey: string) => {
    setMediaLoadingMap(prev => ({ ...prev, [categoryKey]: true }))
    try {
      const res = await getMediaListApi({ category: categoryKey })
      if (res.data.code === 200) {
        const media: MediaItem[] = res.data.data || []
        setMediaListMap(prev => ({ ...prev, [categoryKey]: media }))
      }
    } catch (error) {
      console.error('获取媒体列表失败', error)
    } finally {
      setMediaLoadingMap(prev => ({ ...prev, [categoryKey]: false }))
    }
  }

  const handleDelete = async (record: PdfItem) => {
    try {
      const res = await deletePdfApi(record.id)
      if (res.data.code === 200) {
        message.success(`删除成功`)
        fetchFilesByCategory(record.fileType)
      } else {
        message.error(res.data.message || '删除失败')
      }
    } catch (error) {
      message.error('删除失败，请重试')
      console.error(error)
    }
  }

  const handleDeleteMedia = async (record: MediaItem, categoryKey: string) => {
    try {
      const res = await deleteMediaApi(record.id)
      if (res.data.code === 200) {
        message.success(`删除成功`)
        fetchMediaByCategory(categoryKey)
      } else {
        message.error(res.data.message || '删除失败')
      }
    } catch (error) {
      message.error('删除失败，请重试')
      console.error(error)
    }
  }

  const getPdfColumns = (): ColumnsType<PdfItem> => [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      ellipsis: true,
      render: (text) => (
        <Space>
          <FilePdfOutlined style={{ color: '#E74C3C' }} />
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Popconfirm
            title="确认删除此文件？"
            onConfirm={() => handleDelete(record)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const getMediaColumns = (categoryKey: string): ColumnsType<MediaItem> => [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      ellipsis: true,
      render: (text, record) => (
        <Space>
          {record.mediaType === 'video' ? 
            <PlayCircleOutlined style={{ color: '#1ABC9C' }} /> : 
            <FileImageOutlined style={{ color: '#3498DB' }} />
          }
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Popconfirm
            title="确认删除此文件？"
            onConfirm={() => handleDeleteMedia(record, categoryKey)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24, minHeight: '100vh', background: '#f0f2f5' }}>
      <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600, color: '#333' }}>
        宣传屏文件管理
      </h2>

      {/* PDF 文件管理区域（重点工作、党务公开、光荣榜） */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 500, color: '#555' }}>
          PDF 文档管理
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {categories.map((cat) => {
            const info = categoryMap[cat.key]
            return (
              <Card
                key={cat.key}
                hoverable
                style={{ borderRadius: 12, overflow: 'hidden' }}
                styles={{ body: { padding: 0 } }}
              >
                <div
                  style={{
                    background: `linear-gradient(135deg, ${cat.color}, ${cat.color}dd)`,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{info.icon}</span>
                    <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
                      {info.label}
                    </span>
                  </div>
                  <Upload
                    showUploadList={false}
                    beforeUpload={(file) => handleUpload(file, cat.key, cat.label)}
                    disabled={uploadingKey === cat.key || loadingMap[cat.key]}
                  >
                    <Button
                      type="primary"
                      ghost
                      icon={<UploadOutlined />}
                      loading={uploadingKey === cat.key}
                      style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.7)' }}
                    >
                      {uploadingKey === cat.key ? '上传中...' : '上传 PDF'}
                    </Button>
                  </Upload>
                </div>

                <div style={{ padding: 16 }}>
                  <Table
                    rowKey="id"
                    size="small"
                    loading={loadingMap[cat.key]}
                    columns={getPdfColumns()}
                    dataSource={fileListMap[cat.key] || []}
                    pagination={{
                      pageSize: 5,
                      size: 'small',
                      showSizeChanger: false,
                    }}
                    locale={{
                      emptyText: (
                        <div style={{ padding: '20px 0', color: '#999' }}>
                          <FilePdfOutlined style={{ fontSize: 32, marginBottom: 8, display: 'block' }} />
                          <span>暂无文件，请上传 PDF</span>
                        </div>
                      ),
                    }}
                  />
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* 媒体文件管理区域（组织生活、活动风采 - 支持多图片/视频） */}
      <div>
        <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 500, color: '#555', display: 'flex', alignItems: 'center' }}>
          <div>多媒体管理（支持图片、视频）</div>
          <div style={{ marginLeft: 16 }}>
            宣传屏展示：
            <Radio.Group
              value={showType}
              onChange={onShowTypeChange}
              options={[
                { value: 'image', label: '图片' },
                { value: 'video', label: '视频' },
              ]}
            />
          </div>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {mediaCategories.map((cat) => {
            const info = categoryMap[cat.key]
            const mediaFiles = mediaListMap[cat.key] || []
            
            return (
              <Card
                key={cat.key}
                hoverable
                style={{ borderRadius: 12, overflow: 'hidden' }}
                styles={{ body: { padding: 0 } }}
              >
                <div
                  style={{
                    background: `linear-gradient(135deg, ${cat.color}, ${cat.color}dd)`,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{info.icon}</span>
                    <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
                      {info.label}
                    </span>
                    <span style={{ color: '#fff', fontSize: 12, opacity: 0.8 }}>
                      (共 {mediaFiles.length} 个文件)
                    </span>
                  </div>
                  <Upload
                    showUploadList={false}
                    beforeUpload={(file) => handleMediaUpload(file, cat.key, cat.label)}
                    disabled={uploadingMediaKey === cat.key}
                    multiple
                    accept={cat.accept}
                  >
                    <Button
                      type="primary"
                      ghost
                      icon={<PlusOutlined />}
                      loading={uploadingMediaKey === cat.key}
                      style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.7)' }}
                    >
                      {uploadingMediaKey === cat.key ? '上传中...' : '上传图片/视频'}
                    </Button>
                  </Upload>
                </div>

                <div style={{ padding: 16 }}>
                  <Table
                    rowKey="id"
                    size="small"
                    loading={mediaLoadingMap[cat.key]}
                    columns={getMediaColumns(cat.key)}
                    dataSource={mediaFiles}
                    pagination={{
                      pageSize: 5,
                      size: 'small',
                      showSizeChanger: false,
                    }}
                    locale={{
                      emptyText: (
                        <div style={{ padding: '20px 0', color: '#999' }}>
                          <UploadOutlined style={{ fontSize: 32, marginBottom: 8, display: 'block' }} />
                          <span>暂无文件，支持上传多个图片和视频</span>
                        </div>
                      ),
                    }}
                  />
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default UploadPDF