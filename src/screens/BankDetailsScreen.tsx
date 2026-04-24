import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    ScrollView,
    Alert,
    Clipboard,
    ActivityIndicator,
    Dimensions,
    Platform,
} from 'react-native';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getBankDetails } from '../api';
import { useSession } from '../context/SessionContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'BankDetails'> };

const BankDetailsScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const { session } = useSession();
    const [banks, setBanks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchBankDetails();
    }, []);

    const fetchBankDetails = async () => {
        setLoading(true);
        setError('');
        try {
            const custId = session?.custId || undefined;
            const result = await getBankDetails(custId);
            if (Array.isArray(result) && result.length > 0) {
                setBanks(result);
            } else {
                setError('No bank details found for this account.');
            }
        } catch (e) {
            console.error('BankDetails fetch error:', e);
            setError('Failed to load bank details.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        Clipboard.setString(text);
        Alert.alert('Copied!', `${label} copied to clipboard.`);
    };

    const CopyField = ({ label, value }: { label: string; value: string }) => (
        <TouchableOpacity
            style={styles.fieldRow}
            onPress={() => copyToClipboard(value, label)}
            activeOpacity={0.7}>
            <View style={styles.fieldInfo}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <Text style={styles.fieldValue}>{value || '—'}</Text>
            </View>
            <View style={styles.copyIconBox}>
                <Icon name="content-copy" size={16} color="#3861FB" />
            </View>
        </TouchableOpacity>
    );

    const renderBank = (bank: any, i: number) => {
        const bankName = bank.BANK_NAME ?? '—';
        const accName = bank.ACC_NAME ?? bank.PARTY_NAME ?? '—';
        const virtualAccNo = bank.VIRTUAL_ACCOUNT ?? bank.VIRTUAL_ACCOUNT_NO ?? bank.VIRTUAL_ACCOUNT_NUMBER ?? '—';
        const ifsc = bank.IFSC_CODE ?? '—';
        const city = bank.PARTY_CITY ?? bank.City ?? '';

        return (
            <View key={i} style={styles.bankCard}>
                <View style={styles.bankHeader}>

                    <View style={styles.bankTitle}>
                        <Text style={styles.bankName}>{bankName}</Text>
                        <View style={styles.cityBadge}>
                            <Text style={styles.cityText}>{city || 'Primary Account'}</Text>
                        </View>
                    </View>
                    <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>ACTIVE</Text>
                    </View>
                </View>

                <View style={styles.cardDivider} />

                <CopyField label="Account Name" value={accName} />
                <CopyField label="Virtual Account No" value={virtualAccNo} />
                <CopyField label="IFSC Code" value={ifsc} />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={20} color="#3861FB" />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={styles.headerTitle}>Bank Details</Text>
                    <Text style={styles.headerSub}>Virtual account & payment info</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                <View style={styles.noticeBox}>
                    <Icon name="verified" size={20} color="#3861FB" style={{ marginRight: 12 }} />
                    <Text style={styles.noticeText}>
                        Always verify bank details before making any payment. Tap any field to copy.
                    </Text>
                </View>

                {loading ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color="#3861FB" />
                    </View>
                ) : error ? (
                    <View style={styles.errorBox}>
                        <Icon name="error-outline" size={40} color="#E3001B" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={fetchBankDetails} style={styles.retryBtn}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    banks.map((bank, i) => renderBank(bank, i))
                )}

                <View style={styles.instructionCard}>
                    <Text style={styles.insTitle}>Usage Instructions</Text>
                    <View style={styles.insRow}>
                        <View style={styles.dot} />
                        <Text style={styles.insText}>Direct transfers to virtual accounts reflect instantly.</Text>
                    </View>
                </View>

            </ScrollView>
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

    scroll: { padding: 25, paddingBottom: 60 },
    noticeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4FF', borderRadius: 20, padding: 18, marginBottom: 25 },
    noticeText: { flex: 1, fontSize: 12, lineHeight: 18, color: '#3861FB', fontWeight: '800' },

    bankCard: { backgroundColor: '#fff', borderRadius: 32, padding: 25, marginBottom: 20, elevation: 5, shadowColor: '#3861FB', shadowOpacity: 0.05, shadowRadius: 15 },
    bankHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    bankIconBg: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#F0F4FF', alignItems: 'center', justifyContent: 'center' },
    bankTitle: { flex: 1, marginLeft: 18 },
    bankName: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
    cityBadge: { backgroundColor: '#F7FAFC', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
    cityText: { fontSize: 10, fontWeight: '800', color: '#A0AEC0', textTransform: 'uppercase' },
    activeBadge: { backgroundColor: '#E1F9F1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    activeBadgeText: { fontSize: 9, fontWeight: '900', color: '#00B894' },

    cardDivider: { height: 1.5, backgroundColor: '#F1F5F9', marginBottom: 10 },
    fieldRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    fieldInfo: { flex: 1 },
    fieldLabel: { fontSize: 10, fontWeight: '900', color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
    fieldValue: { fontSize: 15, fontWeight: '900', color: '#1A1A1A' },
    copyIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F0F4FF', alignItems: 'center', justifyContent: 'center' },

    instructionCard: { backgroundColor: '#fff', borderRadius: 24, padding: 25, marginTop: 10, borderWidth: 1.5, borderColor: '#EDF2F7', borderStyle: 'dashed' },
    insTitle: { fontSize: 14, fontWeight: '900', color: '#1A1A1A', marginBottom: 15 },
    insRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3861FB', marginRight: 12 },
    insText: { fontSize: 12, color: '#718096', fontWeight: '600', lineHeight: 18 },

    centerBox: { paddingTop: 60, alignItems: 'center' },
    errorBox: { alignItems: 'center', paddingVertical: 40 },
    errorText: { marginTop: 15, fontSize: 14, color: '#E3001B', fontWeight: '700', marginBottom: 20 },
    retryBtn: { backgroundColor: '#E3001B', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 12 },
    retryText: { color: '#fff', fontWeight: '900' },
});

export default BankDetailsScreen;
