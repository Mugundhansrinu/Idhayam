import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Animated,
    ScrollView,
    Linking,
    Alert,
    Image,
    Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import GlassHeader from '../components/GlassHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

const { width } = Dimensions.get('window');

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'ContactUs'> };

const CONTACTS = [
    { icon: '📞', label: 'Sales Helpline', value: '+91 44 2345 6789', action: 'tel:+914423456789', color: '#7B61FF' },
    { icon: '💬', label: 'WhatsApp Support', value: '+91 94435 34646', action: 'https://wa.me/+919443534646', color: '#27AE60' },
    { icon: '✉️', label: 'Email Support', value: 'distributor@idhayam.com', action: 'mailto:distributor@idhayam.com', color: '#FD79A8' },
    { icon: '🌐', label: 'Website', value: 'www.idhayam.com', action: 'https://www.idhayam.com', color: '#00D2D3' },
];

const ContactUsScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const anims = useRef(CONTACTS.map(() => new Animated.Value(0))).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.stagger(120, anims.map(a =>
                Animated.spring(a, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true })
            )),
        ]).start();
    }, []);

    const handleAction = async (action: string, label: string) => {
        try {
            const supported = await Linking.canOpenURL(action);
            if (supported) {
                await Linking.openURL(action);
            } else {
                Alert.alert('Error', `Cannot open ${label}`);
            }
        } catch {
            Alert.alert('Error', `Unable to open ${label}`);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            
            <GlassHeader title="Contact Us" subtitle="We're here to help you" onBack={() => navigation.goBack()} gradientColors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]} />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                
                <Animated.View style={[styles.heroCard, { opacity: fadeAnim }]}>
                    <LinearGradient
                        colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={styles.heroGrad}>
                        <Text style={styles.heroTitle}>IDHAYAM</Text>
                        <Text style={styles.heroSub}>DISTRIBUTOR SUPPORT</Text>
                    </LinearGradient>
                </Animated.View>

                {CONTACTS.map((c, i) => (
                    <Animated.View key={i} style={{
                        opacity: anims[i],
                        transform: [{ translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
                    }}>
                        <TouchableOpacity onPress={() => handleAction(c.action, c.label)} activeOpacity={0.8} style={styles.contactCard}>
                            <View style={[styles.iconBox, { backgroundColor: c.color + '15' }]}>
                                <Text style={styles.icon}>{c.icon}</Text>
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>{c.label}</Text>
                                <Text style={[styles.contactValue, { color: colors.textPrimary }]}>{c.value}</Text>
                            </View>
                            <View style={[styles.actionBtn, { backgroundColor: c.color + '10' }]}>
                                <Text style={[styles.actionBtnText, { color: c.color }]}>OPEN</Text>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                ))}

                <View style={[styles.addressCard, { backgroundColor: colors.inputBackground }]}>
                    <Text style={styles.addressIcon}>📍</Text>
                    <Text style={[styles.addressTitle, { color: colors.textPrimary }]}>Registered Office</Text>
                    <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                        Idhayam Corporation Pvt Ltd{'\n'}
                        #45, GST Road, Vandalur,{'\n'}
                        Chennai – 600 048,{'\n'}
                        Tamil Nadu, India.
                    </Text>
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                    <Text style={[styles.hoursTitle, { color: colors.textPrimary }]}>Office Hours</Text>
                    <Text style={[styles.hoursText, { color: colors.textSecondary }]}>
                        Mon – Sat: 9:00 AM – 6:00 PM{'\n'}
                        Sunday: Closed
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textMuted }]}>v6.8 • Idhayam Distributor App</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20, paddingBottom: 60 },
    heroCard: { width: '100%', height: 160, borderRadius: 32, overflow: 'hidden', marginBottom: 25, elevation: 5, shadowColor: BrandColors.primaryGradientStart, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
    heroGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    heroTitle: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 8 },
    heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '800', marginTop: 8, letterSpacing: 2 },
    
    contactCard: { backgroundColor: '#fff', borderRadius: 24, padding: 18, marginBottom: 15, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    iconBox: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    icon: { fontSize: 22 },
    contactInfo: { flex: 1 },
    contactLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
    contactValue: { fontSize: 15, fontWeight: '700' },
    actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    actionBtnText: { fontSize: 11, fontWeight: '800' },
    
    addressCard: { padding: 25, borderRadius: 28, marginTop: 10 },
    addressIcon: { fontSize: 24, marginBottom: 12 },
    addressTitle: { fontSize: 18, fontWeight: '900', marginBottom: 10 },
    addressText: { fontSize: 14, lineHeight: 24, fontWeight: '600' },
    divider: { height: 1, marginVertical: 20 },
    hoursTitle: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
    hoursText: { fontSize: 14, lineHeight: 24, fontWeight: '600' },
    
    footer: { alignItems: 'center', marginTop: 40 },
    footerText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
});

export default ContactUsScreen;
