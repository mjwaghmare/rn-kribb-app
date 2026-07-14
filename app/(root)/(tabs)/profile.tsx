import {View, Text, Button} from 'react-native'
import React from 'react'
import {useAuth} from "@clerk/expo";
import {router} from "expo-router";

export default function ProfileScreen() {
    const {signOut} = useAuth();

    const handleSignOut = async () => {
        try {
            await signOut();
            router.replace("/sign-in");
        } catch (e) {
            console.log(e);
        }
    }

    return (
        <View className="flex-1 items-center justify-center">
            <Text>ProfileScreen</Text>
            <Button title="Sign Out" onPress={handleSignOut}/>
        </View>
    )
}
