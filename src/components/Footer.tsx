import React from 'react'
import { Typography } from 'antd'
import styled from 'styled-components'

const { Text } = Typography

const FooterContainer = styled.footer`
  background: #000;
  color: #fff;
  padding: 20px;
  margin-top: auto;
`

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;

  @media (min-width: 768px) {
    text-align: left;
  }
`

const Footer: React.FC = () => {

  return (
    <FooterContainer>
      <FooterContent>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)', marginLeft: '20px' }}>
             <span>@版权所有</span>
          </Text>
        </div>
      </FooterContent>
    </FooterContainer>
  )
}

export default Footer
