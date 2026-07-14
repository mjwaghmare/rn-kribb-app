import {View, Image, ScrollView, Text, TextInput, TouchableOpacity, ActivityIndicator} from 'react-native'
import {useAuth, useSignUp} from '@clerk/expo';
import React, {useState} from 'react'
import {Link, useRouter} from "expo-router";

export default function SignUp() {
    //hooks
    const {signUp, errors, fetchStatus} = useSignUp();

    const {isSignedIn} = useAuth();

    //router
    const router = useRouter();

    //states
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");

    const isLoading = fetchStatus === "fetching";

    if (signUp.status === 'complete' || isSignedIn) {
        return null;
    }

    // functions
    // handle sign up
    const onSignUpPress = async () => {
        try {
            const {error} = await signUp.password({
                firstName,
                lastName,
                emailAddress: email,
                password
            })
            //catch errors
            if (error) {
                console.log(JSON.stringify(error.message, null, 2));
                return;
            }
            // get otp
            if (!error) await signUp.verifications.sendEmailCode();
        } catch (error) {
            console.log(JSON.stringify(error, null, 2));
            return;
        }

    }

    // verify otp
    const onVerifyPress = async () => {
        try {
            const {error} = await signUp.verifications.verifyEmailCode({
                code
            })
            //catch errors
            if (error) {
                console.log(JSON.stringify(error.message, null, 2));
                return;
            }
            // navigate in
            if (signUp.status === 'complete') {
                await signUp.finalize({
                    navigate: ({decorateUrl}) => {
                        const url = decorateUrl("/")
                        router.replace(url as any);
                    }
                });
            }
        } catch (error) {
            console.log(JSON.stringify(error, null, 2));
            return;
        }

    }

    // otp screen view
    if (
        signUp.status === 'missing_requirements' &&
        signUp.unverifiedFields.includes('email_address') &&
        signUp.missingFields.length === 0
    ) {
        return <View className="flex-1  justify-center px-6 py-12">
            <Image className="w-32 h-32 mb-8" resizeMode="contain"
                   source={require("../../assets/images/kribb.png")}/>
            <Text className="text-3xl font-bold text-gray-800 mb-2 mr-2">Verify your account</Text>
            <Text className="text-gray-500 mb-4">We sent a code to your email</Text>
            <TextInput
                value={code}
                onChangeText={setCode}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4"
                placeholder="Enter verification code"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={6}
            />
            {
                errors.fields.code && (
                    <Text className="text-red-500 mb-4">
                        {errors.fields.code.message}
                    </Text>
                )
            }

            <TouchableOpacity
                onPress={onVerifyPress}
                disabled={isLoading}
                className="w-full bg-blue-500 py-3 rounded-xl items-center mb-4">
                {
                    isLoading ? (
                        <ActivityIndicator color="white"/>
                    ) : (
                        <Text className="text-white font-bold text-base">Verify</Text>
                    )
                }
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => signUp.verifications.sendEmailCode()}
                className="w-full py-3 rounded-xl items-center mb-4"
            >
                <Text className="text-blue-600">Resend code</Text>
            </TouchableOpacity>

        </View>
    }

    return (
        <ScrollView contentContainerStyle={{flexGrow: 1}}
                    className="bg-white" keyboardShouldPersistTaps="handled">
            <View className="flex-1  justify-center px-6 py-12">
                <Image className="w-32 h-32 mb-8" resizeMode="contain"
                       source={require("../../assets/images/kribb.png")}/>
                <Text className="text-3xl font-bold text-gray-800 mb-2">Create an account</Text>
                <Text className="text-gray-500 mb-2">Find your dream home today</Text>
                <View className="flex-row gap-3 mb-4">
                    <TextInput
                        value={firstName}
                        onChangeText={setFirstName}
                        className="flex-1 border border-gray-300 rounded-xl px-4 py-3"
                        placeholder="First Name"
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize="words"
                    />
                    <TextInput
                        value={lastName}
                        onChangeText={setLastName}
                        className="flex-1 border border-gray-300 rounded-xl px-4 py-3"
                        placeholder="Last Name"
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize="words"
                    />
                </View>
                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4"
                    placeholder="Email Address"
                    placeholderTextColor="#9CA3AF"
                    keyboardType='email-address'
                    autoCapitalize="none"
                />
                {
                    errors.fields.emailAddress && (
                        <Text className="text-red-500 mb-4">
                            {errors.fields.emailAddress.message}
                        </Text>
                    )
                }
                <TextInput
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-6"
                    placeholder="Password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
                {
                    errors.fields.password && (
                        <Text className="text-red-500 mb-4">
                            {errors.fields.password.message}
                        </Text>
                    )
                }
                <TouchableOpacity
                    onPress={onSignUpPress}
                    disabled={isLoading}
                    className="w-full bg-blue-500 py-3 rounded-xl items-center mb-4">
                    {
                        isLoading ? (
                            <ActivityIndicator color="white"/>
                        ) : (
                            <Text className="text-white font-bold text-base">Sign Up</Text>
                        )
                    }
                </TouchableOpacity>

                {/*already have an account*/}
                <View className="flex-row items-center justify-center mb-4">
                    <Text className="text-gray-500 mr-1">Already have an account?</Text>
                    <Link href="/sign-in" className="text-blue-600 ml-1">Sign In</Link>
                </View>
                <View nativeID="clerk-captcha"/>
            </View>
        </ScrollView>
    )
}
