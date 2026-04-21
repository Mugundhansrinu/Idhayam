import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions, ActivityIndicator, Alert, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { getVehicleTracking } from '../api';
import { useSession } from '../context/SessionContext';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
    Dashboard: undefined;
    VehicleTracking: { vehicleNo: string; tripRefNo: string; tripId: string };
};

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'VehicleTracking'>;
    route: RouteProp<RootStackParamList, 'VehicleTracking'>;
};

const VehicleTrackingScreen: React.FC<Props> = ({ navigation, route }) => {
    const { session } = useSession();
    const { vehicleNo, tripRefNo, tripId } = route.params || {};
    
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState<{ latitude: number, longitude: number, status: string | number, locName: string, stops?: any[] } | null>(null);

    useEffect(() => {
        if (!tripId || !tripRefNo || !session) return;
        fetchLocation();

        // Refresh location every 30 seconds
        const interval = setInterval(fetchLocation, 30000);
        return () => clearInterval(interval);
    }, [tripId, tripRefNo, session]);

    const fetchLocation = async () => {
        try {
            // NOTE: the API expects string "51" for branch if that's what was hardcoded in Dashboard.
            // Using session branch id by default, update if needed.
            const branchId = session?.branchId || '51'; 
            const data = await getVehicleTracking(branchId, tripId, tripRefNo);
            
            if (data && data.latitude && data.longitude) {
                let locName = 'Location Updated';
                if (data.status) locName = typeof data.status === 'string' ? data.status : 'Moving / Updates available';
                setLocation({
                    latitude: Number(data.latitude),
                    longitude: Number(data.longitude),
                    status: data.status,
                    locName: locName,
                    stops: data.stops || []
                });
            } else {
                setLocation({
                    latitude: 11.0168, // Default to generic TN location if null
                    longitude: 76.9558,
                    status: 'No GPS data',
                    locName: 'GPS Location Unavailable'
                });
            }
        } catch (error) {
            console.error('Fetch location error:', error);
            Alert.alert('Error', 'Unable to fetch vehicle tracking location.');
        } finally {
            setLoading(false);
        }
    };

    const generateMapHTML = (lat: number, lng: number, stops?: any[]) => {
        const stopsJson = JSON.stringify(stops || []);
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html, body, #map { height: 100%; width: 100%; overflow: hidden; background: #e5e9f0; }
                .truck-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 44px;
                    height: 44px;
                    background: #3861FB;
                    border: 3px solid #FFF;
                    border-radius: 50%;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                    font-size: 24px;
                }
                .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                var lat = ${lat};
                var lng = ${lng};
                var stops = ${stopsJson};
                var vehicleNo = '${vehicleNo || 'Vehicle'}';

                var map = L.map('map', { zoomControl: false }).setView([lat, lng], 15);

                // Use CartoDB Voyager for a cleaner, modern look similar to Google Maps
                L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                    maxZoom: 19,
                    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
                }).addTo(map);

                var truckHtml = '<div class="truck-icon">🚛</div>';
                var truckIcon = L.divIcon({
                    html: truckHtml,
                    className: '',
                    iconSize: [44, 44],
                    iconAnchor: [22, 22],
                    popupAnchor: [0, -22]
                });

                var currentMarker = L.marker([lat, lng], {icon: truckIcon, zIndexOffset: 1000}).addTo(map);
                currentMarker.bindPopup('<div style="font-family:sans-serif;padding:4px;"><b style="color:#3861FB;">' + vehicleNo + '</b><br><span style="font-size:12px;color:#555;">Active GPS Location</span></div>').openPopup();

                currentMarker.on('click', function() {
                    map.flyTo([lat, lng], 19, { duration: 1.5 });
                });

                // Draw path and stops
                if (stops && stops.length > 0) {
                    var latlngs = [];
                    
                    stops.forEach(function(stop) {
                        latlngs.push([stop.lat, stop.lng]);
                        
                        var isCurrent = (Math.abs(stop.lat - lat) < 0.0001 && Math.abs(stop.lng - lng) < 0.0001);
                        
                        if (!isCurrent) {
                            var stopColor = stop.status === 'Completed' ? '#27AE60' : '#8E8E93';
                            var circleHtml = '<div style="width:14px;height:14px;background:' + stopColor + ';border:2px solid #FFF;border-radius:50%;box-shadow:0 0 4px rgba(0,0,0,0.4);"></div>';
                            var circleIcon = L.divIcon({
                                html: circleHtml,
                                className: '',
                                iconSize: [14, 14],
                                iconAnchor: [7, 7]
                            });
                            
                            L.marker([stop.lat, stop.lng], {icon: circleIcon}).addTo(map)
                                .bindPopup('<div style="font-family:sans-serif;max-width:200px;"><b style="font-size:12px;color:#333;">' + stop.address + '</b><br><span style="font-size:10px;color:' + stopColor + ';">' + stop.status + '</span></div>');
                        }
                    });
                    
                    if (latlngs.length > 1) {
                        var polyline = L.polyline(latlngs, {color: '#3861FB', weight: 4, opacity: 0.8}).addTo(map);
                        map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
                    } else {
                        map.setView([lat, lng], 15);
                    }
                }
            </script>
        </body>
        </html>
    `;
    }

    return (
        <View style={[styles.container, { backgroundColor: '#F0F4F8' }]}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={20} color="#3861FB" />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={styles.headerTitle}>Vehicle Tracking</Text>
                    <Text style={styles.headerSub}>{vehicleNo ? `Live routing for ${vehicleNo}` : "Live status"}</Text>
                </View>
            </View>

            <View style={styles.mapContainer}>
                {loading ? (
                    <View style={styles.loaderArea}>
                        <ActivityIndicator size="large" color="#3861FB" />
                        <Text style={styles.loadingText}>Fetching live coordinates...</Text>
                    </View>
                ) : (
                    location && (
                        <WebView
                            source={{ html: generateMapHTML(location.latitude, location.longitude, location.stops) }}
                            style={styles.webviewMap}
                            scrollEnabled={false}
                            javaScriptEnabled={true}
                        />
                    )
                )}

                {/* Info Card Overlay */}
                {!loading && location && (
                    <View style={styles.infoOverlay}>
                        <View style={styles.infoCard}>
                            <View style={styles.infoLeft}>
                                <Text style={styles.infoTitle}>Current Status</Text>
                                <Text style={styles.infoDetail} numberOfLines={2}>{location.locName}</Text>
                            </View>
                            <View style={[styles.statusBadge, location.status === 'No GPS data' && { backgroundColor: '#FEE2E2' }]}>
                                <View style={[styles.dot, location.status === 'No GPS data' && { backgroundColor: '#EF4444' }]} />
                                <Text style={[styles.statusText, location.status === 'No GPS data' && { color: '#EF4444' }]}>
                                    {location.status === 'No GPS data' ? 'NO DATA' : 'LIVE'}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20, backgroundColor: '#FFFFFF' },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F8F9FD', alignItems: 'center', justifyContent: 'center', elevation: 2 },
    headerTitles: { flex: 1, marginLeft: 15 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A1A' },
    headerSub: { fontSize: 13, color: '#A0AEC0', fontWeight: '600', marginTop: 2 },
    
    mapContainer: { flex: 1, backgroundColor: '#E5E9F0' },
    loaderArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { marginTop: 15, fontSize: 13, fontWeight: '700', color: '#64748B' },
    webviewMap: { flex: 1, backgroundColor: 'transparent' },
    
    infoOverlay: { position: 'absolute', bottom: 30, left: 20, right: 20 },
    infoCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
    infoLeft: { flex: 1, marginRight: 15 },
    infoTitle: { fontSize: 11, fontWeight: '800', color: '#858597', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    infoDetail: { fontSize: 15, fontWeight: '700', color: '#1F1F39', lineHeight: 20 },
    statusBadge: { backgroundColor: '#E8FDF0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#27AE60', marginRight: 8 },
    statusText: { fontSize: 11, fontWeight: '800', color: '#27AE60' },
});

export default VehicleTrackingScreen;
