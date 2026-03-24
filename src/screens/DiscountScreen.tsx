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
import { getDiscountSummary } from '../api';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Discount'> };

const DiscountScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const [schemeData, setSchemeData] = useState<any[]>([]);
    const [loadingDiscount, setLoadingDiscount] = useState(true);

    useEffect(() => {
        getDiscountSummary()
            .then(data => {
                const rows = Array.isArray(data) ? data : (data?.data ?? []);
                if (rows.length > 0) {
                    setSchemeData(rows.map((r: any) => ({
                        type: r.DMOBNO ?? '',        // 'SD' or 'TD'
                        custType: r.NAME ?? '',      // 'CM'
                        items: r.MOBNO ?? '',        // long comma-separated string
                    })));
                } else {
                    setSchemeData([]);
                }
            })
            .catch(() => { })
            .finally(() => setLoadingDiscount(false));
    }, []);

    const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});
    const toggleExpand = (idx: number) => {
        setExpandedIds(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
            <GlassHeader title="Discount Details" subtitle="Your current discount schemes" onBack={() => navigation.goBack()} gradientColors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]} />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={{ height: 20 }} />
                {loadingDiscount ? (
                    <ActivityIndicator color={BrandColors.primaryGradientStart} size="large" style={{ marginTop: 40 }} />
                ) : schemeData.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>🏷️</Text>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No discount schemes found.</Text>
                    </View>
                ) : (
                    schemeData.map((s, i) => (
                        <GlassCard key={i} style={styles.card}>
                            <View style={styles.schemeHeader}>
                                <Text style={[styles.schemeProd, { color: colors.textPrimary }]}>
                                    {s.type === 'SD' ? 'Scheme Discount' : s.type === 'TD' ? 'Target Discount' : (s.type || s.product)}
                                </Text>
                                <View style={[styles.badge, { backgroundColor: BrandColors.primaryGradientEnd + '33', borderColor: BrandColors.primaryGradientEnd }]}>
                                    <Text style={[styles.badgeText, { color: BrandColors.primaryGradientEnd }]}>{s.type}</Text>
                                </View>
                            </View>
                            
                            {s.items && (
                                <View style={{ marginTop: 8 }}>
                                    <Text style={[{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }]} numberOfLines={expandedIds[i] ? undefined : 2}>
                                        <Text style={{ fontWeight: '700', color: colors.textPrimary }}>Applied to Items: </Text>
                                        {s.items}
                                    </Text>
                                    {s.items.length > 80 && (
                                        <TouchableOpacity onPress={() => toggleExpand(i)} style={{ marginTop: 6, alignSelf: 'flex-start' }}>
                                            <Text style={{ color: BrandColors.primaryGradientStart, fontSize: 12, fontWeight: '700' }}>
                                                {expandedIds[i] ? 'Show Less' : 'Read More...'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                            
                            {s.custType && (
                                <Text style={[styles.validity, { color: colors.textMuted, marginTop: 12 }]}>Customer Type: {s.custType}</Text>
                            )}
                        </GlassCard>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    card: { marginBottom: 12, padding: 16 },
    schemeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    schemeProd: { fontSize: 14, fontWeight: '700', flex: 1 },
    badge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    validity: { fontSize: 11, fontStyle: 'italic' },
    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 15, fontWeight: '600' },
});

export default DiscountScreen;
