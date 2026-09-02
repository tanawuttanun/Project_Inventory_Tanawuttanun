// src/context/FavoritesContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { API_ENDPOINTS } from '@/constants/api';

interface FavoritesContextType {
  favoriteIds: string[];
  favoriteProducts: any[];
  isLoading: boolean;
  loadFavorites: () => Promise<void>;
  toggleFavorite: (productId: string | number) => Promise<boolean>;
  resetFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ดึงรายการโปรดจาก Backend API ตาม User Token
  const loadFavorites = useCallback(async () => {
    if (!token) {
      setFavoriteIds([]);
      setFavoriteProducts([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(API_ENDPOINTS.FAVORITES, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const ids = Array.isArray(data.favoriteIds) ? data.favoriteIds : [];
        const prods = Array.isArray(data.products) ? data.products : [];
        setFavoriteIds(ids);
        setFavoriteProducts(prods);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // โหลดรายการโปรดเมื่อ token เปลี่ยนแปลง
  useEffect(() => {
    if (token) {
      loadFavorites();
    } else {
      setFavoriteIds([]);
      setFavoriteProducts([]);
    }
  }, [token, loadFavorites]);

  // กดสลับเพิ่ม/ลบ รายการโปรด ผ่าน Backend API
  const toggleFavorite = async (productId: string | number): Promise<boolean> => {
    const pIdStr = productId.toString();
    if (!token) return false;

    // Optimistic update
    const willBeFav = !favoriteIds.includes(pIdStr);
    setFavoriteIds(prev =>
      willBeFav ? [...prev, pIdStr] : prev.filter(id => id !== pIdStr)
    );

    try {
      const response = await fetch(API_ENDPOINTS.FAVORITES_TOGGLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: Number(productId) })
      });

      if (response.ok) {
        const data = await response.json();
        const isFav = !!data.favorited;
        setFavoriteIds(prev =>
          isFav ? (prev.includes(pIdStr) ? prev : [...prev, pIdStr]) : prev.filter(id => id !== pIdStr)
        );
        loadFavorites(); // ซิงค์รายการสินค้าเต็ม
        return isFav;
      } else {
        // Revert on error
        loadFavorites();
        return !willBeFav;
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      loadFavorites();
      return !willBeFav;
    }
  };

  const resetFavorites = () => {
    setFavoriteIds([]);
    setFavoriteProducts([]);
  };

  return (
    <FavoritesContext.Provider value={{
      favoriteIds,
      favoriteProducts,
      isLoading,
      loadFavorites,
      toggleFavorite,
      resetFavorites
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};