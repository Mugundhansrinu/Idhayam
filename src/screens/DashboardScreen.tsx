/**
 * DashboardScreen – Home page with feature grid
 * Glassmorphism + oil flow background
 */
import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Animated,
    ScrollView,
    Dimensions,
    Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import OilFlowBackground from '../components/OilFlowBackground';
import GlassCard from '../components/GlassCard';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 64) / 2;

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

const FEATURES = [
    { id: 'OrderEntry', icon: '📦', label: 'Order Entry', color: '#1E4DB7' },
    { id: 'Discount', icon: '🏷️', label: 'Discount Details', color: '#B71C1C' },
    { id: 'PriceDetails', icon: '💲', label: 'Price Details', color: '#CA9E00' },
    { id: 'Report', icon: '📊', label: 'Reports', color: '#0D5C2D' },
    { id: 'InvoiceDetail', icon: '🧾', label: 'Invoice Details', color: '#4A1D96' },
    { id: 'MiniStatement', icon: '📋', label: 'Account Copy', color: '#7C3AED' },
    { id: 'BankDetails', icon: '🏦', label: 'Bank Details', color: '#0E7490' },
    { id: 'ContactUs', icon: '📞', label: 'Contact Us', color: '#065F46' },
];

interface FeatureCardProps {
    icon: string;
    label: string;
    color: string;
    delay: number;
    onPress: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, label, color, delay, onPress }) => {
    const { colors } = useTheme();
    const scale = useRef(new Animated.Value(0.7)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const pressScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scale, { toValue: 1, friction: 7, tension: 60, delay, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
        ]).start();
    }, []);

    const onPressIn = () => Animated.spring(pressScale, { toValue: 0.93, useNativeDriver: true }).start();
    const onPressOut = () => Animated.spring(pressScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();

    return (
        <Animated.View style={{ opacity, transform: [{ scale: Animated.multiply(scale, pressScale) }] }}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={1}>
                <View style={[styles.featureCard, { backgroundColor: colors.glassBackground, borderColor: colors.glassBorder }]}>
                    <LinearGradient
                        colors={[color + '55', color + '22']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.featureIconBg}>
                        <Text style={styles.featureIcon}>{icon}</Text>
                    </LinearGradient>
                    <Text style={[styles.featureLabel, { color: colors.textPrimary }]} numberOfLines={2}>
                        {label}
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const headerOpacity = useRef(new Animated.Value(0)).current;
    const headerTranslateY = useRef(new Animated.Value(-20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(headerTranslateY, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]).start();
    }, []);

    const navigate = (screen: keyof RootStackParamList) => {
        navigation.navigate(screen as any);
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <LinearGradient
                colors={[BrandColors.blue900, BrandColors.blue800, '#0a1a4e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <OilFlowBackground />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Header */}
                <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] }]}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome back 👋</Text>
                            <Text style={[styles.distributorName, { color: colors.textPrimary }]}>Distributor Portal</Text>
                        </View>
                        <View style={[styles.logoBox, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: colors.glassBorder }]}>
                            <Image
                                source={require('../assets/logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                    </View>

                    {/* Summary Glass Cards */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
                        {[
                            { label: 'Pending Orders', value: '12', icon: '📦', color: BrandColors.blue500 },
                            { label: "Today's Sales", value: '₹1.4L', icon: '📈', color: '#22C55E' },
                            { label: 'Outstanding', value: '₹3.2L', icon: '💰', color: BrandColors.yellow500 },
                        ].map((stat, i) => (
                            <GlassCard key={i} style={styles.statCard}>
                                <Text style={styles.statIcon}>{stat.icon}</Text>
                                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                            </GlassCard>
                        ))}
                    </ScrollView>
                </Animated.View>

                {/* Features Grid */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Features</Text>
                    <LinearGradient
                        colors={[BrandColors.red600, BrandColors.yellow500, BrandColors.blue500]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.sectionLine}
                    />
                    <View style={styles.grid}>
                        {FEATURES.map((f, i) => (
                            <FeatureCard
                                key={f.id}
                                icon={f.icon}
                                label={f.label}
                                color={f.color}
                                delay={i * 80}
                                onPress={() => navigate(f.id as keyof RootStackParamList)}
                            />
                        ))}
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <LinearGradient
                        colors={[BrandColors.red600, BrandColors.yellow500, BrandColors.blue700]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.footerLine}
                    />
                    <Text style={[styles.footerText, { color: colors.textMuted }]}>
                        v1.0.0 • Idhayam Distributor App
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingBottom: 40 },
    header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    greeting: { fontSize: 13, letterSpacing: 0.5 },
    distributorName: { fontSize: 22, fontWeight: '800', letterSpacing: 0.3 },
    logoBox: { width: 70, height: 44, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    logo: { width: 60, height: 36 },
    statsRow: { marginBottom: 4 },
    statCard: { width: 130, marginRight: 12, padding: 14, alignItems: 'center' },
    statIcon: { fontSize: 22, marginBottom: 4 },
    statValue: { fontSize: 20, fontWeight: '800' },
    statLabel: { fontSize: 10, textAlign: 'center', marginTop: 2, letterSpacing: 0.3 },
    section: { paddingHorizontal: 20, marginTop: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
    sectionLine: { height: 2, width: 40, borderRadius: 1, marginBottom: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    featureCard: { width: CARD_WIDTH, borderRadius: 18, borderWidth: 1, padding: 16, alignItems: 'center' },
    featureIconBg: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    featureIcon: { fontSize: 26 },
    featureLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center', letterSpacing: 0.2 },
    footer: { alignItems: 'center', marginTop: 32, paddingBottom: 8 },
    footerLine: { height: 3, width: 50, borderRadius: 2, marginBottom: 10 },
    footerText: { fontSize: 11, letterSpacing: 0.5 },
});

export default DashboardScreen;
