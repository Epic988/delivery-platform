import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, radius } from '@delivery/shared';

export interface MapPreviewProps {
  pickupLat: number;
  pickupLng: number;
  destLat: number;
  destLng: number;
  height?: number;
}

function buildHtml(pickupLat: number, pickupLng: number, destLat: number, destLng: number): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: #F7F6F0; }
  .leaflet-control-attribution { font-size: 9px; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map', {
    zoomControl: false,
    dragging: false,
    touchZoom: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false
  });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  var pickup = [${pickupLat}, ${pickupLng}];
  var dest = [${destLat}, ${destLng}];

  L.circleMarker(pickup, { radius: 9, color: '#0F6B50', fillColor: '#0F6B50', fillOpacity: 1, weight: 3 }).addTo(map);
  L.circleMarker(dest, { radius: 9, color: '#E6A23C', fillColor: '#E6A23C', fillOpacity: 1, weight: 3 }).addTo(map);

  L.polyline([pickup, dest], { color: '#0F6B50', weight: 3, dashArray: '6 8', opacity: 0.85 }).addTo(map);

  map.fitBounds(L.latLngBounds([pickup, dest]), { padding: [30, 30] });
</script>
</body>
</html>`;
}

export function MapPreview({ pickupLat, pickupLng, destLat, destLng, height = 220 }: MapPreviewProps) {
  const html = useMemo(
    () => buildHtml(pickupLat, pickupLng, destLat, destLng),
    [pickupLat, pickupLng, destLat, destLng]
  );
  return (
    <View style={[styles.wrap, { height }]} pointerEvents="none">
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});