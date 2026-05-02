import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import Icon from 'react-native-vector-icons/MaterialIcons';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'PdfViewer'>;
    route: RouteProp<RootStackParamList, 'PdfViewer'>;
};

const PdfViewerScreen: React.FC<Props> = ({ navigation, route }) => {
    const { url, title } = route.params;
    const [loading, setLoading] = useState(true);

    // On Android, WebView cannot natively render PDFs. We use Google Docs Viewer as a workaround.
    const pdfUrl = Platform.OS === 'android' 
        ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}` 
        : url;

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={20} color="#3861FB" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {title || 'Document Viewer'}
                </Text>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.content}>
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3861FB" />
                        <Text style={styles.loadingText}>Loading Document...</Text>
                    </View>
                )}
                <WebView
                    source={{ uri: pdfUrl }}
                    style={styles.webview}
                    onLoadEnd={() => setLoading(false)}
                    startInLoadingState={false}
                    scalesPageToFit={true}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FD' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingTop: Platform.OS === 'ios' ? 60 : 40, 
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F0F4FF', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '900', color: '#1A1A1A', textAlign: 'center', marginHorizontal: 10 },
    content: { flex: 1, position: 'relative' },
    webview: { flex: 1, backgroundColor: 'transparent' },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FD',
        zIndex: 10
    },
    loadingText: { marginTop: 10, fontSize: 14, color: '#3861FB', fontWeight: 'bold' }
});

export default PdfViewerScreen;
