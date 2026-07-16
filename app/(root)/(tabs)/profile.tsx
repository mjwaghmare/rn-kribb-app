import {useAuth, useUser} from "@clerk/expo";
import {Ionicons} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {useRouter} from "expo-router";
import {useState} from "react";
import {ActivityIndicator, Alert, Image, Linking, Text, TouchableOpacity, View,} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import ThemeBottomSheet from "@/components/ThemeBottomSheet";
import {useThemeColors} from "@/hooks/useTheme";

export default function ProfileScreen() {
    const { user, isLoaded } = useUser();
    const { signOut } = useAuth();
    const router = useRouter();
    const [isUpdating, setIsUpdating] = useState(false);
    const [showThemeSheet, setShowThemeSheet] = useState(false);
    const colors = useThemeColors();

    const handleSignOut = async () => {
        try {
            await signOut();
            router.replace("/sign-in");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const handleUpdateProfileImage = async () => {
        try {
            const permissionResult =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert(
                    "Permission Required",
                    "Please allow access to your photo library to update your profile picture."
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: "images",
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
                base64: true,
            });

            if (result.canceled) return;

            setIsUpdating(true);

            const base64Image = result.assets[0].base64;
            const uri = result.assets[0].uri;
            const filename = uri.split("/").pop() || "profile.jpg";
            const match = /\.(\w+)$/.exec(filename);
            const mimeType = match ? `image/${match[1]}` : "image/jpeg";
            const dataUrl = `data:${mimeType};base64,${base64Image}`;

            await user?.setProfileImage({ file: dataUrl });

            Alert.alert("Success", "Profile picture updated successfully!");
        } catch (error) {
            console.error("Error updating profile image:", error);
            Alert.alert(
                "Error",
                "Failed to update profile picture. Please try again."
            );
        } finally {
            setIsUpdating(false);
        }
    };

    if (!isLoaded || !user) {
        return (
            <SafeAreaView style={{backgroundColor: colors.background}} className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color={colors.primary}/>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{backgroundColor: colors.background}} className="flex-1">
            {/* Avatar + Name */}
            <View className="items-center py-8">
                <View className="relative">
                    <Image
                        source={{ uri: user.imageUrl }}
                        className="w-24 h-24 rounded-full mb-4"
                    />
                    <TouchableOpacity
                        onPress={handleUpdateProfileImage}
                        disabled={isUpdating}
                        className="absolute bottom-3 right-0 bg-blue-600 rounded-full p-2"
                    >
                        {isUpdating ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Ionicons name="camera" size={16} color="white" />
                        )}
                    </TouchableOpacity>
                </View>
                <Text className="text-xl font-bold" style={{color: colors.text}}>
                    {user.firstName} {user.lastName}
                </Text>
                <Text className="mt-1" style={{color: colors.textSecondary}}>
                    {user.emailAddresses[0].emailAddress}
                </Text>
            </View>

            {/* Menu Items */}
            <View className="px-6 gap-2">
                <MenuItem
                    icon="heart-outline"
                    label="Saved Properties"
                    onPress={() => router.push("/(root)/(tabs)/saved")}
                />
                <MenuItem
                    icon="notifications-outline"
                    label="Notifications"
                    onPress={() =>
                        Alert.alert("Coming Soon", "Notifications coming soon!")
                    }
                />
                <MenuItem
                    icon="moon-outline"
                    label="Theme"
                    onPress={() => setShowThemeSheet(true)}
                />
                <MenuItem
                    icon="settings-outline"
                    label="Settings"
                    onPress={() => Alert.alert("Coming Soon", "Settings coming soon!")}
                />
                <MenuItem
                    icon="help-circle-outline"
                    label="Help & Support"
                    onPress={() =>
                        Linking.openURL(
                            "mailto:piyushagarwalvo@gmail.com?subject=Help%20%26%20Support%20-%20Kribb%20App"
                        )
                    }
                />
            </View>

            {/* Sign Out */}
            <View className="px-6 mt-auto mb-24">
                <TouchableOpacity
                    onPress={handleSignOut}
                    className="flex-row items-center justify-center gap-2 py-4 rounded-2xl border"
                    style={{backgroundColor: colors.card, borderColor: colors.border}}
                >
                    <Ionicons name="log-out-outline" size={20} color={colors.error}/>
                    <Text style={{color: colors.error}} className="font-semibold text-base">Sign Out</Text>
                </TouchableOpacity>
            </View>

            {/* Theme Bottom Sheet */}
            <ThemeBottomSheet
                visible={showThemeSheet}
                onClose={() => setShowThemeSheet(false)}
            />
        </SafeAreaView>
    );
}

function MenuItem({
                      icon,
                      label,
                      onPress,
                  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress?: () => void;
}) {
    const colors = useThemeColors();
    return (
        <TouchableOpacity
            onPress={onPress}
            className="flex-row items-center gap-4 px-4 py-4 rounded-2xl"
            style={{backgroundColor: colors.card}}
        >
            <Ionicons name={icon} size={22} color={colors.textSecondary}/>
            <Text className="flex-1 font-medium text-base" style={{color: colors.text}}>
                {label}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.border}/>
        </TouchableOpacity>
    );
}