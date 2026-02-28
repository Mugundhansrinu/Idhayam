import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useTheme } from '../theme';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'VehicleTracking'>;
};

const VehicleTrackingScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0a1a4e" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Map View</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Simulated Map Area */}
            <View style={styles.mapContainer}>
                {/* Simulated routes and pins */}
                <View style={styles.mapBackground}>
                    {/* Placeholder content since react-native-maps is not installed. We create a styled UI that looks like a map layout */}
                    <View style={styles.pathLine} />
                    <View style={[styles.marker, { top: '30%', left: '40%' }]}>
                        <Text style={styles.markerIcon}>🏪</Text>
                        <Text style={styles.markerLabel}>Kalyanapuram</Text>
                    </View>
                    <View style={[styles.marker, { top: '60%', left: '60%' }]}>
                        <Text style={styles.markerIcon}>📍</Text>
                        <Text style={styles.markerLabel}>Vehicle Here</Text>
                    </View>
                    <View style={[styles.marker, { top: '80%', left: '30%' }]}>
                        <Text style={styles.markerIcon}>🏢</Text>
                        <Text style={styles.markerLabel}>Kandiyur</Text>
                    </View>
                </View>

                {/* Overlaid Vehicle Info Card */}
                <View style={styles.topOverlayCard}>
                    <Text style={styles.overlayText}>Vehicle No :</Text>
                    <Text style={styles.overlayVehicle}>TN67BH5688</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E8F5E9', // Light green-ish map land color
    },
    header: {
        backgroundColor: '#1565C0',
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        zIndex: 10,
    },
    backButton: {
        padding: 8,
    },
    backIcon: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    mapBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#F1F8E9',
        overflow: 'hidden',
    },
    pathLine: {
        position: 'absolute',
        top: 0,
        left: '50%',
        width: 8,
        height: '100%',
        backgroundColor: '#90CAF9',
        transform: [{ rotate: '15deg' }],
    },
    marker: {
        position: 'absolute',
        alignItems: 'center',
    },
    markerIcon: {
        fontSize: 24,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    markerLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#424242',
        backgroundColor: 'rgba(255,255,255,0.7)',
        paddingHorizontal: 4,
        borderRadius: 4,
        marginTop: 2,
    },
    topOverlayCard: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    overlayText: {
        color: '#757575',
        fontSize: 14,
        fontWeight: '600',
    },
    overlayVehicle: {
        color: '#1E88E5',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 4,
    },
});

export default VehicleTrackingScreen;
