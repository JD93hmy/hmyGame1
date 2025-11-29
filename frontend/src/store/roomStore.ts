import { create } from 'zustand';

interface Player {
  socketId: string;
  username: string;
  index: number;
  isLandlord?: boolean;
  cardsCount?: number;
}

interface Card {
  id: string;
  suit: string;
  rank: string;
  value: number;
  isJoker: boolean;
}

interface GameState {
  waiting: 'waiting';
  bidding: 'bidding';
  playing: 'playing';
  ended: 'ended';
}

interface Room {
  id: string;
  name?: string;
  players: Player[];
  gameState: keyof GameState;
  playerCards: Card[][];
  bottomCards: Card[];
  landlordIndex: number;
  bids: number[];
  currentPlayerIndex: number;
  lastPlayedCards: Card[];
  lastPlayerIndex: number;
  gameResult: {
    winnerIndex: number;
    scores: number[];
    landlordIndex: number;
    finalBid: number;
  } | null;
}

interface RoomState {
  rooms: Room[];
  currentRoom: Room | null;
  isInRoom: boolean;
  
  // 房间操作
  setRooms: (rooms: Room[]) => void;
  joinRoom: (room: Room) => void;
  leaveRoom: () => void;
  updateRoom: (roomData: Partial<Room>) => void;
  
  // 游戏操作
  setGameState: (gameState: keyof GameState) => void;
  setPlayerCards: (playerCards: Card[][]) => void;
  setBottomCards: (bottomCards: Card[]) => void;
  setLandlordIndex: (landlordIndex: number) => void;
  setBids: (bids: number[]) => void;
  setCurrentPlayerIndex: (currentPlayerIndex: number) => void;
  setLastPlayedCards: (lastPlayedCards: Card[]) => void;
  setLastPlayerIndex: (lastPlayerIndex: number) => void;
  setGameResult: (gameResult: Room['gameResult']) => void;
  
  // 玩家操作
  addPlayer: (player: Player) => void;
  removePlayer: (socketId: string) => void;
  updatePlayer: (socketId: string, playerData: Partial<Player>) => void;
}

const useRoomStore = create<RoomState>((set) => ({
  rooms: [],
  currentRoom: null,
  isInRoom: false,
  
  // 房间操作
  setRooms: (rooms) => set({ rooms }),
  
  joinRoom: (room) => set({ currentRoom: room, isInRoom: true }),
  
  leaveRoom: () => set({ currentRoom: null, isInRoom: false }),
  
  updateRoom: (roomData) => set((state) => {
    if (!state.currentRoom) return state;
    return {
      currentRoom: { ...state.currentRoom, ...roomData },
    };
  }),
  
  // 游戏操作
  setGameState: (gameState) => set((state) => {
    if (!state.currentRoom) return state;
    return {
      currentRoom: { ...state.currentRoom, gameState },
    };
  }),
  
  setPlayerCards: (playerCards) => set((state) => {
    if (!state.currentRoom) return state;
    return {
      currentRoom: { ...state.currentRoom, playerCards },
    };
  }),
  
  setBottomCards: (bottomCards) => set((state) => {
    if (!state.currentRoom) return state;
    return {
      currentRoom: { ...state.currentRoom, bottomCards },
    };
  }),
  
  setLandlordIndex: (landlordIndex) => set((state) => {
    if (!state.currentRoom) return state;
    return {
      currentRoom: { ...state.currentRoom, landlordIndex },
    };
  }),
  
  setBids: (bids) => set((state) => {
    if (!state.currentRoom) return state;
    return {
      currentRoom: { ...state.currentRoom, bids },
    };
  }),
  
  setCurrentPlayerIndex: (currentPlayerIndex) => set((state) => {
    if (!state.currentRoom) return state;
    return {
      currentRoom: { ...state.currentRoom, currentPlayerIndex },
    };
  }),
  
  setLastPlayedCards: (lastPlayedCards) => set((state) => {
    if (!state.currentRoom) return state;
    return {
      currentRoom: { ...state.currentRoom, lastPlayedCards },
    };
  }),
  
  setLastPlayerIndex: (lastPlayerIndex) => set((state) => {
    if (!state.currentRoom) return state;
    return {
      currentRoom: { ...state.currentRoom, lastPlayerIndex },
    };
  }),
  
  setGameResult: (gameResult) => set((state) => {
    if (!state.currentRoom) return state;
    return {
      currentRoom: { ...state.currentRoom, gameResult },
    };
  }),
  
  // 玩家操作
  addPlayer: (player) => set((state) => {
    if (!state.currentRoom) return state;
    return {
      currentRoom: {
        ...state.currentRoom,
        players: [...state.currentRoom.players, player],
      },
    };
  }),
  
  removePlayer: (socketId) => set((state) => {
    if (!state.currentRoom) return state;
    return {
      currentRoom: {
        ...state.currentRoom,
        players: state.currentRoom.players.filter((p) => p.socketId !== socketId),
      },
    };
  }),
  
  updatePlayer: (socketId, playerData) => set((state) => {
    if (!state.currentRoom) return state;
    return {
      currentRoom: {
        ...state.currentRoom,
        players: state.currentRoom.players.map((p) =>
          p.socketId === socketId ? { ...p, ...playerData } : p
        ),
      },
    };
  }),
}));

export default useRoomStore;