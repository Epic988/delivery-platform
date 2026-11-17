import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@delivery/shared';

const DEFAULT_LAT = 13.1847;
const DEFAULT_LNG = 30.2167;

export interface MapPickerProps {
  visible: boolean;
  title: string;
  confirmLabel: string;
  hintLabel: string;
  lang: 'ar' | 'en';
  initialLat?: number | null;
  initialLng?: number | null;
  onCancel: () => void;
  onConfirm: (lat: number, lng: number, suggestedAddress: string | null) => void;
}

function buildHtml(lat: number, lng: number): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: #F7F6F0; }
  .leaflet-control-attribution { font-size: 10px; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map', { zoomControl: true }).setView([${lat}, ${lng}], 14);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  var marker = null;
  function send(p) {
    if (window.ReactNativeWebView) { window.ReactNativeWebView.postMessage(p); }
    else if (window.parent && window.parent !== window) { window.parent.postMessage(p, '*'); }
  }
  map.on('click', function(e) {
    if (marker) { map.removeLayer(marker); }
    marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
    send(JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng }));
  });
</script>
</body>
</html>`;
}

// Nominatim (OpenStreetMap) reverse geocoding - supports Arabic, free, no API key.
// Rate limit: <= 1 request/second per client. Debounced in handlePick below.
async function reverseGeocode(lat: number, lng: number, lang: 'ar' | 'en'): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&accept-language=${lang}&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'DeliveryCustomer/0.1.0',
        'Accept': 'application/json',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.address) return null;

    const a = data.address;
    
    // Priority 1: Specific POI or Building name
    const poiName = data.name || a.amenity || a.shop || a.tourism || a.leisure || a.building;
    // Priority 2: Street/Road
    const street = a.road || a.pedestrian || a.footway;
    // Priority 3: Neighborhood/Area
    const area = a.neighbourhood || a.suburb || a.quarter || a.residential || a.village;
    // Priority 4: City
    const city = a.city || a.town || a.municipality;
    // Priority 5: State
    const state = a.state;

    const parts = [poiName, street, area, city, state].filter((x): x is string => typeof x === 'string' && x.length > 0);
    const unique = Array.from(new Set(parts));
    const sep = lang === 'ar' ? '، ' : ', ';

    if (unique.length > 0) {
      return unique.slice(0, 3).join(sep);
    }

    // Fallback: Use display_name and strip country
    if (data.display_name) {
      const displayParts = data.display_name.split(',').map((s: string) => s.trim());
      if (displayParts.length > 1 && (displayParts[displayParts.length - 1] === 'السودان' || displayParts[displayParts.length - 1] === 'Sudan')) {
        displayParts.pop();
      }
      return displayParts.slice(0, 3).join(sep);
    }

    return null;
  } catch {
    return null;
  }
}

export function MapPicker(props: MapPickerProps) {
  const { visible, title, confirmLabel, hintLabel, lang, initialLat, initialLng, onCancel, onConfirm } = props;
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [suggested, setSuggested] = useState<string | null>(null);
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef = useRef(0);
  const startLat = typeof initialLat === 'number' ? initialLat : DEFAULT_LAT;
  const startLng = typeof initialLng === 'number' ? initialLng : DEFAULT_LNG;
  const html = useMemo(() => buildHtml(startLat, startLng), [startLat, startLng]);

  useEffect(() => {
    if (visible) {
      setPicked(null);
      setSuggested(null);
      setReloadKey((k) => k + 1);
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handlePick = (lat: number, lng: number) => {
    setPicked({ lat, lng });
    setSuggested(null);
    setLoadingAddr(true);
    const mySeq = ++seqRef.current;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const addr = await reverseGeocode(lat, lng, lang);
      if (seqRef.current !== mySeq) return;
      setSuggested(addr);
      setLoadingAddr(false);
    }, 500);
  };

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (e: any) => {
      try {
        const data = JSON.parse(e.data);
        if (typeof data.lat === 'number' && typeof data.lng === 'number') {
          handlePick(data.lat, data.lng);
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [lang]);

  const onMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (typeof data.lat === 'number' && typeof data.lng === 'number') {
        handlePick(data.lat, data.lng);
      }
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerBtn}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.headerBtn} />
        </View>

        {Platform.OS === 'web'
          ? React.createElement('iframe', {
              key: reloadKey,
              srcDoc: html,
              style: { border: 'none', width: '100%', height: '100%', flex: 1 },
            })
          : (
            <WebView
              key={reloadKey}
              originWhitelist={['*']}
              source={{ html }}
              onMessage={onMessage}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
            />
          )
        }

        <View style={styles.footer}>
          <Text style={styles.hint}>{hintLabel}</Text>
          {picked ? (
            <Text style={styles.coords}>
              {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}
            </Text>
          ) : null}
          {loadingAddr ? (
            <View style={styles.addrRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.addrLoading}>{lang === 'ar' ? 'جارٍ جلب اسم الموقع…' : 'Fetching place name…'}</Text>
            </View>
          ) : suggested ? (
            <Text style={styles.addr}>{suggested}</Text>
          ) : picked ? (
            <Text style={styles.addrEmpty}>{lang === 'ar' ? 'لا يوجد اسم لهذا الموقع' : 'No name found for this location'}</Text>
          ) : null}
          <TouchableOpacity
            disabled={!picked}
            onPress={() => picked && onConfirm(picked.lat, picked.lng, suggested)}
            style={[styles.confirmBtn, !picked && styles.confirmDisabled]}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmTxt}>{confirmLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface,
  },
  headerBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  footer: {
    padding: spacing.lg, backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm,
  },
  hint: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
  coords: { fontSize: fontSize.md, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  addr: { fontSize: fontSize.sm, color: colors.text, textAlign: 'center', fontWeight: '600' },
  addrEmpty: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic' },
  addrRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  addrLoading: { fontSize: fontSize.xs, color: colors.textMuted },
  confirmBtn: {
    backgroundColor: colors.primary, paddingVertical: spacing.md,
    borderRadius: radius.md, alignItems: 'center', marginTop: spacing.xs,
  },
  confirmDisabled: { backgroundColor: colors.border },
  confirmTxt: { color: '#fff', fontWeight: '800', fontSize: fontSize.md },
});