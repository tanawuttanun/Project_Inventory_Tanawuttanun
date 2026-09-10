# Inventory App (Full-Stack)

โครงสร้างโปรเจกต์ถูกแยกออกเป็น 2 ส่วนหลัก: **Frontend** และ **Backend**

```text
Inventory/
├── backend/           # Node.js + Express API & Database
├── frontend/          # Expo + React Native App
├── group-aggregator/  # Central API รวมข้อมูลสินค้าของสมาชิกทุกคนในกลุ่ม
└── analysis/          # K-Means จัดกลุ่มสินค้า + กราฟผลลัพธ์
```

---

## 🚀 วิธีการรันโปรเจกต์ (Getting Started)

### 1. ฝั่ง Backend (API Server)
```bash
cd backend
npm install
npm start
```
- API ทำงานที่พอร์ต: `3020`
- ตรวจสอบการเชื่อมต่อฐานข้อมูลอัตโนมัติ

### 2. ฝั่ง Frontend (Expo App)
```bash
cd frontend
npm install
npx expo start
```
- สามารถสลับการทดสอบระหว่าง Web, Android หรือ iOS ได้

### 3. ส่วน AI/ML (K-Means จัดกลุ่มสินค้า)
```bash
cd backend && npm run analytics     # Private API ส่งข้อมูลสินค้า + ยอดขายจริง (พอร์ต 3021)
cd group-aggregator && python aggregator.py   # รวมข้อมูลทั้งกลุ่ม (พอร์ต 6000)
cd analysis && python clustering.py           # จัดกลุ่ม + ได้กราฟใน analysis/output/
```
- วิธีติดตั้งและคำสั่งทั้งหมดอยู่ใน [`analysis/README.md`](analysis/README.md)
- **ในแอปก็มีหน้า K-Means ให้ดูสด** — เมนู → "จัดกลุ่มราคา (K-Means)" (หรือจากหน้าการเงิน)
  คำนวณบนเครื่องด้วย [`frontend/src/utils/kmeans.ts`](frontend/src/utils/kmeans.ts) ปรับค่า k ได้ทันที
  ใช้ข้อมูลสดจาก `GET /api/products` — ไม่ต้องรัน Python

---

## ⚙️ การตั้งค่า URL Server & Environment Variables
- **Backend Configuration**: ตั้งค่าที่ `backend/.env` (DB_HOST, DB_USER, DB_PASSWORD, PORT, JWT_SECRET)
- **Frontend API Endpoint**: ตั้งค่าที่ `frontend/src/constants/api.ts` เพื่อปรับเปลี่ยน Base URL ไปยัง Cloud หรือ Localhost ได้ง่ายๆ ในจุดเดียว
