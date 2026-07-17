import React, { useState, useEffect } from 'react'
import { Card, Table, Form, Select, Button, Space, Input, Modal, message, Popconfirm } from 'antd'
import { SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons'
import { getPartyBranchEvaluationListApi, addPartyBranchEvaluationApi, deletePartyBranchEvaluationByIdApi, editPartyBranchEvaluationByIdApi } from '@/api/partyBranchEvaluation'
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

const PartyBranchEvaluation: React.FC = () => {
  const [form] = Form.useForm()
  const [addForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<any[]>([])
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
  })
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [modalTitle, setModalTitle] = useState('新增党小组评议信息')
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

      const res = await getPartyBranchEvaluationListApi(queryParams)

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
    setModalTitle('新增党小组评议信息')
    setIsModalVisible(true)
  }

  // 打开编辑弹窗
  const handleEditModal = (record: any) => {
    let data = {
      ...record,
      good: (record.good && record.good !== '否') ? '是' : '否',
    }
    setEditId(record.id as any)
    setModalTitle('编辑党小组评议信息')
    addForm.setFieldsValue(data)
    setIsModalVisible(true)
  }

  // 关闭弹窗
  const handleCancelModal = () => {
    setEditId(null)
    setIsModalVisible(false)
    addForm.resetFields()
  }

  // 提交新增/编辑表单
  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validateFields()
      if (modalTitle === '新增党小组评议信息') {
        const res = await addPartyBranchEvaluationApi(values)
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
        const res = await editPartyBranchEvaluationByIdApi(submitData)
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
      title: '年度',
      dataIndex: 'year',
      key: 'year',
      width: 150,
    },
    {
      title: '季度',
      dataIndex: 'quarter',
      key: 'quarter',
      width: 150,
    },
    {
      title: '党组织（党小组）',
      dataIndex: 'partyBranch',
      key: 'partyBranch',
      width: 200,
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 200,
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
              const res = await deletePartyBranchEvaluationByIdApi(record.id as any)
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
      <FilterCard title="党小组评议管理">
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
        >
          <Form.Item name="partyBranch" label="党小组">
            <Input placeholder="请输入党小组名称" allowClear autoComplete="off" style={{ width: 150 }} />
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
                新增
              </Button>
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
            <Input placeholder="请输入年度，如：2026" autoComplete="off" />
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
            name="level"
            label="等级"
            rules={[{ required: true, message: '请输入等级' }]}
          >
            <Input placeholder="请输入等级" autoComplete="off" />
          </Form.Item>
        </Form>
      </Modal>
    </HomeContainer>
  )
}

export default PartyBranchEvaluation
