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
    Clipboard,
    Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import GlassHeader from '../components/GlassHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

const { width } = Dimensions.get('window');

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
        color: '#7B61FF',
    },
    {
        bank: 'HDFC Bank',
        accountName: 'Idhayam Corporation Pvt Ltd',
        accountNo: '50100244785932',
        ifsc: 'HDFC0001234',
        branch: 'T Nagar, Chennai',
        type: 'Current Account',
        icon: '🏛️',
        color: '#FD79A8',
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
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
                <Text style={[styles.fieldValue, { color: colors.textPrimary }]}>{value}</Text>
            </View>
            <Text style={{ fontSize: 16 }}>📋</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            
            <GlassHeader title="Bank Details" subtitle="Company accounts for payment" onBack={() => navigation.goBack()} gradientColors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]} />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={[styles.notice, { backgroundColor: BrandColors.primaryGradientStart + '10', borderColor: BrandColors.primaryGradientStart + '30' }]}>
                    <Text style={styles.noticeIcon}>⚠️</Text>
                    <Text style={[styles.noticeText, { color: BrandColors.primaryGradientStart }]}>
                        Always verify bank details before making any payment. Tap any field to copy.
                    </Text>
                </View>

                {BANKS.map((bank, i) => (
                    <Animated.View key={i} style={{
                        opacity: anims[i],
                        transform: [{ translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
                    }}>
                        <View style={styles.bankCard}>
                            <View style={styles.bankHeader}>
                                <View style={[styles.bankIconBg, { backgroundColor: bank.color + '15' }]}>
                                    <Text style={styles.bankIcon}>{bank.icon}</Text>
                                </View>
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
                        </View>
                    </Animated.View>
                ))}

                <View style={[styles.upiCard, { backgroundColor: colors.inputBackground }]}>
                    <View style={styles.upiRow}>
                        <Text style={styles.upiIcon}>📲</Text>
                        <View>
                            <Text style={[styles.upiTitle, { color: colors.textPrimary }]}>UPI Payment ID</Text>
                            <TouchableOpacity onPress={() => copyToClipboard('idhayam@sbi', 'UPI ID')} activeOpacity={0.7}>
                                <Text style={[styles.upiId, { color: BrandColors.primaryGradientStart }]}>idhayam@sbi  📋</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
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
    bankCard: { backgroundColor: '#fff', borderRadius: 28, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    bankHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    bankIconBg: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    bankIcon: { fontSize: 26 },
    bankTitle: { flex: 1 },
    bankName: { fontSize: 17, fontWeight: '900' },
    bankType: { fontSize: 12, fontWeight: '600', marginTop: 2 },
    divider: { height: 1, marginBottom: 15 },
    fieldRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    fieldInfo: { flex: 1 },
    fieldLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    fieldValue: { fontSize: 15, fontWeight: '700' },
    fieldDivider: { height: 1, opacity: 0.5 },
    upiCard: { padding: 25, borderRadius: 28, marginTop: 10 },
    upiRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
    upiIcon: { fontSize: 40 },
    upiTitle: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
    upiId: { fontSize: 18, fontWeight: '900' },
});

export default BankDetailsScreen;
