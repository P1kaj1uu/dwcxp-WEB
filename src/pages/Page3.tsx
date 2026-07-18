import React, { useState, useEffect } from "react";
import { getPdfListApi } from "@/api/pdf";
import { hbgIconImage } from "@/utils/images";
import PDFCarousel from "@/components/PDFCarousel";

// 单个 PDF 卡片的标题 + 内容封装，避免重复 JSX
interface PdfCardProps {
  title: string;
  pdfUrl: string;
}

const PdfCard: React.FC<PdfCardProps> = ({ title, pdfUrl }) => {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      {/* 标题 */}
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: '0.5rem',
          flexShrink: 0,
        }}
      >
        <img
          src={hbgIconImage}
          alt={title}
          style={{
            width: "auto",
            height: '2.5rem',
            objectFit: "fill",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "60%",
            left: "60%",
            transform: "translate(-50%, -50%)",
            fontSize: '1.25rem',
            fontWeight: "bold",
            color: "#fbbf24",
            textShadow: "0.0625rem 0.0625rem 0.125rem rgba(0,0,0,0.3)",
            whiteSpace: "nowrap",
            letterSpacing: '0.125rem',
          }}
        >
          {title}
        </div>
      </div>

      {/* PDF 区域 */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          border: "3px solid #fefefe",
          background: "#fefdf9",
          borderRadius: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <PDFCarousel pdfUrl={pdfUrl} title="" headerColor="#E74C3C" />
      </div>
    </div>
  );
};

const CATEGORIES = ["重点工作", "党务公开", "光荣榜"] as const;
type Category = (typeof CATEGORIES)[number];

const Page3: React.FC = () => {
  const [pdfUrls, setPdfUrls] = useState<Record<Category, string>>({
    重点工作: "",
    党务公开: "",
    光荣榜: "",
  });

  // 获取 PDF 文件列表
  const fetchPdfUrls = async () => {
    const newPdfUrls: Partial<Record<Category, string>> = {};

    await Promise.all(
      CATEGORIES.map(async (category) => {
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
              newPdfUrls[category] = `data:application/pdf;base64,${file.fileContent}`;
            }
          }
        } catch (error) {
          console.error(`获取${category} PDF失败:`, error);
        }
      }),
    );

    setPdfUrls((prev) => ({ ...prev, ...newPdfUrls }));
  };

  useEffect(() => {
    fetchPdfUrls();
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden", // 改为 hidden，避免父容器出现滚动条
        display: "flex",
        flexDirection: "column",
        background: "#f7eaca",
        padding: '0.75rem',
        boxSizing: "border-box",
        minHeight: 0,
      }}
    >
      <div
        style={{
          flex: 1,
          width: "100%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "stretch",
          gap: '0.75rem',
          minHeight: 0, // 让子项可以正确伸缩
          background: "#f7eaca",
          boxSizing: "border-box",
        }}
      >
        {CATEGORIES.map((category) => (
          <PdfCard
            key={category}
            title={category}
            pdfUrl={pdfUrls[category]}
          />
        ))}
      </div>
    </div>
  );
};

export default Page3;
