/**
 * ReportScreen – Report menu: Account Copy | Invoice | Order List | Credit/Debit Note
 */
import React, { useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, StatusBar,
    Animated, ScrollView, Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import OilFlowBackground from '../components/OilFlowBackground';
import GlassCard from '../components/GlassCard';
import GlassHeader from '../components/GlassHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Report'> };

const REPORTS = [
    { id: 'MiniStatement', icon: '📋', title: 'Account Copy', desc: 'Full account statement as PDF', format: 'PDF', color: '#7C3AED' },
    { id: 'InvoiceDetail', icon: '🧾', title: 'Invoice Details', desc: 'List of invoices — view or download', format: 'List / PDF', color: '#B71C1C' },
    { id: 'OrderEntry', icon: '📦', title: 'Order Entry Report', desc: 'History of all placed orders', format: 'List', color: '#1E4DB7' },
    { id: 'CreditDebit', icon: '💳', title: 'Credit / Debit Note', desc: 'CN/DN issued to your account', format: 'List / PDF', color: '#0E7490' },
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
        else if (id === 'OrderEntry') navigation.navigate('OrderEntry');
        else Alert.alert('Credit/Debit Note', 'Opening Credit/Debit note ledger...');
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <LinearGradient colors={[BrandColors.blue900, BrandColors.blue800, '#0a1a4e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <OilFlowBackground />
            <GlassHeader title="Reports" subtitle="View and download your reports" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={[styles.heading, { color: colors.textPrimary }]}>Available Reports</Text>

                {REPORTS.map((r, i) => (
                    <Animated.View key={r.id} style={{
                        opacity: anims[i],
                        transform: [{ translateX: anims[i].interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
                    }}>
                        <TouchableOpacity onPress={() => handleReport(r.id)} activeOpacity={0.8}>
                            <GlassCard style={styles.reportCard}>
                                <View style={styles.reportRow}>
                                    <LinearGradient
                                        colors={[r.color + '55', r.color + '22']}
                                        style={styles.iconBg}>
                                        <Text style={styles.icon}>{r.icon}</Text>
                                    </LinearGradient>
                                    <View style={styles.reportInfo}>
                                        <Text style={[styles.reportTitle, { color: colors.textPrimary }]}>{r.title}</Text>
                                        <Text style={[styles.reportDesc, { color: colors.textSecondary }]}>{r.desc}</Text>
                                        <View style={[styles.formatBadge, { backgroundColor: r.color + '33', borderColor: r.color + '99' }]}>
                                            <Text style={[styles.formatText, { color: r.color }]}>{r.format}</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.arrow, { color: colors.textMuted }]}>›</Text>
                                </View>
                            </GlassCard>
                        </TouchableOpacity>
                    </Animated.View>
                ))}

                {/* Info card */}
                <GlassCard style={styles.infoCard}>
                    <Text style={styles.infoIcon}>ℹ️</Text>
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        PDF reports can be downloaded directly to your device. List reports show paginated data within the app.
                    </Text>
                </GlassCard>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20, paddingBottom: 40 },
    heading: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
    reportCard: { marginBottom: 12, padding: 16 },
    reportRow: { flexDirection: 'row', alignItems: 'center' },
    iconBg: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    icon: { fontSize: 26 },
    reportInfo: { flex: 1 },
    reportTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
    reportDesc: { fontSize: 12, marginBottom: 6 },
    formatBadge: { alignSelf: 'flex-start', borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
    formatText: { fontSize: 10, fontWeight: '700' },
    arrow: { fontSize: 24, marginLeft: 8 },
    infoCard: { padding: 14, flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 },
    infoIcon: { fontSize: 16, marginRight: 10, marginTop: 2 },
    infoText: { fontSize: 12, flex: 1, lineHeight: 18 },
});

export default ReportScreen;
