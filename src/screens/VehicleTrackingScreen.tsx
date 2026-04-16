import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions, ActivityIndicator, Alert, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BrandColors } from '../theme/Colors';

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
    const [location, setLocation] = useState<{ latitude: number, longitude: number, status: string | number, locName: string } | null>(null);

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
                    locName: locName
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

    const generateMapHTML = (lat: number, lng: number) => `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <style>
                body { padding: 0; margin: 0; }
                html, body, #map { height: 100%; width: 100vw; }
                .custom-div-icon {
                    background-color: transparent;
                    text-align: center;
                }
                .truck-icon {
                    background: ${BrandColors.primaryGradientStart};
                    border: 2px solid #FFFFFF;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 20px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                var map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], 14);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap'
                }).addTo(map);

                var icon = L.divIcon({
                    className: 'custom-div-icon',
                    html: "<div class='truck-icon'>🚛</div>",
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                });

                var marker = L.marker([${lat}, ${lng}], {icon: icon}).addTo(map)
                    .bindPopup("<b>${vehicleNo || 'Vehicle'}</b><br>Active GPS Location")
                    .openPopup();
                
                marker.on('click', function(e) {
                    map.flyTo(e.latlng, 15, {
                        animate: true,
                        duration: 1
                    });
                });
                    
                setTimeout(function() { map.invalidateSize(); }, 500);
            </script>
        </body>
        </html>
    `;

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
                        <ActivityIndicator size="large" color={BrandColors.primaryGradientStart} />
                        <Text style={styles.loadingText}>Fetching live coordinates...</Text>
                    </View>
                ) : (
                    location && (
                        <WebView
                            source={{ html: generateMapHTML(location.latitude, location.longitude) }}
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
