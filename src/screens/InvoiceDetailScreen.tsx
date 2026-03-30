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
import GlassHeader from '../components/GlassHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getInvoiceList, downloadBillPdf } from '../api';
import { useSession } from '../context/SessionContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { isValidDate, autoFormatDate, formatForApi, validateDateRange } from '../utils/dateHelpers';

const { width } = Dimensions.get('window');

// Lazy-load modules to avoid Render Error
let WebView: any = null;
try {
    WebView = require('react-native-webview').WebView;
} catch {
    WebView = null;
}

let ReactNativeBlobUtil: any = null;
try {
    ReactNativeBlobUtil = require('react-native-blob-util').default;
} catch {
    ReactNativeBlobUtil = null;
}

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'InvoiceDetail'> };


/**
 * Generates a complete HTML page that uses PDF.js (CDN) to render each page
 * of a base64-encoded PDF onto <canvas> elements. This is the only reliable
 * way to display PDFs inside Android WebView without react-native-pdf.
 */
const getPdfHtml = (base64: string): string => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #525659; min-height: 100vh; display: flex; flex-direction: column; align-items: center; }
    #loading { color: #fff; font-family: sans-serif; font-size: 15px; padding: 60px 20px; text-align: center; }
    .page-canvas { display: block; max-width: 100%; background: white; margin: 6px auto; box-shadow: 0 2px 8px rgba(0,0,0,0.5); }
    #error { color: #ffcccc; font-family: sans-serif; font-size: 13px; padding: 40px 20px; text-align: center; }
  </style>
</head>
<body>
  <div id="loading">Loading Invoice...</div>
  <div id="container"></div>
  <div id="error" style="display:none"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    var raw = atob('` + base64 + `');
    var bytes = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) { bytes[i] = raw.charCodeAt(i); }
    pdfjsLib.getDocument({ data: bytes }).promise.then(function(pdf) {
      document.getElementById('loading').style.display = 'none';
      var container = document.getElementById('container');
      for (var p = 1; p <= pdf.numPages; p++) {
        (function(pageNum) {
          pdf.getPage(pageNum).then(function(page) {
            var scale = (window.innerWidth - 12) / page.getViewport({ scale: 1 }).width;
            var vp = page.getViewport({ scale: scale });
            var canvas = document.createElement('canvas');
            canvas.className = 'page-canvas';
            canvas.width = vp.width;
            canvas.height = vp.height;
            container.appendChild(canvas);
            page.render({ canvasContext: canvas.getContext('2d'), viewport: vp });
          });
        })(p);
      }
    }).catch(function(err) {
      document.getElementById('loading').style.display = 'none';
      var e = document.getElementById('error');
      e.style.display = 'block';
      e.textContent = 'PDF Error: ' + err.message;
    });
  </script>
