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
import GlassHeader from '../components/GlassHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

const { width, height } = Dimensions.get('window');

const MOCK_PHONES = ['+91 98765 43210', '+91 94435 34646', '+91 76543 21098'];

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Registration'>;
};

const RegistrationScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const [step, setStep] = useState<1 | 2 | 3>(1); 
    const [pan, setPan] = useState('');
    const [selectedPhone, setSelectedPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }, []);

    const handleVerifyPan = () => {
        if (pan.trim().length < 10) {
            Alert.alert('Invalid PAN', 'Please enter a valid 10-character PAN number.');
            return;
        }
        setStep(2);
    };

    const handleSendOtp = () => {
        if (!selectedPhone) {
            Alert.alert('Select Phone', 'Please select a mobile number.');
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setOtpSent(true);
            Alert.alert('OTP Sent', `OTP sent to ${selectedPhone}`);
        }, 1200);
    };

    const handleRegister = () => {
        if (otp.trim().length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP.');
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setStep(3);
        }, 1200);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            
            <GlassHeader 
                title="Registration" 
                subtitle={step === 1 ? "Verify your identity" : step === 2 ? "Verify mobile" : "Success"} 
                onBack={() => {
                    if (step === 2) setStep(1);
                    else navigation.goBack();
                }} 
                gradientColors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
            />

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    
                    <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>
                        
                        {step === 1 && (
                            <View style={styles.card}>
                                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Enter PAN No.</Text>
                                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Enter your 10-digit Permanent Account Number for verification.</Text>
                                
                                <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.divider }]}>
                                    <TextInput
                                        style={[styles.input, { color: colors.inputText }]}
                                        value={pan}
                                        onChangeText={t => setPan(t.toUpperCase())}
                                        placeholder="ABCDE1234F"
                                        placeholderTextColor={colors.inputPlaceholder}
                                        autoCapitalize="characters"
                                        maxLength={10}
                                    />
                                </View>
                                
                                <TouchableOpacity onPress={handleVerifyPan} activeOpacity={0.9} style={styles.btnWrapper}>
                                    <LinearGradient colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                                        <Text style={styles.btnText}>CONTINUE</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}

                        {step === 2 && (
                            <View style={styles.card}>
                                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Phone Verification</Text>
                                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Select the mobile number linked with your distributor account.</Text>

                                {MOCK_PHONES.map(phone => (
                                    <TouchableOpacity 
                                        key={phone} 
                                        onPress={() => setSelectedPhone(phone)}
                                        style={[styles.option, { backgroundColor: selectedPhone === phone ? BrandColors.primaryGradientStart + '10' : colors.inputBackground, borderColor: selectedPhone === phone ? BrandColors.primaryGradientStart : 'transparent' }]}
                                    >
                                        <View style={[styles.radio, { borderColor: selectedPhone === phone ? BrandColors.primaryGradientStart : colors.divider }]}>
                                            {selectedPhone === phone && <View style={[styles.radioInner, { backgroundColor: BrandColors.primaryGradientStart }]} />}
                                        </View>
                                        <Text style={[styles.optionText, { color: colors.textPrimary }]}>{phone}</Text>
                                    </TouchableOpacity>
                                ))}

                                {!otpSent ? (
                                    <TouchableOpacity onPress={handleSendOtp} activeOpacity={0.9} style={styles.btnWrapper}>
                                        <LinearGradient colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>SEND OTP</Text>}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={{ marginTop: 20 }}>
                                        <Text style={[styles.label, { color: colors.textSecondary }]}>ENTER 6-DIGIT OTP</Text>
                                        <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.divider }]}>
                                            <TextInput
                                                style={[styles.input, { color: colors.inputText, letterSpacing: 10, textAlign: 'center', fontSize: 20, fontWeight: '900' }]}
                                                value={otp}
                                                onChangeText={setOtp}
                                                placeholder="••••••"
                                                placeholderTextColor={colors.inputPlaceholder}
                                                keyboardType="number-pad"
                                                maxLength={6}
                                            />
                                        </View>
                                        <TouchableOpacity onPress={handleRegister} activeOpacity={0.9} style={styles.btnWrapper}>
                                            <LinearGradient colors={[BrandColors.verifyGradientStart, BrandColors.verifyGradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>VERIFY & REGISTER</Text>}
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}

                        {step === 3 && (
                            <View style={[styles.card, { alignItems: 'center', paddingVertical: 40 }]}>
                                <View style={[styles.iconCircle, { backgroundColor: '#E8FDF0' }]}>
                                    <Text style={{ fontSize: 40 }}>✅</Text>
                                </View>
                                <Text style={[styles.cardTitle, { color: colors.textPrimary, marginTop: 20 }]}>Registration Successful!</Text>
                                <Text style={[styles.cardSub, { color: colors.textSecondary, textAlign: 'center' }]}>Welcome to the Idhayam Distributor Portal. Your account is now active.</Text>
                                
                                <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} activeOpacity={0.9} style={[styles.btnWrapper, { width: '100%', marginTop: 30 }]}>
                                    <LinearGradient colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                                        <Text style={styles.btnText}>GO TO DASHBOARD</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}

                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 25, alignItems: 'center', paddingBottom: 60 },
    card: { backgroundColor: '#fff', borderRadius: 32, padding: 30, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
    cardTitle: { fontSize: 24, fontWeight: '900', marginBottom: 10 },
    cardSub: { fontSize: 13, lineHeight: 20, marginBottom: 25 },
    
    inputContainer: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 16 : 8, marginBottom: 20 },
    input: { fontSize: 16, fontWeight: '700' },
    
    btnWrapper: { borderRadius: 18, overflow: 'hidden', marginTop: 10 },
    primaryBtn: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
    btnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    
    option: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    radioInner: { width: 10, height: 10, borderRadius: 5 },
    optionText: { fontSize: 15, fontWeight: '700' },
    
    label: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10, marginLeft: 5 },
    iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
});

export default RegistrationScreen;
