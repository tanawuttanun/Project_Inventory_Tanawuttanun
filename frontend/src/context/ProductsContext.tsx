import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { API_ENDPOINTS } from '@/constants/api';

const ProductsContext = createContext<any>(null);
export const PRODUCTS_URL = API_ENDPOINTS.PRODUCTS;

export const ProductsProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth(); 

  // ฟังก์ชันดึงข้อมูลจาก API และจัดฟอร์แมตข้อมูลให้ครบทุกคอลัมน์
  const loadProducts = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch(PRODUCTS_URL, { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const rawData = await response.json();
      
      const formattedData = rawData.map((item: any) => {
        const imgUrl = item.imageUrl || item.imageurl || item.image || 'https://via.placeholder.com/200?text=No+Image';
        
        let parsedColors = ["#0A1F44", "#D4AF37", "#FFFFFF"];
        if (Array.isArray(item.colors) && item.colors.length > 0) {
          parsedColors = item.colors;
        } else if (typeof item.colors === 'string' && item.colors.trim()) {
          try {
            const parsed = JSON.parse(item.colors);
            if (Array.isArray(parsed) && parsed.length > 0) parsedColors = parsed;
          } catch (e) {}
        }

        let parsedFeatures = ["Fast Charging", "Durable", "Safe"];
        if (Array.isArray(item.features) && item.features.length > 0) {
          parsedFeatures = item.features;
        } else if (typeof item.features === 'string' && item.features.trim()) {
          try {
            const parsed = JSON.parse(item.features);
            if (Array.isArray(parsed) && parsed.length > 0) parsedFeatures = parsed;
          } catch (e) {}
        }

        return {
          id: item.id.toString(),
          name: item.name || '',
          model: item.model || 'Standard',
          capacity: item.capacity || '',
          price: Number(item.price) || 0,
          stock: item.stock !== undefined && item.stock !== null ? Number(item.stock) : 10,
          image: imgUrl,
          imageUrl: imgUrl,
          colors: parsedColors,
          features: parsedFeatures
        };
      });

      setProducts(formattedData);
    } catch (error: any) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // ฟังก์ชันเพิ่มสินค้าส่งไปยังฐานข้อมูล
  const addProduct = async (productData: any) => {
    if (!token) return false;
    try {
      const response = await fetch(PRODUCTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: productData.name,
          model: productData.model,
          capacity: productData.capacity,
          price: Number(productData.price),
          stock: Number(productData.stock),
          imageUrl: productData.imageUrl || productData.image,
          colors: productData.colors,
          features: productData.features,
        })
      });

      if (response.ok) {
        await loadProducts(); // ดึงข้อมูลใหม่มาแสดงทันที
        return true;
      }
      return false;
    } catch (error) {
      console.error("Add Product Error:", error);
      return false;
    }
  };

  // ฟังก์ชันแก้ไขสินค้าส่งไปยังฐานข้อมูล
  const updateProduct = async (id: string | number, productData: any) => {
    if (!token) return false;
    try {
      const response = await fetch(`${PRODUCTS_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: productData.name,
          model: productData.model,
          capacity: productData.capacity,
          price: Number(productData.price),
          stock: Number(productData.stock),
          imageUrl: productData.imageUrl || productData.image,
          colors: productData.colors,
          features: productData.features,
        })
      });

      if (response.ok) {
        await loadProducts(); // ดึงข้อมูลใหม่มาแสดงทันที
        return true;
      }
      return false;
    } catch (error) {
      console.error("Update Product Error:", error);
      return false;
    }
  };

  // ฟังก์ชันลบสินค้าจากฐานข้อมูล
  const deleteProduct = async (id: string | number) => {
    if (!token) return false;
    try {
      const response = await fetch(`${PRODUCTS_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await loadProducts(); // ดึงข้อมูลใหม่มาแสดงทันที
        return true;
      }
      return false;
    } catch (error) {
      console.error("Delete Product Error:", error);
      return false;
    }
  };

  return (
    <ProductsContext.Provider value={{ 
      products, 
      isLoading, 
      loadProducts,
      removeProduct: deleteProduct,
      deleteProduct, 
      addProduct,
      updateProduct,
      customProducts: [],
      removeCustomProduct: () => {} 
    }}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => useContext(ProductsContext);