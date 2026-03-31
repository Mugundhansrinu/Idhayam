import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Animated,
    ScrollView,
    Dimensions,
    Platform,
} from 'react-native';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Report'> };

const REPORTS = [
    { id: 'MiniStatement', icon: 'account-balance-wallet', title: 'Account Copy', desc: 'Full account statement as PDF', format: 'PDF', color: '#3861FB' },
    { id: 'InvoiceDetail', icon: 'receipt', title: 'Invoice Details', desc: 'List of invoices — view or download', format: 'List / PDF', color: '#00D2D3' },
    { id: 'OrderEntry', icon: 'shopping-basket', title: 'Order Report', desc: 'History of all placed orders', format: 'List', color: '#FD79A8' },
    { id: 'CreditDebit', icon: 'payment', title: 'Credit / Debit Note', desc: 'CN/DN issued to your account', format: 'List / PDF', color: '#FDCB6E' },
];

const ReportScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const anims = useRef(REPORTS.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        Animated.stagger(100, anims.map(a =>
            Animated.spring(a, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true })
        )).start();
    }, []);

    const handleReport = (id: string) => {
        if (id === 'MiniStatement') navigation.navigate('MiniStatement');
        else if (id === 'InvoiceDetail') navigation.navigate('InvoiceDetail');
        else if (id === 'OrderEntry') navigation.navigate('OrderEntryReport');
        else if (id === 'CreditDebit') navigation.navigate('CreditDebitNote');
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={20} color="#3861FB" />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={styles.headerTitle}>Available Reports</Text>
                    <Text style={styles.headerSub}>View and download statements</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.noticeBox}>
                    <Icon name="info-outline" size={20} color="#3861FB" style={{ marginRight: 12 }} />
                    <Text style={styles.noticeText}>
                        PDF reports are downloaded instantly. List reports offer interactive filtering within the app.
                    </Text>
                </View>

                {REPORTS.map((r, i) => (
                    <Animated.View key={r.id} style={{
                        opacity: anims[i],
                        transform: [{ translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                    }}>
                        <TouchableOpacity onPress={() => handleReport(r.id)} activeOpacity={0.8} style={styles.reportCard}>
                            <View style={styles.reportRow}>
                                <View style={styles.reportInfo}>
                                    <View style={styles.titleRow}>
                                        <Text style={styles.reportTitle}>{r.title}</Text>
                                        <View style={[styles.formatBadge, { backgroundColor: r.color + '10', borderColor: r.color + '30' }]}>
                                            <Text style={[styles.formatText, { color: r.color }]}>{r.format}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.reportDesc}>{r.desc}</Text>
                                </View>
                                <Icon name="chevron-right" size={20} color="#CBD5E0" />
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                ))}


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

    scroll: { paddingHorizontal: 25, paddingBottom: 60 },
    noticeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4FF', borderRadius: 20, padding: 18, marginBottom: 25 },
    noticeText: { flex: 1, fontSize: 12, lineHeight: 18, color: '#3861FB', fontWeight: '800' },

    reportCard: { backgroundColor: '#fff', borderRadius: 28, padding: 22, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10 },
    reportRow: { flexDirection: 'row', alignItems: 'center' },
    iconBg: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 18 },
    reportInfo: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    reportTitle: { fontSize: 16, fontWeight: '900', color: '#1A1A1A' },
    reportDesc: { fontSize: 12, color: '#A0AEC0', fontWeight: '600', lineHeight: 16 },
    formatBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
    formatText: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase' },

    upgradeCard: { backgroundColor: '#F0F4FF', borderRadius: 24, padding: 25, marginTop: 10, alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#3861FB' },
    upgradeTitle: { fontSize: 15, fontWeight: '900', color: '#3861FB', marginTop: 10 },
    upgradeSub: { fontSize: 12, color: '#718096', fontWeight: '600', textAlign: 'center', marginTop: 4, lineHeight: 18 },
});

export default ReportScreen;
