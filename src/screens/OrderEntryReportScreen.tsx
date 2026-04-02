import React, { useState } from 'react';
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
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getOrderList } from '../api';
import { useSession } from '../context/SessionContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { formatForApi, validateDateRange } from '../utils/dateHelpers';
import ReportDatePicker from '../components/ReportDatePicker';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'OrderEntryReport'> };

const OrderEntryReportScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const { session } = useSession();

    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);

    const handleSearch = async () => {
        const { fromError, toError } = validateDateRange(fromDate, toDate);
        if (fromError || toError) { Alert.alert('Invalid Date', fromError || toError); return; }

        setLoading(true);
        try {
            const apiFrom = formatForApi(fromDate);
            const apiTo = formatForApi(toDate);
            const results = await getOrderList(apiFrom, apiTo, session?.custId, session?.branchId);
            setOrders(results || []);
            if (!results?.length) Alert.alert('No Data', 'No orders found.');
        } catch {
            Alert.alert('Error', 'Failed to fetch order report.');
        } finally {
            setLoading(false);
        }
    };

    const totalAmount = orders.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);

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
                <View style={styles.filterCard}>
                    <View style={styles.filterInputs}>
                        <ReportDatePicker 
                            label="FROM" 
                            value={fromDate} 
                            onSelect={setFromDate} 
                        />
                        <ReportDatePicker 
                            label="TO" 
                            value={toDate} 
                            onSelect={setToDate} 
                        />
                        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Icon name="search" size={18} color="#fff" />}
                        </TouchableOpacity>
                    </View>
                </View>

                {orders.length > 0 && (
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.headText, { flex: 2 }]}>ORDER NO</Text>
                            <Text style={[styles.headText, { flex: 2 }]}>DATE</Text>
                            <Text style={[styles.headText, { flex: 1.5, textAlign: 'center' }]}>STATUS</Text>
                            <Text style={[styles.headText, { flex: 2, textAlign: 'right' }]}>AMOUNT</Text>
                        </View>
                        {orders.map((order, idx) => (
                            <View key={idx} style={styles.row}>
                                <View style={{ flex: 2 }}>
                                    <Text style={styles.rowTextMain} numberOfLines={1}>{order.id}</Text>
                                    <Text style={styles.branchTag}>BR-{order.branchId || '01'}</Text>
                                </View>
                                <Text style={[styles.rowTextSub, { flex: 2 }]}>{order.date}</Text>
                                <View style={{ flex: 1.5, alignItems: 'center' }}>
                                    <View style={[styles.statusChip, { backgroundColor: order.status === 'Delivered' ? '#E1F9F1' : '#FFF4E6' }]}>
                                        <Text style={[styles.statusText, { color: order.status === 'Delivered' ? '#00B894' : '#FF8C00' }]}>{order.status || 'Pending'}</Text>
                                    </View>
                                </View>
                                <Text style={styles.amountText}>₹{(parseFloat(order.amount) || 0).toLocaleString()}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            {orders.length > 0 && (
                <View style={styles.footerSummary}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>TOTAL ORDERS</Text>
                        <Text style={styles.summaryValue}>{orders.length}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryLabel, { textAlign: 'right' }]}>TOTAL VALUE</Text>
                        <Text style={[styles.summaryValue, { color: '#3861FB', textAlign: 'right' }]}>₹{totalAmount.toLocaleString()}</Text>
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
    helpBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2 },

    scroll: { padding: 25, paddingBottom: 150 },
    filterCard: { backgroundColor: '#fff', borderRadius: 25, padding: 15, marginBottom: 25, elevation: 3 },
    filterInputs: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
    inputBox: { flex: 1 },
    label: { fontSize: 9, fontWeight: '900', color: '#A0AEC0', marginBottom: 4 },
    input: { backgroundColor: '#F8F9FD', borderRadius: 10, paddingHorizontal: 10, height: 40, fontSize: 12, fontWeight: '700', color: '#1A1A1A', borderWidth: 1, borderColor: '#EDF2F7' },
    searchBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#3861FB', alignItems: 'center', justifyContent: 'center', elevation: 5 },

    table: { backgroundColor: '#fff', borderRadius: 28, overflow: 'hidden', elevation: 5, shadowColor: '#3861FB', shadowOpacity: 0.05, shadowRadius: 15 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#F0F4FF', paddingVertical: 12, paddingHorizontal: 20 },
    headText: { fontSize: 10, fontWeight: '900', color: '#3861FB', letterSpacing: 0.5 },

    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F7FAFC', paddingHorizontal: 15 },
    rowTextMain: { fontSize: 13, fontWeight: '900', color: '#1A1A1A' },
    branchTag: { fontSize: 9, fontWeight: '700', color: '#CBD5E0', marginTop: 2 },
    rowTextSub: { fontSize: 11, fontWeight: '700', color: '#718096' },
    statusChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
    amountText: { flex: 2, fontSize: 13, fontWeight: '900', color: '#3861FB', textAlign: 'right' },

    footerSummary: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 25, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between' },
    summaryItem: { flex: 1 },
    summaryLabel: { fontSize: 10, fontWeight: '800', color: '#A0AEC0', letterSpacing: 1, marginBottom: 5 },
    summaryValue: { fontSize: 20, fontWeight: '900', color: '#1A1A1A' },
});

export default OrderEntryReportScreen;
