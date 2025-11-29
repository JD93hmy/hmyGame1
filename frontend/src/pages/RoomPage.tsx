import React, { useEffect } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/userStore';

const RoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();

  useEffect(() => {
    // 非单机游戏模式，跳转到主页面
    message.info('当前仅支持单机游戏模式');
    navigate('/main');
  }, [navigate, user]);

  return null;
};

export default RoomPage;