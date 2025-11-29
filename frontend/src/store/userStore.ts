import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  avatar?: string;
  gold: number;
  exp: number;
  level: number;
}

interface UserState {
  user: User | null;
  isLoggedIn: boolean;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

// 从localStorage恢复用户状态
const storedUser = localStorage.getItem('user');
const initialUser = storedUser ? JSON.parse(storedUser) : null;

const useUserStore = create<UserState>((set) => ({
  user: initialUser,
  isLoggedIn: !!initialUser,
  
  login: (userData) => {
    set({ user: userData, isLoggedIn: true });
    // 保存到localStorage
    localStorage.setItem('user', JSON.stringify(userData));
  },
  
  logout: () => {
    set({ user: null, isLoggedIn: false });
    // 清除localStorage
    localStorage.removeItem('user');
  },
  
  updateUser: (userData) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...userData };
      // 更新localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },
}));

export default useUserStore;