import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { useSession } from '../context/SessionContext';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'LoginResponse'>;
    route: RouteProp<RootStackParamList, 'LoginResponse'>;
};

const { width } = Dimensions.get('window');

const LoginResponseScreen: React.FC<Props> = ({ navigation, route }) => {
    const { colors } = useTheme();
    const { setSession } = useSession();
    const { data } = route.params;

    // ── Parse branch list from server response ──────────────────────────────
    let branches: any[] = [];
    if (data?.result) {
        if (Array.isArray(data.result)) {
            branches = data.result;
        } else if (typeof data.result === 'string') {
            try {
                const parsed = JSON.parse(data.result);
                branches = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                console.error('Failed to parse branch result:', e);
            }
        }
    } else if (Array.isArray(data)) {
        branches = data;
    }

    // ── Save session and navigate to Dashboard ──────────────────────────────
    const handleSelectBranch = async (branch: any) => {
        await setSession({
            custId:       String(branch.CUST_ID   ?? branch.custId   ?? ''),
            branchId:     String(branch.BRANCH_ID  ?? branch.branchId ?? ''),
            custName:     String(branch.CUST_NAME_DISPLAY ?? branch.custName ?? 'Distributor'),
            custType:     String(branch.CUST_TYPE  ?? 'CM'),
            partyMudId:   String(branch.PARTY_MUD_ID ?? ''),
            hubName:      String(branch.HUB_NAME   ?? ''),
            territoryName: String(branch.TERRITORY_NAME ?? ''),
            gstNo:        String(branch.GST_NO     ?? ''),
            pan:          String(data.pan          ?? ''),
            mobile:       String(data.mobile       ?? ''),
        });
        navigation.replace('Dashboard');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            <LinearGradient
                colors={['#7B61FF', '#0984E3']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.header}>
                <Text style={styles.headerTitle}>Select Branch</Text>
                <Text style={styles.headerSub}>Choose your operating branch to continue</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scroll}>
                {branches && branches.length > 0 ? (
                    branches.map((branch: any, index: number) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.branchCard, { backgroundColor: colors.surface }]}
                            activeOpacity={0.8}
                            onPress={() => handleSelectBranch(branch)}>

                            <View style={styles.branchTop}>
                                <Text style={[styles.custNameDisplay, { color: colors.textPrimary }]}>
                                    {branch.CUST_NAME_DISPLAY}
                                </Text>
                                <View style={styles.arrowBadge}>
                                    <Text style={styles.arrowText}>→</Text>
                                </View>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>HUB</Text>
                                <Text style={styles.detailHighlight}>{branch.HUB_NAME}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>TERRITORY</Text>
                                <Text style={styles.detailHighlight}>{branch.TERRITORY_NAME}</Text>
                            </View>
                            {branch.GST_NO ? (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>GST</Text>
                                    <Text style={styles.detailHighlight}>{branch.GST_NO}</Text>
                                </View>
                            ) : null}
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
                        <Text style={{ fontSize: 28, marginBottom: 12 }}>🏢</Text>
                        <Text style={[styles.custNameDisplay, { color: colors.textPrimary }]}>
                            No branches found
                        </Text>
                        <Text style={[styles.detailLabel, { marginTop: 8, textAlign: 'center' }]}>
                            Please contact your administrator
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        padding: 25,
        paddingTop: 60,
        paddingBottom: 30,
    },
    headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '900' },
    headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 6, fontWeight: '500' },
    scroll: { padding: 20, paddingBottom: 40 },

    branchCard: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 16,
        shadowColor: '#7B61FF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#7B61FF20',
    },
    branchTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    custNameDisplay: { fontSize: 16, fontWeight: '800', flex: 1, marginRight: 10 },
    arrowBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#7B61FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    arrowText: { color: '#fff', fontSize: 14, fontWeight: '900' },

    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    detailLabel: { fontSize: 11, fontWeight: '800', color: '#BDBDBD', letterSpacing: 0.5 },
    detailHighlight: { fontSize: 13, fontWeight: '700', color: '#7B61FF' },

    emptyCard: {
        padding: 40,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
});

export default LoginResponseScreen;
