import {ActivityIndicator, FlatList, Text, View} from 'react-native'
import React, {useCallback, useState} from 'react'
import {SafeAreaView} from "react-native-safe-area-context";
import {useSupabase} from "@/hooks/useSupabase";
import {useAuth} from "@clerk/expo";
import {useFocusEffect} from "expo-router";
import {Property} from "@/types";
import PropertyCard from "@/components/PropertyCard";
import {Ionicons} from "@expo/vector-icons";
import {useThemeColors} from "@/hooks/useTheme";

interface SavedProperty extends Property {
    id: string;
    property_id: string;
    properties: Property;
}

export default function SavedScreen() {

    const {userId} = useAuth();
    const authSupabase = useSupabase();
    const colors = useThemeColors();

    //states
    const [saved, setSaved] = useState<SavedProperty[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSaved = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const {data, error} = await authSupabase
                .from('saved_properties')
                .select('id,property_id,properties(*)')
                .eq('user_clerk_id', userId)
                .order('id', {ascending: false});
            if (error) {
                console.error(error);
            }
            setSaved(data as unknown as SavedProperty[] ?? []);
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useFocusEffect(useCallback(() => {
        fetchSaved();
    }, [fetchSaved]));


    return (
        <SafeAreaView style={{backgroundColor: colors.background}} className='flex-1 px-8 py-4'>
            <View className='pb-3 '>
                <Text
                    className='text-2xl font-bold'
                    style={{color: colors.text}}
                >
                    Saved
                </Text>
                {
                    !loading && (
                        <Text className='text-sm mt-1' style={{color: colors.textSecondary}}>
                            {saved.length} {saved.length === 1 ? 'property' : 'properties'}
                        </Text>
                    )
                }
            </View>

            {
                loading ?
                    <View className='flex-1 items-center justify-center'>
                        <ActivityIndicator size='large' color={colors.primary}/>
                    </View>
                    : (
                        <FlatList
                            data={saved}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{paddingBottom: 100}}
                            renderItem={({item}) => (
                                <PropertyCard
                                    property={item.properties}
                                    onUnsave={() =>
                                        setSaved(prev => prev.filter(saved => saved.id !== item.id))
                                    }
                                    showSave
                                />
                            )}
                            ListEmptyComponent={
                                <View className='flex-1 items-center justify-center py-24'>
                                    <View className='w-20 h-20 rounded-full items-center justify-center mb-4'
                                          style={{backgroundColor: colors.card}}>
                                        <Ionicons name="heart-outline" size={36} color={colors.error}/>
                                    </View>
                                    <Text className='text-lg font-bold mb-1 mt-2' style={{color: colors.text}}>No saved
                                        properties</Text>
                                    <Text className='text-sm text-center mt-0.5' style={{color: colors.textSecondary}}>Tap
                                        on the heart icon to
                                        save a property</Text>
                                </View>
                            }
                        />
                    )
            }
        </SafeAreaView>
    )
}
