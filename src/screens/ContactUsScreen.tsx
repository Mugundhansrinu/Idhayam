import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    ScrollView,
    Linking,
    Alert,
    ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import GlassHeader from '../components/GlassHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getContactInfo } from '../api';
import { useSession } from '../context/SessionContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'ContactUs'> };

const ContactUsScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const { session } = useSession();
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchContactInfo();
    }, []);

    const fetchContactInfo = async () => {
        setLoading(true);
        setError('');
        try {
            const custId   = session?.custId   || undefined;
            const branchId = session?.branchId || undefined;
            const custType = session?.custType || undefined;
            const result = await getContactInfo(custId, branchId, custType);
            if (Array.isArray(result) && result.length > 0) {
                setContacts(result);
            } else {
                setError('No contact details available.');
            }
        } catch (e) {
            console.error('ContactUs fetch error:', e);
            setError('Failed to load contact details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = async (url: string, label: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', `Cannot open ${label}`);
            }
        } catch {
            Alert.alert('Error', `Unable to open ${label}`);
        }
    };

    // APP_Contact returns: A=Name1, B=Phone1, C=Name2, D=Phone2, E-J=extra fields
    const buildRows = (c: any) => {
        const rows: { iconName: string; label: string; value: string; sublabel: string; action: string; color: string }[] = [];

        const COLORS    = ['#7B61FF', '#27AE60', '#FD79A8', '#0984E3', '#E3001B'];
        const ROLES     = ['Technical Support', 'Office Support', 'Support', 'Support', 'Support'];
        const ICONS     = ['headset-mic', 'work', 'call', 'call', 'call'];

        const pairs = [
            { name: c.A, phone: c.B },
            { name: c.C, phone: c.D },
            { name: c.E, phone: c.F },
            { name: c.G, phone: c.H },
            { name: c.I, phone: c.J },
        ];

        pairs.forEach(({ name, phone }, i) => {
            if (phone) {
                rows.push({
                    iconName: ICONS[i] || 'call',
                    label:    name  || `Contact ${i + 1}`,
                    sublabel: ROLES[i] || 'Support',
                    value:    phone,
                    action:   `tel:${String(phone).replace(/\s/g, '')}`,
                    color:    COLORS[i % COLORS.length],
                });
            }
        });

        return rows;
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            <GlassHeader
                title="Contact Us"
                subtitle="We're here to help you"
                onBack={() => navigation.goBack()}
                gradientColors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
            />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Loading */}
                {loading && (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color={BrandColors.primaryGradientStart} />
                        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                            Loading contact details...
                        </Text>
                    </View>
                )}

                {/* Error */}
                {!loading && error !== '' && (
                    <View style={[styles.errorBox, { backgroundColor: '#FF4D4D10', borderColor: '#FF4D4D30' }]}>
                        <Text style={styles.errorIcon}>⚠️</Text>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={fetchContactInfo} style={styles.retryBtn}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Dynamic contact rows from API */}
                {!loading && contacts.map((c, ci) => {
                    const rows = buildRows(c);
                    const sectionName = c.DEPT_NAME ?? c.HUB_NAME ?? c.SECTION ?? '';
                    return (
                        <View key={ci}>
                            {sectionName ? (
                                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                                    {sectionName}
                                </Text>
                            ) : null}
                            {rows.map((row, ri) => (
                                <TouchableOpacity
                                    key={ri}
                                    onPress={() => handleOpen(row.action, row.label)}
                                    activeOpacity={0.8}
                                    style={styles.contactCard}>
                                    <View style={[styles.iconBox, { backgroundColor: row.color + '15' }]}>
                                        <Icon name={row.iconName} size={32} color={row.color} />
                                    </View>
                                    <View style={styles.contactInfo}>
                                        <View style={[styles.roleBadge, { backgroundColor: row.color + '18' }]}>
                                            <Text style={[styles.roleText, { color: row.color }]}>
                                                {row.sublabel}
                                            </Text>
                                        </View>
                                        <Text style={[styles.contactName, { color: colors.textPrimary }]}>
                                            {row.label}
                                        </Text>
                                        <Text style={[styles.contactValue, { color: colors.textSecondary }]}>
                                            {row.value}
                                        </Text>
                                    </View>
                                    <View style={[styles.actionBtn, { backgroundColor: row.color + '10' }]}>
                                        <Text style={[styles.actionBtnText, { color: row.color }]}>CALL</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    );
                })}

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textMuted }]}>
                        v6.8 • Idhayam Distributor App
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20, paddingBottom: 60 },

    heroCard: { width: '100%', height: 140, borderRadius: 28, overflow: 'hidden', marginBottom: 25, elevation: 5, shadowColor: BrandColors.primaryGradientStart, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
    heroGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    heroTitle: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: 8 },
    heroSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '800', marginTop: 8, letterSpacing: 2 },

    centerBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    loadingText: { marginTop: 16, fontSize: 14, fontWeight: '600' },

    errorBox: { borderRadius: 20, borderWidth: 1, padding: 25, alignItems: 'center', marginBottom: 20 },
    errorIcon: { fontSize: 28, marginBottom: 10 },
    errorText: { fontSize: 14, fontWeight: '600', color: '#FF4D4D', textAlign: 'center', marginBottom: 16 },
    retryBtn: { backgroundColor: '#FF4D4D', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
    retryText: { color: '#fff', fontWeight: '800', fontSize: 13 },

    sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: 5 },

    contactCard: { backgroundColor: '#fff', borderRadius: 24, padding: 18, marginBottom: 15, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    iconBox: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    icon: { fontSize: 22 },
    contactInfo: { flex: 1 },
    contactName: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
    roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 4 },
    roleText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
    contactLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
    contactValue: { fontSize: 16, fontWeight: '600' },
    actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    actionBtnText: { fontSize: 11, fontWeight: '800' },

    footer: { alignItems: 'center', marginTop: 40 },
    footerText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
});

export default ContactUsScreen;
