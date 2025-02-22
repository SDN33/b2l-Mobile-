import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ActivityIndicator, View } from "react-native";
import * as z from "zod";

import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormInput } from "@/components/ui/form";
import { Text } from "@/components/ui/text";
import { H1 } from "@/components/ui/typography";
import { useSupabase } from "@/context/supabase-provider";

const formSchema = z.object({
	email: z.string().email("Please enter a valid email address."),
	password: z
		.string()
		.min(4, "Please enter at least 4 characters.")
		.max(64, "Please enter fewer than 64 characters."),
});

export default function SignIn() {
	const { signInWithPassword } = useSupabase();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	async function onSubmit(data: z.infer<typeof formSchema>) {
		try {
			await signInWithPassword(data.email, data.password);

			form.reset();
		} catch (error: Error | any) {
			console.log(error.message);
		}
	}

	return (
		<SafeAreaView className="flex-1 bg-gray-950 p-4" edges={["bottom"]}>
			<View className="flex-1 gap-4 web:m-4">
				<H1 className="self-start text-white ">Connectez-vous</H1>
				<Form {...form}>
					<form className="flex-1 gap-4">
						<View className="gap-4">
							<Text className="text-white -mb-8">Email</Text>
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormInput
										label="Email"
										placeholder="Email"
										autoCapitalize="none"
										autoComplete="email"
										autoCorrect={false}
										keyboardType="email-address"
										{...field}
									/>
								)}
							/>
							<Text className="text-white -mb-8">Mot de passe</Text>
              <FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormInput
										label="Password"
										placeholder="Password"
										autoCapitalize="none"
										autoCorrect={false}
										secureTextEntry
										{...field}
									/>
								)}
							/>
						</View>
					</form>
				</Form>
			</View>
			<Button
				size="lg"
				variant="default"
				onPress={form.handleSubmit(onSubmit)}
				disabled={form.formState.isSubmitting}
				className="web:m-4 bg-white"
			>
				{form.formState.isSubmitting ? (
					<ActivityIndicator size="small" />
				) : (
					<Text key="sign-in-text" className="text-black">VALIDER</Text>
				)}
			</Button>
		</SafeAreaView>
	);
}
