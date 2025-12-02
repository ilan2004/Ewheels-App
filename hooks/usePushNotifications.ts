import { useAuthStore } from '@/stores/authStore';
// import Constants, { ExecutionEnvironment } from 'expo-constants';
// import * as Device from 'expo-device';
// import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';

// const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// if (!isExpoGo) {
//     Notifications.setNotificationHandler({
//         handleNotification: async () => ({
//             shouldShowAlert: true,
//             shouldPlaySound: true,
//             shouldSetBadge: false,
//         }),
//     });
// }

export function usePushNotifications() {
    const [expoPushToken, setExpoPushToken] = useState<string | undefined>(undefined);
    const [notification, setNotification] = useState<any | undefined>(undefined);
    // const notificationListener = useRef<Notifications.Subscription>();
    // const responseListener = useRef<Notifications.Subscription>();
    const { user } = useAuthStore();

    async function registerForPushNotificationsAsync() {
        // if (isExpoGo) {
        //     console.log('Push notifications are not supported in Expo Go');
        //     return;
        // }
        console.log('Push notifications are temporarily disabled.');
        return undefined;

        /*
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                // alert('Failed to get push token for push notification!');
                console.log('Failed to get push token for push notification!');
                return;
            }

            // Get the token
            try {
                const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
                if (!projectId) {
                    // Fallback or just get token without projectId if not using EAS
                    token = (await Notifications.getExpoPushTokenAsync()).data;
                } else {
                    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
                }
                console.log('Expo Push Token:', token);
            } catch (e) {
                console.error('Error getting push token:', e);
            }
        } else {
            console.log('Must use physical device for Push Notifications');
        }

        return token;
        */
    }

    useEffect(() => {
        /*
        registerForPushNotificationsAsync().then(token => {
            setExpoPushToken(token);

            // Save token to user profile if user is logged in
            if (user && token) {
                saveTokenToProfile(user.id, token);
            }
        });

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log(response);
        });

        return () => {
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
        */
    }, [user]);

    /*
    const saveTokenToProfile = async (userId: string, token: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ expo_push_token: token })
                .eq('user_id', userId);

            if (error) {
                console.error('Error saving push token to profile:', error);
            } else {
                console.log('Push token saved to profile');
            }
        } catch (error) {
            console.error('Error in saveTokenToProfile:', error);
        }
    };
    */

    return {
        expoPushToken,
        notification,
    };
}
