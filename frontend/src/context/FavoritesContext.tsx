// src/context/FavoritesContext.tsx
import React, { createContext, useContext, useState } from 'react';

const FavoritesContext = createContext<any>(null);

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const toggleFavorite = (productId: string) => {
    setFavoriteIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId) // ถ้ามีอยู่แล้วให้เอาออก (เลิกกดใจ)
        : [...prev, productId]                // ถ้ายังไม่มีให้เพิ่มเข้าไป (กดใจ)
    );
  };

  return (
    <FavoritesContext.Provider value={{ favoriteIds, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);