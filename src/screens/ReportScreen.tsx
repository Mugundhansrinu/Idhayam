import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Animated,
    ScrollView,
    Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import GlassHeader from '../components/GlassHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Report'> };

const REPORTS = [
    { id: 'MiniStatement', icon: '📋', title: 'Account Copy', desc: 'Full account statement as PDF', format: 'PDF', color: '#7B61FF' },
    { id: 'InvoiceDetail', icon: '🧾', title: 'Invoice Details', desc: 'List of invoices — view or download', format: 'List / PDF', color: '#FD79A8' },
    { id: 'OrderEntry', icon: '📦', title: 'Order Entry Report', desc: 'History of all placed orders', format: 'List', color: '#00D2D3' },
    { id: 'CreditDebit', icon: '💳', title: 'Credit / Debit Note', desc: 'CN/DN issued to your account', format: 'List / PDF', color: '#FDCB6E' },
];

const ReportScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const anims = useRef(REPORTS.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        Animated.stagger(120, anims.map(a =>
            Animated.spring(a, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true })
        )).start();
    }, []);

    const handleReport = (id: string) => {
        if (id === 'MiniStatement') navigation.navigate('MiniStatement');
        else if (id === 'InvoiceDetail') navigation.navigate('InvoiceDetail');
        else if (id === 'OrderEntry') navigation.navigate('OrderEntryReport');
        else if (id === 'CreditDebit') navigation.navigate('CreditDebitNote');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            
            <GlassHeader title="Reports" subtitle="View and download your reports" onBack={() => navigation.goBack()} gradientColors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]} />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={[styles.heading, { color: colors.textPrimary }]}>Available Reports</Text>

                {REPORTS.map((r, i) => (
                    <Animated.View key={r.id} style={{
                        opacity: anims[i],
                        transform: [{ translateX: anims[i].interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
                    }}>
                        <TouchableOpacity onPress={() => handleReport(r.id)} activeOpacity={0.8} style={styles.reportCard}>
                            <View style={styles.reportRow}>
                                <View style={[styles.iconBg, { backgroundColor: r.color + '15' }]}>
                                    <Text style={styles.icon}>{r.icon}</Text>
                                </View>
                                <View style={styles.reportInfo}>
                                    <Text style={[styles.reportTitle, { color: colors.textPrimary }]}>{r.title}</Text>
                                    <Text style={[styles.reportDesc, { color: colors.textSecondary }]}>{r.desc}</Text>
                                    <View style={[styles.formatBadge, { backgroundColor: r.color + '10', borderColor: r.color + '30' }]}>
                                        <Text style={[styles.formatText, { color: r.color }]}>{r.format}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.arrow, { color: colors.textSecondary }]}>→</Text>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                ))}

                <View style={[styles.infoCard, { backgroundColor: colors.inputBackground }]}>
                    <Text style={styles.infoIcon}>ℹ️</Text>
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        PDF reports can be downloaded directly to your device. List reports show paginated data within the app.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20, paddingBottom: 60 },
    heading: { fontSize: 24, fontWeight: '900', marginBottom: 20 },
    reportCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    reportRow: { flexDirection: 'row', alignItems: 'center' },
    iconBg: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    icon: { fontSize: 24 },
    reportInfo: { flex: 1 },
    reportTitle: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
    reportDesc: { fontSize: 12, marginBottom: 8, fontWeight: '500' },
    formatBadge: { alignSelf: 'flex-start', borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
    formatText: { fontSize: 10, fontWeight: '800' },
    arrow: { fontSize: 18, marginLeft: 10, fontWeight: '800' },
    infoCard: { padding: 20, flexDirection: 'row', alignItems: 'flex-start', marginTop: 10, borderRadius: 20 },
    infoIcon: { fontSize: 16, marginRight: 12, marginTop: 2 },
    infoText: { fontSize: 12, flex: 1, lineHeight: 18, fontWeight: '600' },
});

export default ReportScreen;
