/**
 * DiscountScreen
 */
import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, StatusBar,
    ScrollView, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import GlassCard from '../components/GlassCard';
import GlassHeader from '../components/GlassHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getDiscountSummary, getDiscountDetail } from '../api';
import { useSession } from '../context/SessionContext';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Discount'> };

const DiscountScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const { session } = useSession();
    const [schemeData, setSchemeData] = useState<any[]>([]);
    const [loadingDiscount, setLoadingDiscount] = useState(true);

    // Track fetched details for each card
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
            .catch(err => {
                console.warn('Discount Fetch Error:', err);
                setSchemeData([]);
            })
            .finally(() => setLoadingDiscount(false));
    }, [session?.custId]);

    const toggleScheme = async (index: number) => {
        if (expandedIndex === index) {
            setExpandedIndex(null);
            return;
        }

        setExpandedIndex(index);
        
        // Fetch details if not already loaded
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
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
            <GlassHeader 
                title="Discount Details" 
                subtitle="Your current discount schemes" 
                onBack={() => navigation.goBack()} 
                gradientColors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]} 
            />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={{ height: 20 }} />
                {loadingDiscount ? (
                    <ActivityIndicator 
                        color={BrandColors.primaryGradientStart} 
                        size="large" 
                        style={{ marginTop: 40 }} 
                    />
                ) : schemeData.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>🏷️</Text>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            No discount schemes found.
                        </Text>
                    </View>
                ) : (
                    schemeData.map((s, i) => {
                        const isExpanded = expandedIndex === i;
                        const slabs = slabData[i] || [];
                        const loadingThis = loadingSlabs[i];

                        return (
                            <TouchableOpacity activeOpacity={0.9} key={i} onPress={() => toggleScheme(i)}>
                                <GlassCard style={styles.card} accentLine={isExpanded}>
                                    <View style={styles.schemeHeader}>
                                        <Text style={[styles.schemeProd, { color: colors.textPrimary }]}>
                                            {String(s.type === 'SD' ? 'Scheme Discount' : s.type === 'TD' ? 'Target Discount' : (s.type || 'Unnamed Scheme'))}
                                        </Text>
                                        <View style={[
                                            styles.badge, 
                                            { 
                                                backgroundColor: isExpanded ? BrandColors.primaryGradientStart : BrandColors.primaryGradientEnd + '33', 
                                                borderColor: isExpanded ? BrandColors.primaryGradientStart : BrandColors.primaryGradientEnd 
                                            }
                                        ]}>
                                            <Text style={[styles.badgeText, { color: isExpanded ? '#FFF' : BrandColors.primaryGradientEnd }]}>
                                                {String(s.type || 'N/A')}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    {!!s.custType && (
                                        <Text style={[styles.validity, { color: colors.textMuted, marginTop: 4 }]}>
                                            Customer Type: {String(s.custType)}
                                        </Text>
                                    )}

                                    {isExpanded && (
                                        <View style={styles.detailContainer}>
                                            <View style={styles.divider} />
                                            {loadingThis ? (
                                                <ActivityIndicator color={BrandColors.primaryGradientStart} style={{ marginVertical: 20 }} />
                                            ) : slabs.length > 0 ? (
                                                slabs.map((slab, sIdx) => {
                                                    const title = slab?.IG_DISP || "Unnamed Product";
                                                    const validFrom = slab?.VALID_FROM ? String(slab.VALID_FROM).split('T')[0] : '';
                                                    const validTo = slab?.VALID_TO ? String(slab.VALID_TO).split('T')[0] : '';
                                                    const validity = validFrom && validTo ? `${validFrom} TO ${validTo}` : 'N/A';
                                                    
                                                    // Parse custom `#` separated strings in DISCOUNT_DETAIL
                                                    const detailString = String(slab?.DISCOUNT_DETAIL || '');
                                                    const detailRows = detailString.includes('#') 
                                                        ? detailString.split(',').filter(Boolean).map(row => {
                                                            const parts = row.split('#');
                                                            return {
                                                                from: parts[0] || '-',
                                                                to: parts[1] || '-',
                                                                rate: parts[2] || '-',
                                                                achieved: parts[4] || '0',
                                                            };
                                                        })
                                                        : [];

                                                    return (
                                                        <View key={sIdx} style={styles.slabProductContainer}>
                                                            <Text style={styles.slabProductTitle}>{title}</Text>
                                                            
                                                            {s.type === 'TD' && (
                                                                <View>
                                                                    <View style={styles.infoRow}><Text style={styles.infoLabel}>VALIDITY</Text><Text style={styles.infoValue}>{validity}</Text></View>
                                                                    <View style={styles.infoRow}><Text style={styles.infoLabel}>TARGET</Text><Text style={styles.infoValue}>{slab?.LTR || '0'} LT</Text></View>
                                                                    <View style={styles.infoRow}><Text style={styles.infoLabel}>SALE</Text><Text style={styles.infoValue}>{slab?.PERIOD_SALE || '0'} LT</Text></View>
                                                                    <View style={styles.infoRow}><Text style={styles.infoLabel}>ADJUSTMENT</Text><Text style={styles.infoValue}>{slab?.ADJUSTMENT || '0'} LT</Text></View>
                                                                    <View style={styles.infoRow}><Text style={styles.infoLabel}>ADDITIONAL</Text><Text style={styles.infoValue}>{slab?.ADDITIONAL || slab?.SLAB_ADD || '0'} LT</Text></View>

                                                                    {detailRows.length > 0 && (
                                                                        <View style={styles.table}>
                                                                            <View style={styles.tableHeader}>
                                                                                <Text style={[styles.tableColHeader, { flex: 2 }]}>ALLOCATION</Text>
                                                                                <Text style={[styles.tableColHeader, { flex: 1.5 }]}>ACHIEVED</Text>
                                                                            </View>
                                                                            <View style={styles.tableSubHeader}>
                                                                                <Text style={[styles.tableColSubHeader, { flex: 1 }]}>FROM</Text>
                                                                                <Text style={[styles.tableColSubHeader, { flex: 1 }]}>TO</Text>
                                                                                <Text style={[styles.tableColSubHeader, { flex: 1 }]}>RATE</Text>
                                                                                <Text style={[styles.tableColSubHeader, { flex: 1.5 }]}> </Text>
                                                                            </View>
                                                                            {detailRows.map((r, rIdx) => (
                                                                                <View key={rIdx} style={styles.tableRow}>
                                                                                    <Text style={[styles.tableCell, { flex: 1 }]}>{r.from}</Text>
                                                                                    <Text style={[styles.tableCell, { flex: 1 }]}>{r.to}</Text>
                                                                                    <Text style={[styles.tableCell, { flex: 1 }]}>{r.rate}</Text>
                                                                                    <Text style={[styles.tableCell, { flex: 1.5, fontWeight: '800' }]}>{r.achieved}</Text>
                                                                                </View>
                                                                            ))}
                                                                        </View>
                                                                    )}
                                                                </View>
                                                            )}

                                                            {s.type === 'SD' && (
                                                                <View>
                                                                    <View style={styles.infoRow}><Text style={styles.infoLabel}>QUOTA</Text><Text style={styles.infoValue}>{slab?.SCHEME_TYPE || 'N/A'}</Text></View>
                                                                    <View style={styles.infoRow}><Text style={styles.infoLabel}>VALIDITY</Text><Text style={styles.infoValue}>{validity}</Text></View>
                                                                    
                                                                    <View style={styles.table}>
                                                                        <View style={styles.tableHeader}>
                                                                            <Text style={[styles.tableColHeader, { flex: 1 }]}>SALES QUOTA</Text>
                                                                            <Text style={[styles.tableColHeader, { flex: 1 }]}>UTILIZED</Text>
                                                                            <Text style={[styles.tableColHeader, { flex: 1 }]}>UN UTILIZED</Text>
                                                                        </View>
                                                                        <View style={styles.tableRow}>
                                                                            <Text style={[styles.tableCell, { flex: 1 }]}>{slab?.LTR || '0'}LT</Text>
                                                                            <Text style={[styles.tableCell, { flex: 1 }]}>{slab?.UTILIZED || '0'}LT</Text>
                                                                            <Text style={[styles.tableCell, { flex: 1 }]}>{slab?.UN_UTILIZED || '0'}LT</Text>
                                                                        </View>
                                                                    </View>
                                                                </View>
                                                            )}

                                                            {s.type !== 'TD' && s.type !== 'SD' && (
                                                                <View style={styles.genericSlabRow}>
                                                                    <View style={styles.slabBullet} />
                                                                    <View style={{ flex: 1 }}>
                                                                        <Text style={styles.slabText}>{title}</Text>
                                                                        <Text style={styles.slabValue}>{validity}</Text>
                                                                    </View>
                                                                </View>
                                                            )}

                                                            {(slab?.ORDER_ITEMS || s.items) && (
                                                                <View style={[styles.applicableSection, { marginBottom: 20 }]}>
                                                                    <View style={styles.applicableHeader}>
                                                                        <Text style={styles.applicableTitle}>APPLICABLE ITEM</Text>
                                                                    </View>
                                                                    <Text style={styles.applicableText}>{slab?.ORDER_ITEMS || s.items}</Text>
                                                                </View>
                                                            )}
                                                            <View style={styles.divider} />
                                                        </View>
                                                    );
                                                })
                                            ) : (
                                                <Text style={styles.noSlabs}>No detailed slabs available.</Text>
                                            )}
                                        </View>
                                    )}

                                    <View style={{ marginTop: 12, alignItems: 'flex-end' }}>
                                        <Text style={{ color: BrandColors.primaryGradientStart, fontSize: 11, fontWeight: '800' }}>
                                            {isExpanded ? 'CLOSE DETAILS [^]' : 'VIEW DETAILS [v]'}
                                        </Text>
                                    </View>
                                </GlassCard>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    card: { marginBottom: 12, padding: 18 },
    schemeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    schemeProd: { fontSize: 18, fontWeight: '800', flex: 1 },
    badge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4 },
    badgeText: { fontSize: 13, fontWeight: '900' },
    validity: { fontSize: 14, fontStyle: 'italic' },
    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 16, fontWeight: '600' },
    
    // Details
    detailContainer: { marginTop: 15 },
    divider: { height: 1, backgroundColor: '#ECEDF3', marginBottom: 15 },
    slabRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    slabBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: BrandColors.primaryGradientStart, marginRight: 12 },
    slabText: { fontSize: 15, fontWeight: '600' },
    slabValue: { fontSize: 16, fontWeight: '900', marginTop: 2 },
    noSlabs: { fontSize: 14, color: '#BDBDBD', textAlign: 'center', paddingVertical: 10 },
    
    // Info rows
    infoRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F5F5FA' },
    infoLabel: { width: 110, fontSize: 13, fontWeight: '800', color: '#64748B' },
    infoValue: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1F1F39' },

    table: { borderWidth: 1, borderColor: '#EBEEF2', marginTop: 15, borderRadius: 8, overflow: 'hidden' },
    tableHeader: { flexDirection: 'row', backgroundColor: '#F8F9FD', borderBottomWidth: 1, borderBottomColor: '#EBEEF2' },
    tableColHeader: { padding: 10, fontSize: 12, fontWeight: '900', color: '#1F1F39', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#EBEEF2' },
    tableSubHeader: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EBEEF2' },
    tableColSubHeader: { padding: 8, fontSize: 11, fontWeight: '800', color: '#64748B', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#EBEEF2' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F5F5FA' },
    tableCell: { padding: 10, fontSize: 13, fontWeight: '600', color: '#E3001B', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#EBEEF2' },

    genericSlabRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },

    applicableSection: { marginTop: 20, borderWidth: 1, borderColor: '#F5C800', borderRadius: 8, overflow: 'hidden' },
    applicableHeader: { backgroundColor: '#F5C800', paddingVertical: 8, alignItems: 'center' },
    applicableTitle: { fontSize: 13, fontWeight: '900', color: '#1F1F39' },
    applicableText: { padding: 14, fontSize: 14, color: '#1F1F39', lineHeight: 22, fontWeight: '600' },

    slabProductContainer: { marginBottom: 15 },
    slabProductTitle: { fontSize: 15, fontWeight: '900', color: BrandColors.primaryGradientStart, marginBottom: 8, textTransform: 'uppercase' },
});

export default DiscountScreen;
