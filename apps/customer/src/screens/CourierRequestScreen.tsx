import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fontSize, spacing } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import type { RootStackParamList } from '../types';

export function CourierRequestScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { lang } = useAuth();
  const [f, setF] = useState({
    senderName: '', senderPhone: '', recipientName: '', recipientPhone: '',
    packageDescription: '', packageCategory: 'documents', packageSize: 'SMALL' as const,
    pickupAddressText: '', destinationAddressText: '',
  });
  const [quote, setQuote] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });

  const getQuote = async () => {
    setErrorMsg(null); setQuoting(true);
    try {
      const r = await api.courierQuote({});
      setQuote(r.quotedPrice);
    } catch (e: any) { setErrorMsg(e?.message ?? 'Error fetching quote'); }
    finally { setQuoting(false); }
  };

  const submit = async () => {
    setErrorMsg(null); setSuccessMsg(null); setSubmitting(true);
    try {
      const r = await api.createCourierOrder({
        ...f,
        packageSize: 'SMALL',
      });
      setSuccessMsg(`تم إنشاء الطلب بنجاح! رقم الطلب: ${r.order.orderNumber}`);
    } catch (e: any) { 
      setErrorMsg(e?.message ?? 'حدث خطأ أثناء إنشاء الطلب. تأكد من ملء جميع الحقول وأن رقم الهاتف يبدأ بـ +249'); 
    }
    finally { setSubmitting(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.heading}>{lang === 'ar' ? 'طلب توصيل' : 'Courier request'}</Text>

      <Input label={lang === 'ar' ? 'اسم المرسل' : 'Sender name'} value={f.senderName} onChangeText={set('senderName')} />
      <Input label={lang === 'ar' ? 'هاتف المرسل (+249...)' : 'Sender phone'} value={f.senderPhone} onChangeText={set('senderPhone')} keyboardType="phone-pad" placeholder="+249912345678" />
      <Input label={lang === 'ar' ? 'اسم المستلم' : 'Recipient name'} value={f.recipientName} onChangeText={set('recipientName')} />
      <Input label={lang === 'ar' ? 'هاتف المستلم (+249...)' : 'Recipient phone'} value={f.recipientPhone} onChangeText={set('recipientPhone')} keyboardType="phone-pad" placeholder="+249912345678" />
      <Input label={lang === 'ar' ? 'وصف الطرد' : 'Package description'} value={f.packageDescription} onChangeText={set('packageDescription')} />
      <Input label={lang === 'ar' ? 'فئة الطرد' : 'Package category'} value={f.packageCategory} onChangeText={set('packageCategory')} />
      <Input label={lang === 'ar' ? 'عنوان الاستلام' : 'Pickup address'} value={f.pickupAddressText} onChangeText={set('pickupAddressText')} />
      <Input label={lang === 'ar' ? 'عنوان التوصيل' : 'Destination address'} value={f.destinationAddressText} onChangeText={set('destinationAddressText')} />

      <Button title={lang === 'ar' ? 'احسب السعر' : 'Get quote'} onPress={getQuote} loading={quoting} variant="secondary" />
      {quote !== null ? (
        <View style={styles.quoteBox}>
          <Text style={styles.quoteTxt}>{lang === 'ar' ? 'السعر المتوقع: ' : 'Quoted: '}{Number(quote).toFixed(0)} SDG</Text>
        </View>
      ) : null}

      {errorMsg ? <Text style={styles.errorTxt}>{errorMsg}</Text> : null}
      {successMsg ? <Text style={styles.successTxt}>{successMsg}</Text> : null}

      <Button title={lang === 'ar' ? 'إنشاء الطلب' : 'Create order'} onPress={submit} loading={submitting} style={{ marginTop: spacing.md }} />
      
      {successMsg ? (
        <Button title={lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'} onPress={() => nav.navigate('Home')} variant="secondary" style={{ marginTop: spacing.sm }} />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundAlt },
  heading: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  quoteBox: { backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: 10, marginTop: spacing.md },
  quoteTxt: { color: colors.primary, fontWeight: '600', textAlign: 'center' },
  errorTxt: { color: colors.danger, textAlign: 'center', marginTop: spacing.md, fontWeight: '600' },
  successTxt: { color: colors.success, textAlign: 'center', marginTop: spacing.md, fontWeight: '600' },
});
