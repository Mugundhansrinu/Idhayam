import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getOrderList } from '../api';
import { useSession } from '../context/SessionContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { formatForApi, validateDateRange, getCurrentDateDDMMYYYY } from '../utils/dateHelpers';
import ReportDatePicker from '../components/ReportDatePicker';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'OrderEntryReport'> };

const formatAmount = (value: number): string => {
    const fixed = value.toFixed(2);
    const [intPart, decPart] = fixed.split('.');
    const lastThree = intPart.slice(-3);
    const remaining = intPart.slice(0, -3);
    const formatted = remaining !== ''
        ? remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
        : lastThree;
    return `${formatted}.${decPart}`;
};

const OrderEntryReportScreen: React.FC<Props> = ({ navigation }) => {
    const { session } = useSession();

    const [fromDate, setFromDate] = useState(getCurrentDateDDMMYYYY());
    const [toDate, setToDate] = useState(getCurrentDateDDMMYYYY());
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async () => {
        const { fromError, toError } = validateDateRange(fromDate, toDate);
        if (fromError || toError) { Alert.alert('Invalid Date', fromError || toError); return; }

        setHasSearched(true);
        setLoading(true);
        try {
            const apiFrom = formatForApi(fromDate);
            const apiTo = formatForApi(toDate);
            const results = await getOrderList(apiFrom, apiTo, session?.custId, session?.branchId);
            setOrders(results || []);
            // Auto-expand first order
            if (results?.length > 0) {
                setExpandedOrders(new Set([results[0].id]));
            }
        } catch {
            Alert.alert('Error', 'Failed to fetch order report.');
        } finally {
            setLoading(false);
        }
    };

    // Group items by SO_ID
    const groupedOrders = useMemo(() => {
        const map = new Map<string, any[]>();
        orders.forEach(o => {
            const key = String(o.raw?.SO_ID || o.id); // Explicitly use SO_ID from raw data
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(o);
            //Alert.alert(key);
        });
        return Array.from(map.entries()).map(([soId, items]) => {
            // Sum TOTAL_AMOUNT per item for the order total
            const totalAmt = items.reduce((s: number, o: any) => s + (parseFloat(o.amount) || 0), 0);
            return {
                orderId: soId,         // SO_ID as the group key
                orderNo: items[0].orderNo, // ORDER_NO for display
                date: items[0].date,
                amount: totalAmt,
                status: items[0].status,
                items,
            };
        });
    }, [orders]);

    const totalAmount = groupedOrders.reduce((s, g) => s + (g.amount || 0), 0);

    const toggleOrder = (orderId: string) => {
        setExpandedOrders(prev => {
            const next = new Set(prev);
            if (next.has(orderId)) next.delete(orderId);
            else next.add(orderId);
            return next;
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={20} color="#3861FB" />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={styles.headerTitle}>Order Report</Text>
                    <Text style={styles.headerSub}>History of placed orders</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                {/* Filter Card */}
                <View style={styles.filterCard}>
                    <View style={styles.filterInputs}>
                        <ReportDatePicker label="FROM" value={fromDate} onSelect={setFromDate} />
                        <ReportDatePicker label="TO" value={toDate} onSelect={setToDate} />
                        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Icon name="search" size={18} color="#fff" />}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Empty state — only after user has searched */}
                {hasSearched && !loading && groupedOrders.length === 0 && (
                    <View style={styles.emptyState}>
                        <Icon name="inbox" size={48} color="#E2E8F0" />
                        <Text style={styles.emptyText}>No orders found for this range.</Text>
                    </View>
                )}

                {/* Table */}
                {groupedOrders.length > 0 && (
                    <View style={styles.tableWrap}>

                        {/* Column Headers */}
                        <View style={styles.tableHeader}>
                            <Text style={[styles.headText, { flex: 1.8 }]}>ITEM</Text>
                            <Text style={[styles.headText, { flex: 1 }]}>PER{'\n'}BOX</Text>
                            <Text style={[styles.headText, { flex: 1.1 }]}>PRICE</Text>
                            <Text style={[styles.headText, { flex: 1 }]}>ORD{'\n'}BOX</Text>
                            <Text style={[styles.headText, { flex: 1 }]}>ORD{'\n'}PCS</Text>
                            <Text style={[styles.headText, { flex: 1 }]}>CNF{'\n'}BOX</Text>
                            <Text style={[styles.headText, { flex: 1 }]}>CNF{'\n'}PCS</Text>
                        </View>

                        {/* Order Groups */}
                        {groupedOrders.map((group, gIdx) => {
                            const isExpanded = expandedOrders.has(group.orderId);
                            return (
                                <View key={gIdx}>
                                    {/* Order Header Row */}
                                    <TouchableOpacity
                                        style={styles.orderHeader}
                                        onPress={() => toggleOrder(group.orderId)}
                                        activeOpacity={0.8}
                                    >
                                        <Icon
                                            name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                                            size={18}
                                            color="#3861FB"
                                        />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.orderHeaderText} numberOfLines={1}>
                                                {group.orderNo} - {group.items[0]?.group || ''}
                                            </Text>
                                            <Text style={{ fontSize: 13, color: '#475569', fontWeight: '700', marginTop: 3 }}>
                                                {group.date}  •  <Text style={{ color: '#059669', fontWeight: '900' }}>₹ {formatAmount(group.amount || 0)}</Text>
                                            </Text>
                                        </View>
                                        <View style={[styles.statusChip, {
                                            backgroundColor: group.status?.toUpperCase().includes('INVOICED') ? '#E1F9F1'
                                                : group.status?.toUpperCase().includes('CANCEL') ? '#FEE2E2' : '#FFF4E6'
                                        }]}>
                                            <Text style={[styles.statusText, {
                                                color: group.status?.toUpperCase().includes('INVOICED') ? '#059669'
                                                    : group.status?.toUpperCase().includes('CANCEL') ? '#DC2626' : '#FF8C00'
                                            }]}>
                                                {group.status || 'PENDING'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>

                                    {/* Item Rows */}
                                    {isExpanded && group.items.map((item: any, iIdx: number) => (
                                        <View
                                            key={iIdx}
                                            style={[styles.itemRow, iIdx % 2 === 0 && styles.itemRowAlt]}
                                        >
                                            <Text style={[styles.cellText, { flex: 1.8, textAlign: 'left' }]} numberOfLines={2}>
                                                {item.itemName || '—'}
                                            </Text>
                                            <Text style={[styles.cellText, { flex: 1 }]}>
                                                {item.perBox || '—'}
                                            </Text>
                                            <Text style={[styles.cellText, { flex: 1.4, color: '#059669', fontWeight: '800' }]}>
                                                {parseFloat(item.price || 0).toFixed(2)}
                                            </Text>
                                            <Text style={[styles.cellText, { flex: 1 }]}>
                                                {item.ordBox}
                                            </Text>
                                            <Text style={[styles.cellText, { flex: 1 }]}>
                                                {item.ordPcs}
                                            </Text>
                                            <Text style={[styles.cellText, { flex: 1, color: '#1A1A1A', fontWeight: '800' }]}>
                                                {item.cnfBox}
                                            </Text>
                                            <Text style={[styles.cellText, { flex: 1, color: '#1A1A1A', fontWeight: '800' }]}>
                                                {item.cnfPcs}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            );
                        })}

                        <Text style={styles.disclaimer}>*** Amount Changes applicable ***</Text>
                    </View>
                )}
            </ScrollView>

            {/* Footer Summary */}
            {groupedOrders.length > 0 && (
                <View style={styles.footerSummary}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>TOTAL ORDERS</Text>
                        <Text style={styles.summaryValue}>{groupedOrders.length}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryLabel, { textAlign: 'right' }]}>TOTAL VALUE</Text>
                        <Text style={[styles.summaryValue, { color: '#3861FB', textAlign: 'right' }]}>₹{formatAmount(totalAmount)}</Text>
                    </View>
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

    scroll: { padding: 20, paddingBottom: 150 },
    filterCard: { backgroundColor: '#fff', borderRadius: 25, padding: 15, marginBottom: 20, elevation: 3 },
    filterInputs: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
    searchBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#3861FB', alignItems: 'center', justifyContent: 'center', elevation: 5 },

    tableWrap: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', elevation: 4 },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText: { color: '#A0AEC0', marginTop: 12, fontWeight: '600', fontSize: 14 },

    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#3861FB',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    headText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '900',
        color: '#fff',
        textAlign: 'center',
        letterSpacing: 0.3,
    },

    orderHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderTopWidth: 1,
        borderTopColor: '#E0E7FF',
        gap: 6,
    },
    orderHeaderText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    statusChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },

    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    itemRowAlt: { backgroundColor: '#FAFBFF' },
    cellText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#4A5568',
        textAlign: 'center',
    },

    disclaimer: {
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '700',
        color: '#E3001B',
        padding: 12,
        backgroundColor: '#FFF5F5',
    },

    footerSummary: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff', padding: 20, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: '#F1F5F9',
        flexDirection: 'row', justifyContent: 'space-between',
        elevation: 10,
    },
    summaryItem: { flex: 1 },
    summaryLabel: { fontSize: 10, fontWeight: '800', color: '#A0AEC0', letterSpacing: 1, marginBottom: 4 },
    summaryValue: { fontSize: 20, fontWeight: '900', color: '#1A1A1A' },
});

export default OrderEntryReportScreen;
