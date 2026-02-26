/**
 * OrderEntryScreen – 2-page order flow
 * Page 1: Enter items (Box/Piece)
 * Page 2: Review & Save
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Animated,
    ScrollView,
    Alert,
    Dimensions,
    FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import OilFlowBackground from '../components/OilFlowBackground';
import GlassCard from '../components/GlassCard';
import GlassHeader from '../components/GlassHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

const { width } = Dimensions.get('window');

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'OrderEntry'>;
};

interface Product {
    id: string;
    name: string;
    price: number;
    unit: string;
}

interface OrderItem {
    product: Product;
    boxes: string;
    pieces: string;
}

const PRODUCTS: Product[] = [
    { id: '1', name: 'Idhayam Sesame Oil 1L', price: 180, unit: '12 pcs/box' },
    { id: '2', name: 'Idhayam Sesame Oil 500ml', price: 95, unit: '24 pcs/box' },
    { id: '3', name: 'Idhayam Sesame Oil 200ml', price: 42, unit: '48 pcs/box' },
    { id: '4', name: 'Idhayam Groundnut Oil 1L', price: 165, unit: '12 pcs/box' },
    { id: '5', name: 'Idhayam Groundnut Oil 5L', price: 780, unit: '4 pcs/box' },
    { id: '6', name: 'Idhayam Coconut Oil 500ml', price: 120, unit: '24 pcs/box' },
];

const OrderEntryScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const [page, setPage] = useState<1 | 2>(1);
    const [orders, setOrders] = useState<OrderItem[]>(
        PRODUCTS.map(p => ({ product: p, boxes: '', pieces: '' }))
    );
    const slideAnim = useRef(new Animated.Value(0)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(cardOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const slideTo = (nextPage: 1 | 2) => {
        Animated.sequence([
            Animated.timing(slideAnim, { toValue: nextPage === 2 ? -width : width, duration: 0, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
        ]).start();
        setPage(nextPage);
    };

    const updateOrder = (id: string, field: 'boxes' | 'pieces', value: string) => {
        setOrders(prev => prev.map(o => o.product.id === id ? { ...o, [field]: value } : o));
    };

    const getTotal = () => {
        return orders.reduce((sum, o) => {
            const boxes = parseInt(o.boxes || '0', 10);
            const pieces = parseInt(o.pieces || '0', 10);
            // Each box contains box-units; pieces are individual
            const pcsPerBox = parseInt(o.product.unit.split(' ')[0] || '1', 10);
            return sum + ((boxes * pcsPerBox + pieces) * o.product.price);
        }, 0);
    };

    const getActiveOrders = () => orders.filter(o => o.boxes || o.pieces);

    const handleSave = () => {
        if (getActiveOrders().length === 0) {
            Alert.alert('Empty Order', 'Please add at least one item to your order.');
            return;
        }
        Alert.alert('Order Saved ✅', `Order total: ₹${getTotal().toLocaleString()}\n\nYour order has been submitted successfully.`);
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <LinearGradient
                colors={[BrandColors.blue900, BrandColors.blue800, '#0a1a4e']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <OilFlowBackground />
            <GlassHeader
                title="Order Entry"
                subtitle={page === 1 ? 'Step 1 of 2 – Add Items' : 'Step 2 of 2 – Review & Save'}
                onBack={() => page === 2 ? slideTo(1) : navigation.goBack()}
            />

            {/* Page indicator */}
            <View style={styles.pageIndicator}>
                {[1, 2].map(p => (
                    <View key={p} style={[
                        styles.pageDot,
                        { backgroundColor: page >= p ? BrandColors.yellow500 : 'rgba(255,255,255,0.2)' },
                    ]} />
                ))}
            </View>

            <Animated.View style={[styles.flex, { opacity: cardOpacity, transform: [{ translateX: slideAnim }] }]}>
                {page === 1 ? (
                    // ── PAGE 1: Item Entry ──
                    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Select Items</Text>
                        <Text style={[styles.pageSub, { color: colors.textSecondary }]}>
                            Enter quantity in Boxes, Pieces, or both
                        </Text>
                        {PRODUCTS.map((product, i) => (
                            <Animated.View key={product.id} style={{ opacity: cardOpacity }}>
                                <GlassCard style={styles.productCard}>
                                    <View style={styles.productHeader}>
                                        <View style={styles.productInfo}>
                                            <Text style={[styles.productName, { color: colors.textPrimary }]}>{product.name}</Text>
                                            <Text style={[styles.productMeta, { color: colors.textSecondary }]}>
                                                ₹{product.price}/pc • {product.unit}
                                            </Text>
                                        </View>
                                        <View style={styles.productPrice}>
                                            <Text style={[styles.priceTag, { color: BrandColors.yellow500 }]}>₹{product.price}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.qtyRow}>
                                        <View style={styles.qtyField}>
                                            <Text style={[styles.qtyLabel, { color: colors.textSecondary }]}>📦 Boxes</Text>
                                            <View style={[styles.qtyInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                                                <TextInput
                                                    style={[styles.qtyText, { color: colors.inputText }]}
                                                    value={orders[i].boxes}
                                                    onChangeText={v => updateOrder(product.id, 'boxes', v)}
                                                    keyboardType="number-pad"
                                                    placeholder="0"
                                                    placeholderTextColor={colors.inputPlaceholder}
                                                />
                                            </View>
                                        </View>
                                        <View style={styles.qtyDivider} />
                                        <View style={styles.qtyField}>
                                            <Text style={[styles.qtyLabel, { color: colors.textSecondary }]}>🛢️ Pieces</Text>
                                            <View style={[styles.qtyInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                                                <TextInput
                                                    style={[styles.qtyText, { color: colors.inputText }]}
                                                    value={orders[i].pieces}
                                                    onChangeText={v => updateOrder(product.id, 'pieces', v)}
                                                    keyboardType="number-pad"
                                                    placeholder="0"
                                                    placeholderTextColor={colors.inputPlaceholder}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                </GlassCard>
                            </Animated.View>
                        ))}

                        {/* Next button */}
                        <TouchableOpacity onPress={() => slideTo(2)} activeOpacity={0.85}>
                            <LinearGradient
                                colors={[BrandColors.blue700, BrandColors.blue500]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.btn}>
                                <Text style={styles.btnText}>Review Order →</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </ScrollView>
                ) : (
                    // ── PAGE 2: Review ──
                    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                        <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Review Order</Text>
                        <Text style={[styles.pageSub, { color: colors.textSecondary }]}>
                            Verify items and total before saving
                        </Text>

                        {getActiveOrders().length === 0 ? (
                            <GlassCard style={styles.emptyCard}>
                                <Text style={styles.emptyIcon}>🛒</Text>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No items added</Text>
                            </GlassCard>
                        ) : (
                            <>
                                {getActiveOrders().map(o => {
                                    const pcsPerBox = parseInt(o.product.unit.split(' ')[0] || '1', 10);
                                    const boxes = parseInt(o.boxes || '0', 10);
                                    const pieces = parseInt(o.pieces || '0', 10);
                                    const total = (boxes * pcsPerBox + pieces) * o.product.price;
                                    return (
                                        <GlassCard key={o.product.id} style={styles.reviewCard}>
                                            <View style={styles.reviewRow}>
                                                <Text style={[styles.reviewName, { color: colors.textPrimary }]} numberOfLines={1}>
                                                    {o.product.name}
                                                </Text>
                                                <Text style={[styles.reviewAmt, { color: BrandColors.yellow500 }]}>
                                                    ₹{total.toLocaleString()}
                                                </Text>
                                            </View>
                                            <Text style={[styles.reviewSub, { color: colors.textSecondary }]}>
                                                {boxes > 0 ? `${boxes} Box${boxes > 1 ? 'es' : ''}` : ''}{boxes > 0 && pieces > 0 ? ' + ' : ''}{pieces > 0 ? `${pieces} Piece${pieces > 1 ? 's' : ''}` : ''}
                                            </Text>
                                        </GlassCard>
                                    );
                                })}

                                {/* Total */}
                                <GlassCard accentLine style={styles.totalCard}>
                                    <View style={styles.totalRow}>
                                        <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Order Total</Text>
                                        <Text style={[styles.totalValue, { color: BrandColors.yellow500 }]}>
                                            ₹{getTotal().toLocaleString()}
                                        </Text>
                                    </View>
                                    <Text style={[styles.totalNote, { color: colors.textMuted }]}>
                                        * Amount may vary upon order confirmation
                                    </Text>
                                </GlassCard>
                            </>
                        )}

                        <TouchableOpacity onPress={handleSave} activeOpacity={0.85}>
                            <LinearGradient
                                colors={['#22C55E', '#16A34A']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.btn}>
                                <Text style={styles.btnText}>💾 Save Order</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </ScrollView>
                )}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1 },
    scroll: { padding: 20, paddingBottom: 40 },
    pageIndicator: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 12 },
    pageDot: { width: 32, height: 4, borderRadius: 2 },
    pageTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
    pageSub: { fontSize: 13, marginBottom: 16 },
    productCard: { marginBottom: 12, padding: 14 },
    productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    productInfo: { flex: 1 },
    productName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
    productMeta: { fontSize: 11 },
    productPrice: { marginLeft: 8 },
    priceTag: { fontSize: 15, fontWeight: '700' },
    qtyRow: { flexDirection: 'row', alignItems: 'center' },
    qtyField: { flex: 1 },
    qtyDivider: { width: 12 },
    qtyLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4, letterSpacing: 0.3 },
    qtyInput: { borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
    qtyText: { fontSize: 16, fontWeight: '700', textAlign: 'center', minWidth: 40 },
    btn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
    btnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.8 },
    reviewCard: { marginBottom: 10, padding: 14 },
    reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    reviewName: { fontSize: 13, fontWeight: '600', flex: 1 },
    reviewAmt: { fontSize: 15, fontWeight: '700' },
    reviewSub: { fontSize: 11, marginTop: 4 },
    totalCard: { marginTop: 8, marginBottom: 8 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 14, fontWeight: '600' },
    totalValue: { fontSize: 24, fontWeight: '800' },
    totalNote: { fontSize: 10, marginTop: 8, fontStyle: 'italic' },
    emptyCard: { alignItems: 'center', paddingVertical: 32 },
    emptyIcon: { fontSize: 40, marginBottom: 12 },
    emptyText: { fontSize: 14 },
});

export default OrderEntryScreen;
