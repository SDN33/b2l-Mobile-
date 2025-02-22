import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";

export default function Planning() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Planning</Text>
                <Text style={styles.subtitle}>This is the Planning page.</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        padding: 16,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    subtitle: {
        color: '#666',
        fontSize: 16,
        textAlign: 'center',
    },
});
