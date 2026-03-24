/**
 * GlassHeader – App bar with optional back button, title, and right action
 */
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';

interface GlassHeaderProps {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    rightIcon?: React.ReactNode;
    backgroundColor?: string;
    gradientColors?: string[];
}

const GlassHeader: React.FC<GlassHeaderProps> = ({
    title,
    subtitle,
    onBack,
    rightIcon,
    backgroundColor,
    gradientColors,
}) => {
    const { colors } = useTheme();
    const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 44;

    const renderHeaderContent = () => (
        <View style={styles.row}>
            {onBack ? (
                <TouchableOpacity
                    onPress={onBack}
                    style={[
                        styles.backBtn, 
                        { 
                            backgroundColor: gradientColors ? 'rgba(255,255,255,0.2)' : colors.backgroundSecondary, 
                            borderColor: gradientColors ? 'rgba(255,255,255,0.3)' : colors.divider 
                        }
                    ]}
                    activeOpacity={0.7}>
                    <Icon name="arrow-back" size={24} color={gradientColors ? '#FFFFFF' : colors.textPrimary} />
                </TouchableOpacity>
            ) : (
                <View style={styles.placeholder} />
            )}

            <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: gradientColors ? '#FFFFFF' : colors.textPrimary }]} numberOfLines={1}>
                    {title}
                </Text>
                {subtitle ? (
                    <Text style={[styles.subtitle, { color: gradientColors ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]} numberOfLines={1}>
                        {subtitle}
                    </Text>
                ) : null}
            </View>

            <View style={styles.rightArea}>
                {rightIcon ?? <View style={styles.placeholder} />}
            </View>
        </View>
    );

    if (gradientColors) {
        return (
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                    styles.container,
                    {
                        borderBottomColor: colors.glassBorder,
                        paddingTop: statusBarHeight + 8,
                    },
                ]}>
                {renderHeaderContent()}
            </LinearGradient>
        );
    }

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: backgroundColor ?? colors.glassBackground,
                    borderBottomColor: colors.glassBorder,
                    paddingTop: statusBarHeight + 8,
                },
            ]}>
            {renderHeaderContent()}
            <LinearGradient
                colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.accentLine}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderBottomWidth: 1,
        paddingBottom: 0,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholder: {
        width: 40,
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    subtitle: {
        fontSize: 11,
        marginTop: 1,
        letterSpacing: 0.5,
    },
    rightArea: {
        width: 40,
        alignItems: 'flex-end',
    },
    accentLine: {
        height: 2,
    },
});

export default GlassHeader;
