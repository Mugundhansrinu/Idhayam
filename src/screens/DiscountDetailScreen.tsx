import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, StatusBar,
    ScrollView, ActivityIndicator, Platform
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { getDiscountDetail } from '../api';
import { useSession } from '../context/SessionContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

type Props = { 
    navigation: NativeStackNavigationProp<RootStackParamList, 'DiscountDetail'>;
    route: RouteProp<RootStackParamList, 'DiscountDetail'>;
};

const DiscountDetailScreen: React.FC<Props> = ({ navigation, route }) => {
    const { session } = useSession();
    const { items, type, custType, schemeName } = route.params;
    const [slabData, setSlabData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            try {
                const details = await getDiscountDetail(items, type, session?.custId);
                setSlabData(details || []);
            } catch (error) {
                console.log('Fetch Discount Detail Error:', error);
                setSlabData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [items, type, session?.custId]);

    const formatValidity = (from: string, to: string) => {
        const f = from ? from.split('T')[0] : 'N/A';
        const t = to ? to.split('T')[0] : 'N/A';
        return `${f} TO ${t}`;
    };

    const calculateAchieved = (sale: any, target: any) => {
        const s = parseFloat(sale) || 0;
        const t = parseFloat(target) || 1;
        if (t === 0) return 0;
        return ((s / t) * 100).toFixed(2);
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={20} color="#3861FB" />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={styles.headerTitle}>{schemeName}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator color="#3861FB" size="large" />
                    </View>
                ) : slabData.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Icon name="info-outline" size={60} color="#CBD5E0" />
                        <Text style={styles.emptyText}>No Data Found</Text>
                    </View>
                ) : (
                    slabData.map((slab, sIdx) => {
                        const rawOrderItems = slab?.ORDER_ITEMS || slab?.APP_ITEMS || slab?.APPLICABLE_ITEM || slab?.ITEMS || null;
                        const isSD = type === 'SD';

                        // Parse ORDER_ITEMS — can be JSON array, JSON string, or comma string
                        const parseOrderItems = (val: any): string[] => {
                            if (!val) return [];
                            // Already an array of objects
                            if (Array.isArray(val)) {
                                return val.map((v: any) =>
                                    v?.ITEM_DESC || v?.ITEM_NAME || v?.NAME || v?.IG_DISP || String(v)
                                ).filter(Boolean);
                            }
                            const str = String(val).trim();
                            if (!str || str === 'null') return [];
                            // Try to parse as JSON first
                            try {
                                const parsed = JSON.parse(str);
                                if (Array.isArray(parsed)) {
                                    return parsed.map((v: any) =>
                                        typeof v === 'object'
                                            ? (v?.ITEM_DESC || v?.ITEM_NAME || v?.NAME || v?.IG_DISP || JSON.stringify(v))
                                            : String(v)
                                    ).filter(Boolean);
                                }
                            } catch {}
                            // Fallback: comma-separated string
                            return str.split(',').map((s: string) => s.trim()).filter(Boolean);
                        };

                        const applicableItems = parseOrderItems(rawOrderItems);
                        
                        return (
                            <View key={sIdx} style={styles.card}>
                                <Text style={styles.slabTitle}>{slab?.IG_DISP || schemeName || 'Product Scheme'}</Text>
                                
                                <View style={styles.infoList}>
                                    {isSD && <InfoRow label="QUOTA" value={slab?.REMARKS || slab?.FREE_ITEM_REMARKS || 'N/A'} />}
                                    <InfoRow label="VALIDITY" value={formatValidity(slab?.VALID_FROM, slab?.VALID_TO)} />
                                    {!isSD && type !== 'QD' && (
                                        <>
                                            <InfoRow label="TARGET" value={`${slab?.LTR || '0'} ${slab?.INV_UOM || 'LT'}`} />
                                            <InfoRow label="SALE" value={`${slab?.PERIOD_SALE || '0'} ${slab?.INV_UOM || 'LT'}`} />
                                            <InfoRow label="ADJUSTMENT" value={`${slab?.ADJUSTMENT || '0'} ${slab?.INV_UOM || 'LT'}`} />
                                            <InfoRow label="ADDITIONAL" value={`${slab?.ADDITIONAL || slab?.ADD_LTR || '0'} ${slab?.INV_UOM || 'LT'}`} />
                                        </>
                                    )}
                                    {type === 'QD' && !!slab?.DISCOUNT_DETAIL && (
                                        slab.DISCOUNT_DETAIL.split(',').map((rowStr: string, rIdx: number) => {
                                            const cols = rowStr.split('#');
                                            const from = cols[0]?.trim() || '-';
                                            const to = cols[1]?.trim() || '-';
                                            const rate = cols[2]?.trim() || '-';
                                            return (
                                                <InfoRow
                                                    key={rIdx}
                                                    label="SLAB"
                                                    value={`${from} TO ${to}  —  ${rate}`}
                                                />
                                            );
                                        })
                                    )}
                                </View>

                                {isSD ? (
                                    <View style={styles.tableContainer}>
                                        <View style={styles.tableHeaderGroup}>
                                            <Text style={[styles.tableHeadSub, { flex: 1, paddingVertical: 12 }]}>SALES QUOTA</Text>
                                            <Text style={[styles.tableHeadSub, { flex: 1, paddingVertical: 12, borderLeftWidth: 1, borderColor: '#EDF2F7' }]}>UTILIZED</Text>
                                            <Text style={[styles.tableHeadSub, { flex: 1, paddingVertical: 12, borderLeftWidth: 1, borderColor: '#EDF2F7' }]}>UN UTILIZED</Text>
                                        </View>
                                        <View style={styles.tableRow}>
                                            <Text style={[styles.tableCell, { flex: 1, color: '#E53E3E' }]}>{slab?.SALES_QUOTA || slab?.LTR || '0'} {slab?.INV_UOM || 'LT'}</Text>
                                            <Text style={[styles.tableCell, { flex: 1, color: '#E53E3E', borderLeftWidth: 1, borderColor: '#EDF2F7' }]}>{slab?.UTILIZED || slab?.PERIOD_SALE || '0'} {slab?.INV_UOM || 'LT'}</Text>
                                            <Text style={[styles.tableCell, { flex: 1, color: '#E53E3E', borderLeftWidth: 1, borderColor: '#EDF2F7' }]}>{slab?.UN_UTILIZED || (parseFloat(slab?.LTR || 0) - parseFloat(slab?.PERIOD_SALE || 0)).toFixed(0)} {slab?.INV_UOM || 'LT'}</Text>
                                        </View>
                                    </View>
                                ) : type === 'QD' ? null : (
                                    // Target Discount — ALLOCATION / ACHIEVED
                                    !!slab?.DISCOUNT_DETAIL && (
                                        <View style={styles.tableContainer}>
                                            <View style={styles.tableHeaderGroup}>
                                                <View style={[styles.tableColSpan, { flex: 3 }]}>
                                                    <Text style={styles.tableHeadMain}>ALLOCATION</Text>
                                                    <View style={styles.tableHeadSubRow}>
                                                        <Text style={[styles.tableHeadSub, { flex: 1 }]}>FROM</Text>
                                                        <Text style={[styles.tableHeadSub, { flex: 1 }]}>TO</Text>
                                                        <Text style={[styles.tableHeadSub, { flex: 1 }]}>RATE</Text>
                                                    </View>
                                                </View>
                                                <View style={[styles.tableColSpan, { flex: 1.5, borderLeftWidth: 1, borderColor: '#EDF2F7', justifyContent: 'center' }]}>
                                                    <Text style={styles.tableHeadMain}>ACHIEVED</Text>
                                                    <Text style={styles.tableHeadDesc}>({slab?.PERIOD_SALE || '0'} {slab?.INV_UOM || 'LT'} WITH {calculateAchieved(slab?.PERIOD_SALE, slab?.LTR)}%)</Text>
                                                </View>
                                            </View>
                                            {slab.DISCOUNT_DETAIL.split(',').map((rowStr: string, rIdx: number) => {
                                                const cols = rowStr.split('#');
                                                return (
                                                    <View key={rIdx} style={styles.tableRow}>
                                                        <Text style={[styles.tableCell, { flex: 1 }]}>{cols[0] || '-'}</Text>
                                                        <Text style={[styles.tableCell, { flex: 1 }]}>{cols[1] || '-'}</Text>
                                                        <Text style={[styles.tableCell, { flex: 1 }]}>{cols[2] || '-'}</Text>
                                                        <View style={[styles.tableCellBox, { flex: 1.5, borderLeftWidth: 1, borderColor: '#EDF2F7' }]}>
                                                            <Text style={[styles.tableCell, { width: '100%' }]}>{cols[3] || '-'}</Text>
                                                        </View>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    )
                                )}

                                {applicableItems.length > 0 && type !== 'QD' && (
                                    <View style={styles.appItemsContainer}>
                                        <View style={styles.appLabelBox}>
                                            <Text style={styles.appLabelText}>APPLICABLE ITEMS ({applicableItems.length})</Text>
                                        </View>
                                        <View style={styles.itemsGrid}>
                                            {applicableItems.map((itemName: string, iIdx: number) => (
                                                <View key={iIdx} style={styles.itemBadge}>
                                                    <Text style={styles.itemBadgeText}>{itemName}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
};

const InfoRow = ({ label, value }: any) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoRowLabel}>{label}</Text>
        <Text style={styles.infoRowValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FD' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2 },
    headerTitles: { flex: 1, marginLeft: 15 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A1A' },

    scroll: { paddingHorizontal: 25, paddingBottom: 40, paddingTop: 10 },

    card: { backgroundColor: '#fff', borderRadius: 28, padding: 22, marginBottom: 15, elevation: 3, shadowColor: '#304FFE', shadowOpacity: 0.05, shadowRadius: 15, borderWidth: 1.5, borderColor: 'transparent' },
    slabTitle: { fontSize: 16, fontWeight: '900', color: '#1A1A1A', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 0.5 },
    
    infoList: { marginBottom: 20 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
    infoRowLabel: { flex: 1.2, fontSize: 11, fontWeight: '900', color: '#A0AEC0', letterSpacing: 0.5 },
    infoRowValue: { flex: 2, fontSize: 13, fontWeight: '800', color: '#1A1A1A' },

    tableContainer: { borderWidth: 1.5, borderColor: '#EDF2F7', borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
    tableHeaderGroup: { flexDirection: 'row', backgroundColor: '#F8F9FD', borderBottomWidth: 1.5, borderColor: '#EDF2F7' },
    tableColSpan: { flexDirection: 'column' },
    tableHeadMain: { fontSize: 11, fontWeight: '900', color: '#1A1A1A', textAlign: 'center', paddingVertical: 10, borderBottomWidth: 1.5, borderColor: '#EDF2F7', letterSpacing: 0.5 },
    tableHeadSubRow: { flexDirection: 'row', paddingVertical: 8 },
    tableHeadSub: { fontSize: 10, fontWeight: '900', color: '#718096', textAlign: 'center' },
    tableHeadDesc: { fontSize: 9, fontWeight: '800', color: '#A0AEC0', textAlign: 'center', paddingHorizontal: 4, paddingBottom: 8 },

    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#F1F5F9' },
    tableCellBox: { alignItems: 'center', justifyContent: 'center' },
    tableCell: { fontSize: 13, fontWeight: '800', color: '#E53E3E', textAlign: 'center', paddingVertical: 12 },

    appItemsContainer: { marginTop: 5 },
    appLabelBox: { alignSelf: 'flex-start', backgroundColor: '#FEFCBF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 15 },
    appLabelText: { fontSize: 10, fontWeight: '900', color: '#B7791F', letterSpacing: 0.5 },
    itemsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    itemBadge: { backgroundColor: '#F1F5F9', width: '33.33%', paddingHorizontal: 8, paddingVertical: 10, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
    itemBadgeText: { fontSize: 11, fontWeight: '700', color: '#4A5568', textAlign: 'center' },

    emptyState: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 15, fontWeight: '700', color: '#A0AEC0', marginTop: 15 },
    centerBox: { paddingTop: 60, alignItems: 'center' },
});

export default DiscountDetailScreen;
