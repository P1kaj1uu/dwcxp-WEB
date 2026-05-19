import React, { useState, useEffect, useMemo } from "react";
import { Table, Form } from "antd";
import type { ColumnsType } from "antd/es/table";
import { getEvaluationListApi } from "@/api/evaluation";
import { getPartyBranchEvaluationListApi } from "@/api/partyBranchEvaluation";
import {
  dbgImage,
  dbqImage,
  hqqImage,
  jsgImage,
  jsqImage,
  xfgImage,
  siYouImage,
  bgImage,
  hbgIconImage,
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
  level: string;
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
        <img src={dbgImage} alt={value} style={{ width: 15, height: 15 }} />
        {value}
      </div>
    );
  }
  if (value === "达标区") {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={dbqImage} alt={value} style={{ width: 11, height: 11 }} />
        {value}
      </div>
    );
  }
  if (value === "红旗区") {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={hqqImage} alt={value} style={{ width: 11, height: 11 }} />
        {value}
      </div>
    );
  }
  if (value === "警示岗") {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={jsgImage} alt={value} style={{ width: 15, height: 15 }} />
        {value}
      </div>
    );
  }
  if (value === "警示区") {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={jsqImage} alt={value} style={{ width: 15, height: 15 }} />
        {value}
      </div>
    );
  }
  if (value === "先锋岗") {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={xfgImage} alt={value} style={{ width: 15, height: 15 }} />
        {value}
      </div>
    );
  }
  if (value === "四优") {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={siYouImage} alt={value} style={{ width: 15, height: 15 }} />
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
        <img src={hqqImage} alt={value} style={{ width: 15, height: 15 }} />
        {value}
      </div>
    );
  }
  if (value === "警示党小组") {
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={jsqImage} alt={value} style={{ width: 15, height: 15 }} />
        {value}
      </div>
    );
  }
  return value;
};

// 转换数据：将后端返回的数据转换为表格行数据（只包含当前季度）
const transformToTableData = (data: RawDataItem[]): TableRowData[] => {
  return data.map((item, index) => ({
    key: `${item.name}_${index}`,
    name: item.name,
    post: item.responsibilityPost || "",
    area: item.responsibilityArea || "",
    excellent: item.good || "",
  }));
};

// 转换党小组数据
const transformToPartyBranchData = (data: PartyBranchRawItem[]): PartyBranchRowData[] => {
  return data.map((item, index) => ({
    key: `${item.partyBranch}_${index}`,
    partyBranch: item.partyBranch,
    level: item.level || "",
  }));
};

// 生成表格列配置（只展示当前季度）
const generateColumns = (quarter: string): ColumnsType<TableRowData> => {
  const columns: ColumnsType<TableRowData> = [
    {
      title: "姓名",
      dataIndex: "name",
      key: "name",
      width: 100,
      fixed: "left",
    },
  ];

  // 当前季度的列
  columns.push({
    title: quarter,
    children: [
      {
        title: "岗",
        dataIndex: "post",
        key: "post",
        width: 100,
        render: (value: string) => getBadgeStyle(value),
      },
      {
        title: "区",
        dataIndex: "area",
        key: "area",
        width: 100,
        render: (value: string) => getBadgeStyle(value),
      },
      {
        title: "四优",
        dataIndex: "excellent",
        key: "excellent",
        width: 100,
        render: (value: string) =>
          value && value !== "否" && value !== "x" && value !== "X"
            ? getBadgeStyle("四优")
            : "-",
      },
    ],
  });

  return columns;
};

// 生成党小组表格列配置（显示等级level）
const generatePartyBranchEvaluationColumns = (quarter: string): ColumnsType<PartyBranchRowData> => {
  const columns: ColumnsType<PartyBranchRowData> = [
    {
      title: "党小组",
      dataIndex: "partyBranch",
      key: "partyBranch",
      width: 120,
      fixed: "left",
    },
    {
      title: quarter,
      dataIndex: "level",
      key: "level",
      width: 120,
      render: (value: string) => getPartyBranchLevelStyle(value),
    },
  ];

  return columns;
};

const Page2: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
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
      const values = form.getFieldsValue();
      const { year, quarter } = getCurrentYearAndQuarter();
      setCurrentQuarter(quarter);

      const queryParams = {
        pageNum: tableParams.pagination.current,
        pageSize: tableParams.pagination.pageSize,
        year: year,
        quarter: quarter,
        ...values,
        ...params,
      };

      const [res, res1] = await Promise.all([
        getEvaluationListApi(queryParams),
        getPartyBranchEvaluationListApi(queryParams)
      ]);

      if (res.data.code === 200) {
        setDataSource(res.data.data.list || []);
      }
      if (res1.data.code === 200) {
        setPartyBranchEvaluation(res1.data.data.list || []);
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

  // 将后端返回的数据转换为表格展示格式
  const tableData = useMemo(
    () => transformToTableData(dataSource),
    [dataSource],
  );

  // 党小组表格数据
  const partyBranchTableData = useMemo(
    () => transformToPartyBranchData(partyBranchEvaluation),
    [partyBranchEvaluation],
  );

  // 动态生成列配置
  const columns = useMemo(
    () => generateColumns(currentQuarter || "一季度"),
    [currentQuarter],
  );

  // 党小组评议表格列配置
  const partyBranchEvaluationColumns = useMemo(
    () => generatePartyBranchEvaluationColumns(currentQuarter || "一季度"),
    [currentQuarter],
  );

  return (
    <>
      {/* 创岗建区评比一览表 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* 标题图片 - 带黄色文字 */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16,
            flexShrink: 0,
          }}
        >
          <img
            src={hbgIconImage}
            alt="创岗建区评区一览表"
            style={{
              width: "auto",
              height: 50,
              objectFit: "contain",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "60%",
              left: "60%",
              transform: "translate(-50%, -50%)",
              fontSize: 18,
              fontWeight: "bold",
              color: "#fbbf24",
              textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
              whiteSpace: "nowrap",
              letterSpacing: 2,
            }}
          >
            创岗建区评区一览表
          </div>
        </div>

        <div
          className="flex-1 rounded-lg overflow-auto"
          style={{
            width: "720px",
            maxHeight: "430px",
            background:
              "linear-gradient(to right, #fbe5d3, #fefceb, #fef1de, #f3d4c7)",
            padding: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              // background: "#fff",
              borderRadius: 12,
              overflow: "auto",
            }}
          >
            <Table
              columns={columns}
              dataSource={tableData}
              loading={loading}
              bordered
              pagination={false}
              scroll={{ x: "max-content" }}
              size="small"
            />
            <Table
              columns={partyBranchEvaluationColumns}
              dataSource={partyBranchTableData}
              loading={loading}
              bordered
              pagination={false}
              scroll={{ x: "max-content" }}
              size="small"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Page2;
