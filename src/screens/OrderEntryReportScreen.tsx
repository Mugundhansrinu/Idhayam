import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    ScrollView,
    Alert,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import GlassHeader from '../components/GlassHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getOrderList } from '../api';
import { useSession } from '../context/SessionContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { autoFormatDate, formatForApi, validateDateRange } from '../utils/dateHelpers';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'OrderEntryReport'> };


// ─── Component ───────────────────────────────────────────
const OrderEntryReportScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const { session } = useSession();

    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [fromError, setFromError] = useState('');
    const [toError, setToError] = useState('');
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);

    const handleFromDateChange = (text: string) => {
        setFromDate(autoFormatDate(text, fromDate));
        if (fromError) { setFromError(''); }
    };

    const handleToDateChange = (text: string) => {
        setToDate(autoFormatDate(text, toDate));
        if (toError) { setToError(''); }
    };

    const validate = () => {
        const { fromError: fe, toError: te } = validateDateRange(fromDate, toDate);
        setFromError(fe);
        setToError(te);
        return !fe && !te;
    };

    const handleSearch = async () => {
        if (!validate()) { return; }
        setLoading(true);
        try {
            const apiFrom = formatForApi(fromDate);
            const apiTo = formatForApi(toDate);
            const results = await getOrderList(
                apiFrom, apiTo,
                session?.custId || undefined,
                session?.branchId || undefined,
            );
            console.log('Order Results[0]:', JSON.stringify(results?.[0]));
            setOrders(results || []);
            if (!results?.length) {
                Alert.alert('No Data', 'No orders found for this date range.');
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to fetch order report.');
        } finally {
            setLoading(false);
        }
    };

    const totalAmount = orders.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <GlassHeader
                title="Order Report"
                subtitle="History of placed orders"
                onBack={() => navigation.goBack()}
                gradientColors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
            />

            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                {/* ── Filter Card ── */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="search" size={20} color={BrandColors.primaryGradientStart} />
                        <Text style={styles.cardTitle}>Filter Orders</Text>
                    </View>

                    <View style={styles.inputRow}>
                        <View style={styles.inputCell}>
                            <Text style={styles.label}>FROM DATE</Text>
                            <View style={[styles.inputWrapper, !!fromError && styles.inputError]}>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="DD-MM-YYYY"
                                    placeholderTextColor="#A0A3BD"
                                    value={fromDate}
                                    onChangeText={handleFromDateChange}
                                    keyboardType="numeric"
                                    maxLength={10}
                                />
                                <Ionicons name="calendar-outline" size={16} color={BrandColors.primaryGradientStart} />
                            </View>
                            {!!fromError && <Text style={styles.errorText}>{fromError}</Text>}
                        </View>

                        <View style={styles.inputCell}>
                            <Text style={styles.label}>TO DATE</Text>
                            <View style={[styles.inputWrapper, !!toError && styles.inputError]}>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="DD-MM-YYYY"
                                    placeholderTextColor="#A0A3BD"
                                    value={toDate}
                                    onChangeText={handleToDateChange}
                                    keyboardType="numeric"
                                    maxLength={10}
                                />
                                <Ionicons name="calendar-outline" size={16} color={BrandColors.primaryGradientStart} />
                            </View>
                            {!!toError && <Text style={styles.errorText}>{toError}</Text>}
                        </View>
                    </View>

                    <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading} activeOpacity={0.88}>
                        <LinearGradient
                            colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.searchGrad}
                        >
                            {loading
                                ? <ActivityIndicator color="#FFF" />
                                : <Text style={styles.searchBtnText}>SEARCH ORDERS</Text>}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* ── Results ── */}
                {orders.length > 0 && (
                    <View style={styles.resultsSection}>

                        {/* Section Header */}
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconBg}>
                                <Ionicons name="receipt-outline" size={16} color="#FFF" />
                            </View>
                            <Text style={[styles.resultsTitle, { color: colors.textPrimary }]}>ORDER RECORDS</Text>
                            <View style={styles.countBadge}>
                                <Text style={styles.countBadgeText}>{orders.length}</Text>
                            </View>
                        </View>

                        {/* Column Header */}
                        <LinearGradient
                            colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.colHeaderBar}>
                            <Text style={[styles.colHeaderText, { flex: 1.6 }]}>ORDER NO</Text>
                            <Text style={[styles.colHeaderText, { flex: 1.6 }]}>DATE</Text>
                            <Text style={[styles.colHeaderText, { flex: 1, textAlign: 'center' }]}>STATUS</Text>
                            <Text style={[styles.colHeaderText, { flex: 1.5, textAlign: 'right' }]}>AMOUNT</Text>
                        </LinearGradient>

                        {/* Rows */}
                        {orders.map((order, idx) => (
                            <View
                                key={String(idx)}
                                style={[
                                    styles.orderCard,
                                    { borderLeftColor: idx % 2 === 0 ? BrandColors.primaryGradientStart : BrandColors.primaryGradientEnd },
                                ]}>
                                {/* ORDER NO */}
                                <View style={{ flex: 1.6 }}>
                                    <Text style={styles.orderNoText} numberOfLines={1}>{order.id}</Text>
                                    {!!order.branchId && (
                                        <Text style={styles.branchTag}>BR-{order.branchId}</Text>
                                    )}
                                </View>

                                {/* DATE */}
                                <View style={{ flex: 1.6 }}>
                                    <Text style={styles.dateText}>{order.date}</Text>
                                </View>

                                {/* STATUS */}
                                <View style={{ flex: 1, alignItems: 'center' }}>
                                    <View style={[
                                        styles.statusChip,
                                        { backgroundColor: order.status === 'Delivered' ? '#E8F5E9' : '#FFF3E0' },
                                    ]}>
                                        <Text style={[
                                            styles.statusChipText,
                                            { color: order.status === 'Delivered' ? '#2E7D32' : '#E65100' },
                                        ]}>
                                            {order.status || '—'}
                                        </Text>
                                    </View>
                                </View>

                                {/* AMOUNT */}
                                <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                                    <Text style={styles.amountText}>
                                        ₹{(parseFloat(order.amount) || 0).toLocaleString()}
                                    </Text>
                                </View>
                            </View>
                        ))}

                        {/* Summary Footer */}
                        <LinearGradient colors={['#F0EFFF', '#FAF9FF']} style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Total Orders: {orders.length}</Text>
                            <Text style={styles.summaryAmount}>₹{totalAmount.toLocaleString()}</Text>
                        </LinearGradient>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20, paddingBottom: 60 },
    card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    cardTitle: { fontSize: 15, fontWeight: '900', color: '#1F1F39', marginLeft: 8 },
    inputRow: { flexDirection: 'row', marginBottom: 20 },
    inputCell: { flex: 1, marginHorizontal: 4 },
    label: { fontSize: 10, fontWeight: '800', color: '#64748B', marginBottom: 6 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FD', borderWidth: 1, borderColor: '#EBEEF2', borderRadius: 12, paddingHorizontal: 10, height: 48 },
    inputError: { borderColor: '#E3001B', backgroundColor: '#FFF5F5' },
    textInput: { flex: 1, fontSize: 13, fontWeight: '700', color: '#1F1F39', padding: 0 },
    errorText: { fontSize: 10, color: '#E3001B', marginTop: 4, fontWeight: '700' },
    searchBtn: { borderRadius: 14, overflow: 'hidden' },
    searchGrad: { height: 54, alignItems: 'center', justifyContent: 'center' },
    searchBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },

    resultsSection: { marginTop: 28 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    sectionIconBg: { width: 30, height: 30, borderRadius: 10, backgroundColor: BrandColors.primaryGradientStart, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    resultsTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1, flex: 1 },
    countBadge: { backgroundColor: BrandColors.primaryGradientStart, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    countBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '900' },

    colHeaderBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, marginBottom: 8 },
    colHeaderText: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.95)', letterSpacing: 0.8 },

    orderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderLeftWidth: 4,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    orderNoText: { fontSize: 13, fontWeight: '900', color: '#1E293B' },
    branchTag: { fontSize: 9, fontWeight: '700', color: '#94A3B8', marginTop: 2 },
    dateText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
    statusChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    statusChipText: { fontSize: 9, fontWeight: '900' },
    amountText: { fontSize: 13, fontWeight: '900', color: BrandColors.primaryGradientStart },

    summaryCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 18, padding: 18, marginTop: 4, borderWidth: 1, borderColor: BrandColors.primaryGradientStart + '30' },
    summaryLabel: { fontSize: 12, fontWeight: '800', color: '#64748B' },
    summaryAmount: { fontSize: 20, fontWeight: '900', color: BrandColors.primaryGradientStart },
});

export default OrderEntryReportScreen;
