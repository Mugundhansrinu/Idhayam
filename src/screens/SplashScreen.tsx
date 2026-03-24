import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Text, Animated, Dimensions, StatusBar, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import LinearGradient from 'react-native-linear-gradient';
import { BrandColors } from '../theme/Colors';
import { checkAppVersion } from '../api';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

const { width } = Dimensions.get('window');

const SplashScreen: React.FC<Props> = ({ navigation }) => {
    const scale = useRef(new Animated.Value(0.85)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;

        // Trigger CLOUDAPP_KEY API on App Start
        checkAppVersion().then((res) => {
            const responseText = typeof res === 'string' ? res : JSON.stringify(res);
            if (responseText && responseText.includes('EXPIRE')) {
                clearTimeout(timer);
                Alert.alert(
                    'Update Required',
                    'Please Update the New Version',
                    [{ text: 'OK' }],
                    { cancelable: false }
                );
            }
        }).catch(err => console.log('Version check failed:', err));

        Animated.parallel([
            Animated.spring(scale, {
                toValue: 1,
                friction: 7,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(progress, {
                toValue: 1,
                duration: 3000,
                useNativeDriver: false,
            }),
        ]).start();

        timer = setTimeout(() => {
            navigation.replace('Login');
        }, 3200);

        return () => clearTimeout(timer);
    }, [navigation]);

    const progressWidth = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
                {/* Logo Card */}
                <View style={styles.logoCard}>
                    <Image
                        source={require('../assets/idhayam.png')}
                        style={styles.image}
                        resizeMode="contain"
                    />
                </View>

                {/* Branding text */}
                <View style={styles.textWrapper}>
                    <Text style={styles.brandTitle}>IDHAYAM</Text>
                    <View style={styles.taglineRow}>
                        <Text style={styles.brandSubtitle}>Say Idhayam </Text>
                        <Text style={styles.heart}>❤️</Text>
                        <Text style={styles.brandSubtitle}> Spell Health</Text>
                    </View>
                </View>

                {/* Portal Button */}
                <View style={styles.buttonWrapper}>
                    <LinearGradient
                        colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.portalButton}>
                        <Text style={styles.portalButtonText}>DISTRIBUTOR PORTAL</Text>
                    </LinearGradient>
                </View>

                {/* Loading Bar */}
                <View style={styles.loadingContainer}>
                    <View style={styles.loadingBarBackground}>
                        <Animated.View style={[
                            styles.loadingBarFill, 
                            { 
                                width: progressWidth,
                                backgroundColor: BrandColors.primaryGradientStart 
                            }
                        ]} />
                    </View>
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    logoCard: {
        width: width * 0.7,
        height: width * 0.7,
        backgroundColor: '#FFFFFF',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6C5CE7',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 10,
        marginBottom: 40,
        padding: 20,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    textWrapper: {
        alignItems: 'center',
        marginBottom: 40,
    },
    brandTitle: {
        fontSize: 48,
        fontWeight: '900',
        color: '#4F4F4F',
        letterSpacing: 4,
        marginBottom: 10,
    },
    taglineRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandSubtitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#BDBDBD',
        letterSpacing: 0.5,
    },
    heart: {
        fontSize: 14,
        marginHorizontal: 4,
    },
    buttonWrapper: {
        width: '100%',
        marginBottom: 50,
    },
    portalButton: {
        borderRadius: 25,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    portalButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1,
    },
    loadingContainer: {
        width: '80%',
        alignItems: 'center',
    },
    loadingBarBackground: {
        width: '100%',
        height: 4,
        backgroundColor: '#F2F2F2',
        borderRadius: 2,
        marginBottom: 12,
        overflow: 'hidden',
    },
    loadingBarFill: {
        height: '100%',
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
    },
    loadingText: {
        color: '#828282',
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 1,
    }
});

export default SplashScreen;
