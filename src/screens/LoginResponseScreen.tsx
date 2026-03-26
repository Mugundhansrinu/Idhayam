import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import LinearGradient from 'react-native-linear-gradient';
import { useSession } from '../context/SessionContext';
import { BrandColors } from '../theme/Colors';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'LoginResponse'>;
    route: RouteProp<RootStackParamList, 'LoginResponse'>;
};

const { width, height } = Dimensions.get('window');

// Accent colours cycle for each branch card
const CARD_ACCENTS = ['#7B61FF', '#0984E3', '#00B894', '#FD79A8', '#FDCB6E', '#E17055'];

const LoginResponseScreen: React.FC<Props> = ({ navigation, route }) => {
    const { setSession } = useSession();
    const { data } = route.params;

    // ── Parse branch list ──────────────────────────────────────────────────────
    let branches: any[] = [];
    if (data?.result) {
        if (Array.isArray(data.result)) {
            branches = data.result;
        } else if (typeof data.result === 'string') {
            try {
                const parsed = JSON.parse(data.result);
                branches = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                console.error('Branch parse error:', e);
            }
        }
    } else if (Array.isArray(data)) {
        branches = data;
    }

    // ── Entrance animations ────────────────────────────────────────────────────
    const headerAnim = useRef(new Animated.Value(0)).current;
    const cardAnims = useRef(branches.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        Animated.stagger(100,
            cardAnims.map(a =>
                Animated.spring(a, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true })
            )
        ).start();
    }, []);

    // ── Select branch & go to Dashboard ───────────────────────────────────────
    const handleSelectBranch = async (branch: any) => {
        await setSession({
            custId:        String(branch.CUST_ID        ?? branch.custId   ?? ''),
            branchId:      String(branch.BRANCH_ID      ?? branch.branchId ?? ''),
            custName:      String(branch.CUST_NAME_DISPLAY ?? branch.custName ?? 'Distributor'),
            custType:      String(branch.CUST_TYPE      ?? 'CM'),
            partyMudId:    String(branch.PARTY_MUD_ID   ?? ''),
            hubName:       String(branch.HUB_NAME       ?? ''),
            territoryName: String(branch.TERRITORY_NAME ?? ''),
            gstNo:         String(branch.GST_NO         ?? ''),
            pan:           String(data.pan              ?? ''),
            mobile:        String(data.mobile           ?? ''),
        });
        navigation.replace('Dashboard');
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            {/* ── Hero Background ── */}
            <LinearGradient
                colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd, '#0984E3']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.heroBg}
            >
                {/* Decorative circles */}
                <View style={[styles.circle, styles.circleTopRight]} />
                <View style={[styles.circle, styles.circleBottomLeft]} />

                <Animated.View style={{
                    opacity: headerAnim,
                    transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
                }}>
                    {/* Logo / Icon Badge */}
                    <View style={styles.logoBadge}>
                        <Text style={styles.logoIcon}>🏢</Text>
                    </View>
                    <Text style={styles.heroTitle}>Select Branch</Text>
                    <Text style={styles.heroSub}>
                        {branches.length > 0
                            ? `You have ${branches.length} branch${branches.length > 1 ? 'es' : ''} — tap one to continue`
                            : 'Choose your operating branch to continue'}
                    </Text>
                </Animated.View>
            </LinearGradient>

            {/* ── Branch Cards ── */}
            <View style={styles.cardsWrapper}>
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                >
                    {branches.length > 0 ? (
                        branches.map((branch: any, index: number) => {
                            const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
                            return (
                                <Animated.View
                                    key={String(index)}
                                    style={{
                                        opacity: cardAnims[index] ?? 1,
                                        transform: [{
                                            translateX: (cardAnims[index] ?? new Animated.Value(1)).interpolate({
                                                inputRange: [0, 1], outputRange: [60, 0],
                                            }),
                                        }],
                                    }}
                                >
                                    <TouchableOpacity
                                        activeOpacity={0.88}
                                        onPress={() => handleSelectBranch(branch)}
                                        style={styles.branchCard}
                                    >
                                        {/* Left accent bar */}
                                        <View style={[styles.accentBar, { backgroundColor: accent }]} />

                                        {/* Number badge */}
                                        <View style={[styles.numBadge, { backgroundColor: accent + '18' }]}>
                                            <Text style={[styles.numText, { color: accent }]}>
                                                {String(index + 1).padStart(2, '0')}
                                            </Text>
                                        </View>

                                        {/* Content */}
                                        <View style={styles.cardContent}>
                                            <Text style={styles.branchName} numberOfLines={2}>
                                                {branch.CUST_NAME_DISPLAY || 'Branch ' + (index + 1)}
                                            </Text>

                                            <View style={styles.tagsRow}>
                                                {!!branch.HUB_NAME && (
                                                    <View style={[styles.tag, { backgroundColor: accent + '15', borderColor: accent + '40' }]}>
                                                        <Text style={[styles.tagText, { color: accent }]}>📍 {branch.HUB_NAME}</Text>
                                                    </View>
                                                )}
                                                {!!branch.TERRITORY_NAME && (
                                                    <View style={[styles.tag, { backgroundColor: '#64748B15', borderColor: '#64748B30' }]}>
                                                        <Text style={[styles.tagText, { color: '#64748B' }]}>🗺 {branch.TERRITORY_NAME}</Text>
                                                    </View>
                                                )}
                                            </View>

                                            {!!branch.GST_NO && (
                                                <Text style={styles.gstText}>GST: {branch.GST_NO}</Text>
                                            )}
                                        </View>

                                        {/* Arrow CTA */}
                                        <View style={[styles.arrowBtn, { backgroundColor: accent }]}>
                                            <Text style={styles.arrowIcon}>→</Text>
                                        </View>
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        })
                    ) : (
                        /* Empty State */
                        <View style={styles.emptyWrap}>
                            <Text style={styles.emptyEmoji}>🏢</Text>
                            <Text style={styles.emptyTitle}>No Branches Found</Text>
                            <Text style={styles.emptySub}>
                                Please contact your administrator to assign a branch.
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FD' },

    // ── Hero ──────────────────────────────────────────────────────────────────
    heroBg: {
        paddingTop: 60,
        paddingBottom: 70,
        paddingHorizontal: 28,
        overflow: 'hidden',
    },
    circle: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.07)',
    },
    circleTopRight: { top: -60, right: -60 },
    circleBottomLeft: { bottom: -80, left: -40, width: 250, height: 250, borderRadius: 125 },

    logoBadge: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    logoIcon: { fontSize: 28 },
    heroTitle: { fontSize: 28, fontWeight: '900', color: '#FFF', lineHeight: 34 },
    heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 8, fontWeight: '500', lineHeight: 20 },

    // ── Cards ─────────────────────────────────────────────────────────────────
    cardsWrapper: {
        flex: 1,
        marginTop: -28,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        backgroundColor: '#F8F9FD',
        overflow: 'hidden',
    },
    scroll: { padding: 20, paddingTop: 24, paddingBottom: 60 },

    branchCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 14,
        overflow: 'hidden',
        shadowColor: '#7B61FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    accentBar: { width: 5, alignSelf: 'stretch' },
    numBadge: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 14,
    },
    numText: { fontSize: 14, fontWeight: '900' },

    cardContent: { flex: 1, paddingVertical: 18, paddingRight: 8 },
    branchName: { fontSize: 15, fontWeight: '900', color: '#1E293B', marginBottom: 10, lineHeight: 20 },

    tagsRow: { flexDirection: 'row', flexWrap: 'wrap' },
    tag: {
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginRight: 6,
        marginBottom: 4,
    },
    tagText: { fontSize: 10, fontWeight: '700' },

    gstText: { fontSize: 10, fontWeight: '600', color: '#94A3B8', marginTop: 4 },

    arrowBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    arrowIcon: { color: '#FFF', fontSize: 16, fontWeight: '900' },

    // ── Empty ─────────────────────────────────────────────────────────────────
    emptyWrap: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
    emptyEmoji: { fontSize: 56, marginBottom: 20 },
    emptyTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginBottom: 10 },
    emptySub: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20, fontWeight: '500' },
});

export default LoginResponseScreen;
