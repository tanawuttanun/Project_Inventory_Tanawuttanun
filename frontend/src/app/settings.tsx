// src/app/settings.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { resetCart } = useCart();
  const { resetFavorites } = useFavorites();
  const { isEn, toggleLanguage, t } = useLanguage();

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    resetCart();
    resetFavorites();
    await logout();
    setLogoutModalVisible(false);
    setIsLoggingOut(false);
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={COLORS.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'user@powerpay.com'}</Text>
            <Text style={styles.roleBadge}>
              {user?.role === 'admin' ? t('settings.adminRole') : t('settings.memberRole')}
            </Text>
          </View>
        </View>

        {/* Orders Section */}
        <Text style={styles.sectionTitle}>{t('settings.ordersSection')}</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/orders')}>
            <View style={styles.menuIcon}>
              <Ionicons name="receipt-outline" size={20} color={COLORS.navy} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuText}>{t('settings.orderHistory')}</Text>
              <Text style={styles.menuSubText}>{t('settings.orderHistoryDesc')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.grayText} />
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <Text style={styles.sectionTitle}>{t('settings.preferences')}</Text>
        <View style={styles.menuCard}>
          <View style={styles.menuRow}>
            <View style={styles.menuIcon}>
              <Ionicons name="language" size={20} color={COLORS.navy} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuText}>{t('settings.languageLabel')}</Text>
              <Text style={styles.menuSubText}>
                {isEn ? 'Current: English (EN)' : 'ปัจจุบัน: ภาษาไทย (TH)'}
              </Text>
            </View>
            <Switch
              value={isEn}
              onValueChange={toggleLanguage}
              trackColor={{ false: '#CBD5E1', true: COLORS.gold }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        {/* Account Actions Section */}
        <Text style={styles.sectionTitle}>{t('settings.accountSection')}</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => setLogoutModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
            <Text style={styles.logoutText}>{t('settings.logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal (Works seamlessly on Web, Android, iOS) */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="log-out-outline" size={32} color={COLORS.danger} />
            </View>

            <Text style={styles.modalTitle}>{t('settings.logoutConfirmTitle')}</Text>
            <Text style={styles.modalSub}>{t('settings.logoutConfirmMsg')}</Text>

            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setLogoutModalVisible(false)}
                disabled={isLoggingOut}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmLogout}
                disabled={isLoggingOut}
              >
                <Text style={styles.modalConfirmText}>
                  {isLoggingOut ? '...' : t('settings.logout')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.offWhite },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { marginRight: SPACING.md },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.navy },
  container: { padding: SPACING.lg, paddingBottom: 40 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xl,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    marginRight: SPACING.md,
  },
  profileName: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.navy,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.grayText,
    marginBottom: SPACING.sm,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.xs,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuText: { fontSize: 15, color: COLORS.navy, fontWeight: '700' },
  menuSubText: { fontSize: 12, color: COLORS.grayText, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    gap: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '800', color: COLORS.danger },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 31, 68, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    color: COLORS.grayText,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.offWhite,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  modalConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },
});