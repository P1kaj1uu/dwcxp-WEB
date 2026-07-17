import React, { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Modal, Spin } from "antd"; // 引入 Spin 组件
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFCarouselProps {
  pdfUrl: string;
  title: string;
  headerColor?: string;
  onCardClick?: (images: string[], currentIndex: number) => void;
  autoSwitchInterval?: number;
  externalLoading?: boolean; // 外部传入的 loading 状态
}

const PDFCarousel: React.FC<PDFCarouselProps> = ({
  pdfUrl,
  title,
  onCardClick,
  autoSwitchInterval = 5000,
  externalLoading = false,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  // 只用一个 documentLoading 来表示"PDF 是否已经解析完成"。
  // 取消 pageLoading：翻页时不再触发 loading 闪烁，避免抖动。
  const [documentLoading, setDocumentLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalCurrentPage, setModalCurrentPage] = useState(0);
  const [modalDocumentLoading, setModalDocumentLoading] = useState(true);
  const [modalPageLoading, setModalPageLoading] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 是否显示 loading：只在首次文档加载时展示，翻页过程不展示
  const isLoading = documentLoading || externalLoading;
  // 弹窗是否显示 loading
  const isModalLoading = modalDocumentLoading || modalPageLoading;

  const startAutoSwitch = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (numPages <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev === numPages - 1 ? 0 : prev + 1));
    }, autoSwitchInterval);
  }, [numPages, autoSwitchInterval]);

  const stopAutoSwitch = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!documentLoading && numPages > 0) {
      startAutoSwitch();
    }
    return () => stopAutoSwitch();
  }, [documentLoading, numPages, startAutoSwitch, stopAutoSwitch]);

  // 文档加载成功
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setDocumentLoading(false);
    setError(false);
  };

  // 文档加载失败
  const onDocumentLoadError = () => {
    setDocumentLoading(false);
    setError(true);
  };

  // 弹窗文档加载成功
  const onModalDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setModalDocumentLoading(false);
  };

  // 弹窗页面渲染成功
  const onModalPageLoadSuccess = () => {
    setModalPageLoading(false);
  };

  // 重置加载状态（当 pdfUrl 变化时）
  useEffect(() => {
    if (pdfUrl) {
      setDocumentLoading(true);
      setError(false);
      setCurrentIndex(0);
    }
  }, [pdfUrl]);

  // 重置弹窗加载状态（当弹窗打开时）
  useEffect(() => {
    if (modalVisible) {
      setModalDocumentLoading(true);
      setModalPageLoading(true);
    }
  }, [modalVisible]);

  // 翻页不再触发 pageLoading，避免每次切页都闪一下 loading
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev === 0 ? numPages - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev === numPages - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex(idx);
  };

  const handleTitleClick = () => {
    if (numPages > 0) {
      setModalVisible(true);
      setModalCurrentPage(currentIndex);
      onCardClick?.([], currentIndex);
    }
  };

  // 弹窗中的翻页方法
  const handleModalPrev = () => {
    setModalCurrentPage((prev) => (prev === 0 ? numPages - 1 : prev - 1));
    setModalPageLoading(true);
  };

  const handleModalNext = () => {
    setModalCurrentPage((prev) => (prev === numPages - 1 ? 0 : prev + 1));
    setModalPageLoading(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  return (
    <>
      <div
        style={{
          flex: 1,
          border: "1px solid black",
          textAlign: "center",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          minWidth: 0,
          userSelect: "none",
          overflow: "hidden",
        }}
      >
        {/* 标题栏 */}
        {title && (
          <div
            onClick={handleTitleClick}
            style={{
              padding: "8px 0",
              fontWeight: "bold",
              flexShrink: 0,
              cursor: "pointer",
              background: "#ba2e35",
              color: "#facc14",
              borderRadius: 6,
              position: "absolute",
              top: "-15px",
              left: "50%",
              transform: "translateX(-50%)",
              minWidth: "90px",
              zIndex: 1000,
            }}
          >
            {title}
          </div>
        )}

        <div
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            minHeight: 0,
            minWidth: 0,
          }}
          onMouseEnter={stopAutoSwitch}
          onMouseLeave={startAutoSwitch}
        >
          {/* Loading 状态：与 PDF 内容占同一高度，避免切换抖动 */}
          {isLoading && !error && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderRadius: 8,
                zIndex: 5,
              }}
            >
              <Spin size="large" />
              <div style={{ marginTop: 12, color: "#666", fontSize: 12 }}>
                加载 {title} 中...
              </div>
            </div>
          )}

          {/* 错误状态：与 PDF 内容占同一高度，避免抖动 */}
          {error && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                color: "#ff4d4f",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
              <div>PDF 加载失败</div>
              <div style={{ fontSize: 12, marginTop: 4, color: "#999" }}>
                请检查文件或网络连接
              </div>
            </div>
          )}

          {/* PDF 内容：与 loading/error 同层叠放，避免布局跳动 */}
          {!error && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: isLoading ? 0 : 1,
                // 关键：loading 刚消失时不渐变，避免切换瞬间的视觉抖动
                transition: "none",
              }}
            >
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading=""
              >
                <Page
                  onClick={handleTitleClick}
                  pageNumber={currentIndex + 1}
                  height={200}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  loading=""
                  // 不再监听 page load —— 翻页时不再阻塞/闪动
                />
              </Document>
            </div>
          )}

          {/* 翻页控件 */}
          {numPages > 1 && !isLoading && !error && (
            <>
              <div
                onClick={handlePrev}
                style={{
                  position: "absolute",
                  left: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.5)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 14,
                  zIndex: 10,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.7)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.5)";
                }}
              >
                <LeftOutlined />
              </div>
              <div
                onClick={handleNext}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.5)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 14,
                  zIndex: 10,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.7)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.5)";
                }}
              >
                <RightOutlined />
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: 6,
                  zIndex: 10,
                }}
              >
                {Array.from({ length: numPages }, (_, idx) => (
                  <div
                    key={idx}
                    onClick={(e) => handleDotClick(e, idx)}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background:
                        idx === currentIndex
                          ? "#1890ff"
                          : "rgba(255,255,255,0.6)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  right: 8,
                  fontSize: 10,
                  color: "rgba(255,255,255,0.7)",
                  background: "rgba(0,0,0,0.4)",
                  padding: "2px 6px",
                  borderRadius: 10,
                  zIndex: 10,
                }}
              >
                {currentIndex + 1} / {numPages}
              </div>
            </>
          )}
        </div>
      </div>

      {/* PDF 弹窗 */}
      <Modal
        title={title}
        open={modalVisible}
        onCancel={handleModalClose}
        footer={null}
        width="80%"
        style={{ maxWidth: 900 }}
        styles={{ 
          body: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: '300px',
            position: "relative",
          }
        }}
      >
        {/* 弹窗 Loading */}
        {isModalLoading && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <Spin size="large" />
            <div style={{ marginTop: 12, color: "#666" }}>加载文档中...</div>
          </div>
        )}

        <div
          style={{
            position: "relative",
            display: "inline-block",
            opacity: isModalLoading ? 0.3 : 1,
            transition: "opacity 0.3s",
          }}
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={onModalDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
          >
            <Page
              pageNumber={modalCurrentPage + 1}
              width={600}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              onLoadSuccess={onModalPageLoadSuccess}
              onLoadError={() => setModalPageLoading(false)}
            />
          </Document>

          {numPages > 1 && !isModalLoading && (
            <>
              <div
                onClick={handleModalPrev}
                style={{
                  position: "absolute",
                  left: -40,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.5)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 16,
                  zIndex: 10,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.7)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.5)";
                }}
              >
                <LeftOutlined />
              </div>
              <div
                onClick={handleModalNext}
                style={{
                  position: "absolute",
                  right: -40,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.5)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 16,
                  zIndex: 10,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.7)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.5)";
                }}
              >
                <RightOutlined />
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: -30,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: 8,
                  zIndex: 10,
                }}
              >
                {Array.from({ length: numPages }, (_, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setModalCurrentPage(idx);
                      setModalPageLoading(true);
                    }}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background:
                        idx === modalCurrentPage
                          ? "#1890ff"
                          : "rgba(0,0,0,0.3)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: -30,
                  right: 0,
                  fontSize: 12,
                  color: "#666",
                  background: "rgba(0,0,0,0.05)",
                  padding: "2px 8px",
                  borderRadius: 12,
                }}
              >
                {modalCurrentPage + 1} / {numPages}
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
};

export default PDFCarousel;
