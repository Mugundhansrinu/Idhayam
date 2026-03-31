import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
    Animated,
    Platform,
} from 'react-native';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useSession } from '../context/SessionContext';
import { getCustomerBalance, getInvoicedVehicleList } from '../api';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

const { width, height } = Dimensions.get('window');

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'> };

const MODULES = [
    { id: 'OrderEntry', icon: 'shopping-basket', iconColor: '#3861FB', label: 'Order Entry', sub: 'Create new orders', color: '#F0F4FF' },
    { id: 'Discount', icon: 'local-offer', iconColor: '#3861FB', label: 'Discount Details', sub: 'Save discounts', color: '#F0F4FF' },
    { id: 'PriceDetails', icon: 'currency-rupee', iconColor: '#3861FB', label: 'Price Details', sub: 'View live rates', color: '#F0F4FF' },
    { id: 'Report', icon: 'bar-chart', iconColor: '#3861FB', label: 'Reports', sub: 'Order & Analysis', color: '#F0F4FF' },
    { id: 'BankDetails', icon: 'account-balance', iconColor: '#3861FB', label: 'Bank Details', sub: 'Virtual accounts', color: '#F0F4FF' },
    { id: 'ContactUs', icon: 'support-agent', iconColor: '#3861FB', label: 'Contact Us', sub: 'Support & Help', color: '#F0F4FF' },
];

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const { session, clearSession } = useSession();
    const [balanceData, setBalanceData] = useState<any>({ balance: '0.0', pendingOrder: '0.0', netBalance: '0.0' });
    const [vehicleData, setVehicleData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeSlide, setActiveSlide] = useState(0);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const custId   = session?.custId   || undefined;
            const branchId = session?.branchId || undefined;
            const [bal, vehicles] = await Promise.all([
                getCustomerBalance(custId),
                getInvoicedVehicleList(custId, branchId)
            ]);
            setBalanceData({
                balance: bal.balance || '0.0',
                pendingOrder: bal.pendingOrder || '0.0',
                netBalance: bal.netBalance || '0.0'
            });
            if (vehicles && vehicles.length > 0) setVehicleData(vehicles[0]);
        } catch (e) {
            console.error('Dashboard fetchData error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleScroll = (event: any) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        setActiveSlide(Math.round(index));
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                
                {/* 1. Header Section */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View style={styles.profileRow}>
                            <View style={styles.profileBox}>
                                <Image source={require('../assets/papa 1.png')} style={styles.profileImg} />
                            </View>
                            <View style={styles.headerText}>
                                <Text style={styles.headerBrand}>IDHAYAM</Text>
                                <Text style={styles.distributorName} numberOfLines={1}>
                                    {session?.custName || 'Loading...'}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.profileIconBtn} onPress={() => clearSession().then(() => navigation.replace('Login'))}>
                            <Icon name="logout" size={22} color="#3861FB" />
                        </TouchableOpacity>
                    </View>

                    {/* 2. Horizontal Slider Section (3 SLIDES) */}
                    <View style={styles.sliderContainer}>
                        <ScrollView 
                            horizontal 
                            pagingEnabled 
                            showsHorizontalScrollIndicator={false} 
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                        >
                            {/* Slide 1: Account Balance */}
                            <View style={styles.balSlide}>
                                <LinearGradient colors={['#3861FB', '#2752E7']} style={styles.balCard} start={{x:0,y:0}} end={{x:1,y:1}}>
                                    <View style={styles.slideHeader}>
                                        <View style={styles.slideIconBg}>
                                            <Icon name="account-balance-wallet" size={22} color="#3861FB" />
                                        </View>
                                        <Text style={styles.slideTitle}>Account Balance</Text>
                                        <TouchableOpacity style={styles.ledgerBtn}><Text style={styles.ledgerText}>LEDGER</Text></TouchableOpacity>
                                    </View>
                                    <Text style={styles.balMainValue}>₹ {balanceData.balance}</Text>
                                    <View style={styles.slideFooter}>
                                        <View>
                                            <Text style={styles.subLabel}>Credit Limit</Text>
                                            <Text style={styles.subValue}>₹ 2,00,000</Text>
                                        </View>
                                        <View style={styles.divider} />
                                        <View>
                                            <Text style={styles.subLabel}>Pending Order</Text>
                                            <Text style={styles.subValue}>₹ {balanceData.pendingOrder}</Text>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </View>

                            {/* Slide 2: Vessel Tracking */}
                            <View style={styles.balSlide}>
                                <LinearGradient colors={['#3861FB', '#2752E7']} style={styles.balCard} start={{x:0,y:0}} end={{x:1,y:1}}>
                                    <View style={styles.slideHeader}>
                                        <View style={styles.slideIconBg}>
                                            <Icon name="local-shipping" size={22} color="#3861FB" />
                                        </View>
                                        <Text style={styles.slideTitle}>Vessel Tracking</Text>
                                        <View style={styles.liveRecordIndicator}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
                                    </View>
                                    {vehicleData ? (
                                        <View style={styles.trackContent}>
                                            <Text style={styles.truckNo}>{vehicleData.VEHICLE_NO || 'TN-38-AX-0000'}</Text>
                                            <View style={styles.locationRow}>
                                                <Icon name="near-me" size={14} color="rgba(255,255,255,0.7)" style={{ marginRight: 6 }} />
                                                <Text style={styles.truckLoc}>In-Transit (Salem District)</Text>
                                            </View>
                                            <View style={styles.etaBar}>
                                                <Text style={styles.etaLabel}>ESTIMATED ARRIVAL</Text>
                                                <Text style={styles.etaTime}>45 Mins - 1 Hour Away</Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={styles.noTrack}>
                                            <Icon name="not-interested" size={30} color="rgba(255,255,255,0.3)" />
                                            <Text style={styles.noTrackText}>No active dispatches for today</Text>
                                        </View>
                                    )}
                                </LinearGradient>
                            </View>

                            {/* Slide 3: Branch Details (NEW) */}
                            <View style={styles.balSlide}>
                                <LinearGradient colors={['#3861FB', '#2752E7']} style={styles.balCard} start={{x:0,y:0}} end={{x:1,y:1}}>
                                    <View style={styles.slideHeader}>
                                        <View style={styles.slideIconBg}>
                                            <Icon name="business" size={22} color="#3861FB" />
                                        </View>
                                        <Text style={styles.slideTitle}>Active Branch Info</Text>
                                        <View style={styles.activeLabel}><Text style={styles.activeLabelText}>CURRENT</Text></View>
                                    </View>
                                    <View style={styles.branchContent}>
                                        <Text style={styles.branchMainName}>{session?.branchName || 'COIMBATORE MAIN'}</Text>
                                        <View style={styles.branchMeta}>
                                            <View style={styles.branchIdTag}>
                                                <Text style={styles.branchIdText}>ID: {session?.branchId || 'CB-01'}</Text>
                                            </View>
                                            <View style={[styles.branchIdTag, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                                <Text style={styles.branchIdText}>{session?.custType || 'CM'}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.slideFooter}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.subLabel}>HUB</Text>
                                            <Text style={styles.subValue} numberOfLines={1}>{session?.hubName || 'N/A'}</Text>
                                        </View>
                                        <View style={styles.divider} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.subLabel}>TERRITORY</Text>
                                            <Text style={styles.subValue} numberOfLines={1}>{session?.territoryName || 'N/A'}</Text>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </View>
                        </ScrollView>
                        
                        {/* Pagination Dots (3 DOTS) */}
                        <View style={styles.pagination}>
                            <View style={[styles.dot, activeSlide === 0 && styles.dotActive]} />
                            <View style={[styles.dot, activeSlide === 1 && styles.dotActive]} />
                            <View style={[styles.dot, activeSlide === 2 && styles.dotActive]} />
                        </View>
                    </View>
                </View>

                {/* 3. Main Modules Section */}
                <View style={styles.moduleSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Distributor Master</Text>
                        <View style={styles.activeBadge}>
                            <Text style={styles.activeBadgeText}>6 Live Services</Text>
                        </View>
                    </View>

                    <View style={styles.moduleGrid}>
                        {MODULES.map((m) => (
                            <TouchableOpacity 
                                key={m.id} 
                                style={[styles.moduleCard, { backgroundColor: '#FFFFFF' }]}
                                onPress={() => navigation.navigate(m.id as any)}
                            >
                                <View style={styles.moduleCardInner}>
                                    <View style={[styles.modIconArea, { backgroundColor: m.color }]}>
                                        <Icon name={m.icon} size={28} color={m.iconColor} />
                                    </View>
                                    <Text style={styles.modLabel}>{m.label}</Text>
                                    <View style={styles.modFooter}>
                                        <Text style={styles.modSub}>{m.sub}</Text>
                                        <Icon name="chevron-right" size={14} color="#CBD5E0" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    scroll: { paddingBottom: 40 },

    header: { paddingHorizontal: 25, paddingTop: Platform.OS === 'ios' ? 60 : 40, backgroundColor: '#FFFFFF', paddingBottom: 25 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
    profileRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    profileBox: { width: 64, height: 64, borderRadius: 24, padding: 8, backgroundColor: '#F8F9FD', elevation: 2 },
    profileImg: { width: '100%', height: '100%', resizeMode: 'contain', borderRadius: 16 },
    headerText: { marginLeft: 15, flex: 1 },
    headerBrand: { fontSize: 9, fontWeight: '900', color: '#64748B', letterSpacing: 1.5 },
    distributorName: { fontSize: 17, fontWeight: '900', color: '#1A1A1A', marginTop: 1 },
    profileIconBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8F9FD', alignItems: 'center', justifyContent: 'center' },

    // Slider
    sliderContainer: { marginTop: 10 },
    balSlide: { width: width - 50 },
    balCard: { height: 220, borderRadius: 32, padding: 25, elevation: 8, shadowColor: '#3861FB', shadowOpacity: 0.25, shadowRadius: 20, justifyContent: 'space-between' },
    slideHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    slideIconBg: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    slideTitle: { flex: 1, marginLeft: 12, fontSize: 13, fontWeight: '900', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.5 },
    ledgerBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)' },
    ledgerText: { color: '#fff', fontSize: 9, fontWeight: '900' },
    balMainValue: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 20 },
    slideFooter: { flexDirection: 'row', alignItems: 'center', paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    subLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 },
    subValue: { fontSize: 15, fontWeight: '900', color: '#fff', marginTop: 2 },
    divider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 20 },

    trackContent: { marginTop: -5 },
    truckNo: { fontSize: 24, fontWeight: '900', color: '#fff' },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    truckLoc: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
    etaBar: { marginTop: 15, backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    etaLabel: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
    etaTime: { fontSize: 14, fontWeight: '900', color: '#fff', marginTop: 2 },
    liveRecordIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff', marginRight: 5 },
    liveText: { color: '#fff', fontSize: 8, fontWeight: '900' },
    noTrack: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
    noTrackText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '700', marginTop: 10 },

    // Branch Slide Styles
    branchContent: { marginTop: -5 },
    branchMainName: { fontSize: 22, fontWeight: '900', color: '#fff' },
    branchMeta: { flexDirection: 'row', marginTop: 10 },
    branchIdTag: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginRight: 8 },
    branchIdText: { color: '#fff', fontSize: 11, fontWeight: '900' },
    activeLabel: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    activeLabelText: { color: '#fff', fontSize: 8, fontWeight: '900' },

    pagination: { flexDirection: 'row', justifyContent: 'center', marginTop: 15 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E2E8F0', marginHorizontal: 4 },
    dotActive: { width: 22, backgroundColor: '#3861FB' },

    // Modules
    moduleSection: { paddingHorizontal: 25, paddingTop: 10 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A1A' },
    activeBadge: { backgroundColor: '#F0F4FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    activeBadgeText: { fontSize: 10, fontWeight: '900', color: '#3861FB' },
    moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    moduleCard: { width: (width - 65) / 2, marginBottom: 15, borderRadius: 32, elevation: 3, shadowColor: '#3861FB', shadowOpacity: 0.05, shadowRadius: 15 },
    moduleCardInner: { padding: 22 },
    modIconArea: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
    modLabel: { fontSize: 14, fontWeight: '900', color: '#1A1A1A' },
    modFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
    modSub: { fontSize: 11, fontWeight: '700', color: '#A0AEC0' },
});

export default DashboardScreen;
