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
            <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBHB7JTRK2tDsEK-AaJyFVJuMj2d7H2cLk"></script>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html, body, #map { height: 100%; width: 100%; overflow: hidden; background: #e5e9f0; }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                var lat = ${lat};
                var lng = ${lng};
                var stops = ${stopsJson};
                var vehicleNo = '${vehicleNo || 'Vehicle'}';

                function initMap() {
                    var map = new google.maps.Map(document.getElementById('map'), {
                        zoom: 15,
                        center: {lat: lat, lng: lng},
                        disableDefaultUI: true,
                        mapTypeId: 'roadmap',
                        gestureHandling: 'greedy'
                    });

                    // Premium Circular Truck SVG Marker
                    var svgMarkerContent = '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">' +
                                           '<circle cx="25" cy="25" r="22" fill="#3861FB" stroke="#FFFFFF" stroke-width="4" />' +
                                           '<g transform="translate(13, 13)"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="#FFFFFF"/></g>' +
                                           '</svg>';
                    var truckIcon = {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgMarkerContent),
                        scaledSize: new google.maps.Size(46, 46),
                        anchor: new google.maps.Point(23, 23)
                    };

                    var currentMarker = new google.maps.Marker({
                        position: {lat: lat, lng: lng},
                        map: map,
                        icon: truckIcon,
                        title: vehicleNo,
                        zIndex: 1000
                    });

                    var tooltipContent = '<div style="font-family: sans-serif; text-align: center; padding: 4px 6px;">' +
                        '<b style="color: #1A1A1A; font-size: 14px; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">' + vehicleNo + '</b>' +
                        '<span style="background-color: #10B981; color: #FFFFFF; padding: 3px 8px; border-radius: 10px; font-size: 9px; font-weight: 900; letter-spacing: 1px;">LIVE</span>' +
                        '</div>';

                    var infoWindow = new google.maps.InfoWindow({
                        content: tooltipContent
                    });
                    
                    infoWindow.open(map, currentMarker);

                    currentMarker.addListener('click', function() {
                        map.panTo(currentMarker.getPosition());
                        var targetZoom = 18;
                        var currentZoom = map.getZoom();
                        if (currentZoom < targetZoom) {
                            var interval = setInterval(function() {
                                if (currentZoom >= targetZoom) {
                                    clearInterval(interval);
                                } else {
                                    currentZoom++;
                                    map.setZoom(currentZoom);
                                }
                            }, 100);
                        } else {
                            map.setZoom(targetZoom);
                        }
                    });

                    // Draw path and stops
                    if (stops && stops.length > 0) {
                        var pathCoordinates = [];
                        var bounds = new google.maps.LatLngBounds();

                        stops.forEach(function(stop) {
                            var stopLat = parseFloat(stop.lat);
                            var stopLng = parseFloat(stop.lng);
                            var pos = {lat: stopLat, lng: stopLng};
                            pathCoordinates.push(pos);
                            bounds.extend(pos);

                            var isCurrent = (Math.abs(stopLat - lat) < 0.0001 && Math.abs(stopLng - lng) < 0.0001);
                            
                            if (!isCurrent) {
                                var stopColor = stop.status === 'Completed' ? '#27AE60' : '#8E8E93';
                                
                                var stopMarker = new google.maps.Marker({
                                    position: pos,
                                    map: map,
                                    icon: {
                                        path: google.maps.SymbolPath.CIRCLE,
                                        scale: 8,
                                        fillColor: stopColor,
                                        fillOpacity: 1,
                                        strokeColor: '#FFFFFF',
                                        strokeWeight: 2,
                                    }
                                });

                                var stopInfo = new google.maps.InfoWindow({
                                    content: '<div style="font-family:sans-serif;max-width:200px;"><b style="font-size:12px;color:#333;">' + stop.address + '</b><br><span style="font-size:10px;color:' + stopColor + ';">' + stop.status + '</span></div>'
                                });

                                stopMarker.addListener('click', function() {
                                    stopInfo.open(map, stopMarker);
                                });
                            }
                        });

                        if (pathCoordinates.length > 1) {
                            map.fitBounds(bounds);
                        } else {
                            map.setCenter({lat: lat, lng: lng});
                        }
                    }
                }
                
                window.onload = initMap;
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
                            <View style={styles.metaRow}>
                                <View style={styles.metaCol}>
                                    <View style={[styles.iconBoxMini, { backgroundColor: '#E0E7FF' }]}><Icon name="local-shipping" size={14} color="#3861FB" /></View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.metaLabel}>VEHICLE NO</Text>
                                        <Text style={styles.metaValue} numberOfLines={1}>{vehicleNo || 'N/A'}</Text>
                                    </View>
                                </View>
                                <View style={styles.metaCol}>
                                    <View style={[styles.iconBoxMini, { backgroundColor: '#FEF9C3' }]}><Icon name="receipt" size={14} color="#EAB308" /></View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.metaLabel}>BILL NO / REF</Text>
                                        <Text style={styles.metaValue} numberOfLines={1}>{tripRefNo || 'N/A'}</Text>
                                    </View>
                                </View>
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
    infoCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },

    metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
    metaCol: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    iconBoxMini: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    metaLabel: { fontSize: 9, fontWeight: '800', color: '#A0AEC0', letterSpacing: 0.5, marginBottom: 2 },
    metaValue: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
});

export default VehicleTrackingScreen;
