// src/app/settings.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isTh, setIsTh] = useState(true);

  const handleLogout = () => {
    Alert.alert('ออกจากระบบ', 'คุณต้องการออกจากระบบใช่หรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ยืนยัน', onPress: () => logout(), style: 'destructive' },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Section */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={COLORS.gold} />
          </View>
          <View>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'user@powerpay.com'}</Text>
            <Text style={styles.roleBadge}>
              {user?.role === 'admin' ? '👑 Administrator' : '👤 Member (ผู้ใช้ทั่วไป)'}
            </Text>
          </View>
        </View>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.menuCard}>
          <View style={styles.menuRow}>
            <View style={styles.menuIcon}><Ionicons name="language" size={20} color={COLORS.navy} /></View>
            <Text style={styles.menuText}>Language (TH/EN)</Text>
            <Switch 
              value={isTh} 
              onValueChange={setIsTh} 
              trackColor={{ false: COLORS.grayText, true: COLORS.gold }}
            />
          </View>
        </View>

        {/* Account Actions */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.offWhite },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { marginRight: SPACING.md },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.navy },
  container: { padding: SPACING.lg },
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.navy, padding: SPACING.lg,
    borderRadius: RADIUS.lg, marginBottom: SPACING.xl,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.gold, marginRight: SPACING.md,
  },
  profileName: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.gold, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: RADIUS.sm, fontSize: 10, fontWeight: 'bold', color: COLORS.navy, marginTop: 6,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.grayText, marginBottom: SPACING.sm, marginLeft: 4 },
  menuCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    padding: SPACING.sm, marginBottom: SPACING.lg,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.sm,
  },
  menuIcon: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.offWhite,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  menuText: { flex: 1, fontSize: 15, color: COLORS.navy, fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: SPACING.md, gap: 8,
  },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: COLORS.danger },
});