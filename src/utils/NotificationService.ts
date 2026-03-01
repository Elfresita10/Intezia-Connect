// src/utils/NotificationService.ts

export class NotificationService {
    private static isSupported(): boolean {
        return 'Notification' in window && 'serviceWorker' in navigator;
    }

    static async requestPermission(): Promise<boolean> {
        if (!this.isSupported()) return false;

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    static getPermissionStatus(): NotificationPermission {
        if (!this.isSupported()) return 'denied';
        return Notification.permission;
    }

    static async sendLocalNotification(title: string, options?: NotificationOptions) {
        if (!this.isSupported()) return;

        if (Notification.permission === 'granted') {
            // For PWAs, it's best to show via service worker registration
            const registration = await navigator.serviceWorker.ready;
            registration.showNotification(title, {
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
                ...options
            });
        }
    }

    /**
     * Checks if it's Friday and if we haven't shown the reminder yet today.
     */
    static checkFridayReminder() {
        const now = new Date();
        const isFriday = now.getDay() === 5; // 5 is Friday
        const isNineAM = now.getHours() >= 9;

        if (isFriday && isNineAM) {
            const todayKey = `reminded_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}`;
            const alreadyReminded = localStorage.getItem(todayKey);

            if (!alreadyReminded) {
                this.sendLocalNotification('Recordatorio Semanal', {
                    body: 'Es viernes. Por favor, rellena el formulario de seguimiento semanal.',
                    tag: 'friday-reminder'
                });
                localStorage.setItem(todayKey, 'true');
            }
        }
    }
}
