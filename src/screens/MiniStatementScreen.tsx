/**
 * MiniStatementScreen – Account Copy / Mini Statement (PDF download)
 */
import React, { useRef, useEffect, useState } from 'react';
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

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'MiniStatement'> };

const TRANSACTIONS = [
    { date: '24 Feb 26', desc: 'Invoice INV-2026-0341', debit: 0, credit: 48200, bal: 352000 },
    { date: '22 Feb 26', desc: 'Payment Received', debit: 75000, credit: 0, bal: 303800 },
    { date: '18 Feb 26', desc: 'Invoice INV-2026-0289', debit: 0, credit: 31500, bal: 378800 },
    { date: '15 Feb 26', desc: 'Credit Note CN-0032', debit: 2400, credit: 0, bal: 347300 },
    { date: '10 Feb 26', desc: 'Invoice INV-2026-0244', debit: 0, credit: 72800, bal: 349700 },
    { date: '05 Feb 26', desc: 'Payment Received', debit: 100000, credit: 0, bal: 276900 },
    { date: '02 Feb 26', desc: 'Invoice INV-2026-0201', debit: 0, credit: 19400, bal: 376900 },
];

const MiniStatementScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const listAnim = useRef(new Animated.Value(0)).current;
    const headerScale = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(listAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.spring(headerScale, { toValue: 1, friction: 6, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleDownloadPDF = () => {
        Alert.alert('Account Copy PDF', 'Your account statement PDF is being generated and will be downloaded shortly.', [{ text: 'OK' }]);
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <LinearGradient colors={[BrandColors.blue900, BrandColors.blue800, '#0a1a4e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <OilFlowBackground />
            <GlassHeader
                title="Account Copy"
                subtitle="Mini Statement"
                onBack={() => navigation.goBack()}
                rightIcon={
                    <TouchableOpacity onPress={handleDownloadPDF} style={styles.downloadBtn}>
                        <Text style={styles.downloadIcon}>⬇️</Text>
                    </TouchableOpacity>
                }
            />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Account Summary */}
                <Animated.View style={{ transform: [{ scale: headerScale }] }}>
                    <GlassCard accentLine style={styles.accountCard}>
                        <View style={styles.accountRow}>
                            <View>
                                <Text style={[styles.accountName, { color: colors.textPrimary }]}>Your Account</Text>
                                <Text style={[styles.accountId, { color: colors.textSecondary }]}>DIST-2024-MKT-087</Text>
                            </View>
                            <View style={styles.balanceBox}>
                                <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>Outstanding</Text>
                                <Text style={[styles.balanceValue, { color: BrandColors.yellow500 }]}>₹3,52,000</Text>
                            </View>
                        </View>
                        <View style={[styles.accountDivider, { backgroundColor: colors.divider }]} />
                        <View style={styles.accountStats}>
                            {[
                                { label: 'Credit Limit', value: '₹5,00,000', color: '#22C55E' },
                                { label: 'Used', value: '70%', color: BrandColors.yellow500 },
                                { label: 'Available', value: '₹1,48,000', color: BrandColors.blue400 },
                            ].map((s, i) => (
                                <View key={i} style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
                                </View>
                            ))}
                        </View>
                        {/* Credit utilization bar */}
                        <View style={[styles.utilBg, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                            <LinearGradient
                                colors={[BrandColors.yellow500, BrandColors.red600]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={[styles.utilFill, { width: '70%' }]}
                            />
                        </View>
                    </GlassCard>
                </Animated.View>

                {/* Transactions */}
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Transactions</Text>

                {/* Column headers */}
                <View style={[styles.colHeader, { borderBottomColor: colors.divider }]}>
                    <Text style={[styles.colDate, { color: colors.textMuted }]}>DATE</Text>
                    <Text style={[styles.colDesc, { color: colors.textMuted }]}>DESCRIPTION</Text>
                    <Text style={[styles.colDebit, { color: colors.textMuted }]}>DR</Text>
                    <Text style={[styles.colCredit, { color: colors.textMuted }]}>CR</Text>
                    <Text style={[styles.colBal, { color: colors.textMuted }]}>BAL</Text>
                </View>

                {TRANSACTIONS.map((tx, i) => (
                    <Animated.View key={i} style={{
                        opacity: listAnim,
                        transform: [{ translateX: listAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
                    }}>
                        <GlassCard style={styles.txCard}>
                            <View style={styles.txRow}>
                                <Text style={[styles.txDate, { color: colors.textMuted }]}>{tx.date}</Text>
                                <Text style={[styles.txDesc, { color: colors.textPrimary }]} numberOfLines={2}>{tx.desc}</Text>
                                <Text style={[styles.txAmt, { color: tx.debit ? BrandColors.red600 : 'transparent' }]}>
                                    {tx.debit ? `₹${(tx.debit / 1000).toFixed(0)}K` : ''}
                                </Text>
                                <Text style={[styles.txAmt, { color: tx.credit ? '#22C55E' : 'transparent' }]}>
                                    {tx.credit ? `₹${(tx.credit / 1000).toFixed(0)}K` : ''}
                                </Text>
                                <Text style={[styles.txBal, { color: BrandColors.yellow500 }]}>
                                    ₹{(tx.bal / 1000).toFixed(0)}K
                                </Text>
                            </View>
                        </GlassCard>
                    </Animated.View>
                ))}

                {/* Download Card */}
                <TouchableOpacity onPress={handleDownloadPDF} activeOpacity={0.85}>
                    <LinearGradient
                        colors={[BrandColors.blue700, BrandColors.blue500]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.downloadFullBtn}>
                        <Text style={styles.downloadFullIcon}>📄</Text>
                        <Text style={styles.downloadFullText}>Download Full Account Copy (PDF)</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 16, paddingBottom: 40 },
    accountCard: { marginBottom: 20 },
    accountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    accountName: { fontSize: 16, fontWeight: '700' },
    accountId: { fontSize: 11, marginTop: 2 },
    balanceBox: { alignItems: 'flex-end' },
    balanceLabel: { fontSize: 10, letterSpacing: 0.3 },
    balanceValue: { fontSize: 20, fontWeight: '800' },
    accountDivider: { height: 1, marginBottom: 14 },
    accountStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 14, fontWeight: '700' },
    statLabel: { fontSize: 9, marginTop: 2 },
    utilBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
    utilFill: { height: '100%', borderRadius: 3 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
    colHeader: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 6, borderBottomWidth: 1, marginBottom: 6 },
    colDate: { width: 50, fontSize: 9, fontWeight: '700' },
    colDesc: { flex: 1, fontSize: 9, fontWeight: '700' },
    colDebit: { width: 38, fontSize: 9, fontWeight: '700', textAlign: 'right' },
    colCredit: { width: 38, fontSize: 9, fontWeight: '700', textAlign: 'right' },
    colBal: { width: 42, fontSize: 9, fontWeight: '700', textAlign: 'right' },
    txCard: { marginBottom: 6, padding: 10, paddingVertical: 8 },
    txRow: { flexDirection: 'row', alignItems: 'center' },
    txDate: { width: 50, fontSize: 9 },
    txDesc: { flex: 1, fontSize: 10 },
    txAmt: { width: 38, fontSize: 10, fontWeight: '600', textAlign: 'right' },
    txBal: { width: 42, fontSize: 10, fontWeight: '700', textAlign: 'right' },
    downloadBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    downloadIcon: { fontSize: 18 },
    downloadFullBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 8 },
    downloadFullIcon: { fontSize: 18 },
    downloadFullText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

export default MiniStatementScreen;
