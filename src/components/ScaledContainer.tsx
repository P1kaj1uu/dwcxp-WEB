import React from "react";

interface ScaledContainerProps {
  children: React.ReactNode;
  /** 保留兼容参数；不再用于缩放计算。 */
  designWidth?: number;
  /** 保留兼容参数；不再用于缩放计算。 */
  designHeight?: number;
  /** 背景色，默认白色。 */
  backgroundColor?: string;
}

/**
 * 全屏布局壳（不再做 CSS transform: scale）。
 *
 * 子组件内部的字体、间距、容器尺寸都已改为 rem / vw / vh 自适应，
 * 通过全局 `html { font-size: clamp(12px, calc(100vw / 1920 * 16), 22px) }`
 * 跟随视口缩放，因此这里只需要提供一个铺满视口的容器。
 */
const ScaledContainer: React.FC<ScaledContainerProps> = ({
  children,
  designWidth = 1920,
  designHeight = 1080,
  backgroundColor = "#fff",
}) => {
  // designWidth / designHeight 保留以保持调用方接口不变，但不参与渲染计算。
  void designWidth;
  void designHeight;

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor,
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );
};

export default ScaledContainer;
