import React, { useState, useEffect } from "react";
import { getPdfListApi } from "@/api/pdf";
import PDFCarousel from "@/components/PDFCarousel";

const Page4: React.FC = () => {
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({
    重点工作: "",
    党务公开: "",
    党风廉政: "",
    组织生活: "",
  });

  // 获取 PDF 文件列表
  const fetchPdfUrls = async () => {
    const categories = ["重点工作", "党务公开", "党风廉政", "组织生活"];
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

  return (
    <>
      {/* 组织生活和活动风采 */}
      <div
        style={{
          flex: 1,
          width: 720,
          height: 430,
          marginTop: 20,
          margin: "20px auto",
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
    </>
  );
};

export default Page4;
