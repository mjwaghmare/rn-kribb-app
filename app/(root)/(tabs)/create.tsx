import {useSupabase} from "@/hooks/useSupabase";
import {Ionicons} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import {useRouter} from "expo-router";
import {useState} from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useThemeColors} from "@/hooks/useTheme";

const TYPES = ["apartment", "house", "villa", "studio"] as const;
type PropertyType = (typeof TYPES)[number];

const MIN_PRICE = 1;
const MAX_PRICE = 999_999_999;

const sectionClass = "mb-5";

interface FormState {
    title: string;
    description: string;
    price: string;
    type: PropertyType;
    bedrooms: number;
    bathrooms: number;
    areaSqft: string;
    address: string;
    city: string;
    latitude: string;
    longitude: string;
    isFeatured: boolean;
    images: string[];
    localImages: string[];
}

const INITIAL_FORM: FormState = {
    title: "",
    description: "",
    price: "",
    type: "apartment",
    bedrooms: 1,
    bathrooms: 1,
    areaSqft: "",
    address: "",
    city: "",
    latitude: "",
    longitude: "",
    isFeatured: false,
    images: [],
    localImages: [],
};

export default function CreatePropertyScreen() {
    const router = useRouter();
    const authSupabase = useSupabase();
    const colors = useThemeColors();

    const [form, setForm] = useState<FormState>(INITIAL_FORM);

    // Loading states
    const [submitting, setSubmitting] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [detectingLocation, setDetectingLocation] = useState(false);

    const updateForm = (fields: Partial<FormState>) =>
        setForm((prev) => ({...prev, ...fields}));

    // ─── Image Picker ──────────────────────────────────────────
    const handlePickImages = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert(
                "Permission Required",
                "Please allow access to your photo library."
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: "images",
            allowsMultipleSelection: true,
            quality: 0.7,
            base64: true,
            selectionLimit: 6,
        });

        if (result.canceled) return;

        setUploadingImages(true);

        const uploadedUrls: string[] = [];
        const previewUris: string[] = [];

        for (const asset of result.assets) {
            try {
                const filename = `property_${Date.now()}_${Math.random()
                    .toString(36)
                    .slice(2)}.jpg`;

                const base64 = asset.base64!;
                const buffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

                const {error} = await authSupabase.storage
                    .from("property-images")
                    .upload(filename, buffer, {
                        contentType: "image/jpeg",
                        upsert: false,
                    });

                if (error) throw error;

                const {data: urlData} = authSupabase.storage
                    .from("property-images")
                    .getPublicUrl(filename);

                uploadedUrls.push(urlData.publicUrl);
                previewUris.push(asset.uri);
            } catch (err) {
                console.error("Upload error:", err);
                Alert.alert("Upload Failed", "One or more images failed to upload.");
            }
        }

        updateForm({
            images: [...form.images, ...uploadedUrls],
            localImages: [...form.localImages, ...previewUris],
        });
        setUploadingImages(false);
    };

    const handleRemoveImage = (index: number) => {
        updateForm({
            images: form.images.filter((_, i) => i !== index),
            localImages: form.localImages.filter((_, i) => i !== index),
        });
    };

    // ─── Location Detection ────────────────────────────────────
    const handleDetectLocation = async () => {
        setDetectingLocation(true);
        try {
            const {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Permission Denied",
                    "Location permission is required to detect coordinates."
                );
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            updateForm({
                latitude: String(location.coords.latitude),
                longitude: String(location.coords.longitude),
            });
        } catch (err) {
            Alert.alert("Error", "Could not detect location. Enter manually.");
        } finally {
            setDetectingLocation(false);
        }
    };

    // ─── Submit ────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!form.title.trim())
            return Alert.alert("Validation", "Title is required.");

        if (!form.price.trim())
            return Alert.alert("Validation", "Price is required.");

        const priceNum = Number(form.price);
        if (isNaN(priceNum) || priceNum < MIN_PRICE)
            return Alert.alert("Validation", "Price must be greater than ₹0.");
        if (priceNum > MAX_PRICE)
            return Alert.alert(
                "Validation",
                `Price cannot exceed ₹${MAX_PRICE.toLocaleString("en-IN")}.`
            );

        if (!form.address.trim())
            return Alert.alert("Validation", "Address is required.");
        if (!form.city.trim())
            return Alert.alert("Validation", "City is required.");
        if (form.images.length === 0)
            return Alert.alert("Validation", "Please upload at least one image.");

        setSubmitting(true);

        const {error} = await authSupabase.from("properties").insert({
            title: form.title.trim(),
            description: form.description.trim(),
            price: priceNum,
            type: form.type,
            bedrooms: form.bedrooms,
            bathrooms: form.bathrooms,
            area_sqft: form.areaSqft ? Number(form.areaSqft) : null,
            address: form.address.trim(),
            city: form.city.trim(),
            latitude: form.latitude ? Number(form.latitude) : null,
            longitude: form.longitude ? Number(form.longitude) : null,
            images: form.images,
            is_featured: form.isFeatured,
            is_sold: false,
        });

        setSubmitting(false);

        if (error) {
            Alert.alert("Error", "Failed to create property. Please try again.");
            console.error(error);
            return;
        }

        setForm(INITIAL_FORM);
        Alert.alert("Success! 🎉", "Property listed successfully.", [
            {text: "OK", onPress: () => router.replace("/(root)/(tabs)")},
        ]);
    };

    // ─── UI Helpers ────────────────────────────────────────────
    const Counter = ({
                         label,
                         value,
                         onChange,
                     }: {
        label: string;
        value: number;
        onChange: (v: number) => void;
    }) => {
        const colors = useThemeColors();
        return (
        <View className="flex-1">
            <Text className="text-sm font-semibold mb-1.5" style={{color: colors.text}}>{label}</Text>
            <View className="flex-row items-center rounded-2xl overflow-hidden"
                  style={{backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1}}>
                <TouchableOpacity
                    onPress={() => onChange(Math.max(1, value - 1))}
                    className="w-11 h-11 items-center justify-center"
                >
                    <Ionicons name="remove" size={18} color={colors.text}/>
                </TouchableOpacity>
                <Text className="flex-1 text-center font-bold text-base" style={{color: colors.text}}>
                    {value}
                </Text>
                <TouchableOpacity
                    onPress={() => onChange(value + 1)}
                    className="w-11 h-11 items-center justify-center"
                >
                    <Ionicons name="add" size={18} color={colors.text}/>
                </TouchableOpacity>
            </View>
        </View>
        );
    };

    const Toggle = ({
                        label,
                        value,
                        onChange,
                        description,
                    }: {
        label: string;
        value: boolean;
        onChange: (v: boolean) => void;
        description?: string;
    }) => {
        const colors = useThemeColors();
        return (
        <TouchableOpacity
            onPress={() => onChange(!value)}
            className="flex-row items-center justify-between p-4 rounded-2xl border"
            style={{
                backgroundColor: value ? colors.card : colors.card,
                borderColor: value ? colors.primary : colors.border,
                borderWidth: 1
            }}
        >
            <View className="flex-1 mr-3">
                <Text
                    className="font-semibold"
                    style={{color: value ? colors.primary : colors.text}}
                >
                    {label}
                </Text>
                {description && (
                    <Text className="text-xs mt-0.5" style={{color: colors.textSecondary}}>{description}</Text>
                )}
            </View>
            <View
                className="w-6 h-6 rounded-full border-2 items-center justify-center"
                style={{
                    borderColor: value ? colors.primary : colors.border,
                    backgroundColor: value ? colors.primary : 'transparent'
                }}
            >
                {value && <Ionicons name="checkmark" size={14} color="white"/>}
            </View>
        </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{backgroundColor: colors.background}} className="flex-1">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                {/* Header */}
                <View className="flex-row items-center px-5 pt-4 pb-3">
                    <Text className="text-2xl font-bold flex-1" style={{color: colors.text}}>
                        Add Property
                    </Text>
                </View>

                <ScrollView
                    contentContainerStyle={{padding: 20, paddingBottom: 120}}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Images */}
                    <View className={sectionClass}>
                        <Text className="text-sm font-semibold mb-1.5" style={{color: colors.text}}>
                            Photos{" "}
                            <Text className="font-normal" style={{color: colors.textSecondary}}>(up to 6)</Text>
                        </Text>

                        <View className="flex-row flex-wrap gap-3">
                            {form.localImages.map((uri, index) => (
                                <View key={index} className="relative">
                                    <Image
                                        source={{uri}}
                                        className="w-24 h-24 rounded-2xl"
                                        resizeMode="cover"
                                    />
                                    {index === 0 && (
                                        <View className="absolute top-1 left-1 bg-blue-600 px-1.5 py-0.5 rounded-full">
                                            <Text className="text-white text-[9px] font-bold">
                                                COVER
                                            </Text>
                                        </View>
                                    )}
                                    <TouchableOpacity
                                        onPress={() => handleRemoveImage(index)}
                                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full items-center justify-center"
                                    >
                                        <Ionicons name="close" size={11} color="white"/>
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {form.localImages.length < 6 && (
                                <TouchableOpacity
                                    onPress={handlePickImages}
                                    disabled={uploadingImages}
                                    className="w-24 h-24 rounded-2xl border-2 border-dashed items-center justify-center"
                                    style={{
                                        backgroundColor: colors.card,
                                        borderColor: colors.border
                                    }}
                                >
                                    {uploadingImages ? (
                                        <ActivityIndicator size="small" color={colors.primary}/>
                                    ) : (
                                        <>
                                            <Ionicons
                                                name="camera-outline"
                                                size={22}
                                                color={colors.textSecondary}
                                            />
                                            <Text className="text-xs mt-1"
                                                  style={{color: colors.textSecondary}}>Add</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Basic Info */}
                    <View className={sectionClass}>
                        <Text className="text-sm font-semibold mb-1.5" style={{color: colors.text}}>Title</Text>
                        <TextInput
                            className="rounded-2xl px-4 py-3"
                            style={{
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                borderWidth: 1,
                                color: colors.text
                            }}
                            placeholder="e.g. Modern 3BHK in Bandra"
                            placeholderTextColor={colors.textSecondary}
                            value={form.title}
                            onChangeText={(v) => updateForm({title: v})}
                        />
                    </View>

                    <View className={sectionClass}>
                        <Text className="text-sm font-semibold mb-1.5" style={{color: colors.text}}>Description</Text>
                        <TextInput
                            className="h-24 rounded-2xl px-4 py-3"
                            style={{
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                borderWidth: 1,
                                color: colors.text
                            }}
                            placeholder="Describe the property..."
                            placeholderTextColor={colors.textSecondary}
                            value={form.description}
                            onChangeText={(v) => updateForm({description: v})}
                            multiline
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Price */}
                    <View className={sectionClass}>
                        <Text className="text-sm font-semibold mb-1.5" style={{color: colors.text}}>Price (₹)</Text>
                        <TextInput
                            className="rounded-2xl px-4 py-3"
                            style={{
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                borderWidth: 1,
                                color: colors.text
                            }}
                            placeholder="e.g. 5000000"
                            placeholderTextColor={colors.textSecondary}
                            value={form.price}
                            onChangeText={(v) => updateForm({price: v})}
                            keyboardType="numeric"
                        />
                        <Text className="text-xs mt-1.5 ml-1" style={{color: colors.textSecondary}}>
                            Valid range: ₹1 – ₹{MAX_PRICE.toLocaleString("en-IN")}
                        </Text>
                    </View>

                    {/* Property Type */}
                    <View className={sectionClass}>
                        <Text className="text-sm font-semibold mb-1.5" style={{color: colors.text}}>Property Type</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {TYPES.map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    onPress={() => updateForm({type: t})}
                                    className="px-4 py-2 rounded-full border"
                                    style={{
                                        backgroundColor: form.type === t ? colors.primary : colors.card,
                                        borderColor: form.type === t ? colors.primary : colors.border,
                                        borderWidth: 1
                                    }}
                                >
                                    <Text
                                        className="text-sm font-semibold capitalize"
                                        style={{color: form.type === t ? "white" : colors.text}}
                                    >
                                        {t}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Bedrooms / Bathrooms */}
                    <View className="flex-row gap-4 mb-5">
                        <Counter
                            label="Bedrooms"
                            value={form.bedrooms}
                            onChange={(v) => updateForm({bedrooms: v})}
                        />
                        <Counter
                            label="Bathrooms"
                            value={form.bathrooms}
                            onChange={(v) => updateForm({bathrooms: v})}
                        />
                    </View>

                    <View className={sectionClass}>
                        <Text className="text-sm font-semibold mb-1.5" style={{color: colors.text}}>Area (sq ft)</Text>
                        <TextInput
                            className="rounded-2xl px-4 py-3"
                            style={{
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                borderWidth: 1,
                                color: colors.text
                            }}
                            placeholder="e.g. 1200"
                            placeholderTextColor={colors.textSecondary}
                            value={form.areaSqft}
                            onChangeText={(v) => updateForm({areaSqft: v})}
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Location */}
                    <View className={sectionClass}>
                        <Text className="text-sm font-semibold mb-1.5" style={{color: colors.text}}>Address</Text>
                        <TextInput
                            className="rounded-2xl px-4 py-3"
                            style={{
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                borderWidth: 1,
                                color: colors.text
                            }}
                            placeholder="Street address"
                            placeholderTextColor={colors.textSecondary}
                            value={form.address}
                            onChangeText={(v) => updateForm({address: v})}
                        />
                    </View>

                    <View className={sectionClass}>
                        <Text className="text-sm font-semibold mb-1.5" style={{color: colors.text}}>City</Text>
                        <TextInput
                            className="rounded-2xl px-4 py-3"
                            style={{
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                borderWidth: 1,
                                color: colors.text
                            }}
                            placeholder="e.g. Mumbai"
                            placeholderTextColor={colors.textSecondary}
                            value={form.city}
                            onChangeText={(v) => updateForm({city: v})}
                        />
                    </View>

                    {/* Coordinates */}
                    <View className={sectionClass}>
                        <View className="flex-row items-center justify-between mb-1.5">
                            <Text className="text-sm font-semibold mb-1.5"
                                  style={{color: colors.text}}>Coordinates</Text>
                            <TouchableOpacity
                                onPress={handleDetectLocation}
                                disabled={detectingLocation}
                                className="flex-row items-center gap-1 px-3 py-1.5 rounded-full"
                                style={{backgroundColor: colors.card}}
                            >
                                {detectingLocation ? (
                                    <ActivityIndicator size="small" color={colors.primary}/>
                                ) : (
                                    <Ionicons name="locate-outline" size={13} color={colors.primary}/>
                                )}
                                <Text className="text-xs font-semibold" style={{color: colors.primary}}>
                                    {detectingLocation ? "Detecting..." : "Detect Location"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row gap-3">
                            <View className="flex-1">
                                <TextInput
                                    className="rounded-2xl px-4 py-3"
                                    style={{
                                        backgroundColor: colors.card,
                                        borderColor: colors.border,
                                        borderWidth: 1,
                                        color: colors.text
                                    }}
                                    placeholder="Latitude"
                                    placeholderTextColor={colors.textSecondary}
                                    value={form.latitude}
                                    onChangeText={(v) => updateForm({latitude: v})}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View className="flex-1">
                                <TextInput
                                    className="rounded-2xl px-4 py-3"
                                    style={{
                                        backgroundColor: colors.card,
                                        borderColor: colors.border,
                                        borderWidth: 1,
                                        color: colors.text
                                    }}
                                    placeholder="Longitude"
                                    placeholderTextColor={colors.textSecondary}
                                    value={form.longitude}
                                    onChangeText={(v) => updateForm({longitude: v})}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Toggles */}
                    <View className="gap-3 mb-5">
                        <Toggle
                            label="Featured Property"
                            description="Show this in the Featured section on home"
                            value={form.isFeatured}
                            onChange={(v) => updateForm({isFeatured: v})}
                        />
                    </View>

                    {/* Submit */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={submitting || uploadingImages}
                        className="rounded-2xl py-4 items-center"
                        style={{
                            backgroundColor: colors.primary,
                            shadowColor: colors.primary,
                            shadowOffset: {width: 0, height: 4},
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 4,
                            opacity: submitting || uploadingImages ? 0.7 : 1,
                        }}
                    >
                        {submitting ? (
                            <ActivityIndicator color="white"/>
                        ) : (
                            <Text className="text-white font-bold text-base">
                                List Property
                            </Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}