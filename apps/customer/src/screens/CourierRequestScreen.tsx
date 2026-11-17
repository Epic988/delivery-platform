import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { MapPicker } from '../components/MapPicker';
import type { RootStackParamList } from '../types';

type PackageSize = 'ENVELOPE' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'CUSTOM';

const COPY = {
  en: {
    title: 'Courier request',
    subtitle: 'Send a parcel between two addresses',
    sectionSender: 'Sender',
    sectionRecipient: 'Recipient',
    sectionPackage: 'Package',
    sectionRoute: 'Route',
    senderName: 'Sender name',
    senderPhone: 'Sender phone (+249...)',
    recipientName: 'Recipient name',
    recipientPhone: 'Recipient phone (+249...)',
    packageDescription: 'Package description',
    packageCategory: 'Package category',
    packageSizeLabel: 'Package size',
    pickupAddress: 'Pickup address',
    destinationAddress: 'Destination address',
    quoteBtn: 'Get quote',
    createBtn: 'Create order',
    backHome: 'Back to home',
    quoteLabel: 'Estimated price: ',
    quoteProvisional: 'Final price depends on distance between pickup and destination.',
    currency: 'SDG',
    errSenderName: 'Enter sender name',
    errSenderPhone: 'Enter sender phone',
    errRecipientName: 'Enter recipient name',
    errRecipientPhone: 'Enter recipient phone',
    errPackageDesc: 'Describe the package',
    errPackageCat: 'Enter package category',
    errPickup: 'Enter pickup address',
    errDestination: 'Enter destination address',
    errPickupLocation: 'Pick the pickup location on the map',
    errDestLocation: 'Pick the destination location on the map',
    errGeneric: 'Something went wrong. Please try again.',
    errQuote: 'Failed to fetch quote',
    errCreate: 'Failed to create order. Check all fields; phone must start with +249.',
    successPrefix: 'Order created. Number: ',
    sizeEnvelope: 'Envelope',
    sizeSmall: 'Small',
    sizeMedium: 'Medium',
    sizeLarge: 'Large',
    sizeCustom: 'Custom',
    pickLocation: 'Pick on map',
    changeLocation: 'Change location',
    pickupMapTitle: 'Pickup location',
    destMapTitle: 'Destination location',
    mapHint: 'Tap on the map to place a marker',
    mapConfirm: 'Confirm location',
    mapCancel: 'Cancel',
  },
  ar: {
    title: 'طلب توصيل',
    subtitle: 'أرسل طرداً بين عنوانين',
    sectionSender: 'المرسل',
    sectionRecipient: 'المستلم',
    sectionPackage: 'الطرد',
    sectionRoute: 'المسار',
    senderName: 'اسم المرسل',
    senderPhone: 'هاتف المرسل (+249...)',
    recipientName: 'اسم المستلم',
    recipientPhone: 'هاتف المستلم (+249...)',
    packageDescription: 'وصف الطرد',
    packageCategory: 'فئة الطرد',
    packageSizeLabel: 'حجم الطرد',
    pickupAddress: 'عنوان الاستلام',
    destinationAddress: 'عنوان التوصيل',
    quoteBtn: 'احسب السعر',
    createBtn: 'إنشاء الطلب',
    backHome: 'العودة للرئيسية',
    quoteLabel: 'السعر التقديري: ',
    quoteProvisional: 'السعر النهائي يعتمد على المسافة بين موقعي الاستلام والتوصيل.',
    currency: 'SDG',
    errSenderName: 'أدخل اسم المرسل',
    errSenderPhone: 'أدخل هاتف المرسل',
    errRecipientName: 'أدخل اسم المستلم',
    errRecipientPhone: 'أدخل هاتف المستلم',
    errPackageDesc: 'صف الطرد',
    errPackageCat: 'أدخل فئة الطرد',
    errPickup: 'أدخل عنوان الاستلام',
    errDestination: 'أدخل عنوان التوصيل',
    errPickupLocation: 'حدّد موقع الاستلام على الخريطة',
    errDestLocation: 'حدّد موقع التوصيل على الخريطة',
    errGeneric: 'حدث خطأ. حاول مرة أخرى.',
    errQuote: 'تعذّر جلب السعر',
    errCreate: 'تعذّر إنشاء الطلب. تأكد من ملء الحقول وأن رقم الهاتف يبدأ بـ +249',
    successPrefix: 'تم إنشاء الطلب. رقم الطلب: ',
    sizeEnvelope: 'ظرف',
    sizeSmall: 'صغير',
    sizeMedium: 'متوسط',
    sizeLarge: 'كبير',
    sizeCustom: 'مخصص',
    pickLocation: 'تحديد على الخريطة',
    changeLocation: 'تغيير الموقع',
    pickupMapTitle: 'موقع الاستلام',
    destMapTitle: 'موقع التوصيل',
    mapHint: 'اضغط على الخريطة لوضع علامة',
    mapConfirm: 'تأكيد الموقع',
    mapCancel: 'إلغاء',
  },
} as const;

