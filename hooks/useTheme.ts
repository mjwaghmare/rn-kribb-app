import {useThemeContext} from '@/lib/theme/ThemeContext';
import {Theme, ThemeColors} from '@/lib/theme/theme.types';

export const useTheme = (): Theme => {
    const {theme} = useThemeContext();
    return theme;
};

export const useThemeColors = (): ThemeColors => {
    const {theme} = useThemeContext();
    return theme.colors;
};

export const useThemeActions = () => {
    const {setThemeMode, toggleTheme} = useThemeContext();
    return {setThemeMode, toggleTheme};
};