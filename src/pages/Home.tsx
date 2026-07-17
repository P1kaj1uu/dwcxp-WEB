import React from "react";
import Page1 from "@/pages/Page1";
import Page2 from "@/pages/Page2";
import Page3 from "@/pages/Page3";
import Page4 from "@/pages/Page4";

const Home: React.FC = () => {

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        overflow: "hidden",
        backgroundColor: "#fff",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: 16,
          display: "flex",
          gap: 16,
          boxSizing: "border-box",
        }}
      >
        {/* 左边 */}
        <div style={{ width: "33%", height: "100%", display: "flex", flexDirection: "column" }}>
          <Page1 />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', width: '66%', height: '100%', minHeight: 0 }}>
          <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
            <div style={{ width: "50%", display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 0 }}>
              {/* 中上 */}
              <div className="flex align-items" style={{ justifyContent: 'space-between', gap: '12px', marginBottom: '24px' }}>
                <div className="flex-1" style={{ textAlign: 'center', border: '1px solid #b5b6b5' }}>
                  <div style={{
                    backgroundColor: '#da2129', color: 'rgb(251, 191, 36)', fontSize: 22, fontWeight: 'bold', letterSpacing: 2, textShadow: 'rgba(0, 0, 0, 0.3) 1px 1px 2px', height: 44,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>四强</div>
                  <div style={{ color: '#b4360c', fontSize: 20, fontWeight: 'bold', letterSpacing: 2, }}>
                    <div style={{ padding: '24px' }}>支部班子强</div>
                    <div style={{ padding: '0 24px 24px 24px' }}>党员队伍强</div>
                    <div style={{ padding: '0 24px 24px 24px' }}>基础工作强</div>
                    <div style={{ padding: '0 24px 48px 24px' }}>堡垒作用强</div>
                  </div>
                </div>

                <div className="flex-1" style={{ textAlign: 'center', border: '1px solid #b5b6b5' }}>
                  <div style={{
                    backgroundColor: '#da2129', color: 'rgb(251, 191, 36)', fontSize: 22, fontWeight: 'bold', letterSpacing: 2, textShadow: 'rgba(0, 0, 0, 0.3) 1px 1px 2px', height: 44,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>四优</div>
                  <div style={{ color: '#b4360c', fontSize: 20, fontWeight: 'bold', letterSpacing: 2, }}>
                    <div style={{ padding: '24px' }}>政治素质优</div>
                    <div style={{ padding: '0 24px 24px 24px' }}>工作业绩优</div>
                    <div style={{ padding: '0 24px 24px 24px' }}>岗位技能优</div>
                    <div style={{ padding: '0 24px 48px 24px' }}>群众评价优</div>
                  </div>
                </div>
              </div>

              {/* 中下 */}
              <div style={{ minHeight: 0 }}>
                <Page2 />
              </div>
            </div>

            <div style={{ width: "50%", display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* 右上 */}
              <div style={{ flex: 1, minHeight: 0, marginBottom: 16 }}>
                <Page3 />
              </div>

              {/* 右下 */}
              <div style={{ flex: 1, minHeight: 0 }}>
                <Page4 />
              </div>
            </div>
          </div>

          <div style={{
            height: 64,
            backgroundColor: '#a53605',
            marginTop: 12,
            fontSize: 22,
            fontWeight: 'bold',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            flexShrink: 0,
          }}>
            <div style={{
              width: 180,
              height: 2,
              backgroundColor: '#fff'
            }}></div>

            <div>牢记历史使命&nbsp;&nbsp;&nbsp;&nbsp;不负时代担当</div>

            <div style={{
              width: 180,
              height: 2,
              backgroundColor: '#fff'
            }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
