import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Animated,
    ScrollView,
    Alert,
    Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import GlassHeader from '../components/GlassHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getTransactionList, getTransactionPdfUrl } from '../api';

const { width } = Dimensions.get('window');

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'MiniStatement'> };

const FALLBACK_TRANSACTIONS = [
    { date: '24 Feb 26', desc: 'Invoice INV-2026-0341', debit: 0, credit: 48200, bal: 352000 },
    { date: '22 Feb 26', desc: 'Payment Received', debit: 75000, credit: 0, bal: 303800 },
    { date: '18 Feb 26', desc: 'Invoice INV-2026-0289', debit: 0, credit: 31500, bal: 378800 },
    { date: '15 Feb 26', desc: 'Credit Note CN-0032', debit: 2400, credit: 0, bal: 347300 },
    { date: '10 Feb 26', desc: 'Invoice INV-2026-0244', debit: 0, credit: 72800, bal: 349700 },
];

const MiniStatementScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const [transactions, setTransactions] = useState(FALLBACK_TRANSACTIONS);
    const [loading, setLoading] = useState(true);
    const listAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(listAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
        const today = new Date();
        const from = new Date(today);
        from.setMonth(today.getMonth() - 6);
        const fmt = (d: Date) => `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
        getTransactionList(fmt(from), fmt(today))
            .then(data => {
                const rows = Array.isArray(data) ? data : (data?.data ?? []);
                if (rows.length > 0) {
                    setTransactions(rows.map((r: any) => ({
                        date: r.TRANS_DATE ?? r.date ?? '',
                        desc: r.PARTICULARS ?? r.desc ?? '',
                        debit: parseFloat(r.DEBIT ?? r.debit ?? 0),
                        credit: parseFloat(r.CREDIT ?? r.credit ?? 0),
                        bal: parseFloat(r.BALANCE ?? r.bal ?? 0),
                    })));
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const handleDownloadPDF = () => {
        const pdfUrl = getTransactionPdfUrl();
        Alert.alert('Account Copy PDF', `Your account statement PDF is being generated.`);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            
            <GlassHeader
                title="Account Copy"
                subtitle="Recent Transactions"
                onBack={() => navigation.goBack()}
                gradientColors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
                rightIcon={
                    <TouchableOpacity onPress={handleDownloadPDF} style={styles.downloadIconBtn}>
                        <Text style={{ fontSize: 20 }}>⬇️</Text>
                    </TouchableOpacity>
                }
            />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={[styles.balanceBar, { backgroundColor: colors.inputBackground }]}>
                    <View style={styles.balanceInfo}>
                        <Text style={[styles.balanceLbl, { color: colors.textSecondary }]}>NET OUTSTANDING</Text>
                        <Text style={[styles.balanceVal, { color: BrandColors.primaryGradientStart }]}>₹3,52,000.00</Text>
                    </View>
                    <View style={[styles.limitBadge, { backgroundColor: '#E8FDF0' }]}>
                        <Text style={[styles.limitText, { color: '#27AE60' }]}>SAFE LIMIT</Text>
                    </View>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Transaction History</Text>

                {transactions.map((tx, i) => (
                    <View key={i} style={styles.txCard}>
                        <View style={styles.txTop}>
                            <Text style={[styles.txDate, { color: colors.textSecondary }]}>{tx.date}</Text>
                            <Text style={[styles.txBal, { color: colors.textPrimary }]}>Bal: ₹{(tx.bal / 1000).toFixed(0)}K</Text>
                        </View>
                        <Text style={[styles.txDesc, { color: colors.textPrimary }]}>{tx.desc}</Text>
                        <View style={styles.txBottom}>
                            <View style={styles.amtRow}>
                                <View style={[styles.amtDot, { backgroundColor: tx.debit ? '#E3001B' : '#27AE60' }]} />
                                <Text style={[styles.amtText, { color: tx.debit ? '#E3001B' : '#27AE60' }]}>
                                    {tx.debit ? `Debit: ₹${tx.debit.toLocaleString()}` : `Credit: ₹${tx.credit.toLocaleString()}`}
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.viewBtn}>
                                <Text style={[styles.viewBtnText, { color: BrandColors.primaryGradientStart }]}>VIEW</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                <TouchableOpacity onPress={handleDownloadPDF} activeOpacity={0.9} style={styles.fullDownloadBtn}>
                    <LinearGradient colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]} style={styles.fullDownloadGrad}>
                        <Text style={styles.fullDownloadText}>DOWNLOAD FULL STATEMENT (PDF)</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20, paddingBottom: 60 },
    balanceBar: { padding: 25, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
    balanceInfo: { flex: 1 },
    balanceLbl: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 5 },
    balanceVal: { fontSize: 26, fontWeight: '900' },
    limitBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    limitText: { fontSize: 10, fontWeight: '900' },
    
    sectionTitle: { fontSize: 22, fontWeight: '900', marginBottom: 20 },
    txCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    txTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    txDate: { fontSize: 12, fontWeight: '700' },
    txBal: { fontSize: 12, fontWeight: '800' },
    txDesc: { fontSize: 16, fontWeight: '700', marginBottom: 15 },
    txBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    amtRow: { flexDirection: 'row', alignItems: 'center' },
    amtDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    amtText: { fontSize: 14, fontWeight: '800' },
    viewBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F0F4FF' },
    viewBtnText: { fontSize: 11, fontWeight: '900' },
    
    downloadIconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    fullDownloadBtn: { marginTop: 20, borderRadius: 20, overflow: 'hidden' },
    fullDownloadGrad: { paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
    fullDownloadText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
});

export default MiniStatementScreen;
