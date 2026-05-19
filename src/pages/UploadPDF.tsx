import React, { useState, useEffect } from 'react'
import { Card, Upload, Button, message, Space, Table, Popconfirm } from 'antd'
import { UploadOutlined, DeleteOutlined, FilePdfOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { uploadPdfApi, getPdfListApi, deletePdfApi } from '@/api/pdf'

interface PdfItem {
  id: number
  fileName: string
  fileType: string
  fileContent?: string | null
}

const labelToKey: Record<string, string> = {
  '重点工作': 'keyWork',
  '党务公开': 'partyAffairs',
  '光荣榜': 'integrity',
  '组织生活': 'orgLife',
}

const categoryMap: Record<string, { label: string; color: string; icon: string }> = {
  keyWork: { label: '重点工作', color: '#E74C3C', icon: '' },
  partyAffairs: { label: '党务公开', color: '#3498DB', icon: '' },
  integrity: { label: '光荣榜', color: '#F39C12', icon: '' },
  orgLife: { label: '组织生活', color: '#9B59B6', icon: '' },
}

const categories = [
  { key: 'keyWork', label: '重点工作', color: '#E74C3C' },
  { key: 'partyAffairs', label: '党务公开', color: '#3498DB' },
  { key: 'integrity', label: '光荣榜', color: '#F39C12' },
  { key: 'orgLife', label: '组织生活', color: '#9B59B6' },
]

const UploadPDF: React.FC = () => {
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [fileListMap, setFileListMap] = useState<Record<string, PdfItem[]>>({})
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    categories.forEach(cat => fetchFilesByCategory(cat.label))
  }, [])

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

    // 检查是否已有文件
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

    return false // 阻止默认上传行为
  }

  const fetchFilesByCategory = async (category: string) => {
    const key = labelToKey[category] ?? category
    setLoadingMap(prev => ({ ...prev, [key]: true }))
    try {
      const res = await getPdfListApi({ type: category })
      if (res.data.code === 200) {
        const files: PdfItem[] = res.data.data || []
        const uploadFiles: PdfItem[] = files
        setFileListMap(prev => ({ ...prev, [key]: uploadFiles }))
      }
    } catch (error) {
      console.error('获取文件列表失败', error)
    } finally {
      setLoadingMap(prev => ({ ...prev, [key]: false }))
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

  const getColumns = (): ColumnsType<PdfItem> => [
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

  return (
    <div style={{ padding: 24, minHeight: '100vh', background: '#f0f2f5' }}>
      <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600, color: '#333' }}>
        宣传屏文件管理
      </h2>

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
              {/* 卡片头部 */}
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

              {/* 文件列表表格 */}
              <div style={{ padding: 16 }}>
                <Table
                  rowKey="id"
                  size="small"
                  loading={loadingMap[cat.key]}
                  columns={getColumns()}
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
  )
}

export default UploadPDF