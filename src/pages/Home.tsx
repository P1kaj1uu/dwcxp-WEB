import React, { useState, useEffect, useMemo } from "react";
import { Table, Form } from "antd";
import type { ColumnsType } from "antd/es/table";
import { getEvaluationListApi } from "@/api/evaluation";
import { getPdfListApi } from "@/api/pdf";
import {
  dbgImage,
  dbqImage,
  hqqImage,
  jsgImage,
  jsqImage,
  xfgImage,
  siYouImage,
  bgImage,
} from "@/utils/images";
import PDFCarousel from "@/components/PDFCarousel";

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

const Home: React.FC = () => {
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
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({
    重点工作: "",
    党务公开: "",
    光荣榜: "",
    党风廉政: "",
    组织生活: "",
  });
  // 基本情况mock数据
  // @ts-ignore
  const [basicInfo, setBasicInfo] = useState([
    {
      title: "党支部委员会",
      content: [
        {
          avatar: "https://randomuser.me/api/portraits/men/1.jpg",
          name: "张三",
          post: "先锋岗",
        },
        {
          avatar: "https://randomuser.me/api/portraits/men/1.jpg",
          name: "张三",
          post: "先锋岗",
        },
        {
          avatar: "https://randomuser.me/api/portraits/men/1.jpg",
          name: "张三",
          post: "先锋岗",
        },
        {
          avatar: "https://randomuser.me/api/portraits/men/1.jpg",
          name: "张三",
          post: "先锋岗",
        },
        {
          avatar: "https://randomuser.me/api/portraits/men/1.jpg",
          name: "张三",
          post: "先锋岗",
        },
      ],
    },
    {
      title: "车间分会委员会",
      content: [
        {
          avatar: "https://randomuser.me/api/portraits/men/1.jpg",
          name: "张三",
          post: "先锋岗",
        },
        {
          avatar: "https://randomuser.me/api/portraits/men/1.jpg",
          name: "张三",
          post: "先锋岗",
        },
        {
          avatar: "https://randomuser.me/api/portraits/men/1.jpg",
          name: "张三",
          post: "先锋岗",
        },
        {
          avatar: "https://randomuser.me/api/portraits/men/1.jpg",
          name: "张三",
          post: "先锋岗",
        },
        {
          avatar: "https://randomuser.me/api/portraits/men/1.jpg",
          name: "张三",
          post: "先锋岗",
        },
      ],
    },
    {
      title: "团支部委员会",
      content: [
        {
          avatar: "https://randomuser.me/api/portraits/men/1.jpg",
          name: "张三",
          post: "先锋岗",
        },
        {
          avatar: "https://randomuser.me/api/portraits/men/1.jpg",
          name: "张三",
          post: "先锋岗",
        },
        {
          avatar: "https://randomuser.me/api/portraits/men/1.jpg",
          name: "张三",
          post: "先锋岗",
        },
      ],
    },
  ]);

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

  // 获取 PDF 文件列表
  const fetchPdfUrls = async () => {
    const categories = ["重点工作", "党务公开", "党风廉政", "光荣榜", "组织生活"];
    const newPdfUrls: Record<string, string> = {};

    for (const category of categories) {
      try {
        const res = await getPdfListApi({ type: category });
        if (
          res.data.code === 200 &&
          res.data.data &&
          res.data.data.length > 0
        ) {
          const file = res.data.data[0];
          // 将 Base64 转换为 data URL 格式供 react-pdf 使用
          if (file.fileContent) {
            newPdfUrls[category] =
              `data:application/pdf;base64,${file.fileContent}`;
          }
        }
      } catch (error) {
        console.error(`获取${category} PDF失败:`, error);
      }
    }

    setPdfUrls((prev) => ({ ...prev, ...newPdfUrls }));
  };

  useEffect(() => {
    fetchPdfUrls();
  }, []);

  // 将后端返回的扁平数据转换为表格展示格式
  const tableData = useMemo(
    () => transformToTableData(dataSource),
    [dataSource],
  );
  const columns = useMemo(() => generateColumns(), []);

  return (
    <div
      style={{
        padding: 24,
        background: `url(${bgImage})`,
        backgroundSize: "cover",
        minHeight: "100vh",
      }}
    >
      <h2
        style={{
          marginBottom: 16,
          fontSize: 32,
          fontWeight: "bold",
          paddingLeft: 10,
          textAlign: "center",
          color: "#f9ae5f",
          textShadow:
            "1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff",
        }}
      >
        XXXX车间党支部、分会、团支部工作揭示栏
      </h2>

      <div
        className="w-full rounded-lg p-4 flex gap-4"
        style={{
          backgroundColor: "rgba(224, 76, 62, 0.6)",
          height: "calc(100vh - 120px)", // 使用固定高度而不是 minHeight
        }}
      >
        {/* 左边 - 基本情况 */}
        <div
          className="flex-[28%] flex flex-col"
          style={{ minWidth: 0, height: "100%" }}
        >
          <div className="mb-2 text-center text-md font-bold text-yellow-400">
            基本情况
          </div>
          <div
            className="p-4 flex-1 rounded-lg flex flex-col overflow-auto"
            style={{
              backgroundColor: "rgba(250, 218, 204, 0.6)",
              minHeight: 0,
            }}
          >
            {basicInfo.map((item, index) => (
              <div key={index} className="mb-4 last:mb-0">
                <div className="text-md font-bold text-red-600 text-center mb-3">
                  {item.title}
                </div>
                {/* 修改点：改为 flex-nowrap 不换行，overflow-auto 支持横向滚动 */}
                <div className="flex flex-nowrap justify-start gap-2 overflow-x-auto pb-2">
                  {item.content.map((member, idx) => (
                    <div
                      key={idx}
                      className="flex-shrink-0 min-w-[80px] flex flex-col items-center border border-gray-300 rounded-lg p-2 bg-white/50"
                      style={{ width: 85 }}
                    >
                      <img
                        src={member.avatar}
                        alt={member.name}
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: "50%",
                          marginBottom: 8,
                          objectFit: "cover",
                        }}
                      />
                      <div className="text-[10px] mb-[2px] text-center">
                        姓名：{member.name}
                      </div>
                      <div className="text-[10px] text-center">
                        职务：{member.post}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 中间区域 - 严格上下各占50% */}
        <div
          className="flex-[42%] flex flex-col"
          style={{ minWidth: 0, height: "100%" }}
        >
          {/* 上半部分 - 入党誓词，严格占50%高度 */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              className="p-4"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                className="text-[24px] font-bold text-center mb-3"
                style={{
                  color: "#f7bd54",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                  letterSpacing: "1px",
                }}
              >
                入党誓词
              </div>
              <div
                style={{
                  textIndent: "2em",
                  overflow: "auto",
                  color: "#f7bd54",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                  letterSpacing: "1px",
                  fontSize: "20px",
                  lineHeight: 1.8,
                  textAlign: "justify",
                  fontWeight: 500,
                  // 字体平滑渲染（关键！）
                  WebkitFontSmoothing: "antialiased",
                  MozOsxFontSmoothing: "grayscale",
                  textRendering: "optimizeLegibility",
                }}
                className="leading-relaxed flex-1"
              >
                我志愿加入中国共产党，拥护党的纲领，遵守党的章程，履行党员义务，执行党的决定，严守党的纪律，保守党的秘密，对党忠诚，积极工作，为共产主义奋斗终身，随时准备为党和人民牺牲一切，永不叛党。
              </div>
            </div>
          </div>

          {/* 下半部分 - PDF 卡片，严格占50%高度 */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              marginTop: 16,
            }}
          >
            <div className="flex gap-3 h-full">
              <div
                className="flex-1 min-w-0 rounded-lg relative"
                style={{
                  border: "3px solid #fefefe",
                  borderRadius: 12,
                  background: "rgba(250, 218, 204, 0.6)",
                }}
              >
                <PDFCarousel
                  pdfUrl={pdfUrls["重点工作"]}
                  title="重点工作"
                  headerColor="#E74C3C"
                />
              </div>
              <div
                className="flex-1 min-w-0 rounded-lg relative"
                style={{
                  border: "3px solid #fefefe",
                  borderRadius: 12,
                  background: "rgba(250, 218, 204, 0.6)",
                }}
              >
                <PDFCarousel
                  pdfUrl={pdfUrls["党务公开"]}
                  title="党务公开"
                  headerColor="#E74C3C"
                />
              </div>
              <div
                className="flex-1 min-w-0 rounded-lg relative"
                style={{
                  border: "3px solid #fefefe",
                  borderRadius: 12,
                  background: "rgba(250, 218, 204, 0.6)",
                }}
              >
                <PDFCarousel
                  pdfUrl={pdfUrls["党务公开"]}
                  title="光荣榜"
                  headerColor="#E74C3C"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 右边区域 */}
        <div
          className="flex-[30%] flex flex-col gap-4"
          style={{ minWidth: 0, height: "100%" }}
        >
          {/* 上半部分 - 创岗建区评比一览表 */}
          <div className="flex flex-col" style={{ minWidth: 0, minHeight: 0 }}>
            <div className="mb-2 text-center text-md font-bold text-yellow-400">
              创岗建区评比一览表
            </div>
            <div
              className="flex-1 rounded-lg overflow-auto"
              style={{
                background: "rgba(250, 218, 204, 0.6)",
                padding: "12px",
                minHeight: 0,
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

          {/* 下半部分 - 组织生活和活动风采 */}
          <div
            className="mt-[16px] flex-[40%] flex flex-col"
            style={{ minWidth: 0, minHeight: 0 }}
          >
            <div className="flex-1 flex gap-3" style={{ minHeight: 0 }}>
              <div
                className="flex-1 min-w-0 rounded-lg relative"
                style={{
                  border: "3px solid #fefefe",
                  borderRadius: 12,
                  background: "rgba(250, 218, 204, 0.6)",
                }}
              >
                <PDFCarousel
                  pdfUrl={pdfUrls["党务公开"]}
                  title="组织生活"
                  headerColor="#E74C3C"
                />
              </div>
              <div
                className="flex-1 min-w-0 rounded-lg relative"
                style={{
                  border: "3px solid #fefefe",
                  borderRadius: 12,
                  background: "rgba(250, 218, 204, 0.6)",
                }}
              >
                <PDFCarousel
                  pdfUrl={pdfUrls["党务公开"]}
                  title="活动风采"
                  headerColor="#E74C3C"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
