import React, { useState, useEffect } from "react";
import { getBasicByTypeApi } from "@/api/basic";
import { getEvaluationResultList } from "@/api/evaluationResult";
import { getBasicInfoNumList } from "@/api/basicInfoNum";
import { hbgIconImage, bgImage } from "@/utils/images";
import { Skeleton } from "antd";

interface Member {
  id: number;
  name: string;
  position: string;
  type: string;
  photo: string | null;
}

interface GroupedData {
  title: string;
  content: Member[];
}

const Page1: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [groupedData, setGroupedData] = useState<GroupedData[]>([]);
  const [evaluationResults, setEvaluationResults] = useState<any[]>([]);
  // const [basicInfoNums, setBasicInfoNums] = useState<any[]>([]);

  const departmentOptions = [
    { label: "党支部委员会", value: "党支部委员会" },
    { label: "车间分会委员会", value: "车间分会委员会" },
    { label: "团支部委员会", value: "团支部委员会" },
  ];

  // 骨架屏显示状态
  const [showSkeleton, setShowSkeleton] = useState(true);

  const fetchEvaluationResults = async () => {
    setLoading(true);
    setShowSkeleton(true);
    try {
      const evaluationResultPromise = getEvaluationResultList({
        pageNum: 1,
        pageSize: 10,
      });
      const basicInfoNumPromise = getBasicInfoNumList({
        pageNum: 1,
        pageSize: 10,
      });
      // 并行调用两个接口，并合并结果
      Promise.all([evaluationResultPromise, basicInfoNumPromise]).then(
        (results) => {
          setEvaluationResults(results[0].data.data.list || []);
          // setBasicInfoNums(results[1].data.data.list || []);
        },
      );
    } catch (error) {
      console.error("获取考核结果和基本信息人员年龄等情况列表失败:", error);
      setEvaluationResults([]);
      // setBasicInfoNums([]);
    } finally {
      setLoading(false);
      setShowSkeleton(false);
    }
  };

  // 获取所有部门的数据
  const fetchAllData = async () => {
    setLoading(true);
    setShowSkeleton(true);
    try {
      // 并行调用三次接口
      const promises = departmentOptions.map((opt) =>
        getBasicByTypeApi(opt.value),
      );

      const results = await Promise.all(promises);

      // 合并所有数据
      const allMembers: Member[] = [];

      results.forEach((res, index) => {
        if (res.data.code === 200) {
          const data = res.data.data;
          // 处理不同的数据结构
          let members: Member[] = [];

          if (Array.isArray(data)) {
            // 如果 data 直接是数组
            members = data;
          } else if (data && typeof data === "object") {
            // 如果 data 是对象，尝试获取 list 或 records 字段
            if (Array.isArray(data.list)) {
              members = data.list;
            } else if (Array.isArray(data.records)) {
              members = data.records;
            } else if (Array.isArray(data.content)) {
              members = data.content;
            } else if (Array.isArray(data.items)) {
              members = data.items;
            } else {
              // 如果都不是，可能是单个对象
              members = [data];
            }
          }

          // 确保每个成员都有正确的 type（如果后端没返回，使用请求的部门）
          members = members.map((member) => ({
            ...member,
            type: member.type || departmentOptions[index].value,
          }));

          allMembers.push(...members);
        }
      });

      // 按部门分组
      const groups = groupByType(allMembers);
      setGroupedData(groups);
    } catch (error) {
      console.error("获取数据失败:", error);
    } finally {
      setLoading(false);
      // 延迟关闭骨架屏，让用户看到加载完成的效果
      setTimeout(() => {
        setShowSkeleton(false);
      }, 300);
    }
  };

  // 按部门分组
  const groupByType = (data: Member[]): GroupedData[] => {
    const groups: { [key: string]: Member[] } = {};

    // 按指定顺序排序
    const orderMap: { [key: string]: number } = {
      党支部委员会: 1,
      车间分会委员会: 2,
      团支部委员会: 3,
    };

    data.forEach((member) => {
      if (!groups[member.type]) {
        groups[member.type] = [];
      }
      groups[member.type].push(member);
    });

    // 按指定顺序返回
    return Object.keys(groups)
      .sort((a, b) => (orderMap[a] || 999) - (orderMap[b] || 999))
      .map((key) => ({
        title: key,
        content: groups[key],
      }));
  };

  // 获取图片URL（将Base64转为可显示的URL）
  const getPhotoUrl = (photo: string | null) => {
    if (!photo) {
      return "https://randomuser.me/api/portraits/men/default.jpg";
    }
    // 如果 photo 已经是完整的 data URL，直接返回
    if (photo.startsWith("data:image")) {
      return photo;
    }
    return `data:image/jpeg;base64,${photo}`;
  };

  // 渲染骨架屏内容
  const renderSkeletonContent = () => {
    return (
      <>
        {/* @ts-ignore */}
        {departmentOptions.map((dept, idx) => (
          <div key={idx} style={{ marginBottom: 24 }}>
            {/* 部门标题骨架 */}
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <Skeleton.Input
                active
                size="small"
                style={{ width: 120, height: 20 }}
              />
            </div>

            {/* 成员卡片骨架 - 一行显示5个 */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  style={{
                    width: 72,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Skeleton.Avatar
                    active
                    size={38}
                    style={{ marginBottom: 8 }}
                  />
                  <Skeleton.Input
                    active
                    size="small"
                    style={{ width: 50, height: 12, marginBottom: 4 }}
                  />
                  <Skeleton.Input
                    active
                    size="small"
                    style={{ width: 40, height: 12 }}
                  />
                </div>
              ))}
            </div>

            {/* 统计信息卡片骨架 */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Skeleton.Button
                active
                size="default"
                style={{ width: "75%", height: 60 }}
              />
            </div>
          </div>
        ))}

        {/* 考核结果表格骨架 */}
        <div style={{ marginTop: 16 }}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <Skeleton.Input
              active
              size="small"
              style={{ width: 120, height: 20 }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Skeleton.Button
              active
              size="default"
              style={{ width: "75%", height: 80 }}
            />
          </div>
        </div>
      </>
    );
  };

  useEffect(() => {
    fetchEvaluationResults();
    fetchAllData();
  }, []);

  return (
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
          alt="基本情况"
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
            left: "55%",
            transform: "translate(-50%, -50%)",
            fontSize: 20,
            fontWeight: "bold",
            color: "#fbbf24",
            textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
            whiteSpace: "nowrap",
            letterSpacing: 2,
          }}
        >
          基本情况
        </div>
      </div>

      {/* 中间区域 - 基本情况 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          width: 544,
          height: 966,
          minWidth: 0,
          background:
            "linear-gradient(to bottom, #f7d5c8, #f9d9c9, #fef1d8, #f3d5c8)",
          borderRadius: 8,
          padding: 10,
          boxSizing: "border-box",
        }}
      >
        {/* 骨架屏效果 */}
        {showSkeleton && renderSkeletonContent()}

        {/* 真实数据展示 */}
        {!showSkeleton && !loading && groupedData.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#999" }}>
            暂无数据
          </div>
        )}

        {!showSkeleton && !loading && groupedData.length > 0 && (
          <>
            {groupedData.map((item, index) => (
              <div
                key={index}
              >
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#dc2626",
                    textAlign: "center",
                    marginBottom: 8,
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: 3.86,
                  }}
                >
                  {item.content.map((member, idx) => (
                    <div
                      key={member.id || idx}
                      style={{
                        flexShrink: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        border: "1px solid black",
                        paddingBottom: "1px",
                        width: 88,
                        overflow: "hidden",
                      }}
                    >
                      {/* 图片容器 */}
                      <div
                        style={{
                          width: "100%",
                          height: 95,
                          overflow: "hidden", // 防止图片溢出
                          flexShrink: 0, // 防止被压缩
                        }}
                      >
                        <img
                          src={getPhotoUrl(member.photo)}
                          alt={member.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover", // 关键：cover 会覆盖整个区域，保持比例
                            objectPosition: "50% 25%", // 可选：调整图片在容器中的位置
                            display: "block", // 移除图片底部间隙
                          }}
                        />
                      </div>
                      <div
                        style={{
                          marginBottom: 4,
                          fontSize: 7,
                          fontWeight: 700,
                          textAlign: "center",
                          lineHeight: 1.3,
                        }}
                      >
                        姓名：
                        <span
                          style={{
                            position: "relative",
                            display: "inline-block",
                          }}
                        >
                          {member.name}
                          <span
                            style={{
                              position: "absolute",
                              left: "0px", // 向左延伸
                              right: "0px", // 向右延伸
                              bottom: 0,
                              height: "1px",
                              backgroundColor: "currentColor",
                            }}
                          />
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 7,
                          fontWeight: 700,
                          textAlign: "center",
                          lineHeight: 1.3,
                        }}
                      >
                        职务：
                        <span
                          style={{
                            position: "relative",
                            display: "inline-block",
                          }}
                        >
                          {member.position}
                          <span
                            style={{
                              position: "absolute",
                              left: "-4px", // 向左延伸
                              right: "0px", // 向右延伸
                              bottom: 0,
                              height: "1px",
                              backgroundColor: "currentColor",
                            }}
                          />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 统计信息卡片 - 白色背景 */}
                {/* 如果是党支部委员会，显示：现有党员X名，其中预备党员X名，平均年龄X岁；现有发展党员X名，入党积极分子X名，递交入党申请书X名。
                如果是车间分会委员会，显示：现有班组xx个，分会会员xx名。
                如果是团支部委员会，显示：现有团员xx名，预备团委xx名，平均年龄xx岁；现有青工（35岁及以下）xx名。 */}
                <div
                  style={{
                    padding: "0px 12px",
                    margin: "8px 32px 0px",
                    fontWeight: 700,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      lineHeight: 1.6,
                      color: "#374151",
                    }}
                  >
                    {(() => {
                      // const stats = basicInfoNums[0] || {};
                      switch (item.title) {
                        case "党支部委员会":
                          return "现有党员17名，其中预备党员4名，平均年龄37岁；现有发展党员2名，入党积极分子4名，递交入党申请书6名。"
                          // return (
                          //   <>
                          //     现有党员{stats.partyNum1 || 0}名，其中预备党员
                          //     {stats.partyNum2 || 0}名，平均年龄
                          //     {stats.partyNum3 || 0}岁；
                          //     <br />
                          //     现有发展党员{stats.partyNum4 || 0}名，入党积极分子
                          //     {stats.partyNum5 || 0}名，递交入党申请书
                          //     {stats.partyNum6 || 0}名。
                          //   </>
                          // );
                        case "车间分会委员会":
                          // return `现有班组${stats.cheNum1 || 0}个，分会会员${stats.cheNum2 || 0}名。`;
                          return "车间分会下设4个工会小组，现有工会会员2人，其中：管理人员2名，专业技术人员1名，班组长12名，一线职工47名。"
                        case "团支部委员会":
                          // return `现有团员${stats.tuanNum1 || 0}名，预备团委${stats.tuanNum2 || 0}名，平均年龄${stats.tuanNum3 || 0}岁；现有青工（35岁及以下）${stats.tuanNum4 || 0}名。`;
                          return "车间团支部下设6个团小组现有团员13人，14~28周岁青年20人，35周岁以下青年2人。"
                        default:
                          return "";
                      }
                    })()}
                  </div>
                </div>
              </div>
            ))}

            {/* 考核本支部结果表格 */}
            <div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#dc2626",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                考核本支部结果
              </div>
              <table
                style={{
                  width: "75%",
                  borderCollapse: "collapse",
                  fontSize: 11,
                  margin: "0 auto",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        border: "1px solid #9ca3af",
                        padding: "6px 4px",
                        fontWeight: 600,
                        fontSize: 11,
                        textAlign: "center",
                      }}
                    >
                      一季度
                    </th>
                    <th
                      style={{
                        border: "1px solid #9ca3af",
                        padding: "6px 4px",
                        fontWeight: 600,
                        fontSize: 11,
                        textAlign: "center",
                      }}
                    >
                      二季度
                    </th>
                    <th
                      style={{
                        border: "1px solid #9ca3af",
                        padding: "6px 4px",
                        fontWeight: 600,
                        fontSize: 11,
                        textAlign: "center",
                      }}
                    >
                      三季度
                    </th>
                    <th
                      style={{
                        border: "1px solid #9ca3af",
                        padding: "6px 4px",
                        fontWeight: 600,
                        fontSize: 11,
                        textAlign: "center",
                      }}
                    >
                      四季度
                    </th>
                    <th
                      style={{
                        border: "1px solid #9ca3af",
                        padding: "6px 4px",
                        fontWeight: 600,
                        fontSize: 11,
                        textAlign: "center",
                      }}
                    >
                      上年度
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      style={{
                        border: "1px solid #9ca3af",
                        padding: "6px 4px",
                        textAlign: "center",
                      }}
                    >
                      {evaluationResults[0]?.one || "-"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #9ca3af",
                        padding: "6px 4px",
                        textAlign: "center",
                      }}
                    >
                      {evaluationResults[0]?.two || "-"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #9ca3af",
                        padding: "6px 4px",
                        textAlign: "center",
                      }}
                    >
                      {evaluationResults[0]?.three || "-"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #9ca3af",
                        padding: "6px 4px",
                        textAlign: "center",
                      }}
                    >
                      {evaluationResults[0]?.four || "-"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #9ca3af",
                        padding: "6px 4px",
                        textAlign: "center",
                        fontWeight: 500,
                      }}
                    >
                      {evaluationResults[0]?.years || "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Page1;
