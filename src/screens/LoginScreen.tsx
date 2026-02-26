import React, { useState, useRef } from 'react';
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

// ─────────────────────────────────────────
//  LoginScreen
// ─────────────────────────────────────────
const LoginScreen: React.FC<Props> = ({ navigation }) => {
    const { colors, isDark, toggleTheme } = useTheme();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [loading, setLoading] = useState(false);

    // Button press animation
    const buttonScale = useRef(new Animated.Value(1)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;
    const cardTranslateY = useRef(new Animated.Value(40)).current;

    React.useEffect(() => {
        // Card entrance animation
        Animated.parallel([
            Animated.timing(cardOpacity, {
                toValue: 1,
                duration: 700,
                useNativeDriver: true,
            }),
            Animated.spring(cardTranslateY, {
                toValue: 0,
                friction: 8,
                tension: 60,
                useNativeDriver: true,
            }),
        ]).start();
    }, [cardOpacity, cardTranslateY]);

    const handlePressIn = () => {
        Animated.spring(buttonScale, {
            toValue: 0.96,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(buttonScale, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
        }).start();
    };

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Validation', 'Please enter both email and password.');
            return;
        }
        setLoading(true);
        // Simulate API call → navigate to Dashboard
        setTimeout(() => {
            setLoading(false);
            navigation.navigate('Dashboard');
        }, 1500);
    };

    return (
        <View style={styles.container}>
            <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle="light-content"
            />

            {/* Full-screen gradient background */}
            <LinearGradient
                colors={colors.gradientColors}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <OilFlowBackground />

            {/* Decorative accent circles */}
            <View
                style={[
                    styles.accentCircle,
                    styles.accentCircle1,
                    { backgroundColor: BrandColors.red600 + '22' },
                ]}
            />
            <View
                style={[
                    styles.accentCircle,
                    styles.accentCircle2,
                    { backgroundColor: BrandColors.yellow500 + '18' },
                ]}
            />
            <View
                style={[
                    styles.accentCircle,
                    styles.accentCircle3,
                    { backgroundColor: BrandColors.blue500 + '30' },
                ]}
            />

            {/* Theme toggle */}
            <TouchableOpacity
                style={styles.themeToggle}
                onPress={toggleTheme}
                activeOpacity={0.8}>
                <View
                    style={[
                        styles.themeToggleInner,
                        {
                            backgroundColor: colors.glassBackground,
                            borderColor: colors.glassBorder,
                        },
                    ]}>
                    <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
                </View>
            </TouchableOpacity>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}>

                    {/* Logo section */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoWrapper}>
                            <Image
                                source={require('../assets/logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={[styles.tagline, { color: colors.textSecondary }]}>
                            Distributor Portal
                        </Text>
                    </View>

                    {/* Glass card */}
                    <Animated.View
                        style={[
                            styles.glassCard,
                            {
                                backgroundColor: colors.glassBackground,
                                borderColor: colors.glassBorder,
                                opacity: cardOpacity,
                                transform: [{ translateY: cardTranslateY }],
                                shadowColor: colors.glassShadow,
                            },
                        ]}>

                        {/* Card accent line */}
                        <LinearGradient
                            colors={[
                                BrandColors.red600,
                                BrandColors.yellow500,
                                BrandColors.blue500,
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.cardAccentLine}
                        />

                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                            Welcome Back
                        </Text>
                        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                            Sign in to your account
                        </Text>

                        {/* Email Input */}
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                Email / Username
                            </Text>
                            <View
                                style={[
                                    styles.inputContainer,
                                    {
                                        backgroundColor: colors.inputBackground,
                                        borderColor: emailFocused
                                            ? colors.inputFocusBorder
                                            : colors.inputBorder,
                                    },
                                ]}>
                                <Text style={styles.inputIcon}>✉️</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.inputText }]}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Enter your email"
                                    placeholderTextColor={colors.inputPlaceholder}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    onFocus={() => setEmailFocused(true)}
                                    onBlur={() => setEmailFocused(false)}
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                Password
                            </Text>
                            <View
                                style={[
                                    styles.inputContainer,
                                    {
                                        backgroundColor: colors.inputBackground,
                                        borderColor: passwordFocused
                                            ? colors.inputFocusBorder
                                            : colors.inputBorder,
                                    },
                                ]}>
                                <Text style={styles.inputIcon}>🔒</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.inputText }]}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Enter your password"
                                    placeholderTextColor={colors.inputPlaceholder}
                                    secureTextEntry={!showPassword}
                                    onFocus={() => setPasswordFocused(true)}
                                    onBlur={() => setPasswordFocused(false)}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    activeOpacity={0.7}>
                                    <Text style={styles.inputIcon}>
                                        {showPassword ? '🙈' : '👁️'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Forgot password */}
                        <TouchableOpacity
                            style={styles.forgotRow}
                            activeOpacity={0.7}>
                            <Text style={[styles.forgotText, { color: colors.textLink }]}>
                                Forgot Password?
                            </Text>
                        </TouchableOpacity>

                        {/* Login button */}
                        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                            <TouchableOpacity
                                onPressIn={handlePressIn}
                                onPressOut={handlePressOut}
                                onPress={handleLogin}
                                activeOpacity={1}
                                disabled={loading}>
                                <LinearGradient
                                    colors={[
                                        colors.buttonPrimaryGradientStart,
                                        colors.buttonPrimaryGradientEnd,
                                    ]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.loginButton}>
                                    {loading ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <Text style={styles.loginButtonText}>Sign In</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Divider */}
                        <View style={styles.dividerRow}>
                            <View
                                style={[
                                    styles.dividerLine,
                                    { backgroundColor: colors.divider },
                                ]}
                            />
                            <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                                or
                            </Text>
                            <View
                                style={[
                                    styles.dividerLine,
                                    { backgroundColor: colors.divider },
                                ]}
                            />
                        </View>

                        {/* Register link */}
                        <TouchableOpacity
                            style={styles.registerRow}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate('Registration')}>
                            <Text style={[styles.registerText, { color: colors.textSecondary }]}>
                                New distributor?{' '}
                            </Text>
                            <Text style={[styles.registerLink, { color: colors.textLink }]}>
                                Register Here
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Bottom brand strip */}
                    <View style={styles.bottomRow}>
                        <LinearGradient
                            colors={[
                                BrandColors.red600,
                                BrandColors.yellow500,
                                BrandColors.blue700,
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.brandStrip}
                        />
                        <Text style={[styles.versionText, { color: colors.textMuted }]}>
                            v1.0.0 • Idhayam Distributor
                        </Text>
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
    container: {
        flex: 1,
    },
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
    themeToggle: {
        position: 'absolute',
        top: 52,
        right: 20,
        zIndex: 10,
    },
    themeToggleInner: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    themeIcon: {
        fontSize: 20,
    },

    // Decorative circles
    accentCircle: {
        position: 'absolute',
        borderRadius: 999,
    },
    accentCircle1: {
        width: 280,
        height: 280,
        top: -80,
        right: -60,
    },
    accentCircle2: {
        width: 200,
        height: 200,
        bottom: 60,
        left: -60,
    },
    accentCircle3: {
        width: 150,
        height: 150,
        top: height * 0.35,
        right: -40,
    },

    // Logo
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoWrapper: {
        width: 200,
        height: 100,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        marginBottom: 12,
    },
    logo: {
        width: 180,
        height: 80,
    },
    tagline: {
        fontSize: 14,
        letterSpacing: 2,
        textTransform: 'uppercase',
        fontWeight: '500',
    },

    // Glass card
    glassCard: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        borderWidth: 1,
        padding: 28,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 1,
        shadowRadius: 40,
        elevation: 20,
        overflow: 'hidden',
    },
    cardAccentLine: {
        height: 3,
        borderRadius: 2,
        marginBottom: 24,
        marginHorizontal: -28,
        marginTop: -28,
    },
    cardTitle: {
        fontSize: 26,
        fontWeight: '700',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        marginBottom: 28,
    },

    // Inputs
    inputWrapper: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        borderWidth: 1.5,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === 'ios' ? 14 : 2,
    },
    inputIcon: {
        fontSize: 16,
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        fontWeight: '400',
    },

    // Forgot
    forgotRow: {
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    forgotText: {
        fontSize: 13,
        fontWeight: '600',
    },

    // Button
    loginButton: {
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: BrandColors.blue500,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 10,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
    },

    // Divider
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: 12,
        fontSize: 13,
    },

    // Register
    registerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    registerText: {
        fontSize: 13,
    },
    registerLink: {
        fontSize: 13,
        fontWeight: '700',
    },

    // Bottom
    bottomRow: {
        alignItems: 'center',
        marginTop: 32,
        width: '100%',
    },
    brandStrip: {
        height: 3,
        width: 60,
        borderRadius: 2,
        marginBottom: 12,
    },
    versionText: {
        fontSize: 11,
        letterSpacing: 0.5,
    },
});

export default LoginScreen;
