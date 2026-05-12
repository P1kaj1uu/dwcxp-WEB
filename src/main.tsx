import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './assets/css/global.css'
import './index.css'
import 'antd/dist/reset.css'
import 'nprogress/nprogress.css'
import 'highlight.js/styles/github.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
