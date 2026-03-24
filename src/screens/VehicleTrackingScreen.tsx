import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import GlassHeader from '../components/GlassHeader';

const { width, height } = Dimensions.get('window');

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'VehicleTracking'>;
};

const VehicleTrackingScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: '#F0F4F8' }]}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            <GlassHeader 
                title="Vehicle Tracking" 
                subtitle="Live status of TN67BH5688" 
                onBack={() => navigation.goBack()} 
                gradientColors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
            />

            <View style={styles.mapContainer}>
                {/* Simulated Map Background */}
                <View style={styles.mapBase}>
                    {/* Grid lines to simulate map */}
                    {[...Array(10)].map((_, i) => (
                        <View key={`h-${i}`} style={[styles.gridLineH, { top: (height / 10) * i }]} />
                    ))}
                    {[...Array(8)].map((_, i) => (
                        <View key={`v-${i}`} style={[styles.gridLineV, { left: (width / 8) * i }]} />
                    ))}
                    
                    {/* Simulated Path */}
                    <View style={styles.road} />
                    
                    {/* Markers */}
                    <View style={[styles.marker, { top: '30%', left: '40%' }]}>
                        <View style={styles.markerCircle}><Text>🏪</Text></View>
                        <View style={styles.labelBox}><Text style={styles.labelText}>Kalyanapuram</Text></View>
                    </View>
                    
                    <View style={[styles.marker, { top: '55%', left: '55%' }]}>
                        <View style={[styles.markerCircle, { backgroundColor: BrandColors.primaryGradientStart }]}><Text>🚛</Text></View>
                        <View style={[styles.labelBox, { backgroundColor: BrandColors.primaryGradientStart }]}><Text style={[styles.labelText, { color: '#fff' }]}>Vehicle (Live)</Text></View>
                    </View>
                    
                    <View style={[styles.marker, { top: '80%', left: '25%' }]}>
                        <View style={styles.markerCircle}><Text>🏢</Text></View>
                        <View style={styles.labelBox}><Text style={styles.labelText}>Kandiyur Warehouse</Text></View>
                    </View>
                </View>

                {/* Info Card Overlay */}
                <View style={styles.infoOverlay}>
                    <View style={styles.infoCard}>
                        <View style={styles.infoLeft}>
                            <Text style={styles.infoTitle}>Current Location</Text>
                            <Text style={styles.infoDetail} numberOfLines={1}>Near Vandalur GST Road, Chennai</Text>
                        </View>
                        <View style={styles.statusBadge}>
                            <View style={styles.dot} />
                            <Text style={styles.statusText}>MOVING</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    mapContainer: { flex: 1, overflow: 'hidden' },
    mapBase: { flex: 1, backgroundColor: '#E5E9F0', position: 'relative' },
    gridLineH: { position: 'absolute', height: 1, width: '100%', backgroundColor: 'rgba(0,0,0,0.05)' },
    gridLineV: { position: 'absolute', width: 1, height: '100%', backgroundColor: 'rgba(0,0,0,0.05)' },
    road: { position: 'absolute', top: 0, left: '45%', width: 40, height: '100%', backgroundColor: '#D1D9E6', transform: [{ rotate: '15deg' }] },
    
    marker: { position: 'absolute', alignItems: 'center' },
    markerCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5 },
    labelBox: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 5, elevation: 3 },
    labelText: { fontSize: 10, fontWeight: '800', color: '#1F1F39' },
    
    infoOverlay: { position: 'absolute', bottom: 30, left: 20, right: 20 },
    infoCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
    infoLeft: { flex: 1, marginRight: 15 },
    infoTitle: { fontSize: 11, fontWeight: '800', color: '#858597', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    infoDetail: { fontSize: 16, fontWeight: '700', color: '#1F1F39' },
    statusBadge: { backgroundColor: '#E8FDF0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#27AE60', marginRight: 8 },
    statusText: { fontSize: 11, fontWeight: '800', color: '#27AE60' },
});

export default VehicleTrackingScreen;
