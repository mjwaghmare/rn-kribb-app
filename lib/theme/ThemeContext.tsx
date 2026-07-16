import React, {createContext, ReactNode, useContext, useEffect, useState} from 'react';
import {Theme, ThemeMode} from './theme.types';
import {DARK_THEME, LIGHT_THEME} from './theme.constants';
import {useColorScheme} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@kribb_theme_mode';

interface ThemeContextType {
    theme: Theme;
    setThemeMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({children}) => {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
    const [theme, setTheme] = useState<Theme>({
        mode: 'system',
        colors: LIGHT_THEME,
        isDark: false,
    });
    const [isLoading, setIsLoading] = useState(true);

    // Load saved theme preference on mount
    useEffect(() => {
        void loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system')) {
                setThemeModeState(savedMode as ThemeMode);
            }
        } catch (error) {
            console.error('Failed to load theme preference:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Update theme when mode or system scheme changes
    useEffect(() => {
        if (isLoading) return;

        const isDark = themeMode === 'system'
            ? systemColorScheme === 'dark'
            : themeMode === 'dark';

        setTheme({
            mode: themeMode,
            colors: isDark ? DARK_THEME : LIGHT_THEME,
            isDark,
        });
    }, [themeMode, systemColorScheme, isLoading]);

    const setThemeMode = (mode: ThemeMode) => {
        setThemeModeState(mode);
        // Save to AsyncStorage
        AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(error => {
            console.error('Failed to save theme preference:', error);
        });
    };

    const toggleTheme = () => {
        const newMode = themeMode === 'light' ? 'dark' : 'light';
        setThemeMode(newMode);
    };

    if (isLoading) {
        return null; // or a loading spinner
    }

    return (
        <ThemeContext.Provider value={{theme, setThemeMode, toggleTheme}}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useThemeContext = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useThemeContext must be used within ThemeProvider');
    }
    return context;
};