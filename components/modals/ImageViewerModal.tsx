import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, Modal, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const styles = StyleSheet.create({
    imageViewerContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    imageViewerHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    imageViewerCloseButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageViewerTitle: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    imageViewerTitleText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    imageViewerSubtitle: {
        color: '#FFFFFF',
        fontSize: 14,
        opacity: 0.8,
        marginTop: 4,
    },
    imageViewerSpacer: {
        width: 44,
    },
    imageViewerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: '100%',
        height: '100%',
    },
    imageNavButton: {
        position: 'absolute',
        top: '50%',
        transform: [{ translateY: -25 }],
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    imageNavButtonLeft: {
        left: 20,
    },
    imageNavButtonRight: {
        right: 20,
    },
    imageIndicators: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        zIndex: 1000,
    },
    imageIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    imageIndicatorActive: {
        backgroundColor: '#FFFFFF',
    },
});

interface ImageViewerModalProps {
    visible: boolean;
    onClose: () => void;
    images: Array<{ id: string; url: string; name: string }>;
    initialIndex: number;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
    visible,
    onClose,
    images,
    initialIndex,
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex, visible]);

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    };

    if (!images.length) return null;

    return (
        <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
            <View style={styles.imageViewerContainer}>
                <StatusBar hidden />

                {/* Header */}
                <View style={styles.imageViewerHeader}>
                    <TouchableOpacity onPress={onClose} style={styles.imageViewerCloseButton}>
                        <IconSymbol name="xmark" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.imageViewerTitle}>
                        <Text style={styles.imageViewerTitleText}>
                            {currentIndex + 1} of {images.length}
                        </Text>
                        <Text style={styles.imageViewerSubtitle} numberOfLines={1}>
                            {images[currentIndex]?.name}
                        </Text>
                    </View>
                    <View style={styles.imageViewerSpacer} />
                </View>

                {/* Image */}
                <View style={styles.imageViewerContent}>
                    <Image
                        source={{ uri: images[currentIndex]?.url }}
                        style={[styles.fullScreenImage, { width: screenWidth, height: screenHeight - 100 }]}
                        resizeMode="contain"
                    />
                </View>

                {/* Navigation */}
                {images.length > 1 && (
                    <>
                        <TouchableOpacity
                            style={[styles.imageNavButton, styles.imageNavButtonLeft]}
                            onPress={goToPrevious}
                        >
                            <IconSymbol name="chevron.left" size={32} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.imageNavButton, styles.imageNavButtonRight]}
                            onPress={goToNext}
                        >
                            <IconSymbol name="chevron.right" size={32} color="#FFFFFF" />
                        </TouchableOpacity>
                    </>
                )}

                {/* Bottom indicators */}
                {images.length > 1 && (
                    <View style={styles.imageIndicators}>
                        {images.map((_, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.imageIndicator,
                                    index === currentIndex && styles.imageIndicatorActive,
                                ]}
                                onPress={() => setCurrentIndex(index)}
                            />
                        ))}
                    </View>
                )}
            </View>
        </Modal>
    );
};
