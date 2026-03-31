import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    FlatList,
    Alert,
    Platform,
    ActivityIndicator,
    KeyboardAvoidingView,
    Dimensions,
    ScrollView,
    Keyboard,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import LinearGradient from 'react-native-linear-gradient';
import { getOrderItems, submitOrder } from '../api';
import { useSession } from '../context/SessionContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'OrderEntry'>;
};

const ItemRow = React.memo(({ item, qty, onUpdate }: any) => {
    const [focused, setFocused] = useState<'box' | 'pcs' | null>(null);
    const hasQty = (qty?.box && qty.box !== '0' && qty.box !== '') || (qty?.pcs && qty.pcs !== '0' && qty.pcs !== '');
    const priceText = item?.price ? parseFloat(item.price).toFixed(2) : '0.00';

    return (
        <View style={[styles.itemRow, (hasQty || focused) && styles.itemRowActive]}>
            <View style={styles.itemMainContent}>
                {/* 1. MRP */}
                <View style={{ flex: 1.3, alignItems: 'center' }}>
                    <Text style={styles.prodMrp}>₹{item.mrp}</Text>
                </View>

                {/* 2. ITEM */}
                <View style={{ flex: 2.5, alignItems: 'center' }}>
                    <Text style={[styles.prodName, { textAlign: 'center' }]} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.prodSub}>{item.unit}</Text>
                </View>

                {/* 3. PRICE */}
                <View style={{ flex: 1.3, alignItems: 'flex-start', paddingLeft: 5 }}>
                    <Text style={styles.prodVal}>₹{priceText}</Text>
                </View>

                {/* 4. BOX Input */}
                <View style={{ flex: 0.8, paddingHorizontal: 1 }}>
                    <TextInput
                        style={[styles.miniInput, focused === 'box' && styles.manualInputFocused]}
                        keyboardType="number-pad"
                        value={String(qty?.box || '')}
                        onChangeText={v => onUpdate(item?.id, 'box', v)}
                        placeholder="0"
                        onFocus={() => setFocused('box')}
                        onBlur={() => setFocused(null)}
                    />
                </View>

                {/* 5. PCS Input */}
                <View style={{ flex: 0.8, paddingHorizontal: 1 }}>
                    <TextInput
                        style={[styles.miniInput, focused === 'pcs' && styles.manualInputFocused]}
                        keyboardType="number-pad"
                        value={String(qty?.pcs || '')}
                        onChangeText={v => onUpdate(item?.id, 'pcs', v)}
                        placeholder="0"
                        onFocus={() => setFocused('pcs')}
                        onBlur={() => setFocused(null)}
                    />
                </View>
            </View>
        </View>
    );
});

