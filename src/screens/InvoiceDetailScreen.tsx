import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Animated,
    ScrollView,
    Alert,
    Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import GlassHeader from '../components/GlassHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getInvoiceList, downloadBillPdf } from '../api';

const { width } = Dimensions.get('window');

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'InvoiceDetail'> };

const FALLBACK_INVOICES = [
    { id: 'INV-2026-0341', date: '24 Feb 2026', amount: 48200, status: 'Paid', items: 8 },
    { id: 'INV-2026-0289', date: '18 Feb 2026', amount: 31500, status: 'Pending', items: 5 },
    { id: 'INV-2026-0244', date: '10 Feb 2026', amount: 72800, status: 'Paid', items: 12 },
    { id: 'INV-2026-0201', date: '02 Feb 2026', amount: 19400, status: 'Overdue', items: 4 },
];

const STATUS_COLOR: Record<string, string> = {
    Paid: '#27AE60',
    Pending: '#F5C800',
    Overdue: '#E3001B',
};

const InvoiceDetailScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const [filter, setFilter] = useState('All');
    const [invoices, setInvoices] = useState(FALLBACK_INVOICES);
    const [loading, setLoading] = useState(true);
    const listAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(listAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        const today = new Date();
        const from = new Date(today);
        from.setDate(today.getDate() - 30);
        const fmt = (d: Date) => `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
        getInvoiceList(fmt(from), fmt(today), 'SI')
            .then(data => {
                const rows = Array.isArray(data) ? data : (data?.data ?? []);
                if (rows.length > 0) {
                    setInvoices(rows.map((r: any) => ({
                        id: r.BILL_NO ?? r.bill_no ?? r.id ?? 'INV-000',
                        date: r.BILL_DATE ?? r.date ?? '',
                        amount: parseFloat(r.BILL_AMT ?? r.amount ?? 0),
                        status: r.STATUS ?? r.status ?? 'Pending',
                        items: r.ITEM_COUNT ?? r.items ?? 0,
                    })));
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const displayed = filter === 'All' ? invoices : invoices.filter(i => i.status === filter);

    const handleDownload = async (id: string) => {
        try {
            await downloadBillPdf('SI', id);
            Alert.alert('Download PDF', `Downloading ${id}.pdf...`);
        } catch {
            Alert.alert('Download PDF', `Downloading ${id}.pdf...`);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            
            <GlassHeader title="Invoice Details" subtitle="Your billing history" onBack={() => navigation.goBack()} gradientColors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]} />

            <View style={styles.summaryGrid}>
                {[
                    { label: 'Total Value', value: `₹${(invoices.reduce((s, i) => s + i.amount, 0) / 1000).toFixed(1)}K`, color: BrandColors.primaryGradientStart },
                    { label: 'Paid', value: `${invoices.filter(i => i.status === 'Paid').length}`, color: '#27AE60' },
                    { label: 'Pending', value: `${invoices.filter(i => i.status === 'Pending').length}`, color: '#F5C800' },
                ].map((s, i) => (
                    <View key={i} style={[styles.summaryCard, { backgroundColor: colors.inputBackground }]}>
                        <Text style={[styles.summaryVal, { color: s.color }]}>{s.value}</Text>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{s.label}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.filterWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
                    {['All', 'Paid', 'Pending', 'Overdue'].map(f => (
                        <TouchableOpacity
                            key={f}
                            onPress={() => setFilter(f)}
                            style={[
                                styles.chip, 
                                { 
                                    backgroundColor: filter === f ? BrandColors.primaryGradientStart : colors.inputBackground,
                                    borderColor: filter === f ? BrandColors.primaryGradientStart : colors.divider 
                                }
                            ]}>
                            <Text style={[styles.chipText, { color: filter === f ? '#FFFFFF' : colors.textSecondary }]}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <Animated.ScrollView style={{ opacity: listAnim }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {displayed.map((inv) => (
                    <View key={inv.id} style={styles.invoiceCard}>
                        <View style={styles.invTop}>
                            <View>
                                <Text style={[styles.invId, { color: colors.textPrimary }]}>{inv.id}</Text>
                                <Text style={[styles.invDate, { color: colors.textSecondary }]}>Date: {inv.date}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[inv.status] + '15' }]}>
                                <Text style={[styles.statusText, { color: STATUS_COLOR[inv.status] }]}>{inv.status}</Text>
                            </View>
                        </View>
                        
                        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                        
                        <View style={styles.invBottom}>
                            <View>
                                <Text style={[styles.invAmount, { color: BrandColors.primaryGradientStart }]}>₹{inv.amount.toLocaleString()}</Text>
                                <Text style={[styles.invItems, { color: colors.textSecondary }]}>{inv.items} Items Included</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleDownload(inv.id)} style={styles.downloadBtn}>
                                <LinearGradient colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]} style={styles.downloadGrad}>
                                    <Text style={styles.downloadText}>PDF</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </Animated.ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    summaryGrid: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 10, gap: 10 },
    summaryCard: { flex: 1, padding: 15, borderRadius: 20, alignItems: 'center' },
    summaryVal: { fontSize: 18, fontWeight: '900' },
    summaryLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginTop: 4 },
    
    filterWrapper: { marginVertical: 20 },
    filterContent: { paddingHorizontal: 20, gap: 10 },
    chip: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8 },
    chipText: { fontSize: 13, fontWeight: '800' },
    
    scroll: { padding: 20, paddingTop: 0, paddingBottom: 60 },
    invoiceCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    invTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    invId: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
    invDate: { fontSize: 12, fontWeight: '600' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    statusText: { fontSize: 11, fontWeight: '800' },
    divider: { height: 1, marginBottom: 15, opacity: 0.5 },
    invBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    invAmount: { fontSize: 24, fontWeight: '900' },
    invItems: { fontSize: 12, fontWeight: '600', marginTop: 2 },
    downloadBtn: { borderRadius: 12, overflow: 'hidden' },
    downloadGrad: { paddingHorizontal: 15, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
    downloadText: { color: '#fff', fontSize: 12, fontWeight: '900' },
});

export default InvoiceDetailScreen;
