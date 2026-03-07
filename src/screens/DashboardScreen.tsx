/**
 * DashboardScreen – Home page with feature grid
 * Glassmorphism + oil flow background
 */
import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Animated,
    ScrollView,
    Dimensions,
    Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import GlassCard from '../components/GlassCard';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getCustomerBalance, getInvoicedVehicleList } from '../api';
import { ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 64) / 2;

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

const FEATURES = [
    { id: 'OrderEntry', icon: '📦', label: 'Order Entry', color: '#1E4DB7' },
    { id: 'Discount', icon: '🏷️', label: 'Discount Details', color: '#B71C1C' },
    { id: 'PriceDetails', icon: '💲', label: 'Price Details', color: '#CA9E00' },
    { id: 'Report', icon: '📊', label: 'Reports', color: '#0D5C2D' },
    { id: 'InvoiceDetail', icon: '🧾', label: 'Invoice Details', color: '#4A1D96' },
    { id: 'MiniStatement', icon: '📋', label: 'Account Copy', color: '#7C3AED' },
    { id: 'BankDetails', icon: '🏦', label: 'Bank Details', color: '#0E7490' },
    { id: 'ContactUs', icon: '📞', label: 'Contact Us', color: '#065F46' },
];

/** Custom ⏻  Power On/Off icon drawn with pure RN Views — no font dependency */
const PowerIcon: React.FC = () => (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
        {/* Vertical line at top */}
        <View style={{
            position: 'absolute',
            top: 2,
            width: 3,
            height: 11,
            backgroundColor: '#FFFFFF',
            borderRadius: 1.5,
            zIndex: 10,
        }} />
        {/* Circle ring */}
        <View style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            borderWidth: 3,
            borderColor: '#FFFFFF',
            position: 'absolute',
            bottom: 2,
        }} />
        {/* Mask to create the gap at the top of the ring */}
        <View style={{
            position: 'absolute',
            top: 0,
            width: 12,
            height: 8,
            backgroundColor: BrandColors.red600,
            zIndex: 5,
        }} />
    </View>
);

