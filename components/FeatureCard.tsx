import {useRouter} from "expo-router";
import {Image, Text, TouchableOpacity, View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Property} from "@/types";
import {formatPrice} from "@/lib/utils";
import {useThemeColors} from "@/hooks/useTheme";

export default function FeaturedCard({ property }: { property: Property }) {
    const router = useRouter();
    const colors = useThemeColors();

    return (
        <TouchableOpacity
            onPress={() => router.push(`/(root)/property/${property.id}`)}
            className="w-72 mr-4 rounded-3xl overflow-hidden"
            style={{
                backgroundColor: colors.card,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 4,
                opacity: property.is_sold ? 0.5 : 1,
            }}
        >
            {/* Image */}
            <Image
                source={property.images[0] ? { uri: property.images[0] } : require('../assets/images/kribb.png')}
                className="w-full h-44"
                resizeMode="cover"
            />

            {/* Badge */}
            <View className="absolute top-3 left-3 px-3 py-1 rounded-full"
                  style={{backgroundColor: colors.card, opacity: 0.9}}>
                <Text className="text-xs font-semibold capitalize" style={{color: colors.primary}}>
                    {property.type}
                </Text>
            </View>

            {property.is_sold && (
                <View className="absolute top-3 right-3 bg-red-500 px-3 py-1 rounded-full">
                    <Text className="text-xs font-semibold text-white">Sold</Text>
                </View>
            )}

            {/* Info */}
            <View className="p-4">
                <Text
                    className="text-base font-bold mb-1"
                    style={{color: colors.text}}
                    numberOfLines={1}
                >
                    {property.title}
                </Text>

                <View className="flex-row items-center gap-1 mb-3">
                    <Ionicons name="location-outline" size={13} color={colors.textSecondary}/>
                    <Text className="text-xs" style={{color: colors.textSecondary}} numberOfLines={1}>
                        {property.address}, {property.city}
                    </Text>
                </View>

                <View className="flex-row items-center justify-between">
                    <Text className="font-bold text-base" style={{color: colors.primary}}>
                        {formatPrice(property.price)}
                    </Text>
                    <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center gap-1">
                            <Ionicons name="bed-outline" size={13} color={colors.textSecondary}/>
                            <Text className="text-xs" style={{color: colors.textSecondary}}>{property.bedrooms}</Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                            <Ionicons name="water-outline" size={13} color={colors.textSecondary}/>
                            <Text className="text-xs" style={{color: colors.textSecondary}}>
                                {property.bathrooms}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}