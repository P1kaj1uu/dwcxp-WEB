import React, { useState, useEffect, useMemo } from "react";
import { Table, Form } from "antd";
import type { ColumnsType } from "antd/es/table";
import { getEvaluationListApi } from "@/api/evaluation";
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
  // 每个季度包含岗、区、四优三个字段
  q1_post: string;
  q1_area: string;
  q1_excellent: string;
  q2_post: string;
  q2_area: string;
  q2_excellent: string;
  q3_post: string;
  q3_area: string;
  q3_excellent: string;
  q4_post: string;
  q4_area: string;
  q4_excellent: string;
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

// 获取徽章样式
const getBadgeStyle = (value: string) => {
  if (!value) return "-";
  console.log(value);
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

// 转换数据：将后端返回的扁平数据转换为以姓名为主键的二维表格数据
const transformToTableData = (data: RawDataItem[]): TableRowData[] => {
  // 按姓名分组
  const groupedByName: Record<
    string,
    Record<string, { post: string; area: string; good: string }>
  > = {};

  data.forEach((item) => {
    if (!groupedByName[item.name]) {
      groupedByName[item.name] = {};
    }
    groupedByName[item.name][item.quarter] = {
      post: item.responsibilityPost,
      area: item.responsibilityArea,
      good: item.good || "", // 如果后端有返回四优字段
    };
  });

  // 转换为表格行数据
  return Object.entries(groupedByName).map(([name, quarters]) => ({
    key: name,
    name,
    q1_post: quarters["一季度"]?.post || "",
    q1_area: quarters["一季度"]?.area || "",
    q1_excellent: quarters["一季度"]?.good || "",
    q2_post: quarters["二季度"]?.post || "",
    q2_area: quarters["二季度"]?.area || "",
    q2_excellent: quarters["二季度"]?.good || "",
    q3_post: quarters["三季度"]?.post || "",
    q3_area: quarters["三季度"]?.area || "",
    q3_excellent: quarters["三季度"]?.good || "",
    q4_post: quarters["四季度"]?.post || "",
    q4_area: quarters["四季度"]?.area || "",
    q4_excellent: quarters["四季度"]?.good || "",
  }));
};

// 生成表格列配置
const generateColumns = (): ColumnsType<TableRowData> => {
  const quarters = ["一季度", "二季度", "三季度", "四季度"];
  const quarterMap: Record<
    string,
    { postKey: string; areaKey: string; excellentKey: string }
  > = {
    一季度: {
      postKey: "q1_post",
      areaKey: "q1_area",
      excellentKey: "q1_excellent",
    },
    二季度: {
      postKey: "q2_post",
      areaKey: "q2_area",
      excellentKey: "q2_excellent",
    },
    三季度: {
      postKey: "q3_post",
      areaKey: "q3_area",
      excellentKey: "q3_excellent",
    },
    四季度: {
      postKey: "q4_post",
      areaKey: "q4_area",
      excellentKey: "q4_excellent",
    },
  };

  const columns: ColumnsType<TableRowData> = [
    {
      title: "姓名",
      dataIndex: "name",
      key: "name",
      width: 100,
      fixed: "left",
    },
  ];

  quarters.forEach((quarter) => {
    const { postKey, areaKey, excellentKey } = quarterMap[quarter];
    columns.push({
      title: quarter,
      children: [
        {
          title: "岗",
          dataIndex: postKey,
          key: `${quarter}_post`,
          width: 100,
          render: (value: string) => getBadgeStyle(value),
        },
        {
          title: "区",
          dataIndex: areaKey,
          key: `${quarter}_area`,
          width: 100,
          render: (value: string) => getBadgeStyle(value),
        },
        {
          title: "四优",
          dataIndex: excellentKey,
          key: `${quarter}_excellent`,
          width: 100,
          render: (value: string) =>
            value && value !== "否" && value !== "x" && value !== "X"
              ? getBadgeStyle("四优")
              : "-",
        },
      ],
    });
  });

  return columns;
};

const Page2: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<RawDataItem[]>([]);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
  });

  // 获取表格数据
  const fetchTableData = async (params?: any) => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const queryParams = {
        pageNum: tableParams.pagination.current,
        pageSize: tableParams.pagination.pageSize,
        ...values,
        ...params,
      };

      const res = await getEvaluationListApi(queryParams);

      if (res.data.code === 200) {
        setDataSource(res.data.data.list || []);
        setTableParams({
          ...tableParams,
          pagination: {
            ...tableParams.pagination,
            total: res.data.data.total || 0,
          },
        });
      }
    } catch (error) {
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

  // 将后端返回的扁平数据转换为表格展示格式
  const tableData = useMemo(
    () => transformToTableData(dataSource),
    [dataSource],
  );
  const columns = useMemo(() => generateColumns(), []);

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
              background: "#fff",
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
          </div>
        </div>
      </div>
    </>
  );
};

export default Page2;
