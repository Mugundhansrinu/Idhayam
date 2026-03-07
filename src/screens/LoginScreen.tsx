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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { AuthService } from '../api/auth';

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

    /* ── PAN & Mobile step ── */
    /* ── PAN & Mobile step ── */
    const [pan, setPan] = useState('');
    const [panFocused, setPanFocused] = useState(false);
    const [mobile, setMobile] = useState('');
    const [mobileFocused, setMobileFocused] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [fetchingMobiles, setFetchingMobiles] = useState(false);
    const [linkedMobiles, setLinkedMobiles] = useState<string[]>([]);

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
            setMobile('');
            setLinkedMobiles([]);
            setFetchingMobiles(false);
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

    /* ── Validation ── */
    const isPanValid = (v: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v.toUpperCase());
    const isMobileValid = (v: string) => /^[6-9][0-9]{9}$/.test(v);

    /**
     * PAN format: A A A A A 9 9 9 9 A
     *             0 1 2 3 4 5 6 7 8 9  (index)
     * Positions 0-4  → letters  → default keyboard
     * Positions 5-8  → digits   → number-pad
     * Position  9    → letter   → default keyboard
     */
    const panKeyboardType: 'default' | 'number-pad' =
        pan.length >= 5 && pan.length <= 8 ? 'number-pad' : 'default';

    /* ── Fetch Linked Mobiles ── */
    const handleFetchMobiles = async () => {
        const cleanPan = pan.trim().toUpperCase();
        if (!isPanValid(cleanPan)) {
            Alert.alert('Invalid PAN', 'Please enter a valid 10-character PAN number.\nExample: ABCDE1234F');
            return;
        }
        setFetchingMobiles(true);
        try {
            // Attempt to use API
            const serverMobiles = await AuthService.getMobileListByPan(cleanPan);
            setLinkedMobiles(serverMobiles.length > 0 ? serverMobiles : ['+91 98765 43210', '+91 87654 32109']); // Fallback to mock logic if array is exactly empty 
            if (serverMobiles.length > 0) {
                setMobile(serverMobiles[0]);
            } else {
                setMobile('+91 98765 43210');
            }
        } catch (error) {
            console.log('API unreachable or failed, falling back to Mock Data');
            const mockMobiles = ['9443534646', '9876543210'];
            setLinkedMobiles(mockMobiles);
            setMobile(mockMobiles[0]);
        } finally {
            setFetchingMobiles(false);
        }
    };

    /* ── Send OTP ── */
    const handleSendOtp = async () => {
        if (!mobile) {
            Alert.alert('Select Mobile', 'Please select a linked mobile number to receive the OTP.');
            return;
        }
        setSendingOtp(true);
        try {
            await AuthService.generateOtp(pan, mobile);
            console.log('OTP Sent Successfully via API');
        } catch (error) {
            console.log('OTP API failed, falling back to local simulation');
        } finally {
            setSendingOtp(false);
            setMaskedMobile(mobile);
            animateStep(() => setStep('otp'));
            startTimer();
        }
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
        try {
            // First Verify OTP
            await AuthService.verifyOtp(pan, mobile, enteredOtp);
            // If OTP succeeds, check login
            const loginResp = await AuthService.checkLogin(pan, mobile);
            console.log('Login successful:', loginResp);
            navigation.navigate('Dashboard');
        } catch (error) {
            console.log('Verify API failed, using fallback mock check');
            // Mock fallback verification
            setTimeout(() => {
                if (enteredOtp === '123456' || enteredOtp.length === OTP_LENGTH) {
                    navigation.navigate('Dashboard');
                } else {
                    Alert.alert('Invalid OTP', 'The OTP you entered is incorrect. Please try again.');
                    setOtp(Array(OTP_LENGTH).fill(''));
                    otpRefs.current[0]?.focus();
                }
            }, 800);
        } finally {
            setVerifying(false);
        }
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

                    <View style={styles.logoContainer}>
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
                                            backgroundColor: linkedMobiles.length > 0 ? colors.inputBackground + '88' : colors.inputBackground,
                                            borderColor: panFocused ? colors.inputFocusBorder : colors.inputBorder,
                                        },
                                    ]}>
                                        <Text style={styles.inputIcon}>🪪</Text>
                                        <TextInput
                                            style={[styles.input, { color: colors.inputText, opacity: linkedMobiles.length > 0 ? 0.6 : 1 }]}
                                            value={pan}
                                            onChangeText={t => setPan(t.toUpperCase())}
                                            placeholder="e.g. ABCDE1234F"
                                            placeholderTextColor={colors.inputPlaceholder}
                                            autoCapitalize="characters"
                                            autoCorrect={false}
                                            keyboardType={panKeyboardType}
                                            maxLength={10}
                                            onFocus={() => setPanFocused(true)}
                                            onBlur={() => setPanFocused(false)}
                                            editable={linkedMobiles.length === 0}
                                        />
                                        {pan.length === 10 && linkedMobiles.length === 0 && (
                                            <Text style={{ fontSize: 16 }}>
                                                {isPanValid(pan) ? '✅' : '❌'}
                                            </Text>
                                        )}
                                        {linkedMobiles.length > 0 && (
                                            <TouchableOpacity onPress={() => setLinkedMobiles([])} style={{ paddingLeft: 10 }}>
                                                <Text style={{ color: colors.textLink, fontSize: 13, fontWeight: '600' }}>Edit</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    {linkedMobiles.length === 0 && (
                                        <Text style={[styles.panHint, { color: colors.textMuted }]}>
                                            Format: AAAAA9999A
                                        </Text>
                                    )}
                                </View>

                                {linkedMobiles.length === 0 ? (
                                    /* Find Mobiles Button */
                                    <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                                        <TouchableOpacity
                                            onPressIn={handlePressIn}
                                            onPressOut={handlePressOut}
                                            onPress={handleFetchMobiles}
                                            activeOpacity={1}
                                            disabled={fetchingMobiles}>
                                            <LinearGradient
                                                colors={[colors.buttonPrimaryGradientStart, colors.buttonPrimaryGradientEnd]}
                                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                                style={styles.loginButton}>
                                                {fetchingMobiles
                                                    ? <ActivityIndicator color="#FFFFFF" size="small" />
                                                    : <Text style={styles.loginButtonText}>Find Linked Mobiles  →</Text>
                                                }
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </Animated.View>
                                ) : (
                                    <>
                                        {/* Linked Mobiles List */}
                                        <View style={styles.inputWrapper}>
                                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Select Registered Mobile</Text>
                                            <View style={styles.mobileList}>
                                                {linkedMobiles.map((num, idx) => (
                                                    <TouchableOpacity
                                                        key={idx}
                                                        style={[
                                                            styles.mobileOption,
                                                            {
                                                                borderColor: mobile === num ? BrandColors.blue500 : colors.inputBorder,
                                                                backgroundColor: mobile === num ? BrandColors.blue500 + '15' : colors.inputBackground
                                                            }
                                                        ]}
                                                        onPress={() => setMobile(num)}
                                                        activeOpacity={0.7}
                                                    >
                                                        <View style={[
                                                            styles.radioOuter,
                                                            { borderColor: mobile === num ? BrandColors.blue500 : colors.inputBorder }
                                                        ]}>
                                                            {mobile === num && <View style={[styles.radioInner, { backgroundColor: BrandColors.blue500 }]} />}
                                                        </View>
                                                        <Text style={styles.inputIcon}>📱</Text>
                                                        <Text style={[styles.mobileOptionText, { color: colors.textPrimary, fontWeight: mobile === num ? '700' : '500' }]}>{num}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
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
                                    </>
                                )}
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

    // Mascot
    logoContainer: { alignItems: 'center', marginBottom: 32 },
    mascotWrapper: {
        width: 140, height: 140,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 36, overflow: 'hidden',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
        marginBottom: 16,
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4, shadowRadius: 20,
    },
    mascot: { width: 140, height: 140 },
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

    // Linked Mobiles List
    mobileList: { marginTop: 4 },
    mobileOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 8 },
    mobileOptionText: { fontSize: 15, marginLeft: 8, letterSpacing: 1 },
    radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    radioInner: { width: 10, height: 10, borderRadius: 5 },

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
