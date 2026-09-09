// นำเข้า Image จาก expo-image เพื่อเพิ่มประสิทธิภาพการโหลดและแคชรูปภาพ
import { Image } from 'expo-image';
// นำเข้าโมดูลจัดการหน้า Splash Screen ของ Expo (ใช้ควบคุมการซ่อนหน้าจอโหลดเริ่มต้น)
import * as SplashScreen from 'expo-splash-screen';
// นำเข้า useState จาก React เพื่อใช้จัดการ State สถานะการแสดงผลและแอนิเมชัน
import { useState } from 'react';
// นำเข้าเครื่องมือจาก react-native สำหรับหาขนาดหน้าจอ, จัดการสไตล์ และคอนเทนเนอร์ View
import { Dimensions, StyleSheet, View } from 'react-native';
// นำเข้าเครื่องมือสร้างแอนิเมชันประสิทธิภาพสูง (Reanimated) เช่น Easing และ Keyframe
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
// นำเข้า scheduleOnRN จาก react-native-worklets เพื่อส่งคำสั่งจาก UI Thread กลับมายัง JS Thread (React Native)
import { scheduleOnRN } from 'react-native-worklets';

// คำนวณอัตราส่วนการขยายเริ่มต้น (Initial Scale Factor) โดยคำนวณจากความสูงของหน้าจอหารด้วย 90
// เพื่อให้ภาพ/พื้นหลังขยายเต็มหน้าจอในตอนเริ่มต้นก่อนจะย่อลงมา
const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;

// กำหนดระยะเวลา (Duration) ในการเล่นแอนิเมชันหลัก: 600 มิลลิวินาที (0.6 วินาที)
const DURATION = 600;

/**
 * คอมโพเนนต์ AnimatedSplashOverlay:
 * หน้าจอ Overlay ซ้อนทับที่จะแสดงโลโก้ระหว่างการเปิดแอป
 * และจะค่อยๆ จางหายไป (Fade Out) อย่างนุ่มนวลเมื่อแอปพร้อมทำงาน
 */
export function AnimatedSplashOverlay() {
  // สถานะควบคุมว่าให้เริ่มเล่นแอนิเมชัน Fade out หรือยัง
  const [animate, setAnimate] = useState(false);
  // สถานะควบคุมการแสดงผลของคอมโพเนนต์ (เมื่อแอนิเมชันจบ จะเปลี่ยนเป็น false เพื่อ unmount ออก)
  const [visible, setVisible] = useState(true);

  // หาก visible เป็น false จะไม่เรนเดอร์อะไรเลย (คืนค่า null)
  if (!visible) return null;

  // กำหนดลำดับ Keyframe ของแอนิเมชัน Splash Screen
  const splashKeyframe = new Keyframe({
    // ที่ 0% (เริ่มต้น): ขนาดปกติ (scale: 1) และมองเห็นชัดเจน 100% (opacity: 1)
    0: {
      transform: [{ scale: 1 }],
      opacity: 1,
    },
    // ที่ 20%: ยังคงมองเห็นชัดเจนเต็มที่ (opacity: 1)
    20: {
      opacity: 1,
    },
    // ที่ 70%: เริ่มจางลงจนโปร่งแสง (opacity: 0) โดยใช้เอฟเฟกต์เด้งแบบ elastic (0.7)
    70: {
      opacity: 0,
      easing: Easing.elastic(0.7),
    },
    // ที่ 100% (สิ้นสุด): โปร่งแสงสมบูรณ์ (opacity: 0) และคงขนาดไว้
    100: {
      opacity: 0,
      transform: [{ scale: 1 }],
      easing: Easing.elastic(0.7),
    },
  });

  // คอมโพเนนต์รูปภาพโลโก้ Expo ที่จะแสดงตรงกลาง
  const image = <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />;

  // หาก animate เป็น true จะเรนเดอร์ Animated.View ที่เล่น Keyframe fade-out
  return animate ? (
    <Animated.View
      // กำหนดแอนิเมชันตอนเข้า (entering) พร้อมตั้ง callback เมื่อแอนิเมชันจบ
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet'; // ทำงานบน UI Thread
        if (finished) {
          // สั่งให้ JS Thread อัปเดต state visible เป็น false เพื่อซ่อนคอมโพเนนต์นี้
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}>
      {image}
    </Animated.View>
  ) : (
    // หากยังไม่เริ่ม animate ให้แสดง View ธรรมดารอไว้ก่อน
    <View
      // เมื่อ Layout แสดงผลบนหน้าจอเสร็จสมบูรณ์
      onLayout={() => {
        // สั่งซ่อน Splash Screen ดั้งเดิมของ Native OS
        SplashScreen.hideAsync().finally(() => {
          // เริ่มเล่นแอนิเมชัน Fade out ต่อทันที
          setAnimate(true);
        });
      }}
      style={styles.splashOverlay}>
      {image}
    </View>
  );
}

