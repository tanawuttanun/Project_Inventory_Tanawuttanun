# Inventory App (Full-Stack)

โครงสร้างโปรเจกต์ถูกแยกออกเป็น 2 ส่วนหลัก: **Frontend** และ **Backend**

```text
Inventory/
├── backend/    # Node.js + Express API & Database
└── frontend/   # Expo + React Native App
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

---

## ⚙️ การตั้งค่า URL Server & Environment Variables
- **Backend Configuration**: ตั้งค่าที่ `backend/.env` (DB_HOST, DB_USER, DB_PASSWORD, PORT, JWT_SECRET)
- **Frontend API Endpoint**: ตั้งค่าที่ `frontend/src/constants/api.ts` เพื่อปรับเปลี่ยน Base URL ไปยัง Cloud หรือ Localhost ได้ง่ายๆ ในจุดเดียว
