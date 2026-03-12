import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Text, Animated, Dimensions, StatusBar, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import LinearGradient from 'react-native-linear-gradient';
import { BrandColors } from '../theme/Colors';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

const { width } = Dimensions.get('window');

const SplashScreen: React.FC<Props> = ({ navigation }) => {
    const scale = useRef(new Animated.Value(0.85)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entry animation for logo and glass card
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
        ]).start();

        const timer = setTimeout(() => {
            navigation.replace('Login');
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            <LinearGradient
                colors={[BrandColors.blue900, '#02529C', '#013A70']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />


            <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
                {/* Ultra-Modern Glass Wrapper framing everything */}
                <View style={styles.glassContainer}>
                    <LinearGradient
                        colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.05)']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={styles.glassBackground}
                    />
                    <View style={styles.glassBorder} />

                    {/* Logo Image */}
                    <View style={styles.imageWrapper}>
                        <Image
                            source={require('../assets/idhayam.png')}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    </View>



                    {/* Branding text */}
                    <View style={styles.textWrapper}>
                        <Text style={styles.brandTitle}>IDHAYAM</Text>
                        <Text style={styles.brandSubtitle}>Say Idhayam  ♥  Spell Health</Text>
                    </View>

                    {/* Simple Loading Indicator at the bottom of the card */}
                    <View style={styles.loadingWrapper}>
                        <ActivityIndicator size="large" color={BrandColors.yellow500} />
                        <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    glassContainer: {
        width: width * 0.9,
        paddingVertical: 45,
        paddingHorizontal: 20,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 35,
        elevation: 15,
        position: 'relative',
        overflow: 'hidden',
    },
    glassBackground: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 40,
    },
    glassBorder: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 40,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    imageWrapper: {
        width: width * 0.55,
        height: width * 0.55,
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },

    textWrapper: {
        alignItems: 'center',
        marginBottom: 35,
    },
    brandTitle: {
        fontSize: 42,
        fontWeight: '900',
        color: BrandColors.yellow500,
        letterSpacing: 2,
        fontFamily: 'serif',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
        marginBottom: 8,
    },
    brandSubtitle: {
        fontSize: 14,
        fontWeight: '800',
        color: BrandColors.yellow500,
        letterSpacing: 1.2,
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    loadingWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.15)',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    loadingText: {
        color: BrandColors.yellow500,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
        marginLeft: 12,
    }
});

export default SplashScreen;
