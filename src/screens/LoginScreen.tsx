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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { AuthService } from '../api/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

const OTP_LENGTH = 6;
const RESEND_TIMER = 30;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const maskMobileNumber = (num: string) => {
        if (!num) return '';
        const clean = num.trim();
        if (clean.length <= 4) return clean;
        return '*'.repeat(clean.length - 4) + clean.slice(-4);
    };

    /* ── Step state ── */
    const [step, setStep] = useState<'pan' | 'otp'>('pan');

    /* ── PAN & Mobile step ── */
    const [apiMessage, setApiMessage] = useState('');
    const [pan, setPan] = useState('');
    const [panFocused, setPanFocused] = useState(false);
    const [mobile, setMobile] = useState('');
    const [fetchingMobiles, setFetchingMobiles] = useState(false);
    const [linkedMobiles, setLinkedMobiles] = useState<string[]>([]);
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

    const isPanValid = (v: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v.toUpperCase());

    const handleFetchMobiles = async () => {
        const cleanPan = pan.trim().toUpperCase();
        if (!isPanValid(cleanPan)) {
            setApiMessage('Invalid PAN format.');
            return;
        }
        setFetchingMobiles(true);
        setApiMessage('');
        try {
            const serverMobiles = await AuthService.getMobileListByPan(cleanPan);
            setLinkedMobiles(serverMobiles);
            setMobile(serverMobiles[0]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Error fetching mobiles.');
        } finally {
            setFetchingMobiles(false);
        }
    };

    const handleSendOtp = async () => {
        setSendingOtp(true);
        setApiMessage('');
        try {
            const response = await AuthService.generateOtp(pan, mobile);
            if (pan === 'VVVRM1234S' || pan === 'ABCDE1234Z') {
                setApiMessage(response.message);
            }
            
            // Only transition to OTP step if request succeeds
            setMaskedMobile(mobile);
            animateStep(() => setStep('otp'));
            startTimer();
        } catch (error: any) {
            Alert.alert('Error', error.message || "Failed to send OTP");
        } finally {
            setSendingOtp(false);
        }
    };

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

    const handleVerifyOtp = async () => {
        const enteredOtp = otp.join('');
        if (enteredOtp.length < OTP_LENGTH) {
            Alert.alert('Error', 'Please enter valid OTP');
            return;
        }
        setVerifying(true);
        setApiMessage('');
        try {
            const verifyRes = await AuthService.verifyOtp(pan, mobile, enteredOtp);
            const loginRes = await AuthService.checkLogin(pan, mobile, verifyRes.eid);

            if (loginRes?.data?.message === "Login Successful") {
                const finalData = { ...loginRes.data, eid: verifyRes.eid, pan, mobile };
                navigation.navigate('LoginResponse', { data: finalData });
            } else {
                setOtp(Array(OTP_LENGTH).fill(''));
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Invalid OTP');
            setOtp(Array(OTP_LENGTH).fill(''));
        } finally {
            setVerifying(false);
        }
    };

    const handlePressIn = () => Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(buttonScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}>



                    <View style={styles.welcomeContainer}>
                        <Text style={styles.welcomeTitle}>Welcome Back!</Text>
                        <Text style={styles.welcomeSubtitle}>Sign in to your Idhayam account</Text>
                    </View>

                    {/* Step Card */}
                    <Animated.View style={[
                        styles.formCard,
                        {
                            opacity: cardOpacity,
                            transform: [{ translateY: cardTranslateY }],
                        },
                    ]}>

                        {/* Custom Step Indicator matching screenshot */}
                        <View style={styles.stepIndicator}>
                            <View style={[styles.stepItem, step === 'pan' ? styles.stepItemActive : styles.stepItemInactive]}>
                                <Text style={[styles.stepItemText, step === 'pan' ? styles.stepItemTextActive : styles.stepItemTextInactive]}>1 PAN</Text>
                            </View>
                            <View style={styles.stepConnector} />
                            <View style={[styles.stepItem, step === 'otp' ? styles.stepItemActive : styles.stepItemInactive]}>
                                <Text style={[styles.stepItemText, step === 'otp' ? styles.stepItemTextActive : styles.stepItemTextInactive]}>2 OTP</Text>
                            </View>
                        </View>

                        {/* Current Form Section */}
                        {step === 'pan' ? (
                            <View>
                                <Text style={styles.formSectionTitle}>Enter PAN</Text>
                                <Text style={styles.formSectionSub}>Your Permanent Account Number</Text>
                                
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>PAN NUMBER</Text>
                                    <View style={[styles.inputBox, panFocused && styles.inputBoxFocused]}>
                                        <Icon name="badge" size={18} color="#A0AEC0" style={{ marginRight: 10 }} />
                                        <TextInput
                                            style={styles.textInputMain}
                                            value={pan}
                                            onChangeText={t => { setPan(t.toUpperCase()); setApiMessage(''); }}
                                            placeholder="e.g. AAAAA9999A"
                                            placeholderTextColor="#A0AEC0"
                                            onFocus={() => setPanFocused(true)}
                                            onBlur={() => setPanFocused(false)}
                                            autoCapitalize="characters"
                                            maxLength={10}
                                        />
                                        {linkedMobiles.length > 0 && (
                                            <TouchableOpacity onPress={() => setLinkedMobiles([])}>
                                                <Text style={styles.editText}>Edit</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <Text style={styles.formatHint}>Format: AAAAA9999A</Text>
                                </View>

                                {linkedMobiles.length > 0 && (
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>SELECT MOBILE NUMBER</Text>
                                        <View style={{ marginTop: 5 }}>
                                            {linkedMobiles.map((num, i) => (
                                                <TouchableOpacity 
                                                    key={i} 
                                                    style={[styles.phoneOption, mobile === num && styles.phoneOptionActive]} 
                                                    onPress={() => setMobile(num)}
                                                >
                                                    <View style={[styles.rOuter, mobile === num && styles.rOuterActive]}>
                                                        {mobile === num && <View style={styles.rInner} />}
                                                    </View>
                                                    <Text style={[styles.phoneText, mobile === num && styles.phoneTextActive]}>{maskMobileNumber(num)}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPressIn={handlePressIn}
                                        onPressOut={handlePressOut}
                                        onPress={linkedMobiles.length === 0 ? handleFetchMobiles : handleSendOtp}
                                    >
                                        <LinearGradient
                                            colors={['#3861FB', '#2752E7']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.mainBtn}
                                        >
                                            {fetchingMobiles || sendingOtp ? (
                                                <ActivityIndicator color="#fff" />
                                            ) : (
                                                <Text style={styles.mainBtnText}>
                                                    {linkedMobiles.length === 0 ? 'Find Linked Mobiles →' : 'Send OTP →'}
                                                </Text>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </Animated.View>
                            </View>
                        ) : (
                            <View>
                                <Text style={styles.formSectionTitle}>Verify OTP</Text>
                                <Text style={styles.formSectionSub}>Code sent to your mobile</Text>
                                
                                {(pan === 'VVVRM1234S' || pan === 'ABCDE1234Z') && !!apiMessage && (
                                    <View style={styles.testOtpBadge}>
                                        <Text style={styles.testOtpText}>OTP: {apiMessage}</Text>
                                    </View>
                                )}

                                <View style={styles.otpSentBadge}>
                                    <Icon name="phone-iphone" size={16} color="#3861FB" style={{ marginRight: 8 }} />
                                    <Text style={styles.otpSentText}>{maskMobileNumber(maskedMobile)}</Text>
                                </View>

                                <View style={styles.otpRow}>
                                    {otp.map((d, idx) => (
                                        <TextInput
                                            key={idx}
                                            ref={r => { otpRefs.current[idx] = r; }}
                                            style={[styles.otpInput, !!d && styles.otpInputActive]}
                                            keyboardType="number-pad"
                                            maxLength={1}
                                            value={d}
                                            onChangeText={t => handleOtpChange(t, idx)}
                                            onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, idx)}
                                        />
                                    ))}
                                </View>

                                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPressIn={handlePressIn}
                                        onPressOut={handlePressOut}
                                        onPress={handleVerifyOtp}
                                    >
                                        <LinearGradient
                                            colors={['#3861FB', '#2752E7']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.mainBtn}
                                        >
                                            {verifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>Verify & Login →</Text>}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </Animated.View>

                                <View style={styles.bottomLinkRow}>
                                    {resendTimer > 0 ? (
                                        <Text style={styles.resendInfo}>Resend OTP in <Text style={{ color: '#3861FB' }}>{resendTimer}s</Text></Text>
                                    ) : (
                                        <TouchableOpacity onPress={handleSendOtp}>
                                            <Text style={styles.resendInfo}>Didn't receive it? <Text style={styles.resendLink}>Resend Now</Text></Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <TouchableOpacity onPress={() => setStep('pan')} style={styles.changePanBtn}>
                                    <Icon name="edit" size={16} color="#3861FB" style={{ marginRight: 6 }} />
                                    <Text style={styles.changePanBtnText}>Change PAN Number</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </Animated.View>

                    <View style={styles.trustFooter}>
                        <View style={styles.secureBadge}>
                            <Icon name="verified-user" size={18} color="#3861FB" />
                            <View style={{ marginLeft: 10 }}>
                                <Text style={styles.secureTitle}>100% Secure Login</Text>
                                <Text style={styles.secureSub}>Bank-level encryption</Text>
                            </View>
                        </View>
                        <Text style={styles.versionText}>v6.7 • Idhayam Distributor</Text>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FD' },
    flex: { flex: 1 },
    scrollContent: { paddingTop: Platform.OS === 'ios' ? 70 : 50, paddingBottom: 60, alignItems: 'center' },

    topBadgeWrapper: { paddingTop: Platform.OS === 'ios' ? 70 : 50, marginBottom: 20 },
    distributorBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#fff', 
        paddingHorizontal: 15, 
        paddingVertical: 10, 
        borderRadius: 25,
        shadowColor: '#3861FB',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5
    },
    badgeText: { fontSize: 13, fontWeight: '800', color: '#3861FB' },

    welcomeContainer: { width: '100%', paddingHorizontal: 30, marginBottom: 35, alignItems: 'center' },
    welcomeTitle: { fontSize: 32, fontWeight: '900', color: '#1A1A1A', marginBottom: 10 },
    welcomeSubtitle: { fontSize: 15, color: '#718096', fontWeight: '500' },

    formCard: { 
        width: width * 0.9, 
        backgroundColor: '#FFFFFF', 
        borderRadius: 35, 
        padding: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.05,
        shadowRadius: 30,
        elevation: 10,
        marginBottom: 30
    },

    stepIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 35 },
    stepItem: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
    stepItemActive: { backgroundColor: '#3861FB' },
    stepItemInactive: { backgroundColor: '#F1F5F9' },
    stepItemText: { fontSize: 13, fontWeight: '900' },
    stepItemTextActive: { color: '#fff' },
    stepItemTextInactive: { color: '#94A3B8' },
    stepConnector: { flex: 1, height: 1.5, backgroundColor: '#E2E8F0', marginHorizontal: 10 },

    formSectionTitle: { fontSize: 24, fontWeight: '900', color: '#1A1A1A', marginBottom: 8 },
    formSectionSub: { fontSize: 14, color: '#718096', marginBottom: 25, fontWeight: '500' },

    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 11, fontWeight: '900', color: '#1A1A1A', marginBottom: 12, letterSpacing: 1 },
    inputBox: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#F8F9FD', 
        borderWidth: 1.5, 
        borderColor: '#EDF2F7', 
        borderRadius: 18, 
        paddingHorizontal: 15, 
        paddingVertical: Platform.OS === 'ios' ? 16 : 4
    },
    inputBoxFocused: { borderColor: '#3861FB', backgroundColor: '#fff' },
    textInputMain: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
    formatHint: { fontSize: 11, color: '#A0AEC0', marginTop: 10, fontWeight: '600' },
    editText: { color: '#3861FB', fontSize: 13, fontWeight: '800' },

    phoneOption: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 18, 
        backgroundColor: '#fff',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#EDF2F7',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 1
    },
    phoneOptionActive: { backgroundColor: '#F0F4FF', borderColor: '#3861FB', borderWidth: 1.5 },
    rOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CBD5E0', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    rOuterActive: { borderColor: '#3861FB' },
    rInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3861FB' },
    phoneText: { fontSize: 15, fontWeight: '700', color: '#718096' },
    phoneTextActive: { color: '#1A1A1A', fontWeight: '900' },

    mainBtn: { borderRadius: 20, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#3861FB', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 10 } },
    mainBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

    otpSentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4FF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 15, marginBottom: 25 },
    testOtpBadge: { backgroundColor: '#F0F4FF', padding: 12, borderRadius: 15, marginBottom: 15, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#3861FB' },
    testOtpText: { fontSize: 13, fontWeight: '700', color: '#718096', textAlign: 'center' },
    otpSentText: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
    otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 35 },
    otpInput: { width: width * 0.11, height: 55, borderRadius: 12, backgroundColor: '#F8F9FD', borderWidth: 1.5, borderColor: '#EDF2F7', fontSize: 20, fontWeight: '900', color: '#1A1A1A', textAlign: 'center' },
    otpInputActive: { borderColor: '#3861FB', backgroundColor: '#fff' },

    bottomLinkRow: { width: '100%', alignItems: 'center', marginTop: 25 },
    resendInfo: { fontSize: 13, fontWeight: '600', color: '#718096' },
    resendLink: { color: '#1A1A1A', fontWeight: '800' },
    changePanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 25, backgroundColor: '#eaefff', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#d3deff' },
    changePanBtnText: { fontSize: 13, fontWeight: '800', color: '#3861FB', letterSpacing: 0.3 },

    trustFooter: { width: '100%', alignItems: 'center', marginTop: 15 },
    secureBadge: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    secureTitle: { fontSize: 14, fontWeight: '900', color: '#1A1A1A' },
    secureSub: { fontSize: 11, color: '#718096', fontWeight: '600' },
    versionText: { fontSize: 11, color: '#CBD5E0', fontWeight: '700', marginTop: 20 },
});

export default LoginScreen;
