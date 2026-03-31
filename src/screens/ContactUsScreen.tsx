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
    Dimensions,
    Platform,
} from 'react-native';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getContactInfo } from '../api';
import { useSession } from '../context/SessionContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

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
            setError('Failed to load contact details.');
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

    const buildRows = (c: any) => {
        const rows: any[] = [];
        const ROLES     = ['Technical Support', 'Office Support', 'Field Support', 'Relationship Mgr', 'General Care'];
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
                    role: ROLES[i] || 'Support',
                    name: name || `Contact Person ${i + 1}`,
                    phone: phone,
                    action: `tel:${String(phone).replace(/\s/g, '')}`,
                });
            }
        });
        return rows;
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={20} color="#3861FB" />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={styles.headerTitle}>Contact Us</Text>
                    <Text style={styles.headerSub}>Help is just a call away</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>


                {loading ? (
                    <View style={styles.centerBox}><ActivityIndicator color="#3861FB" size="large" /></View>
                ) : error ? (
                    <View style={styles.errorBox}>
                        <Icon name="error-outline" size={40} color="#E3001B" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={fetchContactInfo} style={styles.retryBtn}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    contacts.map((c, ci) => {
                        const rows = buildRows(c);
                        const sectionName = c.DEPT_NAME ?? c.HUB_NAME ?? c.SECTION ?? 'Helpdesk';
                        return (
                            <View key={ci} style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <View style={styles.sectionLine} />
                                    <Text style={styles.sectionTitle}>{sectionName}</Text>
                                    <View style={styles.sectionLine} />
                                </View>
                                {rows.map((row, ri) => (
                                    <TouchableOpacity
                                        key={ri}
                                        onPress={() => handleOpen(row.action, row.name)}
                                        activeOpacity={0.8}
                                        style={styles.contactCard}>
                                        <View style={styles.contactMain}>
                                            <View style={styles.roleBadge}>
                                                <Text style={styles.roleText}>{row.role}</Text>
                                            </View>
                                            <Text style={styles.contactName}>{row.name}</Text>
                                            <Text style={styles.contactPhone}>{row.phone}</Text>
                                        </View>
                                        <View style={styles.callCircle}>
                                            <Icon name="call" size={24} color="#fff" />
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        );
                    })
                )}

                <View style={styles.footerNote}>
                    <Text style={styles.verText}>Version 6.8 • Idhayam Distributor App</Text>
                    <Text style={styles.copyrightText}>© 2026 MUTHURAJA FOOD PRODUCTS</Text>
                </View>
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
    heroBox: { backgroundColor: '#3861FB', borderRadius: 32, padding: 30, flexDirection: 'row', alignItems: 'center', marginBottom: 30, elevation: 10, shadowColor: '#3861FB', shadowOpacity: 0.2, shadowRadius: 15 },
    heroIconBox: { width: 80, height: 80, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    heroText: { flex: 1, marginLeft: 20 },
    heroTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
    heroSubText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 6, lineHeight: 18 },

    section: { marginBottom: 25 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    sectionLine: { flex: 1, height: 1.5, backgroundColor: '#EDF2F7' },
    sectionTitle: { paddingHorizontal: 15, fontSize: 11, fontWeight: '900', color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: 1 },

    contactCard: { backgroundColor: '#fff', borderRadius: 28, padding: 22, marginBottom: 15, flexDirection: 'row', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10 },
    contactMain: { flex: 1 },
    roleBadge: { backgroundColor: '#F0F4FF', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 10 },
    roleText: { fontSize: 10, fontWeight: '900', color: '#3861FB', textTransform: 'uppercase' },
    contactName: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
    contactPhone: { fontSize: 14, color: '#718096', fontWeight: '700', marginTop: 4 },
    callCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#00B894', alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#00B894', shadowOpacity: 0.2, shadowRadius: 10 },

    centerBox: { paddingTop: 60, alignItems: 'center' },
    errorBox: { alignItems: 'center', paddingVertical: 40 },
    errorText: { marginTop: 15, fontSize: 14, color: '#E3001B', fontWeight: '700', marginBottom: 20 },
    retryBtn: { backgroundColor: '#E3001B', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 12 },
    retryText: { color: '#fff', fontWeight: '900' },

    footerNote: { alignItems: 'center', marginTop: 20 },
    verText: { fontSize: 12, fontWeight: '900', color: '#CBD5E0' },
    copyrightText: { fontSize: 10, fontWeight: '700', color: '#CBD5E0', marginTop: 5 },
});

export default ContactUsScreen;
