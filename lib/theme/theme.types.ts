export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
    // Primary colors
    primary: string;
    primaryForeground: string;

    // Secondary colors
    secondary: string;
    secondaryForeground: string;

    // Background colors
    background: string;
    card: string;

    // Text colors
    text: string;
    textSecondary: string;

    // Border colors
    border: string;

    // Status colors
    success: string;
    error: string;
    warning: string;
}

export interface Theme {
    mode: ThemeMode;
    colors: ThemeColors;
    isDark: boolean;
}