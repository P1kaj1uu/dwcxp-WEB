import React, { useState, useEffect, useMemo } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { getEvaluationListApi } from "@/api/evaluation";
import { getEvaluationResultList } from "@/api/evaluationResult";
import { getPartyBranchEvaluationListApi } from "@/api/partyBranchEvaluation";
import {
  dbgImage,
  dbqImage,
  hqqImage,
  jsgImage,
  jsqImage,
  xfgImage,
  siYouImage,
  hbgIconImage,
  myImage,
} from "@/utils/images";

interface TableRowData {
  key: string;
  name: string;
  post: string;
  area: string;
  excellent: string;
}

interface PartyBranchRowData {
  key: string;
  partyBranch: string;
  one: string;
  two: string;
  three: string;
  four: string;
  years: string;
}

interface RawDataItem {
  id: number;
  year: string;
  quarter: string;
  partyBranch: string;
  name: string;
  responsibilityPost: string;
  responsibilityArea: string;
  comments: string;
  good?: string;
}

interface PartyBranchRawItem {
  id: number;
  year: string;
  quarter: string;
  partyBranch: string;
  level: string;
}

// 获取徽章样式
const getBadgeStyle = (value: string) => {
  if (!value) return "-";
  if (value === "达标岗") {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={dbgImage} alt={value} style={{ width: '0.9375rem', height: '0.9375rem' }} />
        {value}
      </div>
    );
  }
  if (value === "达标区") {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={dbqImage} alt={value} style={{ width: '0.6875rem', height: '0.6875rem' }} />
        {value}
      </div>
    );
  }
  if (value === "红旗区") {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={hqqImage} alt={value} style={{ width: '0.6875rem', height: '0.6875rem' }} />
        {value}
      </div>
    );
  }
  if (value === "警示岗") {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={jsgImage} alt={value} style={{ width: '0.9375rem', height: '0.9375rem' }} />
        {value}
      </div>
    );
  }
  if (value === "警示区") {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={jsqImage} alt={value} style={{ width: '0.9375rem', height: '0.9375rem' }} />
        {value}
      </div>
    );
  }
  if (value === "先锋岗") {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={xfgImage} alt={value} style={{ width: '0.9375rem', height: '0.9375rem' }} />
        {value}
      </div>
    );
  }
  if (value === "四优") {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={siYouImage} alt={value} style={{ width: '0.9375rem', height: '0.9375rem' }} />
      </div>
    );
  }
  return value;
};

// 获取党小组等级徽章样式
const getPartyBranchLevelStyle = (value: string) => {
  if (!value) return "-";
  if (value === "红旗党小组") {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={hqqImage} alt={value} style={{ width: '0.9375rem', height: '0.9375rem' }} />
        {value}
      </div>
    );
  }
  if (value === "警示党小组") {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={jsqImage} alt={value} style={{ width: '0.9375rem', height: '0.9375rem' }} />
        {value}
      </div>
    );
  }
  return value;
};

// 转换数据：将后端返回的数据转换为表格行数据（只包含当前季度）
const transformToTableData = (data: RawDataItem[]): TableRowData[] => {
  return data.map((item, index) => ({
    key: `${item.name}_${item.id || index}`,
    name: item.name,
    post: item.responsibilityPost || "",
    area: item.responsibilityArea || "",
    excellent: item.good || "",
  }));
};

// 转换党小组数据：将后端返回的数据按党小组和季度进行透视
const transformToPartyBranchData = (data: PartyBranchRawItem[]): PartyBranchRowData[] => {
  const groupedData: { [key: string]: PartyBranchRowData } = {};
  
  data.forEach((item) => {
    if (!groupedData[item.partyBranch]) {
      groupedData[item.partyBranch] = {
        key: item.partyBranch,
        partyBranch: item.partyBranch,
        one: "-",
        two: "-",
        three: "-",
        four: "-",
        years: "-",
      };
    }
    
    const quarter = item.quarter;
    const level = item.level || "-";
    
    if (quarter === "一季度") {
      groupedData[item.partyBranch].one = level;
    } else if (quarter === "二季度") {
      groupedData[item.partyBranch].two = level;
    } else if (quarter === "三季度") {
      groupedData[item.partyBranch].three = level;
    } else if (quarter === "四季度") {
      groupedData[item.partyBranch].four = level;
    }
  });
  
  return Object.values(groupedData);
};

