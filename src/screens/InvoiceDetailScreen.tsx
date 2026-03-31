import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    ScrollView,
    Alert,
    Dimensions,
    TextInput,
    ActivityIndicator,
    Linking,
    Modal,
    Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getInvoiceList, downloadBillPdf } from '../api';
import { useSession } from '../context/SessionContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { autoFormatDate, formatForApi, validateDateRange } from '../utils/dateHelpers';

const { width } = Dimensions.get('window');

let WebView: any = null;
try { WebView = require('react-native-webview').WebView; } catch { WebView = null; }

let ReactNativeBlobUtil: any = null;
try { ReactNativeBlobUtil = require('react-native-blob-util').default; } catch { ReactNativeBlobUtil = null; }

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'InvoiceDetail'> };

const InvoiceDetailScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const { session } = useSession();

    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');

    const handleSearch = async () => {
        const { fromError, toError } = validateDateRange(fromDate, toDate);
        if (fromError || toError) { Alert.alert('Invalid Date', fromError || toError); return; }

        setLoading(true);
        try {
            const apiFrom = formatForApi(fromDate);
            const apiTo = formatForApi(toDate);
            const results = await getInvoiceList(apiFrom, apiTo, 'SI', session?.branchId, session?.custId);
            if (results && results.length > 0) {
                setInvoices(results.map((r: any) => ({
                    id: (r.ID > 0) ? String(r.ID) : (r.BILL_ID > 0 ? String(r.BILL_ID) : (r.BILL_NO || '-')),
                    billNo: r.BILL_NO || '-',
                    date: r.BILL_DATE_STR || (r.BILL_DATE ? r.BILL_DATE.split('T')[0] : '-'),
                    amount: parseFloat(r.NET_AMT || r.NET_AMOUNT || '0'),
                    branch: r.BRANCH_ID || '-',
                })));
                setSelectedIds([]);
            } else {
                setInvoices([]);
                Alert.alert('No Results', 'No invoices found for this range.');
            }
        } catch {
            Alert.alert('Error', 'Failed to search invoices.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPdf = async (billIds: string) => {
        setPdfLoading(true);
        try {
            const apiRes = await downloadBillPdf('SI', billIds, session?.branchId);
            if (apiRes?.success && apiRes?.url) {
                setPdfUrl(apiRes.url);
                setViewerVisible(true);
            } else {
                Alert.alert('Error', apiRes?.message || 'Could not fetch PDF.');
            }
        } catch {
            Alert.alert('Error', 'PDF download failed.');
        } finally {
            setPdfLoading(false);
        }
    };

    const handleDownload = () => {
        if (!pdfUrl) return;
        Linking.openURL(pdfUrl);
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={20} color="#3861FB" />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={styles.headerTitle}>Invoice Details</Text>
                    <Text style={styles.headerSub}>Manage your billings</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.filterCard}>
                    <View style={styles.filterInputs}>
                        <View style={styles.inputBox}>
                            <Text style={styles.label}>FROM</Text>
                            <TextInput 
                                style={styles.input} 
                                value={fromDate} 
                                onChangeText={t => setFromDate(autoFormatDate(t, fromDate))}
                                placeholder="DD-MM-YYYY" 
                                keyboardType="numeric"
                                maxLength={10}
                            />
                        </View>
                        <View style={styles.inputBox}>
                            <Text style={styles.label}>TO</Text>
                            <TextInput 
                                style={styles.input} 
                                value={toDate} 
                                onChangeText={t => setToDate(autoFormatDate(t, toDate))}
                                placeholder="DD-MM-YYYY" 
                                keyboardType="numeric"
                                maxLength={10}
                            />
                        </View>
                        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Icon name="search" size={26} color="#fff" />}
                        </TouchableOpacity>
                    </View>
                </View>

                {invoices.length > 0 && (
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.headText, { flex: 2 }]}>INV NO</Text>
                            <Text style={[styles.headText, { flex: 2 }]}>DATE</Text>
                            <Text style={[styles.headText, { flex: 1 }]}>BR</Text>
                            <Text style={[styles.headText, { flex: 2, textAlign: 'right' }]}>AMOUNT</Text>
                        </View>
                        {invoices.map((inv, idx) => (
                            <TouchableOpacity 
                                key={idx} 
                                style={[styles.row, selectedIds.includes(inv.id) && styles.rowActive]}
                                onPress={() => toggleSelection(inv.id)}
                            >
                                <View style={styles.checkIcon}>
                                    <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selectedIds.includes(inv.id) ? "#3861FB" : "#E2E8F0", backgroundColor: selectedIds.includes(inv.id) ? "#3861FB" : "transparent", alignItems: 'center', justifyContent: 'center' }} />
                                </View>
                                <Text style={styles.rowTextMain} numberOfLines={1}>{inv.billNo}</Text>
                                <Text style={styles.rowTextSub}>{inv.date}</Text>
                                <Text style={styles.rowTextSub}>{inv.branch}</Text>
                                <Text style={styles.amountText}>₹{(inv.amount || 0).toLocaleString()}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            {selectedIds.length > 0 && (
                <TouchableOpacity style={styles.fab} onPress={() => fetchPdf(selectedIds.join(','))}>
                    <LinearGradient colors={['#3861FB', '#2752E7']} style={styles.fabGrad}>
                        {pdfLoading ? <ActivityIndicator color="#fff" /> : null}
                        <Text style={styles.fabText}>GET PDF ({selectedIds.length})</Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}

            <Modal visible={viewerVisible} animationType="slide" onRequestClose={() => setViewerVisible(false)}>
                <View style={styles.modalBg}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setViewerVisible(false)}><Icon name="close" size={26} color="#1A1A1A" /></TouchableOpacity>
                        <Text style={styles.modalTitle}>Invoice Preview</Text>
                        <TouchableOpacity onPress={handleDownload}><Icon name="cloud-download" size={26} color="#3861FB" /></TouchableOpacity>
                    </View>
                    {WebView && (
                        <WebView
                            source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}` }}
                            style={{ flex: 1 }}
                        />
                    )}
                </View>
            </Modal>
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

    scroll: { padding: 25, paddingBottom: 100 },
    filterCard: { backgroundColor: '#fff', borderRadius: 25, padding: 15, marginBottom: 25, elevation: 3 },
    filterInputs: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    inputBox: { flex: 1 },
    label: { fontSize: 9, fontWeight: '900', color: '#A0AEC0', marginBottom: 4 },
    input: { backgroundColor: '#F8F9FD', borderRadius: 10, paddingHorizontal: 10, height: 40, fontSize: 12, fontWeight: '700', color: '#1A1A1A', borderWidth: 1, borderColor: '#EDF2F7' },
    searchBtn: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#3861FB', alignItems: 'center', justifyContent: 'center', elevation: 5 },

    table: { backgroundColor: '#fff', borderRadius: 28, overflow: 'hidden', elevation: 5, shadowColor: '#3861FB', shadowOpacity: 0.05, shadowRadius: 15 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#F0F4FF', paddingVertical: 12, paddingHorizontal: 20 },
    headText: { fontSize: 10, fontWeight: '900', color: '#3861FB', letterSpacing: 0.5 },

    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F7FAFC', paddingHorizontal: 15 },
    rowActive: { backgroundColor: '#F0F4FF' },
    checkIcon: { marginRight: 10 },
    rowTextMain: { flex: 2, fontSize: 13, fontWeight: '900', color: '#1A1A1A' },
    rowTextSub: { flex: 2, fontSize: 11, fontWeight: '700', color: '#718096' },
    amountText: { flex: 2, fontSize: 13, fontWeight: '900', color: '#3861FB', textAlign: 'right' },

    fab: { position: 'absolute', bottom: 30, left: 25, right: 25, shadowColor: '#3861FB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 },
    fabGrad: { height: 64, borderRadius: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    fabText: { color: '#fff', fontSize: 14, fontWeight: '900', marginLeft: 12, letterSpacing: 0.5 },

    modalBg: { flex: 1, backgroundColor: '#fff' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalTitle: { fontSize: 17, fontWeight: '900', color: '#1A1A1A' },
});

export default InvoiceDetailScreen;
