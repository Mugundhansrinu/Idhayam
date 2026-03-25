import React, { useRef, useEffect, useState } from 'react';
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

    const filtered = products.filter(p => 
        (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(search.toLowerCase())
    );

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
                        placeholder="Search products..."
                        placeholderTextColor={colors.inputPlaceholder}
                    />
                </View>
            </View>

            <View style={[styles.tableHeader, { borderBottomColor: colors.divider }]}>
                <Text style={[styles.colProduct, { color: colors.textSecondary }]}>PRODUCT</Text>
                <Text style={[styles.colMrp, { color: colors.textSecondary }]}>MRP</Text>
                <Text style={[styles.colPrice, { color: colors.textSecondary }]}>PRICE</Text>
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
                <Animated.ScrollView style={{ opacity: listAnim }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {filtered.map((item, i) => {
                        const mrpNum = parseFloat(item.mrp || '0');
                        const priceNum = parseFloat(item.price || '0');
                        const margin = mrpNum > 0 ? Math.round(((mrpNum - priceNum) / mrpNum) * 100) : 0;

                        return (
                            <View key={i} style={styles.priceCard}>
                                <View style={styles.priceRow}>
                                    <View style={styles.productCol}>
                                        <Text style={[styles.productCategory, { color: colors.textSecondary }]}>{item.category}</Text>
                                        <Text style={[styles.productName, { color: colors.textPrimary }]}>{item.name}</Text>
                                        <Text style={[styles.unitText, { color: colors.textMuted }]}>Unit: {item.unit}</Text>
                                    </View>
                                    <View style={styles.priceCol}>
                                        <Text style={[styles.mrpText, { color: colors.textMuted }]}>₹{item.mrp}</Text>
                                        <Text style={[styles.priceText, { color: BrandColors.primaryGradientStart }]}>₹{item.price}</Text>
                                    </View>
                                </View>
                                
                                {mrpNum > 0 && (
                                    <View style={styles.marginRow}>
                                        <Text style={[styles.marginLabel, { color: colors.textSecondary }]}>
                                            Margin: {margin}%
                                        </Text>
                                        <View style={[styles.marginBg, { backgroundColor: colors.inputBackground }]}>
                                            <LinearGradient
                                                colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
                                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                                style={[styles.marginFill, { width: `${Math.min(100, margin)}%` }]}
                                            />
                                        </View>
                                    </View>
                                )}
                                {item.tax !== '0%' && (
                                    <Text style={[styles.taxText, { color: colors.textMuted }]}>GST Incl: {item.tax}</Text>
                                )}
                            </View>
                        );
                    })}
                    
                    {filtered.length === 0 && (
                        <View style={styles.empty}>
                            <Text style={styles.emptyIcon}>🔍</Text>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No products found</Text>
                        </View>
                    )}
                </Animated.ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchWrapper: { paddingHorizontal: 20, paddingVertical: 15 },
    searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 14 : 8 },
    searchIcon: { fontSize: 16, marginRight: 10 },
    searchInput: { flex: 1, fontSize: 15, fontWeight: '600' },
    tableHeader: { flexDirection: 'row', paddingHorizontal: 25, paddingBottom: 12, borderBottomWidth: 1 },
    colProduct: { flex: 1, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    colMrp: { width: 60, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textAlign: 'right' },
    colPrice: { width: 80, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textAlign: 'right' },
    scroll: { padding: 20, paddingBottom: 60 },
    
    centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    loadingText: { marginTop: 15, fontWeight: '600' },
    errorText: { textAlign: 'center', fontSize: 16, fontWeight: '700', marginBottom: 20 },
    retryBtn: { paddingHorizontal: 30, paddingVertical: 12, borderRadius: 12, backgroundColor: BrandColors.primaryGradientStart },
    retryText: { color: '#fff', fontWeight: '800' },

    priceCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
    productCol: { flex: 1, marginRight: 10 },
    productCategory: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 2, letterSpacing: 0.5 },
    productName: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
    unitText: { fontSize: 11, fontWeight: '600' },
    priceCol: { alignItems: 'flex-end' },
    mrpText: { fontSize: 12, textDecorationLine: 'line-through', marginBottom: 2 },
    priceText: { fontSize: 20, fontWeight: '900' },
    marginRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
    marginLabel: { fontSize: 12, fontWeight: '700', width: 85 },
    marginBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
    marginFill: { height: '100%', borderRadius: 3 },
    taxText: { fontSize: 10, fontWeight: '700', marginTop: 10, textAlign: 'right' },
    empty: { alignItems: 'center', marginTop: 80 },
    emptyIcon: { fontSize: 50, marginBottom: 15 },
    emptyText: { fontSize: 16, fontWeight: '600' },
});

export default PriceDetailsScreen;
