import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppColors, { ColorTokens } from './Colors';

// ─────────────────────────────────────────
//  Types
// ─────────────────────────────────────────
type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
    /** Resolved colour tokens for the current theme */
    colors: ColorTokens;
    /** Whether dark mode is currently active */
    isDark: boolean;
    /** Current mode setting ('light' | 'dark' | 'system') */
    themeMode: ThemeMode;
    /** Toggle between light and dark (saves preference) */
    toggleTheme: () => void;
    /** Explicitly set theme mode */
    setThemeMode: (mode: ThemeMode) => void;
}

// ─────────────────────────────────────────
//  Context
// ─────────────────────────────────────────
const ThemeContext = createContext<ThemeContextValue>({
    colors: AppColors.light,
    isDark: false,
    themeMode: 'system',
    toggleTheme: () => { },
    setThemeMode: () => { },
});

const STORAGE_KEY = '@idhayam_theme_mode';

// ─────────────────────────────────────────
//  Provider
// ─────────────────────────────────────────
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const systemScheme = useColorScheme(); // 'light' | 'dark' | null
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

    // Load persisted preference on mount
    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then(stored => {
            if (stored === 'light' || stored === 'dark' || stored === 'system') {
                setThemeModeState(stored);
            }
        });
    }, []);

    // Resolve whether dark is active
    const isDark =
        themeMode === 'dark' ||
        (themeMode === 'system' && systemScheme === 'dark');

    const colors = AppColors.getColors(isDark);

    const setThemeMode = useCallback((mode: ThemeMode) => {
        setThemeModeState(mode);
        AsyncStorage.setItem(STORAGE_KEY, mode);
    }, []);

    const toggleTheme = useCallback(() => {
        const next = isDark ? 'light' : 'dark';
        setThemeMode(next);
    }, [isDark, setThemeMode]);

    return (
        <ThemeContext.Provider
            value={{ colors, isDark, themeMode, toggleTheme, setThemeMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

// ─────────────────────────────────────────
//  Hook
// ─────────────────────────────────────────
export const useTheme = (): ThemeContextValue => useContext(ThemeContext);

export default ThemeContext;
