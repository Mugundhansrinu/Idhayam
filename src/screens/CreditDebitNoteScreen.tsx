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
    Linking,
    Modal,
    Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getCreditDebitNotes, downloadBillPdf } from '../api';
import { useSession } from '../context/SessionContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { formatForApi, validateDateRange, getCurrentDateDDMMYYYY } from '../utils/dateHelpers';
import ReportDatePicker from '../components/ReportDatePicker';

let WebView: any = null;
try { WebView = require('react-native-webview').WebView; } catch { WebView = null; }

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'CreditDebitNote'> };

const CreditDebitNoteScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const { session } = useSession();

    const [fromDate, setFromDate] = useState(getCurrentDateDDMMYYYY());
    const [toDate, setToDate] = useState(getCurrentDateDDMMYYYY());
    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [notes, setNotes] = useState<any[]>([]);
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
            const results = await getCreditDebitNotes(apiFrom, apiTo, session?.branchId, session?.custId);
            setNotes(results || []);
            setSelectedIds([]);
            if (!results?.length) Alert.alert('No Records', 'No credit/debit notes found.');
        } catch {
            Alert.alert('Error', 'Failed to fetch notes.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (billId: string) => {
        setSelectedIds(prev => prev.includes(billId) ? prev.filter(i => i !== billId) : [...prev, billId]);
    };

    const fetchPdf = async (billIds: string) => {
        setPdfLoading(true);
        try {
            const apiRes = await downloadBillPdf('CNDN', billIds, session?.branchId);
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

    // Fix: Separate CN and DN correctly — avoid 'CNDN' fallback matching both
    const totalCredit = notes.filter(n => {
        const t = String(n.type).toUpperCase();
        return t === 'CN' || t.startsWith('CN') && !t.startsWith('CND');
    }).reduce((s, n) => s + (parseFloat(n.amount) || 0), 0);

    const totalDebit = notes.filter(n => {
        const t = String(n.type).toUpperCase();
        return t === 'DN' || t.startsWith('DN');
    }).reduce((s, n) => s + (parseFloat(n.amount) || 0), 0);

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={20} color="#3861FB" />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={styles.headerTitle}>CN / DN Report</Text>
                    <Text style={styles.headerSub}>Credit &amp; Debit note list</Text>
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

                {notes.length > 0 && (
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.headText, { width: 24, marginRight: 8 }]}> </Text>
                            <Text style={[styles.headText, { flex: 2 }]}>NOTE NO</Text>
                            <Text style={[styles.headText, { flex: 2 }]}>DATE</Text>
                            <Text style={[styles.headText, { flex: 1.2, textAlign: 'center' }]}>TYPE</Text>
                            <Text style={[styles.headText, { flex: 2, textAlign: 'right' }]}>AMOUNT</Text>
                        </View>
                        {notes.map((note, idx) => {
                            const isCN = String(note.type).toUpperCase() === 'CN' || (String(note.type).toUpperCase().startsWith('CN') && !String(note.type).toUpperCase().startsWith('CND'));
                            const color = isCN ? '#00B894' : '#FF8C00';
                            const isSelected = selectedIds.includes(note.billId);
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={[styles.row, isSelected && styles.rowActive]}
                                    onPress={() => toggleSelection(note.billId)}
                                >
                                    {/* Checkbox */}
                                    <View style={styles.checkIcon}>
                                        <View style={{
                                            width: 22, height: 22, borderRadius: 11,
                                            borderWidth: 2,
                                            borderColor: isSelected ? '#3861FB' : '#E2E8F0',
                                            backgroundColor: isSelected ? '#3861FB' : 'transparent',
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {isSelected && <Icon name="check" size={13} color="#fff" />}
                                        </View>
                                    </View>

                                    <View style={{ flex: 2 }}>
                                        <Text style={styles.rowTextMain} numberOfLines={1}>{note.id}</Text>
                                        <Text style={styles.custTag}>{note.custName || 'General Account'}</Text>
                                    </View>
                                    <Text style={[styles.rowTextSub, { flex: 2 }]}>{note.date}</Text>
                                    <View style={{ flex: 1.2, alignItems: 'center' }}>
                                        <View style={[styles.typeChip, { backgroundColor: isCN ? '#E1F9F1' : '#FFF4E6' }]}>
                                            <Text style={[styles.typeText, { color }]}>{note.type}</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.amountText, { color }]}>₹{(parseFloat(note.amount) || 0).toLocaleString()}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* Floating GET PDF Button — visible only when items selected */}
            {selectedIds.length > 0 && (
                <TouchableOpacity style={styles.fab} onPress={() => fetchPdf(selectedIds.join(','))}>
                    <LinearGradient colors={['#3861FB', '#2752E7']} style={styles.fabGrad}>
                        {pdfLoading ? <ActivityIndicator color="#fff" /> : null}
                        <Text style={styles.fabText}>GET PDF ({selectedIds.length})</Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {/* PDF Preview Modal */}
            <Modal visible={viewerVisible} animationType="slide" onRequestClose={() => setViewerVisible(false)}>
                <View style={styles.modalBg}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setViewerVisible(false)}>
                            <Icon name="close" size={26} color="#1A1A1A" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>CN / DN Preview</Text>
                        <TouchableOpacity onPress={handleDownload}>
                            <Icon name="cloud-download" size={26} color="#3861FB" />
                        </TouchableOpacity>
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

    scroll: { padding: 25, paddingBottom: 120 },
    filterCard: { backgroundColor: '#fff', borderRadius: 25, padding: 15, marginBottom: 20, elevation: 3 },
    filterInputs: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
    searchBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#3861FB', alignItems: 'center', justifyContent: 'center', elevation: 5 },

    summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    sumCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 15, borderLeftWidth: 4, elevation: 2 },
    sumLabel: { fontSize: 9, fontWeight: '900', color: '#A0AEC0', letterSpacing: 0.5, marginBottom: 5 },
    sumValue: { fontSize: 17, fontWeight: '900' },

    table: { backgroundColor: '#fff', borderRadius: 28, overflow: 'hidden', elevation: 5, shadowColor: '#3861FB', shadowOpacity: 0.05, shadowRadius: 15 },
    tableHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4FF', paddingVertical: 12, paddingHorizontal: 15 },
    headText: { fontSize: 10, fontWeight: '900', color: '#3861FB', letterSpacing: 0.5 },

    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F7FAFC', paddingHorizontal: 15 },
    rowActive: { backgroundColor: '#F0F4FF' },
    checkIcon: { marginRight: 10 },
    rowTextMain: { fontSize: 13, fontWeight: '900', color: '#1A1A1A' },
    custTag: { fontSize: 8, fontWeight: '700', color: '#CBD5E0', marginTop: 2, width: 80 },
    rowTextSub: { fontSize: 11, fontWeight: '700', color: '#718096' },
    billIdText: { fontSize: 11, fontWeight: '800', color: '#3861FB' },
    typeChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    typeText: { fontSize: 9, fontWeight: '900' },
    amountText: { flex: 2, fontSize: 13, fontWeight: '900', textAlign: 'right' },

    fab: { position: 'absolute', bottom: 30, left: 25, right: 25, shadowColor: '#3861FB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 },
    fabGrad: { height: 64, borderRadius: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    fabText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },

    modalBg: { flex: 1, backgroundColor: '#fff' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalTitle: { fontSize: 17, fontWeight: '900', color: '#1A1A1A' },

    inputBox: { flex: 1 },
    label: { fontSize: 9, fontWeight: '900', color: '#A0AEC0', marginBottom: 4 },
    input: { backgroundColor: '#F8F9FD', borderRadius: 10, paddingHorizontal: 10, height: 40, fontSize: 12, fontWeight: '700', color: '#1A1A1A', borderWidth: 1, borderColor: '#EDF2F7' },
    helpBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2 },
    upgradeCard: { backgroundColor: '#F0F4FF', borderRadius: 24, padding: 25, marginTop: 10, alignItems: 'center' },
    upgradeTitle: { fontSize: 15, fontWeight: '900', color: '#3861FB', marginTop: 10 },
    upgradeSub: { fontSize: 12, color: '#718096', fontWeight: '600', textAlign: 'center', marginTop: 4, lineHeight: 18 },
});

export default CreditDebitNoteScreen;
