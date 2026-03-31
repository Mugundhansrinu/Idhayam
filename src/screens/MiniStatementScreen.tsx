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
import { getTransactionList } from '../api';
import { useSession } from '../context/SessionContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { autoFormatDate, formatForApi, validateDateRange } from '../utils/dateHelpers';

const { width } = Dimensions.get('window');

let WebView: any = null;
try { WebView = require('react-native-webview').WebView; } catch { WebView = null; }

let ReactNativeBlobUtil: any = null;
try { ReactNativeBlobUtil = require('react-native-blob-util').default; } catch { ReactNativeBlobUtil = null; }

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'MiniStatement'> };

const MiniStatementScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const { session } = useSession();
    const [fromDate, setFromDate] = useState('');
    const [toDate,   setToDate]   = useState('');
    const [loading, setLoading]     = useState(false);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [reportUrl, setReportUrl] = useState('');
    const [webviewLoading, setWebviewLoading] = useState(true);

    const handleGetReport = async () => {
        const { fromError, toError } = validateDateRange(fromDate, toDate);
        if (fromError || toError) { Alert.alert('Invalid Date', fromError || toError); return; }

        setLoading(true);
        try {
            const apiFrom = formatForApi(fromDate);
            const apiTo   = formatForApi(toDate);
            const results = await getTransactionList(apiFrom, apiTo, session?.custId);
            if (results?.success && results.url) {
                setReportUrl(results.url);
                if (WebView) { setWebviewLoading(true); setViewerVisible(true); } 
                else { Linking.openURL(results.url); }
            } else {
                Alert.alert('No Report', results.message || 'No data found for this range.');
            }
        } catch {
            Alert.alert('Error', 'Failed to fetch the report.');
        } finally { setLoading(false); }
    };

    const handleDownload = async () => {
        if (!reportUrl) return;
        if (!ReactNativeBlobUtil) { Linking.openURL(reportUrl); return; }
        const { config, fs } = ReactNativeBlobUtil;
        const FILE_PATH = `${fs.dirs.DownloadDir}/Statement_${Date.now()}.pdf`;
        try {
            await config({ fileCache: true, addAndroidDownloads: { useDownloadManager: true, notification: true, path: FILE_PATH, mime: 'application/pdf' } }).fetch('GET', reportUrl);
            Alert.alert('Success', 'Statement saved to Downloads.');
        } catch { Linking.openURL(reportUrl); }
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={20} color="#3861FB" />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={styles.headerTitle}>Account Copy</Text>
                    <Text style={styles.headerSub}>Mini statement report</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconBox}>
                            <Icon name="date-range" size={24} color="#3861FB" />
                        </View>
                        <Text style={styles.cardTitle}>Filter Statement</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>FROM DATE</Text>
                        <View style={styles.inputBox}>
                            <TextInput
                                style={styles.input}
                                placeholder="DD-MM-YYYY"
                                placeholderTextColor="#A0AEC0"
                                value={fromDate}
                                onChangeText={t => setFromDate(autoFormatDate(t, fromDate))}
                                keyboardType="numeric"
                                maxLength={10}
                            />
                            <Icon name="event" size={20} color="#CBD5E0" />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>TO DATE</Text>
                        <View style={styles.inputBox}>
                            <TextInput
                                style={styles.input}
                                placeholder="DD-MM-YYYY"
                                placeholderTextColor="#A0AEC0"
                                value={toDate}
                                onChangeText={t => setToDate(autoFormatDate(t, toDate))}
                                keyboardType="numeric"
                                maxLength={10}
                            />
                            <Icon name="event" size={20} color="#CBD5E0" />
                        </View>
                    </View>

                    <TouchableOpacity onPress={handleGetReport} disabled={loading} style={styles.mainBtn}>
                        <LinearGradient colors={['#3861FB', '#2752E7']} style={styles.btnGrad}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>GENERATE PDF REPORT</Text>}
                        </LinearGradient>
                    </TouchableOpacity>
                    
                    <Text style={styles.hint}>Note: Data available for the last 6 months only.</Text>
                </View>

                {reportUrl ? (
                    <TouchableOpacity style={styles.readyCard} onPress={() => setViewerVisible(true)}>
                        <View style={styles.readyIcon}>
                            <Icon name="picture-as-pdf" size={30} color="#3861FB" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 15 }}>
                            <Text style={styles.readyTitle}>Report Ready</Text>
                            <Text style={styles.readySub}>{fromDate} to {toDate}</Text>
                        </View>
                        <Icon name="chevron-right" size={24} color="#3861FB" />
                    </TouchableOpacity>
                ) : null}
            </ScrollView>

            <Modal visible={viewerVisible} animationType="slide" onRequestClose={() => setViewerVisible(false)}>
                <View style={styles.modalBg}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setViewerVisible(false)}><Icon name="close" size={26} color="#1A1A1A" /></TouchableOpacity>
                        <Text style={styles.modalTitle}>Statement Viewer</Text>
                        <TouchableOpacity onPress={handleDownload}><Icon name="file-download" size={26} color="#3861FB" /></TouchableOpacity>
                    </View>
                    {WebView && (
                        <WebView
                            source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(reportUrl)}` }}
                            style={{ flex: 1 }}
                            onLoadEnd={() => setWebviewLoading(false)}
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

    scroll: { padding: 25 },
    card: { backgroundColor: '#fff', borderRadius: 32, padding: 25, elevation: 5, shadowColor: '#3861FB', shadowOpacity: 0.05, shadowRadius: 15 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    iconBox: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#F0F4FF', alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 16, fontWeight: '900', color: '#1A1A1A', marginLeft: 15 },

    inputGroup: { marginBottom: 20 },
    label: { fontSize: 10, fontWeight: '900', color: '#A0AEC0', letterSpacing: 1, marginBottom: 8 },
    inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FD', borderRadius: 15, paddingHorizontal: 15, height: 52, borderWidth: 1, borderColor: '#EDF2F7' },
    input: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1A1A1A' },

    mainBtn: { marginTop: 10, borderRadius: 18, overflow: 'hidden', elevation: 8, shadowColor: '#3861FB', shadowOpacity: 0.2, shadowRadius: 10 },
    btnGrad: { height: 60, alignItems: 'center', justifyContent: 'center' },
    btnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    hint: { textAlign: 'center', fontSize: 11, color: '#CBD5E0', fontWeight: '700', marginTop: 20 },

    readyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 25, padding: 20, marginTop: 25, elevation: 3 },
    readyIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#F0F4FF', alignItems: 'center', justifyContent: 'center' },
    readyTitle: { fontSize: 16, fontWeight: '900', color: '#1A1A1A' },
    readySub: { fontSize: 12, color: '#A0AEC0', fontWeight: '600', marginTop: 2 },

    modalBg: { flex: 1, backgroundColor: '#fff' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalTitle: { fontSize: 17, fontWeight: '900', color: '#1A1A1A' },
});

export default MiniStatementScreen;
