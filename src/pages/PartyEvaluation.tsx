import React, { useState, useEffect } from 'react'
import { Card, Table, Form, Select, Button, Space, Input, Modal, message, Popconfirm, Upload, Tooltip } from 'antd'
import { SearchOutlined, ReloadOutlined, PlusOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons'
import { getEvaluationListApi, addEvaluationApi, delEvaluationApi, editEvaluationApi, batchAddEvaluationApi } from '@/api/evaluation'
import * as XLSX from 'xlsx'
import styled from 'styled-components'


interface EvaluationItem {
  id: string
  name: string
  status: string
  createTime: string
  score?: number
  type?: string
  year?: string
  quarter?: string
  partyBranch?: string
  responsibilityPost?: string
  responsibilityArea?: string
  good?: string
  comments?: string
}

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

const PartyEvaluation: React.FC = () => {
  const [form] = Form.useForm()
  const [addForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<EvaluationItem[]>([])
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
  })
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [modalTitle, setModalTitle] = useState('新增党员评议信息')
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

      const res = await getEvaluationListApi(queryParams)

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

  // 重置
  const handleReset = () => {
    form.resetFields()
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
    setModalTitle('新增党员评议信息')
    setIsModalVisible(true)
  }

  // 打开编辑弹窗
  const handleEditModal = (record: EvaluationItem) => {
    let data = {
      ...record,
      good: (record.good && record.good !== '否') ? '是' : '否',
    }
    setEditId(record.id as any)
    setModalTitle('编辑党员评议信息')
    addForm.setFieldsValue(data)
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
    window.open('/doc/智慧党建.xlsx', '_blank')
  }

  // 批量上传处理
const handleBatchUpload = async (file: File) => {
  const type = file.name.split('.')
  if (type[type.length - 1] !== 'xlsx' && type[type.length - 1] !== 'xls') {
    message.warning('只能选择excel文件导入')
    return false
  }

  const reader = new FileReader()
  reader.readAsBinaryString(file)
  reader.onload = async (e) => {
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
    if (parsedData.length !== 0) {
      const res = await batchAddEvaluationApi(parsedData)
      if (res.data.code === 200) {
        message.success(`批量新增成功，共导入${parsedData.length}条数据`)
        fetchTableData()
      } else {
        message.error('批量新增失败，请稍后重试')
      }
    }
  }
  reader.onerror = () => {
    message.error('读取文件失败')
  }
  return false
}

// 解析Excel数据 - 横向季度数据转纵向记录
const parseExcelData = (rawData: any[][]): any[] => {
  if (!rawData || rawData.length < 5) {
    message.warning('Excel 文件格式不正确')
    return []
  }

  // 第2行（索引1）：获取党支部名称和年份季度信息
  const infoRow = rawData[1] || []
  const infoText = infoRow[0] || ''
  console.log('信息行:', infoText)

  // 解析党支部名称
  let partyBranch = ''
  const branchMatch = infoText.match(/名称[：:]\s*([^\s]+?)(?:\s|年|$)/)
  if (branchMatch) {
    partyBranch = branchMatch[1].trim()
  } else {
    const defaultMatch = infoText.match(/([^\s]+党支部)/)
    if (defaultMatch) partyBranch = defaultMatch[1]
  }

  // 解析年份
  let year = ''
  const yearMatch = infoText.match(/(\d{4})\s*年/)
  if (yearMatch) {
    year = yearMatch[1]
  }
  
  // 构建列映射：每个季度有3列（岗、区、四优）
  // 一季度：列1-3 (索引1,2,3)
  // 二季度：列4-6 (索引4,5,6)
  // 三季度：列7-9 (索引7,8,9)
  // 四季度：列10-12 (索引10,11,12)
  const quarters = [
    { name: '一季度', startCol: 1, endCol: 3 },   // 岗(1), 区(2), 四优(3)
    { name: '二季度', startCol: 4, endCol: 6 },   // 岗(4), 区(5), 四优(6)
    { name: '三季度', startCol: 7, endCol: 9 },   // 岗(7), 区(8), 四优(9)
    { name: '四季度', startCol: 10, endCol: 12 }  // 岗(10), 区(11), 四优(12)
  ]

  // 数据从第5行开始（索引4）
  const result: any[] = []
  
  for (let i = 4; i < rawData.length; i++) {
    const row = rawData[i]
    if (!row || row.length === 0) continue
    
    // 获取姓名（第1列，索引0）
    let name = ''
    if (row[0]) {
      name = row[0].toString().trim()
    }
    
    // 跳过空行、注释行
    if (!name || name === '' || name === '……' || name.includes('注：')) continue
    
    // 遍历四个季度
    for (const quarter of quarters) {
      // 获取岗、区、四优的值
      const postValue = row[quarter.startCol] ? row[quarter.startCol].toString().trim() : ''      // 岗
      const areaValue = row[quarter.startCol + 1] ? row[quarter.startCol + 1].toString().trim() : ''  // 区
      const goodValue = row[quarter.startCol + 2] ? row[quarter.startCol + 2].toString().trim() : ''  // 四优
      
      // 如果该季度没有任何数据，跳过（可选：如果三个字段都为空则跳过）
      const hasData = postValue || areaValue || goodValue
      if (!hasData) continue
      
      // 解析责任岗格次
      let responsibilityPost = ''
      if (postValue) {
        // 支持数字映射：1=先锋岗, 2=达标岗, 3=警示岗
        if (postValue === '1') responsibilityPost = '先锋岗'
        else if (postValue === '2') responsibilityPost = '达标岗'
        else if (postValue === '3') responsibilityPost = '警示岗'
        else responsibilityPost = postValue
      }
      
      // 解析责任区格次
      let responsibilityArea = ''
      if (areaValue) {
        // 支持数字映射：4=红旗区, 5=达标区, 6=警示区
        if (areaValue === '4') responsibilityArea = '红旗区'
        else if (areaValue === '5') responsibilityArea = '达标区'
        else if (areaValue === '6') responsibilityArea = '警示区'
        else responsibilityArea = areaValue
      }
      
      // 解析四优评价
      let good = ''
      if (goodValue) {
        // 支持 √、是、✓、✔ 等标记
        if (goodValue === '√' || goodValue === '是' || goodValue === '✓' || goodValue === '✔') {
          good = '是'
        } else if (goodValue === '×' || goodValue === '否' || goodValue === '✗') {
          good = '否'
        } else {
          good = goodValue
        }
      }
      
      // 添加记录
      result.push({
        year,
        quarter: quarter.name,
        partyBranch,
        name,
        responsibilityPost,   // 岗
        responsibilityArea,   // 区
        good                  // 四优
      })
    }
  }
  
  console.log(`解析完成，共${result.length}条数据`)
  
  if (result.length === 0) {
    message.warning('未解析到有效数据，请检查Excel格式')
  }
  
  return result
}

  // 提交新增/编辑表单
  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validateFields()
      if (modalTitle === '新增党员评议信息') {
        const res = await addEvaluationApi(values)
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
        const res = await editEvaluationApi(submitData)
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
      render: (text: any, record: EvaluationItem, index: number) => index + 1,
    },
    {
      title: '年度',
      dataIndex: 'year',
      key: 'year',
      width: 120,
    },
    {
      title: '季度',
      dataIndex: 'quarter',
      key: 'quarter',
      width: 120,
    },
    {
      title: '党组织（党小组）',
      dataIndex: 'partyBranch',
      key: 'partyBranch',
      width: 200,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '责任岗格次',
      dataIndex: 'responsibilityPost',
      key: 'responsibilityPost',
      width: 150,
    },
    {
      title: '责任区岗格次',
      dataIndex: 'responsibilityArea',
      key: 'responsibilityArea',
      width: 150,
    },
    {
      title: '四优',
      dataIndex: 'good',
      key: 'good',
      width: 100,
      render: (text: any) => (text !== '否' && text) ? '是' : '否',
    },
    {
      title: '对党员的点评意见',
      dataIndex: 'comments',
      key: 'comments',
      width: 200,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: EvaluationItem) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEditModal(record)}>编辑</Button>
          <Popconfirm
            title="删除"
            description="确认删除吗？"
            onConfirm={async () => {
              const res = await delEvaluationApi(record.id as any)
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
      <FilterCard title="党员创岗建区季度评议汇总表">
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
        >
          <Form.Item name="name" label="姓名">
            <Input placeholder="请输入姓名" allowClear autoComplete="off" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="responsibilityPost" label="责任岗格次">
            <Select placeholder="请选择责任岗格次" allowClear style={{ width: 150 }}>
              <Select.Option value="先锋岗">先锋岗</Select.Option>
              <Select.Option value="达标岗">达标岗</Select.Option>
              <Select.Option value="警示岗">警示岗</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="responsibilityArea" label="责任区岗格次">
            <Select placeholder="请选择责任区岗格次" allowClear style={{ width: 150 }}>
              <Select.Option value="红旗区">红旗区</Select.Option>
              <Select.Option value="达标区">达标区</Select.Option>
              <Select.Option value="警示区">警示区</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>
                重置
              </Button>
            </Space>
          </Form.Item>
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
            name="year"
            label="年度"
            rules={[{ required: true, message: '请输入年度' }]}
          >
            <Input placeholder="请输入年度，如：2026年" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="quarter"
            label="季度"
            rules={[{ required: true, message: '请选择季度' }]}
          >
            <Select placeholder="请选择季度">
              <Select.Option value="一季度">一季度</Select.Option>
              <Select.Option value="二季度">二季度</Select.Option>
              <Select.Option value="三季度">三季度</Select.Option>
              <Select.Option value="四季度">四季度</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="partyBranch"
            label="党组织（党小组）"
            rules={[{ required: true, message: '请输入党组织（党小组）' }]}
          >
            <Input placeholder="请输入党组织（党小组）" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="responsibilityPost"
            label="责任岗格次"
            rules={[{ required: true, message: '请选择责任岗格次' }]}
          >
            <Select placeholder="请选择责任岗格次">
              <Select.Option value="先锋岗">先锋岗</Select.Option>
              <Select.Option value="达标岗">达标岗</Select.Option>
              <Select.Option value="警示岗">警示岗</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="responsibilityArea"
            label="责任区岗格次"
            rules={[{ required: true, message: '请选择责任区岗格次' }]}
          >
            <Select placeholder="请选择责任区岗格次">
              <Select.Option value="红旗区">红旗区</Select.Option>
              <Select.Option value="达标区">达标区</Select.Option>
              <Select.Option value="警示区">警示区</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="good"
            label="四优"
            rules={[{ required: true, message: '请选择是否四优' }]}
          >
            <Select placeholder="请选择是否四优">
              <Select.Option value="是">是</Select.Option>
              <Select.Option value="否">否</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="comments"
            label="对党员的点评意见"
            rules={[{ required: true, message: '请输入点评意见' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入对党员的点评意见" autoComplete="off" />
          </Form.Item>
        </Form>
      </Modal>
    </HomeContainer>
  )
}

export default PartyEvaluation
