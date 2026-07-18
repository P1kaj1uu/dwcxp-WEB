import React, { useState, useEffect, useRef } from "react";
import { Spin } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";

export interface MediaItem {
  id: number;
  fileName: string;
  fileType: string;
  category: string;
  fileUrl: string;
  mediaType: 'image' | 'video';
}

interface MediaCarouselProps {
  mediaList: MediaItem[];
  autoSwitchInterval?: number;
  onFirstMediaLoaded?: () => void;
  containerStyle?: React.CSSProperties;
  emptyText?: string;
}

/**
 * 通用媒体轮播组件（图片 + 视频）
 * - 内部维护当前媒体的加载状态，加载中显示半透明遮罩 + Spin
 * - 首张媒体真正加载完成（onLoad / onLoadedData）时通过 onFirstMediaLoaded 通知父级
 * - 支持悬停暂停/离开恢复、自动轮播、左右切换
 */
const MediaCarousel: React.FC<MediaCarouselProps> = ({
  mediaList,
  autoSwitchInterval = 5000,
  onFirstMediaLoaded,
  containerStyle,
  emptyText = '暂无媒体内容',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [hasFiredFirstLoad, setHasFiredFirstLoad] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lengthRef = useRef(mediaList.length);

  // 同步最新 length 给定时器闭包使用，避免 effect 依赖 currentIndex
  useEffect(() => {
    lengthRef.current = mediaList.length;
  }, [mediaList.length]);

  // mediaList 变化时重置内部状态
  useEffect(() => {
    setCurrentIndex(0);
    setMediaLoading(true);
    setLoadError(false);
    setHasFiredFirstLoad(false);
  }, [mediaList]);

  // 自动轮播：依赖 [playing, autoSwitchInterval]，不依赖 currentIndex
  useEffect(() => {
    if (!playing || lengthRef.current <= 1) return;
    const id = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % lengthRef.current);
      setMediaLoading(true);
      setLoadError(false);
    }, autoSwitchInterval);
    timerRef.current = id;
    return () => {
      clearInterval(id);
      timerRef.current = null;
    };
  }, [playing, autoSwitchInterval]);

  const currentItem = mediaList[currentIndex];

  const handleMediaLoad = () => {
    setMediaLoading(false);
    if (currentIndex === 0 && !hasFiredFirstLoad) {
      setHasFiredFirstLoad(true);
      onFirstMediaLoaded?.();
    }
  };

  const handleMediaError = () => {
    setMediaLoading(false);
    setLoadError(true);
    // 失败也回调首张，避免全屏 loading 卡死
    if (currentIndex === 0 && !hasFiredFirstLoad) {
      setHasFiredFirstLoad(true);
      onFirstMediaLoaded?.();
    }
  };

  const changeMedia = (direction: 'prev' | 'next') => {
    if (lengthRef.current <= 1) return;
    setMediaLoading(true);
    setLoadError(false);
    setCurrentIndex((prev) =>
      direction === 'prev'
        ? (prev - 1 + lengthRef.current) % lengthRef.current
        : (prev + 1) % lengthRef.current,
    );
  };

  // 空列表
  if (mediaList.length === 0) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#999',
          ...containerStyle,
        }}
      >
        {emptyText}
      </div>
    );
  }

  const mediaUrl = currentItem?.fileUrl;
  const isVideo = currentItem?.mediaType === 'video';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#000',
        ...containerStyle,
      }}
      onMouseEnter={() => setPlaying(false)}
      onMouseLeave={() => setPlaying(true)}
    >
      {/* 加载遮罩 */}
      {mediaLoading && !loadError && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '0.5rem',
            zIndex: 5,
          }}
        >
          <Spin size="large" />
          <div style={{ marginTop: '0.75rem', color: '#666', fontSize: '0.75rem' }}>
            加载中...
          </div>
        </div>
      )}

      {/* 错误占位 */}
      {loadError && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#999',
            zIndex: 4,
          }}
        >
          <div>无法加载媒体内容</div>
          <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
            {currentItem?.fileName}
          </div>
        </div>
      )}

      {/* 媒体元素 */}
      {!loadError && currentItem && mediaUrl && !isVideo && (
        <img
          src={mediaUrl}
          alt={currentItem.fileName}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: mediaLoading ? 0.3 : 1,
            transition: 'opacity 0.3s',
          }}
          onLoad={handleMediaLoad}
          onError={handleMediaError}
        />
      )}

      {!loadError && currentItem && mediaUrl && isVideo && (
        <video
          src={mediaUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: mediaLoading ? 0.3 : 1,
            transition: 'opacity 0.3s',
          }}
          onLoadedData={handleMediaLoad}
          onError={handleMediaError}
          autoPlay
          loop
          muted
          playsInline
        />
      )}

      {/* 左右切换按钮 */}
      {mediaList.length > 1 && !mediaLoading && !loadError && (
        <>
          <div
            style={{
              position: 'absolute',
              left: '0.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: 'pointer',
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '50%',
              width: '2rem',
              height: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
            }}
            onClick={() => changeMedia('prev')}
          >
            <LeftOutlined style={{ color: '#fff', fontSize: '1rem' }} />
          </div>
          <div
            style={{
              position: 'absolute',
              right: '0.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: 'pointer',
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '50%',
              width: '2rem',
              height: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
            }}
            onClick={() => changeMedia('next')}
          >
            <RightOutlined style={{ color: '#fff', fontSize: '1rem' }} />
          </div>
        </>
      )}
    </div>
  );
};

export default MediaCarousel;