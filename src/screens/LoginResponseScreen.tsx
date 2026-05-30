import React, { useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Animated,
    Image,
    Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import LinearGradient from 'react-native-linear-gradient';
import { useSession } from '../context/SessionContext';
import { BrandColors } from '../theme/Colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'LoginResponse'>;
    route: RouteProp<RootStackParamList, 'LoginResponse'>;
};

const { width, height } = Dimensions.get('window');

const LoginResponseScreen: React.FC<Props> = ({ navigation, route }) => {
    const { setSession } = useSession();
    const { data } = route.params;
    const insets = useSafeAreaInsets();

    // ── Parse branch list ──────────────────────────────────────────────────────
    const branches: any[] = useMemo(() => {
        if (data?.result) {
            if (Array.isArray(data.result)) return data.result;
            if (typeof data.result === 'string') {
                try {
                    const parsed = JSON.parse(data.result);
                    return Array.isArray(parsed) ? parsed : [];
                } catch (e) {
                    console.error('Branch parse error:', e);
                }
            }
        }
        if (Array.isArray(data)) return data;
        return [];
    }, [data]);

    // ── Entrance animations ────────────────────────────────────────────────────
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const cardAnims = useRef(branches.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        if (branches.length === 1) {
            const timer = setTimeout(() => {
                handleSelectBranch(branches[0]);
            }, 600);
            return () => clearTimeout(timer);
        }

        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        Animated.stagger(80,
            cardAnims.map(a =>
                Animated.spring(a, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true })
            )
        ).start();
    }, [branches]);

    const handleSelectBranch = async (branch: any) => {
        await setSession({
            custId:        String(branch.CUST_ID        ?? branch.custId   ?? ''),
            branchId:      String(branch.BRANCH_ID      ?? branch.branchId ?? ''),
            userId:        String(data.eid              ?? '2937'),
            custName:      String(branch.CUST_NAME_DISPLAY ?? branch.custName ?? 'Distributor'),
            custType:      String(branch.CUST_TYPE      ?? 'CM'),
            partyMudId:    String(branch.PARTY_MUD_ID   ?? ''),
            hubName:       String(branch.HUB_NAME       ?? ''),
            territoryName: String(branch.TERRITORY_NAME ?? ''),
            gstNo:         String(branch.GST_NO         ?? ''),
            pan:           String(data.pan              ?? ''),
            mobile:        String(data.mobile           ?? ''),
            branchName:    String(branch.CUST_NAME_DISPLAY ?? branch.HUB_NAME ?? 'MAIN BRANCH'),
            accountCount:  branches.length,
            loginData:     data,
        });
        navigation.replace('Dashboard');
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            {/* ── Premium Header ── */}
            <LinearGradient
                colors={['#3861FB', '#2752E7']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[
                    styles.header,
                    { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 60 : 40) }
                ]}
            >
                <View style={styles.headerContent}>
                    <View style={styles.logoRow}>
                        <Image source={require('../assets/papa 1.png')} style={styles.logoImg} />
                        <View style={styles.badgeLine}>
                            <Text style={styles.badgeText}>IDHAYAM DISTRIBUTOR</Text>
                        </View>
                    </View>
                    <Text style={styles.welcomeText}>Select Your Account</Text>
                    <Text style={styles.subText}>Choose an operating unit to access the dashboard</Text>
                </View>
            </LinearGradient>

            {/* ── Branch List ── */}
            <View style={styles.listWrapper}>
                <ScrollView 
                    contentContainerStyle={[styles.scroll, { paddingBottom: 50 }]}
                    showsVerticalScrollIndicator={false}
                >
                    {branches.length > 0 ? (
                        branches.map((branch: any, index: number) => (
                            <Animated.View
                                key={String(index)}
                                style={{
                                    opacity: cardAnims[index] ?? 1,
                                    transform: [{
                                        translateY: (cardAnims[index] ?? new Animated.Value(1)).interpolate({
                                            inputRange: [0, 1], outputRange: [40, 0],
                                        }),
                                    }],
                                }}
                            >
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    onPress={() => handleSelectBranch(branch)}
                                    style={styles.branchCard}
                                >
                                    <View style={styles.cardHeader}>
                                        <View style={styles.iconBox}>
                                            <Icon name="storefront" size={24} color="#3861FB" />
                                        </View>
                                        <View style={styles.branchDetails}>
                                            <Text style={styles.branchName} numberOfLines={1}>
                                                {branch.CUST_NAME_DISPLAY || 'Standard Branch'}
                                            </Text>
                                        </View>
                                        <View style={styles.arrowBox}>
                                            <Icon name="keyboard-arrow-right" size={24} color="#CBD5E0" />
                                        </View>
                                    </View>

                                    <View style={styles.divider} />

                                    <View style={styles.detailsContainer}>
                                        <View style={styles.detailGrid}>
                                            <View style={styles.detailBox}>
                                                <View style={[styles.iconContainer, { backgroundColor: '#E0E7FF' }]}>
                                                    <Icon name="place" size={16} color="#3861FB" />
                                                </View>
                                                <View>
                                                    <Text style={styles.detailLabel}>LOCATION</Text>
                                                    <Text style={styles.detailValue} numberOfLines={1}>{branch.LOCATION_NAME || branch.HUB_NAME || 'Main HQ'}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.detailBox}>
                                                <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
                                                    <Icon name="phone" size={16} color="#9333EA" />
                                                </View>
                                                <View>
                                                    <Text style={styles.detailLabel}>MOBILE</Text>
                                                    <Text style={styles.detailValue} numberOfLines={1}>{data.mobile || 'N/A'}</Text>
                                                </View>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.detailMultiBox}>
                                            <View style={[styles.iconContainer, { backgroundColor: '#FEF9C3' }]}>
                                                <Icon name="receipt" size={16} color="#EAB308" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.detailLabel}>GST NUMBER</Text>
                                                <Text style={styles.detailValue} numberOfLines={1}>{branch.GST_NO || branch.GSTNO || 'N/A'}</Text>
                                            </View>
                                        </View>

                                        {(branch.ADDRESS || branch.ADDRS) && (
                                            <View style={[styles.detailMultiBox, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
                                                <View style={[styles.iconContainer, { backgroundColor: '#F0FDF4' }]}>
                                                    <Icon name="location-city" size={16} color="#16A34A" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.detailLabel}>ADDRESS</Text>
                                                    <Text style={styles.addressValue} numberOfLines={2}>
                                                        {branch.ADDRESS || branch.ADDRS}
                                                    </Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.cardStatusRow}>
                                        <View style={styles.statusBadge}>
                                            <View style={styles.statusDot} />
                                            <Text style={styles.statusText}>ACTIVE</Text>
                                        </View>
                                        <Text style={styles.territoryText}>{branch.TERRITORY_NAME || ''}</Text>
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                        ))
                    ) : (
                        <View style={styles.emptyBox}>
                            <Icon name="business-center" size={60} color="#CBD5E0" />
                            <Text style={styles.emptyText}>No branches mapped</Text>
                            <Text style={styles.emptySub}>Please contact Idhayam support to link a branch to your account.</Text>
                        </View>
                    )}
                </ScrollView>
            </View>


        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FD' },
    
    header: {
        paddingBottom: 80,
        paddingHorizontal: 30,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    headerContent: { zIndex: 1 },
    logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    logoImg: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#fff', padding: 5 },
    badgeLine: { marginLeft: 15, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 1 },
    welcomeText: { fontSize: 28, fontWeight: '900', color: '#fff' },
    subText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 5, fontWeight: '600' },

    listWrapper: { flex: 1, marginTop: -40 },
    scroll: { paddingHorizontal: 25, paddingBottom: 50 },

    branchCard: {
        backgroundColor: '#fff',
        borderRadius: 32,
        padding: 24,
        marginBottom: 16,
        elevation: 6,
        shadowColor: '#3861FB',
        shadowOpacity: 0.1,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 8 },
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 56, height: 56, borderRadius: 20, backgroundColor: '#F0F4FF', alignItems: 'center', justifyContent: 'center' },
    branchDetails: { flex: 1, marginLeft: 15, justifyContent: 'center' },
    branchName: { fontSize: 16, fontWeight: '900', color: '#1A1A1A' },
    branchId: { fontSize: 11, fontWeight: '700', color: '#3861FB', marginTop: 2 },
    arrowBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F8F9FD', alignItems: 'center', justifyContent: 'center' },

    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },

    detailsContainer: { 
        backgroundColor: '#F8FAFC', 
        borderRadius: 16, 
        padding: 16, 
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    detailGrid: { 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 12,
        marginBottom: 12,
    },
    detailBox: { 
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    detailMultiBox: { 
        flexDirection: 'row', 
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 12,
        marginBottom: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    detailLabel: { 
        fontSize: 9, 
        fontWeight: '800', 
        color: '#94A3B8', 
        letterSpacing: 0.5 
    },
    detailValue: { 
        fontSize: 13, 
        fontWeight: '700', 
        color: '#334155', 
        marginTop: 2 
    },
    addressValue: { 
        fontSize: 12, 
        fontWeight: '600', 
        color: '#475569', 
        marginTop: 3, 
        lineHeight: 18 
    },

    cardStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 6 },
    statusText: { fontSize: 9, fontWeight: '900', color: '#10B981' },
    territoryText: { fontSize: 10, fontWeight: '700', color: '#A0AEC0', textTransform: 'uppercase' },

    emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 40 },
    emptyText: { fontSize: 18, fontWeight: '900', color: '#1A1A1A', marginTop: 20 },
    emptySub: { fontSize: 13, color: '#A0AEC0', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

export default LoginResponseScreen;
