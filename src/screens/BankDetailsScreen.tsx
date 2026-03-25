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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import GlassHeader from '../components/GlassHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getBankDetails } from '../api';
import { useSession } from '../context/SessionContext';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'BankDetails'> };

const BANK_COLORS = ['#7B61FF', '#FD79A8', '#27AE60', '#0984E3', '#E3001B'];

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
            setError('Failed to load bank details. Please try again.');
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
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
                <Text style={[styles.fieldValue, { color: colors.textPrimary }]}>{value || '—'}</Text>
            </View>
            <Text style={{ fontSize: 16 }}>📋</Text>
        </TouchableOpacity>
    );

    const renderBank = (bank: any, i: number) => {
        const color = BANK_COLORS[i % BANK_COLORS.length];

        // Exact field names from CUST_VitrualAcc_CHK response
        const bankName      = bank.BANK_NAME        ?? '—';
        const accName       = bank.ACC_NAME         ?? bank.PARTY_NAME ?? '—';
        const virtualAccNo  = bank.VIRTUAL_ACCOUNT  ?? bank.VIRTUAL_ACCOUNT_NO ?? bank.VIRTUAL_ACCOUNT_NUMBER ?? '—';
        const ifsc          = bank.IFSC_CODE        ?? '—';
        const city          = bank.PARTY_CITY       ?? bank.City ?? '';
        const virtualId     = bank.VIRTUAL_ID       ? String(bank.VIRTUAL_ID) : '';
        const partyName     = bank.PARTY_NAME       ?? '';

        return (
            <View key={i} style={styles.bankCard}>
                {/* Bank Header */}
                <View style={styles.bankHeader}>
                    <View style={[styles.bankIconBg, { backgroundColor: color + '18' }]}>
                        <Text style={styles.bankIcon}>🏦</Text>
                    </View>
                    <View style={styles.bankTitle}>
                        <Text style={[styles.bankName, { color: colors.textPrimary }]}>{bankName}</Text>
                        {city ? <Text style={[styles.bankType, { color: colors.textSecondary }]}>{city}</Text> : null}
                    </View>
                    <View style={[styles.activeBadge, { backgroundColor: color + '18' }]}>
                        <Text style={[styles.activeBadgeText, { color }]}>ACTIVE</Text>
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.divider }]} />

                <CopyField label="Account Name"      value={accName} />
                <View style={[styles.fieldDivider, { backgroundColor: colors.divider }]} />
                <CopyField label="Virtual Account No" value={virtualAccNo} />
                <View style={[styles.fieldDivider, { backgroundColor: colors.divider }]} />
                <CopyField label="IFSC Code"          value={ifsc} />
                {partyName ? (
                    <>
                        <View style={[styles.fieldDivider, { backgroundColor: colors.divider }]} />
                        <CopyField label="Party Name" value={partyName} />
                    </>
                ) : null}
                {virtualId ? (
                    <>
                        <View style={[styles.fieldDivider, { backgroundColor: colors.divider }]} />
                        <CopyField label="Virtual ID" value={virtualId} />
                    </>
                ) : null}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            <GlassHeader
                title="Bank Details"
                subtitle="Virtual account & payment info"
                onBack={() => navigation.goBack()}
                gradientColors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
            />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Notice */}
                <View style={[styles.notice, { backgroundColor: BrandColors.primaryGradientStart + '10', borderColor: BrandColors.primaryGradientStart + '30' }]}>
                    <Text style={styles.noticeIcon}>⚠️</Text>
                    <Text style={[styles.noticeText, { color: BrandColors.primaryGradientStart }]}>
                        Always verify bank details before making any payment. Tap any field to copy.
                    </Text>
                </View>

                {/* Loading */}
                {loading && (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color={BrandColors.primaryGradientStart} />
                        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                            Loading bank details...
                        </Text>
                    </View>
                )}

                {/* Error */}
                {!loading && error !== '' && (
                    <View style={[styles.errorBox, { backgroundColor: '#FF4D4D10', borderColor: '#FF4D4D30' }]}>
                        <Text style={styles.errorIcon}>⚠️</Text>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={fetchBankDetails} style={styles.retryBtn}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Bank Cards */}
                {!loading && banks.map((bank, i) => renderBank(bank, i))}

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20, paddingBottom: 60 },

    notice: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, padding: 15, marginBottom: 20 },
    noticeIcon: { fontSize: 18, marginRight: 10 },
    noticeText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '700' },

    centerBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    loadingText: { marginTop: 16, fontSize: 14, fontWeight: '600' },

    errorBox: { borderRadius: 20, borderWidth: 1, padding: 25, alignItems: 'center', marginBottom: 20 },
    errorIcon: { fontSize: 28, marginBottom: 10 },
    errorText: { fontSize: 14, fontWeight: '600', color: '#FF4D4D', textAlign: 'center', marginBottom: 16 },
    retryBtn: { backgroundColor: '#FF4D4D', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
    retryText: { color: '#fff', fontWeight: '800', fontSize: 13 },

    bankCard: { backgroundColor: '#fff', borderRadius: 28, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    bankHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    bankIconBg: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    bankIcon: { fontSize: 26 },
    bankTitle: { flex: 1 },
    bankName: { fontSize: 17, fontWeight: '900' },
    bankType: { fontSize: 12, fontWeight: '600', marginTop: 2 },
    activeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    activeBadgeText: { fontSize: 10, fontWeight: '900' },

    divider: { height: 1, marginBottom: 15 },
    fieldRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    fieldInfo: { flex: 1 },
    fieldLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    fieldValue: { fontSize: 15, fontWeight: '700' },
    fieldDivider: { height: 1, opacity: 0.5 },
});

export default BankDetailsScreen;
