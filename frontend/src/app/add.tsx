// src/app/add.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND, COLORS, RADIUS, SPACING } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useProducts } from '../context/ProductsContext';

const COLOR_OPTIONS = [
  { label: 'น้ำเงิน / Navy', value: COLORS.navy },
  { label: 'ทอง / Gold', value: COLORS.gold },
  { label: 'ขาว / White', value: COLORS.white },
  { label: 'ดำ / Black', value: '#000000' },
];
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80';

export default function AddProductScreen() {
  const { user } = useAuth();
  const { products, addProduct, updateProduct } = useProducts();
  const { t, isEn } = useLanguage();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;

  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [capacity, setCapacity] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState('');
  const [features, setFeatures] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([COLORS.navy]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ดึงข้อมูลสินค้าเดิมมาแสดงในฟอร์มเมื่ออยู่ในโหมดแก้ไข
  useEffect(() => {
    if (isEditMode && products && products.length > 0) {
      const targetProduct = products.find((p: any) => p.id?.toString() === id?.toString());
      if (targetProduct) {
        setName(targetProduct.name || '');
        setModel(targetProduct.model || '');
        setCapacity(targetProduct.capacity || '');
        setPrice(targetProduct.price ? targetProduct.price.toString() : '');
        setStock(targetProduct.stock !== undefined && targetProduct.stock !== null ? targetProduct.stock.toString() : '');
        setImage(targetProduct.imageUrl || targetProduct.image || '');
        
        if (Array.isArray(targetProduct.features)) {
          setFeatures(targetProduct.features.join('\n'));
        } else if (typeof targetProduct.features === 'string') {
          setFeatures(targetProduct.features);
        } else {
          setFeatures('');
        }

        if (Array.isArray(targetProduct.colors) && targetProduct.colors.length > 0) {
          setSelectedColors(targetProduct.colors);
        } else {
          setSelectedColors([COLORS.navy]);
        }
      }
    }
  }, [id, isEditMode, products]);

  const toggleColor = (value: string) => {
    setSelectedColors((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t('adminProduct.nameRequired');
    if (!capacity.trim()) e.capacity = t('adminProduct.capacityRequired');
    const priceNum = Number(price);
    if (!price.trim() || isNaN(priceNum) || priceNum <= 0) {
      e.price = t('adminProduct.priceRequired');
    }
    const stockNum = Number(stock);
    if (!stock.trim() || isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
      e.stock = t('adminProduct.stockRequired');
    }
    if (selectedColors.length === 0) e.colors = t('adminProduct.colorsRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const resetForm = () => {
    setName(''); setModel(''); setCapacity(''); setPrice('');
    setStock(''); setImage(''); setFeatures('');
    setSelectedColors([COLORS.navy]); setErrors({});
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    const featuresList = features
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const productPayload = {
      name: name.trim(),
      model: model.trim() || 'Standard',
      capacity: capacity.trim(),
      price: Math.round(Number(price)),
      stock: Math.round(Number(stock)),
      imageUrl: image.trim() || DEFAULT_IMAGE,
      colors: selectedColors,
      features: featuresList.length > 0 ? featuresList : ['Fast Charging', 'Durable', 'Safe'],
    };

    if (isEditMode && id) {
      const success = await updateProduct(id, productPayload);
      setIsSubmitting(false);

      if (success) {
        Alert.alert(t('common.success'), `แก้ไขสินค้า "${productPayload.name}" เรียบร้อยแล้ว`, [
          { text: t('common.confirm'), onPress: () => router.push('/') },
        ]);
      } else {
        Alert.alert(t('common.error'), 'ไม่สามารถแก้ไขสินค้าได้ กรุณาลองใหม่อีกครั้ง');
      }
    } else {
      const success = await addProduct(productPayload);
      setIsSubmitting(false);

      if (success) {
        Alert.alert(t('common.success'), `เพิ่มสินค้า "${productPayload.name}" ลงฐานข้อมูลเรียบร้อยแล้ว`, [
          { text: t('home.allProducts'), onPress: () => router.push('/') },
          { text: t('adminProduct.addBtn'), onPress: resetForm, style: 'cancel' },
        ]);
      } else {
        Alert.alert(t('common.error'), 'ไม่สามารถเพิ่มสินค้าได้ กรุณาลองใหม่อีกครั้ง');
      }
    }
  };

  if (user?.role !== 'admin') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.accessDeniedWrap}>
          <View style={styles.accessDeniedIconWrap}>
            <Ionicons name="lock-closed" size={48} color={COLORS.danger} />
          </View>
          <Text style={styles.accessDeniedTitle}>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</Text>
          <Text style={styles.accessDeniedDesc}>
            เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถเพิ่มหรือแก้ไขข้อมูลสินค้าได้
          </Text>
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => router.replace('/')}
          >
            <Ionicons name="home" size={18} color={COLORS.navy} />
            <Text style={styles.homeBtnText}>{t('checkout.backToHome')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{isEditMode ? t('adminProduct.editTitle') : t('adminProduct.title')}</Text>
        <Text style={styles.subtitle}>
          {isEditMode ? t('adminProduct.editSubtitle') : t('adminProduct.subtitle')}
        </Text>

        <Field label={`${t('adminProduct.name')} *`} error={errors.name}>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="เช่น PowerPay Ultra" placeholderTextColor={COLORS.grayText} />
        </Field>
        
        <Field label={t('adminProduct.model')}>
          <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder="เช่น PP-U40" placeholderTextColor={COLORS.grayText} />
        </Field>
        
        <Field label={`${t('adminProduct.capacity')} *`} error={errors.capacity}>
          <TextInput style={styles.input} value={capacity} onChangeText={setCapacity} placeholder="เช่น 40,000mAh" placeholderTextColor={COLORS.grayText} />
        </Field>

        <View style={styles.row}>
          <Field label={`${t('adminProduct.price')} *`} error={errors.price} style={{ flex: 1 }}>
            <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="1990" placeholderTextColor={COLORS.grayText} keyboardType="numeric" />
          </Field>
          <View style={{ width: SPACING.md }} />
          <Field label={`${t('adminProduct.stock')} *`} error={errors.stock} style={{ flex: 1 }}>
            <TextInput style={styles.input} value={stock} onChangeText={setStock} placeholder="50" placeholderTextColor={COLORS.grayText} keyboardType="numeric" />
          </Field>
        </View>

        <Field label={t('adminProduct.image')}>
          <TextInput style={styles.input} value={image} onChangeText={setImage} placeholder="https://..." placeholderTextColor={COLORS.grayText} autoCapitalize="none" />
        </Field>

        {!!(image || true) && (
          <Image source={{ uri: image.trim() || DEFAULT_IMAGE }} style={styles.preview} />
        )}

        <Field label={t('adminProduct.features')}>
          <TextInput style={[styles.input, styles.textArea]} value={features} onChangeText={setFeatures} placeholder="ชาร์จเร็ว 65W&#10;จอดิจิตอลแสดงเปอร์เซ็นต์" placeholderTextColor={COLORS.grayText} multiline numberOfLines={4} />
        </Field>

        <Text style={styles.label}>{t('adminProduct.colors')} *</Text>
        <View style={styles.colorOptionRow}>
          {COLOR_OPTIONS.map((c) => {
            const active = selectedColors.includes(c.value);
            return (
              <TouchableOpacity key={c.value} style={[styles.colorOption, active && styles.colorOptionActive]} onPress={() => toggleColor(c.value)}>
                <View style={[styles.colorSwatch, { backgroundColor: c.value }]} />
                <Text style={styles.colorOptionText}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {!!errors.colors && <Text style={styles.errorText}>{errors.colors}</Text>}

        <TouchableOpacity 
          style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Ionicons name={isEditMode ? "save" : "add-circle"} size={18} color={COLORS.navy} />
          <Text style={styles.submitText}>
            {isSubmitting 
              ? '...' 
              : (isEditMode ? t('adminProduct.save') : t('adminProduct.addBtn'))}
          </Text>
        </TouchableOpacity>


        {isEditMode && (
          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={() => router.push('/')}
          >
            <Text style={styles.cancelText}>ยกเลิกและกลับหน้าแรก</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, error, children, style }: { label: string; error?: string; children: React.ReactNode; style?: any; }) {
  return (
    <View style={[{ marginBottom: SPACING.md }, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.offWhite },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.navy },
  subtitle: { fontSize: 12, color: COLORS.grayText, marginTop: 4, marginBottom: SPACING.lg },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.navy, marginBottom: 6 },
  input: { backgroundColor: COLORS.white, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, height: 46, color: COLORS.navy, fontSize: 14 },
  textArea: { height: 90, paddingTop: 10, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  errorText: { color: COLORS.danger, fontSize: 11, marginTop: 4 },
  preview: { width: '100%', height: 140, borderRadius: RADIUS.md, marginBottom: SPACING.md, resizeMode: 'cover' },
  colorOptionRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.sm },
  colorOption: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
  colorOptionActive: { borderColor: COLORS.gold, backgroundColor: '#FFF8E7' },
  colorSwatch: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: COLORS.border },
  colorOptionText: { fontSize: 12, color: COLORS.navy },
  submitBtn: { flexDirection: 'row', gap: 8, backgroundColor: COLORS.gold, borderRadius: RADIUS.sm, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.md },
  submitText: { color: COLORS.navy, fontWeight: '800', fontSize: 14 },
  cancelBtn: { alignItems: 'center', justifyContent: 'center', height: 44, marginTop: SPACING.sm },
  cancelText: { color: COLORS.grayText, fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
  accessDeniedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  accessDeniedIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 75, 75, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  accessDeniedDesc: {
    fontSize: 14,
    color: COLORS.grayText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
  },
  homeBtnText: {
    color: COLORS.navy,
    fontWeight: '700',
    fontSize: 14,
  },
});