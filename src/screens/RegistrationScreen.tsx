/**
 * RegistrationScreen
 * PAN → Phone selection → Send OTP → Enter OTP → Register
 * Glassmorphism design + oil flow background
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';
import OilFlowBackground from '../components/OilFlowBackground';
import GlassCard from '../components/GlassCard';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

const { height } = Dimensions.get('window');

const MOCK_PHONES = ['+91 98765 43210', '+91 87654 32109', '+91 76543 21098'];

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Registration'>;
};

const RegistrationScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1=PAN, 2=Phone+OTP, 3=Success
    const [pan, setPan] = useState('');
    const [selectedPhone, setSelectedPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [panFocused, setPanFocused] = useState(false);
    const [otpFocused, setOtpFocused] = useState(false);

    const cardOpacity = useRef(new Animated.Value(0)).current;
    const cardTranslateY = useRef(new Animated.Value(40)).current;
    const stepScale = useRef(new Animated.Value(1)).current;
    const successScale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(cardOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.spring(cardTranslateY, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
        ]).start();
    }, []);

    const animateStep = (nextStep: 1 | 2 | 3) => {
        Animated.sequence([
            Animated.timing(stepScale, { toValue: 0.9, duration: 150, useNativeDriver: true }),
            Animated.spring(stepScale, { toValue: 1, friction: 6, useNativeDriver: true }),
        ]).start();
        setStep(nextStep);
    };

    const handleVerifyPan = () => {
        if (pan.trim().length < 10) {
            Alert.alert('Invalid PAN', 'Please enter a valid 10-character PAN number.');
            return;
        }
        animateStep(2);
    };

    const handleSendOtp = () => {
        if (!selectedPhone) {
            Alert.alert('Select Phone', 'Please select a mobile number from the list.');
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setOtpSent(true);
            Alert.alert('OTP Sent', `OTP sent to ${selectedPhone}`);
        }, 1500);
    };

    const handleRegister = () => {
        if (otp.trim().length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP.');
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            animateStep(3);
            Animated.spring(successScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
        }, 1500);
    };

    const renderStepIndicator = () => (
        <View style={styles.stepIndicator}>
            {[1, 2].map(s => (
                <View key={s} style={styles.stepRow}>
                    <View style={[
                        styles.stepDot,
                        step >= s && { backgroundColor: BrandColors.yellow500 },
                        step < s && { backgroundColor: 'rgba(255,255,255,0.25)' },
                    ]}>
                        <Text style={[styles.stepNum, { color: step >= s ? BrandColors.blue900 : '#fff' }]}>{s}</Text>
                    </View>
                    {s < 2 && (
                        <View style={[styles.stepLine, { backgroundColor: step > s ? BrandColors.yellow500 : 'rgba(255,255,255,0.2)' }]} />
                    )}
                </View>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <LinearGradient
                colors={[BrandColors.blue900, BrandColors.blue800, BrandColors.blue700]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <OilFlowBackground />

            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}>

                    {/* Logo area */}
                    <View style={styles.topArea}>
                        <Text style={styles.appName}>IDHAYAM</Text>
                        <Text style={[styles.screenTitle, { color: colors.textSecondary }]}>Distributor Registration</Text>
                        {step < 3 && renderStepIndicator()}
                    </View>

                    <Animated.View style={{ opacity: cardOpacity, transform: [{ translateY: cardTranslateY }, { scale: stepScale }] }}>
                        <GlassCard accentLine style={styles.card}>

                            {step === 1 && (
                                // ── STEP 1: PAN ──
                                <>
                                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Enter PAN Number</Text>
                                    <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                                        Type your PAN No for verification
                                    </Text>
                                    <View style={[
                                        styles.inputBox,
                                        { backgroundColor: colors.inputBackground, borderColor: panFocused ? BrandColors.yellow500 : colors.inputBorder },
                                    ]}>
                                        <Text style={styles.inputIcon}>🪪</Text>
                                        <TextInput
                                            style={[styles.input, { color: colors.inputText }]}
                                            value={pan}
                                            onChangeText={t => setPan(t.toUpperCase())}
                                            placeholder="e.g. ABCDE1234F"
                                            placeholderTextColor={colors.inputPlaceholder}
                                            autoCapitalize="characters"
                                            maxLength={10}
                                            onFocus={() => setPanFocused(true)}
                                            onBlur={() => setPanFocused(false)}
                                        />
                                        {pan.length === 10 && <Text style={styles.inputIcon}>✅</Text>}
                                    </View>
                                    <TouchableOpacity onPress={handleVerifyPan} activeOpacity={0.85}>
                                        <LinearGradient
                                            colors={[BrandColors.blue700, BrandColors.blue500]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.btn}>
                                            <Text style={styles.btnText}>Continue →</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </>
                            )}

                            {step === 2 && (
                                // ── STEP 2: Phone + OTP ──
                                <>
                                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Verify Phone Number</Text>
                                    <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                                        Select your registered mobile number
                                    </Text>

                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Select Mobile Number</Text>
                                    {MOCK_PHONES.map(phone => (
                                        <TouchableOpacity
                                            key={phone}
                                            onPress={() => setSelectedPhone(phone)}
                                            style={[
                                                styles.phoneOption,
                                                { backgroundColor: colors.inputBackground, borderColor: selectedPhone === phone ? BrandColors.yellow500 : colors.inputBorder },
                                            ]}>
                                            <Text style={styles.phoneIcon}>{selectedPhone === phone ? '🔘' : '⚪'}</Text>
                                            <Text style={[styles.phoneText, { color: colors.textPrimary }]}>{phone}</Text>
                                        </TouchableOpacity>
                                    ))}

                                    <TouchableOpacity onPress={handleSendOtp} activeOpacity={0.85} disabled={loading || otpSent}>
                                        <LinearGradient
                                            colors={otpSent ? ['#22C55E', '#16A34A'] : [BrandColors.yellow500, '#CA9E00']}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                            style={styles.btn}>
                                            {loading ? <ActivityIndicator color="#000" size="small" /> : (
                                                <Text style={[styles.btnText, { color: '#000' }]}>
                                                    {otpSent ? '✓ OTP Sent' : 'Send OTP'}
                                                </Text>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    {otpSent && (
                                        <>
                                            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>
                                                Enter OTP
                                            </Text>
                                            <View style={[
                                                styles.inputBox,
                                                { backgroundColor: colors.inputBackground, borderColor: otpFocused ? BrandColors.yellow500 : colors.inputBorder },
                                            ]}>
                                                <Text style={styles.inputIcon}>🔑</Text>
                                                <TextInput
                                                    style={[styles.input, { color: colors.inputText, letterSpacing: 6, fontSize: 18 }]}
                                                    value={otp}
                                                    onChangeText={setOtp}
                                                    placeholder="_ _ _ _ _ _"
                                                    placeholderTextColor={colors.inputPlaceholder}
                                                    keyboardType="number-pad"
                                                    maxLength={6}
                                                    onFocus={() => setOtpFocused(true)}
                                                    onBlur={() => setOtpFocused(false)}
                                                />
                                            </View>
                                            <TouchableOpacity onPress={handleRegister} activeOpacity={0.85} disabled={loading}>
                                                <LinearGradient
                                                    colors={[BrandColors.blue700, BrandColors.blue500]}
                                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                                    style={styles.btn}>
                                                    {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                                                        <Text style={styles.btnText}>Register</Text>
                                                    )}
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </>
                            )}

                            {step === 3 && (
                                // ── SUCCESS ──
                                <Animated.View style={[styles.successBox, { transform: [{ scale: successScale }] }]}>
                                    <Text style={styles.successEmoji}>🎉</Text>
                                    <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Registered!</Text>
                                    <Text style={[styles.successSub, { color: colors.textSecondary }]}>
                                        Welcome to Idhayam Distributor Portal
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('Dashboard')}
                                        activeOpacity={0.85}
                                        style={{ width: '100%' }}>
                                        <LinearGradient
                                            colors={[BrandColors.blue700, BrandColors.blue500]}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                            style={styles.btn}>
                                            <Text style={styles.btnText}>Go to Dashboard →</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </Animated.View>
                            )}
                        </GlassCard>
                    </Animated.View>

                    {step < 3 && (
                        <TouchableOpacity
                            style={styles.backLink}
                            onPress={() => step === 2 ? animateStep(1) : navigation.goBack()}
                            activeOpacity={0.7}>
                            <Text style={[styles.backLinkText, { color: colors.textLink }]}>
                                {step === 2 ? '← Back to PAN' : '← Back to Login'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.bottom}>
                        <LinearGradient
                            colors={[BrandColors.red600, BrandColors.yellow500, BrandColors.blue700]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.brandStrip}
                        />
                        <Text style={[styles.version, { color: colors.textMuted }]}>v1.0.0 • Idhayam Distributor</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1 },
    scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 32, minHeight: height },
    topArea: { alignItems: 'center', marginBottom: 28 },
    appName: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 4, textShadowColor: BrandColors.yellow500, textShadowRadius: 12, textShadowOffset: { width: 0, height: 0 } },
    screenTitle: { fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginTop: 4, marginBottom: 20 },
    stepIndicator: { flexDirection: 'row', alignItems: 'center' },
    stepRow: { flexDirection: 'row', alignItems: 'center' },
    stepDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    stepNum: { fontSize: 13, fontWeight: '700' },
    stepLine: { width: 40, height: 2, marginHorizontal: 4 },
    card: { width: '100%', maxWidth: 420 },
    cardTitle: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
    cardSub: { fontSize: 13, marginBottom: 20 },
    label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    inputBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 4, marginBottom: 16 },
    inputIcon: { fontSize: 16, marginRight: 10 },
    input: { flex: 1, fontSize: 15 },
    phoneOption: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 },
    phoneIcon: { fontSize: 14, marginRight: 10 },
    phoneText: { fontSize: 14, fontWeight: '500' },
    btn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
    btnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.8 },
    successBox: { alignItems: 'center', paddingVertical: 12 },
    successEmoji: { fontSize: 60, marginBottom: 16 },
    successTitle: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
    successSub: { fontSize: 14, textAlign: 'center', marginBottom: 28 },
    backLink: { marginTop: 20, alignSelf: 'center' },
    backLinkText: { fontSize: 14, fontWeight: '600' },
    bottom: { alignItems: 'center', marginTop: 32 },
    brandStrip: { height: 3, width: 50, borderRadius: 2, marginBottom: 10 },
    version: { fontSize: 11, letterSpacing: 0.5 },
});

export default RegistrationScreen;
