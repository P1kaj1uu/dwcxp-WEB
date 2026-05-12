import React, { useState, useEffect } from 'react'
import { Card, Table, Form, Button, Space, Input, Modal, message, Popconfirm, Upload, Tooltip } from 'antd'
import { SearchOutlined, ReloadOutlined, PlusOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons'
import { getGroupListApi, addGroupApi, delGroupApi, editGroupApi, batchAddGroupApi } from '@/api/groups'
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

const PartyGroup: React.FC = () => {
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
  const [modalTitle, setModalTitle] = useState('新增党小组信息')
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

      const res = await getGroupListApi(queryParams)

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
    setModalTitle('新增党小组信息')
    setIsModalVisible(true)
  }

  // 打开编辑弹窗
  const handleEditModal = (record: any) => {
    setEditId(record.id as any)
    setModalTitle('编辑党小组信息')
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
    window.open('/doc/所属党小组设置情况.xlsx', '_blank')
  }

  // 批量上传处理
  const handleBatchUpload = async (file: File) => {
    const fileName = file.name
    const fileExt = fileName.split('.').pop()?.toLowerCase()
    
    if (fileExt !== 'xlsx' && fileExt !== 'xls') {
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
    
      // 解析党小组数据
      const parsedData = parseExcelData(rawData)
      console.log('解析后的数据:', parsedData)
      
      if (parsedData.length !== 0) {
        const res = await batchAddGroupApi(parsedData)
        if (res.data.code === 200) {
          message.success(`批量新增成功，共导入 ${parsedData.length} 条数据`)
          fetchTableData()
        } else {
          message.error('批量新增失败，请稍后重试')
        }
      } else {
        message.warning('未解析到有效数据，请检查Excel格式是否正确')
      }
    }
    reader.onerror = () => {
      message.error('读取文件失败')
    }
    return false
  }

  // 解析党小组Excel数据
  const parseExcelData = (rawData: any[][]): any[] => {
    if (!rawData || rawData.length < 2) {
      message.warning('Excel 文件格式不正确，至少需要表头行和数据行')
      return []
    }

    // 查找表头行（包含"党小组名称"的行）
    let headerRowIndex = -1
    let headerRow: any[] = []
    
    for (let i = 0; i < Math.min(rawData.length, 10); i++) {
      const row = rawData[i]
      if (row && row.length > 0) {
        const hasGroupName = row.some(cell => 
          cell && cell.toString().includes('党小组名称')
        )
        if (hasGroupName) {
          headerRowIndex = i
          headerRow = row
          break
        }
      }
    }

    if (headerRowIndex === -1) {
      message.warning('未找到表头行，请确保Excel包含"党小组名称"列')
      return []
    }

    // 建立列索引映射
    const columnMap: Record<string, number> = {
      groupName: -1,      // 党小组名称
      groupLeader: -1,    // 党小组长
      deputySecretary: -1,// 副书记(含挂职)
      organizationMember: -1, // 组织委员
      propagandaMember: -1,   // 宣传委员
      partyMemberCount: -1,   // 党员数
      employeeCount: -1,      // 职工数
      coverTeams: -1,         // 覆盖班组名称
      noPartyTeams: -1,       // 无党员班组名称
    }

    headerRow.forEach((cell, idx) => {
      const cellStr = cell ? cell.toString().trim() : ''
      if (cellStr.includes('党小组名称') || cellStr === '党小组名称') {
        columnMap.groupName = idx
      } else if (cellStr.includes('党小组长') || cellStr === '党小组长') {
        columnMap.groupLeader = idx
      } else if (cellStr.includes('副书记') || cellStr === '副书记(含挂职)') {
        columnMap.deputySecretary = idx
      } else if (cellStr.includes('组织委员') || cellStr === '组织委员') {
        columnMap.organizationMember = idx
      } else if (cellStr.includes('宣传委员') || cellStr === '宣传委员') {
        columnMap.propagandaMember = idx
      } else if (cellStr.includes('党员数') || cellStr === '党员数') {
        columnMap.partyMemberCount = idx
      } else if (cellStr.includes('职工数') || cellStr === '职工数') {
        columnMap.employeeCount = idx
      } else if (cellStr.includes('覆盖班组') || cellStr === '覆盖班组名称') {
        columnMap.coverTeams = idx
      } else if (cellStr.includes('无党员班组') || cellStr === '无党员班组名称') {
        columnMap.noPartyTeams = idx
      }
    })

    // 检查必要的列是否存在
    if (columnMap.groupName === -1) {
      message.warning('Excel必须包含"党小组名称"列')
      return []
    }

    const result: any[] = []
    
    // 从表头下一行开始解析数据
    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const row = rawData[i]
      if (!row || row.length === 0) continue
      
      // 获取党小组名称
      let groupName = ''
      if (columnMap.groupName !== -1 && row[columnMap.groupName]) {
        groupName = row[columnMap.groupName].toString().trim()
      }
      
      // 跳过空行或序号行
      if (!groupName || groupName === '' || groupName === '序号' || /^[\d]+$/.test(groupName)) {
        // 如果只是纯数字，可能是序号，继续检查其他字段
        if (groupName && /^[\d]+$/.test(groupName)) {
          // 尝试从其他列获取数据
          if (columnMap.groupLeader !== -1 && row[columnMap.groupLeader]) {
            // 有数据，继续处理
          } else {
            continue
          }
        } else {
          continue
        }
      }

      // 获取各字段值
      const getCellValue = (index: number): string => {
        if (index !== -1 && row[index] && row[index].toString().trim() !== '') {
          return row[index].toString().trim()
        }
        return ''
      }

      // 处理党员数和职工数（转为数字）
      let partyMemberCount = getCellValue(columnMap.partyMemberCount)
      let employeeCount = getCellValue(columnMap.employeeCount)
      
      // 如果党小组名称是数字且其他字段为空，则跳过
      if (/^[\d]+$/.test(groupName) && !getCellValue(columnMap.groupLeader) && !getCellValue(columnMap.coverTeams)) {
        continue
      }

      const record: any = {
        party: groupName,                    // 党小组名称
        name: getCellValue(columnMap.groupLeader),  // 党小组长
        fushuji: getCellValue(columnMap.deputySecretary),     // 副书记(含挂职)
        zuzhi: getCellValue(columnMap.organizationMember),    // 组织委员
        xuanchuan: getCellValue(columnMap.propagandaMember),  // 宣传委员
        counts: partyMemberCount ? parseInt(partyMemberCount) || 0 : 0,  // 党员数
        jobs: employeeCount ? parseInt(employeeCount) || 0 : 0,          // 职工数
        name1: getCellValue(columnMap.coverTeams),       // 覆盖班组名称
        name2: getCellValue(columnMap.noPartyTeams),     // 无党员班组名称
      }

      result.push(record)
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
      if (modalTitle === '新增党小组信息') {
        const res = await addGroupApi(values)
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
        const res = await editGroupApi(submitData)
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
      title: '党小组名称',
      dataIndex: 'party',
      key: 'party',
      width: 180,
    },
    {
      title: '党小组长',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '副书记（含挂职）',
      dataIndex: 'fushuji',
      key: 'fushuji',
      width: 150,
    },
    {
      title: '组织委员',
      dataIndex: 'zuzhi',
      key: 'zuzhi',
      width: 120,
    },
    {
      title: '宣传委员',
      dataIndex: 'xuanchuan',
      key: 'xuanchuan',
      width: 120,
    },
    {
      title: '党员数',
      dataIndex: 'counts',
      key: 'counts',
      width: 120,
    },
    {
      title: '职工数',
      dataIndex: 'jobs',
      key: 'jobs',
      width: 120,
    },
    {
      title: '覆盖班组数',
      dataIndex: 'name1',
      key: 'name1',
      width: 180,
    },
    {
      title: '无党员班组名称',
      dataIndex: 'name2',
      key: 'name2',
      width: 180,
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
              const res = await delGroupApi(record.id as any)
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
      <FilterCard title="所属党小组设置情况">
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
        >
          <Form.Item name="party" label="党小组名称">
            <Input placeholder="请输入党小组名称" allowClear autoComplete="off" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="name" label="党小组长">
            <Input placeholder="请输入党小组长" allowClear autoComplete="off" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="name1" label="覆盖班组名称">
            <Input placeholder="请输入覆盖班组名称" allowClear autoComplete="off" style={{ width: 150 }} />
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
            name="party"
            label="党小组名称"
            rules={[{ required: true, message: '请输入党小组名称' }]}
          >
            <Input placeholder="请输入党小组名称" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="name"
            label="党小组长"
            rules={[{ required: true, message: '请输入党小组长' }]}
          >
            <Input placeholder="请输入党小组长" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="fushuji"
            label="副书记(含挂职)"
            rules={[{ required: true, message: '请输入副书记(含挂职)姓名' }]}
          >
            <Input placeholder="请输入副书记(含挂职)姓名" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="zuzhi"
            label="组织委员"
            rules={[{ required: true, message: '请输入组织委员姓名' }]}
          >
            <Input placeholder="请输入组织委员姓名" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="xuanchuan"
            label="宣传委员"
            rules={[{ required: true, message: '请输入宣传委员姓名' }]}
          >
            <Input placeholder="请输入宣传委员姓名" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="counts"
            label="党员数量"
            rules={[{ required: true, message: '请输入党员数量' }]}
          >
            <Input placeholder="请输入党员数量" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="jobs"
            label="职工数"
            rules={[{ required: true, message: '请输入职工数' }]}
          >
            <Input placeholder="请输入职工数" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="name1"
            label="覆盖班组名称"
            rules={[{ required: true, message: '请输入覆盖班组名称' }]}
          >
            <Input placeholder="请输入覆盖班组名称" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="name2"
            label="无党员班组名称"
            rules={[{ required: true, message: '请输入无党员班组名称' }]}
          >
            <Input placeholder="请输入无党员班组名称" autoComplete="off" />
          </Form.Item>
        </Form>
      </Modal>
    </HomeContainer>
  )
}

export default PartyGroup
