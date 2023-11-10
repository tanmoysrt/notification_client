
class FrappeNotification {
    static relayServerBaseURL = 'http://notification.relay:8000';

    // Constructor
    constructor(project_id, app_name, messageHandler) {
        this.project_id = project_id;
        this.app_name = app_name;
        this.token = null;
        this.messaging = null;
        if (messageHandler != null) {
            this.onMessage = messageHandler;
        } else {
            this.onMessage = this.onMessageDefault;
        }
    }

    // Setup notification service
    async init() {
        // fetch web config
        const config = await this.fetchConfig(this.project_id, this.app_name);
        // encode config to pass to service worker
        const encodeConfig = encodeURIComponent(JSON.stringify(config));
        const serviceWorkerURL = `/assets/frappe-notification-sw.js?config=${encodeConfig}`;
        // register service worker
        if ("serviceWorker" in navigator) {
            const registration = await navigator.serviceWorker.register(serviceWorkerURL);
            console.log("SW registered:", registration);
            // initialize firebase
            firebase.initializeApp(config);
            // initialize messaging
            this.messaging = firebase.messaging();
            this.messaging.useServiceWorker(registration);
            this.messaging.onMessage(this.onMessage);
        }

    }

    // Fetch web config from relay server
    async fetchConfig(project_id, app_name) {
        let url = `${FrappeNotification.relayServerBaseURL}/api/method/notification_relay.api.web.config?project_id=${project_id}&app_name=${app_name}`
        let response = await fetch(url);
        let data = await response.json();
        return data;
    }

    // Subscribe to notification
    subscribe() {
        if (this.messaging == null) {
            return null;
        }
        return this.messaging.requestPermission().then(() => {
            console.log("Notification permission granted.");
            return this.messaging.getToken();
        }).then((token) => {
            this.token = token;
            return token;
        }).catch((err) => {
            return null;
        });
    }

    onMessageDefault(payload) {
        let msg = payload.notification.title + "\n" + payload.notification.body;
        alert(msg);
    }
}



