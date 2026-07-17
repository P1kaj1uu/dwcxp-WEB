import React, { useEffect, useState } from "react";

interface ScaledContainerProps {
  children: React.ReactNode;
  designWidth?: number;
  designHeight?: number;
  backgroundColor?: string;
}

/**
 * 将子内容按设计稿尺寸（比如 1920×1080）等比缩放到视口中，
 * 居中显示，使整个仪表盘在任何分辨率下都“无滚动且按比例”。
 */
const ScaledContainer: React.FC<ScaledContainerProps> = ({
  children,
  designWidth = 1920,
  designHeight = 1080,
  backgroundColor = "#fff",
}) => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const computeScale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // 留一点 padding，避免贴到屏幕边缘
      const padding = 0;
      const s = Math.min(
        (vw - padding * 2) / designWidth,
        (vh - padding * 2) / designHeight,
      );
      setScale(s > 0 ? s : 1);
    };

    computeScale();
    window.addEventListener("resize", computeScale);
    return () => window.removeEventListener("resize", computeScale);
  }, [designWidth, designHeight]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: designWidth,
          height: designHeight,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          background: "#fff",
          boxShadow: "0 0 60px rgba(0,0,0,0.35)",
          flexShrink: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default ScaledContainer;
