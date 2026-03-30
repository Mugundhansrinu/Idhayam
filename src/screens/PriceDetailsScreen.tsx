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
    Modal,
    FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import GlassHeader from '../components/GlassHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getPriceList } from '../api';
import { useSession } from '../context/SessionContext';

const { width } = Dimensions.get('window');

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'PriceDetails'> };

const PriceDetailsScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const { session } = useSession();
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [selectedCat, setSelectedCat] = useState('All Products');
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const listAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchPrices();
    }, []);

    const fetchPrices = async () => {
        setLoading(true);
        setError('');
        try {
            const custId = session?.custId || undefined;
            const data = await getPriceList(custId);
            setProducts(data || []);
            Animated.timing(listAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        } catch (e) {
            console.error('Price fetch error:', e);
            setError('Failed to load price list.');
        } finally {
            setLoading(false);
        }
    };

    const categories = useMemo(() => {
        const cats = Array.from(new Set(products.map(p => p.category))).filter(Boolean).sort();
        return ['All Products', ...cats as string[]];
    }, [products]);

    const filtered = products.filter(p => {
        const matchesSearch = (p.name || '').toLowerCase().includes(search.toLowerCase());
        const matchesCat = selectedCat === 'All Products' || p.category === selectedCat;
        return matchesSearch && matchesCat;
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            
            <GlassHeader 
                title="Price Details" 
                subtitle="Current distributor prices" 
                onBack={() => navigation.goBack()} 
                gradientColors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]} 
            />

            <View style={styles.searchWrapper}>
                <View style={[styles.searchBox, { backgroundColor: colors.inputBackground, borderColor: colors.divider }]}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={[styles.searchInput, { color: colors.inputText }]}
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search..."
                        placeholderTextColor={colors.inputPlaceholder}
                    />
                </View>
                <TouchableOpacity 
                    style={[styles.filterBtn, { backgroundColor: BrandColors.primaryGradientStart }]}
                    onPress={() => setShowDropdown(true)}
                >
                    <Text style={styles.filterBtnText}>{selectedCat === 'All Products' ? 'Filter' : selectedCat}</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.tableHeader, { borderBottomColor: colors.divider }]}>
                <Text style={[styles.colProduct, styles.tableHeaderText, { color: colors.textSecondary }]}>PRODUCT</Text>
                <Text style={[styles.colPrice, styles.tableHeaderText, { textAlign: 'right', color: colors.textSecondary }]}>PRICE</Text>
                <Text style={[styles.colTax, styles.tableHeaderText, { textAlign: 'right', color: colors.textSecondary }]}>TAX</Text>
                <Text style={[styles.colMrp, styles.tableHeaderText, { textAlign: 'right', color: colors.textSecondary }]}>MRP</Text>
            </View>

            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={BrandColors.primaryGradientStart} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading prices...</Text>
                </View>
            ) : error ? (
                <View style={styles.centerBox}>
                    <Text style={[styles.errorText, { color: '#E3001B' }]}>{error}</Text>
                    <TouchableOpacity onPress={fetchPrices} style={styles.retryBtn}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <Animated.ScrollView 
                    style={{ opacity: listAnim }} 
                    contentContainerStyle={styles.scroll} 
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.tableBody, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                        {filtered.map((item, i) => {
                            const isLast = i === filtered.length - 1;
                            const isEven = i % 2 === 0;
                            
                            return (
                                <View 
                                    key={i} 
                                    style={[
                                        styles.tableRow, 
                                        { 
                                            backgroundColor: isEven ? 'transparent' : (colors.background + '40'),
                                            borderBottomWidth: isLast ? 0 : 1,
                                            borderBottomColor: colors.divider + '40'
                                        }
                                    ]}
                                >
                                    <View style={styles.colProduct}>
                                        <Text style={[styles.cellSubText, { color: colors.textSecondary }]}>{item.category}</Text>
                                        <Text style={[styles.cellMainText, { color: colors.textPrimary }]}>{item.name}</Text>
                                        <Text style={[styles.cellTinyText, { color: colors.textMuted }]}>UOM: {item.unit}</Text>
                                    </View>
                                    
                                    <View style={styles.colPrice}>
                                        <Text style={[styles.cellPriceText, { color: BrandColors.primaryGradientStart }]}>₹{item.price}</Text>
                                    </View>

                                    <View style={styles.colTax}>
                                        <Text style={[styles.cellSubText, { color: colors.textSecondary, textAlign: 'right' }]}>{item.tax}</Text>
                                    </View>

                                    <View style={styles.colMrp}>
                                        <Text style={[styles.cellMrpText, { color: colors.textPrimary }]}>₹{item.mrp}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                    
                    {filtered.length === 0 && (
                        <View style={styles.empty}>
                            <Text style={styles.emptyIcon}>🔍</Text>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No products found</Text>
                        </View>
                    )}
                </Animated.ScrollView>
            )}

            <Modal visible={showDropdown} transparent animationType="fade" onRequestClose={() => setShowDropdown(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDropdown(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Category</Text>
                        <FlatList 
                            data={categories} 
                            keyExtractor={c => c} 
                            style={{maxHeight: 400}} 
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={[styles.modalOption, selectedCat === item && styles.modalOptionActive]} 
                                    onPress={() => { setSelectedCat(item); setShowDropdown(false); }}
                                >
                                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                                        <Text style={[styles.modalOptionText, selectedCat === item && {color: BrandColors.primaryGradientStart}]}>{item}</Text>
                                        {selectedCat === item && <Text style={{color: BrandColors.primaryGradientStart, fontWeight: '900'}}>✓</Text>}
                                    </View>
                                </TouchableOpacity>
                            )} 
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchWrapper: { paddingHorizontal: 20, paddingVertical: 15, flexDirection: 'row', alignItems: 'center' },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 14 : 8, marginRight: 10 },
    searchIcon: { fontSize: 16, marginRight: 10 },
    searchInput: { flex: 1, fontSize: 15, fontWeight: '600' },
    
    filterBtn: { paddingHorizontal: 15, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    filterBtnText: { color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    
    tableHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, marginHorizontal: 10 },
    colProduct: { flex: 1.2, paddingRight: 5 },
    colMrp: { width: 55, alignItems: 'flex-end', justifyContent: 'center' },
    colTax: { width: 45, alignItems: 'flex-end', justifyContent: 'center' },
    colPrice: { width: 85, alignItems: 'flex-end', justifyContent: 'center' },
    
    tableHeaderText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    
    scroll: { padding: 10, paddingBottom: 60 },
    tableBody: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    tableRow: { flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 12 },
    
    cellMainText: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
    cellSubText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    cellTinyText: { fontSize: 10, fontWeight: '600' },
    cellMrpText: { fontSize: 13, fontWeight: '700' },
    cellPriceText: { fontSize: 15, fontWeight: '900' },

    centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    loadingText: { marginTop: 15, fontWeight: '600' },
    errorText: { textAlign: 'center', fontSize: 16, fontWeight: '700', marginBottom: 20 },
    retryBtn: { paddingHorizontal: 30, paddingVertical: 12, borderRadius: 12, backgroundColor: BrandColors.primaryGradientStart },
    retryText: { color: '#fff', fontWeight: '800' },
    
    empty: { alignItems: 'center', marginTop: 80 },
    emptyIcon: { fontSize: 50, marginBottom: 15 },
    emptyText: { fontSize: 16, fontWeight: '600' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', width: '85%', borderRadius: 24, paddingVertical: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
    modalTitle: { textAlign: 'center', fontSize: 18, fontWeight: '900', color: '#1F1F39', marginBottom: 15 },
    modalOption: { paddingHorizontal: 25, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    modalOptionActive: { backgroundColor: BrandColors.primaryGradientStart + '10' },
    modalOptionText: { fontSize: 15, fontWeight: '700', color: '#444' },
});

export default PriceDetailsScreen;
