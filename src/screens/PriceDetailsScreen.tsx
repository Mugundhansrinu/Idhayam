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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import GlassHeader from '../components/GlassHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

const { width } = Dimensions.get('window');

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'PriceDetails'> };

const PRICES = [
    { name: 'Idhayam Sesame Oil 1L', mrp: 220, price: 180, change: +2 },
    { name: 'Idhayam Sesame Oil 500ml', mrp: 115, price: 95, change: 0 },
    { name: 'Idhayam Sesame Oil 200ml', mrp: 52, price: 42, change: -1 },
    { name: 'Idhayam Sesame Oil 100ml', mrp: 28, price: 23, change: 0 },
    { name: 'Idhayam Groundnut Oil 1L', mrp: 200, price: 165, change: +5 },
    { name: 'Idhayam Groundnut Oil 5L', mrp: 950, price: 780, change: +10 },
    { name: 'Idhayam Coconut Oil 500ml', mrp: 145, price: 120, change: 0 },
    { name: 'Idhayam Coconut Oil 200ml', mrp: 65, price: 54, change: -2 },
    { name: 'Idhayam Castor Oil 100ml', mrp: 85, price: 70, change: 0 },
];

const PriceDetailsScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const [search, setSearch] = useState('');
    const listAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(listAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const filtered = PRICES.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            
            <GlassHeader title="Price Details" subtitle="Current distributor prices" onBack={() => navigation.goBack()} gradientColors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]} />

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

            <Animated.ScrollView style={{ opacity: listAnim }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {filtered.map((item, i) => (
                    <View key={i} style={styles.priceCard}>
                        <View style={styles.priceRow}>
                            <View style={styles.productCol}>
                                <Text style={[styles.productName, { color: colors.textPrimary }]}>{item.name}</Text>
                                {item.change !== 0 && (
                                    <Text style={[styles.change, { color: item.change > 0 ? '#E3001B' : '#27AE60' }]}>
                                        {item.change > 0 ? `▲ +${item.change}` : `▼ ${item.change}`} since last update
                                    </Text>
                                )}
                            </View>
                            <View style={styles.priceCol}>
                                <Text style={[styles.mrpText, { color: colors.textMuted }]}>₹{item.mrp}</Text>
                                <Text style={[styles.priceText, { color: BrandColors.primaryGradientStart }]}>₹{item.price}</Text>
                            </View>
                        </View>
                        
                        <View style={styles.marginRow}>
                            <Text style={[styles.marginLabel, { color: colors.textSecondary }]}>
                                Margin: {Math.round(((item.mrp - item.price) / item.mrp) * 100)}%
                            </Text>
                            <View style={[styles.marginBg, { backgroundColor: colors.inputBackground }]}>
                                <LinearGradient
                                    colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={[styles.marginFill, { width: `${Math.round(((item.mrp - item.price) / item.mrp) * 100)}%` }]}
                                />
                            </View>
                        </View>
                    </View>
                ))}
                
                {filtered.length === 0 && (
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>🔍</Text>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No products found</Text>
                    </View>
                )}
            </Animated.ScrollView>
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
    colMrp: { width: 50, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textAlign: 'right' },
    colPrice: { width: 70, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textAlign: 'right' },
    scroll: { padding: 20, paddingBottom: 60 },
    priceCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
    productCol: { flex: 1, marginRight: 10 },
    productName: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
    change: { fontSize: 11, fontWeight: '600' },
    priceCol: { alignItems: 'flex-end' },
    mrpText: { fontSize: 12, textDecorationLine: 'line-through', marginBottom: 2 },
    priceText: { fontSize: 20, fontWeight: '900' },
    marginRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
    marginLabel: { fontSize: 12, fontWeight: '700', width: 85 },
    marginBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
    marginFill: { height: '100%', borderRadius: 3 },
    empty: { alignItems: 'center', marginTop: 80 },
    emptyIcon: { fontSize: 50, marginBottom: 15 },
    emptyText: { fontSize: 16, fontWeight: '600' },
});

export default PriceDetailsScreen;
