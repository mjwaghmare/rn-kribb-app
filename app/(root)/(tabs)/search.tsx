import {ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View,} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {useEffect, useState} from "react";
import {supabase} from "@/lib/supabase";
import {Property} from "@/types";
import {useFilterStore} from "@/store/filterStore";
import {formatPrice} from "@/lib/utils";
import PropertyCard from "@/components/PropertyCard";
import FilterBottomSheet from "@/components/FilterBottomSheet";
import {useLocalSearchParams} from "expo-router";
import {useThemeColors} from "@/hooks/useTheme";

export default function SearchScreen() {
    const [results, setResults] = useState<Property[]>([]);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const colors = useThemeColors();

    const { openFilters } = useLocalSearchParams<{ openFilters?: string }>();

    useEffect(() => {
        if (openFilters === "true") {
            setShowFilters(true);
        }
    }, [openFilters]);

    const {
        search,
        type,
        bedrooms,
        minPrice,
        maxPrice,
        setSearch,
        setType,
        setBedrooms,
        setMinPrice,
        setMaxPrice,
    } = useFilterStore();

    const activeFilterCount = [
        type !== null,
        bedrooms !== null,
        minPrice !== null,
        maxPrice !== null,
    ].filter(Boolean).length;

    useEffect(() => {
        fetchResults();
    }, [search, type, bedrooms, minPrice, maxPrice]);

    const fetchResults = async () => {
        setLoading(true);

        let query = supabase.from("properties").select("*");

        if (search) {
            query = query.or(`title.ilike.%${search}%,city.ilike.%${search}%`);
        }

        if (type) {
            query = query.eq("type", type);
        }

        if (bedrooms) {
            query = query.eq("bedrooms", bedrooms);
        }

        if (minPrice) {
            query = query.gte("price", minPrice);
        }

        if (maxPrice) {
            query = query.lte("price", maxPrice);
        }

        const { data } = await query.order("created_at", { ascending: false });

        setResults(data ?? []);
        setLoading(false);
    };

    return (
        <SafeAreaView style={{backgroundColor: colors.background}} className="flex-1">
            {/* Header */}
            <View className="px-5 pt-4 pb-3">
                <Text className="text-2xl font-bold mb-4" style={{color: colors.text}}>
                    Find Property
                </Text>

                {/* Search Bar + Filter Button */}
                <View className="flex-row items-center gap-3">
                    <View
                        className="flex-1 flex-row items-center rounded-2xl px-4 gap-3"
                        style={{
                            backgroundColor: colors.card,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.06,
                            shadowRadius: 6,
                            elevation: 2,
                        }}
                    >
                        <Ionicons name="search-outline" size={18} color={colors.textSecondary}/>
                        <TextInput
                            className="flex-1 py-3"
                            style={{color: colors.text}}
                            placeholder="Search by title or city..."
                            placeholderTextColor={colors.textSecondary}
                            value={search}
                            onChangeText={setSearch}
                            autoCapitalize="none"
                        />
                        {search.length > 0 && (
                            <TouchableOpacity onPress={() => setSearch("")}>
                                <Ionicons name="close-circle" size={18} color={colors.textSecondary}/>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Filter Button */}
                    <TouchableOpacity
                        onPress={() => setShowFilters(true)}
                        className={`w-12 h-12 rounded-2xl items-center justify-center`}
                        style={{
                            backgroundColor: activeFilterCount > 0 ? colors.primary : colors.card,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.06,
                            shadowRadius: 6,
                            elevation: 2,
                        }}
                    >
                        <Ionicons
                            name="options-outline"
                            size={20}
                            color={activeFilterCount > 0 ? "#fff" : colors.text}
                        />
                        {activeFilterCount > 0 && (
                            <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full items-center justify-center"
                                  style={{backgroundColor: colors.error}}>
                                <Text className="text-white text-[9px] font-bold">
                                    {activeFilterCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Active Filter Chips */}
                {activeFilterCount > 0 && (
                    <View className="flex-row flex-wrap gap-2 mt-3">
                        {type && (
                            <View className="flex-row items-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1 gap-1">
                                <Text className="text-blue-700 text-xs font-semibold capitalize">
                                    {type}
                                </Text>
                                <TouchableOpacity onPress={() => setType(null)}>
                                    <Ionicons name="close" size={12} color="#1D4ED8" />
                                </TouchableOpacity>
                            </View>
                        )}
                        {bedrooms !== null && (
                            <View className="flex-row items-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1 gap-1">
                                <Ionicons name="bed-outline" size={11} color="#1D4ED8" />
                                <Text className="text-blue-700 text-xs font-semibold">
                                    {bedrooms === 4
                                        ? "4+ beds"
                                        : `${bedrooms} bed${bedrooms > 1 ? "s" : ""}`}
                                </Text>
                                <TouchableOpacity onPress={() => setBedrooms(null)}>
                                    <Ionicons name="close" size={12} color="#1D4ED8" />
                                </TouchableOpacity>
                            </View>
                        )}
                        {(minPrice !== null || maxPrice !== null) && (
                            <View className="flex-row items-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1 gap-1">
                                <Text className="text-blue-700 text-xs font-semibold">
                                    {minPrice && maxPrice
                                        ? `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
                                        : minPrice
                                            ? `From ${formatPrice(minPrice)}`
                                            : `Up to ${formatPrice(maxPrice!)}`}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setMinPrice(null);
                                        setMaxPrice(null);
                                    }}
                                >
                                    <Ionicons name="close" size={12} color="#1D4ED8" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </View>

            {/* Results */}
            <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => <PropertyCard property={item} />}
                ListHeaderComponent={
                    <Text className="text-sm mb-4" style={{color: colors.textSecondary}}>
                        {loading ? "Searching..." : `${results.length} properties found`}
                    </Text>
                }
                ListEmptyComponent={
                    !loading ? (
                        <View className="items-center py-20">
                            <Ionicons name="search-outline" size={48} color={colors.border}/>
                            <Text className="mt-4 text-base" style={{color: colors.textSecondary}}>
                                No properties found
                            </Text>
                            <Text className="text-sm mt-1" style={{color: colors.textSecondary}}>
                                Try a different search or adjust filters
                            </Text>
                        </View>
                    ) : (
                        <ActivityIndicator size="large" color={colors.primary} className="py-20"/>
                    )
                }
            />

            {/* Filter Modal */}
            <FilterBottomSheet
                visible={showFilters}
                onClose={() => setShowFilters(false)}
            />
        </SafeAreaView>
    );
}