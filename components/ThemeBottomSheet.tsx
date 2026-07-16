import React from 'react';
import {Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTheme, useThemeActions, useThemeColors} from '@/hooks/useTheme';
import {ThemeMode} from '@/lib/theme/theme.types';

interface ThemeBottomSheetProps {
    visible: boolean;
    onClose: () => void;
}

export default function ThemeBottomSheet({visible, onClose}: ThemeBottomSheetProps) {
    const colors = useThemeColors();
    const {setThemeMode} = useThemeActions();
    const theme = useTheme();
    const [selectedMode, setSelectedMode] = React.useState<ThemeMode>('light');
    const screenHeight = Dimensions.get('window').height;

    // Sync selected mode with current theme when modal opens
    React.useEffect(() => {
        if (visible) {
            setSelectedMode(theme.mode === 'system' ? (theme.isDark ? 'dark' : 'light') : theme.mode);
        }
    }, [visible, theme.mode, theme.isDark]);

    const handleThemeSelect = (mode: ThemeMode) => {
        setSelectedMode(mode);
        setThemeMode(mode);
        onClose();
    };

    const ThemePreview = ({mode, isSelected}: { mode: ThemeMode; isSelected: boolean }) => {
        const isDarkPreview = mode === 'dark';
        const previewColors = {
            background: isDarkPreview ? '#1C1C1E' : '#FFFFFF',
            card: isDarkPreview ? '#2C2C2E' : '#F2F2F7',
            text: isDarkPreview ? '#FFFFFF' : '#000000',
            border: isDarkPreview ? '#38383A' : '#C6C6C8',
        };

        return (
            <TouchableOpacity
                onPress={() => handleThemeSelect(mode)}
                className="flex-1 items-center"
                style={{marginHorizontal: 8}}
            >
                {/* Phone Preview */}
                <View
                    className="w-28 h-48 rounded-3xl border-2 mb-3 overflow-hidden"
                    style={[
                        styles.phonePreview,
                        {
                            backgroundColor: previewColors.background,
                            borderColor: isSelected ? colors.primary : previewColors.border,
                        },
                    ]}
                >
                    {/* Status Bar */}
                    <View className="h-6 px-3 flex-row items-center justify-between">
                        <View
                            className="w-12 h-1.5 rounded-full"
                            style={{backgroundColor: previewColors.card}}
                        />
                        <View className="flex-row gap-1">
                            <View
                                className="w-2 h-2 rounded-full"
                                style={{backgroundColor: previewColors.card}}
                            />
                            <View
                                className="w-2 h-2 rounded-full"
                                style={{backgroundColor: previewColors.card}}
                            />
                        </View>
                    </View>

                    {/* Content Preview */}
                    <View className="p-3 flex-1">
                        {/* Header Card */}
                        <View
                            className="h-12 rounded-xl mb-2"
                            style={{backgroundColor: previewColors.card}}
                        />
                        {/* Content Cards */}
                        <View
                            className="h-8 rounded-lg mb-1.5"
                            style={{backgroundColor: previewColors.card}}
                        />
                        <View
                            className="h-8 rounded-lg mb-1.5"
                            style={{backgroundColor: previewColors.card}}
                        />
                        <View
                            className="h-8 rounded-lg"
                            style={{backgroundColor: previewColors.card}}
                        />
                    </View>
                </View>

                {/* Theme Name */}
                <Text className="text-sm font-semibold mb-1 capitalize" style={{color: colors.text}}>
                    {mode}
                </Text>

                {/* Radio Button */}
                <View
                    className="w-6 h-6 rounded-full items-center justify-center border-2"
                    style={{
                        borderColor: isSelected ? colors.primary : colors.border,
                    }}
                >
                    {isSelected && (
                        <View
                            className="w-3 h-3 rounded-full"
                            style={{backgroundColor: colors.primary}}
                        />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="overFullScreen"
            onRequestClose={onClose}
            transparent
        >
            <View style={styles.modalContainer}>
                <View style={[styles.container, {backgroundColor: colors.background, height: screenHeight * 0.4}]}>
                    {/* Header */}
                    <View
                        className="flex-row items-center justify-between px-5 pt-6 pb-4 border-b"
                        style={{borderColor: colors.border}}
                    >
                        <TouchableOpacity onPress={onClose} className="p-1">
                            <Ionicons name="close" size={22} color={colors.text}/>
                        </TouchableOpacity>
                        <Text className="text-lg font-bold" style={{color: colors.text}}>
                            Theme
                        </Text>
                        <View className="w-6"/>
                    </View>

                    {/* Theme Options */}
                    <View className="flex-1 items-center justify-center px-8">
                        <View className="flex-row">
                            <ThemePreview mode="light" isSelected={selectedMode === 'light'}/>
                            <ThemePreview mode="dark" isSelected={selectedMode === 'dark'}/>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'transparent',
    },
    container: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    phonePreview: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
});