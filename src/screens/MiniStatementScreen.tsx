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
import { getTransactionList } from '../api';
import { useSession } from '../context/SessionContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { autoFormatDate, formatForApi, validateDateRange } from '../utils/dateHelpers';

const { width } = Dimensions.get('window');

// Lazy-load modules to avoid Render Error if native parts aren't linked yet
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

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'MiniStatement'> };

// ─── Component ────────────────────────────────────────────────────────────────

const MiniStatementScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const { session } = useSession();

    const [fromDate, setFromDate] = useState('');
    const [toDate,   setToDate]   = useState('');
    const [fromError, setFromError] = useState('');
    const [toError,   setToError]   = useState('');
    const [loading, setLoading]     = useState(false);

    const [viewerVisible,  setViewerVisible]  = useState(false);
    const [reportUrl,      setReportUrl]      = useState('');
    const [webviewLoading, setWebviewLoading] = useState(true);

    // ── Date Handlers ────────────────────────────────────────────────────────

    const handleFromDateChange = (text: string) => {
        setFromDate(autoFormatDate(text, fromDate));
        if (fromError) setFromError('');
    };

    const handleToDateChange = (text: string) => {
        setToDate(autoFormatDate(text, toDate));
        if (toError) setToError('');
    };

    // ── Validation ───────────────────────────────────────────────────────────

    const validate = (): boolean => {
        const { fromError: fe, toError: te } = validateDateRange(fromDate, toDate);
        setFromError(fe);
        setToError(te);
        return !fe && !te;
    };

    // ── Get Report ───────────────────────────────────────────────────────────

    const handleGetReport = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            const apiFrom = formatForApi(fromDate);
            const apiTo   = formatForApi(toDate);
            const results = await getTransactionList(apiFrom, apiTo, session?.custId);

            if (results?.success && results.url) {
                setReportUrl(results.url);
                if (WebView) {
                    // In-app viewer available
                    setWebviewLoading(true);
                    setViewerVisible(true);
                } else {
                    // Fallback: open in browser until app is rebuilt
                    Linking.openURL(results.url).catch(() =>
                        Alert.alert('Error', 'Could not open the PDF URL.')
                    );
                }
            } else {
                Alert.alert('No Report', results.message || 'The server did not return a report URL.');
            }
        } catch {
            Alert.alert('Error', 'Failed to fetch the report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!reportUrl) return;

        if (!ReactNativeBlobUtil) {
            // Fallback: open in browser if native module not ready
            Linking.openURL(reportUrl).catch(() =>
                Alert.alert('Error', 'Could not open the download link.')
            );
            return;
        }

        const { config, fs } = ReactNativeBlobUtil;
        const date = new Date();
        const FILE_PATH = `${fs.dirs.DownloadDir}/Statement_${Math.floor(date.getTime() + date.getSeconds() / 2)}.pdf`;

        try {
            await config({
                fileCache: true,
                addAndroidDownloads: {
                    useDownloadManager: true,
                    notification: true,
                    path: FILE_PATH,
                    description: 'Downloading Account Statement PDF',
                    mime: 'application/pdf',
                },
            }).fetch('GET', reportUrl);

            Alert.alert(
                'Download Perfect!',
                'The statement has been saved directly to your Downloads folder.'
            );
        } catch (err) {
            console.error('Download error:', err);
            // Final fallback to browser
            Linking.openURL(reportUrl).catch(() =>
                Alert.alert('Error', 'Could not start download.')
            );
        }
    };

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            <GlassHeader
                title="Account Copy"
                subtitle="Mini Statement"
                onBack={() => navigation.goBack()}
                gradientColors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
            />

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Filter Card ── */}
                <View style={styles.card}>
                    <View style={styles.cardTitleRow}>
                        <Ionicons name="filter-outline" size={20} color={BrandColors.primaryGradientStart} />
                        <Text style={styles.cardTitle}>Select Date Range</Text>
                    </View>

                    {/* From Date */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>FROM DATE</Text>
                        <View style={[styles.inputWrapper, fromError ? styles.inputError : null]}>
                            <TextInput
                                style={styles.dateInput}
                                placeholder="DD-MM-YYYY"
                                placeholderTextColor="#A0AEC0"
                                value={fromDate}
                                onChangeText={handleFromDateChange}
                                keyboardType="numeric"
                                maxLength={10}
                                returnKeyType="next"
                            />
                            <Ionicons
                                name="calendar-outline"
                                size={20}
                                color={fromError ? '#E3001B' : BrandColors.primaryGradientStart}
                            />
                        </View>
                        {!!fromError && (
                            <Text style={styles.errorText}>⚠ {fromError}</Text>
                        )}
                    </View>

                    {/* To Date */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>TO DATE</Text>
                        <View style={[styles.inputWrapper, toError ? styles.inputError : null]}>
                            <TextInput
                                style={styles.dateInput}
                                placeholder="DD-MM-YYYY"
                                placeholderTextColor="#A0AEC0"
                                value={toDate}
                                onChangeText={handleToDateChange}
                                keyboardType="numeric"
                                maxLength={10}
                                returnKeyType="done"
                                onSubmitEditing={handleGetReport}
                            />
                            <Ionicons
                                name="calendar-outline"
                                size={20}
                                color={toError ? '#E3001B' : BrandColors.primaryGradientStart}
                            />
                        </View>
                        {!!toError && (
                            <Text style={styles.errorText}>⚠ {toError}</Text>
                        )}
                    </View>

                    {/* Get Report Button */}
                    <TouchableOpacity
                        onPress={handleGetReport}
                        disabled={loading}
                        activeOpacity={0.88}
                        style={styles.reportBtn}
                    >
                        <LinearGradient
                            colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.reportBtnGrad}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="document-text-outline" size={20} color="#FFF" />
                                    <Text style={styles.reportBtnText}>  GET REPORT</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.hint}>💡 Format: DD-MM-YYYY  •  e.g., 01-04-2025</Text>
                </View>

                {/* ── Last Fetched Banner ── */}
                {!!reportUrl && (
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => {
                            if (WebView) {
                                setWebviewLoading(true);
                                setViewerVisible(true);
                            } else {
                                handleDownload();
                            }
                        }}
                        style={styles.reopenCard}
                    >
                        <LinearGradient colors={['#F0EFFF', '#FAF9FF']} style={styles.reopenInner}>
                            <Ionicons name="document-text" size={28} color={BrandColors.primaryGradientStart} />
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <Text style={styles.reopenTitle}>Statement Ready</Text>
                                <Text style={styles.reopenSub}>{fromDate}  →  {toDate}</Text>
                                <Text style={styles.reopenAction}>
                                    {WebView ? 'Tap to view in app' : 'Tap to open in browser'}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={BrandColors.primaryGradientStart} />
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/* ═══════════════════════════════════════════════════════
                In-App PDF Viewer Modal (only rendered when WebView exists)
            ═══════════════════════════════════════════════════════ */}
            {WebView && (
                <Modal
                    visible={viewerVisible}
                    animationType="slide"
                    statusBarTranslucent
                    onRequestClose={() => setViewerVisible(false)}
                >
                    <View style={styles.modalContainer}>

                        {/* Modal Header */}
                        <LinearGradient
                            colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.modalHeader}
                        >
                            <TouchableOpacity onPress={() => setViewerVisible(false)} style={styles.modalHeaderBtn}>
                                <Ionicons name="close" size={26} color="#FFF" />
                            </TouchableOpacity>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={styles.modalTitle}>Account Copy</Text>
                                <Text style={styles.modalSubtitle}>{fromDate}  →  {toDate}</Text>
                            </View>
                            <TouchableOpacity onPress={handleDownload} style={styles.modalHeaderBtn}>
                                <Ionicons name="cloud-download-outline" size={26} color="#FFF" />
                            </TouchableOpacity>
                        </LinearGradient>

                        {/* WebView Render */}
                        <WebView
                            source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(reportUrl)}` }}
                            style={{ flex: 1 }}
                            startInLoadingState
                            onLoadStart={() => setWebviewLoading(true)}
                            onLoadEnd={() => setWebviewLoading(false)}
                            renderLoading={() => (
                                <View style={styles.webviewLoader}>
                                    <ActivityIndicator color={BrandColors.primaryGradientStart} size="large" />
                                    <Text style={styles.webviewLoaderText}>Loading your statement...</Text>
                                </View>
                            )}
                            javaScriptEnabled
                            domStorageEnabled
                        />

                        {/* Download Bar */}
                        {!webviewLoading && (
                            <View style={styles.downloadBar}>
                                <TouchableOpacity onPress={handleDownload} activeOpacity={0.88} style={styles.downloadBarBtn}>
                                    <LinearGradient
                                        colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.downloadBarGrad}
                                    >
                                        <Ionicons name="cloud-download-outline" size={20} color="#FFF" />
                                        <Text style={styles.downloadBarText}>  DOWNLOAD PDF</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </Modal>
            )}
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20, paddingBottom: 80 },

    card: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#7B61FF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    cardTitle: { fontSize: 16, fontWeight: '900', color: '#1F1F39', marginLeft: 10 },

    inputGroup: { marginBottom: 18 },
    inputLabel: { fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 8, letterSpacing: 0.8 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
        backgroundColor: '#F8F9FD',
        borderWidth: 1.5,
        borderColor: '#EBEEF2',
        borderRadius: 14,
        paddingHorizontal: 14,
    },
    inputError: { borderColor: '#E3001B', backgroundColor: '#FFF5F5' },
    dateInput: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1F1F39', padding: 0 },
    errorText: { fontSize: 12, fontWeight: '600', color: '#E3001B', marginTop: 6, marginLeft: 4 },
    hint: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginTop: 16, textAlign: 'center' },

    reportBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8, marginBottom: 4 },
    reportBtnGrad: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    reportBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1 },

    reopenCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginTop: 20,
        borderWidth: 1.5,
        borderColor: BrandColors.primaryGradientStart + '30',
    },
    reopenInner: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    reopenTitle: { fontSize: 15, fontWeight: '900', color: '#1F1F39' },
    reopenSub: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 2 },
    reopenAction: { fontSize: 11, fontWeight: '700', color: BrandColors.primaryGradientStart, marginTop: 4 },

    modalContainer: {
        flex: 1,
        backgroundColor: '#F8F9FD',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
    },
    modalHeader: { height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
    modalHeaderBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    modalTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' },
    modalSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600', marginTop: 2 },

    webviewLoader: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8F9FD',
    },
    webviewLoaderText: { marginTop: 16, fontSize: 14, fontWeight: '600', color: '#64748B' },

    downloadBar: {
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F0F4F8',
    },
    downloadBarBtn: { borderRadius: 16, overflow: 'hidden' },
    downloadBarGrad: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    downloadBarText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
});

export default MiniStatementScreen;
