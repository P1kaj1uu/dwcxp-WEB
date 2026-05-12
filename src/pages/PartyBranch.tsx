import React, { useState, useEffect } from 'react'
import { Card, Table, Form, Button, Space, Input, Modal, message, Popconfirm, Upload, Tooltip } from 'antd'
import {  PlusOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons'
import { getBranchListApi, addBranchApi, delBranchApi, editBranchApi, batchAddBranchApi } from '@/api/branchs'
import * as XLSX from 'xlsx'
import styled from 'styled-components'

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

const PartyBranch: React.FC = () => {
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
  const [modalTitle, setModalTitle] = useState('新增党支部信息')
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    if (tableParams.pagination.current) {
      fetchTableData()
    }
  }, [tableParams.pagination.current, tableParams.pagination.pageSize])

  // 获取表格数据
  const fetchTableData = async (params?: any) => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const queryParams = {
        pageNum: tableParams.pagination.current,
        pageSize: tableParams.pagination.pageSize,
        ...values,
        ...params,
      }

      const res = await getBranchListApi(queryParams)

      if (res.data.code === 200) {
        setDataSource(res.data.data.list || [])
        setTableParams({
          ...tableParams,
          pagination: {
            ...tableParams.pagination,
            total: res.data.data.total || 0,
          },
        })
      }
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 表格分页变化
  const handleTableChange = (pagination: any) => {
    setTableParams({
      ...tableParams,
      pagination,
    })
  }

  // 搜索
  const handleSearch = () => {
    setTableParams({
      ...tableParams,
      pagination: {
        ...tableParams.pagination,
        current: 1,
      },
    })
    fetchTableData()
  }

  // 初始化加载数据
  useEffect(() => {
    fetchTableData()
  }, [])

  // 打开新增弹窗
  const handleAddModal = () => {
    setModalTitle('新增党支部信息')
    setIsModalVisible(true)
  }

  // 打开编辑弹窗
  const handleEditModal = (record: any) => {
    setEditId(record.id as any)
    setModalTitle('编辑党支部信息')
    addForm.setFieldsValue(record)
    setIsModalVisible(true)
  }

  // 关闭弹窗
  const handleCancelModal = () => {
    setEditId(null)
    setIsModalVisible(false)
    addForm.resetFields()
  }

  // 下载模板
  const handleDownloadTemplate = () => {
    window.open('/doc/党支部基本概况.xlsx', '_blank')
  }

  // 批量上传处理
