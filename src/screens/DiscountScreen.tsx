/**
 * DiscountScreen – Scheme / Quantity / Target discount tabs
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, StatusBar,
    Animated, ScrollView, Dimensions,
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
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Discount'> };

const TABS = [
    { id: 'scheme', label: 'Scheme', icon: '🎯' },
    { id: 'qd', label: 'Qty Discount', icon: '📦' },
    { id: 'target', label: 'Target', icon: '🏆' },
];

const SCHEME_DATA = [
    { product: 'Sesame Oil 1L', scheme: 'Buy 10 Get 1 Free', validity: '31 Mar 2026', value: '₹180 saving' },
    { product: 'Groundnut Oil 5L', scheme: '3% Cash Discount', validity: '28 Feb 2026', value: '3%' },
    { product: 'Coconut Oil 500ml', scheme: 'Festival Bonus 2%', validity: '15 Mar 2026', value: '2%' },
];

const QD_DATA = [
    { range: '1 – 10 Boxes', discount: '0%', highlight: false },
    { range: '11 – 25 Boxes', discount: '1.5%', highlight: false },
    { range: '26 – 50 Boxes', discount: '2.5%', highlight: true },
    { range: '51 – 100 Boxes', discount: '3.5%', highlight: false },
    { range: '100+ Boxes', discount: '5%', highlight: false },
];

const TARGET_DATA = [
    { label: 'Monthly Target', value: '₹8,00,000', achieved: '₹5,20,000', pct: 65 },
    { label: 'Quarterly Target', value: '₹24,00,000', achieved: '₹16,40,000', pct: 68 },
    { label: 'Annual Target', value: '₹96,00,000', achieved: '₹52,00,000', pct: 54 },
];

const DiscountScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const [activeTab, setActiveTab] = useState('scheme');
    const tabIndicator = useRef(new Animated.Value(0)).current;
    const contentOpacity = useRef(new Animated.Value(1)).current;

    const tabIndex = TABS.findIndex(t => t.id === activeTab);

    const switchTab = (id: string, idx: number) => {
        Animated.timing(contentOpacity, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
            setActiveTab(id);
            Animated.parallel([
                Animated.spring(tabIndicator, { toValue: idx, friction: 7, useNativeDriver: false }),
                Animated.timing(contentOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            ]).start();
        });
    };

    useEffect(() => {
        Animated.spring(tabIndicator, { toValue: 0, friction: 7, useNativeDriver: false }).start();
    }, []);

    const tabWidth = (width - 40) / TABS.length;

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <LinearGradient colors={[BrandColors.blue900, BrandColors.blue800, '#0a1a4e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <OilFlowBackground />
            <GlassHeader title="Discount Details" subtitle="Your current discount schemes" onBack={() => navigation.goBack()} />

            {/* Tab Bar */}
            <View style={[styles.tabBar, { backgroundColor: colors.glassBackground, borderColor: colors.glassBorder }]}>
                <Animated.View style={[styles.tabIndicator, {
                    width: tabWidth - 8,
                    left: Animated.multiply(tabIndicator, tabWidth + (8 / TABS.length)),
                    backgroundColor: BrandColors.yellow500,
                }]} />
                {TABS.map((tab, i) => (
                    <TouchableOpacity key={tab.id} style={[styles.tab, { width: tabWidth }]} onPress={() => switchTab(tab.id, i)}>
                        <Text>{tab.icon}</Text>
                        <Text style={[styles.tabLabel, { color: activeTab === tab.id ? BrandColors.blue900 : colors.textSecondary }]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Animated.ScrollView style={{ opacity: contentOpacity }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {activeTab === 'scheme' && SCHEME_DATA.map((s, i) => (
                    <GlassCard key={i} style={styles.card}>
                        <View style={styles.schemeHeader}>
                            <Text style={[styles.schemeProd, { color: colors.textPrimary }]}>{s.product}</Text>
                            <View style={[styles.badge, { backgroundColor: BrandColors.yellow500 + '33', borderColor: BrandColors.yellow500 }]}>
                                <Text style={[styles.badgeText, { color: BrandColors.yellow500 }]}>{s.value}</Text>
                            </View>
                        </View>
                        <Text style={[styles.schemeDesc, { color: colors.textSecondary }]}>🎯 {s.scheme}</Text>
                        <Text style={[styles.validity, { color: colors.textMuted }]}>Valid till: {s.validity}</Text>
                    </GlassCard>
                ))}

                {activeTab === 'qd' && (
                    <GlassCard accentLine style={styles.tableCard}>
                        <Text style={[styles.tableTitle, { color: colors.textPrimary }]}>Quantity Discount Slab</Text>
                        {QD_DATA.map((row, i) => (
                            <View key={i} style={[styles.tableRow, row.highlight && { backgroundColor: BrandColors.yellow500 + '22', borderRadius: 8 }]}>
                                <Text style={[styles.tableRange, { color: colors.textPrimary }]}>{row.range}</Text>
                                <Text style={[styles.tableDiscount, { color: row.highlight ? BrandColors.yellow500 : colors.textSecondary }]}>{row.discount}</Text>
                            </View>
                        ))}
                    </GlassCard>
                )}

                {activeTab === 'target' && TARGET_DATA.map((t, i) => (
                    <GlassCard key={i} style={styles.card}>
                        <Text style={[styles.targetLabel, { color: colors.textSecondary }]}>{t.label}</Text>
                        <View style={styles.targetRow}>
                            <View>
                                <Text style={[styles.targetAchieved, { color: BrandColors.yellow500 }]}>{t.achieved}</Text>
                                <Text style={[styles.targetOf, { color: colors.textMuted }]}>of {t.value}</Text>
                            </View>
                            <Text style={[styles.targetPct, { color: t.pct >= 60 ? '#22C55E' : BrandColors.red600 }]}>{t.pct}%</Text>
                        </View>
                        <View style={[styles.progressBg, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                            <LinearGradient
                                colors={t.pct >= 60 ? ['#22C55E', '#16A34A'] : [BrandColors.red600, BrandColors.red500]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={[styles.progressFill, { width: `${t.pct}%` }]}
                            />
                        </View>
                    </GlassCard>
                ))}
            </Animated.ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabBar: { flexDirection: 'row', marginHorizontal: 20, marginVertical: 12, borderRadius: 14, borderWidth: 1, padding: 4, position: 'relative' },
    tabIndicator: { position: 'absolute', top: 4, height: 36, borderRadius: 10, zIndex: 0 },
    tab: { alignItems: 'center', paddingVertical: 8, zIndex: 1, gap: 2 },
    tabLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    card: { marginBottom: 12, padding: 16 },
    schemeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    schemeProd: { fontSize: 14, fontWeight: '700', flex: 1 },
    badge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    schemeDesc: { fontSize: 13, marginBottom: 6 },
    validity: { fontSize: 11, fontStyle: 'italic' },
    tableCard: { marginBottom: 12 },
    tableTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
    tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
    tableRange: { fontSize: 13 },
    tableDiscount: { fontSize: 14, fontWeight: '700' },
    targetLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
    targetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    targetAchieved: { fontSize: 22, fontWeight: '800' },
    targetOf: { fontSize: 11, marginTop: 2 },
    targetPct: { fontSize: 28, fontWeight: '900' },
    progressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
});

export default DiscountScreen;
