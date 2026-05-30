/**
 * GlassCard – Reusable glassmorphism card with optional accent line
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import { BrandColors } from '../theme/Colors';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    accentLine?: boolean;
    padding?: number;
}

const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    accentLine = false,
    padding = 20,
}) => {
    const { colors } = useTheme();

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.glassBackground,
                    borderColor: colors.glassBorder,
                    shadowColor: colors.glassShadow,
                    padding,
                },
                style,
            ]}>
            {accentLine && (
                <LinearGradient
                    colors={[BrandColors.primaryGradientStart, BrandColors.primaryGradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.accentLine, { marginHorizontal: -padding, marginTop: -padding }]}
                />
            )}
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 30,
        elevation: 12,
        overflow: 'hidden',
    },
    accentLine: {
        height: 3,
        borderRadius: 2,
        marginBottom: 20,
    },
});

export default GlassCard;
