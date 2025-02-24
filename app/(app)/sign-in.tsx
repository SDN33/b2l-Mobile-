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
import { StyleSheet } from "react-native";

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
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.headerContainer}>
                    <H1 style={styles.title}>Bienvenue</H1>
                    <Text style={styles.subtitle}>Connectez-vous pour continuer</Text>
                </View>

                <Form {...form}>
                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormInput
                                        style={styles.input}
                                        placeholder="votremail@exemple.com"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        autoCorrect={false}
                                        keyboardType="email-address"
                                        {...field}
                                    />
                                )}
                            />

                            <Text style={styles.label}>Mot de passe</Text>
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        secureTextEntry
                                        {...field}
                                    />
                                )}
                            />
                        </View>
                    </View>
                </Form>
            </View>

            <Button
                onPress={form.handleSubmit(onSubmit)}
                disabled={form.formState.isSubmitting}
                style={styles.button}
            >
                {form.formState.isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.buttonText}>SE CONNECTER</Text>
                )}
            </Button>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        padding: 24,
    },
    headerContainer: {
        marginBottom: 32,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
    },
    formContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 24,
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
    },
    inputGroup: {
        gap: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 4,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#111827',
    },
    button: {
        margin: 24,
        backgroundColor: '#2563EB',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0px 4px 8px rgba(37, 99, 235, 0.2)',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});