/**
 * InvoiceDetailScreen – Invoice list + PDF download simulation
 */
import React, { useRef, useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, StatusBar,
    Animated, ScrollView, Alert, TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import OilFlowBackground from '../components/OilFlowBackground';
import GlassCard from '../components/GlassCard';
import GlassHeader from '../components/GlassHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'InvoiceDetail'> };

const INVOICES = [
    { id: 'INV-2026-0341', date: '24 Feb 2026', amount: 48200, status: 'Paid', items: 8 },
    { id: 'INV-2026-0289', date: '18 Feb 2026', amount: 31500, status: 'Pending', items: 5 },
    { id: 'INV-2026-0244', date: '10 Feb 2026', amount: 72800, status: 'Paid', items: 12 },
    { id: 'INV-2026-0201', date: '02 Feb 2026', amount: 19400, status: 'Overdue', items: 4 },
    { id: 'INV-2026-0175', date: '25 Jan 2026', amount: 55600, status: 'Paid', items: 9 },
    { id: 'INV-2026-0143', date: '15 Jan 2026', amount: 38900, status: 'Paid', items: 7 },
];

const STATUS_COLOR: Record<string, string> = {
    Paid: '#22C55E',
    Pending: BrandColors.yellow500,
    Overdue: BrandColors.red600,
};

const InvoiceDetailScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const [filter, setFilter] = useState('All');
    const listAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(listAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const displayed = filter === 'All' ? INVOICES : INVOICES.filter(i => i.status === filter);

    const handleDownload = (id: string) => {
        Alert.alert('Download PDF', `Downloading ${id}.pdf...`, [{ text: 'OK' }]);
    };

    const totalAmount = INVOICES.reduce((s, i) => s + i.amount, 0);
    const paidCount = INVOICES.filter(i => i.status === 'Paid').length;
    const pendingCount = INVOICES.filter(i => i.status === 'Pending').length;
    const overdueCount = INVOICES.filter(i => i.status === 'Overdue').length;

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <LinearGradient colors={[BrandColors.blue900, BrandColors.blue800, '#0a1a4e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <OilFlowBackground />
            <GlassHeader title="Invoice Details" subtitle="Your invoice history" onBack={() => navigation.goBack()} />

            <View style={styles.summaryRow}>
                {[
                    { label: 'Total', value: `₹${(totalAmount / 1000).toFixed(1)}K`, color: BrandColors.yellow500 },
                    { label: 'Paid', value: `${paidCount}`, color: '#22C55E' },
                    { label: 'Pending', value: `${pendingCount}`, color: BrandColors.yellow500 },
                    { label: 'Overdue', value: `${overdueCount}`, color: BrandColors.red600 },
                ].map((s, i) => (
                    <GlassCard key={i} style={styles.summaryCard} padding={8}>
                        <View style={styles.cardInternal}>
                            <Text
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                style={[styles.summaryVal, { color: s.color }]}>
                                {s.value}
                            </Text>
                            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{s.label}</Text>
                        </View>
                    </GlassCard>
                ))}
            </View>

            {/* Filter chips */}
            <View style={styles.filterRowContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
                    {['All', 'Paid', 'Pending', 'Overdue'].map(f => (
                        <TouchableOpacity
                            key={f}
                            onPress={() => setFilter(f)}
                            style={[styles.chip, { backgroundColor: filter === f ? BrandColors.yellow500 : colors.glassBackground, borderColor: filter === f ? BrandColors.yellow500 : colors.glassBorder }]}>
                            <Text style={[styles.chipText, { color: filter === f ? BrandColors.blue900 : colors.textSecondary }]}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <Animated.ScrollView style={[styles.listScroll, { opacity: listAnim }]} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {displayed.map((inv, i) => (
                    <Animated.View key={inv.id} style={{
                        opacity: listAnim,
                        transform: [{ translateY: listAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                    }}>
                        <GlassCard style={styles.invoiceCard}>
                            <View style={styles.invTop}>
                                <View>
                                    <Text style={[styles.invId, { color: colors.textPrimary }]}>{inv.id}</Text>
                                    <Text style={[styles.invDate, { color: colors.textMuted }]}>📅 {inv.date}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[inv.status] + '22', borderColor: STATUS_COLOR[inv.status] }]}>
                                    <Text style={[styles.statusText, { color: STATUS_COLOR[inv.status] }]}>{inv.status}</Text>
                                </View>
                            </View>
                            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                            <View style={styles.invBottom}>
                                <View>
                                    <Text style={[styles.invAmount, { color: BrandColors.yellow500 }]}>₹{inv.amount.toLocaleString()}</Text>
                                    <Text style={[styles.invItems, { color: colors.textMuted }]}>{inv.items} items</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleDownload(inv.id)} style={[styles.downloadBtn, { backgroundColor: BrandColors.blue700 + '55', borderColor: BrandColors.blue500 }]}>
                                    <Text style={styles.downloadIcon}>⬇️</Text>
                                    <Text style={[styles.downloadText, { color: BrandColors.blue400 }]}>PDF</Text>
                                </TouchableOpacity>
                            </View>
                        </GlassCard>
                    </Animated.View>
                ))}
            </Animated.ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    summaryRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 4, marginBottom: 0, gap: 8 },
    summaryCard: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 62 },
    summaryVal: { fontSize: 15, fontWeight: '800' },
    summaryLabel: { fontSize: 10, marginTop: 1, fontWeight: '600', opacity: 0.8 },
    filterRowContainer: { height: 44, marginVertical: 4 },
    filterContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
    chip: {
        borderRadius: 25,
        borderWidth: 1.5,
        paddingHorizontal: 18,
        paddingVertical: 5,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '700',
    },
    scroll: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40 },
    listScroll: { flex: 1 },
    invoiceCard: { marginBottom: 12, padding: 14 },
    invTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    invId: { fontSize: 12, fontWeight: '700' },
    invDate: { fontSize: 11, marginTop: 2 },
    statusBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
    statusText: { fontSize: 11, fontWeight: '700' },
    divider: { height: 1, marginBottom: 10 },
    invBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    invAmount: { fontSize: 20, fontWeight: '800' },
    invItems: { fontSize: 11, marginTop: 2 },
    downloadBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, gap: 4 },
    downloadIcon: { fontSize: 14 },
    downloadText: { fontSize: 12, fontWeight: '700' },
    cardInternal: { alignItems: 'center', justifyContent: 'center', width: '100%' },
});

export default InvoiceDetailScreen;