const OrderEntryScreen: React.FC<Props> = ({ navigation }) => {
    const { session } = useSession();
    const [page, setPage] = useState<1 | 2>(1);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCat, setSelectedCat] = useState('');
    const [orders, setOrders] = useState<Record<string, { box: string, pcs: string }>>({});

    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
        fetchItems();
        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await getOrderItems(session?.custId || undefined);
            setProducts(data || []);
            if (data && data.length > 0) {
                const cats = Array.from(new Set(data.map((p: any) => p.category))).filter(Boolean).sort() as string[];
                if (cats.length > 0) setSelectedCat(cats[0]);
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to load menu items.');
        } finally {
            setLoading(false);
        }
    };

    const categories = useMemo(() => {
        return Array.from(new Set(products.map(p => p.category))).filter(Boolean).sort() as string[];
    }, [products]);

    const updateOrder = useCallback((id: string, field: 'box' | 'pcs', value: string) => {
        if (!id) return;
        const cleaned = value.replace(/[^0-9]/g, '');
        setOrders(prev => ({ ...prev, [id]: { ...(prev[id] || {box:'', pcs:''}), [field]: cleaned } }));
    }, []);

    const activeOrders = useMemo(() => products.map(p => {
        const o = orders[p.id];
        if (!o || (o.box === '' && o.pcs === '')) return null;
        const box = parseInt(o.box || '0', 10);
        const pcs = parseInt(o.pcs || '0', 10);
        const perBox = parseInt((p.unit || '').match(/\((\d+)\)/)?.[1] || '1', 10);
        const totalPcs = (box * perBox) + pcs;
        if (totalPcs <= 0) return null;
        return { ...p, totalPcs, amount: totalPcs * parseFloat(p.price || '0') };
    }).filter(Boolean), [products, orders]);

    const totalAmount = useMemo(() => activeOrders.reduce((s, o: any) => s + (o.amount || 0), 0), [activeOrders]);
    const totalCount = useMemo(() => activeOrders.reduce((s, o: any) => s + (o.totalPcs || 0), 0), [activeOrders]);

    const filteredData = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = (p.name || '').toLowerCase().includes(search.toLowerCase());
            const matchesCat = p.category === selectedCat;
            return matchesSearch && matchesCat;
        });
    }, [products, search, selectedCat]);

    const executeSubmit = async () => {
        setLoading(true);
        try {
            const res = await submitOrder(session?.custId || '', activeOrders, session?.branchId || undefined);
            if (res.success) {
                Alert.alert('✓ Order Placed', `Order #${res.orderId} recorded.`);
                navigation.goBack();
            } else {
                Alert.alert('Error', res.message || 'Failed to place order.');
            }
        } catch (e) {
            Alert.alert('Error', 'An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => { if (page === 2) setPage(1); else navigation.goBack(); }}>
                    <Icon name="arrow-back" size={20} color="#3861FB" />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={styles.headerTitle}>{page === 1 ? 'Order Entry' : 'Review Order'}</Text>
                    <Text style={styles.headerSub}>{page === 1 ? 'Select products to order' : 'Verify your items'}</Text>
                </View>

            </View>

            {page === 1 ? (
                <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>


                    <View style={styles.catWrapper}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
                            {categories.map(cat => {
                                const hasAnyOrder = products.some(p => 
                                    p.category === cat && 
                                    ((orders[p.id]?.box && orders[p.id].box !== '0' && orders[p.id].box !== '') || 
                                     (orders[p.id]?.pcs && orders[p.id].pcs !== '0' && orders[p.id].pcs !== ''))
                                );
                                return (
                                    <TouchableOpacity 
                                        key={cat} 
                                        style={[styles.catChip, selectedCat === cat && styles.catChipActive]}
                                        onPress={() => setSelectedCat(cat)}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={[styles.catText, selectedCat === cat && styles.catTextActive]}>{cat}</Text>
                                            {hasAnyOrder && <View style={styles.catDot} />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* NEW: Table Header Row from Price Details */}
                    {/* Standardized Table Header (Financial-Focus Optimized) */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.colLabel, { flex: 1.3 }]}>MRP (₹)</Text>
                        <Text style={[styles.colLabel, { flex: 2.5 }]}>ITEM</Text>
                        <Text style={[styles.colLabel, { flex: 1.3, textAlign: 'left', paddingLeft: 5 }]}>PRICE (₹)</Text>
                        <Text style={[styles.colLabel, { flex: 0.8 }]}>BOX</Text>
                        <Text style={[styles.colLabel, { flex: 0.8 }]}>PCS</Text>
                    </View>

                    {loading ? (
                        <View style={styles.centerBox}><ActivityIndicator size="large" color="#3861FB" /></View>
                    ) : (
                        <FlatList 
                            data={filteredData}
                            keyExtractor={p => p.id}
                            renderItem={({ item }) => <ItemRow item={item} qty={orders[item.id]} onUpdate={updateOrder} />}
                            contentContainerStyle={styles.listContent}
                            initialNumToRender={8}
                            maxToRenderPerBatch={4}
                            windowSize={5}
                        />
                    )}

                    {totalAmount > 0 && !isKeyboardVisible && (
                        <TouchableOpacity style={styles.summaryBar} onPress={() => setPage(2)}>
                            <LinearGradient colors={['#3861FB', '#2752E7']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.summaryInner}>
                                <View>
                                    <Text style={styles.summaryLabel}>Total Amount</Text>
                                    <Text style={styles.summaryAmount}>₹ {totalAmount.toLocaleString()}</Text>
                                </View>
                                <View style={styles.summaryBtn}>
                                    <Text style={styles.summaryBtnText}>Review & Confirm →</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </KeyboardAvoidingView>
            ) : (
                <View style={styles.flex1}>
                    <FlatList 
                        data={activeOrders}
                        keyExtractor={(o: any) => o.id}
                        contentContainerStyle={styles.reviewList}
                        renderItem={({ item }: any) => (
                            <View style={styles.reviewCard}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.reviewName}>{item.name}</Text>
                                    <Text style={styles.reviewDetails}>{item.box || 0} Box + {item.pcs || 0} Pcs</Text>
                                </View>
                                <Text style={styles.reviewPrice}>₹{item.amount.toLocaleString()}</Text>
                            </View>
                        )}
                        ListFooterComponent={() => (
                            <View style={styles.totalCard}>
                                <Text style={styles.totalLabel}>Grand Total</Text>
                                <Text style={styles.totalValue}>₹ {totalAmount.toLocaleString()}</Text>
                            </View>
                        )}
                    />
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.flex1} onPress={() => setPage(1)}>
                            <LinearGradient colors={['#3861FB', '#2752E7']} style={styles.submitBtnInner}>
                                <Text style={styles.submitBtnText}>BACK</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={{ flex: 2 }} onPress={executeSubmit}>
                            <LinearGradient colors={['#3861FB', '#2752E7']} style={styles.submitBtnInner}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>PLACE ORDER NOW</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FD' },
    flex1: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2 },
    headerTitles: { flex: 1, marginLeft: 15 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A1A' },
    headerSub: { fontSize: 13, color: '#A0AEC0', fontWeight: '600', marginTop: 2 },
    cartCount: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2 },
    countBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#E3001B', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    countText: { color: '#fff', fontSize: 10, fontWeight: '900' },

    searchSection: { paddingHorizontal: 25, marginBottom: 20 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 15, paddingHorizontal: 15, height: 52 },
    searchInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A1A' },

    catWrapper: { marginBottom: 20 },
    catScroll: { paddingHorizontal: 25 },
    catChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#EDF2F7' },
    catChipActive: { backgroundColor: '#3861FB', borderColor: '#3861FB' },
    catText: { fontSize: 12, fontWeight: '800', color: '#718096' },
    catTextActive: { color: '#fff' },

    tableHeader: { flexDirection: 'row', paddingHorizontal: 35, marginBottom: 15 },
    colLabel: { flex: 1, fontSize: 10, fontWeight: '900', color: '#A0AEC0', textAlign: 'center' },

    listContent: { paddingHorizontal: 10, paddingBottom: 150 },
    itemRow: { backgroundColor: '#fff', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 15, marginBottom: 10, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
    itemRowActive: { borderColor: '#3861FB', borderWidth: 1.5 },
    itemMainContent: { flexDirection: 'row', alignItems: 'center' },
    prodName: { fontSize: 13, fontWeight: '800', color: '#1A1A1A' },
    prodSub: { fontSize: 9, color: '#A0AEC0', fontWeight: '700' },
    prodVal: { fontSize: 12, fontWeight: '900', color: '#718096' },
    prodMrp: { fontSize: 13, fontWeight: '900', color: '#3861FB' },
    miniInput: { height: 35, backgroundColor: '#F8F9FD', borderRadius: 8, textAlign: 'center', fontSize: 13, fontWeight: '900', color: '#1A1A1A', borderWidth: 1, borderColor: '#E2E8F0', padding: 0 },

    qtyRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 15 },
    manualInputWrap: { flex: 1 },
    manualLabel: { fontSize: 9, fontWeight: '900', color: '#A0AEC0', textAlign: 'center', marginBottom: 8 },
    manualInput: { height: 50, backgroundColor: '#F8F9FD', borderRadius: 12, textAlign: 'center', fontSize: 18, fontWeight: '900', color: '#1A1A1A', borderWidth: 1, borderColor: '#E2E8F0' },
    manualInputFocused: { borderColor: '#3861FB', backgroundColor: '#fff' },
    qtySpacing: { width: 15 },

    summaryBar: { position: 'absolute', bottom: 30, left: 20, right: 20 },
    summaryInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 25, paddingHorizontal: 25, paddingVertical: 18, elevation: 10 },
    summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '800' },
    summaryAmount: { color: '#fff', fontSize: 24, fontWeight: '900' },
    summaryBtn: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12 },
    summaryBtnText: { color: '#3861FB', fontSize: 11, fontWeight: '900' },

    reviewList: { padding: 25 },
    reviewCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 12, elevation: 2 },
    reviewName: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
    reviewDetails: { fontSize: 12, color: '#A0AEC0', fontWeight: '600', marginTop: 4 },
    reviewPrice: { fontSize: 17, fontWeight: '900', color: '#1A1A1A' },
    totalCard: { backgroundColor: '#fff', borderRadius: 25, padding: 25, marginTop: 10, alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#E2E8F0' },
    totalLabel: { fontSize: 14, fontWeight: '800', color: '#2D3748' },
    totalValue: { fontSize: 32, fontWeight: '900', color: '#059669', marginTop: 5 },
    catDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00B894', marginLeft: 8 },
    actionRow: { flexDirection: 'row', padding: 25, paddingBottom: 40, gap: 12 },
    submitBtn: { padding: 25, paddingBottom: 40 },
    submitBtnInner: { height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 5 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
    centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 },
});

export default OrderEntryScreen;
