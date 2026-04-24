import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Animated,
    ScrollView,
    TextInput,
    Dimensions,
    Platform,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getPriceList } from '../api';
import { useSession } from '../context/SessionContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'PriceDetails'> };

const PriceDetailsScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const { session } = useSession();
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [selectedCat, setSelectedCat] = useState('');
    const [loading, setLoading] = useState(true);
    const listAnim = useRef(new Animated.Value(0)).current;

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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
                    {categories.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.catChip, selectedCat === cat && styles.catChipActive]}
                            onPress={() => setSelectedCat(cat)}
                        >
                            <Text style={[styles.catText, selectedCat === cat && styles.catTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Standardized Table Header */}
            <View style={styles.tableHeader}>
                <Text style={[styles.colLabel, { flex: 1.4, textAlign: 'center' }]}>MRP (₹)</Text>
                <Text style={[styles.colLabel, { flex: 1.2, textAlign: 'center' }]}>ITEM</Text>
                <Text style={[styles.colLabel, { flex: 1, textAlign: 'center' }]}>TAX %</Text>
                <Text style={[styles.colLabel, { flex: 1.4, textAlign: 'center' }]}>PRICE (₹)</Text>
            </View>

            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#3861FB" />
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <View style={styles.priceCard}>
                            {/* 1. MRP */}
                            <Text style={[styles.prodMrp, { flex: 1.4, textAlign: 'center' }]} numberOfLines={1}>₹{item.mrp}</Text>

                            {/* 2. ITEM */}
                            <View style={{ flex: 1.2, alignItems: 'center' }}>
                                <Text style={[styles.prodName, { textAlign: 'center' }]}>{item.name}</Text>
                            </View>

                            {/* 3. TAX */}
                            <Text style={[styles.prodVal, { flex: 1, textAlign: 'center' }]} numberOfLines={1}>{item.tax}</Text>

                            {/* 4. PRICE */}
                            <Text style={[styles.prodVal, { flex: 1.4, textAlign: 'center' }]} numberOfLines={1}>₹{item.price}</Text>
                        </View>
                    )}
                />
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
    downloadBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2 },

    searchSection: { paddingHorizontal: 25, marginBottom: 20 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 15, paddingHorizontal: 15, height: 52 },
    searchInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A1A' },

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
    prodSub: { fontSize: 10, color: '#A0AEC0', fontWeight: '700', marginTop: 2 },
    prodVal: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '900', color: '#059669' },
    prodMrp: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '900', color: '#3861FB' },

    centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 },

    footerInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#F8F9FD', padding: 25 },
    footerInner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#3861FB',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5
    },
    updateIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0F4FF', alignItems: 'center', justifyContent: 'center' },
    updateLabel: { fontSize: 10, fontWeight: '800', color: '#A0AEC0' },
    updateValue: { fontSize: 15, fontWeight: '900', color: '#1A1A1A', marginTop: 2 },
    prodCountBadge: { backgroundColor: '#F0F4FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    prodCountText: { fontSize: 10, fontWeight: '900', color: '#3861FB' },
    footerNote: { textAlign: 'center', fontSize: 11, color: '#A0AEC0', fontWeight: '700', marginTop: 15 },
});

export default PriceDetailsScreen;