export function CourierRequestScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { lang } = useAuth();
  const t = COPY[lang === 'ar' ? 'ar' : 'en'];

  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [packageCategory, setPackageCategory] = useState('');
  const [packageSize, setPackageSize] = useState<PackageSize>('SMALL');
  const [pickupAddressText, setPickupAddressText] = useState('');
  const [destinationAddressText, setDestinationAddressText] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapFor, setMapFor] = useState<'pickup' | 'destination' | null>(null);

  const [quote, setQuote] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!senderName.trim()) return t.errSenderName;
    if (!senderPhone.trim()) return t.errSenderPhone;
    if (!recipientName.trim()) return t.errRecipientName;
    if (!recipientPhone.trim()) return t.errRecipientPhone;
    if (!packageDescription.trim()) return t.errPackageDesc;
    if (!packageCategory.trim()) return t.errPackageCat;
    if (!pickupAddressText.trim()) return t.errPickup;
    if (!destinationAddressText.trim()) return t.errDestination;
    if (!pickupCoords) return t.errPickupLocation;
    if (!destCoords) return t.errDestLocation;
    return null;
  };

  const getQuote = async () => {
    setErr(null);
    setQuoting(true);
    try {
      const r = await api.courierQuote({
        pickupLat: pickupCoords?.lat,
        pickupLng: pickupCoords?.lng,
        destLat: destCoords?.lat,
        destLng: destCoords?.lng,
      });
      setQuote(r.quotedPrice);
    } catch (e: any) {
      setErr(e?.message ?? t.errQuote);
    } finally {
      setQuoting(false);
    }
  };

  const submit = async () => {
    if (submitting) return;
    setErr(null);
    setSuccess(null);
    const v = validate();
    if (v) { setErr(v); return; }

    setSubmitting(true);
    try {
      const r = await api.createCourierOrder({
        senderName: senderName.trim(),
        senderPhone: senderPhone.trim(),
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        packageDescription: packageDescription.trim(),
        packageCategory: packageCategory.trim(),
        packageSize,
        pickupAddressText: pickupAddressText.trim(),
        pickupLat: pickupCoords?.lat,
        pickupLng: pickupCoords?.lng,
        destinationAddressText: destinationAddressText.trim(),
        destinationLat: destCoords?.lat,
        destinationLng: destCoords?.lng,
      });
      setSuccess(`${t.successPrefix}${r.order.orderNumber}`);
    } catch (e: any) {
      setErr(e?.message ?? t.errCreate);
    } finally {
      setSubmitting(false);
    }
  };

  const sizeOptions: { value: PackageSize; label: string }[] = [
    { value: 'ENVELOPE', label: t.sizeEnvelope },
    { value: 'SMALL', label: t.sizeSmall },
    { value: 'MEDIUM', label: t.sizeMedium },
    { value: 'LARGE', label: t.sizeLarge },
    { value: 'CUSTOM', label: t.sizeCustom },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      <Text style={styles.heading}>{t.title}</Text>
      <Text style={styles.subheading}>{t.subtitle}</Text>

      <Text style={styles.section}>{t.sectionSender}</Text>
      <Input label={t.senderName} value={senderName} onChangeText={setSenderName} />
      <View style={{ height: spacing.sm }} />
      <Input label={t.senderPhone} value={senderPhone} onChangeText={setSenderPhone} keyboardType="phone-pad" placeholder="+249912345678" autoCapitalize="none" autoCorrect={false} />

      <Text style={styles.section}>{t.sectionRecipient}</Text>
      <Input label={t.recipientName} value={recipientName} onChangeText={setRecipientName} />
      <View style={{ height: spacing.sm }} />
      <Input label={t.recipientPhone} value={recipientPhone} onChangeText={setRecipientPhone} keyboardType="phone-pad" placeholder="+249912345678" autoCapitalize="none" autoCorrect={false} />

      <Text style={styles.section}>{t.sectionPackage}</Text>
      <Input label={t.packageDescription} value={packageDescription} onChangeText={setPackageDescription} />
      <View style={{ height: spacing.sm }} />
      <Input label={t.packageCategory} value={packageCategory} onChangeText={setPackageCategory} />

      <Text style={styles.fieldLabel}>{t.packageSizeLabel}</Text>
      <View style={styles.sizeRow}>
        {sizeOptions.map((opt) => {
          const active = packageSize === opt.value;
          return (
            <Text
              key={opt.value}
              onPress={() => setPackageSize(opt.value)}
              style={[styles.sizeChip, active && styles.sizeChipActive, active && styles.sizeChipTxtActive]}
            >
              {opt.label}
            </Text>
          );
        })}
      </View>

      <Text style={styles.section}>{t.sectionRoute}</Text>
      <Input label={t.pickupAddress} value={pickupAddressText} onChangeText={setPickupAddressText} />
      <View style={{ height: spacing.xs }} />
      <Button
        title={pickupCoords ? t.changeLocation : t.pickLocation}
        onPress={() => setMapFor('pickup')}
        variant="secondary"
      />
      {pickupCoords ? (
        <Text style={styles.coordsTxt}>
          {pickupCoords.lat.toFixed(5)}, {pickupCoords.lng.toFixed(5)}
        </Text>
      ) : null}

      <View style={{ height: spacing.sm }} />
      <Input label={t.destinationAddress} value={destinationAddressText} onChangeText={setDestinationAddressText} />
      <View style={{ height: spacing.xs }} />
      <Button
        title={destCoords ? t.changeLocation : t.pickLocation}
        onPress={() => setMapFor('destination')}
        variant="secondary"
      />
      {destCoords ? (
        <Text style={styles.coordsTxt}>
          {destCoords.lat.toFixed(5)}, {destCoords.lng.toFixed(5)}
        </Text>
      ) : null}

      <View style={{ height: spacing.lg }} />
      <Button title={t.quoteBtn} onPress={getQuote} loading={quoting} variant="secondary" />

      {quote !== null ? (
        <View style={styles.quoteBox}>
          <Text style={styles.quoteTxt}>
            {t.quoteLabel}{Number(quote).toFixed(0)} {t.currency}
          </Text>
          <Text style={styles.quoteNote}>{t.quoteProvisional}</Text>
        </View>
      ) : null}

      {err ? (
        <View style={styles.errBox}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.errTxt}>{err}</Text>
        </View>
      ) : null}

      {success ? (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={styles.successTxt}>{success}</Text>
        </View>
      ) : null}

      <View style={{ height: spacing.lg }} />
      <Button title={t.createBtn} onPress={submit} loading={submitting} />

      {success ? (
        <Button title={t.backHome} onPress={() => nav.navigate('Home')} variant="secondary" style={{ marginTop: spacing.sm }} />
      ) : null}

      <MapPicker
        visible={mapFor !== null}
        title={mapFor === 'pickup' ? t.pickupMapTitle : t.destMapTitle}
        confirmLabel={t.mapConfirm}
        hintLabel={t.mapHint}
        lang={lang === 'ar' ? 'ar' : 'en'}
        initialLat={mapFor === 'pickup' ? pickupCoords?.lat : destCoords?.lat}
        initialLng={mapFor === 'pickup' ? pickupCoords?.lng : destCoords?.lng}
        onCancel={() => setMapFor(null)}
        onConfirm={(lat, lng, suggested) => {
          if (mapFor === 'pickup') {
            setPickupCoords({ lat, lng });
            if (!pickupAddressText.trim() && suggested) setPickupAddressText(suggested);
          }
          if (mapFor === 'destination') {
            setDestCoords({ lat, lng });
            if (!destinationAddressText.trim() && suggested) setDestinationAddressText(suggested);
          }
          setMapFor(null);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heading: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  subheading: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg },
  section: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  sizeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sizeChip: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, color: colors.text,
    fontSize: fontSize.sm, fontWeight: '600', overflow: 'hidden',
  },
  sizeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sizeChipTxtActive: { color: '#fff' },
  coordsTxt: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '700', marginTop: spacing.xs, textAlign: 'center' },
  quoteBox: { backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.md },
  quoteTxt: { color: colors.primary, fontWeight: '800', textAlign: 'center', fontSize: fontSize.md },
  quoteNote: { color: colors.textMuted, fontSize: fontSize.xs, textAlign: 'center', marginTop: spacing.xs, lineHeight: 16 },
  errBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.dangerBg, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.md },
  errTxt: { color: colors.danger, fontWeight: '600', flex: 1, fontSize: fontSize.sm },
  successBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.successBg, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.md },
  successTxt: { color: colors.success, fontWeight: '600', flex: 1, fontSize: fontSize.sm },
});