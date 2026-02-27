import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

const { width, height } = Dimensions.get('window');

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

const OTP_LENGTH = 6;
const RESEND_TIMER = 30;

// ─────────────────────────────────────────
//  LoginScreen  (PAN → OTP → Dashboard)
// ─────────────────────────────────────────
const LoginScreen: React.FC<Props> = ({ navigation }) => {
    const { colors, isDark, toggleTheme } = useTheme();

    /* ── Step state ── */
    const [step, setStep] = useState<'pan' | 'otp'>('pan');

    /* ── PAN step ── */
    const [pan, setPan] = useState('');
    const [panFocused, setPanFocused] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);

    /* ── OTP step ── */
    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [verifying, setVerifying] = useState(false);
    const [maskedMobile, setMaskedMobile] = useState('');
    const [resendTimer, setResendTimer] = useState(0);
    const otpRefs = useRef<(TextInput | null)[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /* ── Animations ── */
    const buttonScale = useRef(new Animated.Value(1)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;
    const cardTranslateY = useRef(new Animated.Value(40)).current;
    const stepAnim = useRef(new Animated.Value(0)).current;

    /* ── Reset all fields when leaving the screen (blur) — avoids flicker on re-entry ── */
    useEffect(() => {
        const unsubscribe = navigation.addListener('blur', () => {
            setStep('pan');
            setPan('');
            setOtp(Array(OTP_LENGTH).fill(''));
            setSendingOtp(false);
            setVerifying(false);
            setMaskedMobile('');
            setResendTimer(0);
            if (timerRef.current) { clearInterval(timerRef.current); }
        });
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(cardOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.spring(cardTranslateY, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
        ]).start();
    }, [cardOpacity, cardTranslateY]);

    /* Animate step transition */
    const animateStep = (cb: () => void) => {
        Animated.timing(stepAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start(() => {
            cb();
            stepAnim.setValue(0);
            Animated.timing(stepAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        });
    };

    /* Start resend countdown */
    const startTimer = () => {
        setResendTimer(RESEND_TIMER);
        if (timerRef.current) { clearInterval(timerRef.current); }
        timerRef.current = setInterval(() => {
            setResendTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => () => { if (timerRef.current) { clearInterval(timerRef.current); } }, []);

    /* ── PAN validation ── */
    const isPanValid = (v: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v.toUpperCase());

    /* ── Send OTP ── */
    const handleSendOtp = async () => {
        const cleanPan = pan.trim().toUpperCase();
        if (!isPanValid(cleanPan)) {
            Alert.alert('Invalid PAN', 'Please enter a valid 10-character PAN number.\nExample: ABCDE1234F');
            return;
        }
        setSendingOtp(true);
        // Simulate API: lookup PAN → get masked mobile
        setTimeout(() => {
            setSendingOtp(false);
            // Demo: mask last 7 digits of a mobile
            setMaskedMobile('+91 XXXXXX3210');
            animateStep(() => setStep('otp'));
            startTimer();
        }, 1500);
    };

    /* ── OTP input handlers ── */
    const handleOtpChange = (text: string, index: number) => {
        const digit = text.replace(/[^0-9]/g, '').slice(-1);
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);
        if (digit && index < OTP_LENGTH - 1) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    /* ── Verify OTP ── */
    const handleVerifyOtp = async () => {
        const enteredOtp = otp.join('');
        if (enteredOtp.length < OTP_LENGTH) {
            Alert.alert('Incomplete OTP', 'Please enter the complete 6-digit OTP.');
            return;
        }
        setVerifying(true);
        // Simulate OTP verification (accept any 6-digit OTP for demo)
        setTimeout(() => {
            setVerifying(false);
            if (enteredOtp === '123456' || enteredOtp.length === OTP_LENGTH) {
                navigation.navigate('Dashboard');
            } else {
                Alert.alert('Invalid OTP', 'The OTP you entered is incorrect. Please try again.');
                setOtp(Array(OTP_LENGTH).fill(''));
                otpRefs.current[0]?.focus();
            }
        }, 1500);
    };

    /* ── Resend OTP ── */
    const handleResend = () => {
        if (resendTimer > 0) { return; }
        setOtp(Array(OTP_LENGTH).fill(''));
        startTimer();
        Alert.alert('OTP Sent', `A new OTP has been sent to ${maskedMobile}`);
    };

    /* ── Button animations ── */
    const handlePressIn = () => Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(buttonScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();

    /* ─────────────────── RENDER ─────────────────── */
    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            {/* Background */}
            <LinearGradient
                colors={colors.gradientColors}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <OilFlowBackground />

            {/* Decorative circles */}
            <View style={[styles.accentCircle, styles.accentCircle1, { backgroundColor: BrandColors.red600 + '22' }]} />
            <View style={[styles.accentCircle, styles.accentCircle2, { backgroundColor: BrandColors.yellow500 + '18' }]} />
            <View style={[styles.accentCircle, styles.accentCircle3, { backgroundColor: BrandColors.blue500 + '30' }]} />

            {/* Theme toggle */}
            <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme} activeOpacity={0.8}>
                <View style={[styles.themeToggleInner, { backgroundColor: colors.glassBackground, borderColor: colors.glassBorder }]}>
                    <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
                </View>
            </TouchableOpacity>

            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}>

                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoWrapper}>
                            <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
                        </View>
                        <Text style={[styles.tagline, { color: colors.textSecondary }]}>Distributor Portal</Text>
                    </View>

                    {/* Glass card */}
                    <Animated.View style={[
                        styles.glassCard,
                        {
                            backgroundColor: colors.glassBackground,
                            borderColor: colors.glassBorder,
                            opacity: cardOpacity,
                            transform: [{ translateY: cardTranslateY }],
                            shadowColor: colors.glassShadow,
                        },
                    ]}>
                        {/* Accent line */}
                        <LinearGradient
                            colors={[BrandColors.red600, BrandColors.yellow500, BrandColors.blue500]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.cardAccentLine}
                        />

                        {/* Step indicator */}
                        <View style={styles.stepIndicator}>
                            <View style={[styles.stepDot, { backgroundColor: BrandColors.blue500 }]}>
                                <Text style={styles.stepDotText}>1</Text>
                            </View>
                            <View style={[styles.stepLine, { backgroundColor: step === 'otp' ? BrandColors.blue500 : colors.divider }]} />
                            <View style={[styles.stepDot, {
                                backgroundColor: step === 'otp' ? BrandColors.blue500 : colors.divider,
                            }]}>
                                <Text style={styles.stepDotText}>2</Text>
                            </View>
                        </View>

                        {/* ── STEP 1: PAN ── */}
                        {step === 'pan' && (
                            <Animated.View style={{ opacity: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}>
                                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Welcome Back</Text>
                                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                                    Idhayam Distributors Enterprises
                                </Text>

                                {/* PAN Input */}
                                <View style={styles.inputWrapper}>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PAN Number</Text>
                                    <View style={[
                                        styles.inputContainer,
                                        {
                                            backgroundColor: colors.inputBackground,
                                            borderColor: panFocused ? colors.inputFocusBorder : colors.inputBorder,
                                        },
                                    ]}>
                                        <Text style={styles.inputIcon}>🪪</Text>
                                        <TextInput
                                            style={[styles.input, { color: colors.inputText }]}
                                            value={pan}
                                            onChangeText={t => setPan(t.toUpperCase())}
                                            placeholder="e.g. ABCDE1234F"
                                            placeholderTextColor={colors.inputPlaceholder}
                                            autoCapitalize="characters"
                                            autoCorrect={false}
                                            maxLength={10}
                                            onFocus={() => setPanFocused(true)}
                                            onBlur={() => setPanFocused(false)}
                                        />
                                        {pan.length === 10 && (
                                            <Text style={{ fontSize: 16 }}>
                                                {isPanValid(pan) ? '✅' : '❌'}
                                            </Text>
                                        )}
                                    </View>
                                    <Text style={[styles.panHint, { color: colors.textMuted }]}>
                                        Format: AAAAA9999A
                                    </Text>
                                </View>

                                {/* Send OTP Button */}
                                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                                    <TouchableOpacity
                                        onPressIn={handlePressIn}
                                        onPressOut={handlePressOut}
                                        onPress={handleSendOtp}
                                        activeOpacity={1}
                                        disabled={sendingOtp}>
                                        <LinearGradient
                                            colors={[colors.buttonPrimaryGradientStart, colors.buttonPrimaryGradientEnd]}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                            style={styles.loginButton}>
                                            {sendingOtp
                                                ? <ActivityIndicator color="#FFFFFF" size="small" />
                                                : <Text style={styles.loginButtonText}>Send OTP  →</Text>
                                            }
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </Animated.View>
                            </Animated.View>
                        )}

                        {/* ── STEP 2: OTP ── */}
                        {step === 'otp' && (
                            <Animated.View style={{ opacity: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}>
                                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Verify OTP</Text>
                                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                                    An OTP has been sent to your registered mobile number
                                </Text>
                                <View style={styles.maskedMobileRow}>
                                    <Text style={styles.mobileIcon}>📱</Text>
                                    <Text style={[styles.maskedMobile, { color: colors.textPrimary }]}>{maskedMobile}</Text>
                                </View>

                                {/* OTP Boxes */}
                                <View style={styles.otpRow}>
                                    {otp.map((digit, i) => (
                                        <TextInput
                                            key={i}
                                            ref={r => { otpRefs.current[i] = r; }}
                                            style={[
                                                styles.otpBox,
                                                {
                                                    color: colors.inputText,
                                                    backgroundColor: colors.inputBackground,
                                                    borderColor: digit
                                                        ? BrandColors.blue500
                                                        : colors.inputBorder,
                                                },
                                            ]}
                                            value={digit}
                                            onChangeText={t => handleOtpChange(t, i)}
                                            onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
                                            keyboardType="number-pad"
                                            maxLength={1}
                                            selectTextOnFocus
                                            textAlign="center"
                                        />
                                    ))}
                                </View>

                                {/* Verify Button */}
                                <Animated.View style={{ transform: [{ scale: buttonScale }], marginTop: 8 }}>
                                    <TouchableOpacity
                                        onPressIn={handlePressIn}
                                        onPressOut={handlePressOut}
                                        onPress={handleVerifyOtp}
                                        activeOpacity={1}
                                        disabled={verifying}>
                                        <LinearGradient
                                            colors={[BrandColors.blue500, BrandColors.blue700]}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                            style={styles.loginButton}>
                                            {verifying
                                                ? <ActivityIndicator color="#FFFFFF" size="small" />
                                                : <Text style={styles.loginButtonText}>✓  Verify & Login</Text>
                                            }
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </Animated.View>

                                {/* Resend & Back */}
                                <View style={styles.resendRow}>
                                    <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0} activeOpacity={0.7}>
                                        <Text style={[
                                            styles.resendText,
                                            { color: resendTimer > 0 ? colors.textMuted : colors.textLink },
                                        ]}>
                                            {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    onPress={() => { setStep('pan'); setOtp(Array(OTP_LENGTH).fill('')); }}
                                    style={styles.backBtn}
                                    activeOpacity={0.7}>
                                    <Text style={[styles.backText, { color: colors.textSecondary }]}>← Change PAN Number</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        )}

                        {/* Divider */}
                        <View style={styles.dividerRow}>
                            <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                            <Text style={[styles.dividerText, { color: colors.textMuted }]}>or</Text>
                            <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                        </View>

                        {/* Register */}
                        <TouchableOpacity
                            style={styles.registerRow}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate('Registration')}>
                            <Text style={[styles.registerText, { color: colors.textSecondary }]}>New distributor?  </Text>
                            <Text style={[styles.registerLink, { color: colors.textLink }]}>Register Here</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Bottom brand strip */}
                    <View style={styles.bottomRow}>
                        <LinearGradient
                            colors={[BrandColors.red600, BrandColors.yellow500, BrandColors.blue700]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.brandStrip}
                        />
                        <Text style={[styles.versionText, { color: colors.textMuted }]}>v1.0.0 • Idhayam Distributor</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

// ─────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────
const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 32,
        minHeight: height,
    },

    // Theme toggle
    themeToggle: { position: 'absolute', top: 52, right: 20, zIndex: 10 },
    themeToggleInner: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    themeIcon: { fontSize: 20 },

    // Circles
    accentCircle: { position: 'absolute', borderRadius: 999 },
    accentCircle1: { width: 280, height: 280, top: -80, right: -60 },
    accentCircle2: { width: 200, height: 200, bottom: 60, left: -60 },
    accentCircle3: { width: 150, height: 150, top: height * 0.35, right: -40 },

    // Logo
    logoContainer: { alignItems: 'center', marginBottom: 32 },
    logoWrapper: {
        width: 200, height: 100,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16, overflow: 'hidden',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
        marginBottom: 12,
    },
    logo: { width: 180, height: 80 },
    tagline: { fontSize: 14, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '500' },

    // Glass card
    glassCard: {
        width: '100%', maxWidth: 400,
        borderRadius: 24, borderWidth: 1,
        padding: 28,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 1, shadowRadius: 40, elevation: 20,
        overflow: 'hidden',
    },
    cardAccentLine: { height: 3, borderRadius: 2, marginBottom: 20, marginHorizontal: -28, marginTop: -28 },
    cardTitle: { fontSize: 26, fontWeight: '700', marginBottom: 4 },
    cardSubtitle: { fontSize: 13, marginBottom: 20, lineHeight: 20 },

    // Step indicator
    stepIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    stepDotText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    stepLine: { flex: 1, height: 2, marginHorizontal: 6 },

    // Inputs
    inputWrapper: { marginBottom: 16 },
    inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 14, borderWidth: 1.5,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === 'ios' ? 14 : 2,
    },
    inputIcon: { fontSize: 16, marginRight: 10 },
    input: { flex: 1, fontSize: 15, fontWeight: '400' },
    panHint: { fontSize: 11, marginTop: 6, letterSpacing: 0.3 },

    // OTP
    maskedMobileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10 },
    mobileIcon: { fontSize: 18, marginRight: 8 },
    maskedMobile: { fontSize: 15, fontWeight: '700', letterSpacing: 1 },
    otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    otpBox: {
        width: (width - 48 - 28 * 2 - 10 * 5) / 6,
        height: 52,
        borderRadius: 12,
        borderWidth: 1.5,
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
    },
    resendRow: { alignItems: 'center', marginTop: 14 },
    resendText: { fontSize: 13, fontWeight: '600' },
    backBtn: { alignItems: 'center', marginTop: 12 },
    backText: { fontSize: 13 },

    // Button
    loginButton: {
        borderRadius: 14, paddingVertical: 16,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: BrandColors.blue500,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
    },
    loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 1 },

    // Divider
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    dividerLine: { flex: 1, height: 1 },
    dividerText: { marginHorizontal: 12, fontSize: 13 },

    // Register
    registerRow: { flexDirection: 'row', justifyContent: 'center' },
    registerText: { fontSize: 13 },
    registerLink: { fontSize: 13, fontWeight: '700' },

    // Bottom
    bottomRow: { alignItems: 'center', marginTop: 32, width: '100%' },
    brandStrip: { height: 3, width: 60, borderRadius: 2, marginBottom: 12 },
    versionText: { fontSize: 11, letterSpacing: 0.5 },
});

export default LoginScreen;
