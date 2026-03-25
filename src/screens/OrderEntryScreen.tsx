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
    Modal,
    Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import GlassHeader from '../components/GlassHeader';
import { getOrderItems, submitOrder } from '../api';
import { useSession } from '../context/SessionContext';

const { height } = Dimensions.get('window');

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'OrderEntry'>;
};

interface Product {
    id: string;
    category: string;
    name: string;
    price: string;
    unit: string;
    mrp: string;
    tax: string;
}

const ItemRow = React.memo(({ item, qty, onUpdate, onStep }: any) => {
    const hasQty = (qty?.box && qty.box !== '0' && qty.box !== '') || (qty?.pcs && qty.pcs !== '0' && qty.pcs !== '');
    const priceText = item?.price ? parseFloat(item.price).toFixed(2) : '0.00';

    return (
        <View style={[styles.itemRow, hasQty && styles.itemRowActive]}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item?.name || 'Unknown Item'}</Text>
                <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPriceMain}>₹{priceText}</Text>
                    <Text style={styles.itemMRP}>MRP: ₹{item?.mrp}</Text>
                </View>
                <Text style={styles.itemUnit}>Unit: {item?.unit || 'Pcs'}</Text>
            </View>
            
            <View style={styles.qtyContainer}>
                {/* BOX STEPPER */}
                <View style={styles.stepperWrap}>
                    <Text style={styles.stepperLabel}>BOX</Text>
                    <View style={[styles.stepper, qty?.box && qty.box !== '' && styles.stepperActive]}>
                        <TouchableOpacity style={styles.stepBtn} onPress={() => onStep(item?.id, 'box', -1)}>
                            <Text style={styles.stepSymbol}>−</Text>
                        </TouchableOpacity>
                        <TextInput
                            style={styles.stepInput}
                            keyboardType="numeric"
                            value={String(qty?.box || '')}
                            onChangeText={v => onUpdate(item?.id, 'box', v)}
                            placeholder="0"
                            placeholderTextColor="#A0A3BD"
                            selectTextOnFocus
                        />
                        <TouchableOpacity style={styles.stepBtn} onPress={() => onStep(item?.id, 'box', 1)}>
                            <Text style={styles.stepSymbol}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* PCS STEPPER */}
                <View style={styles.stepperWrap}>
                    <Text style={styles.stepperLabel}>PCS</Text>
                    <View style={[styles.stepper, qty?.pcs && qty.pcs !== '' && styles.stepperActive]}>
                        <TouchableOpacity style={styles.stepBtn} onPress={() => onStep(item?.id, 'pcs', -1)}>
                            <Text style={styles.stepSymbol}>−</Text>
                        </TouchableOpacity>
                        <TextInput
                            style={styles.stepInput}
                            keyboardType="numeric"
                            value={String(qty?.pcs || '')}
                            onChangeText={v => onUpdate(item?.id, 'pcs', v)}
                            placeholder="0"
                            placeholderTextColor="#A0A3BD"
                            selectTextOnFocus
                        />
                        <TouchableOpacity style={styles.stepBtn} onPress={() => onStep(item?.id, 'pcs', 1)}>
                            <Text style={styles.stepSymbol}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}, (prev, next) => (
    prev.qty?.box === next.qty?.box && 
    prev.qty?.pcs === next.qty?.pcs && 
    prev.item?.id === next.item?.id
));

const OrderEntryScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const { session } = useSession();
    const [page, setPage] = useState<1 | 2>(1);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCat, setSelectedCat] = useState('All Products');
    const [showDropdown, setShowDropdown] = useState(false);
    const [orders, setOrders] = useState<Record<string, { box: string, pcs: string }>>({});
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => { fetchItems(); }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await getOrderItems(session?.custId || undefined);
            setProducts(data || []);
        } catch (e) {
            console.error('FetchItems Error:', e);
            Alert.alert('Error', 'Failed to load menu items.');
        } finally {
            setLoading(false);
        }
    };

    const categories = useMemo(() => {
        const cats = Array.from(new Set(products.map(p => p.category))).filter(Boolean).sort();
        return ['All Products', ...cats as string[]];
    }, [products]);

    const updateOrder = useCallback((id: string, field: 'box' | 'pcs', value: string) => {
        if (!id) return;
        const cleaned = value.replace(/[^0-9]/g, '');
        setOrders(prev => ({ ...prev, [id]: { ...(prev[id] || {box:'', pcs:''}), [field]: cleaned } }));
    }, []);

    const stepOrder = useCallback((id: string, field: 'box' | 'pcs', delta: number) => {
        if (!id) return;
        setOrders(prev => {
            const cur = prev[id] || { box: '', pcs: '' };
            const curValue = parseInt(cur[field] || '0', 10);
            const nextVal = Math.max(0, curValue + delta);
            return { ...prev, [id]: { ...cur, [field]: nextVal === 0 ? '' : String(nextVal) } };
        });
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

    const flatData = useMemo(() => {
        const filtered = products.filter(p => 
            (p?.name || '').toLowerCase().includes(search.toLowerCase()) &&
            (selectedCat === 'All Products' || p?.category === selectedCat)
        );
        let res: any[] = [];
        const catsInView = Array.from(new Set(filtered.map(p => p.category))).filter(Boolean);
        catsInView.forEach(cat => {
            res.push({ type: 'header', value: cat });
            const catItems = filtered.filter(p => p.category === cat);
            catItems.forEach(item => res.push({ type: 'item', value: item }));
        });
        return res;
    }, [products, search, selectedCat]);

    const executeSubmit = async () => {
        setLoading(true);
        try {
            const res = await submitOrder(session?.custId || '', activeOrders);
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

    const renderFlatItem = useCallback(({ item, index }: { item: any, index: number }) => {
        if (item.type === 'header') {
            return (
                <View key={`header-${index}`} style={styles.catHeader}>
                    <Text style={styles.catTitle}>{item.value}</Text>
                    <View style={styles.catLine} />
                </View>
            );
        }
        const p = item.value;
        const qty = orders[p.id] || { box: '', pcs: '' };
        return <ItemRow key={`item-${p.id}`} item={p} qty={qty} onUpdate={updateOrder} onStep={stepOrder} />;
    }, [orders, updateOrder, stepOrder]);

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <GlassHeader title={page === 1 ? "Order Entry" : "Review"} gradientColors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]} onBack={() => { if (page === 2) setPage(1); else navigation.goBack(); }} />

            {loading && products.length === 0 ? (
                <View style={styles.centerBox}><ActivityIndicator size="large" color={BrandColors.primaryGradientStart} /></View>
            ) : page === 1 ? (
                <View style={styles.flex1}>
                    <View style={styles.controls}>
                        <View style={styles.searchBar}>
                            <Text style={styles.searchIcon}>🔍</Text>
                            <TextInput style={styles.searchInput} placeholder="Search product..." placeholderTextColor="#A0A3BD" value={search} onChangeText={setSearch} />
                        </View>
                        <TouchableOpacity style={styles.dropBtn} onPress={() => setShowDropdown(true)}>
                            <Text style={styles.dropText} numberOfLines={1}>{selectedCat}</Text>
                            <Text style={styles.dropIcon}>▼</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList 
                        ref={flatListRef} 
                        data={flatData} 
                        keyExtractor={(item, i) => `${item.type}-${item.value?.id || item.value || i}`} 
                        renderItem={renderFlatItem}
                        contentContainerStyle={styles.scrollContent} 
                        initialNumToRender={10} 
                        maxToRenderPerBatch={5} 
                        windowSize={5} 
                        removeClippedSubviews={Platform.OS === 'android'} 
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    />

                    {totalCount > 0 && (
                        <TouchableOpacity style={styles.summaryBar} onPress={() => setPage(2)} activeOpacity={0.95}>
                            <LinearGradient colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.summaryInner}>
                                <View>
                                    <Text style={styles.summaryLabel}>Ordered Volume</Text>
                                    <Text style={styles.summaryAmount}>₹ {totalAmount.toLocaleString()}</Text>
                                </View>
                                <View style={styles.summaryBtn}>
                                    <Text style={styles.summaryBtnText}>Review & Confirm ({totalCount})  →</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <View style={styles.flex1}>
                    <FlatList 
                        data={activeOrders} 
                        keyExtractor={(o: any) => o.id} 
                        ListHeaderComponent={() => <Text style={styles.reviewTitle}>Final Review</Text>} 
                        contentContainerStyle={styles.scrollContent}
                        renderItem={({ item }: any) => (
                            <View style={styles.reviewRow}>
                                <View style={styles.reviewMain}>
                                    <Text style={styles.reviewCat}>{item.category}</Text>
                                    <Text style={styles.reviewName}>{item.name}</Text>
                                    <Text style={styles.reviewTagText}>{item.box || 0} Box + {item.pcs || 0} Pcs</Text>
                                </View>
                                <View style={{alignItems:'flex-end'}}>
                                    <Text style={styles.reviewTotalValue}>₹{item.amount.toLocaleString()}</Text>
                                    <Text style={{fontSize: 10, color: '#BDBDBD'}}>{item.totalPcs} units</Text>
                                </View>
                            </View>
                        )}
                        ListFooterComponent={() => (
                            <View style={styles.billCard}>
                                <View style={styles.billLine}><Text style={styles.billLabelLarge}>Total Order Value</Text><Text style={styles.billValLarge}>₹ {totalAmount.toLocaleString()}</Text></View>
                            </View>
                        )}
                    />
                    <View style={styles.placeBtnWrapper}>
                        <TouchableOpacity style={styles.placeBtn} onPress={executeSubmit} activeOpacity={0.9} disabled={loading}>
                            <LinearGradient colors={[BrandColors.verifyGradientStart, BrandColors.verifyGradientEnd]} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.placeBtnInner}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.placeBtnText}>CONFIRM & SUBMIT ORDER</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <Modal visible={showDropdown} transparent animationType="fade" onRequestClose={() => setShowDropdown(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDropdown(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Category</Text>
                        <FlatList data={categories} keyExtractor={c => c} style={{maxHeight: height * 0.6}} renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.modalOption, selectedCat === item && styles.modalOptionActive]} onPress={() => { setSelectedCat(item); setShowDropdown(false); flatListRef.current?.scrollToOffset({ offset: 0, animated: false }); }}>
                                <Text style={[styles.modalOptionText, selectedCat === item && {color: BrandColors.primaryGradientStart}]}>{item}</Text>
                                {selectedCat === item && <Text style={styles.checkIcon}>✓</Text>}
                            </TouchableOpacity>
                        )} />
                    </View>
                </TouchableOpacity>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FD' },
    flex1: { flex: 1 },
    centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    controls: { flexDirection: 'row', padding: 15, paddingBottom: 10 },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, elevation: 2, height: 46, marginRight: 10, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.05, shadowRadius: 5 },
    searchIcon: { fontSize: 13, marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1F1F39', padding: 0 },
    dropBtn: { width: 130, height: 46, backgroundColor: '#fff', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, elevation: 2, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.05, shadowRadius: 5 },
    dropText: { flex: 1, fontSize: 11, fontWeight: '800', color: BrandColors.primaryGradientStart, textTransform: 'uppercase' },
    dropIcon: { fontSize: 8, color: '#BDBDBD', marginLeft: 5 },
    
    scrollContent: { padding: 15, paddingBottom: 120 },
    catHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginTop: 10 },
    catTitle: { paddingRight: 12, fontSize: 12, fontWeight: '900', color: '#1F1F39', textTransform: 'uppercase', letterSpacing: 1 },
    catLine: { flex: 1, height: 2, backgroundColor: BrandColors.primaryGradientStart + '15', borderRadius: 1 },

    itemRow: { backgroundColor: '#fff', borderRadius: 24, padding: 18, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10 },
    itemRowActive: { borderColor: BrandColors.primaryGradientStart + '40', borderWidth: 2, shadowOpacity: 0.1 },
    itemInfo: { marginBottom: 15 },
    itemName: { fontSize: 16, fontWeight: '800', color: '#1F1F39', marginBottom: 5 },
    itemPriceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
    itemPriceMain: { color: BrandColors.primaryGradientStart, fontSize: 13, fontWeight: '900', marginRight: 10 },
    itemMRP: { fontSize: 10, color: '#BDBDBD', textDecorationLine: 'line-through' },
    itemUnit: { fontSize: 10, fontWeight: '700', color: '#858597' },

    qtyContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    stepperWrap: { flex: 0.48 },
    stepperLabel: { fontSize: 8, fontWeight: '900', color: '#BDBDBD', marginBottom: 6, letterSpacing: 1, textAlign: 'center' },
    stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F5F9', borderRadius: 16, height: 48, overflow: 'hidden', borderWidth: 1, borderColor: '#ECEDF3' },
    stepperActive: { backgroundColor: '#fff', borderColor: BrandColors.primaryGradientStart + '40', elevation: 2 },
    stepBtn: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center' },
    stepSymbol: { fontSize: 22, fontWeight: '600', color: BrandColors.primaryGradientStart },
    stepInput: { flex: 1, height: 48, textAlign: 'center', fontSize: 17, fontWeight: '900', color: '#1F1F39', padding: 0 },

    summaryBar: { position: 'absolute', bottom: 25, left: 15, right: 15, elevation: 12, shadowColor: '#000', shadowOffset: {width:0, height:10}, shadowOpacity: 0.2 },
    summaryInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 28, paddingHorizontal: 25, paddingVertical: 18 },
    summaryLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' },
    summaryAmount: { fontSize: 26, fontWeight: '900', color: '#fff' },
    summaryBtn: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 14 },
    summaryBtnText: { color: BrandColors.primaryGradientStart, fontSize: 11, fontWeight: '900' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', width: '85%', borderRadius: 32, paddingVertical: 25, shadowColor: '#000', shadowOpacity: 0.2 },
    modalTitle: { textAlign: 'center', fontSize: 20, fontWeight: '900', color: '#1F1F39', marginBottom: 20 },
    modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 30, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F4F5F9' },
    modalOptionActive: { backgroundColor: BrandColors.primaryGradientStart + '05' },
    modalOptionText: { fontSize: 16, fontWeight: '700', color: '#4F4F6B' },
    checkIcon: { fontSize: 18, color: BrandColors.primaryGradientStart, fontWeight: '900' },
    
    reviewTitle: { fontSize: 26, fontWeight: '900', color: '#1F1F39', marginBottom: 25, marginLeft: 5 },
    reviewRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 26, padding: 22, marginBottom: 12, alignItems: 'center', elevation: 2 },
    reviewMain: { flex: 1 },
    reviewCat: { fontSize: 9, fontWeight: '900', color: BrandColors.primaryGradientStart, textTransform: 'uppercase', marginBottom: 4 },
    reviewName: { fontSize: 17, fontWeight: '800', color: '#1F1F39', marginBottom: 6 },
    reviewTagText: { fontSize: 13, fontWeight: '700', color: '#8F93B8' },
    reviewTotalValue: { fontSize: 20, fontWeight: '900', color: '#1F1F39' },
    billCard: { backgroundColor: '#fff', borderRadius: 30, padding: 30, marginTop: 15, elevation: 4 },
    billLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    billLabelLarge: { fontSize: 18, fontWeight: '900', color: '#1F1F39' },
    billValLarge: { fontSize: 28, fontWeight: '900', color: BrandColors.verifyGradientStart },
    placeBtnWrapper: { padding: 20, paddingBottom: 40 },
    placeBtn: { borderRadius: 28, overflow: 'hidden', elevation: 10 },
    placeBtnInner: { height: 70, alignItems: 'center', justifyContent: 'center' },
    placeBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 2 },
});

export default OrderEntryScreen;
