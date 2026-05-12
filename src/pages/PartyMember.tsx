import React, { useState, useEffect } from 'react'
import { Card, Table, Form, Button, Space, Input, Modal, message, Popconfirm, Upload, Tooltip } from 'antd'
import { SearchOutlined, ReloadOutlined, PlusOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons'
import { getMemberListApi, addMemberApi, delMemberApi, editMemberApi, batchAddMemberApi } from '@/api/member'
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

const PartyMember: React.FC = () => {
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
  const [modalTitle, setModalTitle] = useState('新增党员')
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

      const res = await getMemberListApi(queryParams)

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
    setModalTitle('新增党员')
    setIsModalVisible(true)
  }

  // 打开编辑弹窗
  const handleEditModal = (record: any) => {
    setEditId(record.id as any)
    setModalTitle('编辑党员')
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
    window.open('/doc/党员名册.xlsx', '_blank')
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
      const res = await batchAddMemberApi(parsedData)
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

// 将Excel序列号转换为日期字符串 (YYYY-MM-DD 或 YYYY年MM月DD日格式)
const excelSerialToDate = (serial: number, format: string = 'YYYY-MM-DD'): string => {
  if (!serial || typeof serial !== 'number') return String(serial || '')
  
  // Excel日期从1900年1月1日开始计算
  const utc_days = Math.floor(serial - 25569)
  const utc_value = utc_days * 86400
  const date_info = new Date(utc_value * 1000)
  
  const year = date_info.getFullYear()
  const month = String(date_info.getMonth() + 1).padStart(2, '0')
  const day = String(date_info.getDate()).padStart(2, '0')
  
  if (format === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`
  } else if (format === 'YYYY年MM月DD日') {
    return `${year}年${month}月${day}日`
  }
  return `${year}-${month}-${day}`
}

// 解析Excel数据 - 字段与后端实体类对应
const parseExcelData = (rawData: any[][]): any[] => {
  if (!rawData || rawData.length < 3) {
    message.warning('Excel 文件格式不正确')
    return []
  }

  // 查找表头行（包含"姓名"的行）
  let headerRowIndex = -1
  let dataStartIndex = -1
  
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i]
    if (!row) continue
    
    // 查找包含"序号"和"姓名"的表头行
    const rowText = row.join('')
    if (rowText.includes('序号') && rowText.includes('姓名')) {
      headerRowIndex = i
      dataStartIndex = i + 1
      break
    }
  }
  
  if (headerRowIndex === -1) {
    message.warning('未找到表头行，请确保Excel包含序号、姓名等列')
    return []
  }

  // 获取表头行，确定各列的索引位置
  const headerRow = rawData[headerRowIndex]
  const columnMap: Record<string, number> = {}
  
  // 建立列名到索引的映射
  headerRow.forEach((col: any, idx: number) => {
    if (col) {
      const colStr = col.toString().trim()
      if (colStr.includes('姓名')) columnMap.name = idx
      else if (colStr.includes('性别')) columnMap.sex = idx
      else if (colStr.includes('民族')) columnMap.nation = idx
      else if (colStr.includes('文化') || colStr.includes('学历')) columnMap.culture = idx
      else if (colStr.includes('出生年月')) columnMap.birthday = idx
      else if (colStr.includes('工作时间')) columnMap.job = idx
      else if (colStr.includes('入党时间')) columnMap.party = idx
      else if (colStr.includes('职务')) columnMap.position = idx
      else if (colStr.includes('职称')) columnMap.title = idx
      else if (colStr.includes('家庭住址') || colStr.includes('地址')) columnMap.address = idx
      else if (colStr.includes('困难') || colStr.includes('老党员')) columnMap.condition = idx
      else if (colStr.includes('班组') || colStr.includes('支部') || colStr.includes('小组')) columnMap.groups = idx
      else if (colStr.includes('调离') || colStr.includes('变动')) columnMap.transfer = idx
      else if (colStr.includes('备注')) columnMap.remark = idx
    }
  })
  
  // 检查必要字段是否存在
  if (columnMap.name === undefined) {
    message.warning('Excel必须包含"姓名"列')
    return []
  }
  
  console.log('列映射:', columnMap)

  const result: any[] = []
  
  // 遍历数据行
  for (let i = dataStartIndex; i < rawData.length; i++) {
    const row = rawData[i]
    if (!row || row.length === 0) continue
    
    // 获取序号，跳过空行
    const serialNum = row[0] ? row[0].toString().trim() : ''
    if (!serialNum || serialNum === '' || serialNum === '注：如是困难党员') break
    
    // 获取姓名
    const name = row[columnMap.name] ? row[columnMap.name].toString().trim() : ''
    if (!name || name === '') continue
    
    // 处理日期字段（Excel序列号转日期）
    let birthday = ''
    if (columnMap.birthday !== undefined && row[columnMap.birthday]) {
      const birthdayValue = row[columnMap.birthday]
      if (typeof birthdayValue === 'number') {
        birthday = excelSerialToDate(birthdayValue, 'YYYY-MM-DD')
      } else {
        birthday = birthdayValue.toString().trim()
      }
    }
    
    let job = ''
    if (columnMap.job !== undefined && row[columnMap.job]) {
      const jobValue = row[columnMap.job]
      if (typeof jobValue === 'number') {
        job = excelSerialToDate(jobValue, 'YYYY-MM-DD')
      } else {
        job = jobValue.toString().trim()
      }
    }
    
    let party = ''
    if (columnMap.party !== undefined && row[columnMap.party]) {
      const partyValue = row[columnMap.party]
      if (typeof partyValue === 'number') {
        party = excelSerialToDate(partyValue, 'YYYY-MM-DD')
      } else {
        party = partyValue.toString().trim()
      }
    }
    
    // 处理所在党小组（groups）- 对应"所在班组支部（小组）"列
    let groups = ''
    if (columnMap.groups !== undefined && row[columnMap.groups]) {
      groups = row[columnMap.groups].toString().trim()
    }
    
    // 构建党员对象
    const member: any = {
      name: name,
      sex: columnMap.sex !== undefined ? (row[columnMap.sex]?.toString().trim() || '') : '',
      nation: columnMap.nation !== undefined ? (row[columnMap.nation]?.toString().trim() || '') : '',
      culture: columnMap.culture !== undefined ? (row[columnMap.culture]?.toString().trim() || '') : '',
      birthday: birthday,
      job: job,
      party: party,
      position: columnMap.position !== undefined ? (row[columnMap.position]?.toString().trim() || '') : '',
      title: columnMap.title !== undefined ? (row[columnMap.title]?.toString().trim() || '') : '',
      address: columnMap.address !== undefined ? (row[columnMap.address]?.toString().trim() || '') : '',
      condition: columnMap.condition !== undefined ? (row[columnMap.condition]?.toString().trim() || '') : '',
      groups: groups,
      transfer: columnMap.transfer !== undefined ? (row[columnMap.transfer]?.toString().trim() || '') : '',
      remark: columnMap.remark !== undefined ? (row[columnMap.remark]?.toString().trim() || '') : ''
    }
    
    result.push(member)
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
      if (modalTitle === '新增党员') {
        const res = await addMemberApi(values)
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
        const res = await editMemberApi(submitData)
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
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '性别',
      dataIndex: 'sex',
      key: 'sex',
      width: 120,
    },
    {
      title: '民族',
      dataIndex: 'nation',
      key: 'nation',
      width: 120,
    },
    {
      title: '文化',
      dataIndex: 'culture',
      key: 'culture',
      width: 120,
    },
    {
      title: '出生年月',
      dataIndex: 'birthday',
      key: 'birthday',
      width: 150,
    },
    {
      title: '工作时间',
      dataIndex: 'job',
      key: 'job',
      width: 150,
    },
    {
      title: '入党时间',
      dataIndex: 'party',
      key: 'party',
      width: 150,
    },
    {
      title: '职务',
      dataIndex: 'position',
      key: 'position',
      width: 150,
    },
    {
      title: '职称',
      dataIndex: 'title',
      key: 'title',
      width: 150,
    },
    {
      title: '家庭住址',
      dataIndex: 'address',
      key: 'address',
      width: 200,
    },
    {
      title: '困难、老党员',
      dataIndex: 'condition',
      key: 'condition',
      width: 120,
    },
    {
      title: '所在党小组',
      dataIndex: 'groups',
      key: 'groups',
      width: 180,
    },
    {
      title: '调离本车间时间变动',
      dataIndex: 'transfer',
      key: 'transfer',
      width: 200,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
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
              const res = await delMemberApi(record.id as any)
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
      <FilterCard title="党员名册">
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
        >
          <Form.Item name="name" label="姓名">
            <Input placeholder="请输入姓名" allowClear autoComplete="off" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="condition" label="困难、老党员">
            <Input placeholder="请输入困难、老党员" allowClear autoComplete="off" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="groups" label="所在党小组">
            <Input placeholder="请输入所在党小组" allowClear autoComplete="off" style={{ width: 150 }} />
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
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="sex"
            label="性别"
            rules={[{ required: true, message: '请输入性别' }]}
          >
            <Input placeholder="请输入性别" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="nation"
            label="民族"
            rules={[{ required: true, message: '请输入民族' }]}
          >
            <Input placeholder="请输入民族" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="culture"
            label="文化"
            rules={[{ required: true, message: '请输入文化' }]}
          >
            <Input placeholder="请输入文化" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="birthday"
            label="出生年月"
            rules={[{ required: true, message: '请输入出生年月' }]}
          >
            <Input placeholder="请输入出生年月" autoComplete="off" /> 
          </Form.Item>

          <Form.Item
            name="job"
            label="工作时间"
            rules={[{ required: true, message: '请输入工作时间' }]}
          >
            <Input placeholder="请输入工作时间" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="party"
            label="入党时间"
            rules={[{ required: true, message: '请输入入党时间' }]}
          >
            <Input placeholder="请输入入党时间" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="position"
            label="职务"
            rules={[{ required: true, message: '请输入职务' }]}
          >
            <Input placeholder="请输入职务" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="title"
            label="职称"
            rules={[{ required: true, message: '请输入职称' }]}
          >
            <Input placeholder="请输入职称" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="address"
            label="家庭地址"
            rules={[{ required: true, message: '请输入家庭地址' }]}
          >
            <Input placeholder="请输入家庭地址" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="condition"
            label="困难、老党员"
            rules={[{ required: true, message: '请输入困难、老党员' }]}
          >
            <Input placeholder="请输入困难、老党员" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="groups"
            label="所在党小组"
            rules={[{ required: true, message: '请输入所在党小组' }]}
          >
            <Input placeholder="请输入所在党小组" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="transfer"
            label="调离本车间时间变动"
            rules={[{ required: true, message: '请输入调离本车间时间变动' }]}
          >
            <Input placeholder="请输入调离本车间时间变动" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="remark"
            label="备注"
            rules={[{ required: true, message: '请输入备注' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入备注" autoComplete="off" />
          </Form.Item>
        </Form>
      </Modal>
    </HomeContainer>
  )
}

export default PartyMember
