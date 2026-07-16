import {ActivityIndicator, FlatList, Image, Pressable, Text, View} from 'react-native'
import React, {useCallback, useState} from 'react'
import {SafeAreaView} from "react-native-safe-area-context";
import {useUser} from "@clerk/expo";
import {useFocusEffect, useRouter} from "expo-router";
import {Property} from "@/types";
import {supabase} from "@/lib/supabase";
import {Ionicons} from "@expo/vector-icons";
import FeatureCard from "@/components/FeatureCard";
import PropertyCard from "@/components/PropertyCard";
import {useThemeColors} from "@/hooks/useTheme";

export default function HomeScreen() {

    const {user} = useUser();
    const router = useRouter();
    const colors = useThemeColors();

    const [featured, setFeatured] = useState<Property[]>([]);
    const [recommended, setRecommended] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);


    const fetchProperties = async () => {
        try {
            setLoading(true);

            // fetching featured properties
            const {data: featuredData} = await supabase
                .from('properties')
                .select("*")
                .eq('is_featured', true)
                .order('created_at', {ascending: false});

            // fetching recommended properties
            const {data: recommendedData} = await supabase.from('properties')
                .select("*")
                .eq('is_featured', false)
                .order('created_at', {ascending: false});

            setFeatured(featuredData ?? []);
            setRecommended(recommendedData ?? []);
        } catch (error) {
            console.error('Error fetching properties:', error);
            setFeatured([]);
            setRecommended([]);
        } finally {
            setLoading(false);
        }
    }

    // fetching properties
    useFocusEffect(
        useCallback(() => {
            void fetchProperties();
        }, [])
    );


    return (
        <SafeAreaView style={{backgroundColor: colors.background}} className='flex-1'>
            <FlatList
                data={recommended}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{paddingBottom: 100}}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View>
                        {/*header*/}
                        <View className='flex-row items-center justify-between px-5 pt-4 pb-5'>
                            <Image
                                style={{width: 90, height: 36}}
                                resizeMode={'contain'}
                                source={require('../../../assets/images/kribb.png')}
                            />
                            <View className='items-end'>
                                <Text style={{color: colors.text}}>Hello 👋🏻</Text>
                                <Text
                                    className='text-base font-bold'
                                    style={{color: colors.text}}
                                >{user?.firstName ?? 'User'}</Text>
                            </View>
                        </View>
                        {/*search bar*/}
                        <Pressable onPress={() => router.push('/(root)/(tabs)/search')}
                                   className='mx-5 mb-6 flex-row items-center rounded-2xl px-4 py-3 gap-3'
                                   style={{
                                       backgroundColor: colors.card,
                                       shadowColor: '#000',
                                       shadowOffset: {width: 0, height: 1},
                                       shadowOpacity: 0.06,
                                       shadowRadius: 6,
                                       elevation: 2
                                   }}
                        >
                            <Ionicons name='search-outline' size={18} color={colors.textSecondary}/>
                            <Text className='text-sm flex-1' style={{color: colors.textSecondary}}>Search properties,
                                cities</Text>
                            <Pressable onPress={() => router.push('/(root)/(tabs)/search?openFilters=true')}
                                       className='w-8 h-8 rounded-xl items-center justify-center'
                                       style={{backgroundColor: colors.primary}}
                            >
                                <Ionicons name='options-outline' size={15} color='#fff'/>
                            </Pressable>
                        </Pressable>
                        {/*featured*/}
                        <View className='mb-6'>
                            <Text className='text-lg font-bold px-5 mb-4' style={{color: colors.text}}>
                                Featured
                            </Text>
                            {loading ? (
                                <ActivityIndicator size="small" color={colors.primary} className='py-10'
                                />
                            ) : <FlatList
                                horizontal
                                data={featured}
                                keyExtractor={(item) => item.id}
                                renderItem={({item}) => <FeatureCard property={item}/>}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{paddingHorizontal: 20}}
                            />}
                        </View>

                        {/*recommended header*/}
                        <Text className='text-lg font-bold px-5 mb-4' style={{color: colors.text}}>
                            Recommended
                        </Text>
                    </View>
                }
                renderItem={({item}) => (
                    <View className='px-5'>
                        <PropertyCard property={item}/>
                    </View>
                )}
                ListFooterComponent={
                    !loading && recommended.length == 0 ? (
                        <View className='items-center py-10'>
                            <Text style={{color: colors.textSecondary}}>No properties found</Text>
                        </View>
                    ) : null
                }
            />

        </SafeAreaView>
    )
}