// Keyframe สำหรับแอนิเมชันการย่อขยายของพื้นหลัง (Background)
// ค่อยๆ ย่อขนาดจากขนาดใหญ่มาก (INITIAL_SCALE_FACTOR) ลงมาเป็นขนาดปกติ (scale: 1) พร้อมเอฟเฟกต์เด้งดึ๋ง
const keyframe = new Keyframe({
  0: {
    transform: [{ scale: INITIAL_SCALE_FACTOR }], // เริ่มต้นขนาดใหญ่เต็มจอ
  },
  100: {
    transform: [{ scale: 1 }], // สิ้นสุดที่ขนาดปกติ
    easing: Easing.elastic(0.7), // การเคลื่อนไหวแบบเด้งดึ๋ง
  },
});

// Keyframe สำหรับแอนิเมชันของตัวโลโก้ (Logo)
// เริ่มต้นด้วยขนาดใหญ่ 1.3 เท่า และมองไม่เห็น (opacity: 0) จากนั้นค่อยๆ ปรากฏและย่อลงมาเป็นขนาดปกติ
const logoKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
  },
  40: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
    easing: Easing.elastic(0.7),
  },
  100: {
    opacity: 1, // ปรากฏขึ้นเต็มที่
    transform: [{ scale: 1 }], // ขนาดปกติ
    easing: Easing.elastic(0.7),
  },
});

// Keyframe สำหรับแอนิเมชันแสงเรือง (Glow Effect) หมุนวนรอบโลโก้
// หมุนแกน Z จาก 0 องศา ไปถึง 7200 องศา (หมุนวนทั้งหมด 20 รอบ)
const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: '0deg' }],
  },
  100: {
    transform: [{ rotateZ: '7200deg' }],
  },
});

/**
 * คอมโพเนนต์ AnimatedIcon:
 * ไอคอนโลโก้ที่ขยับได้ ประกอบด้วย 3 ชั้น:
 * 1. แสงเรืองด้านหลังที่หมุนวนช้า ๆ (Glow)
 * 2. พื้นหลังรูปทรงมนที่มีการย่อขนาดเด้งดึ๋ง (Background)
 * 3. โลโก้ Expo ตรงกลางที่ปรากฏขึ้นมาพร้อมเอฟเฟกต์เด้ง (Logo)
 */
export function AnimatedIcon() {
  return (
    // คอนเทนเนอร์หลักของไอคอน
    <View style={styles.iconContainer}>
      {/* ชั้นที่ 1: แสงเรืองด้านหลัง หมุนวนนาน 4 นาที (60 * 1000 * 4 ms) */}
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={styles.glow}>
        <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>

      {/* ชั้นที่ 2: พื้นหลังสี Gradient สีฟ้า ย่อขนาดเด้งดึ๋งลงมาเป็นเวลา 600ms */}
      <Animated.View entering={keyframe.duration(DURATION)} style={styles.background} />
      
      {/* ชั้นที่ 3: โลโก้รูป Expo ปรากฏขึ้นมาตรงกลาง */}
      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />
      </Animated.View>
    </View>
  );
}

// กำหนดสไตล์การแสดงผลของคอมโพเนนต์ทั้งหมด
const styles = StyleSheet.create({
  // จัดรูปภาพโลโก้ให้อยู่กึ่งกลาง
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // สไตล์ของแสงเรืองด้านหลัง ขนาด 201x201 และจัดแบบ absolute ซ้อนไว้ใต้โลโก้
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  // คอนเทนเนอร์ของไอคอน ขนาด 128x128 จัดกึ่งกลางทั้งแนวตั้งและแนวนอน
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100, // กำหนดลำดับชั้นให้อยู่เหนือเลเยอร์อื่น
  },
  // ขนาดรูปภาพโลโก้ Expo: กว้าง 76 สูง 71
  image: {
    width: 76,
    height: 71,
  },
  // พื้นหลังกล่องมน: รัศมีมุมโค้ง 40, ใช้สี Gradient ฟ้าเข้มไปฟ้าสว่าง, ซ้อนแบบ absolute
  background: {
    borderRadius: 40,
    experimental_backgroundImage: `linear-gradient(180deg, #3C9FFE, #0274DF)`,
    width: 128,
    height: 128,
    position: 'absolute',
  },
  // เลเยอร์หน้าจอ Splash Screen ซ้อนทับเต็มหน้าจอ (absoluteFill) ด้วยสีฟ้า #208AEF และ zIndex 1000
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});