interface FeatureCardProps {
    icon: string;
    label: string;
    color: string;
    delay: number;
    onPress: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, label, color, delay, onPress }) => {
    const { colors } = useTheme();
    const scale = useRef(new Animated.Value(0.7)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const pressScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scale, { toValue: 1, friction: 7, tension: 60, delay, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
        ]).start();
    }, []);

    const onPressIn = () => Animated.spring(pressScale, { toValue: 0.93, useNativeDriver: true }).start();
    const onPressOut = () => Animated.spring(pressScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();

    return (
        <Animated.View style={{ opacity, transform: [{ scale: Animated.multiply(scale, pressScale) }] }}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={1}>
                <View style={[styles.featureCard, { backgroundColor: colors.glassBackground, borderColor: colors.glassBorder }]}>
                    <LinearGradient
                        colors={[color + '55', color + '22']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.featureIconBg}>
                        <Text style={styles.featureIcon}>{icon}</Text>
                    </LinearGradient>
                    <Text style={[styles.featureLabel, { color: colors.textPrimary }]} numberOfLines={2}>
                        {label}
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const [showBalance, setShowBalance] = useState(false);
    const [showVehicle, setShowVehicle] = useState(false);

    // Balance state
    const [balanceData, setBalanceData] = useState<any>(null);
    const [loadingBalance, setLoadingBalance] = useState(false);

    // Vehicle state
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loadingVehicles, setLoadingVehicles] = useState(false);

    const headerOpacity = useRef(new Animated.Value(0)).current;
    const headerTranslateY = useRef(new Animated.Value(-20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(headerTranslateY, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleToggleBalance = async () => {
        const next = !showBalance;
        setShowBalance(next);
        setShowVehicle(false);
        if (next && !balanceData) {
            setLoadingBalance(true);
            try {
                const data = await getCustomerBalance();
                setBalanceData(data);
            } catch {
                // Fallback mock
                setBalanceData({ balance: '19562.66', pendingOrder: '0', netBalance: '19562.66' });
            } finally {
                setLoadingBalance(false);
            }
        }
    };

    const handleToggleVehicle = async () => {
        const next = !showVehicle;
        setShowVehicle(next);
        setShowBalance(false);
        if (next && vehicles.length === 0) {
            setLoadingVehicles(true);
            try {
                const data = await getInvoicedVehicleList();
                setVehicles(Array.isArray(data) ? data : (data?.data ?? []));
            } catch {
                // Fallback mock vehicle
                setVehicles([{ vehicleNo: 'TN67BH5688', tripRefNo: 'TJ-1870', branchId: '92', tripId: '79' }]);
            } finally {
                setLoadingVehicles(false);
            }
        }
    };

    const navigate = (screen: keyof RootStackParamList) => {
        navigation.navigate(screen as any);
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <LinearGradient
                colors={[BrandColors.blue900, BrandColors.blue800, '#0a1a4e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Header */}
                <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] }]}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity style={styles.hamburger}>
                            <Image source={require('../assets/idhayam.png')} style={styles.headerLogo} />
                        </TouchableOpacity>
                        <Text style={[styles.distributorNameTitle]}>DISTRIBUTOR'S NAME</Text>
                        <View style={styles.headerRight}>
                            <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.replace('Login')}>
                                <PowerIcon />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Check Balance & Vehicle */}
                    <View style={styles.actionSection}>
                        <TouchableOpacity onPress={handleToggleBalance} activeOpacity={0.8}>
                            <GlassCard style={styles.actionButtonGlass} padding={14}>
                                <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Check Balance</Text>
                                <Text style={[styles.actionButtonIcon, { color: colors.textPrimary }]}>{showBalance ? '▲' : '▶'}</Text>
                            </GlassCard>
                        </TouchableOpacity>

                        {showBalance && (
                            <GlassCard style={styles.infoBoxGlass} padding={16}>
                                {loadingBalance ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <View style={styles.infoRow}>
                                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>BALANCE</Text>
                                            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>Rs. {balanceData?.balance ?? '—'}</Text>
                                        </View>
                                        <View style={[styles.infoLine, { backgroundColor: colors.divider }]} />
                                        <View style={styles.infoRow}>
                                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>PENDING ORDER</Text>
                                            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>Rs. {balanceData?.pendingOrder ?? '—'}</Text>
                                        </View>
                                        <View style={[styles.infoLine, { backgroundColor: colors.divider }]} />
                                        <View style={styles.infoRow}>
                                            <Text style={[styles.infoLabel, { color: BrandColors.yellow500 }]}>NET BALANCE</Text>
                                            <Text style={[styles.infoValue, { color: BrandColors.yellow500 }]}>Rs. {balanceData?.netBalance ?? balanceData?.balance ?? '—'}</Text>
                                        </View>
                                    </>
                                )}
                            </GlassCard>
                        )}

                        <TouchableOpacity onPress={handleToggleVehicle} activeOpacity={0.8}>
                            <GlassCard style={styles.actionButtonGlass} padding={14}>
                                <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Check Vehicle</Text>
                                <Text style={[styles.actionButtonIcon, { color: colors.textPrimary }]}>{showVehicle ? '▲' : '▶'}</Text>
                            </GlassCard>
                        </TouchableOpacity>

                        {showVehicle && (
                            <View style={styles.dispatchContainer}>
                                {loadingVehicles ? (
                                    <ActivityIndicator color="#fff" style={{ marginTop: 8 }} />
                                ) : vehicles.length === 0 ? (
                                    <Text style={[styles.dispatchTitle, { color: colors.textSecondary }]}>No vehicles found.</Text>
                                ) : (
                                    vehicles.map((v: any, idx: number) => (
                                        <View key={idx}>
                                            <Text style={[styles.dispatchTitle, { color: colors.textSecondary }]}>Your dispatch is on the way....</Text>
                                            <TouchableOpacity activeOpacity={0.8} onPress={() => navigate('VehicleTracking' as any)}>
                                                <GlassCard style={styles.dispatchCardGlass} padding={12}>
                                                    <View style={styles.dispatchImagePlaceholder}>
                                                        <Text style={{ fontSize: 22 }}>🚚</Text>
                                                    </View>
                                                    <View style={styles.dispatchInfo}>
                                                        <Text style={[styles.dispatchVehicleNo, { color: colors.textPrimary }]}>{v.vehicleNo ?? v.VEHICLE_NO ?? 'TN67BH5688'}</Text>
                                                        <Text style={[styles.dispatchRef, { color: colors.textSecondary }]}>{v.tripRefNo ?? v.TRIP_REF_NO ?? 'TJ-1870'}</Text>
                                                    </View>
                                                    <View style={styles.dispatchBadge}>
                                                        <Text style={styles.dispatchBadgeText}>TN</Text>
                                                    </View>
                                                </GlassCard>
                                            </TouchableOpacity>
                                        </View>
                                    ))
                                )}
                            </View>
                        )}
                    </View>
                </Animated.View>

                {/* Features Grid */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Features</Text>
                    <LinearGradient
                        colors={[BrandColors.red600, BrandColors.yellow500, BrandColors.blue500]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.sectionLine}
                    />
                    <View style={styles.grid}>
                        {FEATURES.map((f, i) => (
                            <FeatureCard
                                key={f.id}
                                icon={f.icon}
                                label={f.label}
                                color={f.color}
                                delay={i * 80}
                                onPress={() => navigate(f.id as keyof RootStackParamList)}
                            />
                        ))}
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <LinearGradient
                        colors={[BrandColors.red600, BrandColors.yellow500, BrandColors.blue700]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.footerLine}
                    />
                    <Text style={[styles.footerText, { color: colors.textMuted }]}>
                        v1.0.0 • Idhayam Distributor App
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingBottom: 40 },
    header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    hamburger: { padding: 8, marginLeft: -8 },
    headerLogo: { width: 32, height: 32, resizeMode: 'contain' },
    distributorNameTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1 },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    headerAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
    logoutBtn: {
        marginLeft: 12,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: BrandColors.red600,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: BrandColors.red600,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
    },

    actionSection: { marginBottom: 10 },
    actionButtonGlass: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: 'bold'
    },
    actionButtonIcon: {
        fontSize: 14,
    },
    infoBoxGlass: {
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    infoLine: {
        height: 1,
        marginVertical: 4,
    },
    dispatchContainer: {
        paddingTop: 8,
        marginBottom: 12,
        alignItems: 'center',
    },
    dispatchTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    dispatchCardGlass: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        maxWidth: 320,
    },
    dispatchImagePlaceholder: {
        width: 50,
        height: 35,
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    dispatchInfo: {
        flex: 1,
    },
    dispatchVehicleNo: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    dispatchRef: {
        color: '#BBDEFB',
        fontSize: 13,
        marginTop: 2,
        fontWeight: '600',
    },
    dispatchBadge: {
        backgroundColor: '#00E676',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 3,
    },
    dispatchBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    section: { paddingHorizontal: 20, marginTop: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
    sectionLine: { height: 2, width: 40, borderRadius: 1, marginBottom: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    featureCard: { width: CARD_WIDTH, borderRadius: 18, borderWidth: 1, padding: 16, alignItems: 'center' },
    featureIconBg: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    featureIcon: { fontSize: 26 },
    featureLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center', letterSpacing: 0.2 },
    footer: { alignItems: 'center', marginTop: 32, paddingBottom: 8 },
    footerLine: { height: 3, width: 50, borderRadius: 2, marginBottom: 10 },
    footerText: { fontSize: 11, letterSpacing: 0.5 },
});

export default DashboardScreen;
