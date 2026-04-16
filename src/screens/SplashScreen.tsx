import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Text, Animated, Dimensions, StatusBar, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import LinearGradient from 'react-native-linear-gradient';
import { BrandColors } from '../theme/Colors';
import { checkAppVersion } from '../api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

const { width } = Dimensions.get('window');

const SplashScreen: React.FC<Props> = ({ navigation }) => {
    const scale = useRef(new Animated.Value(0.85)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const progress = useRef(new Animated.Value(0)).current;
    const insets = useSafeAreaInsets();

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
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            {/* Background Image */}
            <Image
                source={require('../assets/papa 2.png')}
                style={styles.backgroundImage}
                resizeMode="stretch"
            />

            {/* Blue Overlay Gradient */}
            <LinearGradient
                colors={['rgba(26, 35, 126, 0.4)', 'rgba(26, 35, 126, 0.7)']}
                style={StyleSheet.absoluteFillObject}
            />

            <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
                {/* Branding text - Styled like screenshot */}
                <View style={[styles.textWrapper, { marginTop: Math.max(60, insets.top + 20) }]}>
                    <Text style={styles.brandTitleHeadline}>IDHAYAM</Text>
                    <View style={styles.taglineRow}>
                        <Text style={styles.taglineText}>SAY IDHAYAM</Text>
                        <View style={styles.dot} />
                        <Text style={styles.taglineText}>SPELL HEALTH</Text>
                    </View>
                </View>

                {/* Progress Indicators */}
                <View style={[styles.loadingContainer, { marginTop: 'auto', marginBottom: 40 }]}>
                    <View style={styles.loadingBarBackground}>
                        <Animated.View style={[
                            styles.loadingBarFill,
                            {
                                width: progressWidth,
                                backgroundColor: BrandColors.idhayamYellow
                            }
                        ]} />
                    </View>
                    <Text style={styles.loadingTextLight}>Loading...</Text>
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
        backgroundColor: 'transparent',
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    logoCard: {
        width: width * 0.65,
        height: width * 0.65,
        backgroundColor: '#FFFFFF',
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.12,
        shadowRadius: 25,
        elevation: 12,
        marginBottom: 50,
        padding: 35,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    textWrapper: {
        alignItems: 'center',
    },
    brandTitleHeadline: {
        fontSize: 52,
        fontWeight: 'bold',
        color: BrandColors.idhayamYellow,
        letterSpacing: 2,
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    taglineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: -5,
    },
    taglineText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: BrandColors.idhayamYellow,
        marginHorizontal: 12,
    },
    loadingContainer: {
        width: '80%',
        alignItems: 'center',
    },
    loadingBarBackground: {
        width: '100%',
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 3,
        marginBottom: 15,
        overflow: 'hidden',
    },
    loadingBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    loadingTextLight: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 2,
        textTransform: 'uppercase',
    }
});

export default SplashScreen;
