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
                        const appItemsRaw = slab?.APP_ITEMS || slab?.APPLICABLE_ITEM || slab?.ITEMS || '';
                        const isSD = type === 'SD';
                        
                        return (
                            <View key={sIdx} style={styles.card}>
                                <Text style={styles.slabTitle}>{slab?.IG_DISP || schemeName || 'Product Scheme'}</Text>
                                
                                <View style={styles.infoList}>
                                    {isSD && <InfoRow label="QUOTA" value={slab?.REMARKS || slab?.FREE_ITEM_REMARKS || 'N/A'} />}
                                    <InfoRow label="VALIDITY" value={formatValidity(slab?.VALID_FROM, slab?.VALID_TO)} />
                                    {!isSD && (
                                        <>
                                            <InfoRow label="TARGET" value={`${slab?.LTR || '0'} LT`} />
                                            <InfoRow label="SALE" value={`${slab?.PERIOD_SALE || '0'} LT`} />
                                            <InfoRow label="ADJUSTMENT" value={`${slab?.ADJUSTMENT || '0'} LT`} />
                                            <InfoRow label="ADDITIONAL" value={`${slab?.ADDITIONAL || slab?.ADD_LTR || '0'} LT`} />
                                        </>
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
                                            <Text style={[styles.tableCell, { flex: 1, color: '#E53E3E' }]}>{slab?.SALES_QUOTA || slab?.LTR || '0'}LT</Text>
                                            <Text style={[styles.tableCell, { flex: 1, color: '#E53E3E', borderLeftWidth: 1, borderColor: '#EDF2F7' }]}>{slab?.UTILIZED || slab?.PERIOD_SALE || '0'}LT</Text>
                                            <Text style={[styles.tableCell, { flex: 1, color: '#E53E3E', borderLeftWidth: 1, borderColor: '#EDF2F7' }]}>{slab?.UN_UTILIZED || (parseFloat(slab?.LTR || 0) - parseFloat(slab?.PERIOD_SALE || 0)).toFixed(0)}LT</Text>
                                        </View>
                                    </View>
                                ) : (
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
                                                    <Text style={styles.tableHeadDesc}>({slab?.PERIOD_SALE || '0'} LT WITH {calculateAchieved(slab?.PERIOD_SALE, slab?.LTR)}%)</Text>
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

                                {!!appItemsRaw && (
                                    <View style={styles.appItemsContainer}>
                                        <View style={styles.appLabelBox}>
                                            <Text style={styles.appLabelText}>APPLICABLE ITEM</Text>
                                        </View>
                                        <View style={styles.itemsGrid}>
                                            {String(appItemsRaw).split(',').map((item, iIdx) => (
                                                <View key={iIdx} style={styles.itemBadge}>
                                                    <Text style={styles.itemBadgeText}>{item.trim()}</Text>
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
    itemsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
    itemBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, margin: 4, flexBasis: '47%', borderWidth: 1, borderColor: '#E2E8F0' },
    itemBadgeText: { fontSize: 11, fontWeight: '700', color: '#4A5568' },

    emptyState: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 15, fontWeight: '700', color: '#A0AEC0', marginTop: 15 },
    centerBox: { paddingTop: 60, alignItems: 'center' },
});

export default DiscountDetailScreen;
