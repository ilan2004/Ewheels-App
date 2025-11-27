import { useRouter } from 'expo-router';
import React from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { BrandColors, Colors, Spacing, Typography } from '@/constants/design-system';
import { useMediaHubStore } from '@/stores/mediaHubStore';
import MediaItem from './MediaItem';

export default function AudioList() {
    const router = useRouter();
    const { getFilteredItems } = useMediaHubStore();

    // Get all items, then filter for audio
    // Note: getFilteredItems might already respect the global filter, but we want to be sure we only show audio here
    // regardless of the global filter state if we are in this specific tab.
    // However, usually the store's filter is what drives the UI. 
    // For this specific "Recordings" tab, we probably want to show ALL audio files, 
    // or maybe respect the job card filter if one is active.

    const allItems = getFilteredItems();
    const audioItems = allItems.filter(item => item.mediaType === 'audio');

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>All Recordings</Text>
                <Text style={styles.count}>{audioItems.length} items</Text>
            </View>

            <FlatList
                data={audioItems}
                renderItem={({ item }) => (
                    <MediaItem
                        item={item}
                        onPress={() => router.push({
                            pathname: '/(tabs)/recording-player',
                            params: {
                                id: item.id,
                                name: item.fileName,
                                localUri: item.localUri,
                                durationSeconds: String(item.durationSeconds ?? 0),
                                createdAt: item.createdAt,
                                publicUrl: item.remoteUrl ?? '',
                            },
                        })}
                    />
                )}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <View style={styles.emptyState}>
                        <IconSymbol name="waveform" size={48} color={Colors.neutral[300]} />
                        <Text style={styles.emptyStateText}>No recordings found</Text>
                        <Text style={styles.emptyStateSubtext}>
                            Switch to the Record tab to create a new voice memo
                        </Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.surface,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: BrandColors.ink + '10',
    },
    title: {
        fontSize: Typography.fontSize.lg,
        fontFamily: Typography.fontFamily.semibold,
        color: BrandColors.title,
    },
    count: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.regular,
        color: BrandColors.ink + '60',
    },
    listContent: {
        padding: Spacing.lg,
        paddingBottom: 100, // Space for bottom tab bar if needed
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyStateText: {
        fontSize: Typography.fontSize.lg,
        fontFamily: Typography.fontFamily.medium,
        color: BrandColors.ink + '60',
        marginTop: Spacing.base,
        marginBottom: Spacing.xs,
    },
    emptyStateSubtext: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.regular,
        color: BrandColors.ink + '40',
        textAlign: 'center',
    },
});
