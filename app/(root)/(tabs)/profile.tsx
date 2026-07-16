import {Text, ActivityIndicator, View, Image, TouchableOpacity, Alert} from 'react-native'
import React, {useState} from 'react'
import {useAuth, useUser} from "@clerk/expo";
import {router} from "expo-router";
import {SafeAreaView} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";


export default function ProfileScreen() {
    const {signOut} = useAuth();

    const {user, isLoaded} = useUser();
    const [isUpdating, setIsUpdating] = useState(false);

    const handleSignOut = async () => {
        try {
            await signOut();
            router.replace("/sign-in");
        } catch (e) {
            console.log(e);
        }
    }

    if (!isLoaded || !user) {
        return (
            <SafeAreaView className='flex-1 bg-white items-center justify-center'>
                <ActivityIndicator size='large' color='#3B82F6'/>
            </SafeAreaView>
        );
    }

    const handleUpdateImage = async () => {
        try {
            const permissionResult = await ImagePicker.getMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert(
                    "Permission Required",
                    "Please allow access to your photo library",
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: .8,
                base64: true,
            });

            if (result.canceled) return;
            const base64Image = result.assets[0].base64;
            const uri = result.assets[0].uri;
            const filename = uri.split("/").pop() || "profile.jpg";
            const match = /\.(\w+)$/.exec(filename);
            const mimeType = match ? `image/${match[1]}` : "image/jpeg";
            const dataUrl = `data:${mimeType};base64,${base64Image}`;

            await user?.setProfileImage({file: dataUrl});

            Alert.alert("Success", "Profile picture updated successfully!");

        } catch (e) {
            console.error("Error updating profile image:", e);
            Alert.alert(
                "Error",
                "Failed to update profile picture. Please try again."
            );
        } finally {
            setIsUpdating(false);
        }
    }

    if (!isLoaded || !user) {
        return (
            <SafeAreaView className='flex-1 bg-white items-center justify-center'>
                <ActivityIndicator size='large' color='#3B82F6'/>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className='flex-1 bg-gray-50 px-8 py-4'>
            <View className='items-center py-8'>
                <View className='relative'>
                    <Image
                        source={{uri: user.imageUrl}}
                        className='w-24 h-24 rounded-full mb-4'
                    />
                    <TouchableOpacity className='absolute bottom-3 right-0 bg-blue-600 rounded-full p-2'
                                      disabled={isUpdating}
                                      onPress={handleUpdateImage}
                    >
                        {
                            isUpdating ? (
                                <ActivityIndicator size='small' color='white'/>
                            ) : (
                                <Ionicons name="camera" size={16} color="white"/>
                            )
                        }
                    </TouchableOpacity>
                </View>
                <Text className='text-2xl font-bold text-gray-900'>Profile</Text>
            </View>
        </SafeAreaView>
    )
}
