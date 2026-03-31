import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, StatusBar,
    ScrollView, ActivityIndicator, Dimensions, Platform, LayoutAnimation,
} from 'react-native';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getDiscountSummary, getDiscountDetail } from '../api';
import { useSession } from '../context/SessionContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Discount'> };

const DiscountScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const { session } = useSession();
    const [schemeData, setSchemeData] = useState<any[]>([]);
    const [loadingDiscount, setLoadingDiscount] = useState(true);
    const [slabData, setSlabData] = useState<Record<number, any[]>>({});
    const [loadingSlabs, setLoadingSlabs] = useState<Record<number, boolean>>({});
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    useEffect(() => {
        getDiscountSummary(session?.custId)
            .then(data => {
                const rows = Array.isArray(data) ? data : (data?.data ?? []);
                const mapped = rows.map((r: any) => ({
                    type: String(r?.DMOBNO || ''),
                    custType: String(r?.NAME || ''),
                    items: String(r?.MOBNO || ''),
                }));
                setSchemeData(mapped);
            })
            .catch(() => setSchemeData([]))
            .finally(() => setLoadingDiscount(false));
    }, [session?.custId]);

    const toggleScheme = async (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (expandedIndex === index) {
            setExpandedIndex(null);
            return;
        }
        setExpandedIndex(index);
        if (!slabData[index]) {
            setLoadingSlabs(prev => ({ ...prev, [index]: true }));
            try {
                const scheme = schemeData[index];
                const details = await getDiscountDetail(scheme.items, scheme.type, session?.custId);
                setSlabData(prev => ({ ...prev, [index]: details || [] }));
            } catch (error) {
                console.error('Fetch Discount Detail Error:', error);
            } finally {
                setLoadingSlabs(prev => ({ ...prev, [index]: false }));
            }
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={20} color="#3861FB" />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={styles.headerTitle}>Discount Details</Text>
                    <Text style={styles.headerSub}>Active schemes & offers</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.noticeBox}>
                    <Icon name="stars" size={20} color="#3861FB" style={{ marginRight: 12 }} />
                    <Text style={styles.noticeText}>
                        Tap on a scheme to view detailed slab information and eligibility.
                    </Text>
                </View>

                {loadingDiscount ? (
                    <View style={styles.centerBox}><ActivityIndicator color="#3861FB" size="large" /></View>
                ) : schemeData.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Icon name="label-off" size={60} color="#CBD5E0" />
                        <Text style={styles.emptyText}>No active discounts found</Text>
                    </View>
                ) : (
                    schemeData.map((s, i) => (
                        <TouchableOpacity activeOpacity={0.9} key={i} onPress={() => toggleScheme(i)} style={[styles.card, expandedIndex === i && styles.cardExpanded]}>
                            <View style={styles.schemeHeader}>
                                <View style={styles.schemeInfo}>
                                    <View style={styles.typeBadge}>
                                        <Text style={styles.typeText}>{s.type}</Text>
                                    </View>
                                    <Text style={styles.schemeName}>{s.type === 'SD' ? 'Scheme Discount' : s.type === 'TD' ? 'Target Discount' : s.type === 'QD' ? 'Quantity Discount' : (s.type || 'Standard Scheme')}</Text>
                                </View>
                                <Icon name={expandedIndex === i ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={24} color={expandedIndex === i ? "#3861FB" : "#CBD5E0"} />
                            </View>
                            
                            {!!s.custType && <Text style={styles.custType}>Applicable for: {s.custType}</Text>}

                            {expandedIndex === i && (
                                <View style={styles.detailArea}>
                                    <View style={styles.cardDivider} />
                                    {loadingSlabs[i] ? (
                                        <ActivityIndicator color="#3861FB" style={{ padding: 20 }} />
                                    ) : (
                                        (slabData[i] || []).map((slab, sIdx) => (
                                            <View key={sIdx} style={styles.slabBox}>
                                                <Text style={styles.slabTitle}>{slab?.IG_DISP || 'Product Scheme'}</Text>
                                                <View style={styles.infoGrid}>
                                                    <InfoItem label="VALID FROM" value={slab?.VALID_FROM?.split('T')[0] || 'N/A'} />
                                                    <InfoItem label="VALID TO" value={slab?.VALID_TO?.split('T')[0] || 'N/A'} />
                                                    <InfoItem label="TARGET" value={`${slab?.LTR || '0'} LT`} />
                                                    <InfoItem label="SALE" value={`${slab?.PERIOD_SALE || '0'} LT`} />
                                                </View>
                                                {slab?.DISCOUNT_DETAIL && (
                                                    <View style={styles.detailBadge}>
                                                        <Text style={styles.detailBadgeText}>{slab.DISCOUNT_DETAIL.replace(/#/g, ' → ')}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        ))
                                    )}
                                </View>
                            )}
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const InfoItem = ({ label, value }: any) => (
    <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FD' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2 },
    headerTitles: { flex: 1, marginLeft: 15 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A1A' },
    headerSub: { fontSize: 13, color: '#A0AEC0', fontWeight: '600', marginTop: 2 },
    helpBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2 },

    scroll: { paddingHorizontal: 25, paddingBottom: 40 },
    noticeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4FF', borderRadius: 20, padding: 18, marginBottom: 25 },
    noticeText: { flex: 1, fontSize: 12, lineHeight: 18, color: '#3861FB', fontWeight: '800' },

    card: { backgroundColor: '#fff', borderRadius: 28, padding: 22, marginBottom: 15, elevation: 3, shadowColor: '#304FFE', shadowOpacity: 0.05, shadowRadius: 15, borderWidth: 1.5, borderColor: 'transparent' },
    cardExpanded: { borderColor: '#3861FB', elevation: 12, shadowOpacity: 0.15 },
    schemeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    schemeInfo: { flex: 1 },
    typeBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
    typeText: { fontSize: 10, fontWeight: '900', color: '#64748B' },
    schemeName: { fontSize: 17, fontWeight: '900', color: '#1A1A1A' },
    custType: { fontSize: 13, color: '#A0AEC0', fontWeight: '600', marginTop: 5 },

    detailArea: { marginTop: 20 },
    cardDivider: { height: 1.5, backgroundColor: '#F1F5F9', marginBottom: 20 },
    slabBox: { marginBottom: 20 },
    slabTitle: { fontSize: 14, fontWeight: '900', color: '#3861FB', textTransform: 'uppercase', marginBottom: 12 },
    infoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    infoItem: { width: '50%', marginBottom: 15 },
    infoLabel: { fontSize: 9, fontWeight: '900', color: '#A0AEC0', letterSpacing: 0.5, marginBottom: 4 },
    infoValue: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
    detailBadge: { backgroundColor: '#F8F9FD', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#EDF2F7' },
    detailBadgeText: { fontSize: 11, color: '#718096', fontWeight: '700', lineHeight: 16 },

    emptyState: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 15, fontWeight: '700', color: '#A0AEC0', marginTop: 15 },
    centerBox: { paddingTop: 60, alignItems: 'center' },
});

export default DiscountScreen;
