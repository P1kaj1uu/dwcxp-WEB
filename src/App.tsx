import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { isAuthenticated } from './utils/token'
import { ConfigProvider, Spin } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import NProgress from 'nprogress'
import Home from './pages/Home'
import Page1 from './pages/Page1'
import Page2 from './pages/Page2'
import Page3 from './pages/Page3'
import Page4 from './pages/Page4'
import PartyBasic from './pages/PartyBasic'
import PartyEvaluation from './pages/PartyEvaluation'
import PartyBranch from './pages/PartyBranch'
import PartyGroup from './pages/PartyGroup'
import PartyMember from './pages/PartyMember'
import UploadPDF from './pages/UploadPDF'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Navbar from './components/Navbar'
import { scrollToTop } from './utils/backTop'

// 公开路由
const publicRoutes = ['/']

// 配置 NProgress
NProgress.configure({
  minimum: 0.1,
  easing: 'ease',
  speed: 300,
  showSpinner: true,
  trickleSpeed: 200,
  parent: 'body'
})

const AppContent: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // 同步移动端状态
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 路由守卫：检查是否登录
  useEffect(() => {
    // 如果已登录且在登录页，跳转到首页
    if (publicRoutes.includes(location.pathname) && isAuthenticated()) {
      navigate('/home', { replace: true })
      return
    }
    // 如果不是公开路由且未登录，则跳转到登录页
    if (!publicRoutes.includes(location.pathname) && !isAuthenticated()) {
      navigate('/', { replace: true })
    }
  }, [location.pathname, navigate])

  // 初始化加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  // 路由变化时显示进度条
  useEffect(() => {
    NProgress.start()

    // 使用 requestAnimationFrame 确保进度条能正确显示
    const frame = requestAnimationFrame(() => {
      NProgress.set(0.4)
    })

    const timer = setTimeout(() => {
      NProgress.done()
      scrollToTop()
    }, 500)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
      NProgress.done()
    }
  }, [location.pathname])

  // 检查是否是登录页面
  const isLoginPage = location.pathname === '/'

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 背景动画效果 */}
        <div style={{
          position: 'absolute',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'moveBackground 20s linear infinite'
        }} />
        <style>{`
          @keyframes moveBackground {
            0% { transform: translate(0, 0); }
            100% { transform: translate(-50px, -50px); }
          }
        `}</style>
        <div style={{
          textAlign: 'center',
          zIndex: 1,
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <Spin size="large" />
          <div style={{
            marginTop: '16px',
            color: '#fff',
            fontSize: '1.1rem',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>
            加载中...
          </div>
        </div>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    )
  }

  // 登录页面不显示 Header 和 Footer
  if (isLoginPage) {
    return (
      <main style={{ flex: 1, minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<Login />} />
        </Routes>
      </main>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar onCollapseChange={setSidebarCollapsed} />
      <main style={{
        flex: 1,
        paddingLeft: isMobile ? 0 : (sidebarCollapsed ? '64px' : '240px'),
        paddingTop: isMobile ? '64px' : 0,
        transition: 'padding-left 0.3s ease, padding-top 0.3s ease'
      }}>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/page1" element={<Page1 />} />
          <Route path="/page2" element={<Page2 />} />
          <Route path="/page3" element={<Page3 />} />
          <Route path="/page4" element={<Page4 />} />
          <Route path="/party-basic" element={<PartyBasic />} />
          <Route path="/party-evaluation" element={<PartyEvaluation />} />
          <Route path="/party-branch" element={<PartyBranch />} />
          <Route path="/party-group" element={<PartyGroup />} />
          <Route path="/party-member" element={<PartyMember />} />
          <Route path="/party-pdf" element={<UploadPDF />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}

const App: React.FC = () => {

  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <AppContent />
      </Router>
    </ConfigProvider>
  )
}

export default App