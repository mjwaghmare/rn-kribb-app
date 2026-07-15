import {useUser} from "@clerk/expo";
import {useEffect} from "react";
import {useSupabase} from "@/hooks/useSupabase";
import {useUserStore} from "@/store/userStore";

export const useUserSync = () => {
    const {user} = useUser();
    const setIsAdmin = useUserStore((state) => state.setIsAdmin);
    const authSupabase = useSupabase(); // ← authenticated client

    useEffect(() => {
        if (!user) return;
        syncUser();
    }, [user]);

    const syncUser = async () => {
        try {
            const {data, error} = await authSupabase
                .from("users")
                .select("clerk_id, is_admin")
                .eq("clerk_id", user!.id)
                .single();

            if (error) {
                console.error("Error fetching user:", error);
                return;
            }

            if (data) {
                setIsAdmin(data.is_admin ?? false);
                return;
            }

            const {data: newUser, error: insertError} = await authSupabase
                .from("users")
                .insert({
                    clerk_id: user!.id,
                    email: user!.emailAddresses[0].emailAddress,
                    first_name: user!.firstName,
                    last_name: user!.lastName,
                    avatar_url: user!.imageUrl,
                })
                .select("is_admin")
                .single();

            if (insertError) {
                console.error("Error creating user:", insertError);
                return;
            }

            setIsAdmin(newUser?.is_admin ?? false);
        } catch (error) {
            console.error("Unexpected error during user sync:", error);
        }
    };
};