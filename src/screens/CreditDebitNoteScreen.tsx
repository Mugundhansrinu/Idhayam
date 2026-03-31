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
    Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getCreditDebitNotes } from '../api';
import { useSession } from '../context/SessionContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { autoFormatDate, formatForApi, validateDateRange } from '../utils/dateHelpers';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'CreditDebitNote'> };

const CreditDebitNoteScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const { session } = useSession();

    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState<any[]>([]);

    const handleSearch = async () => {
        const { fromError, toError } = validateDateRange(fromDate, toDate);
        if (fromError || toError) { Alert.alert('Invalid Date', fromError || toError); return; }

        setLoading(true);
        try {
            const apiFrom = formatForApi(fromDate);
            const apiTo = formatForApi(toDate);
            const results = await getCreditDebitNotes(apiFrom, apiTo, session?.branchId, session?.custId);
            setNotes(results || []);
            if (!results?.length) Alert.alert('No Records', 'No credit/debit notes found.');
        } catch {
            Alert.alert('Error', 'Failed to fetch notes.');
        } finally {
            setLoading(false);
        }
    };

    const totalCredit = notes.filter(n => String(n.type).toUpperCase().includes('CN')).reduce((s, n) => s + (parseFloat(n.amount) || 0), 0);
    const totalDebit = notes.filter(n => String(n.type).toUpperCase().includes('DN')).reduce((s, n) => s + (parseFloat(n.amount) || 0), 0);

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={20} color="#3861FB" />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={styles.headerTitle}>CN / DN Report</Text>
                    <Text style={styles.headerSub}>Credit & Debit note list</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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

                {notes.length > 0 && (
                    <View style={styles.summaryGrid}>
                        <View style={[styles.sumCard, { borderLeftColor: '#00B894' }]}>
                            <Text style={styles.sumLabel}>CREDIT NOTES</Text>
                            <Text style={[styles.sumValue, { color: '#00B894' }]}>₹{totalCredit.toLocaleString()}</Text>
                        </View>
                        <View style={[styles.sumCard, { borderLeftColor: '#FF8C00' }]}>
                            <Text style={styles.sumLabel}>DEBIT NOTES</Text>
                            <Text style={[styles.sumValue, { color: '#FF8C00' }]}>₹{totalDebit.toLocaleString()}</Text>
                        </View>
                    </View>
                )}

                {notes.length > 0 && (
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.headText, { flex: 2 }]}>NOTE NO</Text>
                            <Text style={[styles.headText, { flex: 2 }]}>DATE</Text>
                            <Text style={[styles.headText, { flex: 1.2, textAlign: 'center' }]}>TYPE</Text>
                            <Text style={[styles.headText, { flex: 2, textAlign: 'right' }]}>AMOUNT</Text>
                        </View>
                        {notes.map((note, idx) => {
                            const isCN = String(note.type).toUpperCase().includes('CN');
                            const color = isCN ? '#00B894' : '#FF8C00';
                            return (
                                <View key={idx} style={styles.row}>
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
                                </View>
                            );
                        })}
                    </View>
                )}
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

    scroll: { padding: 25, paddingBottom: 100 },
    filterCard: { backgroundColor: '#fff', borderRadius: 25, padding: 15, marginBottom: 20, elevation: 3 },
    filterInputs: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    inputBox: { flex: 1 },
    label: { fontSize: 9, fontWeight: '900', color: '#A0AEC0', marginBottom: 4 },
    input: { backgroundColor: '#F8F9FD', borderRadius: 10, paddingHorizontal: 10, height: 40, fontSize: 12, fontWeight: '700', color: '#1A1A1A', borderWidth: 1, borderColor: '#EDF2F7' },
    searchBtn: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#3861FB', alignItems: 'center', justifyContent: 'center', elevation: 5 },

    summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    sumCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 15, borderLeftWidth: 4, elevation: 2 },
    sumLabel: { fontSize: 9, fontWeight: '900', color: '#A0AEC0', letterSpacing: 0.5, marginBottom: 5 },
    sumValue: { fontSize: 17, fontWeight: '900' },

    table: { backgroundColor: '#fff', borderRadius: 28, overflow: 'hidden', elevation: 5, shadowColor: '#3861FB', shadowOpacity: 0.05, shadowRadius: 15 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#F0F4FF', paddingVertical: 12, paddingHorizontal: 20 },
    headText: { fontSize: 10, fontWeight: '900', color: '#3861FB', letterSpacing: 0.5 },

    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F7FAFC', paddingHorizontal: 15 },
    rowTextMain: { fontSize: 13, fontWeight: '900', color: '#1A1A1A' },
    custTag: { fontSize: 8, fontWeight: '700', color: '#CBD5E0', marginTop: 2, width: 80 },
    rowTextSub: { fontSize: 11, fontWeight: '700', color: '#718096' },
    typeChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    typeText: { fontSize: 9, fontWeight: '900' },
    amountText: { flex: 2, fontSize: 13, fontWeight: '900', textAlign: 'right' },
});

export default CreditDebitNoteScreen;
