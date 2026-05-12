import React, { useState, useEffect } from 'react'
import { Card, Table, Form, Button, Space, Input, Modal, message, Popconfirm, Select, Upload } from 'antd'
import { PlusOutlined, UploadOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { getBasicListApi, getBasicByTypeApi, addBasicApi, delBasicApi, editBasicApi } from '@/api/basic'
import styled from 'styled-components'

const { Option } = Select

interface TableParams {
  pagination: {
    current: number
    pageSize: number
    total: number
  }
}

const HomeContainer = styled.div`
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
`

const FilterCard = styled(Card)`
  margin-bottom: 16px;
  .ant-form-item {
    margin-bottom: 16px;
  }
`

const PhotoImg = styled.img`
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
`

const departmentOptions = [
  { label: '党支部委员会', value: '党支部委员会' },
  { label: '车间分会委员会', value: '车间分会委员会' },
  { label: '团支部委员会', value: '团支部委员会' },
]

const PartyBasic: React.FC = () => {
  const [form] = Form.useForm()
  const [addForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
  })
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [modalTitle, setModalTitle] = useState('新增基本情况')
  const [editId, setEditId] = useState(null)
  const [filterType, setFilterType] = useState<string | undefined>(undefined)
  const [photoBase64, setPhotoBase64] = useState<string>('')
  const [compressing, setCompressing] = useState(false)

  useEffect(() => {
    fetchTableData()
  }, [filterType, tableParams.pagination.current, tableParams.pagination.pageSize])

  const fetchTableData = async () => {
    setLoading(true)
    try {
      let res
      if (filterType) {
        res = await getBasicByTypeApi(filterType)
      } else {
        const queryParams = {
          pageNum: tableParams.pagination.current,
          pageSize: tableParams.pagination.pageSize,
        }
        res = await getBasicListApi(queryParams)
      }

      if (res.data.code === 200) {
        const list = res.data.data.list || res.data.data || []
        setDataSource(list)
        if (res.data.data.total !== undefined) {
          setTableParams(prev => ({
            ...prev,
            pagination: {
              ...prev.pagination,
              total: res.data.data.total || 0,
            },
          }))
        }
      }
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTableChange = (pagination: any) => {
    setTableParams(prev => ({
      ...prev,
      pagination,
    }))
  }

  const handleSearch = () => {
    setTableParams(prev => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        current: 1,
      },
    }))
  }

  const handleReset = () => {
    form.resetFields()
    setFilterType(undefined)
    setTableParams(prev => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        current: 1,
      },
    }))
  }

  const handleTypeChange = (value: string | undefined) => {
    setFilterType(value)
    setTableParams(prev => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        current: 1,
      },
    }))
  }

  const handleAddModal = () => {
    setModalTitle('新增基本情况')
    setEditId(null)
    setPhotoBase64('')
    addForm.resetFields()
    setIsModalVisible(true)
  }

  const handleEditModal = (record: any) => {
    setEditId(record.id as any)
    setModalTitle('编辑基本情况')
    setPhotoBase64(record.photo || '')
    addForm.setFieldsValue({
      name: record.name,
      position: record.position,
      type: record.type,
      photo: record.photo || undefined,
    })
    setIsModalVisible(true)
  }

  const handleCancelModal = () => {
    setEditId(null)
    setIsModalVisible(false)
    addForm.resetFields()
    setPhotoBase64('')
    setCompressing(false)
  }

  // 极致压缩图片 - 使用 Canvas 进行多重压缩
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          // 创建 canvas
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          
          // 极致缩小尺寸 - 限制最大边长为 200px（适合头像展示）
          const maxSize = 200
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          } else if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
          
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('无法获取 Canvas 上下文'))
            return
          }
          
          // 绘制图片
          ctx.drawImage(img, 0, 0, width, height)
          
          // 极致压缩：使用最低质量 0.3-0.4，使用 JPEG 格式
          // 先尝试 JPEG（有损压缩，文件更小）
          let quality = 0.35 // 极致压缩质量参数（0-1之间，0.35可大幅减小文件大小）
          
          // 对于照片类图片，JPEG 效果最好
          let base64 = canvas.toDataURL('image/jpeg', quality)
          
          // 如果 JPEG 仍然太大（超过 30KB），进一步降质
          let finalBase64 = base64
          let finalQuality = quality
          
          // 计算 Base64 的实际大小（去除 data:image/jpeg;base64, 前缀）
          const getBase64Size = (b64: string) => {
            const base64Data = b64.split(',')[1]
            if (!base64Data) return 0
            // Base64 字符串长度 * 0.75 约等于实际字节数
            return Math.ceil(base64Data.length * 0.75)
          }
          
          let sizeInBytes = getBase64Size(base64)
          
          // 如果超过 20KB，继续降低质量
          while (sizeInBytes > 20 * 1024 && finalQuality > 0.2) {
            finalQuality -= 0.05
            finalBase64 = canvas.toDataURL('image/jpeg', finalQuality)
            sizeInBytes = getBase64Size(finalBase64)
          }
          
          // 极致优化：如果图片是纯色或图标类，可以尝试 PNG 但索引色（这里不做复杂处理）
          // 最终返回纯 Base64 数据（不带前缀）
          const pureBase64 = finalBase64.split(',')[1]
          resolve(pureBase64)
        }
        img.onerror = () => {
          reject(new Error('图片加载失败'))
        }
      }
      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }
    })
  }

  // 备用压缩方案：针对特殊图片格式
  const ultraCompressImage = async (file: File): Promise<string> => {
    try {
      // 先尝试标准压缩
      return await compressImage(file)
    } catch (error) {
      console.error('压缩失败，使用备用方案:', error)
      // 备用方案：使用更极端的尺寸限制
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (event) => {
          const img = new Image()
          img.src = event.target?.result as string
          img.onload = () => {
            const canvas = document.createElement('canvas')
            // 极限缩小到 120px
            let width = img.width
            let height = img.height
            const maxSize = 120
            if (width > height && width > maxSize) {
              height = (height * maxSize) / width
              width = maxSize
            } else if (height > maxSize) {
              width = (width * maxSize) / height
              height = maxSize
            }
            
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            if (!ctx) {
              reject(new Error('无法获取 Canvas 上下文'))
              return
            }
            ctx.drawImage(img, 0, 0, width, height)
            // 极限质量 0.2
            const base64 = canvas.toDataURL('image/jpeg', 0.2)
            const pureBase64 = base64.split(',')[1]
            resolve(pureBase64)
          }
          img.onerror = () => reject(new Error('图片加载失败'))
        }
        reader.onerror = () => reject(new Error('文件读取失败'))
      })
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return ultraCompressImage(file)
  }

  const beforePhotoUpload = (file: File) => {
    const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif'
    if (!isImage) {
      message.error('只能上传 JPG/PNG/GIF 格式的图片')
      return Upload.LIST_IGNORE
    }
    // 放宽原始文件大小限制，因为会进行极致压缩
    const isLt5M = file.size / 1024 / 1024 < 5
    if (!isLt5M) {
      message.error('图片大小不能超过 5MB')
      return Upload.LIST_IGNORE
    }
    return false // 阻止自动上传
  }

  const handlePhotoChange = async (info: any) => {
    const { fileList } = info
    if (fileList.length > 0 && fileList[0].originFileObj) {
      setCompressing(true)
      const hideLoading = message.loading('正在压缩图片，请稍候...', 0)
      try {
        const base64 = await fileToBase64(fileList[0].originFileObj)
        setPhotoBase64(base64)
        addForm.setFieldsValue({ photo: base64 })
        
        // 计算压缩后的大小并提示
        const sizeInKB = Math.ceil(base64.length * 0.75 / 1024)
        hideLoading()
        message.success(`图片压缩完成！大小约 ${sizeInKB} KB`, 2)
      } catch (error) {
        hideLoading()
        message.error('图片压缩失败，请重试或更换图片')
        console.error('压缩失败:', error)
        // 清空上传的文件
        addForm.setFieldsValue({ photo: undefined })
        setPhotoBase64('')
      } finally {
        setCompressing(false)
      }
    } else {
      setPhotoBase64('')
      addForm.setFieldsValue({ photo: undefined })
    }
  }

  const handleAddSubmit = async () => {
    if (compressing) {
      message.warning('图片正在压缩中，请稍后再试')
      return
    }
    
    try {
      const values = await addForm.validateFields()

      // 验证照片是否已上传
      if (!photoBase64) {
        message.error('请上传照片')
        return
      }

      const submitData = {
        ...values,
        photo: photoBase64, // 已压缩的 Base64 数据
      }

      // 可选：打印提交的数据大小用于调试
      console.log('图片 Base64 长度:', photoBase64.length)
      console.log('图片实际大小:', Math.ceil(photoBase64.length * 0.75 / 1024), 'KB')

      if (modalTitle === '新增基本情况') {
        const res = await addBasicApi(submitData)
        if (res.data.code === 200) {
          message.success('新增成功')
          setIsModalVisible(false)
          addForm.resetFields()
          setPhotoBase64('')
          fetchTableData()
        } else {
          message.error(res.data.message || '新增失败')
        }
      } else {
        const res = await editBasicApi({
          id: editId,
          ...values,
          photo: photoBase64, // 编辑时也使用压缩后的图片
        })
        if (res.data.code === 200) {
          message.success('编辑成功')
          setIsModalVisible(false)
          addForm.resetFields()
          setPhotoBase64('')
          fetchTableData()
        } else {
          message.error(res.data.message || '编辑失败')
        }
      }
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const renderPhoto = (photo: string | null) => {
    if (!photo) {
      return <span style={{ color: '#999' }}>暂无</span>
    }
    return <PhotoImg src={`data:image/jpeg;base64,${photo}`} alt="照片" />
  }

  const columns = [
    {
      title: '序号',
      width: 80,
      key: 'index',
      render: (_: any, __: any, index: number) => (tableParams.pagination.current - 1) * tableParams.pagination.pageSize + index + 1,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '职务',
      dataIndex: 'position',
      key: 'position',
      width: 150,
    },
    {
      title: '部门',
      dataIndex: 'type',
      key: 'type',
      width: 160,
    },
    {
      title: '照片',
      dataIndex: 'photo',
      key: 'photo',
      width: 100,
      render: (photo: string) => renderPhoto(photo),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEditModal(record)}>编辑</Button>
          <Popconfirm
            title="删除"
            description="确认删除吗？"
            onConfirm={async () => {
              const res = await delBasicApi(record.id)
              if (res.data.code === 200) {
                message.success('删除成功')
                fetchTableData()
              } else {
                message.error('删除失败')
              }
            }}
            okText="是"
            cancelText="否"
          >
            <Button danger type="link" size="small">删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const getFileList = () => {
    if (photoBase64) {
      return [
        {
          uid: '-1',
          name: 'compressed_photo.jpg',
          status: 'done' as const,
          url: `data:image/jpeg;base64,${photoBase64}`,
        },
      ]
    }
    return []
  }

  return (
    <HomeContainer>
      <FilterCard title="基本情况管理">
        <Form form={form} layout="inline">
          <Form.Item name="type" label="部门">
            <Select
              placeholder="请选择部门"
              allowClear
              style={{ width: 200 }}
              onChange={handleTypeChange}
              value={filterType}
            >
              {departmentOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddModal}>新增</Button>
            </Space>
          </Form.Item>
        </Form>
      </FilterCard>

      <Card>
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          rowKey="id"
          pagination={{
            ...tableParams.pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title={modalTitle}
        open={isModalVisible}
        onOk={handleAddSubmit}
        onCancel={handleCancelModal}
        width={600}
        okText="确定"
        cancelText="取消"
        confirmLoading={compressing}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" autoComplete="off" />
          </Form.Item>

          <Form.Item name="position" label="职务" rules={[{ required: true, message: '请输入职务' }]}>
            <Input placeholder="请输入职务" autoComplete="off" />
          </Form.Item>

          <Form.Item name="type" label="部门" rules={[{ required: true, message: '请选择部门' }]}>
            <Select placeholder="请选择部门">
              {departmentOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item 
            name="photo" 
            label="照片" 
            rules={[{ required: true, message: '请上传照片' }]}
            extra="支持 JPG/PNG/GIF 格式，图片会自动压缩至 30KB 以内以适应存储"
          >
            <Upload
              listType="picture-card"
              beforeUpload={beforePhotoUpload}
              onChange={handlePhotoChange}
              maxCount={1}
              accept=".jpg,.jpeg,.png,.gif"
              fileList={getFileList()}
              onRemove={() => setPhotoBase64('')}
              disabled={compressing}
            >
              {getFileList().length === 0 && !compressing && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>上传照片</div>
                </div>
              )}
              {compressing && getFileList().length === 0 && (
                <div>
                  <div style={{ marginTop: 8 }}>压缩中...</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </HomeContainer>
  )
}

export default PartyBasic
