/**
 * BankDetailsScreen – Company bank details for payment
 */
import React, { useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, StatusBar,
    Animated, ScrollView, Alert, Clipboard,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import OilFlowBackground from '../components/OilFlowBackground';
import GlassCard from '../components/GlassCard';
import GlassHeader from '../components/GlassHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'BankDetails'> };

const BANKS = [
    {
        bank: 'State Bank of India',
        accountName: 'Idhayam Corporation Pvt Ltd',
        accountNo: '32145678901234',
        ifsc: 'SBIN0012345',
        branch: 'Anna Salai, Chennai',
        type: 'Current Account',
        icon: '🏦',
        color: '#1A5276',
    },
    {
        bank: 'HDFC Bank',
        accountName: 'Idhayam Corporation Pvt Ltd',
        accountNo: '50100244785932',
        ifsc: 'HDFC0001234',
        branch: 'T Nagar, Chennai',
        type: 'Current Account',
        icon: '🏛️',
        color: '#943126',
    },
    {
        bank: 'ICICI Bank',
        accountName: 'Idhayam Exports Ltd',
        accountNo: '001105011879',
        ifsc: 'ICIC0000011',
        branch: 'Nugambakkam, Chennai',
        type: 'Current Account',
        icon: '🏢',
        color: '#7D6608',
    },
];

const BankDetailsScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const anims = useRef(BANKS.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        Animated.stagger(150, anims.map(a =>
            Animated.spring(a, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true })
        )).start();
    }, []);

    const copyToClipboard = (text: string, label: string) => {
        Clipboard.setString(text);
        Alert.alert('Copied!', `${label} copied to clipboard.`);
    };

    const CopyField = ({ label, value }: { label: string; value: string }) => (
        <TouchableOpacity style={styles.fieldRow} onPress={() => copyToClipboard(value, label)} activeOpacity={0.7}>
            <View style={styles.fieldInfo}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
                <Text style={[styles.fieldValue, { color: colors.textPrimary }]}>{value}</Text>
            </View>
            <Text style={[styles.copyIcon, { color: colors.textLink }]}>📋</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <LinearGradient colors={[BrandColors.blue900, BrandColors.blue800, '#0a1a4e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <OilFlowBackground />
            <GlassHeader title="Bank Details" subtitle="Company bank accounts for payment" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={[styles.notice, { backgroundColor: BrandColors.yellow500 + '22', borderColor: BrandColors.yellow500 + '55' }]}>
                    <Text style={styles.noticeIcon}>⚠️</Text>
                    <Text style={[styles.noticeText, { color: BrandColors.yellow500 }]}>
                        Always verify bank details before making any payment. Tap any field to copy.
                    </Text>
                </View>

                {BANKS.map((bank, i) => (
                    <Animated.View key={i} style={{
                        opacity: anims[i],
                        transform: [{ translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
                    }}>
                        <GlassCard accentLine style={styles.bankCard}>
                            <View style={styles.bankHeader}>
                                <LinearGradient colors={[bank.color + '55', bank.color + '22']} style={styles.bankIconBg}>
                                    <Text style={styles.bankIcon}>{bank.icon}</Text>
                                </LinearGradient>
                                <View style={styles.bankTitle}>
                                    <Text style={[styles.bankName, { color: colors.textPrimary }]}>{bank.bank}</Text>
                                    <Text style={[styles.bankType, { color: colors.textSecondary }]}>{bank.type}</Text>
                                </View>
                            </View>

                            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

                            <CopyField label="Account Name" value={bank.accountName} />
                            <View style={[styles.fieldDivider, { backgroundColor: colors.divider }]} />
                            <CopyField label="Account Number" value={bank.accountNo} />
                            <View style={[styles.fieldDivider, { backgroundColor: colors.divider }]} />
                            <CopyField label="IFSC Code" value={bank.ifsc} />
                            <View style={[styles.fieldDivider, { backgroundColor: colors.divider }]} />
                            <CopyField label="Branch" value={bank.branch} />
                        </GlassCard>
                    </Animated.View>
                ))}

                {/* UPI Info */}
                <GlassCard style={styles.upiCard}>
                    <View style={styles.upiRow}>
                        <Text style={styles.upiIcon}>📲</Text>
                        <View>
                            <Text style={[styles.upiTitle, { color: colors.textPrimary }]}>UPI Payment</Text>
                            <TouchableOpacity onPress={() => copyToClipboard('idhayam@sbi', 'UPI ID')} activeOpacity={0.7}>
                                <Text style={[styles.upiId, { color: BrandColors.yellow500 }]}>idhayam@sbi  📋</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </GlassCard>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 16, paddingBottom: 40 },
    notice: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16, gap: 8 },
    noticeIcon: { fontSize: 16 },
    noticeText: { flex: 1, fontSize: 11, lineHeight: 16 },
    bankCard: { marginBottom: 16 },
    bankHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    bankIconBg: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    bankIcon: { fontSize: 24 },
    bankTitle: { flex: 1 },
    bankName: { fontSize: 15, fontWeight: '700' },
    bankType: { fontSize: 11, marginTop: 2 },
    divider: { height: 1, marginBottom: 12 },
    fieldRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    fieldInfo: { flex: 1 },
    fieldLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    fieldValue: { fontSize: 14, fontWeight: '600' },
    copyIcon: { fontSize: 16, marginLeft: 8 },
    fieldDivider: { height: 1 },
    upiCard: { padding: 16 },
    upiRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    upiIcon: { fontSize: 32 },
    upiTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
    upiId: { fontSize: 15, fontWeight: '700' },
});

export default BankDetailsScreen;
