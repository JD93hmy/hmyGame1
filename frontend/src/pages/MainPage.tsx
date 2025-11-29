import React, { useEffect } from 'react';
import { Button, Card, Row, Col, Typography, Space } from 'antd';
import { PlusOutlined, PlayCircleOutlined, UserOutlined, TrophyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/userStore';

const { Title, Text } = Typography;

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useUserStore();

  // 检查登录状态
  useEffect(() => {
    console.log('MainPage useEffect - isLoggedIn:', isLoggedIn, 'user:', user);
    if (!isLoggedIn || !user) {
      console.log('未登录，导航到登录页面');
      navigate('/');
      return;
    }

    console.log('已登录，用户信息:', user);
  }, [isLoggedIn, user, navigate]);

  // 快速开始游戏
  const handleQuickStart = () => {
    // 生成随机房间ID
    const roomId = `room-${Date.now()}`;
    navigate(`/room/${roomId}`);
  };

  // 创建房间
  const handleCreateRoom = () => {
    // 生成随机房间ID
    const roomId = `room-${Date.now()}`;
    navigate(`/room/${roomId}`);
  };

  // 加入房间
  const handleJoinRoom = () => {
    const roomId = prompt('请输入房间ID:');
    if (roomId) {
      navigate(`/room/${roomId}`);
    }
  };

  // 退出登录
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* 顶部导航 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 30,
        }}>
          <Title level={1} style={{ color: 'white', margin: 0 }}>
            🃏 斗地主游戏大厅
          </Title>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            color: 'white',
          }}>
            <Space>
              <UserOutlined />
              <Text strong>{user.username}</Text>
            </Space>
            <Space>
              <TrophyOutlined />
              <Text strong>金币: {user.gold}</Text>
            </Space>
            <Button type="primary" danger onClick={handleLogout}>
              退出登录
            </Button>
          </div>
        </div>

        {/* 主要功能区 */}
        <div style={{ flex: 1 }}>
          <Row gutter={[32, 32]}>
            {/* 快速开始 */}
            <Col xs={24} md={8}>
              <Card
                hoverable
                style={{
                  height: '100%',
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onClick={handleQuickStart}
              >
                <div style={{
                  textAlign: 'center',
                  padding: '40px 0',
                }}>
                  <PlayCircleOutlined style={{ fontSize: 80, color: '#52c41a', marginBottom: 20 }} />
                  <Title level={2} style={{ margin: '20px 0' }}>快速开始</Title>
                  <Text type="secondary">立即匹配玩家，开始游戏</Text>
                </div>
              </Card>
            </Col>

            {/* 单机游戏 */}
            <Col xs={24} md={8}>
              <Card
                hoverable
                style={{
                  height: '100%',
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onClick={() => navigate('/game/singleplayer')}
              >
                <div style={{
                  textAlign: 'center',
                  padding: '40px 0',
                }}>
                  <PlayCircleOutlined style={{ fontSize: 80, color: '#faad14', marginBottom: 20 }} />
                  <Title level={2} style={{ margin: '20px 0' }}>单机游戏</Title>
                  <Text type="secondary">与电脑AI对战，无需等待</Text>
                </div>
              </Card>
            </Col>

            {/* 创建房间 */}
            <Col xs={24} md={8}>
              <Card
                hoverable
                style={{
                  height: '100%',
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onClick={handleCreateRoom}
              >
                <div style={{
                  textAlign: 'center',
                  padding: '40px 0',
                }}>
                  <PlusOutlined style={{ fontSize: 80, color: '#1890ff', marginBottom: 20 }} />
                  <Title level={2} style={{ margin: '20px 0' }}>创建房间</Title>
                  <Text type="secondary">自定义房间设置，邀请好友加入</Text>
                </div>
              </Card>
            </Col>

            {/* 加入房间 */}
            <Col xs={24} md={8}>
              <Card
                hoverable
                style={{
                  height: '100%',
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onClick={handleJoinRoom}
              >
                <div style={{
                  textAlign: 'center',
                  padding: '40px 0',
                }}>
                  <UserOutlined style={{ fontSize: 80, color: '#faad14', marginBottom: 20 }} />
                  <Title level={2} style={{ margin: '20px 0' }}>加入房间</Title>
                  <Text type="secondary">输入房间ID，加入指定房间</Text>
                </div>
              </Card>
            </Col>
          </Row>

          {/* 游戏规则 */}
          <Card
            title="游戏规则"
            style={{
              marginTop: 32,
              borderRadius: 12,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div style={{ fontSize: 14, lineHeight: 2 }}>
              <p><strong>1. 游戏人数：</strong>3人（1地主，2农民）</p>
              <p><strong>2. 牌数：</strong>54张（包括大小王）</p>
              <p><strong>3. 叫地主：</strong>玩家依次叫分（1-3分），最高者成为地主，获得3张底牌</p>
              <p><strong>4. 出牌顺序：</strong>地主先出牌，然后按逆时针顺序轮流出牌</p>
              <p><strong>5. 胜负判定：</strong></p>
              <ul style={{ marginLeft: 20 }}>
                <li>地主先出完牌：地主获胜</li>
                <li>任意农民先出完牌：农民获胜</li>
              </ul>
              <p><strong>6. 牌型大小：</strong>单牌 &lt; 对子 &lt; 三带 &lt; 顺子 &lt; 连对 &lt; 飞机 &lt; 炸弹 &lt; 王炸</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MainPage;