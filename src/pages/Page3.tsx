import React, { useState, useEffect } from "react";
import { getPdfListApi } from "@/api/pdf";
import { bgImage, hbgIconImage } from "@/utils/images";
import PDFCarousel from "@/components/PDFCarousel";

const Page3: React.FC = () => {
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({
    重点工作: "",
    党务公开: "",
    光荣榜: "",
    // 党风廉政: "",
    // 组织生活: "",
  });

  // 获取 PDF 文件列表
  const fetchPdfUrls = async () => {
    const categories = ["重点工作", "党务公开", "光荣榜"];
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
      {/* PDF 卡片 */}
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
        <div
          className="flex gap-3 w-[720px] h-[430px] rounded-lg items-end bg-[#fefdf9] p-[20px]"
          style={{
            background:
              "linear-gradient(to right, #fbe5d3, #fefceb, #fef1de, #f3d4c7)",
          }}
        >
          <div className="h-full flex-1 min-w-0 relative">
            {/* 标题图片 - 带黄色文字 */}
            <div
              style={{
                position: "relative",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 28,
                flexShrink: 0,
              }}
            >
              <img
                src={hbgIconImage}
                alt="重点工作"
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
                重点工作
              </div>
            </div>
            <div
              className="h-[80%]"
              style={{
                border: "3px solid #fefefe",
                background: "#fefdf9",
              }}
            >
              <PDFCarousel
                pdfUrl={pdfUrls["重点工作"]}
                title=""
                headerColor="#E74C3C"
              />
            </div>
          </div>

          <div className="h-full flex-1 min-w-0 relative">
            {/* 标题图片 - 带黄色文字 */}
            <div
              style={{
                position: "relative",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 28,
                flexShrink: 0,
              }}
            >
              <img
                src={hbgIconImage}
                alt="党务公开"
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
                党务公开
              </div>
            </div>
            <div
              className="h-[80%]"
              style={{
                border: "3px solid #fefefe",
                background: "#fefdf9",
              }}
            >
              <PDFCarousel
                pdfUrl={pdfUrls["党务公开"]}
                title=""
                headerColor="#E74C3C"
              />
            </div>
          </div>

          <div className="h-full flex-1 min-w-0 relative">
            {/* 标题图片 - 带黄色文字 */}
            <div
              style={{
                position: "relative",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 28,
                flexShrink: 0,
              }}
            >
              <img
                src={hbgIconImage}
                alt="光荣榜"
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
                光荣榜
              </div>
            </div>
            <div
              className="h-[80%]"
              style={{
                border: "3px solid #fefefe",
                background: "#fefdf9",
              }}
            >
              <PDFCarousel
                pdfUrl={pdfUrls["党务公开"]}
                title=""
                headerColor="#E74C3C"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Page3;
