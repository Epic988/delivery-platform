import React, { useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@delivery/shared';

const DEFAULT_LAT = 13.1847;
const DEFAULT_LNG = 30.2167;

export interface MapPickerProps {
  visible: boolean;
  title: string;
  confirmLabel: string;
  cancelLabel: string;
  hintLabel: string;
  initialLat?: number | null;
  initialLng?: number | null;
  onCancel: () => void;
  onConfirm: (lat: number, lng: number) => void;
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
  function setMarker(la, ln) {
    if (marker) { map.removeLayer(marker); }
    marker = L.marker([la, ln]).addTo(map);
  }
  map.on('click', function(e) {
    setMarker(e.latlng.lat, e.latlng.lng);
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng }));
    }
  });
</script>
</body>
</html>`;
}

export function MapPicker(props: MapPickerProps) {
  const { visible, title, confirmLabel, hintLabel, initialLat, initialLng, onCancel, onConfirm } = props;
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const startLat = typeof initialLat === 'number' ? initialLat : DEFAULT_LAT;
  const startLng = typeof initialLng === 'number' ? initialLng : DEFAULT_LNG;
  const html = useMemo(() => buildHtml(startLat, startLng), [startLat, startLng]);

  useEffect(() => {
    if (visible) {
      setPicked(null);
      setReloadKey((k) => k + 1);
    }
  }, [visible]);

  const onMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (typeof data.lat === 'number' && typeof data.lng === 'number') {
        setPicked({ lat: data.lat, lng: data.lng });
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

        <WebView
          key={reloadKey}
          originWhitelist={['*']}
          source={{ html }}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
        />

        <View style={styles.footer}>
          <Text style={styles.hint}>{hintLabel}</Text>
          {picked ? (
            <Text style={styles.coords}>
              {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}
            </Text>
          ) : null}
          <TouchableOpacity
            disabled={!picked}
            onPress={() => picked && onConfirm(picked.lat, picked.lng)}
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
  confirmBtn: {
    backgroundColor: colors.primary, paddingVertical: spacing.md,
    borderRadius: radius.md, alignItems: 'center', marginTop: spacing.xs,
  },
  confirmDisabled: { backgroundColor: colors.border },
  confirmTxt: { color: '#fff', fontWeight: '800', fontSize: fontSize.md },
});