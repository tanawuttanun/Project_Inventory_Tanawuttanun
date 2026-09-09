// นำเข้า Type สำหรับ ReactNode เพื่อใช้กำหนดชนิดข้อมูลของ Props (hint) ที่สามารถเป็นข้อความหรือ Component ได้
import type { ReactNode } from 'react';
// นำเข้า View สำหรับเป็น Container และ StyleSheet สำหรับจัดการ CSS/Style ใน React Native
import { View, StyleSheet } from 'react-native';

// นำเข้า ThemedText: คอมโพเนนต์แสดงข้อความที่ปรับสีอัตโนมัติตามธีม (Dark/Light mode)
import { ThemedText } from './themed-text';
// นำเข้า ThemedView: คอมโพเนนต์แสดงกล่องคอนเทนเนอร์ที่ปรับพื้นหลังตามธีม
import { ThemedView } from './themed-view';

// นำเข้าการตั้งค่าระยะห่าง (Spacing) จาก Theme ของแอปพลิเคชัน
import { Spacing } from '@/constants/theme';

// กำหนด Type ของ Props ที่ HintRow รับเข้ามา
type HintRowProps = {
  title?: string;     // ข้อความหัวข้อหรือคำอธิบายขั้นตอน (ค่าเริ่มต้นคือ 'Try editing')
  hint?: ReactNode;   // ข้อมูลคำใบ้หรือชื่อไฟล์โค้ดตัวอย่างที่ต้องการให้แก้ไข (ค่าเริ่มต้นคือ 'app/index.tsx')
};

/**
 * คอมโพเนนต์ HintRow:
 * ใช้สำหรับแสดงแถวคำแนะนำหรือขั้นตอนในการทดลองแก้ไขโค้ด
 * โดยฝั่งซ้ายจะแสดงหัวข้อ (title) และฝั่งขวาจะแสดงกล่องโค้ดคำใบ้ (hint)
 */
export function HintRow({ title = 'Try editing', hint = 'app/index.tsx' }: HintRowProps) {
  return (
    // คอนเทนเนอร์หลักของแถว จัดวางแบบแนวนอน และแยกซ้าย-ขวา
    <View style={styles.stepRow}>
      {/* แสดงหัวข้อขั้นตอนด้วยขนาดตัวอักษรแบบ 'small' */}
      <ThemedText type="small">{title}</ThemedText>
      
      {/* กล่องแสดงข้อความโค้ดคำใบ้ ใช้สีพื้นหลังแบบ 'backgroundSelected' เพื่อเน้นให้เด่นชัด */}
      <ThemedView type="backgroundSelected" style={styles.codeSnippet}>
        {/* ข้อความคำใบ้ ใช้สีข้อความรอง (textSecondary) */}
        <ThemedText themeColor="textSecondary">{hint}</ThemedText>
      </ThemedView>
    </View>
  );
}

// กำหนดสไตล์การจัดวาง (Styles)
const styles = StyleSheet.create({
  // จัดให้ Title และ Hint อยู่ในแถวเดียวกันในแนวนอน และดันให้อยู่ชิดขอบซ้าย-ขวา (space-between)
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // จัดกึ่งกลางแนวตั้งให้ตรงกัน
  },
  // ปรับแต่งกล่องโค้ดคำใบ้: เพิ่มมุมโค้งมนและระยะขอบด้านใน (padding)
  codeSnippet: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
});

