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
    Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getCustomerBalance, getInvoicedVehicleList } from '../api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSession } from '../context/SessionContext';

const { width } = Dimensions.get('window');
const FEATURE_CARD_WIDTH = (width - 50) / 2;

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

const FEATURES = [
    { id: 'OrderEntry', icon: '📦', label: 'Order Entry', color: '#B4A2FF' },
    { id: 'Discount', icon: '🏷️', label: 'Discount Details', color: '#FFB8D9' },
    { id: 'PriceDetails', icon: '💲', label: 'Price Details', color: '#FFEAA7' },
    { id: 'Report', icon: '📊', label: 'Reports', color: '#A3EFEF' },
    { id: 'BankDetails', icon: '🏦', label: 'Bank Details', color: '#B2F7C8' },
    { id: 'ContactUs', icon: '📞', label: 'Contact Us', color: '#FFBCB0' },
];

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const { session, clearSession } = useSession();
    const [balanceData, setBalanceData] = useState<any>({ balance: '0.00', pendingOrder: '0.00', netBalance: '0.00' });
    const [vehicleData, setVehicleData] = useState<any>(null);

    const [isBalExpanded, setIsBalExpanded] = useState(false);
    const [isVehExpanded, setIsVehExpanded] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const balanceHeight = useRef(new Animated.Value(0)).current;
    const vehicleHeight = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        fetchData();
    }, []);

    const toggleBalance = () => {
        const toValue = isBalExpanded ? 0 : 1;
        setIsBalExpanded(!isBalExpanded);
        Animated.spring(balanceHeight, { toValue, friction: 8, tension: 40, useNativeDriver: false }).start();
        if (!isBalExpanded && isVehExpanded) toggleVehicle();
    };

    const toggleVehicle = () => {
        const toValue = isVehExpanded ? 0 : 1;
        setIsVehExpanded(!isVehExpanded);
        Animated.spring(vehicleHeight, { toValue, friction: 8, tension: 40, useNativeDriver: false }).start();
        if (!isVehExpanded && isBalExpanded) toggleBalance();
    };

    const fetchData = async () => {
        try {
            const custId = session?.custId || undefined;
            const [bal, vehicles] = await Promise.all([
                getCustomerBalance(custId),
                getInvoicedVehicleList(custId)
            ]);
            setBalanceData({
                balance: bal.balance || '0.00',
                pendingOrder: bal.pendingOrder || '0.00',
                netBalance: bal.netBalance || bal.balance || '0.00'
            });
            if (vehicles && vehicles.length > 0) setVehicleData(vehicles[0]);
        } catch (e) { console.error(e); }
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                
                {/* PREMIUM CURVED HEADER */}
                <View style={styles.headerWrapper}>
                    <LinearGradient
                        colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={styles.topHeader}>
                        
                        <View style={styles.headerRow}>
                            <View style={styles.profileBox}>
                                <Image source={require('../assets/idhayam.png')} style={styles.profileImg} />
                            </View>
                            <View style={styles.nameContainer}>
                                <Text style={styles.brandName}>IDHAYAM</Text>
                                <Text style={styles.distributorName}>
                                    {session?.custName || 'DISTRIBUTOR'}
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.powerBtn} onPress={async () => {
                                await clearSession();
                                navigation.replace('Login');
                            }}>
                                <Icon name="logout" size={22} color="#fff" />
                            </TouchableOpacity>
                        </View>


                    </LinearGradient>
                </View>

                {/* INTERACTIVE ACTIONS SECTION */}
                <View style={styles.actionSection}>
                    
                    {/* BALANCE ACTION */}
                    <View style={styles.cardWrapper}>
                        <TouchableOpacity style={[styles.mainActionCard, isBalExpanded && styles.activeCard]} activeOpacity={0.9} onPress={toggleBalance}>
                            <LinearGradient 
                                colors={isBalExpanded ? [BrandColors.primaryGradientStart + '15', '#fff'] : ['#fff', '#fff']}
                                style={styles.cardInner}>
                                <View style={styles.cardLeft}>
                                    <View style={[styles.iconCircle, { backgroundColor: '#F0F4FF' }]}>
                                        <Text style={{ fontSize: 20 }}>💎</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.cardTitle}>Account Balance</Text>
                                        <Text style={styles.cardSub}>View detailed ledger info</Text>
                                    </View>
                                </View>
                                <Animated.View style={{ 
                                    transform: [{ rotate: balanceHeight.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] 
                                }}>
                                    <Icon name="expand-more" size={24} color="#BDBDBD" />
                                </Animated.View>
                            </LinearGradient>
                        </TouchableOpacity>

                        <Animated.View style={{
                            overflow: 'hidden',
                            maxHeight: balanceHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 200] }),
                            opacity: balanceHeight,
                        }}>
                            <View style={styles.expandContent}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>BALANCE</Text>
                                    <Text style={styles.detailVal}>₹ {balanceData.balance}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>PENDING ORDER</Text>
                                    <Text style={styles.detailVal}>₹ {balanceData.pendingOrder}</Text>
                                </View>
                                <View style={[styles.detailRow, styles.totalRow]}>
                                    <Text style={styles.totalLabel}>NET BALANCE</Text>
                                    <Text style={styles.totalVal}>₹ {balanceData.netBalance}</Text>
                                </View>
                            </View>
                        </Animated.View>
                    </View>

                    {/* VEHICLE ACTION */}
                    <View style={[styles.cardWrapper, { marginTop: 15 }]}>
                        <TouchableOpacity style={[styles.mainActionCard, isVehExpanded && styles.activeCard]} activeOpacity={0.9} onPress={toggleVehicle}>
                            <LinearGradient 
                                colors={isVehExpanded ? [BrandColors.verifyGradientStart + '15', '#fff'] : ['#fff', '#fff']}
                                style={styles.cardInner}>
                                <View style={styles.cardLeft}>
                                    <View style={[styles.iconCircle, { backgroundColor: '#E8FDF0' }]}>
                                        <Text style={{ fontSize: 20 }}>🚚</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.cardTitle}>Live Tracking</Text>
                                        <Text style={styles.cardSub}>Track currently invoiced vehicles</Text>
                                    </View>
                                </View>
                                <Animated.View style={{ 
                                    transform: [{ rotate: vehicleHeight.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] 
                                }}>
                                    <Icon name="expand-more" size={24} color="#BDBDBD" />
                                </Animated.View>
                            </LinearGradient>
                        </TouchableOpacity>

                        <Animated.View style={{
                            overflow: 'hidden',
                            maxHeight: vehicleHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 250] }),
                            opacity: vehicleHeight,
                        }}>
                            <View style={styles.expandContent}>
                                {vehicleData ? (
                                    <View style={styles.vDetailCard}>
                                        <View style={styles.vRow}>
                                            <View>
                                                <Text style={styles.vLabel}>VEHICLE NO</Text>
                                                <Text style={styles.vNum}>{vehicleData.vehicleNo}</Text>
                                            </View>
                                            <View style={styles.vBadge}>
                                                <View style={styles.vDot} />
                                                <Text style={styles.vStatus}>MOVING</Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity 
                                            onPress={() => navigation.navigate('VehicleTracking')}
                                            style={styles.trackBtn}>
                                            <Text style={styles.trackBtnText}>Track Order on Map →</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <Text style={styles.vNone}>No active shipments at the moment.</Text>
                                )}
                            </View>
                        </Animated.View>
                    </View>

                </View>

                {/* FEATURES GRID */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Main Modules</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>6 ACTIVE</Text>
                        </View>
                    </View>

                    <Animated.View style={[styles.grid, { opacity: fadeAnim }]}>
                        {FEATURES.map((f) => (
                            <TouchableOpacity 
                                key={f.id} 
                                style={styles.featureCard}
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate(f.id as any)}>
                                <View style={[styles.featIconBox, { backgroundColor: f.color + '20' }]}>
                                    <Text style={{ fontSize: 24 }}>{f.icon}</Text>
                                </View>
                                <Text style={styles.featLabel}>{f.label}</Text>
                                <Icon name="chevron-right" size={16} color="#D1D1E0" />
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                </View>

                {/* FOOTER */}
                <View style={styles.footer}>
                    <View style={styles.footerLine} />
                    <Text style={styles.footerText}>IDHAYAM DISTRIBUTOR PORTAL • v6.10</Text>
                </View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FBFBFF' },
    scroll: { paddingBottom: 40 },
    
    headerWrapper: {
        backgroundColor: '#FBFBFF',
        borderBottomLeftRadius: 45,
        borderBottomRightRadius: 45,
        overflow: 'hidden',
        elevation: 15,
        shadowColor: BrandColors.primaryGradientStart,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    topHeader: {
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingHorizontal: 25,
        paddingBottom: 40,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 35,
    },
    profileBox: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: '#fff',
        padding: 8,
    },
    profileImg: { width: '100%', height: '100%', resizeMode: 'contain' },
    nameContainer: { flex: 1, marginHorizontal: 15 },
    brandName: { color: '#ffffffcc', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
    distributorName: { color: '#fff', fontSize: 19, fontWeight: '900' },
    powerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

    previewStats: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    pStat: { flex: 1 },
    pLabel: { color: '#ffffffcc', fontSize: 9, fontWeight: '900', marginBottom: 4, letterSpacing: 0.5 },
    pValue: { color: '#fff', fontSize: 16, fontWeight: '900' },
    divider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 15 },

    actionSection: { paddingHorizontal: 20, marginTop: -25 },
    cardWrapper: {
        backgroundColor: '#fff',
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
    },
    mainActionCard: { },
    activeCard: { borderLeftWidth: 4, borderLeftColor: BrandColors.primaryGradientStart },
    cardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center' },
    iconCircle: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    cardTitle: { fontSize: 16, fontWeight: '900', color: '#1F1F39' },
    cardSub: { fontSize: 12, color: '#858597', marginTop: 2, fontWeight: '600' },

    expandContent: { paddingHorizontal: 20, paddingBottom: 20 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
    detailLabel: { fontSize: 13, fontWeight: '600', color: '#858597' },
    detailVal: { fontSize: 14, fontWeight: '800', color: '#1F1F39' },
    totalRow: { borderTopWidth: 1, borderTopColor: '#F0F0F5', marginTop: 5, paddingTop: 15 },
    totalLabel: { fontSize: 14, fontWeight: '900', color: BrandColors.primaryGradientStart },
    totalVal: { fontSize: 20, fontWeight: '900', color: BrandColors.primaryGradientStart },

    vDetailCard: { backgroundColor: '#F8F9FD', borderRadius: 16, padding: 15, marginTop: 10 },
    vRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    vLabel: { fontSize: 9, fontWeight: '900', color: '#858597', letterSpacing: 1 },
    vNum: { fontSize: 16, fontWeight: '900', color: '#1F1F39', marginTop: 2 },
    vBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8FDF0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    vDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#27AE60', marginRight: 6 },
    vStatus: { fontSize: 10, fontWeight: '900', color: '#27AE60' },
    trackBtn: { backgroundColor: BrandColors.primaryGradientStart, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 15 },
    trackBtnText: { color: '#fff', fontSize: 12, fontWeight: '900' },
    vNone: { textAlign: 'center', color: '#858597', fontSize: 13, paddingVertical: 15 },

    section: { paddingHorizontal: 20, marginTop: 35 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { fontSize: 22, fontWeight: '900', color: '#1F1F39' },
    badge: { backgroundColor: BrandColors.primaryGradientStart + '10', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 10, fontWeight: '900', color: BrandColors.primaryGradientStart },

    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    featureCard: {
        width: FEATURE_CARD_WIDTH,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        alignItems: 'center',
    },
    featIconBox: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    featLabel: { fontSize: 13, fontWeight: '900', color: '#1F1F39', marginBottom: 8, textAlign: 'center' },

    footer: { alignItems: 'center', marginTop: 30, paddingBottom: 20 },
    footerLine: { width: 40, height: 3, backgroundColor: '#EDEDF2', borderRadius: 2, marginBottom: 15 },
    footerText: { fontSize: 10, fontWeight: '900', color: '#BDBDBD', letterSpacing: 1 },
});

export default DashboardScreen;
