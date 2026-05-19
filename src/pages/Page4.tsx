import React, { useState, useEffect, useRef, useCallback } from "react";
import { bgImage, hbgIconImage } from "@/utils/images";
import { getMediaListApi, getShowMediaListApi } from '@/api/media';
import { LeftOutlined, RightOutlined, PlayCircleOutlined } from '@ant-design/icons';

interface MediaItem {
  id: number;
  fileName: string;
  fileType: string;
  category: string;
  fileUrl: string;
  mediaType: 'image' | 'video';
}

const Page4: React.FC = () => {
  const [orgLifeMedia, setOrgLifeMedia] = useState<MediaItem[]>([]);
  const [activityMedia, setActivityMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 轮播索引
  const [orgLifeIndex, setOrgLifeIndex] = useState(0);
  const [activityIndex, setActivityIndex] = useState(0);
  
  // 轮播控制
  const [orgLifePlaying, setOrgLifePlaying] = useState(true);
  const [activityPlaying, setActivityPlaying] = useState(true);
  
  // 视频播放状态
  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null);
  
  const orgLifeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});

  const [showType, setShowType] = useState<'image' | 'video'>('image');

  // 获取 API 基础 URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  const detectMediaType = useCallback((fileName: string): 'image' | 'video' => {
    const ext = fileName.toLowerCase();
    if (ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || 
        ext.endsWith('.gif') || ext.endsWith('.bmp') || ext.endsWith('.webp')) {
      return 'image';
    }
    if (ext.endsWith('.mp4') || ext.endsWith('.webm') || ext.endsWith('.ogg') || 
        ext.endsWith('.mov') || ext.endsWith('.avi')) {
      return 'video';
    }
    // 根据文件名默认判断，如果文件名包含"Video"则认为是视频
    if (fileName.toLowerCase().includes('video')) {
      return 'video';
    }
    return 'image';
  }, []);

  const getShowMediaType = async () => {
    try {
      const res = await getShowMediaListApi();
      if (res.data.code === 200) {
        let type = res.data.data.list[0].type;
        setShowType(type === 'video' ? 'video' : 'image');
      }
    } catch (error) {
      console.error('获取显示类型失败:', error);
    }
  };

  const fetchMediaData = useCallback(async () => {
    setLoading(true);
    try {
      // 获取组织生活媒体
      console.log('正在获取组织生活媒体...', 'showType:', showType);
      const orgLifeRes = await getMediaListApi({ category: 'orgLife' });
      
      if (orgLifeRes.data.code === 200) {
        let mediaList = orgLifeRes.data.data || [];
        
        // 根据 showType 筛选
        if (mediaList.length && showType) {
          mediaList = mediaList.filter((item: any) => {
            const isVideo = detectMediaType(item.fileName) === 'video';
            if (showType === 'video') {
              return isVideo; // 只返回视频
            } else {
              return !isVideo; // 只返回图片
            }
          });
        }
        
        console.log('组织生活媒体列表:', mediaList);
        
        const processedMedia = mediaList.map((item: any) => {
          const mediaType = detectMediaType(item.fileName);
          // 构建完整的预览URL
          const fullUrl = `${API_BASE_URL}${item.fileUrl}`.replace('/api', '');
          console.log(`处理文件: ${item.fileName}, 类型: ${mediaType}, URL: ${fullUrl}`);
          
          return {
            ...item,
            fileUrl: fullUrl,
            mediaType
          };
        });
        setOrgLifeMedia(processedMedia);
      } else {
        console.error('获取组织生活媒体失败:', orgLifeRes.data.message);
      }

      // 获取活动风采媒体
      console.log('正在获取活动风采媒体...', 'showType:', showType);
      const activityRes = await getMediaListApi({ category: 'activityStyle' });
      
      if (activityRes.data.code === 200) {
        let mediaList = activityRes.data.data || [];
        
        // 根据 showType 筛选
        if (mediaList.length && showType) {
          mediaList = mediaList.filter((item: any) => {
            const isVideo = detectMediaType(item.fileName) === 'video';
            if (showType === 'video') {
              return isVideo; // 只返回视频
            } else {
              return !isVideo; // 只返回图片
            }
          });
        }
        
        console.log('活动风采媒体列表:', mediaList);
        
        const processedMedia = mediaList.map((item: any) => {
          const mediaType = detectMediaType(item.fileName);
          const fullUrl = `${API_BASE_URL}${item.fileUrl}`.replace('/api', '');
          console.log(`处理文件: ${item.fileName}, 类型: ${mediaType}, URL: ${fullUrl}`);
          
          return {
            ...item,
            fileUrl: fullUrl,
            mediaType
          };
        });
        setActivityMedia(processedMedia);
      } else {
        console.error('获取活动风采媒体失败:', activityRes.data.message);
      }
    } catch (error) {
      console.error('获取媒体数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [showType, API_BASE_URL, detectMediaType]);

  // 初始化：获取显示类型
  useEffect(() => {
    const initData = async () => {
      await getShowMediaType();
    };
    
    initData();
    
    return () => {
      // 清理定时器
      if (orgLifeTimerRef.current) clearInterval(orgLifeTimerRef.current);
      if (activityTimerRef.current) clearInterval(activityTimerRef.current);
    };
  }, []);

  // 当 showType 变化时，重新获取数据
  useEffect(() => {
    if (showType) {
      fetchMediaData();
    }
  }, [showType, fetchMediaData]);

  // 当媒体数据加载完成后，启动轮播
  useEffect(() => {
    if (orgLifeMedia.length > 1 && orgLifePlaying) {
      startOrgLifeCarousel();
    }
    return () => {
      if (orgLifeTimerRef.current) clearInterval(orgLifeTimerRef.current);
    };
  }, [orgLifeMedia.length, orgLifePlaying, orgLifeIndex]);

  useEffect(() => {
    if (activityMedia.length > 1 && activityPlaying) {
      startActivityCarousel();
    }
    return () => {
      if (activityTimerRef.current) clearInterval(activityTimerRef.current);
    };
  }, [activityMedia.length, activityPlaying, activityIndex]);

  // 启动组织生活轮播
  const startOrgLifeCarousel = () => {
    if (orgLifeTimerRef.current) clearInterval(orgLifeTimerRef.current);
    orgLifeTimerRef.current = setInterval(() => {
      setOrgLifeIndex(prev => (prev + 1) % orgLifeMedia.length);
    }, 5000);
  };

  // 启动活动风采轮播
  const startActivityCarousel = () => {
    if (activityTimerRef.current) clearInterval(activityTimerRef.current);
    activityTimerRef.current = setInterval(() => {
      setActivityIndex(prev => (prev + 1) % activityMedia.length);
    }, 5000);
  };

  // 暂停组织生活轮播
  const pauseOrgLifeCarousel = () => {
    setOrgLifePlaying(false);
    if (orgLifeTimerRef.current) clearInterval(orgLifeTimerRef.current);
  };

  // 暂停活动风采轮播
  const pauseActivityCarousel = () => {
    setActivityPlaying(false);
    if (activityTimerRef.current) clearInterval(activityTimerRef.current);
  };

  // 恢复组织生活轮播
  const resumeOrgLifeCarousel = () => {
    if (orgLifeMedia.length > 1 && !orgLifePlaying) {
      setOrgLifePlaying(true);
      startOrgLifeCarousel();
    }
  };

  // 恢复活动风采轮播
  const resumeActivityCarousel = () => {
    if (activityMedia.length > 1 && !activityPlaying) {
      setActivityPlaying(true);
      startActivityCarousel();
    }
  };

  // 切换组织生活媒体
  const changeOrgLifeMedia = (direction: 'prev' | 'next') => {
    if (orgLifeMedia.length === 0) return;
    pauseOrgLifeCarousel();
    if (direction === 'prev') {
      setOrgLifeIndex(prev => (prev - 1 + orgLifeMedia.length) % orgLifeMedia.length);
    } else {
      setOrgLifeIndex(prev => (prev + 1) % orgLifeMedia.length);
    }
    setTimeout(() => {
      if (!orgLifePlaying) resumeOrgLifeCarousel();
    }, 5000);
  };

  // 切换活动风采媒体
  const changeActivityMedia = (direction: 'prev' | 'next') => {
    if (activityMedia.length === 0) return;
    pauseActivityCarousel();
    if (direction === 'prev') {
      setActivityIndex(prev => (prev - 1 + activityMedia.length) % activityMedia.length);
    } else {
      setActivityIndex(prev => (prev + 1) % activityMedia.length);
    }
    setTimeout(() => {
      if (!activityPlaying) resumeActivityCarousel();
    }, 5000);
  };

  // 视频播放结束处理
  // @ts-ignore
  const handleVideoEnded = (mediaId: number, category: string) => {
    setPlayingVideoId(null);
    if (category === 'orgLife' && orgLifeMedia.length > 1) {
      setOrgLifeIndex(prev => (prev + 1) % orgLifeMedia.length);
    } else if (category === 'activity' && activityMedia.length > 1) {
      setActivityIndex(prev => (prev + 1) % activityMedia.length);
    }
  };

  // 渲染媒体内容
  const renderMedia = (media: MediaItem, category: 'orgLife' | 'activity') => {
    if (!media) {
      return null;
    }
    
    const mediaUrl = media.fileUrl;
    if (!mediaUrl) {
      return (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          color: "#999",
          flexDirection: "column"
        }}>
          <div>无法加载媒体内容</div>
          <div style={{ fontSize: 12, marginTop: 8 }}>{media.fileName}</div>
        </div>
      );
    }

    if (media.mediaType === 'video') {
      const isPlaying = playingVideoId === media.id;
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <video
            ref={el => { videoRefs.current[media.id] = el; }}
            src={mediaUrl}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            controls={isPlaying}
            autoPlay={false}
            onEnded={() => handleVideoEnded(media.id, category)}
            onPlay={() => setPlayingVideoId(media.id)}
            onPause={() => setPlayingVideoId(null)}
            onError={(e) => {
              console.error('视频加载错误:', e);
            }}
          />
          {!isPlaying && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                zIndex: 10,
              }}
              onClick={() => {
                const video = videoRefs.current[media.id];
                if (video) {
                  video.play();
                  setPlayingVideoId(media.id);
                  if (category === 'orgLife') {
                    pauseOrgLifeCarousel();
                  } else {
                    pauseActivityCarousel();
                  }
                }
              }}
            >
              <PlayCircleOutlined style={{ fontSize: 64, color: 'rgba(255,255,255,0.8)' }} />
            </div>
          )}
        </div>
      );
    }

    // 图片
    return (
      <img
        src={mediaUrl}
        alt={media.fileName}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        onError={(e) => {
          console.error('图片加载错误:', e);
        }}
      />
    );
  };

  const currentOrgLifeMedia = orgLifeMedia[orgLifeIndex];
  const currentActivityMedia = activityMedia[activityIndex];

  if (loading) {
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: 20,
        color: "#fff"
      }}>
        加载中...
      </div>
    );
  }

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
      <div
        className="flex gap-3 w-[720px] h-[430px] rounded-lg items-end bg-[#fefdf9] p-[20px]"
        style={{
          background: "linear-gradient(to right, #fbe5d3, #fefceb, #fef1de, #f3d4c7)",
        }}
      >
        {/* 组织生活区域 */}
        <div className="h-full flex-1 min-w-0 relative">
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
              alt="组织生活"
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
              组织生活
            </div>
          </div>
          
          <div
            className="h-[80%] relative"
            style={{
              border: "3px solid #fefefe",
              background: "red",
              borderRadius: 8,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {orgLifeMedia.length > 0 ? (
              <>
                {renderMedia(currentOrgLifeMedia, 'orgLife')}
                
                {orgLifeMedia.length > 1 && (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        left: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        background: "rgba(0,0,0,0.5)",
                        borderRadius: "50%",
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 20,
                      }}
                      onClick={() => changeOrgLifeMedia('prev')}
                    >
                      <LeftOutlined style={{ color: "#fff", fontSize: 16 }} />
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        right: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        background: "rgba(0,0,0,0.5)",
                        borderRadius: "50%",
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 20,
                      }}
                      onClick={() => changeOrgLifeMedia('next')}
                    >
                      <RightOutlined style={{ color: "#fff", fontSize: 16 }} />
                    </div>
                  </>
                )}
              </>
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  color: "#999",
                }}
              >
                暂无媒体内容
              </div>
            )}
          </div>
        </div>

        {/* 活动风采区域 */}
        <div className="h-full flex-1 min-w-0 relative">
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
              alt="活动风采"
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
              活动风采
            </div>
          </div>
          
          <div
            className="h-[80%] relative"
            style={{
              border: "3px solid #fefefe",
              background: "red",
              borderRadius: 8,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {activityMedia.length > 0 ? (
              <>
                {renderMedia(currentActivityMedia, 'activity')}
                
                {activityMedia.length > 1 && (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        left: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        background: "rgba(0,0,0,0.5)",
                        borderRadius: "50%",
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 20,
                      }}
                      onClick={() => changeActivityMedia('prev')}
                    >
                      <LeftOutlined style={{ color: "#fff", fontSize: 16 }} />
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        right: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        background: "rgba(0,0,0,0.5)",
                        borderRadius: "50%",
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 20,
                      }}
                      onClick={() => changeActivityMedia('next')}
                    >
                      <RightOutlined style={{ color: "#fff", fontSize: 16 }} />
                    </div>
                  </>
                )}
              </>
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  color: "#999",
                }}
              >
                暂无媒体内容
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page4;
