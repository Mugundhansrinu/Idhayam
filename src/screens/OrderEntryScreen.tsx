import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    ScrollView,
    Alert,
    Platform,
    Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import OilFlowBackground from '../components/OilFlowBackground';
import GlassCard from '../components/GlassCard';
import GlassHeader from '../components/GlassHeader';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'OrderEntry'>;
};

interface Product {
    id: string;
    group: string;
    name: string;
    price: number;
    perBox: number;
}

const PRODUCTS: Product[] = [
    { id: 'sesame_5lt_can', group: 'Sesame Oil', name: '5 LT. CAN', price: 1745.00, perBox: 4.0 },
    { id: 'sesame_2lt_can', group: 'Sesame Oil', name: '2 LT. CAN', price: 698.00, perBox: 6.0 },
    { id: 'sesame_1lt_btl', group: 'Sesame Oil', name: '1 LT. BTL', price: 349.00, perBox: 12.0 },
    { id: 'sesame_1lt_pkt', group: 'Sesame Oil', name: '1 LT. PKT', price: 349.00, perBox: 12.0 },
    { id: 'sesame_500ml_btl', group: 'Sesame Oil', name: '500 ML. BTL', price: 176.00, perBox: 24.0 },
    { id: 'sesame_500ml_pkt', group: 'Sesame Oil', name: '500 ML. PKT', price: 176.00, perBox: 24.0 },
    { id: 'mantra_1lt_btl', group: 'Mantra Oil', name: '1 LT. BTL', price: 220.00, perBox: 12.0 },
    { id: 'mantra_500ml_btl', group: 'Mantra Oil', name: '500 ML. BTL', price: 110.00, perBox: 24.0 },
    { id: 'gingelly_5kg_white', group: 'Gingelly Seed', name: '5 KG. WHITE', price: 894.00, perBox: 5.0 },
];

const OrderEntryScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const [page, setPage] = useState<1 | 2>(1);
    const [orders, setOrders] = useState<Record<string, { box: string, pcs: string }>>({});
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [group]: prev[group] === false ? true : false
        }));
    };

    // Animation values for Page 2 scroll
    const scrollY = React.useRef(new Animated.Value(0)).current;

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
    );

    // Interpolations
    const bottomBarHeight = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [140, 70],
        extrapolate: 'clamp',
    });

    const elementsOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    // Reverse opacity for the small layout elements
    const smallElementsOpacity = scrollY.interpolate({
        inputRange: [50, 100],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const updateOrder = (id: string, field: 'box' | 'pcs', value: string) => {
        setOrders(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const activeOrders = PRODUCTS.map(p => {
        const o = orders[p.id];
        const box = parseFloat(o?.box || '0');
        const pcs = parseFloat(o?.pcs || '0');
        const totalPcs = (box * p.perBox) + pcs;
        const amount = totalPcs * p.price;
        const tax = amount * 0.05; // mock 5%
        return { ...p, box, pcs, totalPcs, amount, tax, totalAmount: amount + tax };
    }).filter(o => o.box > 0 || o.pcs > 0);

    const totalOrderValue = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const handleSave = () => {
        Alert.alert('Success', 'Order saved successfully!');
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            {/* Background Core */}
            <LinearGradient
                colors={[BrandColors.blue900, BrandColors.blue800, '#0a1a4e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <OilFlowBackground />

            {/* Header */}
            <GlassHeader
                title="Order Details"
                subtitle={page === 1 ? "Enter Item Quantities" : "Review Order Summary"}
                onBack={() => {
                    if (page === 2) setPage(1);
                    else navigation.goBack();
                }}
            />

            {page === 1 ? (
                // ── PAGE 1: Item Entry (Glass Cards) ──
                <View style={styles.flex1}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {Object.entries(
                            PRODUCTS.reduce((acc, p) => {
                                acc[p.group] = acc[p.group] || [];
                                acc[p.group].push(p);
                                return acc;
                            }, {} as Record<string, Product[]>)
                        ).map(([groupName, items]) => (
                            <View key={groupName} style={styles.groupContainer}>
                                <TouchableOpacity
                                    style={styles.groupHeader}
                                    onPress={() => toggleGroup(groupName)}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.groupBadge, { backgroundColor: colors.glassBackground, borderColor: colors.glassBorder }]}>
                                        <Text style={[styles.groupHeaderText, { color: BrandColors.yellow500 }]}>
                                            {expandedGroups[groupName] === false ? '▶' : '▼'} {groupName}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {expandedGroups[groupName] !== false && items.map((p) => (
                                    <GlassCard key={p.id} style={styles.productCard}>
                                        <Text style={[styles.productName, { color: colors.textPrimary }]}>{p.name}</Text>
                                        <Text style={[styles.productSub, { color: colors.textSecondary }]}>Price: ₹{p.price.toFixed(2)}   •   Per Box: {p.perBox}</Text>

                                        <View style={styles.inputContainerRow}>
                                            <View style={styles.inputBox}>
                                                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>BOX QTY</Text>
                                                <TextInput
                                                    style={[styles.glassInput, { color: colors.textPrimary, borderColor: colors.glassBorder, backgroundColor: colors.inputBackground }]}
                                                    value={orders[p.id]?.box || ''}
                                                    onChangeText={v => updateOrder(p.id, 'box', v)}
                                                    keyboardType="numeric"
                                                    placeholder="0"
                                                    placeholderTextColor={colors.inputPlaceholder}
                                                />
                                            </View>
                                            <View style={styles.inputBox}>
                                                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>EXTRA PCS</Text>
                                                <TextInput
                                                    style={[styles.glassInput, { color: colors.textPrimary, borderColor: colors.glassBorder, backgroundColor: colors.inputBackground }]}
                                                    value={orders[p.id]?.pcs || ''}
                                                    onChangeText={v => updateOrder(p.id, 'pcs', v)}
                                                    keyboardType="numeric"
                                                    placeholder="0"
                                                    placeholderTextColor={colors.inputPlaceholder}
                                                />
                                            </View>
                                        </View>
                                    </GlassCard>
                                ))}
                            </View>
                        ))}
                    </ScrollView>

                    {/* Bottom Nav Page 1 */}
                    <GlassCard style={styles.bottomBarGlass}>
                        <TouchableOpacity style={styles.primaryBtn} onPress={() => setPage(2)} activeOpacity={0.8}>
                            <LinearGradient colors={[BrandColors.yellow500, BrandColors.yellow600]} style={styles.primaryBtnGrad}>
                                <Text style={styles.primaryBtnText}>REVIEW ORDER  →</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </GlassCard>
                </View>

            ) : (
                // ── PAGE 2: Review (Cards) ──
                <View style={styles.flex1}>
                    <Animated.ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    >
                        <Text style={[styles.reviewTitle, { color: colors.textPrimary }]}>Items In Cart</Text>

                        {activeOrders.map((o) => (
                            <GlassCard key={o.id} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <Text style={[styles.reviewGroupName, { color: BrandColors.yellow500 }]}>{o.group}</Text>
                                    <Text style={[styles.reviewItemName, { color: colors.textPrimary }]}>{o.name}</Text>
                                </View>

                                <View style={styles.reviewStatsRow}>
                                    <View style={styles.reviewStat}>
                                        <Text style={[styles.reviewStatVal, { color: colors.textPrimary }]}>{o.box}</Text>
                                        <Text style={[styles.reviewStatLbl, { color: colors.textSecondary }]}>BOXES</Text>
                                    </View>
                                    <View style={styles.reviewStat}>
                                        <Text style={[styles.reviewStatVal, { color: colors.textPrimary }]}>{o.pcs}</Text>
                                        <Text style={[styles.reviewStatLbl, { color: colors.textSecondary }]}>PCS</Text>
                                    </View>
                                    <View style={styles.reviewStat}>
                                        <Text style={[styles.reviewStatVal, { color: colors.textPrimary }]}>{o.totalPcs}</Text>
                                        <Text style={[styles.reviewStatLbl, { color: colors.textSecondary }]}>TOTAL PCS</Text>
                                    </View>
                                </View>

                                <View style={styles.reviewDivider} />

                                <View style={styles.reviewPriceRow}>
                                    <Text style={[styles.reviewPriceLbl, { color: colors.textSecondary }]}>Price & Tax</Text>
                                    <Text style={[styles.reviewPriceVal, { color: colors.textPrimary }]}>₹{o.totalAmount.toFixed(2)}</Text>
                                </View>
                            </GlassCard>
                        ))}

                        {activeOrders.length === 0 && (
                            <GlassCard style={styles.reviewCard}>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No items added to order</Text>
                            </GlassCard>
                        )}

                        {/* Totals Box */}
                        <GlassCard accentLine style={styles.finalTotalsCard}>
                            <View style={styles.totalRow}>
                                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>BALANCE</Text>
                                <Text style={[styles.totalValue, { color: colors.textPrimary }]}>₹3,137.61</Text>
                            </View>
                            <View style={[styles.totalRow, { marginVertical: 8 }]} >
                                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>PENDING</Text>
                                <Text style={[styles.totalValue, { color: colors.textPrimary }]}>*₹104,668.00</Text>
                            </View>
                            <View style={styles.reviewDivider} />
                            <View style={styles.totalRow}>
                                <Text style={[styles.totalLabel, { color: BrandColors.yellow500, fontWeight: 'bold' }]}>NET BALANCE</Text>
                                <Text style={[styles.totalValue, { color: BrandColors.yellow500, fontWeight: 'bold' }]}>*₹-101,530.39</Text>
                            </View>
                        </GlassCard>
                    </Animated.ScrollView>

                    {/* Bottom Nav Page 2 - Animated */}
                    <Animated.View style={[styles.bottomBarGlassPage2Anim, { height: bottomBarHeight }]}>
                        <GlassCard style={{ ...styles.fullHeightGlassOuter as any, backgroundColor: colors.glassBackground, borderColor: colors.glassBorder }}>
                            {/* LARGE Layout (Fades out on scroll) */}
                            <Animated.View style={[styles.bottomBarColumn, { opacity: elementsOpacity }]} pointerEvents="box-none">
                                <View style={styles.totalSection}>
                                    <Text style={[styles.bottomTotalLabel, { color: colors.textSecondary }]}>Grand Total</Text>
                                    <Text style={[styles.bottomTotalValue, { color: BrandColors.yellow500 }]}>*₹{totalOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                                </View>
                                <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} activeOpacity={0.8}>
                                    <LinearGradient colors={[BrandColors.yellow500, BrandColors.yellow600]} style={styles.primaryBtnGrad}>
                                        <Text style={styles.primaryBtnText}>CONFIRM ORDER  →</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>

                            {/* SMALL Layout (Fades in on scroll) */}
                            <Animated.View style={[styles.bottomBarRowSmall, { opacity: smallElementsOpacity }]} pointerEvents="box-none">
                                <View>
                                    <Text style={[styles.bottomTotalLabelSmall, { color: colors.textSecondary }]}>Total</Text>
                                    <Text style={[styles.bottomTotalValueSmall, { color: BrandColors.yellow500 }]}>₹{totalOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                                </View>
                                <TouchableOpacity style={styles.primaryBtnSm} onPress={handleSave} activeOpacity={0.8}>
                                    <LinearGradient colors={[BrandColors.yellow500, BrandColors.yellow600]} style={styles.primaryBtnGradSm}>
                                        <Text style={[styles.primaryBtnText, { fontSize: 13 }]}>CONFIRM</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                        </GlassCard>
                    </Animated.View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    flex1: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 150, paddingTop: 16 },

    // Groups
    groupContainer: { marginBottom: 16 },
    groupHeader: { marginBottom: 12, alignSelf: 'flex-start' },
    groupBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    groupHeaderText: { fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 },

    // Page 1 Product Cards
    productCard: { marginBottom: 14, padding: 18 },
    productName: { fontSize: 17, fontWeight: 'bold', marginBottom: 4 },
    productSub: { fontSize: 13, marginBottom: 16, fontStyle: 'italic' },
    inputContainerRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
    inputBox: { flex: 1 },
    inputLabel: { fontSize: 11, fontWeight: '600', marginBottom: 6, letterSpacing: 0.5 },
    glassInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontWeight: 'bold' },

    // Page 2 Review Cards
    reviewTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, marginLeft: 4, letterSpacing: 0.3 },
    reviewCard: { marginBottom: 14, padding: 18 },
    reviewHeader: { marginBottom: 16 },
    reviewGroupName: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 2, textTransform: 'uppercase' },
    reviewItemName: { fontSize: 17, fontWeight: 'bold' },
    reviewStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    reviewStat: { alignItems: 'center', flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', paddingVertical: 10, borderRadius: 10, marginHorizontal: 4 },
    reviewStatVal: { fontSize: 16, fontWeight: 'bold' },
    reviewStatLbl: { fontSize: 10, marginTop: 4, letterSpacing: 0.5 },
    reviewDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 14 },
    reviewPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    reviewPriceLbl: { fontSize: 14, fontWeight: '500' },
    reviewPriceVal: { fontSize: 18, fontWeight: 'bold' },

    emptyText: { textAlign: 'center', padding: 20, fontSize: 15 },

    finalTotalsCard: { padding: 20, marginTop: 10, marginBottom: 20 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
    totalValue: { fontSize: 16, fontWeight: 'bold' },

    // Bottom Action Bars
    bottomBarGlass: { position: 'absolute', bottom: 16, left: 16, right: 16, padding: 0, borderRadius: 24, overflow: 'hidden' },
    primaryBtn: { width: '100%' },
    primaryBtnGrad: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
    primaryBtnText: { color: '#091A42', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },

    bottomBarGlassPage2Anim: { position: 'absolute', bottom: 16, left: 16, right: 16 },
    fullHeightGlassOuter: { padding: 16, borderRadius: 24, height: '100%', justifyContent: 'center' },
    bottomBarColumn: { flexDirection: 'column', position: 'absolute', top: 16, left: 16, right: 16 },
    bottomBarRowSmall: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'absolute', top: 12, left: 16, right: 16 },
    totalSection: { alignItems: 'center', marginBottom: 12 },
    bottomTotalLabel: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5, marginBottom: 2, textTransform: 'uppercase' },
    bottomTotalValue: { fontSize: 24, fontWeight: 'bold' },
    bottomTotalLabelSmall: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 0, textTransform: 'uppercase' },
    bottomTotalValueSmall: { fontSize: 18, fontWeight: 'bold' },
    primaryBtnSm: { borderRadius: 14, overflow: 'hidden', elevation: 2 },
    primaryBtnGradSm: { paddingVertical: 10, paddingHorizontal: 16, justifyContent: 'center' },
});

export default OrderEntryScreen;
