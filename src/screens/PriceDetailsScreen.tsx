/**
 * PriceDetailsScreen – Product-wise price list
 */
import React, { useRef, useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, StatusBar,
    Animated, ScrollView, TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import OilFlowBackground from '../components/OilFlowBackground';
import GlassCard from '../components/GlassCard';
import GlassHeader from '../components/GlassHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

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
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <LinearGradient colors={[BrandColors.blue900, BrandColors.blue800, '#0a1a4e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <OilFlowBackground />
            <GlassHeader title="Price Details" subtitle="Current distributor prices" onBack={() => navigation.goBack()} />

            {/* Search */}
            <View style={styles.searchWrapper}>
                <View style={[styles.searchBox, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
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

            {/* Header row */}
            <View style={[styles.tableHeader, { borderBottomColor: colors.divider }]}>
                <Text style={[styles.colProduct, { color: colors.textMuted }]}>PRODUCT</Text>
                <Text style={[styles.colMrp, { color: colors.textMuted }]}>MRP</Text>
                <Text style={[styles.colPrice, { color: colors.textMuted }]}>YOUR PRICE</Text>
            </View>

            <Animated.ScrollView style={{ opacity: listAnim }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {filtered.map((item, i) => (
                    <Animated.View
                        key={i}
                        style={{
                            opacity: listAnim,
                            transform: [{ translateY: listAnim.interpolate({ inputRange: [0, 1], outputRange: [20 + i * 5, 0] }) }],
                        }}>
                        <GlassCard style={styles.priceCard}>
                            <View style={styles.priceRow}>
                                <View style={styles.productCol}>
                                    <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={2}>
                                        {item.name}
                                    </Text>
                                    {item.change !== 0 && (
                                        <Text style={[styles.change, { color: item.change > 0 ? BrandColors.red600 : '#22C55E' }]}>
                                            {item.change > 0 ? `▲ +${item.change}` : `▼ ${item.change}`} since last update
                                        </Text>
                                    )}
                                </View>
                                <Text style={[styles.mrpText, { color: colors.textMuted }]}>₹{item.mrp}</Text>
                                <Text style={[styles.priceText, { color: BrandColors.yellow500 }]}>₹{item.price}</Text>
                            </View>
                            {/* Margin strip */}
                            <View style={styles.marginRow}>
                                <Text style={[styles.marginLabel, { color: colors.textMuted }]}>
                                    Margin: {Math.round(((item.mrp - item.price) / item.mrp) * 100)}%
                                </Text>
                                <View style={[styles.marginBg, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                    <LinearGradient
                                        colors={[BrandColors.yellow500, BrandColors.yellow600 ?? '#CA9E00']}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                        style={[styles.marginFill, { width: `${Math.round(((item.mrp - item.price) / item.mrp) * 100)}%` }]}
                                    />
                                </View>
                            </View>
                        </GlassCard>
                    </Animated.View>
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
    searchWrapper: { paddingHorizontal: 20, paddingVertical: 10 },
    searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 8 },
    searchIcon: { fontSize: 14, marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14 },
    tableHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 8, borderBottomWidth: 1 },
    colProduct: { flex: 1, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    colMrp: { width: 52, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textAlign: 'right' },
    colPrice: { width: 72, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textAlign: 'right' },
    scroll: { padding: 20, paddingTop: 12, paddingBottom: 40 },
    priceCard: { marginBottom: 10, padding: 12 },
    priceRow: { flexDirection: 'row', alignItems: 'flex-start' },
    productCol: { flex: 1 },
    productName: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
    change: { fontSize: 10, fontStyle: 'italic' },
    mrpText: { width: 52, fontSize: 13, textAlign: 'right', textDecorationLine: 'line-through' },
    priceText: { width: 72, fontSize: 16, fontWeight: '800', textAlign: 'right' },
    marginRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
    marginLabel: { fontSize: 10, width: 70 },
    marginBg: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
    marginFill: { height: '100%', borderRadius: 2 },
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyIcon: { fontSize: 40, marginBottom: 12 },
    emptyText: { fontSize: 14 },
});

export default PriceDetailsScreen;
