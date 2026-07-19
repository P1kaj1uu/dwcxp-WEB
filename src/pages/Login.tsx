import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Checkbox, message, Space } from 'antd'
import {
  UserOutlined,
  LockOutlined,
  KeyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons'
import styled from 'styled-components'
import VerifyCode from '../components/VerifyCode'
import { logoImage } from '@/utils/images'
import { setToken } from '@/utils/token'
import { loginApi, registerApi } from '@/api/auth'
import { useNavigate } from 'react-router-dom'

// 创建气泡组件
const Bubble = styled.div<{ size: number; left: number; delay: number; popped: boolean }>`
  position: absolute;
  bottom: -100px;
  left: ${props => props.left}%;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.3));
  border-radius: 50%;
  animation: rise ${props => 4 + props.delay}s ease-in infinite;
  opacity: 0;
  pointer-events: none;
  transition: transform 0.1s ease-out, opacity 0.1s ease-out;
  ${props => props.popped && `
    animation: none;
    transform: scale(0);
    opacity: 0;
  `}

  @keyframes rise {
    0% {
      bottom: -100px;
      opacity: 0;
      transform: translateX(0) scale(1);
    }
    10% {
      opacity: 0.8;
    }
    90% {
      opacity: 0.8;
      transform: translateX(${props => Math.sin(props.delay * 10) * 30}px) scale(1);
    }
    100% {
      bottom: 100vh;
      opacity: 0;
      transform: translateX(${props => Math.sin(props.delay * 10) * 50}px) scale(1.2);
    }
  }

  /* 气泡光泽效果 */
  &::after {
    content: '';
    position: absolute;
    top: 15%;
    left: 20%;
    width: 30%;
    height: 30%;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    filter: blur(2px);
  }
`

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(45deg, #667eea, #764ba2, #f093fb, #f5576c, #667eea);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  position: relative;
  overflow: hidden;

  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  /* 动态光晕效果 */
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
    background-size: 60px 60px;
    animation: moveBackground 30s linear infinite;
  }

  @keyframes moveBackground {
    0% { transform: translate(0, 0) rotate(0deg); }
    100% { transform: translate(60px, 60px) rotate(360deg); }
  }
`

const LoginBox = styled.div`
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  position: relative;
  z-index: 1;
  padding: 32px;
  animation: boxAppear 0.6s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes boxAppear {
    from {
      opacity: 0;
      transform: translateY(30px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (max-width: 480px) {
    max-width: 100%;
    padding: 24px;
  }
`

const Logo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;

  img {
    width: 60px;
    height: 60px;
    margin-bottom: 12px;
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  h3 {
    margin: 0;
    font-size: 1.3rem;
    font-weight: bold;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 0.1em;
  }
`

const ModeSwitch = styled.div`
  text-align: center;
  margin-top: 16px;
  color: #667eea;
  cursor: pointer;
  font-size: 0.9rem;
  transition: color 0.2s;

  &:hover {
    color: #764ba2;
    text-decoration: underline;
  }
`

const Login: React.FC = () => {
  const [loginForm] = Form.useForm()
  const [registerForm] = Form.useForm()
  const [verifyCode, setVerifyCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [isAgreed, setIsAgreed] = useState(true)
  const [isLoginMode, setIsLoginMode] = useState(true)
  const navigate = useNavigate()
  const [bubbles, setBubbles] = useState(() =>
    Array.from({ length: 15 }, () => ({
      size: Math.random() * 30 + 10,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      popped: false
    }))
  )

  useEffect(() => {
    generateVerifyCode()

    // 气泡破裂效果
    const popBubbles = setInterval(() => {
      setBubbles(prev => {
        const popIndex = Math.floor(Math.random() * prev.length)
        const newBubbles = [...prev]

        // 破裂动画
        newBubbles[popIndex] = { ...newBubbles[popIndex], popped: true }

        // 重新生成该气泡
        setTimeout(() => {
          setBubbles(current => {
            const reset = [...current]
            reset[popIndex] = {
              size: Math.random() * 30 + 10,
              left: Math.random() * 100,
              delay: Math.random() * 3,
              popped: false
            }
            return reset
          })
        }, 100)

        return newBubbles
      })
    }, 2000)

    return () => clearInterval(popBubbles)
  }, [])

  const generateVerifyCode = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let code = ''
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setVerifyCode(code)
  }

  const handleLogin = async (values: any) => {
    const isCodeValid = values.code?.toUpperCase() === verifyCode.toUpperCase()

    if (!isCodeValid) {
      message.error("验证码错误")
      generateVerifyCode()
      loginForm.setFieldsValue({ code: '' })
      return
    }

    if (!isAgreed) {
      message.error("请同意协议")
      return
    }

    setLoading(true)
    try {
      const res = await loginApi({
        username: values.username,
        password: values.password
      })
      console.log('Login response:', res)
      if (res.data.code === 200) {
        setToken(res.data.data.token)
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('userInfo', JSON.stringify(res.data.data))
        message.success("登录成功")
        navigate('/party-basic')
      }
    } catch (error: any) {
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values: any) => {
    const isCodeValid = values.code?.toUpperCase() === verifyCode.toUpperCase()

    if (!isCodeValid) {
      message.error("验证码错误")
      generateVerifyCode()
      registerForm.setFieldsValue({ code: '' })
      return
    }

    if (!isAgreed) {
      message.error("请同意协议")
      return
    }

    if (values.password !== values.confirmPassword) {
      message.error("两次密码输入不一致")
      return
    }

    setLoading(true)
    try {
      const res = await registerApi({
        username: values.username,
        password: values.password,
        email: values.email
      })
      console.log('Register response:', res)
      if (res.data.code === 200) {
        message.success("注册成功")
        toggleMode()
      }
    } catch (error: any) {
      console.error('Register error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    loginForm.resetFields()
    registerForm.resetFields()
    generateVerifyCode()
  }

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode)
    loginForm.resetFields()
    registerForm.resetFields()
    generateVerifyCode()
  }

  return (
    <>
      {(
        <LoginContainer>
          {bubbles.map((bubble, index) => (
            <Bubble
              key={index}
              size={bubble.size}
              left={bubble.left}
              delay={bubble.delay}
              popped={bubble.popped}
            />
          ))}

          <LoginBox>
            <Logo>
              <img src={logoImage} alt="Logo" />
              <h3>智慧党建宣传屏系统</h3>
            </Logo>

            {isLoginMode ? (
              <Form
                form={loginForm}
                onFinish={handleLogin}
                layout="vertical"
              >
                <Form.Item
                  name="username"
                  label="用户名"
                  rules={[{ required: true, message: "请输入用户名" }]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="请输入用户名"
                    size="large"
                    autoComplete="off"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="密码"
                  rules={[
                    { required: true, message: "请输入密码" },
                    { min: 5, max: 20, message: "密码长度必须在5到20个字符之间" }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="请输入密码"
                    size="large"
                    iconRender={(visible) => (
                      visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                    )}
                  />
                </Form.Item>

                <Form.Item
                  name="code"
                  label="验证码"
                  rules={[{ required: true, message: "请输入验证码" }]}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Input
                      prefix={<KeyOutlined />}
                      placeholder="请输入验证码"
                      size="large"
                      maxLength={4}
                      style={{ flex: 1 }}
                    />
                    <div style={{ cursor: 'pointer', userSelect: 'none' }} onClick={generateVerifyCode}>
                      <VerifyCode code={verifyCode} />
                    </div>
                  </div>
                </Form.Item>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Checkbox
                      checked={isAgreed}
                      onChange={(e) => setIsAgreed(e.target.checked)}
                    >
                      同意协议
                    </Checkbox>
                  </div>
                </div>

                <Form.Item style={{ marginBottom: '12px' }}>
                  <Space style={{ width: '100%', justifyContent: 'center' }} size={8}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      style={{
                        flex: 1,
                        height: '44px',
                        fontSize: '0.95rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none'
                      }}
                    >
                      登录
                    </Button>
                    <Button
                      onClick={handleReset}
                      style={{ flex: 1, height: '44px', fontSize: '0.95rem' }}
                    >
                      重置
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            ) : (
              <Form
                form={registerForm}
                onFinish={handleRegister}
                layout="vertical"
              >
                <Form.Item
                  name="username"
                  label="用户名"
                  rules={[
                    { required: true, message: "请输入用户名" },
                    { min: 3, max: 20, message: "用户名长度必须在3-20个字符之间" }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="请输入用户名"
                    size="large"
                    autoComplete="off"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="密码"
                  rules={[
                    { required: true, message: "请输入密码" },
                    { min: 5, max: 20, message: "密码长度必须在5-20个字符之间" }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="请输入密码"
                    size="large"
                    iconRender={(visible) => (
                      visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                    )}
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label="确认密码"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: "请输入确认密码" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve()
                        }
                        return Promise.reject(new Error("两次密码输入不一致"))
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="请输入确认密码"
                    size="large"
                    iconRender={(visible) => (
                      visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                    )}
                  />
                </Form.Item>

                <Form.Item
                  name="code"
                  label="验证码"
                  rules={[{ required: true, message: "请输入验证码" }]}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Input
                      prefix={<KeyOutlined />}
                      placeholder="请输入验证码"
                      size="large"
                      maxLength={4}
                      style={{ flex: 1 }}
                    />
                    <div style={{ cursor: 'pointer', userSelect: 'none' }} onClick={generateVerifyCode}>
                      <VerifyCode code={verifyCode} />
                    </div>
                  </div>
                </Form.Item>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Checkbox
                      checked={isAgreed}
                      onChange={(e) => setIsAgreed(e.target.checked)}
                    >
                      同意协议
                    </Checkbox>
                  </div>
                </div>

                <Form.Item style={{ marginBottom: '12px' }}>
                  <Space style={{ width: '100%', justifyContent: 'center' }} size={8}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      style={{
                        flex: 1,
                        height: '44px',
                        fontSize: '0.95rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none'
                      }}
                    >
                      注册
                    </Button>
                    <Button
                      onClick={handleReset}
                      style={{ flex: 1, height: '44px', fontSize: '0.95rem' }}
                    >
                      重置
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            )}

            <ModeSwitch onClick={toggleMode}>
              {isLoginMode ? "切换到注册" : "切换到登录"}
            </ModeSwitch>
          </LoginBox>
        </LoginContainer>
      )}
    </>
  )
}

export default Login
