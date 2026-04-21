import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, StatusBar,
    ScrollView, ActivityIndicator, Dimensions, Platform, LayoutAnimation,
} from 'react-native';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getDiscountSummary } from '../api';
import { useSession } from '../context/SessionContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Discount'> };

const DiscountScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const { session } = useSession();
    const [schemeData, setSchemeData] = useState<any[]>([]);
    const [loadingDiscount, setLoadingDiscount] = useState(true);

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

    const toggleScheme = (s: any) => {
        const schemeName = s.type === 'SD' ? 'Scheme Discount' : s.type === 'TD' ? 'Target Discount' : s.type === 'QD' ? 'Quantity Discount' : (s.type || 'Standard Scheme');
        navigation.navigate('DiscountDetail', {
            items: s.items,
            type: s.type,
            custType: s.custType,
            schemeName: schemeName
        });
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
                        <TouchableOpacity activeOpacity={0.9} key={i} onPress={() => toggleScheme(s)} style={styles.card}>
                            <View style={styles.schemeHeader}>
                                <View style={styles.schemeInfo}>
                                    <Text style={styles.schemeName}>{s.type === 'SD' ? 'Scheme Discount' : s.type === 'TD' ? 'Target Discount' : s.type === 'QD' ? 'Quantity Discount' : (s.type || 'Standard Scheme')}</Text>
                                </View>
                                <Icon name="chevron-right" size={24} color="#CBD5E0" />
                            </View>
                            
                        </TouchableOpacity>
                    ))
                )}
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

    scroll: { paddingHorizontal: 25, paddingBottom: 40 },
    noticeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4FF', borderRadius: 20, padding: 18, marginBottom: 25 },
    noticeText: { flex: 1, fontSize: 12, lineHeight: 18, color: '#3861FB', fontWeight: '800' },

    card: { backgroundColor: '#fff', borderRadius: 28, padding: 22, marginBottom: 15, elevation: 3, shadowColor: '#304FFE', shadowOpacity: 0.05, shadowRadius: 15, borderWidth: 1.5, borderColor: 'transparent' },
    schemeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    schemeInfo: { flex: 1 },
    typeBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
    typeText: { fontSize: 10, fontWeight: '900', color: '#64748B' },
    schemeName: { fontSize: 17, fontWeight: '900', color: '#1A1A1A' },
    custType: { fontSize: 13, color: '#A0AEC0', fontWeight: '600', marginTop: 5 },

    emptyState: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 15, fontWeight: '700', color: '#A0AEC0', marginTop: 15 },
    centerBox: { paddingTop: 60, alignItems: 'center' },
});

export default DiscountScreen;
