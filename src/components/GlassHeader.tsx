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
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';

interface GlassHeaderProps {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    rightIcon?: React.ReactNode;
}

const GlassHeader: React.FC<GlassHeaderProps> = ({
    title,
    subtitle,
    onBack,
    rightIcon,
}) => {
    const { colors } = useTheme();
    const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 44;

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.glassBackground,
                    borderBottomColor: colors.glassBorder,
                    paddingTop: statusBarHeight + 8,
                },
            ]}>
            <View style={styles.row}>
                {onBack ? (
                    <TouchableOpacity
                        onPress={onBack}
                        style={[styles.backBtn, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: colors.glassBorder }]}
                        activeOpacity={0.7}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.placeholder} />
                )}

                <View style={styles.titleContainer}>
                    <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
                        {title}
                    </Text>
                    {subtitle ? (
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                            {subtitle}
                        </Text>
                    ) : null}
                </View>

                <View style={styles.rightArea}>
                    {rightIcon ?? <View style={styles.placeholder} />}
                </View>
            </View>
            {/* Accent line */}
            <LinearGradient
                colors={[BrandColors.red600, BrandColors.yellow500, BrandColors.blue500]}
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
    backIcon: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        lineHeight: 22,
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
