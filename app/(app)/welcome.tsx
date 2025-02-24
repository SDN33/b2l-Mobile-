import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { Image } from "@/components/image";
import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1, Muted } from "@/components/ui/typography";

export default function WelcomeScreen() {
	const router = useRouter();

	return (
		<SafeAreaView className="flex flex-1 bg-gray-950 p-4">
			<View className="flex flex-1 items-center justify-center gap-y-4 web:m-4">
				<Image
					source={require("@/assets/icon.png")}
					style={{ width: 192, height: 192 }}
					className="rounded-xl"
				/>
				<H1 className="text-center text-red-600">The Place To Be  STAFF</H1>
				<Muted className="text-center text-white">
					Un portail fait pour améliorer la communication entre les employés et
          employeurs
				</Muted>
			</View>
			<View className="flex flex-col gap-y-4 web:m-4">
        <Text className="text-center text-white">Pas encore de compte ?<br />Contacter votre employeur</Text>
				<Button
					size="lg"
					variant="secondary"
					onPress={() => {
						router.push("/sign-in");
					}}
				>
					<Text>SE CONNECTER</Text>
				</Button>
			</View>
		</SafeAreaView>
	);
}
