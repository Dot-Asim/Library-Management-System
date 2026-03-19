import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  email: string;
  roles: string[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  setToken: (token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      setToken: (token: string) => {
        try {
          const decoded: any = jwtDecode(token);
          set({
            token,
            user: {
              id: decoded.sub,
              email: decoded.email,
              roles: decoded.roles || [],
            },
          });
        } catch (error) {
          console.error("Failed to decode token", error);
          set({ token: null, user: null });
        }
      },

      logout: () => set({ token: null, user: null }),

      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'auth-storage',
    }
  )
);