// 生成表格列配置（只展示当前季度）
const generateColumns = (quarter: string): ColumnsType<TableRowData> => {
  const columns: ColumnsType<TableRowData> = [
    {
      title: "姓名",
      dataIndex: "name",
      key: "name",
      width: '6.25rem',
      fixed: "left",
    },
  ];

  columns.push({
    title: quarter,
    children: [
      {
        title: "岗",
        dataIndex: "post",
        key: "post",
        width: '6.25rem',
        render: (value: string) => getBadgeStyle(value),
      },
      {
        title: "区",
        dataIndex: "area",
        key: "area",
        width: '6.25rem',
        render: (value: string) => getBadgeStyle(value),
      },
      {
        title: "四优",
        dataIndex: "excellent",
        key: "excellent",
        width: '6.25rem',
        render: (value: string) =>
          value && value !== "否" && value !== "x" && value !== "X"
            ? getBadgeStyle("四优")
            : "-",
      },
    ],
  });

  return columns;
};

// 表头红色背景样式
// @ts-ignore
const tableHeaderStyle = {
  background: '#ff0000',
  color: '#ffffff',
};

const evaluationColumns = [
  {
    title: "一季度",
    dataIndex: "one",
    key: "one",
  },
  {
    title: "二季度",
    dataIndex: "two",
    key: "two",
  },
  {
    title: "三季度",
    dataIndex: "three",
    key: "three",
  },
  {
    title: "四季度",
    dataIndex: "four",
    key: "four",
  },
  {
    title: "上年度",
    dataIndex: "years",
    key: "years",
  },
];

