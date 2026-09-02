import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { BRAND, COLORS, RADIUS, SPACING } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.message ?? t('auth.loginFailed'));
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
              <Ionicons name="battery-charging" size={40} color={COLORS.gold} />
            </View>
            <Text style={styles.brandName}>{BRAND.name}</Text>
            <Text style={styles.productLine}>{BRAND.productLine}</Text>
            <View style={styles.goldLine} />
            <Text style={styles.tagline}>{BRAND.tagline}</Text>
          </View>

          {/* ฟอร์ม */}
          <View style={styles.form}>
            <Text style={styles.label}>{t('auth.emailLabel')}</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={COLORS.gold} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <Text style={styles.label}>{t('auth.passwordLabel')}</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.gold} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={password}
                onChangeText={setPassword}
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

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.navy} />
              ) : (
                <Text style={styles.loginBtnText}>{t('auth.loginBtn')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchAuthBtn}
              onPress={() => router.push('/register' as any)}
            >
              <Text style={styles.switchAuthText}>
                {t('auth.noAccount')} <Text style={styles.switchAuthLink}>{t('auth.goToRegister')}</Text>
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
    paddingVertical: SPACING.xxl,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  brandName: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  productLine: {
    color: COLORS.gold,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 2,
  },
  goldLine: {
    width: 48,
    height: 2,
    backgroundColor: COLORS.gold,
    marginVertical: SPACING.sm,
    borderRadius: 1,
  },
  tagline: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
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
  loginBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.sm,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  loginBtnText: {
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
  hint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
