// src/constants/theme.ts

export const COLORS = {
  navy: '#0A192F',        // สีฟ้าเทคโนโลยี (เข้ม)
  navyLight: '#112240',   // สีฟ้าสว่างขึ้นมานิดหน่อย
  navyDark: '#020C1B',    // สีฟ้าเข้มจัด (พื้นหลัง)
  gold: '#D4AF37',        // สีทอง Luxury
  goldDark: '#B8860B',    // สีทองเข้ม
  white: '#FFFFFF',       // สีขาว
  offWhite: '#F0F4F8',    // สีขาวอมฟ้า (สบายตา)
  grayText: '#8892B0',    // สีเทาสำหรับตัวหนังสือรอง
  border: 'rgba(212, 175, 55, 0.2)', // สีเส้นขอบ (ทองอ่อนๆ)
  danger: '#FF4B4B',      // สีแดง (แจ้งเตือน/ลบ)
  success: '#4CAF50',     // สีเขียว (สำเร็จ)
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 9999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BRAND = {
  name: 'PowerPay',
  productLine: 'SanHanSome Industry',
  tagline: 'Premium Power Bank Technology',
  currency: '฿',
};

// Compatibility exports
export const Colors: any = {
  ...COLORS,
  light: {
    text: COLORS.navy,
    background: COLORS.white,
    tint: COLORS.gold,
    icon: COLORS.grayText,
    tabIconDefault: COLORS.grayText,
    tabIconSelected: COLORS.gold,
  },
  dark: {
    text: COLORS.white,
    background: COLORS.navyDark,
    tint: COLORS.gold,
    icon: COLORS.grayText,
    tabIconDefault: COLORS.grayText,
    tabIconSelected: COLORS.gold,
  },
};
export const Spacing: any = {
  ...SPACING,
  half: 4,
  one: 8,
  two: 16,
  three: 24,
  four: 32,
  five: 40,
  six: 48,
};
export const Fonts: any = {
  regular: 'System',
  bold: 'System',
  mono: 'SpaceMono',
};
export type ThemeColor = string;
export const MaxContentWidth = 1200;