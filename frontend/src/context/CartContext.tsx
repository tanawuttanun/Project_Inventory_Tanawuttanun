// src/context/CartContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { API_ENDPOINTS } from '@/constants/api';

export type CartItem = {
  id?: number | string;
  itemId?: number | string;
  product: any;
  color: string;
  quantity: number;
  exceedsStock?: boolean;
};

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  shipping: number;
  grandTotal: number;
  isLoading: boolean;
  loadCart: () => Promise<void>;
  addToCart: (product: any, color: string, quantity: number) => Promise<{ ok: boolean; message?: string }>;
  updateQuantity: (idOrProductId: string | number, colorOrQty: string | number, newQty?: number) => Promise<{ ok: boolean; message?: string }>;
  removeFromCart: (idOrProductId: string | number, color?: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  resetCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ดึงข้อมูลตะกร้าสินค้าจาก Backend API ตาม User Token
  const loadCart = useCallback(async () => {
    if (!token) {
      setItems([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(API_ENDPOINTS.CART, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        let data: any = {};
        try {
          data = await response.json();
        } catch {
          data = {};
        }
        const rawItems = Array.isArray(data.items) ? data.items : [];
        setItems(rawItems);
      }
    } catch (error) {
      console.error('Failed to load cart from backend:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // โหลดตะกร้าเมื่อ token เปลี่ยน หรือรีเซ็ตเมื่อ logout
  useEffect(() => {
    if (token) {
      loadCart();
    } else {
      setItems([]);
    }
  }, [token, loadCart]);

  // เพิ่มสินค้าลงตะกร้า (ส่งไปตรวจสอบสต็อกที่ Backend ก่อน)
  const addToCart = async (product: any, color: string, quantity: number): Promise<{ ok: boolean; message?: string }> => {
    if (!token) {
      return { ok: false, message: 'กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า' };
    }

    try {
      const response = await fetch(API_ENDPOINTS.CART, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: Number(product.id),
          color: color || '',
          quantity: Number(quantity) || 1
        })
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.ok) {
        await loadCart();
        return { ok: true };
      } else {
        let errorMsg = data.error;
        if (!errorMsg) {
          if (response.status === 404) {
            errorMsg = 'ไม่พบ Endpoint ตะกร้าสินค้าบนเซิร์ฟเวอร์ (404 Not Found - กรุณาอัปเดต Backend บน Cloud)';
          } else if (response.status === 401) {
            errorMsg = 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง';
          } else if (response.status === 500) {
            errorMsg = 'เซิร์ฟเวอร์เกิดข้อผิดพลาดภายใน (500 Internal Server Error - กรุณาตรวจสอบว่าตาราง carts ถูกสร้างใน MySQL แล้ว)';
          } else {
            errorMsg = `ไม่สามารถเพิ่มสินค้าลงตะกร้าได้ (HTTP ${response.status})`;
          }
        }
        return { ok: false, message: errorMsg };
      }
    } catch (error: any) {
      console.error('Add to cart error:', error);
      return {
        ok: false,
        message: `ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (${API_ENDPOINTS.CART}) กรุณาตรวจสอบว่าเซิร์ฟเวอร์กำลังทำงานอยู่`
      };
    }
  };


  // ปรับจำนวนสินค้าในตะกร้า (รองรับทั้ง signature เดิม และ id)
  const updateQuantity = async (
    idOrProductId: string | number,
    colorOrQty: string | number,
    newQtyParam?: number
  ): Promise<{ ok: boolean; message?: string }> => {
    if (!token) return { ok: false, message: 'Token required' };

    let targetItem: CartItem | undefined;
    let finalQty: number;

    if (typeof newQtyParam === 'number') {
      // เรียกแบบเดิม: updateQuantity(productId, color, newQty)
      const productIdStr = idOrProductId.toString();
      const colorStr = String(colorOrQty);
      targetItem = items.find(it => it.product?.id?.toString() === productIdStr && it.color === colorStr);
      finalQty = newQtyParam;
    } else {
      // เรียกแบบ: updateQuantity(itemId, newQty)
      targetItem = items.find(it => it.id?.toString() === idOrProductId.toString() || it.itemId?.toString() === idOrProductId.toString());
      finalQty = Number(colorOrQty);
    }

    if (!targetItem || (!targetItem.id && !targetItem.itemId)) {
      return { ok: false, message: 'ไม่พบรายการสินค้านี้ในตะกร้า' };
    }

    const itemId = targetItem.id || targetItem.itemId;

    try {
      const response = await fetch(`${API_ENDPOINTS.CART}/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: finalQty })
      });

      const data = await response.json();
      if (response.ok) {
        await loadCart();
        return { ok: true };
      } else {
        await loadCart(); // sync real stock
        return { ok: false, message: data.error || 'ไม่สามารถปรับจำนวนสินค้าได้' };
      }
    } catch (error) {
      console.error('Update quantity error:', error);
      return { ok: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' };
    }
  };

  // ลบสินค้าออกจากตะกร้า
  const removeFromCart = async (idOrProductId: string | number, color?: string): Promise<boolean> => {
    if (!token) return false;

    let targetItem: CartItem | undefined;
    if (color !== undefined) {
      const productIdStr = idOrProductId.toString();
      targetItem = items.find(it => it.product?.id?.toString() === productIdStr && it.color === color);
    } else {
      targetItem = items.find(it => it.id?.toString() === idOrProductId.toString() || it.itemId?.toString() === idOrProductId.toString());
    }

    const itemId = targetItem?.id || targetItem?.itemId || idOrProductId;

    try {
      const response = await fetch(`${API_ENDPOINTS.CART}/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await loadCart();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Remove from cart error:', error);
      return false;
    }
  };

  // ล้างตะกร้าทั้งหมด
  const clearCart = async (): Promise<boolean> => {
    if (!token) {
      setItems([]);
      return true;
    }

    try {
      const response = await fetch(API_ENDPOINTS.CART, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setItems([]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Clear cart error:', error);
      return false;
    }
  };

  const resetCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalPrice = items.reduce((sum, item) => sum + ((Number(item.product?.price) || 0) * (Number(item.quantity) || 0)), 0);
  const shipping = totalPrice > 1500 || totalPrice === 0 ? 0 : 50;
  const grandTotal = totalPrice + shipping;

  return (
    <CartContext.Provider value={{
      items,
      totalItems,
      totalPrice,
      shipping,
      grandTotal,
      isLoading,
      loadCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      resetCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};