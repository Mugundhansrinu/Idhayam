/**
 * ContactUsScreen – Contact details for Idhayam
 */
import React, { useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, StatusBar,
    Animated, ScrollView, Linking, Alert, Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import OilFlowBackground from '../components/OilFlowBackground';
import GlassCard from '../components/GlassCard';
import GlassHeader from '../components/GlassHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'ContactUs'> };

const WHATSAPP_IMAGE = require('../assets/whatsapp.png');

const CONTACTS = [
    { icon: '📞', label: 'Sales Helpline', value: '+91 44 2345 6789', action: 'tel:+914423456789', color: '#22C55E', image: null },
    { icon: '', label: 'WhatsApp Support', value: '+91 98765 43210', action: 'https://wa.me/+919876543210', color: '#25D366', image: WHATSAPP_IMAGE },
    { icon: '✉️', label: 'Email Support', value: 'distributor@idhayam.com', action: 'mailto:distributor@idhayam.com', color: BrandColors.blue500, image: null },
    { icon: '🌐', label: 'Website', value: 'www.idhayam.com', action: 'https://www.idhayam.com', color: BrandColors.yellow500, image: null },
];

const ContactUsScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const anims = useRef(CONTACTS.map(() => new Animated.Value(0))).current;
    const logoAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(logoAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
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
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <LinearGradient colors={[BrandColors.blue900, BrandColors.blue800, '#0a1a4e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <OilFlowBackground />
            <GlassHeader title="Contact Us" subtitle="We're here to help" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Brand logo section */}
                <Animated.View style={[styles.brandArea, { opacity: logoAnim, transform: [{ scale: logoAnim }] }]}>
                    <LinearGradient
                        colors={[BrandColors.blue800, BrandColors.blue700]}
                        style={styles.logoBox}>
                        <Text style={styles.logoText}>IDHAYAM</Text>
                        <Text style={styles.logoSub}>Distributor Support</Text>
                    </LinearGradient>
                </Animated.View>

                {/* Contact cards */}
                {CONTACTS.map((c, i) => (
                    <Animated.View key={i} style={{
                        opacity: anims[i],
                        transform: [{ translateX: anims[i].interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }],
                    }}>
                        <TouchableOpacity onPress={() => handleAction(c.action, c.label)} activeOpacity={0.8}>
                            <GlassCard style={styles.contactCard}>
                                <View style={styles.contactRow}>
                                    <LinearGradient
                                        colors={[c.color + '44', c.color + '11']}
                                        style={styles.iconBg}>
                                        {c.image
                                            ? <Image source={c.image} style={styles.whatsappIcon} resizeMode="contain" />
                                            : <Text style={styles.icon}>{c.icon}</Text>
                                        }
                                    </LinearGradient>
                                    <View style={styles.contactInfo}>
                                        <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>{c.label}</Text>
                                        <Text style={[styles.contactValue, { color: colors.textPrimary }]}>{c.value}</Text>
                                    </View>
                                    <View style={[styles.openBtn, { borderColor: c.color + '66', backgroundColor: c.color + '22' }]}>
                                        <Text style={[styles.openText, { color: c.color }]}>Open ›</Text>
                                    </View>
                                </View>
                            </GlassCard>
                        </TouchableOpacity>
                    </Animated.View>
                ))}

                {/* Office address */}
                <GlassCard accentLine style={styles.addressCard}>
                    <Text style={styles.addressIcon}>📍</Text>
                    <Text style={[styles.addressTitle, { color: colors.textPrimary }]}>Registered Office</Text>
                    <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                        Idhayam Corporation Pvt Ltd{'\n'}
                        #45, GST Road, Vandalur,{'\n'}
                        Chennai – 600 048,{'\n'}
                        Tamil Nadu, India.
                    </Text>
                    <View style={[styles.addressDivider, { backgroundColor: colors.divider }]} />
                    <Text style={[styles.hoursTitle, { color: colors.textPrimary }]}>Office Hours</Text>
                    <Text style={[styles.hoursText, { color: colors.textSecondary }]}>
                        Mon – Sat: 9:00 AM – 6:00 PM{'\n'}
                        Sunday: Closed
                    </Text>
                </GlassCard>

                {/* Version */}
                <View style={styles.footer}>
                    <LinearGradient
                        colors={[BrandColors.red600, BrandColors.yellow500, BrandColors.blue700]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.footerLine}
                    />
                    <Text style={[styles.versionText, { color: colors.textMuted }]}>v1.0.0 • Idhayam Distributor App</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 16, paddingBottom: 40 },
    brandArea: { alignItems: 'center', marginBottom: 24 },
    logoBox: { borderRadius: 20, paddingHorizontal: 32, paddingVertical: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
    logoText: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 6 },
    logoSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4, letterSpacing: 2 },
    contactCard: { marginBottom: 10, padding: 14 },
    contactRow: { flexDirection: 'row', alignItems: 'center' },
    iconBg: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    icon: { fontSize: 22 },
    whatsappIcon: { width: 32, height: 32, borderRadius: 6 },
    contactInfo: { flex: 1 },
    contactLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
    contactValue: { fontSize: 14, fontWeight: '600' },
    openBtn: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
    openText: { fontSize: 11, fontWeight: '700' },
    addressCard: { marginTop: 6 },
    addressIcon: { fontSize: 24, marginBottom: 8 },
    addressTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
    addressText: { fontSize: 13, lineHeight: 22 },
    addressDivider: { height: 1, marginVertical: 14 },
    hoursTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
    hoursText: { fontSize: 13, lineHeight: 22 },
    footer: { alignItems: 'center', marginTop: 28 },
    footerLine: { height: 3, width: 50, borderRadius: 2, marginBottom: 10 },
    versionText: { fontSize: 11, letterSpacing: 0.5 },
});

export default ContactUsScreen;
