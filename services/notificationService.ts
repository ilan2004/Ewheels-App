import { supabase } from '@/lib/supabase';

interface PushNotificationMessage {
    to: string;
    sound: string;
    title: string;
    body: string;
    data: any;
}

export class NotificationService {

    async sendPushNotification(expoPushToken: string, title: string, body: string, data: any = {}) {
        const message: PushNotificationMessage = {
            to: expoPushToken,
            sound: 'default',
            title,
            body,
            data,
        };

        try {
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });

            const result = await response.json();
            console.log('Notification sent:', result);
            return result;
        } catch (error) {
            console.error('Error sending notification:', error);
            return null;
        }
    }

    async notifyFloorManagers(ticketId: string, ticketNumber: string, customerName: string) {
        try {
            // 1. Get all users with role 'floor_manager'
            const { data: floorManagers, error: roleError } = await supabase
                .from('app_roles')
                .select('user_id')
                .eq('role', 'floor_manager');

            if (roleError) throw roleError;
            if (!floorManagers || floorManagers.length === 0) return;

            const userIds = floorManagers.map(fm => fm.user_id);

            // 2. Get push tokens for these users
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('expo_push_token')
                .in('user_id', userIds)
                .not('expo_push_token', 'is', null);

            if (profileError) throw profileError;
            if (!profiles || profiles.length === 0) return;

            // 3. Send notification to each token
            const title = 'New Job Card Created';
            const body = `Job Card #${ticketNumber} has been created for ${customerName}.`;
            const data = { ticketId, ticketNumber };

            const sendPromises = profiles.map(profile => {
                if (profile.expo_push_token) {
                    return this.sendPushNotification(profile.expo_push_token, title, body, data);
                }
                return Promise.resolve(null);
            });

            await Promise.all(sendPromises);
            console.log(`Notified ${profiles.length} floor managers.`);

        } catch (error) {
            console.error('Error in notifyFloorManagers:', error);
        }
    }
}

export const notificationService = new NotificationService();
