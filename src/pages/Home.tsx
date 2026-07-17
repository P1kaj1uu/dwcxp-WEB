import React from "react";
import Page1 from "@/pages/Page1";
import Page2 from "@/pages/Page2";
import Page3 from "@/pages/Page3";
import Page4 from "@/pages/Page4";

const Home: React.FC = () => {

  return (
    <div
      style={{
        height: "100vh",
        minHeight: "100vh",
      }}
    >
      <div
        className="w-full rounded-lg p-4 gap-4"
        style={{
          backgroundColor: "#fff",
          display: "flex",
        }}
      >
        {/* 左边 */}
        <div style={{ width: "33%" }}>
          <Page1 />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '66%' }}>
          <div className="gap-4" style={{ display: 'flex' }}>
            <div style={{ width: "50%" }}>
              {/* 中上 */}
              <div className="flex align-items" style={{ justifyContent: 'space-between', gap: '12px', marginBottom: '24px' }}>
                <div className="flex-1" style={{ textAlign: 'center', border: '1px solid #b5b6b5' }}>
                  <div style={{
                    backgroundColor: '#da2129', color: 'rgb(251, 191, 36)', fontSize: '26px', fontWeight: 'bold', letterSpacing: '2px', textShadow: 'rgba(0, 0, 0, 0.3) 1px 1px 2px', height: '50px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>四强</div>
                  <div style={{ color: '#b4360c', fontSize: '26px', fontWeight: 'bold', letterSpacing: '2px', }}>
                    <div style={{ padding: '20px' }}>支部班子强</div>
                    <div style={{ padding: '0 20px 20px 20px' }}>党员队伍强</div>
                    <div style={{ padding: '0 20px 20px 20px' }}>基础工作强</div>
                    <div style={{ padding: '0 20px 60px 20px' }}>堡垒作用强</div>
                  </div>
                </div>

                <div className="flex-1" style={{ textAlign: 'center', border: '1px solid #b5b6b5' }}>
                  <div style={{
                    backgroundColor: '#da2129', color: 'rgb(251, 191, 36)', fontSize: '26px', fontWeight: 'bold', letterSpacing: '2px', textShadow: 'rgba(0, 0, 0, 0.3) 1px 1px 2px', height: '50px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>四优</div>
                  <div style={{ color: '#b4360c', fontSize: '26px', fontWeight: 'bold', letterSpacing: '2px', }}>
                    <div style={{ padding: '20px' }}>政治素质优</div>
                    <div style={{ padding: '0 20px 20px 20px' }}>工作业绩优</div>
                    <div style={{ padding: '0 20px 20px 20px' }}>岗位技能优</div>
                    <div style={{ padding: '0 20px 60px 20px' }}>群众评价优</div>
                  </div>
                </div>
              </div>

              {/* 中下 */}
              <div>
                <Page2 />
              </div>
            </div>

            <div style={{ width: "50%" }}>
              {/* 右上 */}
              <div style={{ marginBottom: 20 }}>
                <Page3 />
              </div>

              {/* 右下 */}
              <div>
                <Page4 />
              </div>
            </div>
          </div>

          <div style={{
            height: '80px',
            backgroundColor: '#a53605',
            marginTop: '20px',
            fontSize: '26px',
            fontWeight: 'bold',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px'  // 控制线与文字之间的间距
          }}>
            <div style={{
              width: '220px',
              height: '2px',
              backgroundColor: '#fff'
            }}></div>

            <div>牢记历史使命&nbsp;&nbsp;&nbsp;&nbsp;不负时代担当</div>

            <div style={{
              width: '220px',
              height: '2px',
              backgroundColor: '#fff'
            }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