const handleBatchUpload = async (file: File) => {
  const type = file.name.split('.')
  const fileExt = type[type.length - 1].toLowerCase()
  if (fileExt !== 'xlsx' && fileExt !== 'xls') {
    message.warning('只能选择excel文件导入')
    return false
  }

  const reader = new FileReader()
  reader.readAsBinaryString(file)
  reader.onload = async (e) => {
    try {
      const data = e.target?.result
      const workbook = XLSX.read(data, { type: 'binary' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
    
      // 获取原始二维数组
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
    
      console.log('原始数据:', rawData)
    
      // 解析数据
      const parsedData = parseExcelData(rawData)
      console.log('解析后的数据:', parsedData)
      
      if (parsedData.length === 0) {
        message.warning('未解析到有效数据，请检查Excel模板格式')
        return
      }
      
      const res = await batchAddBranchApi(parsedData)
      if (res.data.code === 200) {
        message.success(`批量新增成功，共导入${parsedData.length}条数据`)
        fetchTableData()
      } else {
        message.error(res.data.message || '批量新增失败，请稍后重试')
      }
    } catch (error) {
      console.error('解析文件失败:', error)
      message.error('解析文件失败，请检查文件格式')
    }
  }
  reader.onerror = () => {
    message.error('读取文件失败')
  }
  return false
}

  // 解析Excel数据
const parseExcelData = (rawData: any[][]): any[] => {
  if (!rawData || rawData.length < 3) {
    message.warning('Excel 文件格式不正确')
    return []
  }

  // 查找表头行（包含"党小组数"或"党小"的行）
  let headerRowIndex = -1
  let dataStartIndex = -1
  
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i]
    if (!row || row.length === 0) continue
    
    // 将整行拼接成字符串，用于判断是否是表头行
    const rowText = row.join('')
    // 移除换行符后判断（因为单元格内可能有换行符如"党小\n组数"）
    const cleanedRowText = rowText.replace(/\n/g, '')
    
    // 查找包含"党小组数"或"班组数"的行作为表头
    if ((cleanedRowText.includes('党小组数') || cleanedRowText.includes('党小')) && 
        cleanedRowText.includes('班组数')) {
      headerRowIndex = i
      dataStartIndex = i + 1
      break
    }
  }

  if (headerRowIndex === -1) {
    message.warning('未找到正确的表头行')
    return []
  }

  const headerRow = rawData[headerRowIndex]
  
  // 清理表头中的换行符和空格
  const cleanedHeaderRow = headerRow.map((cell: any) => 
    cell?.toString().replace(/\n/g, '').replace(/\s/g, '') || ''
  )
  
  console.log('清理后的表头:', cleanedHeaderRow)
  
  // 根据表头位置映射字段索引
  const fieldMap: Record<string, number> = {
    count1: -1,  // 党小组数
    count2: -1,  // 班组数
    count3: -1,  // 在职职工数
    count4: -1,  // 在岗职工数
    count5: -1,  // 团员人数
    count6: -1,  // 入党申请人数
    count7: -1,  // 入党积极分子数
    count8: -1,  // 发展对象数
    count9: -1,  // 预备党员数
    count10: -1, // 正式党员数
    count11: -1, // 大学及以上
    count12: -1, // 大专
    count13: -1, // 中专中技
    count14: -1, // 高中
    count15: -1, // 初中及以下
    count16: -1, // 高级技师数
    count17: -1, // 技师数
    count18: -1, // 高级工数
    count19: -1, // 中级工数
    count20: -1, // 初级工数
    time: -1,    // 更新时间
  }

  // 遍历表头，确定每一列的索引
  for (let colIndex = 0; colIndex < cleanedHeaderRow.length; colIndex++) {
    const cellValue = cleanedHeaderRow[colIndex]
    
    if (cellValue.includes('党小组数')) fieldMap.count1 = colIndex
    else if (cellValue.includes('班组数')) fieldMap.count2 = colIndex
    else if (cellValue.includes('在职职工数')) fieldMap.count3 = colIndex
    else if (cellValue.includes('在岗职工数')) fieldMap.count4 = colIndex
    else if (cellValue.includes('团员人数')) fieldMap.count5 = colIndex
    else if (cellValue.includes('入党申请人数')) fieldMap.count6 = colIndex
    else if (cellValue.includes('入党积极分子数')) fieldMap.count7 = colIndex
    else if (cellValue.includes('发展对象数')) fieldMap.count8 = colIndex
    else if (cellValue.includes('预备党员数')) fieldMap.count9 = colIndex
    else if (cellValue.includes('正式党员数')) fieldMap.count10 = colIndex
    else if (cellValue.includes('大学及以上')) fieldMap.count11 = colIndex
    else if (cellValue.includes('大专')) fieldMap.count12 = colIndex
    else if (cellValue.includes('中专中技')) fieldMap.count13 = colIndex
    else if (cellValue.includes('高中')) fieldMap.count14 = colIndex
    else if (cellValue.includes('初中及以下')) fieldMap.count15 = colIndex
    else if (cellValue.includes('高级技师数')) fieldMap.count16 = colIndex
    else if (cellValue.includes('技师数')) fieldMap.count17 = colIndex
    else if (cellValue.includes('高级工数')) fieldMap.count18 = colIndex
    else if (cellValue.includes('中级工数')) fieldMap.count19 = colIndex
    else if (cellValue.includes('初级工数')) fieldMap.count20 = colIndex
    else if (cellValue.includes('更新时间')) fieldMap.time = colIndex
  }

  console.log('字段映射:', fieldMap)

  // 解析数据行
  const result: any[] = []
  for (let i = dataStartIndex; i < rawData.length; i++) {
    const row = rawData[i]
    if (!row || row.length === 0) continue
    
    // 检查是否为空行（第一个单元格为空或undefined则跳过）
    const firstCell = row[0]
    if (firstCell === undefined || firstCell === null || firstCell === '') continue
    
    // 构建数据对象
    const dataItem: any = {}
    
    // 解析各个字段
    Object.entries(fieldMap).forEach(([field, colIndex]) => {
      if (colIndex !== -1 && row[colIndex] !== undefined && row[colIndex] !== null) {
        let value = row[colIndex]
        // 如果是时间字段，处理Excel日期序列号
        if (field === 'time' && typeof value === 'number') {
          // 将Excel日期序列号转换为日期字符串
          const date = new Date((value - 25569) * 86400000)
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          value = `${year}-${month}-${day}`
        } 
        // 如果是数字字段，尝试转换为数字
        else if (field !== 'time' && typeof value === 'number') {
          value = value
        }
        else if (field !== 'time' && typeof value === 'string' && value !== '') {
          const numValue = Number(value)
          value = !isNaN(numValue) ? numValue : 0
        }
        dataItem[field] = value
      } else if (field !== 'time') {
        // 数字字段默认为0
        dataItem[field] = 0
      } else {
        // 时间字段默认为空
        dataItem[field] = ''
      }
    })
    
    // 如果有有效数据（至少党小组数不为0），则添加
    if (dataItem.count1 !== 0 || dataItem.count2 !== 0) {
      result.push(dataItem)
    }
  }

  console.log(`解析完成，共${result.length}条数据`, result)

  if (result.length === 0) {
    message.warning('未解析到有效数据，请检查Excel格式')
  }

  return result
}
  

  // 提交新增/编辑表单
  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validateFields()
      if (modalTitle === '新增党支部信息') {
        const res = await addBranchApi(values)
        if (res.data.code === 200) {
          message.success('新增成功')
          setIsModalVisible(false)
          addForm.resetFields()
          fetchTableData()
        } else {
          message.error('新增失败，请稍后重试')
        }
      } else {
        const submitData = {
          id: editId as any,
          ...values
        }
        const res = await editBranchApi(submitData)
        if (res.data.code === 200) {
          message.success('编辑成功')
          setIsModalVisible(false)
          addForm.resetFields()
          fetchTableData()
        } else {
          message.error('编辑失败，请稍后重试')
        }
      }
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const columns = [
    {
      title: 'ID',
      width: 100,
      key: 'index',
      // @ts-ignore
      render: (text: any, record: any, index: number) => index + 1,
    },
    {
      title: '党小组数',
      dataIndex: 'count1',
      key: 'count1',
      width: 120,
    },
    {
      title: '班组数',
      dataIndex: 'count2',
      key: 'count2',
      width: 120,
    },
    {
      title: '在职职工数',
      dataIndex: 'count3',
      key: 'count3',
      width: 120,
    },
    {
      title: '在岗职工数',
      dataIndex: 'count4',
      key: 'count4',
      width: 120,
    },
    {
      title: '团员人数',
      dataIndex: 'count5',
      key: 'count5',
      width: 120,
    },
    {
      title: '入党申请人数',
      dataIndex: 'count6',
      key: 'count6',
      width: 120,
    },
    {
      title: '入党积极分子数',
      dataIndex: 'count7',
      key: 'count7',
      width: 150,
    },
    {
      title: '发展对象数',
      dataIndex: 'count8',
      key: 'count8',
      width: 120,
    },
    {
      title: '预备党员数',
      dataIndex: 'count9',
      key: 'count9',
      width: 120,
    },
    {
      title: '正式党员数',
      dataIndex: 'count10',
      key: 'count10',
      width: 120,
    },
    {
      title: '大学及以上',
      dataIndex: 'count11',
      key: 'count11',
      width: 120,
    },
    {
      title: '大专',
      dataIndex: 'count12',
      key: 'count12',
      width: 120,
    },
    {
      title: '中专中技',
      dataIndex: 'count13',
      key: 'count13',
      width: 120,
    },
    {
      title: '高中',
      dataIndex: 'count14',
      key: 'count14',
      width: 120,
    },
    {
      title: '初中及以下',
      dataIndex: 'count15',
      key: 'count15',
      width: 120,
    },
    {
      title: '高级技师数',
      dataIndex: 'count16',
      key: 'count16',
      width: 120,
    },
    {
      title: '技师数',
      dataIndex: 'count17',
      key: 'count17',
      width: 120,
    },
    {
      title: '高级工数',
      dataIndex: 'count18',
      key: 'count18',
      width: 120,
    },
    {
      title: '中级工数',
      dataIndex: 'count19',
      key: 'count19',
      width: 120,
    },
    {
      title: '初级工数',
      dataIndex: 'count20',
      key: 'count20',
      width: 120,
    },
    {
      title: '更新时间',
      dataIndex: 'time',
      key: 'time',
      width: 150,
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
              const res = await delBranchApi(record.id as any)
              if (res.data.code === 200) {
                message.success('删除成功')
                fetchTableData()
              } else {
                message.error('删除失败，请稍后重试')
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

  return (
    <HomeContainer>
      <FilterCard title="党支部基本概况">
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
        >
          <Form.Item>
            <Space>
              <Button icon={<PlusOutlined />} onClick={handleAddModal}>
                单个新增
              </Button>
              <Upload
                accept=".xlsx,.xls"
                showUploadList={false}
                beforeUpload={handleBatchUpload}
              >
                <Button icon={<UploadOutlined />}>
                  批量新增
                </Button>
              </Upload>
              <Tooltip title="下载批量新增的Excel模板">
                <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate} style={{ marginLeft: 8 }} />
              </Tooltip>
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
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={modalTitle}
        open={isModalVisible}
        onOk={handleAddSubmit}
        onCancel={handleCancelModal}
        width={700}
        okText="确定"
        cancelText="取消"
      >
        <Form
          form={addForm}
          layout="vertical"
        >
          <Form.Item
            name="count1"
            label="党小组数"
            rules={[{ required: true, message: '请输入党小组数' }]}
          >
            <Input placeholder="请输入党小组数" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="count2"
            label="班组数"
            rules={[{ required: true, message: '请输入班组数' }]}
          >
            <Input placeholder="请输入班组数" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="count3"
            label="在职职工数"
            rules={[{ required: true, message: '请输入在职职工数' }]}
          >
            <Input placeholder="请输入在职职工数" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="count4"
            label="在岗职工数"
            rules={[{ required: true, message: '请输入在岗职工数' }]}
          >
            <Input placeholder="请输入在岗职工数" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="count5"
            label="团员人数"
            rules={[{ required: true, message: '请输入团员人数' }]}
          >
            <Input placeholder="请输入团员人数" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="count6"
            label="入党申请人数"
            rules={[{ required: true, message: '请输入入党申请人数' }]}
          >
            <Input placeholder="请输入入党申请人数" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="count7"
            label="入党积极分子数"
            rules={[{ required: true, message: '请输入入党积极分子数' }]}
          >
            <Input placeholder="请输入入党积极分子数" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="count8"
            label="发展对象数"
            rules={[{ required: true, message: '请输入发展对象数' }]}
          >
            <Input placeholder="请输入发展对象数" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="count9"
            label="预备党员数"
            rules={[{ required: true, message: '请输入预备党员数' }]}
          >
            <Input placeholder="请输入预备党员数" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="count10"
            label="正式党员数"
            rules={[{ required: true, message: '请输入正式党员数' }]}
          >
            <Input placeholder="请输入正式党员数" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="count11"
            label="大学及以上"
            rules={[{ required: true, message: '请输入大学及以上人数' }]}
          >
            <Input placeholder="请输入大学及以上人数" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="count12"
            label="大专"
            rules={[{ required: true, message: '请输入大专人数' }]}
          >
            <Input placeholder="请输入大专人数" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="count13"
            label="中专中技"
            rules={[{ required: true, message: '请输入中专中技人数' }]}
          >
            <Input placeholder="请输入中专中技人数" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="count14"
            label="高中"
            rules={[{ required: true, message: '请输入高中人数' }]}
          >
            <Input placeholder="请输入高中人数" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="count15"
            label="初中及以下"
            rules={[{ required: true, message: '请输入初中及以下人数' }]}
          >
            <Input placeholder="请输入初中及以下人数" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="count16"
            label="高级技师数"
            rules={[{ required: true, message: '请输入高级技师数' }]}
          >
            <Input placeholder="请输入高级技师数" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="count17"
            label="技师数"
            rules={[{ required: true, message: '请输入技师数' }]}
          >
            <Input placeholder="请输入技师数" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="count18"
            label="高级工数"
            rules={[{ required: true, message: '请输入高级工数' }]}
          >
            <Input placeholder="请输入高级工数" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="count19"
            label="中级工数"
            rules={[{ required: true, message: '请输入中级工数' }]}
          >
            <Input placeholder="请输入中级工数" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="count20"
            label="初级工数"
            rules={[{ required: true, message: '请输入初级工数' }]}
          >
            <Input placeholder="请输入初级工数" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="time"
            label="更新时间"
            rules={[{ required: true, message: '请输入更新时间' }]}
          >
            <Input placeholder="请输入更新时间" autoComplete="off" />
          </Form.Item>
        </Form>
      </Modal>
    </HomeContainer>
  )
}

export default PartyBranch
