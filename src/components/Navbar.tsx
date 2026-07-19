import React, { useState, useEffect } from 'react'
import { Menu, Button, Drawer, message } from 'antd'
import {
  UserOutlined,
  LogoutOutlined,
  MenuOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { logoImage } from '@/utils/images'
import { isAuthenticated, removeToken } from '@/utils/token'

const NavbarContainer = styled.nav`
  position: fixed;
  z-index: 1000;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    top: 0;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 0 16px;
  }
`

// PC 端左侧边栏
const Sidebar = styled.div<{ $collapsed: boolean }>`
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: ${props => props.$collapsed ? '64px' : '240px'};
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  transition: all 0.3s ease;

  .ant-menu {
    border-right: none;
    background: transparent;
    flex: 1;
    padding-top: 8px;
  }

  .ant-menu-inline-collapsed {
    width: 64px;
  }

  .ant-menu-item {
    transition: all 0.3s ease;
    margin: 4px 4px !important;
    border-radius: 8px;
    height: 48px;
    line-height: 48px;
  }

  .ant-menu-item:hover {
    background: rgba(102, 126, 234, 0.1) !important;
  }

  .ant-menu-item-selected {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%) !important;
    color: #667eea !important;
    font-weight: 500;
  }
`

const Logo = styled.div<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.1rem;
  font-weight: bold;
  color: #667eea;
  padding: 20px ${props => props.$collapsed ? '12px' : '20px'};
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
  justify-content: ${props => props.$collapsed ? 'center' : 'flex-start'};

  &:hover {
    transform: translateY(-2px);
  }

  img {
    width: 30px;
    height: 30px;
    border-radius: 8px;
  }

  .logo-text {
    white-space: nowrap;
    overflow: hidden;
    opacity: ${props => props.$collapsed ? 0 : 1};
    transition: opacity 0.3s ease;
  }

  @media (max-width: 768px) {
    padding: 0;
    font-size: 1rem;
    border-bottom: none;
    justify-content: flex-start;

    img {
      width: 30px;
      height: 30px;
    }

    .logo-text {
      opacity: 1;
    }
  }
`

const CollapseButton = styled.div<{ $collapsed: boolean }>`
  position: absolute;
  right: -18px;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1001;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);

  &:hover {
    background: #5a6fd6;
    transform: translateY(-50%) scale(1.1);
  }
`

const SidebarFooter = styled.div`
  padding: 16px;
  border-top: 1px solid rgba(102, 126, 234, 0.1);
`

const NavbarContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;

  @media (max-width: 768px) {
    padding: 0 16px;
  }
`

const LogoutButton = styled(Button)`
  border-radius: 20px;
  height: 36px;
  padding: 0 20px;
  font-weight: 500;
  transition: all 0.3s ease;
  width: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
`

const Navbar: React.FC<{ onCollapseChange?: (collapsed: boolean) => void }> = ({ onCollapseChange }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // 检查登录状态
    setIsLoggedIn(isAuthenticated())
  }, [])

  useEffect(() => {
    // 检查登录状态
    const checkLoginStatus = () => {
      const loginStatus = localStorage.getItem('isLoggedIn')
      setIsLoggedIn(loginStatus === 'true')
    }

    checkLoginStatus()

    // 监听存储变化
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'isLoggedIn') {
        setIsLoggedIn(e.newValue === 'true')
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const menuItems = [
    { key: '/party-basic', label: '基本情况管理' },
    { key: '/party-evaluation', label: '评议管理' },
    { key: '/party-branch-evaluation', label: '党小组评议管理' },
    { key: '/party-branch', label: '党支部管理' },
    { key: '/party-group', label: '党小组管理' },
    { key: '/party-member', label: '党员管理' },
    { key: '/party-pdf', label: '文件管理' },
  ]

  const handleMenuClick = (e: { key: string }) => {
    navigate(e.key)
    if (isMobile) {
      setDrawerVisible(false)
    }
  }

  const handleLogout = () => {
    removeToken()
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userInfo')
    setIsLoggedIn(false)
    message.success('退出成功')
    navigate('/')
  }

  const handleLogoClick = () => {
    navigate('/party-basic')
  }

  // 获取当前选中的菜单项
  const getSelectedKey = (pathname: string): string => {
    // 其他路径直接返回
    return pathname
  }

  const currentKey = getSelectedKey(location.pathname)

  const handleToggle = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    onCollapseChange?.(newCollapsed)
  }

  // 移动端视图
  if (isMobile) {
    return (
      <NavbarContainer>
        <NavbarContent>
          <Logo $collapsed={false} onClick={handleLogoClick}>
            <img src={logoImage} alt="Logo" />
            <span className="logo-text">智慧党建宣传屏系统</span>
          </Logo>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isLoggedIn && (
              <LogoutButton
                type="default"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                size="small"
              >
                退出
              </LogoutButton>
            )}
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setDrawerVisible(true)}
              style={{ fontSize: '1.5rem' }}
            />
          </div>
        </NavbarContent>

        <Drawer
          title="导航栏"
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
        >
          <Menu
            mode="inline"
            selectedKeys={[currentKey]}
            onClick={handleMenuClick}
            items={menuItems}
            style={{ borderRight: 0 }}
          />
        </Drawer>
      </NavbarContainer>
    )
  }

  // PC端视图 - 左侧边栏
  return (
    <Sidebar $collapsed={collapsed}>
      <Logo $collapsed={collapsed} onClick={handleLogoClick}>
        <img src={logoImage} alt="Logo" />
        <span className="logo-text">智慧党建宣传屏系统</span>
      </Logo>

      <Menu
        mode="inline"
        selectedKeys={[currentKey]}
        onClick={handleMenuClick}
        items={menuItems}
        inlineCollapsed={collapsed}
      />

      <SidebarFooter style={{ padding: collapsed ? '16px 8px' : '16px' }}>
        {isLoggedIn ? (
          <LogoutButton
            type="primary"
            icon={collapsed ? <LogoutOutlined /> : <><LogoutOutlined /> 退出</>}
            onClick={handleLogout}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              padding: collapsed ? '0' : undefined,
              width: collapsed ? '48px' : '100%'
            }}
          />
        ) : (
          <Button
            type="primary"
            icon={collapsed ? <UserOutlined /> : undefined}
            onClick={() => navigate('/')}
            style={{
              borderRadius: '20px',
              height: '36px',
              padding: collapsed ? '0' : '0 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              fontWeight: '500',
              width: collapsed ? '48px' : '100%'
            }}
          >
            {!collapsed && '登录'}
          </Button>
        )}
      </SidebarFooter>
      
      <CollapseButton
        $collapsed={collapsed}
        onClick={handleToggle}
      >
        {collapsed ? <RightOutlined /> : <LeftOutlined />}
      </CollapseButton>
    </Sidebar>
  )
}

export default Navbar