const Page2: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<any[]>([]);
  const [dataSource, setDataSource] = useState<RawDataItem[]>([]);
  const [partyBranchEvaluation, setPartyBranchEvaluation] = useState<PartyBranchRawItem[]>([]);
  const [currentQuarter, setCurrentQuarter] = useState<string>("");
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
  });

  // 获取当前年份和当前季度
  const getCurrentYearAndQuarter = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    let quarter = "";
    if (month >= 1 && month <= 3) quarter = "一季度";
    else if (month >= 4 && month <= 6) quarter = "二季度";
    else if (month >= 7 && month <= 9) quarter = "三季度";
    else quarter = "四季度";

    return { year, quarter };
  };

  // 获取表格数据
  const fetchTableData = async (params?: any) => {
    setLoading(true);
    try {
      const { year, quarter } = getCurrentYearAndQuarter();
      setCurrentQuarter(quarter);

      const queryParams = {
        pageNum: tableParams.pagination.current,
        pageSize: tableParams.pagination.pageSize,
        year: year,
        quarter: quarter,
        ...params,
      };

      const queryEvaluationParams = {
        pageNum: 1,
        pageSize: 6,
        year: year,
        // quarter: quarter,
        ...params,
      };

      const queryNotQuarterParams = {
        pageNum: tableParams.pagination.current,
        pageSize: tableParams.pagination.pageSize,
        year: year,
        ...params,
      };

      const [res, res1, res2] = await Promise.all([
        getEvaluationListApi(queryEvaluationParams),
        getPartyBranchEvaluationListApi(queryNotQuarterParams),
        getEvaluationResultList(queryParams)
      ]);

      if (res.data.code === 200) {
        setDataSource(res.data.data.list || []);
      }
      if (res1.data.code === 200) {
        console.log(res1.data.data.list);
        setPartyBranchEvaluation(res1.data.data.list || []);
      }
      if (res2.data.code === 200) {
        setEvaluationResults(res2.data.data.list || []);
      }
      setTableParams({
        ...tableParams,
        pagination: {
          ...tableParams.pagination,
          total: res.data.data.total || 0,
        },
      });
    } catch (error) {
      setDataSource([]);
      setPartyBranchEvaluation([]);
      setEvaluationResults([]);
      console.error("获取数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tableParams.pagination.current) {
      fetchTableData();
    }
  }, [tableParams.pagination.current, tableParams.pagination.pageSize]);

  // @ts-ignore
  const tableData = useMemo(
    () => transformToTableData(dataSource),
    [dataSource],
  );

  const partyBranchTableData = useMemo(
    () => transformToPartyBranchData(partyBranchEvaluation),
    [partyBranchEvaluation],
  );

  // @ts-ignore
  const columns = useMemo(
    () => generateColumns(currentQuarter || "一季度"),
    [currentQuarter],
  );

  // 光荣榜数据：最多 6 个，从 dataSource 取
  const honorBoard = useMemo(() => dataSource.slice(0, 6), [dataSource]);

  // 为列添加表头样式
  const styledEvaluationColumns = evaluationColumns.map(col => ({
    ...col,
    title: <span style={{ color: '#ffffff' }}>{col.title}</span>,
  }));

  const styledPartyBranchColumns: ColumnsType<PartyBranchRowData> = [
    {
      title: <span style={{ color: '#ffffff' }}>党小组名称</span>,
      dataIndex: "partyBranch",
      key: "partyBranch",
      width: '6rem',
    },
    {
      title: <span style={{ color: '#ffffff' }}>一季度</span>,
      dataIndex: "one",
      key: "one",
      width: '3.125rem',
      render: (value: string) => getPartyBranchLevelStyle(value),
    },
    {
      title: <span style={{ color: '#ffffff' }}>二季度</span>,
      dataIndex: "two",
      key: "two",
      width: '3.125rem',
      render: (value: string) => getPartyBranchLevelStyle(value),
    },
    {
      title: <span style={{ color: '#ffffff' }}>三季度</span>,
      dataIndex: "three",
      key: "three",
      width: '3.125rem',
      render: (value: string) => getPartyBranchLevelStyle(value),
    },
    {
      title: <span style={{ color: '#ffffff' }}>四季度</span>,
      dataIndex: "four",
      key: "four",
      width: '3.125rem',
      render: (value: string) => getPartyBranchLevelStyle(value),
    },
    {
      title: <span style={{ color: '#ffffff' }}>上年度</span>,
      dataIndex: "years",
      key: "years",
      width: '3.125rem',
      render: (value: string) => getPartyBranchLevelStyle(value),
    },
  ];

  return (
    <>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexShrink: 0,
            width: "100%",
            background: "#d92228",
          }}
        >
          <img
            src={hbgIconImage}
            alt="考核评比"
            style={{
              width: "100%",
              height: '2.75rem',
              objectFit: "contain",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "52%",
              transform: "translate(-50%, -50%)",
              fontSize: '1.375rem',
              fontWeight: "bold",
              color: "#fbbf24",
              textShadow: "0.0625rem 0.0625rem 0.125rem rgba(0,0,0,0.3)",
              whiteSpace: "nowrap",
              letterSpacing: '0.125rem',
            }}
          >
            考核评比
          </div>
        </div>

        <div
          className="flex-1"
          style={{
            width: "100%",
            flex: 1,
            minHeight: 0,
            background: "#fff",
            padding: '0.75rem',
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: '1.25rem',
              borderRadius: '0.75rem',
              alignItems: "flex-start",
            }}
          >
            {/* 左侧光荣榜区 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: '0.5rem',
              }}
            >
              {honorBoard.map((item) => (
                <div
                  key={item.id}
                  style={{
                    width: "100%",
                    overflow: "hidden",
                    background: "#fff",
                    borderRadius: 0,
                  }}
                >
                  <img
                    src={myImage}
                    alt={item.name}
                    style={{
                      width: "100%",
                      height: '5rem',
                      objectFit: "cover",
                      objectPosition: "50% 25%",
                      display: "block",
                    }}
                  />
                  <div
                    style={{
                      background: "#a73300",
                      color: "#ffffff",
                      textAlign: "center",
                      padding: '0.25rem',
                      fontWeight: "bold",
                      fontSize: '0.875rem',
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      padding: '0.25rem',
                      fontSize: '0.75rem',
                      lineHeight: 1.4,
                      color: "#333",
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    {item.responsibilityPost && (
                      <div style={{ display: "flex", alignItems: "center", gap: '0.25rem' }}>
                        <span style={{ display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center', color: "red", width: '0.6875rem', height: '0.6875rem' }}>★</span>
                        <span>{item.responsibilityPost}</span>
                      </div>
                    )}
                    {item.good && item.good !== "否" && item.good !== "x" && item.good !== "X" && (
                      <div style={{ display: "flex", alignItems: "center", gap: '0.25rem' }}>
                        <img src={siYouImage} alt="四优" style={{ width: '0.6875rem', height: '0.6875rem' }} />
                        <span>四优党员</span>
                      </div>
                    )}
                    {item.responsibilityArea && (
                      <div style={{ display: "flex", alignItems: "center", gap: '0.25rem' }}>
                        <img src={hqqImage} alt="红旗区" style={{ width: '0.6875rem', height: '0.6875rem' }} />
                        <span>{item.responsibilityArea}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 右侧考核结果区 */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: '0.5rem',
              }}
            >
              {/* 本支部考核结果 */}
              <div>
                <div style={{ fontWeight: "bold", marginBottom: '0.25rem', fontSize: '1rem', color: 'red', textAlign: 'center' }}>
                  本支部考核结果
                </div>
                <Table
                  columns={styledEvaluationColumns}
                  dataSource={evaluationResults}
                  loading={loading}
                  bordered
                  pagination={false}
                  scroll={{ x: "max-content" }}
                  size="small"
                  rowKey="id"
                  className="red-header-table"
                  style={{
                    width: "100%",
                    borderRadius: 0,
                  }}
                />
              </div>

              {/* 党小组考核结果 */}
              <div>
                <div style={{ fontWeight: "bold", marginBottom: '0.25rem', fontSize: '1rem', color: 'red', textAlign: 'center' }}>
                  党小组考核结果
                </div>
                <Table
                  columns={styledPartyBranchColumns}
                  dataSource={partyBranchTableData}
                  loading={loading}
                  bordered
                  pagination={false}
                  size="small"
                  rowKey="key"
                  className="red-header-table"
                  style={{
                    width: "100%",
                    tableLayout: "fixed",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 全局样式 - 设置表头背景为红色 */}
      <style>{`
        .red-header-table,
        .red-header-table .ant-table,
        .red-header-table .ant-table-container,
        .red-header-table .ant-table-content,
        .red-header-table .ant-table-header,
        .red-header-table .ant-table-thead,
        .red-header-table .ant-table-thead > tr,
        .red-header-table .ant-table-thead > tr > th {
          border-radius: 0 !important;
        }
        .red-header-table .ant-table-thead > tr > th {
          background: #a73300 !important;
          color: #ffffff !important;
          font-weight: bold;
          text-align: center;
          /* 表头文字也跟随 rem 缩放 */
          font-size: 0.875rem !important;
        }
        .red-header-table .ant-table-thead > tr > th .ant-table-column-title {
          color: #ffffff !important;
        }
        /* 如果有嵌套表头（子列），也应用红色背景 */
        .red-header-table .ant-table-thead > tr > th.ant-table-cell {
          background: #a73300 !important;
          color: #ffffff !important;
        }
        /* 表头悬停效果保持不变 */
        .red-header-table .ant-table-thead > tr > th:hover {
          background: #a73300 !important;
        }
        /* 表格内容文字也跟随 rem */
        .red-header-table .ant-table-tbody > tr > td {
          font-size: 0.8125rem !important;
        }
      `}</style>
    </>
  );
};

export default Page2;