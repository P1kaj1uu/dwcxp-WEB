import React, { useState, useEffect, useRef } from "react";
import { hbgIconImage } from "@/utils/images";
import { getMediaListApi, getShowMediaListApi } from '@/api/media';
import MediaCarousel, { type MediaItem } from '@/components/MediaCarousel';

const detectMediaType = (fileName: string): 'image' | 'video' => {
  const ext = fileName.toLowerCase();
  if (
    ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') ||
    ext.endsWith('.gif') || ext.endsWith('.bmp') || ext.endsWith('.webp')
  ) {
    return 'image';
  }
  if (
    ext.endsWith('.mp4') || ext.endsWith('.webm') || ext.endsWith('.ogg') ||
    ext.endsWith('.mov') || ext.endsWith('.avi')
  ) {
    return 'video';
  }
  if (ext.includes('video')) {
    return 'video';
  }
  return 'image';
};

const SectionTitle: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: '0.5rem',
      flexShrink: 0,
    }}
  >
    <img
      src={hbgIconImage}
      alt={text}
      style={{
        width: 'auto',
        height: '2.5rem',
        objectFit: 'contain',
      }}
    />
    <div
      style={{
        position: 'absolute',
        top: '60%',
        left: '55%',
        transform: 'translate(-50%, -50%)',
        fontSize: '1.25rem',
        fontWeight: 'bold',
        color: '#fbbf24',
        textShadow: '0.0625rem 0.0625rem 0.125rem rgba(0,0,0,0.3)',
        whiteSpace: 'nowrap',
        letterSpacing: '0.125rem',
      }}
    >
      {text}
    </div>
  </div>
);

const Page4: React.FC = () => {
  const [orgLifeMedia, setOrgLifeMedia] = useState<MediaItem[]>([]);
  const [activityMedia, setActivityMedia] = useState<MediaItem[]>([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  // 用 ref 跟踪"是否已解锁全屏 loading"，避免被 effect 重置覆盖
  const orgLifeReadyRef = useRef(false);
  const activityReadyRef = useRef(false);

  const processMedia = (list: any[] | undefined, type: 'image' | 'video'): MediaItem[] => {
    let filtered = list || [];
    if (filtered.length) {
      filtered = filtered.filter((item: any) => {
        const isVideo = detectMediaType(item.fileName) === 'video';
        return type === 'video' ? isVideo : !isVideo;
      });
    }
    return filtered.map((item: any) => ({
      ...item,
      fileUrl: `${API_BASE_URL}${item.fileUrl}`.replace('/api', ''),
      mediaType: detectMediaType(item.fileName),
    }));
  };

  // 统一的数据获取 + loading 解锁逻辑
  const fetchAll = async (type: 'image' | 'video') => {
    orgLifeReadyRef.current = false;
    activityReadyRef.current = false;

    try {
      const [orgLifeRes, activityRes] = await Promise.all([
        getMediaListApi({ category: 'orgLife' }),
        getMediaListApi({ category: 'activityStyle' }),
      ]);

      const orgLifeProcessed = orgLifeRes?.data?.code === 200
        ? processMedia(orgLifeRes.data.data, type)
        : [];
      const activityProcessed = activityRes?.data?.code === 200
        ? processMedia(activityRes.data.data, type)
        : [];

      setOrgLifeMedia(orgLifeProcessed);
      setActivityMedia(activityProcessed);

      // 空列表时直接解锁，避免 loading 卡死
      if (orgLifeProcessed.length === 0) {
        orgLifeReadyRef.current = true;
      }
      if (activityProcessed.length === 0) {
        activityReadyRef.current = true;
      }
    } catch (error) {
      console.error('获取媒体数据失败:', error);
      orgLifeReadyRef.current = true;
      activityReadyRef.current = true;
    }
  };

  // 初始化：先拿显示类型，再拉数据
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let type: 'image' | 'video' = 'image';
      try {
        const res = await getShowMediaListApi();
        if (!cancelled && res?.data?.code === 200) {
          type = res.data.data?.[0]?.type === 'video' ? 'video' : 'image';
        }
      } catch (error) {
        console.error('获取显示类型失败:', error);
      }
      if (!cancelled) {
        await fetchAll(type);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOrgLifeFirstLoaded = () => {
    if (orgLifeReadyRef.current) return;
    orgLifeReadyRef.current = true;
  };

  const handleActivityFirstLoaded = () => {
    if (activityReadyRef.current) return;
    activityReadyRef.current = true;
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: "#f7eaca",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: '0.75rem',
          width: "100%",
          height: "100%",
          alignItems: "stretch",
          padding: '0.75rem',
          boxSizing: "border-box",
          minHeight: 0,
        }}
      >
        {/* 组织生活区域 */}
        <div style={{ height: "100%", flex: 1, minWidth: 0, position: "relative", display: "flex", flexDirection: "column" }}>
          <SectionTitle text="组织生活" />
          <MediaCarousel
            mediaList={orgLifeMedia}
            onFirstMediaLoaded={handleOrgLifeFirstLoaded}
            containerStyle={{
              border: '3px solid #fefefe',
              borderRadius: 8,
              overflow: 'hidden',
              flex: 1,
              minHeight: 0,
              background: 'red',
            }}
          />
        </div>

        {/* 活动风采区域 */}
        <div style={{ height: "100%", flex: 1, minWidth: 0, position: "relative", display: "flex", flexDirection: "column" }}>
          <SectionTitle text="活动风采" />
          <MediaCarousel
            mediaList={activityMedia}
            onFirstMediaLoaded={handleActivityFirstLoaded}
            containerStyle={{
              border: '3px solid #fefefe',
              borderRadius: 8,
              overflow: 'hidden',
              flex: 1,
              minHeight: 0,
              background: 'red',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Page4;