import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    ScrollView,
    Alert,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import GlassHeader from '../components/GlassHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getCreditDebitNotes } from '../api';
import { useSession } from '../context/SessionContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { autoFormatDate, formatForApi, validateDateRange } from '../utils/dateHelpers';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'CreditDebitNote'> };


// ─── Component ────────────────────────────────────────────────────────────────

const CreditDebitNoteScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const { session } = useSession();

    const [fromDate, setFromDate]   = useState('');
    const [toDate, setToDate]       = useState('');
    const [fromError, setFromError] = useState('');
    const [toError, setToError]     = useState('');
    const [loading, setLoading]     = useState(false);
    const [notes, setNotes]         = useState<any[]>([]);

    const handleFromChange = (text: string) => {
        setFromDate(autoFormatDate(text, fromDate));
        if (fromError) { setFromError(''); }
    };

    const handleToChange = (text: string) => {
        setToDate(autoFormatDate(text, toDate));
        if (toError) { setToError(''); }
    };

    const validate = (): boolean => {
        const { fromError: fe, toError: te } = validateDateRange(fromDate, toDate);
        setFromError(fe);
        setToError(te);
        return !fe && !te;
    };

    const handleSearch = async () => {
        if (!validate()) { return; }
        setLoading(true);
        try {
            const apiFrom = formatForApi(fromDate);
            const apiTo   = formatForApi(toDate);
            const results = await getCreditDebitNotes(
                apiFrom, apiTo,
                session?.branchId || undefined,
                session?.custId   || undefined,
            );
            setNotes(results || []);
            if (!results?.length) {
                Alert.alert('No Records', 'No credit/debit notes found for this date range.');
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to fetch notes. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const totalCredit = notes
        .filter(n => String(n.type).toUpperCase().includes('CN'))
        .reduce((s, n) => s + (parseFloat(n.amount) || 0), 0);

    const totalDebit = notes
        .filter(n => String(n.type).toUpperCase().includes('DN'))
        .reduce((s, n) => s + (parseFloat(n.amount) || 0), 0);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            <GlassHeader
                title="Credit / Debit Note"
                subtitle="CN/DN issued to your account"
                onBack={() => navigation.goBack()}
                gradientColors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
            />

            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                {/* ── Filter Card ── */}
                <View style={styles.card}>
                    <View style={styles.cardTitleRow}>
                        <Ionicons name="filter-outline" size={20} color={BrandColors.primaryGradientStart} />
                        <Text style={styles.cardTitle}>Select Date Range</Text>
                    </View>

                    {/* From Date */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>FROM DATE</Text>
                        <View style={[styles.inputWrapper, !!fromError && styles.inputError]}>
                            <TextInput
                                style={styles.dateInput}
                                placeholder="DD-MM-YYYY"
                                placeholderTextColor="#A0AEC0"
                                value={fromDate}
                                onChangeText={handleFromChange}
                                keyboardType="numeric"
                                maxLength={10}
                                returnKeyType="next"
                            />
                            <Ionicons
                                name="calendar-outline" size={20}
                                color={fromError ? '#E3001B' : BrandColors.primaryGradientStart}
                            />
                        </View>
                        {!!fromError && <Text style={styles.errorText}>⚠ {fromError}</Text>}
                    </View>

                    {/* To Date */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>TO DATE</Text>
                        <View style={[styles.inputWrapper, !!toError && styles.inputError]}>
                            <TextInput
                                style={styles.dateInput}
                                placeholder="DD-MM-YYYY"
                                placeholderTextColor="#A0AEC0"
                                value={toDate}
                                onChangeText={handleToChange}
                                keyboardType="numeric"
                                maxLength={10}
                                returnKeyType="done"
                                onSubmitEditing={handleSearch}
                            />
                            <Ionicons
                                name="calendar-outline" size={20}
                                color={toError ? '#E3001B' : BrandColors.primaryGradientStart}
                            />
                        </View>
                        {!!toError && <Text style={styles.errorText}>⚠ {toError}</Text>}
                    </View>

                    {/* GET RECORDS Button */}
                    <TouchableOpacity
                        onPress={handleSearch}
                        disabled={loading}
                        activeOpacity={0.88}
                        style={styles.searchBtn}>
                        <LinearGradient
                            colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.searchGrad}>
                            {loading
                                ? <ActivityIndicator color="#FFF" size="small" />
                                : <>
                                    <Ionicons name="search-outline" size={20} color="#FFF" />
                                    <Text style={styles.searchBtnText}>  GET RECORDS</Text>
                                  </>
                            }
                        </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.hint}>💡 Format: DD-MM-YYYY  •  e.g., 01-04-2025</Text>
                </View>

                {/* ── Results ── */}
                {notes.length > 0 && (
                    <View style={styles.resultsSection}>

                        {/* Summary chips */}
                        <View style={styles.summaryRow}>
                            <View style={[styles.summaryChip, { backgroundColor: '#E8F5E9' }]}>
                                <Text style={styles.summaryChipLabel}>CREDIT NOTES</Text>
                                <Text style={[styles.summaryChipValue, { color: '#2E7D32' }]}>
                                    ₹{totalCredit.toLocaleString()}
                                </Text>
                            </View>
                            <View style={[styles.summaryChip, { backgroundColor: '#FFF3E0' }]}>
                                <Text style={styles.summaryChipLabel}>DEBIT NOTES</Text>
                                <Text style={[styles.summaryChipValue, { color: '#E65100' }]}>
                                    ₹{totalDebit.toLocaleString()}
                                </Text>
                            </View>
                        </View>

                        {/* Section Header */}
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconBg}>
                                <Ionicons name="receipt-outline" size={16} color="#FFF" />
                            </View>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>CN / DN RECORDS</Text>
                            <View style={styles.countBadge}>
                                <Text style={styles.countBadgeText}>{notes.length}</Text>
                            </View>
                        </View>

                        {/* Gradient Column Header */}
                        <LinearGradient
                            colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.colHeaderBar}>
                            <Text style={[styles.colHeaderText, { flex: 1.6 }]}>NOTE NO</Text>
                            <Text style={[styles.colHeaderText, { flex: 1.4 }]}>DATE</Text>
                            <Text style={[styles.colHeaderText, { flex: 0.9, textAlign: 'center' }]}>TYPE</Text>
                            <Text style={[styles.colHeaderText, { flex: 1.5, textAlign: 'right' }]}>AMOUNT</Text>
                        </LinearGradient>

                        {/* Note Rows */}
                        {notes.map((note, idx) => {
                            const typeStr = String(note.type || '').toUpperCase();
                            const isCN    = typeStr.includes('CN');
                            const accent  = isCN ? '#2E7D32' : '#E65100';
                            const accentBg = isCN ? '#E8F5E9' : '#FFF3E0';

                            return (
                                <View
                                    key={String(idx)}
                                    style={[styles.noteCard, { borderLeftColor: accent }]}>

                                    {/* NOTE NO */}
                                    <View style={{ flex: 1.6 }}>
                                        <Text style={styles.noteNoText} numberOfLines={1}>
                                            {note.id}
                                        </Text>
                                        {!!note.custName && (
                                            <Text style={styles.custNameTag} numberOfLines={1}>
                                                {note.custName}
                                            </Text>
                                        )}
                                    </View>

                                    {/* DATE */}
                                    <View style={{ flex: 1.4 }}>
                                        <Text style={styles.dateText}>{note.date}</Text>
                                    </View>

                                    {/* TYPE chip */}
                                    <View style={{ flex: 0.9, alignItems: 'center' }}>
                                        <View style={[styles.typeChip, { backgroundColor: accentBg }]}>
                                            <Text style={[styles.typeChipText, { color: accent }]}>
                                                {note.type || '—'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* AMOUNT */}
                                    <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                                        <Text style={[styles.amountText, { color: accent }]}>
                                            ₹{(parseFloat(note.amount) || 0).toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}

                        {/* Grand Total Footer */}
                        <LinearGradient
                            colors={['#F0EFFF', '#FAF9FF']}
                            style={styles.totalBar}>
                            <Text style={styles.totalLabel}>
                                Total {notes.length} record{notes.length !== 1 ? 's' : ''}
                            </Text>
                            <Text style={styles.totalAmount}>
                                ₹{(totalCredit + totalDebit).toLocaleString()}
                            </Text>
                        </LinearGradient>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20, paddingBottom: 80 },

    // Filter card
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
        flexDirection: 'row', alignItems: 'center',
        height: 52, backgroundColor: '#F8F9FD',
        borderWidth: 1.5, borderColor: '#EBEEF2',
        borderRadius: 14, paddingHorizontal: 14,
    },
    inputError: { borderColor: '#E3001B', backgroundColor: '#FFF5F5' },
    dateInput: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1F1F39', padding: 0 },
    errorText: { fontSize: 12, fontWeight: '600', color: '#E3001B', marginTop: 6, marginLeft: 4 },
    hint: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginTop: 16, textAlign: 'center' },

    searchBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8, marginBottom: 4 },
    searchGrad: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    searchBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1 },

    // Results
    resultsSection: { marginTop: 28 },

    summaryRow: { flexDirection: 'row', marginBottom: 20 },
    summaryChip: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', marginHorizontal: 4 },
    summaryChipLabel: { fontSize: 10, fontWeight: '900', color: '#64748B', letterSpacing: 0.8, marginBottom: 6 },
    summaryChipValue: { fontSize: 20, fontWeight: '900' },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    sectionIconBg: { width: 30, height: 30, borderRadius: 10, backgroundColor: BrandColors.primaryGradientStart, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    sectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1, flex: 1 },
    countBadge: { backgroundColor: BrandColors.primaryGradientStart, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    countBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '900' },

    colHeaderBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, marginBottom: 8 },
    colHeaderText: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.95)', letterSpacing: 0.8 },

    noteCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF', borderRadius: 16,
        paddingVertical: 14, paddingHorizontal: 14,
        borderLeftWidth: 4, marginBottom: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    },
    noteNoText: { fontSize: 13, fontWeight: '900', color: '#1E293B' },
    custNameTag: { fontSize: 9, fontWeight: '600', color: '#94A3B8', marginTop: 2 },
    dateText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
    typeChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
    typeChipText: { fontSize: 11, fontWeight: '900' },
    amountText: { fontSize: 13, fontWeight: '900' },

    totalBar: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderRadius: 18, padding: 18, marginTop: 6,
        borderWidth: 1, borderColor: BrandColors.primaryGradientStart + '30',
    },
    totalLabel: { fontSize: 12, fontWeight: '800', color: '#64748B' },
    totalAmount: { fontSize: 20, fontWeight: '900', color: BrandColors.primaryGradientStart },
});

export default CreditDebitNoteScreen;
