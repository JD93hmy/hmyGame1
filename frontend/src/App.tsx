import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'

// 页面组件
import LoginPage from './pages/LoginPage'
import MainPage from './pages/MainPage'
import RoomPage from './pages/RoomPage'
import GamePage from './pages/GamePage'

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/main" element={<MainPage />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
          <Route path="/game/:roomId" element={<GamePage />} />
          <Route path="/game/singleplayer" element={<GamePage />} />
        </Routes>
      </Router>
    </ConfigProvider>
  )
}

export default App