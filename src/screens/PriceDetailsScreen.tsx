import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Animated,
    ScrollView,
    Platform,
    ActivityIndicator,
    FlatList,
    PanResponder,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getPriceList } from '../api';
import { useSession } from '../context/SessionContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'PriceDetails'> };

const PriceDetailsScreen: React.FC<Props> = ({ navigation }) => {
    const { session } = useSession();
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [selectedCat, setSelectedCat] = useState('');
    const [loading, setLoading] = useState(true);
    const listAnim = useRef(new Animated.Value(0)).current;
    const catScrollRef = useRef<ScrollView>(null);
    const catXPositions = useRef<number[]>([]);

    useEffect(() => {
        fetchPrices();
    }, []);

    const fetchPrices = async () => {
        setLoading(true);
        try {
            const custId = session?.custId || undefined;
            const data = await getPriceList(custId);
            setProducts(data || []);
            if (data && data.length > 0) {
                const catMap = new Map<string, number>();
                data.forEach((p: any) => {
                    if (p.category && !catMap.has(p.category)) {
                        catMap.set(p.category, p.igSort || 9999);
                    }
                });
                const cats = Array.from(catMap.entries())
                    .sort((a, b) => a[1] - b[1])
                    .map(entry => entry[0]);

                if (cats.length > 0) setSelectedCat(cats[0]);
            }
            Animated.timing(listAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        } catch (e) {
            console.error('Price fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    const categories = useMemo(() => {
        const catMap = new Map<string, number>();
        products.forEach(p => {
            if (p.category && !catMap.has(p.category)) {
                catMap.set(p.category, p.igSort || 9999);
            }
        });
        return Array.from(catMap.entries())
            .sort((a, b) => a[1] - b[1])
            .map(entry => entry[0]);
    }, [products]);

    const filtered = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = (p.name || '').toLowerCase().includes(search.toLowerCase());
            const matchesCat = p.category === selectedCat;
            return matchesSearch && matchesCat;
        }).sort((a, b) => (a.imSort ?? 9999) - (b.imSort ?? 9999));
    }, [products, search, selectedCat]);

    const changeCat = useCallback((dir: 'left' | 'right') => {
        if (categories.length === 0) return;
        const currentIdx = categories.indexOf(selectedCat);
        let nextIdx = currentIdx;
        if (dir === 'left') nextIdx = Math.min(currentIdx + 1, categories.length - 1);
        else nextIdx = Math.max(currentIdx - 1, 0);
        if (nextIdx === currentIdx) return;
        setSelectedCat(categories[nextIdx]);
        const x = catXPositions.current[nextIdx];
        if (x !== undefined) catScrollRef.current?.scrollTo({ x: Math.max(0, x - 20), animated: true });
    }, [categories, selectedCat]);

    // Use a ref so PanResponder always calls the latest changeCat without stale closure
    const changeCatRef = useRef(changeCat);
    useEffect(() => { changeCatRef.current = changeCat; }, [changeCat]);

    const swipePanResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gs) =>
                Math.abs(gs.dx) > 15 && Math.abs(gs.dx) > Math.abs(gs.dy),
            onPanResponderRelease: (_, gs) => {
                if (gs.dx < -40) changeCatRef.current('left');
                else if (gs.dx > 40) changeCatRef.current('right');
            },
        })
    ).current;

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            {/* Header matching screenshot */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={20} color="#3861FB" />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={styles.headerTitle}>Price Details</Text>
                    <Text style={styles.headerSub}>Search products / categories</Text>
                </View>
            </View>



            {/* Category Chips */}
            <View style={styles.catWrapper}>
                <ScrollView ref={catScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
                    {categories.map((cat, idx) => (
                        <TouchableOpacity
                            key={cat}
                            onLayout={e => { catXPositions.current[idx] = e.nativeEvent.layout.x; }}
                            style={[styles.catChip, selectedCat === cat && styles.catChipActive]}
                            onPress={() => {
                                setSelectedCat(cat);
                                const x = catXPositions.current[idx];
                                if (x !== undefined) catScrollRef.current?.scrollTo({ x: Math.max(0, x - 20), animated: true });
                            }}
                        >
                            <Text style={[styles.catText, selectedCat === cat && styles.catTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Standardized Table Header */}
            <View style={styles.tableHeader}>
                <Text style={[styles.colLabel, { flex: 1.2, textAlign: 'center' }]}>MRP (₹)</Text>
                <Text style={[styles.colLabel, { flex: 2, textAlign: 'center', paddingLeft: 10 }]}>ITEM</Text>
                <Text style={[styles.colLabel, { flex: 0.8, textAlign: 'center' }]}>TAX %</Text>
                <Text style={[styles.colLabel, { flex: 1.2, textAlign: 'right' }]}>PRICE (₹)</Text>
            </View>

            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#3861FB" />
                </View>
            ) : (
                <View style={{ flex: 1 }} {...swipePanResponder.panHandlers}>
                    <FlatList
                        data={filtered}
                        keyExtractor={(item, index) => index.toString()}
                        contentContainerStyle={styles.listContent}
                        renderItem={({ item }) => (
                            <View style={styles.priceCard}>
                                {/* 1. MRP */}
                                <Text style={[styles.prodMrp, { flex: 1.2, textAlign: 'center' }]} >₹{item.mrp}</Text>

                                {/* 2. ITEM */}
                                <Text style={[styles.prodName, { flex: 2, textAlign: 'center', color: '#080808ff', paddingLeft: 10 }]}>{item.name}</Text>

                                {/* 3. TAX */}
                                <Text style={[styles.prodVal, { flex: 0.8, textAlign: 'center', color: '#080808ff' }]}>{item.tax}</Text>

                                {/* 4. PRICE */}
                                <Text style={[styles.prodVal, { flex: 1.2, textAlign: 'right' }]} >₹{item.price}</Text>
                            </View>
                        )}
                    />
                </View>
            )}

        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FD' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2 },
    headerTitles: { flex: 1, marginLeft: 15 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A1A' },
    headerSub: { fontSize: 13, color: '#A0AEC0', fontWeight: '600', marginTop: 2 },

    catWrapper: { marginBottom: 20 },
    catScroll: { paddingHorizontal: 25 },
    catChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#EDF2F7' },
    catChipActive: { backgroundColor: '#3861FB', borderColor: '#3861FB' },
    catText: { fontSize: 12, fontWeight: '800', color: '#718096' },
    catTextActive: { color: '#fff' },

    tableHeader: { flexDirection: 'row', paddingHorizontal: 25, marginBottom: 15 },
    colLabel: { flex: 1, fontSize: 12, fontWeight: '900', color: '#171718ff', textAlign: 'center' },

    listContent: { paddingHorizontal: 20, paddingBottom: 50 },
    priceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 18,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 3
    },
    prodName: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
    prodVal: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '900', color: '#059669' },
    prodMrp: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '900', color: '#3861FB' },

    centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 },
});

export default PriceDetailsScreen;