</body>
</html>`;
};

// ─── Component ────────────────────────────────────────────────────────────────

const InvoiceDetailScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const { session } = useSession();

    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [fromError, setFromError] = useState('');
    const [toError, setToError] = useState('');
    const [loading, setLoading] = useState(false);     // search loading
    const [pdfLoading, setPdfLoading] = useState(false); // fetching/preparing PDF
    const [downloading, setDownloading] = useState(false); // saving to device

    // Search Results State
    const [invoices, setInvoices] = useState<any[]>([]);

    // Viewer State
    const [viewerVisible, setViewerVisible] = useState(false);
    const [pdfBase64, setPdfBase64] = useState('');   // base64 PDF for WebView
    const [pdfUrl, setPdfUrl] = useState('');          // raw URL for download

    // Selection state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const handleFromDateChange = (text: string) => {
        setFromDate(autoFormatDate(text, fromDate));
        if (fromError) setFromError('');
    };

    const handleToDateChange = (text: string) => {
        setToDate(autoFormatDate(text, toDate));
        if (toError) setToError('');
    };

    const validate = (): boolean => {
        const { fromError: fe, toError: te } = validateDateRange(fromDate, toDate);
        setFromError(fe);
        setToError(te);
        return !fe && !te;
    };

    const handleSearch = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            const apiFrom = formatForApi(fromDate);
            const apiTo = formatForApi(toDate);
            
            console.log('Search Triggered:', { from: apiFrom, to: apiTo, branch: session?.branchId, cust: session?.custId });
            
            const results = await getInvoiceList(apiFrom, apiTo, 'SI', session?.branchId, session?.custId);
            console.log('API Result received. Length:', results?.length);

            if (results && results.length > 0) {
                const mapped = results.map((r: any) => ({
                    // Use numeric ID (> 0) for PDF API; fall back to BILL_NO for display purposes
                    id: (r.ID > 0) ? String(r.ID) : (r.BILL_ID > 0 ? String(r.BILL_ID) : (r.BILL_NO || '—')),
                    billNo: r.BILL_NO || '—',
                    date: r.BILL_DATE_STR || (r.BILL_DATE ? r.BILL_DATE.split('T')[0] : '—'),
                    amount: parseFloat(r.NET_AMT || r.NET_AMOUNT || '0'),
                    customer: r.CUST_NAME || '—',
                    gst: r.GST_NO || '',
                    branchId: r.BRANCH_ID || session?.branchId || '—',
                }));
                console.log('Mapped[0] id:', mapped[0]?.id, ' billNo:', mapped[0]?.billNo, ' rawID:', results[0]?.ID);
                console.log('Mapped Result[0]:', JSON.stringify(mapped[0]));
                setInvoices(mapped);
                setSelectedIds([]);
            } else {
                setInvoices([]);
                Alert.alert('No Results Found', 'The server returned an empty list for this date range.');
            }
        } catch (err) {
            console.error('handleSearch Error:', err);
            Alert.alert('System Error', 'Could not complete search. Please check your network.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Full PDF flow:
     *  1. POST FetchBillsPdf → get URL from result
     *  2. GET that URL → download raw PDF bytes
     *  3. Convert to base64 → show in WebView (data URI)
     */
    const fetchAndShowPdf = async (billIds: string) => {
        setPdfLoading(true);
        setPdfBase64('');
        setPdfUrl('');
        try {
            // Step 1: POST to get the PDF URL
            const apiRes = await downloadBillPdf('SI', billIds, session?.branchId);
            if (!apiRes?.success || !apiRes?.url) {
                Alert.alert('Error', apiRes?.message || 'Could not fetch invoice URL.');
                return;
            }

            const pdfLink: string = apiRes.url;
            console.log('PDF URL from API:', pdfLink);
            setPdfUrl(pdfLink);

            // Step 2: GET that URL to download the PDF bytes
            if (ReactNativeBlobUtil) {
                const fileRes = await ReactNativeBlobUtil.config({ fileCache: true })
                    .fetch('GET', pdfLink);

                // Step 3: Read as base64 and show in WebView
                const base64 = await fileRes.base64();
                setPdfBase64(base64);
                setViewerVisible(true);
            } else {
                // Fallback: open in system browser
                Linking.openURL(pdfLink).catch(() =>
                    Alert.alert('Error', 'Cannot open PDF. Please try again.')
                );
            }
        } catch (err) {
            console.error('fetchAndShowPdf Error:', err);
            Alert.alert('Error', 'Failed to load PDF. Please check your connection.');
        } finally {
            setPdfLoading(false);
        }
    };

    /** Saves the current PDF to the device Downloads folder */
    const downloadPdfToDevice = async () => {
        if (!pdfUrl) return;
        setDownloading(true);
        try {
            if (ReactNativeBlobUtil) {
                const { config, fs } = ReactNativeBlobUtil;
                const FILE_PATH = `${fs.dirs.DownloadDir}/Invoice_${Date.now()}.pdf`;
                await config({
                    fileCache: true,
                    path: FILE_PATH,
                    addAndroidDownloads: {
                        useDownloadManager: true,
                        notification: true,
                        path: FILE_PATH,
                        description: 'Invoice PDF',
                        mime: 'application/pdf',
                    },
                }).fetch('GET', pdfUrl);
                Alert.alert('✓ Downloaded', 'Invoice saved to your Downloads folder.');
            } else {
                Linking.openURL(pdfUrl).catch(() => Alert.alert('Error', 'Could not open link.'));
            }
        } catch (err) {
            console.error('downloadPdfToDevice Error:', err);
            Linking.openURL(pdfUrl).catch(() => Alert.alert('Error', 'Download failed.'));
        } finally {
            setDownloading(false);
        }
    };

    const toggleSelectAll = () => {
        if (!invoices?.length) return;
        if (selectedIds.length === invoices.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(invoices.map((inv: any) => inv.id));
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    /** Single-invoice PDF */
    const handleDownload = async (billId: string) => {
        await fetchAndShowPdf(billId);
    };

    /** Multi-invoice bulk PDF */
    const handleBulkDownload = async () => {
        if (!selectedIds.length) return;
        await fetchAndShowPdf(selectedIds.join(','));
    };



    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            <GlassHeader
                title="Invoice Details"
                subtitle="Search Billing"
                onBack={() => navigation.goBack()}
                gradientColors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
            />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                


                {/* ── Filter Card ── */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="search-outline" size={24} color={BrandColors.primaryGradientStart} />
                        <Text style={styles.cardTitle}>Filter Records</Text>
                    </View>

                    <View style={styles.inputRow}>
                        <View style={styles.inputCell}>
                            <Text style={styles.label}>FROM DATE</Text>
                            <View style={[styles.inputWrapper, fromError ? styles.inputError : null]}>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="DD-MM-YYYY"
                                    placeholderTextColor="#A0AEC0"
                                    value={fromDate}
                                    onChangeText={handleFromDateChange}
                                    keyboardType="numeric"
                                    maxLength={10}
                                />
                                <Ionicons name="calendar-outline" size={18} color={BrandColors.primaryGradientStart} />
                            </View>
                            {fromError ? <Text style={styles.errorText}>{fromError}</Text> : null}
                        </View>

                        <View style={styles.inputCell}>
                            <Text style={styles.label}>TO DATE</Text>
                            <View style={[styles.inputWrapper, toError ? styles.inputError : null]}>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="DD-MM-YYYY"
                                    placeholderTextColor="#A0AEC0"
                                    value={toDate}
                                    onChangeText={handleToDateChange}
                                    keyboardType="numeric"
                                    maxLength={10}
                                />
                                <Ionicons name="calendar-outline" size={18} color={BrandColors.primaryGradientStart} />
                            </View>
                            {toError ? <Text style={styles.errorText}>{toError}</Text> : null}
                        </View>
                    </View>

                    <TouchableOpacity onPress={handleSearch} disabled={loading} style={styles.searchBtn}>
                        <LinearGradient colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]} style={styles.searchGrad}>
                            {loading ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <Text style={styles.searchBtnText}>SEARCH INVOICES</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* ── Results UI ── */}
                {loading ? (
                    <View style={styles.loadingArea}>
                        <ActivityIndicator color={BrandColors.primaryGradientStart} size="large" />
                        <Text style={{ marginTop: 12, color: '#64748B', fontWeight: '800' }}>SEARCHING RECORDS...</Text>
                    </View>
                ) : !!invoices?.length ? (
                    <View style={styles.resultsSection}>
                        {/* Section Header */}
                        <View style={styles.tableHeader}>
                            <View style={styles.tableHeaderLeft}>
                                <View style={styles.tableHeaderIcon}>
                                    <Ionicons name="receipt-outline" size={20} color="#FFF" />
                                </View>
                                <Text style={[styles.resultsTitle, { color: colors.textPrimary }]}>BILL RECORDS</Text>
                            </View>
                            <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllBtn}>
                                <Ionicons
                                    name={selectedIds.length > 0 && selectedIds.length === invoices.length ? "checkmark-done" : "ellipse-outline"}
                                    size={18} color={BrandColors.primaryGradientStart}
                                />
                                <Text style={styles.selectAllText}>
                                    {selectedIds.length === invoices.length ? 'Deselect All' : 'Select All'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Column Header Bar */}
                        <LinearGradient
                            colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.colHeaderBar}>
                            <View style={{ width: 40 }} />
                            <Text style={[styles.colHeaderText, { flex: 2 }]}>INV NO</Text>
                            <Text style={[styles.colHeaderText, { flex: 2 }]}>DATE</Text>
                            <Text style={[styles.colHeaderText, { flex: 2, textAlign: 'right' }]}>AMOUNT</Text>
                        </LinearGradient>

                        {/* Invoice Cards */}
                        <View style={styles.cardList}>
                            {invoices.map((inv, idx) => {
                                const selected = selectedIds.includes(inv.id);
                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        onPress={() => toggleSelection(inv.id)}
                                        activeOpacity={0.85}
                                        style={[
                                            styles.invoiceCard,
                                            selected && styles.invoiceCardSelected,
                                        ]}>
                                        {/* Left accent bar */}
                                        <View style={[styles.accentBar, { backgroundColor: selected ? BrandColors.primaryGradientStart : '#E2E8F0' }]} />

                                        {/* Checkbox */}
                                        <View style={styles.checkCol}>
                                            <View style={[styles.checkbox, selected && styles.checkboxActive]}>
                                                {selected && <Ionicons name="checkmark" size={15} color="#FFF" />}
                                            </View>
                                        </View>

                                        {/* INV NO + Branch */}
                                        <View style={{ flex: 2 }}>
                                            <Text style={[styles.invNoText, selected && { color: BrandColors.primaryGradientStart }]} numberOfLines={1}>
                                                {inv.billNo}
                                            </Text>
                                            {inv.branchId ? (
                                                <Text style={styles.branchTag}>BR-{inv.branchId}</Text>
                                            ) : null}
                                        </View>

                                        {/* DATE */}
                                        <View style={{ flex: 2 }}>
                                            <Text style={styles.dateText}>{inv.date}</Text>
                                        </View>

                                        {/* AMOUNT */}
                                        <View style={{ flex: 2, alignItems: 'flex-end' }}>
                                            <Text style={styles.amountText}>₹{(inv.amount || 0).toLocaleString()}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ) : null}
            </ScrollView>

            {/* ── Floating Action Button ── */}
            {selectedIds.length > 0 && (
                <TouchableOpacity style={styles.fab} onPress={handleBulkDownload} disabled={loading} activeOpacity={0.9}>
                    <LinearGradient colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]} style={styles.fabGrad}>
                        {loading ? (
                            <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                            <Ionicons name="document-text" size={24} color="#FFF" />
                        )}
                        <Text style={styles.fabText}>
                            {loading ? 'FETCHING...' : `GET INVOICES (${selectedIds.length})`}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {/* ── PDF Fetching Spinner (single-invoice) ── */}
            {pdfLoading && (
                <View style={styles.pdfOverlay}>
                    <View style={styles.pdfOverlayCard}>
                        <ActivityIndicator color={BrandColors.primaryGradientStart} size="large" />
                        <Text style={styles.pdfOverlayText}>Fetching Invoice...</Text>
                    </View>
                </View>
            )}

            {/* ── In-App PDF Preview Modal ── */}
            <Modal visible={viewerVisible} animationType="slide" onRequestClose={() => setViewerVisible(false)}>
                <View style={styles.modalBody}>
                    {/* Header */}
                    <LinearGradient
                        colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
                        style={styles.viewerHeader}>
                        <TouchableOpacity onPress={() => setViewerVisible(false)} style={styles.viewerIconBtn}>
                            <Ionicons name="close" size={30} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.viewerTitle}>Invoice Preview</Text>
                        <TouchableOpacity
                            onPress={downloadPdfToDevice}
                            disabled={downloading}
                            style={styles.viewerIconBtn}>
                            {downloading
                                ? <ActivityIndicator color="#FFF" size="small" />
                                : <Ionicons name="cloud-download" size={30} color="#FFF" />}
                        </TouchableOpacity>
                    </LinearGradient>

                    {/* WebView — PDF.js renders each page to <canvas> (works on Android) */}
                    {pdfBase64 && WebView ? (
                        <WebView
                            source={{ html: getPdfHtml(pdfBase64) }}
                            style={{ flex: 1 }}
                            originWhitelist={['*']}
                            javaScriptEnabled
                            domStorageEnabled
                            startInLoadingState
                            renderLoading={() => (
                                <View style={styles.loaderArea}>
                                    <ActivityIndicator color={BrandColors.primaryGradientStart} size="large" />
                                    <Text style={styles.loaderText}>Rendering PDF...</Text>
                                </View>
                            )}
                        />
                    ) : (
                        <View style={styles.loaderArea}>
                            <ActivityIndicator color={BrandColors.primaryGradientStart} size="large" />
                            <Text style={styles.loaderText}>Preparing document...</Text>
                        </View>
                    )}
                </View>
            </Modal>


        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20, paddingBottom: 60 },
    


    card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 8 },
    cardTitle: { fontSize: 15, fontWeight: '900', color: '#1F1F39' },
    
    inputRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    inputCell: { flex: 1 },
    label: { fontSize: 10, fontWeight: '800', color: '#64748B', marginBottom: 6 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FD', borderWidth: 1, borderColor: '#EBEEF2', borderRadius: 12, paddingHorizontal: 10, height: 48 },
    inputError: { borderColor: '#E3001B', backgroundColor: '#FFF5F5' },
    textInput: { flex: 1, fontSize: 13, fontWeight: '700', color: '#1F1F39', padding: 0 },
    errorText: { fontSize: 10, color: '#E3001B', marginTop: 4, fontWeight: '700' },

    searchBtn: { borderRadius: 14, overflow: 'hidden' },
    searchGrad: { height: 54, alignItems: 'center', justifyContent: 'center' },
    searchBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },

    // ── Results Section ────────────────────────────────────────
    resultsSection: { marginTop: 28 },
    tableHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    tableHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    tableHeaderIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: BrandColors.primaryGradientStart, alignItems: 'center', justifyContent: 'center' },
    resultsTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
    selectAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    selectAllText: { fontSize: 11, fontWeight: '800', color: BrandColors.primaryGradientStart },

    colHeaderBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, marginBottom: 8 },
    colHeaderText: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.8 },

    cardList: { gap: 8 },
    invoiceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', paddingRight: 14, paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    invoiceCardSelected: { backgroundColor: '#F0F4FF', shadowColor: BrandColors.primaryGradientStart, shadowOpacity: 0.15, elevation: 4 },
    accentBar: { width: 4, alignSelf: 'stretch', borderRadius: 4, marginRight: 10 },
    checkCol: { width: 36, alignItems: 'center', justifyContent: 'center' },
    checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: '#CBD5E0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
    checkboxActive: { backgroundColor: BrandColors.primaryGradientStart, borderColor: BrandColors.primaryGradientStart },
    idBadge: { fontSize: 10, fontWeight: '800', color: '#94A3B8', backgroundColor: '#F1F5F9', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, alignSelf: 'flex-start' },
    invNoText: { fontSize: 13, fontWeight: '900', color: '#1E293B' },
    branchTag: { fontSize: 9, fontWeight: '700', color: '#94A3B8', marginTop: 2 },
    dateText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
    amountText: { fontSize: 13, fontWeight: '900', color: BrandColors.primaryGradientStart },

    // legacy (kept for safety)
    table: { backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F4FF' },
    tableHead: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 15 },
    headCell: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    tableRow: { flexDirection: 'row', paddingVertical: 15, paddingHorizontal: 15, borderBottomWidth: 1, alignItems: 'center' },
    rowText: { fontSize: 12, fontWeight: '700' },
    centerCell: { alignItems: 'center', justifyContent: 'center' },
    pdfBtnSmall: { padding: 4 },

    loadingArea: { marginTop: 50, alignItems: 'center', justifyContent: 'center' },
    emptyArea: { marginTop: 80, alignItems: 'center', justifyContent: 'center' },
    emptyText: { marginTop: 15, fontSize: 13, color: '#64748B', fontWeight: '600', textAlign: 'center', paddingHorizontal: 40 },

    modalBody: { flex: 1, backgroundColor: '#FFF' },
    viewerHeader: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
    viewerIconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)' },
    viewerTitle: { flex: 1, textAlign: 'center', color: '#FFF', fontSize: 16, fontWeight: '900' },
    loaderArea: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    loaderText: { marginTop: 14, fontSize: 13, fontWeight: '700', color: '#64748B' },
    fab: { position: 'absolute', bottom: 30, right: 20, shadowColor: BrandColors.primaryGradientStart, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10, borderRadius: 30 },
    fabGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, height: 60, borderRadius: 30 },
    fabText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 0.5, marginLeft: 10 },

    pdfOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
    pdfOverlayCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 35, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 20 },
    pdfOverlayText: { marginTop: 18, fontSize: 16, fontWeight: '900', color: '#1F1F39' },
    pdfOverlaySub: { marginTop: 6, fontSize: 12, fontWeight: '600', color: '#64748B' },
});

export default InvoiceDetailScreen;
