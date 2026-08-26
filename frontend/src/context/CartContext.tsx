// src/context/CartContext.tsx
import React, { createContext, useContext, useState } from 'react';

export type CartItem = { product: any; color: string; quantity: number };

const CartContext = createContext<any>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: any, color: string, quantity: number) => {
    setItems(prev => {
      const existingItem = prev.find(item => item.product.id === product.id && item.color === color);
      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id && item.color === color
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, color, quantity }];
    });
  };

  const updateQuantity = (productId: string, color: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId, color);
      return;
    }
    setItems(prev => prev.map(item =>
      item.product.id === productId && item.color === color
        ? { ...item, quantity: newQty }
        : item
    ));
  };

  const removeFromCart = (productId: string, color: string) => {
    setItems(prev => prev.filter(item => !(item.product.id === productId && item.color === color)));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, totalItems, totalPrice, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);