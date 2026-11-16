import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Address, colors, fontSize, radius, spacing } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

const COPY = {
  en: {
    title: 'My addresses',
    add: 'Add address',
    edit: 'Edit',
    delete: 'Delete',
    setDefault: 'Set as default',
    defaultBadge: 'Default',
    save: 'Save',
    cancel: 'Cancel',
    labelField: 'Label (optional)',
    addressField: 'Address',
    defaultToggle: 'Set as default',
    empty: 'No addresses yet',
    emptyHint: 'Add your first address to get started',
    loading: 'Loading...',
    errLoad: 'Could not load addresses',
    retry: 'Retry',
    errSave: 'Could not save address',
    errDelete: 'Could not delete address',
    confirmDeleteTitle: 'Delete address',
    confirmDeleteMsg: 'Are you sure?',
    errRequired: 'Address is required',
  },
  ar: {
    title: 'عناويني',
    add: 'إضافة عنوان',
    edit: 'تعديل',
    delete: 'حذف',
    setDefault: 'اجعله افتراضياً',
    defaultBadge: 'افتراضي',
    save: 'حفظ',
    cancel: 'إلغاء',
    labelField: 'تسمية (اختياري)',
    addressField: 'العنوان',
    defaultToggle: 'اجعله افتراضياً',
    empty: 'لا توجد عناوين بعد',
    emptyHint: 'أضف عنوانك الأول للبدء',
    loading: 'جارٍ التحميل...',
    errLoad: 'تعذّر تحميل العناوين',
    retry: 'إعادة المحاولة',
    errSave: 'تعذّر حفظ العنوان',
    errDelete: 'تعذّر حذف العنوان',
    confirmDeleteTitle: 'حذف العنوان',
    confirmDeleteMsg: 'هل أنت متأكد؟',
    errRequired: 'العنوان مطلوب',
  },
} as const;

export function AddressesScreen() {
  const { lang } = useAuth();
  const t = COPY[lang === 'ar' ? 'ar' : 'en'];

  const [data, setData] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [label, setLabel] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const r = await api.addresses();
      setData(r.data);
    } catch (e: any) {
      setErr(e?.message ?? t.errLoad);
    } finally {
      setLoading(false);
    }
  }, [t.errLoad]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openNew = () => {
    setEditingId(null);
    setText('');
    setLabel('');
    setIsDefault(false);
    setFormErr(null);
    setShowForm(true);
  };

  const openEdit = (a: Address) => {
    setEditingId(a.id);
    setText(a.addressText);
    setLabel(a.label ?? '');
    setIsDefault(a.isDefault);
    setFormErr(null);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormErr(null);
  };

  const submit = async () => {
    if (!text.trim()) return setFormErr(t.errRequired);
    setFormErr(null);
    setSaving(true);
    try {
      if (editingId) {
        await api.updateAddress(editingId, { addressText: text.trim(), label: label || undefined, isDefault });
      } else {
        await api.createAddress({ addressText: text.trim(), label: label || undefined, isDefault });
      }
      cancelForm();
      await load();
    } catch (e: any) {
      setFormErr(e?.message ?? t.errSave);
    } finally {
      setSaving(false);
    }
  };

  const setAsDefault = async (a: Address) => {
    if (a.isDefault) return;
    try {
      await api.updateAddress(a.id, { isDefault: true });
      await load();
    } catch (e: any) {
      Alert.alert(t.errSave, e?.message ?? '');
    }
  };

  const confirmDelete = (a: Address) => {
    Alert.alert(t.confirmDeleteTitle, t.confirmDeleteMsg, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteAddress(a.id);
            await load();
          } catch (e: any) {
            Alert.alert(t.errDelete, e?.message ?? '');
          }
        },
      },
    ]);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (err) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
        <Text style={styles.empty}>{err}</Text>
        <Pressable style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryTxt}>{t.retry}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="location-outline" size={48} color={colors.textMuted} />
            <Text style={styles.empty}>{t.empty}</Text>
            <Text style={styles.emptyHint}>{t.emptyHint}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel} numberOfLines={1}>
                {item.label?.trim() || (lang === 'ar' ? 'عنوان' : 'Address')}
              </Text>
              {item.isDefault ? (
                <View style={styles.defaultBadge}>
                  <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
                  <Text style={styles.defaultBadgeTxt}>{t.defaultBadge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.cardAddr} numberOfLines={3}>{item.addressText}</Text>
            <View style={styles.cardActions}>
              <Pressable style={styles.actionBtn} onPress={() => openEdit(item)}>
                <Ionicons name="create-outline" size={16} color={colors.primary} />
                <Text style={styles.actionTxt}>{t.edit}</Text>
              </Pressable>
              {!item.isDefault ? (
                <Pressable style={styles.actionBtn} onPress={() => setAsDefault(item)}>
                  <Ionicons name="star-outline" size={16} color={colors.accent} />
                  <Text style={[styles.actionTxt, { color: colors.accent }]}>{t.setDefault}</Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.actionBtn} onPress={() => confirmDelete(item)}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
                <Text style={[styles.actionTxt, { color: colors.danger }]}>{t.delete}</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      {showForm ? (
        <View style={styles.formSheet}>
          <Input label={t.addressField} value={text} onChangeText={setText} />
          <View style={{ height: spacing.md }} />
          <Input label={t.labelField} value={label} onChangeText={setLabel} />
          <Pressable style={styles.checkRow} onPress={() => setIsDefault(!isDefault)}>
            <View style={[styles.checkbox, isDefault && styles.checkboxOn]}>
              {isDefault ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
            </View>
            <Text style={styles.checkTxt}>{t.defaultToggle}</Text>
          </Pressable>
          {formErr ? <Text style={styles.formErr}>{formErr}</Text> : null}
          <View style={{ height: spacing.md }} />
          <Button title={t.save} onPress={submit} loading={saving} />
          <Button title={t.cancel} onPress={cancelForm} variant="secondary" style={{ marginTop: spacing.sm }} />
        </View>
      ) : (
        <View style={styles.addWrap}>
          <Button title={t.add} onPress={openNew} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.xl, gap: spacing.md },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: fontSize.md },
  emptyHint: { textAlign: 'center', color: colors.textMuted, fontSize: fontSize.sm },
  emptyBox: { alignItems: 'center', marginTop: spacing.xxl, gap: spacing.sm },
  retryBtn: { marginTop: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: colors.primary },
  retryTxt: { color: '#fff', fontWeight: '700', fontSize: fontSize.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  cardLabel: { fontSize: fontSize.md, fontWeight: '800', color: colors.text, flex: 1 },
  defaultBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primaryLight, paddingVertical: 4, paddingHorizontal: spacing.sm, borderRadius: radius.pill },
  defaultBadgeTxt: { fontSize: fontSize.xs, fontWeight: '700', color: colors.primary },
  cardAddr: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 20 },
  cardActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  actionTxt: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary },
  formSheet: { padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  addWrap: { padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkTxt: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  formErr: { color: colors.danger, marginTop: spacing.sm, fontSize: fontSize.sm, textAlign: 'center' },
});