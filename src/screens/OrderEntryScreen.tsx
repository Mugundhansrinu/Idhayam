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

    const scrollY = React.useRef(new Animated.Value(0)).current;

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
    );

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
        const tax = amount * 0.05;
        return { ...p, box, pcs, totalPcs, amount, tax, totalAmount: amount + tax };
    }).filter(o => o.box > 0 || o.pcs > 0);

    const totalOrderValue = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const handleSave = () => {
        Alert.alert('Success', 'Order saved successfully!');
        navigation.goBack();
    };

    return (
        <View style={[styles.container, { backgroundColor: '#eeeeeeff' }]}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            <GlassHeader
                title="Order Entry"
                subtitle={page === 1 ? "Select items and quantities" : "Review your order"}
                gradientColors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
                onBack={() => {
                    if (page === 2) setPage(1);
                    else navigation.goBack();
                }}
            />

            {page === 1 ? (
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
                                    <View style={[styles.groupBadge, { backgroundColor: colors.inputBackground, borderColor: colors.divider }]}>
                                        <Text style={[styles.groupHeaderText, { color: BrandColors.primaryGradientStart }]}>
                                            {expandedGroups[groupName] === false ? '▶' : '▼'} {groupName}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {expandedGroups[groupName] !== false && items.map((p) => (
                                    <View key={p.id} style={styles.productCard}>
                                        <Text style={[styles.productName, { color: colors.textPrimary }]}>{p.name}</Text>
                                        <Text style={[styles.productSub, { color: colors.textSecondary }]}>Price: ₹{p.price.toFixed(2)}   •   Per Box: {p.perBox}</Text>

                                        <View style={styles.inputRow}>
                                            <View style={styles.inputBox}>
                                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>BOX QTY</Text>
                                                <TextInput
                                                    style={[styles.input, { color: '#1F1F39', backgroundColor: '#FFFFFF', borderColor: '#C8C8D8' }]}
                                                    value={orders[p.id]?.box || ''}
                                                    onChangeText={v => updateOrder(p.id, 'box', v)}
                                                    keyboardType="numeric"
                                                    placeholder="0"
                                                    placeholderTextColor="#888898"
                                                />
                                            </View>
                                            <View style={styles.inputBox}>
                                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>EXTRA PCS</Text>
                                                <TextInput
                                                    style={[styles.input, { color: '#1F1F39', backgroundColor: '#FFFFFF', borderColor: '#C8C8D8' }]}
                                                    value={orders[p.id]?.pcs || ''}
                                                    onChangeText={v => updateOrder(p.id, 'pcs', v)}
                                                    keyboardType="numeric"
                                                    placeholder="0"
                                                    placeholderTextColor="#888898"
                                                />
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.bottomBar}>
                        <TouchableOpacity onPress={() => setPage(2)} activeOpacity={0.9}>
                            <LinearGradient colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                                <Text style={styles.primaryBtnText}>REVIEW ORDER  →</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>

            ) : (
                <View style={styles.flex1}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Order Summary</Text>

                        {activeOrders.map((o) => (
                            <View key={o.id} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <Text style={[styles.reviewGroupName, { color: BrandColors.primaryGradientStart }]}>{o.group}</Text>
                                    <Text style={[styles.reviewItemName, { color: colors.textPrimary }]}>{o.name}</Text>
                                </View>

                                <View style={styles.reviewStats}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statVal}>{o.box}</Text>
                                        <Text style={styles.statLbl}>BOX</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statVal}>{o.pcs}</Text>
                                        <Text style={styles.statLbl}>PCS</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={[styles.statVal, { color: BrandColors.primaryGradientStart }]}>₹{o.totalAmount.toFixed(0)}</Text>
                                        <Text style={styles.statLbl}>TOTAL</Text>
                                    </View>
                                </View>
                            </View>
                        ))}

                        {activeOrders.length === 0 && (
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No items in your order.</Text>
                        )}

                        <View style={styles.totalsSection}>
                            <View style={styles.totalLine}>
                                <Text style={styles.totalLbl}>Total Amount</Text>
                                <Text style={[styles.totalValLarger, { color: colors.textPrimary }]}>₹{totalOrderValue.toLocaleString()}</Text>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.bottomBar}>
                        <TouchableOpacity onPress={handleSave} activeOpacity={0.9}>
                            <LinearGradient colors={[BrandColors.verifyGradientStart, BrandColors.verifyGradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                                <Text style={styles.primaryBtnText}>✓  CONFIRM ORDER</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    flex1: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 100 },
    groupContainer: { marginBottom: 25 },
    groupHeader: { marginBottom: 15 },
    groupBadge: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, borderWidth: 1, alignSelf: 'flex-start' },
    groupHeaderText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },

    productCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    productName: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
    productSub: { fontSize: 13, marginBottom: 15 },
    inputRow: { flexDirection: 'row', justifyContent: 'space-between' },
    inputBox: { width: '47%' },
    inputLabel: { fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
    input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 12 : 8, fontSize: 16, fontWeight: '700' },

    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'transparent' },
    primaryBtn: { borderRadius: 18, paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
    primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1 },

    sectionTitle: { fontSize: 24, fontWeight: '900', marginBottom: 20 },
    reviewCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 3 },
    reviewHeader: { marginBottom: 15 },
    reviewGroupName: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' },
    reviewItemName: { fontSize: 18, fontWeight: '800' },
    reviewStats: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8F9FD', borderRadius: 16, padding: 15 },
    statItem: { alignItems: 'center' },
    statVal: { fontSize: 16, fontWeight: '800', color: '#1F1F39' },
    statLbl: { fontSize: 10, fontWeight: '700', color: '#858597', marginTop: 4 },

    emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16 },
    totalsSection: { marginTop: 20, paddingHorizontal: 10 },
    totalLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLbl: { fontSize: 16, fontWeight: '600', color: '#858597' },
    totalValLarger: { fontSize: 28, fontWeight: '900' },
});

export default OrderEntryScreen;
