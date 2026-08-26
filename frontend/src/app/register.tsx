// src/app/register.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_ENDPOINTS } from '../constants/api';
import { BRAND, COLORS, RADIUS, SPACING } from '../constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedUsername) {
      setError('กรุณากรอกชื่อผู้ใช้ (Username)');
      return false;
    }
    if (trimmedUsername.length < 3) {
      setError('ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
      return false;
    }

    if (!trimmedEmail) {
      setError('กรุณากรอกอีเมล');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('รูปแบบอีเมลไม่ถูกต้อง เช่น user@example.com');
      return false;
    }

    if (!password) {
      setError('กรุณากรอกรหัสผ่าน');
      return false;
    }
    if (password.length < 8) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
      return false;
    }

    if (!confirmPassword) {
      setError('กรุณายืนยันรหัสผ่าน');
      return false;
    }
    if (password !== confirmPassword) {
      setError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      setLoading(false);

      if (response.status === 201 || response.ok) {
        // เคลียร์ค่า Form
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');

        Alert.alert(
          'สมัครสมาชิกสำเร็จ',
          'บัญชีของคุณถูกสร้างเรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยชื่อผู้ใช้หรืออีเมลของคุณ',
          [
            {
              text: 'เข้าสู่ระบบ',
              onPress: () => router.replace('/login'),
            },
          ]
        );
      } else if (response.status === 409) {
        const msg = data.error || 'ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้งานแล้ว';
        setError(msg);
        Alert.alert('ข้อมูลซ้ำ', msg);
      } else if (response.status === 400) {
        const msg = data.error || 'ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
        setError(msg);
        Alert.alert('ข้อมูลไม่ถูกต้อง', msg);
      } else {
        const msg = data.error || 'ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง';
        setError(msg);
        Alert.alert('เกิดข้อผิดพลาด', msg);
      }
    } catch (err) {
      setLoading(false);
      const networkError = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ต';
      setError(networkError);
      Alert.alert('การเชื่อมต่อล้มเหลว', networkError);
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.navyDark, COLORS.navy]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* โลโก้/แบรนด์ */}
          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <Ionicons name="person-add" size={36} color={COLORS.gold} />
            </View>
            <Text style={styles.brandName}>{BRAND.name}</Text>
            <Text style={styles.productLine}>สมัครสมาชิก</Text>
            <View style={styles.goldLine} />
            <Text style={styles.tagline}>สร้างบัญชีใหม่เพื่อเริ่มต้นใช้งาน</Text>
          </View>

          {/* ฟอร์มสมัครสมาชิก */}
          <View style={styles.form}>
            {/* 1. Username */}
            <Text style={styles.label}>ชื่อผู้ใช้ (Username) *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color={COLORS.gold} />
              <TextInput
                style={styles.input}
                placeholder="อย่างน้อย 3 ตัวอักษร"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (error) setError('');
                }}
                autoCapitalize="none"
              />
            </View>

            {/* 2. Email */}
            <Text style={styles.label}>อีเมล *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={COLORS.gold} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError('');
                }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* 3. Password */}
            <Text style={styles.label}>รหัสผ่าน (Password) *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.gold} />
              <TextInput
                style={styles.input}
                placeholder="อย่างน้อย 8 ตัวอักษร"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError('');
                }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="rgba(255,255,255,0.6)"
                />
              </TouchableOpacity>
            </View>

            {/* 4. Confirm Password */}
            <Text style={styles.label}>ยืนยันรหัสผ่าน *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.gold} />
              <TextInput
                style={styles.input}
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (error) setError('');
                }}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword((s) => !s)}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="rgba(255,255,255,0.6)"
                />
              </TouchableOpacity>
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            {/* ปุ่มสมัครสมาชิก */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.navy} />
              ) : (
                <Text style={styles.submitBtnText}>สมัครสมาชิก</Text>
              )}
            </TouchableOpacity>

            {/* ลิงก์กลับหน้า Login */}
            <TouchableOpacity
              style={styles.switchAuthBtn}
              onPress={() => router.replace('/login')}
            >
              <Text style={styles.switchAuthText}>
                มีบัญชีอยู่แล้ว? <Text style={styles.switchAuthLink}>เข้าสู่ระบบ</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  brandName: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  productLine: {
    color: COLORS.gold,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  goldLine: {
    width: 44,
    height: 2,
    backgroundColor: COLORS.gold,
    marginVertical: 6,
    borderRadius: 1,
  },
  tagline: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  form: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 6,
    marginTop: SPACING.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
  },
  errorText: {
    color: '#FF8A8A',
    fontSize: 12,
    marginTop: SPACING.sm,
  },
  submitBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.sm,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  submitBtnText: {
    color: COLORS.navy,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  switchAuthBtn: {
    marginTop: SPACING.md,
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchAuthText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  switchAuthLink: {
    color: COLORS.gold,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
