import React, { useState, useEffect } from 'react';
import { Button, Typography, Space, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import useUserStore from '../store/userStore';
import useRoomStore from '../store/roomStore';

const { Text } = Typography;

interface CardType {
  id: string;
  suit: string;
  rank: string;
  value: number;
  isJoker: boolean;
}

// AI玩家类
class AIPlayer {
  private index: number;
  
  constructor(_name: string, index: number) {
    this.index = index;
  }
  
  // 简单的AI出牌逻辑
  playCards(handCards: CardType[], lastPlayedCards: CardType[]): CardType[] {
    // 如果没有上家出牌，随机出一张牌
    if (lastPlayedCards.length === 0) {
      return [handCards[0]];
    }
    
    // 简单逻辑：尝试出比上家大的牌
    const lastCardValue = lastPlayedCards[0].value;
    const playableCards = handCards.filter(card => card.value > lastCardValue);
    
    if (playableCards.length > 0) {
      // 出最小的可出牌
      return [playableCards[0]];
    }
    
    // 无法出牌，返回空数组
    return [];
  }
  
  // 叫地主逻辑
  bid(): number {
    // 简单逻辑：随机叫分
    return Math.floor(Math.random() * 4);
  }
}

const GamePage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { currentRoom, setGameState, setPlayerCards, setBottomCards, setLandlordIndex, setBids, setCurrentPlayerIndex, setLastPlayedCards, setLastPlayerIndex, setGameResult, joinRoom } = useRoomStore();
  const [selectedCards, setSelectedCards] = useState<CardType[]>([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [isSinglePlayer, setIsSinglePlayer] = useState(false);
  const [aiPlayers, setAiPlayers] = useState<AIPlayer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [currentPlayerName, setCurrentPlayerName] = useState('');
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const timerRef = React.useRef<number | null>(null);

  // 检查当前玩家是否是自己，并更新计时器和当前玩家提示
  useEffect(() => {
    if (!currentRoom || !user) return;
    
    // 查找自己的玩家索引
    const myIndex = currentRoom.players.findIndex(p => p.username === user.username);
    const isMyTurnNow = myIndex === currentRoom.currentPlayerIndex;
    setIsMyTurn(isMyTurnNow);
    
    // 更新当前玩家名称
    const currentPlayer = currentRoom.players[currentRoom.currentPlayerIndex];
    setCurrentPlayerName(currentPlayer?.username || '未知玩家');
    
    // 重置计时器
    setTimeRemaining(30);
    
    // 清除之前的计时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // 启动新的计时器
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // 超时，自动不出牌
          clearInterval(timerRef.current!);
          if (isMyTurnNow) {
            handlePass();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentRoom, user]);

  // 初始化游戏
  useEffect(() => {
    console.log('GamePage useEffect - 开始初始化游戏');
    console.log('GamePage useEffect - roomId:', roomId);
    console.log('GamePage useEffect - user:', user);
    
    // 确保user存在，否则跳转到登录页面
    if (!user || !user.username) {
      console.log('GamePage useEffect - 没有用户信息，跳转到登录页面');
      navigate('/');
      return;
    }

    // 检查是否是单机游戏，处理roomId为undefined的情况
    const isSingle = roomId === 'singleplayer' || window.location.pathname.includes('singleplayer');
    console.log('GamePage useEffect - isSingle:', isSingle);
    setIsSinglePlayer(isSingle);

    // 强制初始化游戏，不依赖currentRoom检查
    if (isSingle) {
      // 单机游戏初始化 - 立即执行
      console.log('初始化单机游戏');
      
      // 生成牌组
      const suits = ['♠', '♥', '♣', '♦'];
      const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
      
      // 生成所有牌
      let allCards: CardType[] = [];
      
      // 生成普通牌
      for (const suit of suits) {
        for (const rank of ranks) {
          allCards.push({
            id: `${suit}${rank}`,
            suit,
            rank,
            value: ranks.indexOf(rank) + 3,
            isJoker: false
          });
        }
      }
      
      // 添加大小王
      allCards.push({
        id: '小王',
        suit: '',
        rank: '小王',
        value: 16,
        isJoker: true
      });
      allCards.push({
        id: '大王',
        suit: '',
        rank: '大王',
        value: 17,
        isJoker: true
      });
      
      // 洗牌
      const shuffleCards = (cards: CardType[]): CardType[] => {
        const shuffled = [...cards];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };
      
      allCards = shuffleCards(allCards);
      
      // 发牌
      const playerCards: CardType[][] = [[], [], []];
      const bottomCards: CardType[] = [];
      
      // 发牌：每个玩家17张，剩余3张作为底牌
      for (let i = 0; i < allCards.length; i++) {
        if (i < 51) {
          playerCards[i % 3].push(allCards[i]);
        } else {
          bottomCards.push(allCards[i]);
        }
      }
      
      // 初始化AI玩家
      const ai1 = new AIPlayer('AI-1', 1);
      const ai2 = new AIPlayer('AI-2', 2);
      setAiPlayers([ai1, ai2]);
      
      // 初始化房间状态
      const initialRoom = {
        id: 'singleplayer',
        players: [
          { socketId: 'player-0', username: user.username, index: 0 },
          { socketId: 'player-1', username: 'AI-1', index: 1 },
          { socketId: 'player-2', username: 'AI-2', index: 2 }
        ],
        gameState: 'bidding' as const,
        playerCards,
        bottomCards,
        landlordIndex: -1,
        bids: [],
        currentPlayerIndex: 0,
        lastPlayedCards: [],
        lastPlayerIndex: -1,
        gameResult: null,
      };
      
      // 直接设置房间状态
      console.log('准备调用joinRoom，房间数据:', initialRoom);
      joinRoom(initialRoom);
      console.log('单机游戏初始化完成');
    } else if (roomId) {
      // 非单机游戏模式，跳转到主页面
      console.log('非单机游戏模式，跳转到主页面');
      navigate('/main');
      message.info('当前仅支持单机游戏模式');
    }
  }, [roomId, user, navigate, joinRoom, setAiPlayers, setGameState, setPlayerCards, setBottomCards, setLandlordIndex, setBids, setCurrentPlayerIndex, setLastPlayedCards, setLastPlayerIndex, setGameResult]);

  // AI玩家回合处理
  useEffect(() => {
    if (!isSinglePlayer || !currentRoom || !user) return;
    
    // 查找自己的玩家索引
    const myIndex = currentRoom.players.findIndex(p => p.username === user.username);
    
    // 如果不是AI回合，直接返回
    if (currentRoom.currentPlayerIndex === myIndex) {
      return;
    }
    
    // AI玩家回合，延迟执行AI逻辑
    const timer = setTimeout(() => {
      handleAITurn();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isSinglePlayer, currentRoom, user]);
  
  // AI玩家回合处理
  const handleAITurn = () => {
    if (!currentRoom || !user) return;
    
    const currentPlayerIndex = currentRoom.currentPlayerIndex;
    
    if (currentRoom.gameState === 'bidding') {
      // 叫地主回合
      handleAIBid(currentPlayerIndex);
    } else if (currentRoom.gameState === 'playing') {
      // 出牌回合
      handleAIPlayCards(currentPlayerIndex);
    }
  };
  
  // AI叫地主
  const handleAIBid = (playerIndex: number) => {
    if (!currentRoom) return;
    
    // 找到对应的AI玩家
    const aiPlayer = aiPlayers.find(ai => ai['index'] === playerIndex);
    if (!aiPlayer) return;
    
    // AI叫分
    const bid = aiPlayer.bid();
    
    // 更新叫分
    const newBids = [...currentRoom.bids, bid];
    setBids(newBids);
    
    // 检查是否完成叫地主
    if (newBids.length === 3) {
      // 确定地主
      const landlordIndex = newBids.indexOf(Math.max(...newBids));
      setLandlordIndex(landlordIndex);
      
      // 地主获得底牌
      const updatedPlayerCards = [...currentRoom.playerCards];
      updatedPlayerCards[landlordIndex] = [...updatedPlayerCards[landlordIndex], ...currentRoom.bottomCards];
      setPlayerCards(updatedPlayerCards);
      
      // 开始游戏
      setGameState('playing');
      setCurrentPlayerIndex(landlordIndex);
      message.info(`${currentRoom.players[landlordIndex]?.username} 成为了地主`);
    } else {
      // 下一个玩家叫地主
      setCurrentPlayerIndex((playerIndex + 1) % 3);
    }
  };
  
  // AI出牌
  const handleAIPlayCards = (playerIndex: number) => {
    if (!currentRoom) return;
    
    // 找到对应的AI玩家
    const aiPlayer = aiPlayers.find(ai => ai['index'] === playerIndex);
    if (!aiPlayer) return;
    
    const handCards = currentRoom.playerCards[playerIndex];
    const playedCards = aiPlayer.playCards(handCards, currentRoom.lastPlayedCards);
    
    if (playedCards.length > 0) {
      // AI出牌
      const updatedPlayerCards = [...currentRoom.playerCards];
      updatedPlayerCards[playerIndex] = updatedPlayerCards[playerIndex].filter(card => 
        !playedCards.some(pc => pc.id === card.id)
      );
      
      setPlayerCards(updatedPlayerCards);
      setLastPlayedCards(playedCards);
      setLastPlayerIndex(playerIndex);
      
      // 检查游戏是否结束
      if (updatedPlayerCards[playerIndex].length === 0) {
        // 游戏结束
        const gameResult = {
          winnerIndex: playerIndex,
          scores: [0, 0, 0],
          landlordIndex: currentRoom.landlordIndex,
          finalBid: 1
        };
        
        // 计算得分
        if (playerIndex === currentRoom.landlordIndex) {
          // 地主获胜
          gameResult.scores[playerIndex] = 2;
          gameResult.scores[(playerIndex + 1) % 3] = -1;
          gameResult.scores[(playerIndex + 2) % 3] = -1;
        } else {
          // 农民获胜
          gameResult.scores[playerIndex] = 1;
          gameResult.scores[(playerIndex + 1) % 3 === currentRoom.landlordIndex ? (playerIndex + 2) % 3 : (playerIndex + 1) % 3] = 1;
          gameResult.scores[currentRoom.landlordIndex] = -2;
        }
        
        setGameResult(gameResult);
        setGameState('ended');
        message.success(`${currentRoom.players[playerIndex]?.username} 获胜！`);
      } else {
        // 下一个玩家出牌
        setCurrentPlayerIndex((playerIndex + 1) % 3);
      }
    } else {
      // AI不出牌
      setCurrentPlayerIndex((playerIndex + 1) % 3);
    }
  };

  // 选择/取消选择牌
  const handleCardClick = (card: CardType) => {
    if (!isMyTurn || currentRoom?.gameState !== 'playing') return;
    
    setSelectedCards(prev => {
      const isSelected = prev.some(c => c.id === card.id);
      if (isSelected) {
        return prev.filter(c => c.id !== card.id);
      } else {
        return [...prev, card];
      }
    });
  };
  
  // 处理鼠标悬停
  const handleCardHover = (cardId: string | null) => {
    setHoveredCardId(cardId);
  };

  // 出牌
  const handlePlayCards = () => {
    if (!currentRoom) return;
    
    if (selectedCards.length === 0) {
      message.warning('请选择要出的牌');
      return;
    }
    
    if (isSinglePlayer) {
      // 单机游戏出牌
      handleSinglePlayerPlayCards();
    } else {
      message.info('当前仅支持单机游戏模式');
    }
  };
  
  // 单机游戏出牌
  const handleSinglePlayerPlayCards = () => {
    if (!currentRoom || !user) return;
    
    const myIndex = currentRoom.players.findIndex(p => p.username === user.username);
    
    // 更新自己的牌
    const updatedPlayerCards = [...currentRoom.playerCards];
    updatedPlayerCards[myIndex] = updatedPlayerCards[myIndex].filter(card => 
      !selectedCards.some(sc => sc.id === card.id)
    );
    
    setPlayerCards(updatedPlayerCards);
    setLastPlayedCards(selectedCards);
    setLastPlayerIndex(myIndex);
    setSelectedCards([]);
    
    // 检查游戏是否结束
    if (updatedPlayerCards[myIndex].length === 0) {
      // 游戏结束，玩家获胜
      const gameResult = {
        winnerIndex: myIndex,
        scores: [2, -1, -1],
        landlordIndex: currentRoom.landlordIndex,
        finalBid: 1
      };
      
      if (myIndex !== currentRoom.landlordIndex) {
        // 农民获胜
        gameResult.scores = [1, 1, -2];
      }
      
      setGameResult(gameResult);
      setGameState('ended');
      message.success('您获胜了！');
    } else {
      // 下一个玩家出牌
      setCurrentPlayerIndex((myIndex + 1) % 3);
    }
  };

  // 不出牌
  const handlePass = () => {
    if (!currentRoom) return;
    
    if (isSinglePlayer && user) {
      // 单机游戏不出牌
      const myIndex = currentRoom.players.findIndex(p => p.username === user.username);
      setCurrentPlayerIndex((myIndex + 1) % 3);
    } else {
      message.info('当前仅支持单机游戏模式');
    }
  };

  // 叫地主
  const handleBid = (bid: number) => {
    if (!currentRoom) return;
    
    if (isSinglePlayer) {
      // 单机游戏叫地主
      const newBids = [...currentRoom.bids, bid];
      setBids(newBids);
      
      // 检查是否完成叫地主
      if (newBids.length === 3) {
        // 确定地主
        const landlordIndex = newBids.indexOf(Math.max(...newBids));
        setLandlordIndex(landlordIndex);
        
        // 地主获得底牌
        const updatedPlayerCards = [...currentRoom.playerCards];
        updatedPlayerCards[landlordIndex] = [...updatedPlayerCards[landlordIndex], ...currentRoom.bottomCards];
        setPlayerCards(updatedPlayerCards);
        
        // 开始游戏
        setGameState('playing');
        setCurrentPlayerIndex(landlordIndex);
        message.info(`${currentRoom.players[landlordIndex]?.username} 成为了地主`);
      } else {
        // 下一个玩家叫地主
        setCurrentPlayerIndex((currentRoom.currentPlayerIndex + 1) % 3);
      }
    } else {
      message.info('当前仅支持单机游戏模式');
    }
  };

  // 返回主页面
  const handleBackToMain = () => {
    navigate('/main');
  };

  // 渲染单张牌
  const renderCard = (card: CardType, isSelected: boolean = false, isBack: boolean = false) => {
    // 花色符号映射
    const suitSymbols: { [key: string]: string } = {
      '♠': '♠',
      '♥': '♥',
      '♣': '♣',
      '♦': '♦'
    };
    
    if (isBack) {
      return (
        <div 
          className="card back"
          style={{
            width: '85px',
            height: '120px',
            backgroundColor: '#1890ff',
            borderRadius: '8px',
            border: '2px solid #fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            backgroundImage: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '32px',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            🎴
          </div>
        </div>
      );
    }
    
    // 确定牌的颜色
    const isRed = card.suit === '♥' || card.suit === '♦';
    const cardColor = isRed ? '#ff4d4f' : '#000000';
    
    // 检查是否悬停
    const isHovered = hoveredCardId === card.id;
    
    return (
      <div 
        className={`card ${isSelected ? 'selected' : ''}`}
        onClick={() => handleCardClick(card)}
        onMouseEnter={() => handleCardHover(card.id)}
        onMouseLeave={() => handleCardHover(null)}
        style={{
          cursor: isMyTurn ? 'pointer' : 'default',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: `3px solid ${isSelected ? '#ff4d4f' : '#e0e0e0'}`,
          width: '85px',
          height: '120px',
          boxShadow: isSelected ? '0 8px 20px rgba(255, 77, 79, 0.6)' : isHovered ? '0 6px 16px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0,0,0,0.2)',
          transition: 'all 0.2s ease',
          transform: isSelected ? 'translateY(-15px) scale(1.1)' : isHovered ? 'translateY(-10px) scale(1.05)' : 'translateY(0) scale(1)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          zIndex: isSelected ? 100 : isHovered ? 50 : 0
        }}
      >
        {/* 左上角花色和点数 */}
        <div style={{ 
          position: 'absolute', 
          top: '8px', 
          left: '8px', 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          fontSize: '18px',
          fontWeight: 'bold',
          color: cardColor
        }}>
          <div>{card.rank}</div>
          <div style={{ fontSize: '24px' }}>{suitSymbols[card.suit] || card.suit}</div>
        </div>
        
        {/* 中间花色 */}
        <div style={{ 
          fontSize: '48px',
          color: cardColor,
          fontWeight: 'bold'
        }}>
          {suitSymbols[card.suit] || card.suit}
        </div>
        
        {/* 右下角花色和点数（旋转180度） */}
        <div style={{ 
          position: 'absolute', 
          bottom: '8px', 
          right: '8px', 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          fontSize: '18px',
          fontWeight: 'bold',
          color: cardColor,
          transform: 'rotate(180deg)'
        }}>
          <div>{card.rank}</div>
          <div style={{ fontSize: '24px' }}>{suitSymbols[card.suit] || card.suit}</div>
        </div>
        
        {/* 牌的边框 */}
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          pointerEvents: 'none'
        }}></div>
      </div>
    );
  };

  if (!user) return null;

  // 查找自己的玩家索引
  const myIndex = currentRoom?.players.findIndex(p => p.username === user.username) || 0;
  const myCards = currentRoom?.playerCards[myIndex] || [];

  return (
    <div className="game-container" style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#2c3e50', color: 'white', padding: '20px', boxSizing: 'border-box' }}>
      {/* 游戏信息 */}
      {currentRoom ? (
        <>
          {/* 出牌提示和计时器 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '20px', 
            marginBottom: '20px', 
            padding: '15px', 
            backgroundColor: currentRoom.players[currentRoom.currentPlayerIndex]?.username === user.username ? 'rgba(82, 196, 26, 0.3)' : 'rgba(255, 255, 255, 0.1)', 
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold',
                color: currentRoom.players[currentRoom.currentPlayerIndex]?.username === user.username ? '#52c41a' : '#1890ff',
                animation: 'pulse 1s infinite'
              }}>
                ⏱️
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>
                  {currentRoom.players[currentRoom.currentPlayerIndex]?.username === user.username ? '轮到您出牌' : `轮到 ${currentPlayerName} 出牌`}
                </div>
                <div style={{ fontSize: '14px', color: '#d9d9d9' }}>
                  剩余时间: {timeRemaining}秒
                </div>
              </div>
            </div>
            
            {/* 计时器进度条 */}
            <div style={{ 
              width: '200px', 
              height: '10px', 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              borderRadius: '5px',
              overflow: 'hidden'
            }}>
              <div 
                style={{ 
                  width: `${(timeRemaining / 30) * 100}%`, 
                  height: '100%', 
                  backgroundColor: timeRemaining <= 5 ? '#ff4d4f' : timeRemaining <= 10 ? '#faad14' : '#52c41a',
                  transition: 'width 1s linear'
                }}></div>
            </div>
          </div>
          
          {/* 游戏基本信息 */}
          <div className="game-info" style={{ display: 'flex', gap: '20px', marginBottom: '20px', padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
            <div className="game-info-item">
              <span>游戏模式:</span>
              <span style={{ marginLeft: '5px', fontWeight: 'bold' }}>{isSinglePlayer ? '单机游戏' : '网络游戏'}</span>
            </div>
            <div className="game-info-item">
              <span>游戏状态:</span>
              <span style={{ marginLeft: '5px', fontWeight: 'bold' }}>{currentRoom.gameState === 'waiting' ? '等待中' : currentRoom.gameState === 'bidding' ? '叫地主' : currentRoom.gameState === 'playing' ? '游戏中' : '已结束'}</span>
            </div>
            {currentRoom.landlordIndex !== -1 && (
              <div className="game-info-item">
                <span>地主:</span>
                <span style={{ marginLeft: '5px', fontWeight: 'bold', color: '#ff4d4f' }}>{currentRoom.players[currentRoom.landlordIndex]?.username || '未知'}</span>
              </div>
            )}
          </div>

          {/* 游戏主区域 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 顶部玩家区域 */}
            <div className="player-area player-top" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div className="player-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="player-avatar" style={{ 
                  width: '50px', 
                  height: '50px', 
                  borderRadius: '50%', 
                  backgroundColor: currentRoom.landlordIndex === (myIndex + 1) % 3 ? '#ff4d4f' : '#1890ff', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  fontWeight: 'bold',
                  fontSize: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  border: currentRoom.landlordIndex === (myIndex + 1) % 3 ? '3px solid #ffd700' : '3px solid #fff'
                }}>
                  {currentRoom.players[(myIndex + 1) % 3]?.username?.charAt(0) || '?'}
                </div>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{currentRoom.players[(myIndex + 1) % 3]?.username || '玩家2'}</span>
                {currentRoom.landlordIndex === (myIndex + 1) % 3 && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    backgroundColor: '#ff4d4f',
                    color: 'white',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    border: '2px solid #ffd700'
                  }}>
                    👑 地主
                  </div>
                )}
              </div>
              <div className="cards-area" style={{ display: 'flex', justifyContent: 'center', position: 'relative', height: '120px' }}>
                {/* 显示背面牌，叠加效果 */}
                {Array.from({ length: currentRoom.playerCards[(myIndex + 1) % 3]?.length || 0 }).map((_, index) => (
                  <div 
                    key={index} 
                    className="card back" 
                    style={{ 
                      position: 'absolute', 
                      width: '85px', 
                      height: '120px', 
                      backgroundColor: '#1890ff', 
                      borderRadius: '8px', 
                      border: '2px solid #fff',
                      transform: `translateX(${index * 5}px)`,
                      zIndex: index,
                      backgroundImage: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    <div style={{ 
                      position: 'absolute', 
                      top: '50%', 
                      left: '50%', 
                      transform: 'translate(-50%, -50%)',
                      color: 'white',
                      fontSize: '24px',
                      fontWeight: 'bold'
                    }}>
                      🎴
                    </div>
                  </div>
                ))}
              </div>
              <Text style={{ color: 'white' }}>剩余牌数: {currentRoom.playerCards[(myIndex + 1) % 3]?.length || 0}</Text>
            </div>

            {/* 中间区域 */}
            <div style={{ flex: 1, display: 'flex', gap: '20px' }}>
              {/* 左侧玩家区域 */}
              <div className="player-area player-left" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div className="player-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="player-avatar" style={{ 
                  width: '50px', 
                  height: '50px', 
                  borderRadius: '50%', 
                  backgroundColor: currentRoom.landlordIndex === (myIndex + 2) % 3 ? '#ff4d4f' : '#1890ff', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  fontWeight: 'bold',
                  fontSize: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  border: currentRoom.landlordIndex === (myIndex + 2) % 3 ? '3px solid #ffd700' : '3px solid #fff'
                }}>
                  {currentRoom.players[(myIndex + 2) % 3]?.username?.charAt(0) || '?'}
                </div>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{currentRoom.players[(myIndex + 2) % 3]?.username || '玩家3'}</span>
                {currentRoom.landlordIndex === (myIndex + 2) % 3 && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    backgroundColor: '#ff4d4f',
                    color: 'white',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    border: '2px solid #ffd700'
                  }}>
                    👑 地主
                  </div>
                )}
              </div>
                <div className="cards-area" style={{ display: 'flex', justifyContent: 'center', position: 'relative', height: '120px' }}>
                {/* 显示背面牌，叠加效果 */}
                {Array.from({ length: currentRoom.playerCards[(myIndex + 2) % 3]?.length || 0 }).map((_, index) => (
                  <div 
                    key={index} 
                    className="card back" 
                    style={{ 
                      position: 'absolute', 
                      width: '85px', 
                      height: '120px', 
                      backgroundColor: '#1890ff', 
                      borderRadius: '8px', 
                      border: '2px solid #fff',
                      transform: `translateX(${index * 5}px)`,
                      zIndex: index,
                      backgroundImage: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    <div style={{ 
                      position: 'absolute', 
                      top: '50%', 
                      left: '50%', 
                      transform: 'translate(-50%, -50%)',
                      color: 'white',
                      fontSize: '24px',
                      fontWeight: 'bold'
                    }}>
                      🎴
                    </div>
                  </div>
                ))}
              </div>
                <Text style={{ color: 'white' }}>剩余牌数: {currentRoom.playerCards[(myIndex + 2) % 3]?.length || 0}</Text>
              </div>

              {/* 中间出牌区域 */}
              <div className="play-area" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '20px' }}>
                {currentRoom.lastPlayedCards.length > 0 && (
                  <div className="cards-area" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    {currentRoom.lastPlayedCards.map((card) => renderCard(card, false))}
                  </div>
                )}
              </div>

              {/* 右侧玩家区域 */}
              <div className="player-area player-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div className="player-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="player-avatar" style={{ 
                  width: '50px', 
                  height: '50px', 
                  borderRadius: '50%', 
                  backgroundColor: currentRoom.landlordIndex === (myIndex + 1) % 3 ? '#ff4d4f' : '#1890ff', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  fontWeight: 'bold',
                  fontSize: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  border: currentRoom.landlordIndex === (myIndex + 1) % 3 ? '3px solid #ffd700' : '3px solid #fff'
                }}>
                  {currentRoom.players[(myIndex + 1) % 3]?.username?.charAt(0) || '?'}
                </div>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{currentRoom.players[(myIndex + 1) % 3]?.username || '玩家1'}</span>
                {currentRoom.landlordIndex === (myIndex + 1) % 3 && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    backgroundColor: '#ff4d4f',
                    color: 'white',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    border: '2px solid #ffd700'
                  }}>
                    👑 地主
                  </div>
                )}
              </div>
                <div className="cards-area" style={{ display: 'flex', justifyContent: 'center', position: 'relative', height: '120px' }}>
                {/* 显示背面牌，叠加效果 */}
                {Array.from({ length: currentRoom.playerCards[(myIndex + 1) % 3]?.length || 0 }).map((_, index) => (
                  <div 
                    key={index} 
                    className="card back" 
                    style={{ 
                      position: 'absolute', 
                      width: '85px', 
                      height: '120px', 
                      backgroundColor: '#1890ff', 
                      borderRadius: '8px', 
                      border: '2px solid #fff',
                      transform: `translateX(${index * 5}px)`,
                      zIndex: index,
                      backgroundImage: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    <div style={{ 
                      position: 'absolute', 
                      top: '50%', 
                      left: '50%', 
                      transform: 'translate(-50%, -50%)',
                      color: 'white',
                      fontSize: '24px',
                      fontWeight: 'bold'
                    }}>
                      🎴
                    </div>
                  </div>
                ))}
              </div>
                <Text style={{ color: 'white' }}>剩余牌数: {currentRoom.playerCards[(myIndex + 1) % 3]?.length || 0}</Text>
              </div>
            </div>

            {/* 叫地主区域 */}
            {currentRoom.gameState === 'bidding' && (
              <div className="bid-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '20px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
                <div className="bid-title" style={{ fontSize: '20px', fontWeight: 'bold' }}>
                  {isMyTurn ? '轮到您叫地主' : `等待 ${currentRoom.players[currentRoom.currentPlayerIndex]?.username} 叫地主`}
                </div>
                {isMyTurn && (
                  <div className="bid-buttons" style={{ display: 'flex', gap: '10px' }}>
                    <Button className="bid-button danger" onClick={() => handleBid(0)}>不叫</Button>
                    <Button className="bid-button primary" onClick={() => handleBid(1)}>1分</Button>
                    <Button className="bid-button secondary" onClick={() => handleBid(2)}>2分</Button>
                    <Button className="bid-button success" onClick={() => handleBid(3)}>3分</Button>
                  </div>
                )}
              </div>
            )}

            {/* 游戏结束区域 */}
            {currentRoom.gameState === 'ended' && currentRoom.gameResult && (
              <div className="game-over" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '20px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
                <div className="game-over-title" style={{ fontSize: '24px', fontWeight: 'bold' }}>游戏结束</div>
                <div className={`game-over-result ${currentRoom.gameResult.winnerIndex === myIndex ? '' : 'lose'}`} style={{ fontSize: '20px', fontWeight: 'bold', color: currentRoom.gameResult.winnerIndex === myIndex ? '#52c41a' : '#ff4d4f' }}>
                  {currentRoom.gameResult.winnerIndex === myIndex ? '您获胜了！' : '您失败了！'}
                </div>
                <div>
                  <Text>地主: {currentRoom.players[currentRoom.gameResult.landlordIndex]?.username}</Text>
                </div>
                <div>
                  <Text>最终叫分: {currentRoom.gameResult.finalBid}</Text>
                </div>
                <div>
                  <Button type="primary" onClick={handleBackToMain}>返回主页面</Button>
                </div>
              </div>
            )}

            {/* 底部玩家区域（自己） */}
            <div className="player-area player-bottom" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div className="player-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="player-avatar" style={{ 
                  width: '50px', 
                  height: '50px', 
                  borderRadius: '50%', 
                  backgroundColor: currentRoom.landlordIndex === myIndex ? '#ff4d4f' : '#52c41a', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  fontWeight: 'bold',
                  fontSize: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  border: currentRoom.landlordIndex === myIndex ? '3px solid #ffd700' : '3px solid #fff'
                }}>
                  {user.username.charAt(0)}
                </div>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{user.username}</span>
                {currentRoom.landlordIndex === myIndex && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    backgroundColor: '#ff4d4f',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '15px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    border: '2px solid #ffd700'
                  }}>
                    👑 地主
                  </div>
                )}
              </div>
              <div className="cards-area" style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                position: 'relative', 
                height: '140px',
                marginTop: '10px'
              }}>
                {myCards.map((card, index) => (
                  <div 
                    key={card.id} 
                    style={{ 
                      position: 'absolute', 
                      transform: `translateX(${index * 30}px) translateY(${selectedCards.some(c => c.id === card.id) ? '-10px' : '0px'})`, 
                      zIndex: index + (selectedCards.some(c => c.id === card.id) ? 100 : 0),
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {renderCard(card, selectedCards.some(c => c.id === card.id))}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                <Space>
                  <Button 
                    className="game-button primary" 
                    onClick={handlePlayCards} 
                    disabled={!isMyTurn || selectedCards.length === 0 || currentRoom.gameState !== 'playing'}
                  >
                    出牌
                  </Button>
                  <Button 
                    className="game-button secondary" 
                    onClick={handlePass} 
                    disabled={!isMyTurn || currentRoom.gameState !== 'playing' || currentRoom.lastPlayedCards.length === 0}
                  >
                    不出
                  </Button>
                  <Button 
                    className="game-button danger" 
                    onClick={handleBackToMain}
                  >
                    退出游戏
                  </Button>
                </Space>
              </div>
              <Text style={{ color: 'white', marginTop: 10 }}>剩余牌数: {myCards.length}</Text>
            </div>
          </div>
        </>
      ) : (
        <div className="loading" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', fontWeight: 'bold' }}>
          <h2>游戏加载中...</h2>
        </div>
      )}
    </div>
  );
};

export default GamePage;