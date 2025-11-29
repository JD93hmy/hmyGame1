import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  /**
   * 连接到WebSocket服务器
   * @param url - 服务器URL
   * @returns {Promise<Socket>} Socket实例
   */
  connect(url: string = 'http://localhost:3001'): Promise<Socket> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(url, {
          transports: ['websocket'],
          timeout: 5000,
        });

        this.socket.on('connect', () => {
          console.log('WebSocket连接成功');
          resolve(this.socket!);
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket连接失败:', error);
          reject(error);
        });

        // 监听所有事件
        this.socket.onAny((event, data) => {
          console.log(`收到事件: ${event}`, data);
          const eventListeners = this.listeners.get(event);
          if (eventListeners) {
            eventListeners.forEach((listener) => {
              try {
                listener(data);
              } catch (error) {
                console.error(`处理事件 ${event} 时出错:`, error);
              }
            });
          }
        });
      } catch (error) {
        console.error('创建WebSocket连接时出错:', error);
        reject(error);
      }
    });
  }

  /**
   * 断开WebSocket连接
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      console.log('WebSocket连接已断开');
    }
  }

  /**
   * 发送事件到服务器
   * @param event - 事件名称
   * @param data - 事件数据
   */
  emit(event: string, data: any): void {
    if (!this.socket) {
      console.error('WebSocket未连接，无法发送事件:', event);
      return;
    }
    console.log(`发送事件: ${event}`, data);
    this.socket.emit(event, data);
  }

  /**
   * 添加事件监听器
   * @param event - 事件名称
   * @param listener - 监听器函数
   */
  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  /**
   * 移除事件监听器
   * @param event - 事件名称
   * @param listener - 监听器函数（可选，不提供则移除所有该事件的监听器）
   */
  off(event: string, listener?: Function): void {
    if (!this.listeners.has(event)) return;

    if (listener) {
      // 移除特定监听器
      const eventListeners = this.listeners.get(event)!;
      const index = eventListeners.indexOf(listener);
      if (index !== -1) {
        eventListeners.splice(index, 1);
      }
      // 如果该事件没有监听器了，移除该事件
      if (eventListeners.length === 0) {
        this.listeners.delete(event);
      }
    } else {
      // 移除所有该事件的监听器
      this.listeners.delete(event);
    }
  }

  /**
   * 加入房间
   * @param roomId - 房间ID
   * @param username - 用户名
   */
  joinRoom(roomId: string, username: string): void {
    this.emit('joinRoom', { roomId, username });
  }

  /**
   * 离开房间
   * @param roomId - 房间ID
   */
  leaveRoom(roomId: string): void {
    this.emit('leaveRoom', roomId);
  }

  /**
   * 发送消息
   * @param roomId - 房间ID
   * @param message - 消息内容
   */
  sendMessage(roomId: string, message: string): void {
    this.emit('sendMessage', { roomId, message });
  }

  /**
   * 开始游戏
   * @param roomId - 房间ID
   */
  startGame(roomId: string): void {
    this.emit('startGame', roomId);
  }

  /**
   * 叫地主
   * @param roomId - 房间ID
   * @param bid - 叫分（0-3）
   */
  bid(roomId: string, bid: number): void {
    this.emit('bid', { roomId, bid });
  }

  /**
   * 出牌
   * @param roomId - 房间ID
   * @param cards - 要出的牌
   */
  playCards(roomId: string, cards: any[]): void {
    this.emit('playCards', { roomId, cards });
  }

  /**
   * 不出牌
   * @param roomId - 房间ID
   */
  pass(roomId: string): void {
    this.emit('pass', roomId);
  }
}

// 导出单例实例
export default new SocketService();