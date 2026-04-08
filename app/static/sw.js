const CACHE_NAME = 'timehack-v2';
const ASSETS = [
  '/',
  '/static/css/app.css',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest/dist/umd/lucide.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

// ── Smart Habit Push Events ────────────────────────
self.addEventListener('push', function(event) {
    if (!event.data) return;
    const data = event.data.json();
    
    const options = {
        body: data.body || 'Đã đến lúc bắt đầu thói quen của bạn!',
        icon: '/static/icons/icon-192x192.png',
        badge: '/static/icons/badge-72x72.png',
        tag: 'habit-reminder-' + data.habitId,
        data: {
            habitId: data.habitId,
            url: data.url || '/'
        },
        actions: [
            { action: 'start', title: '✅ Bắt đầu ngay' },
            { action: 'snooze', title: '⏰ Nhắc lại sau 15p' }
        ]
    };

    event.waitUntil(self.registration.showNotification(data.title || 'TimeHack Habit', options));
});

self.addEventListener('notificationclick', function(event) {
    const notification = event.notification;
    const action = event.action;
    const habitId = notification.data.habitId;

    notification.close();

    if (action === 'start') {
        // Quick Start Habit
        event.waitUntil(
            fetch('/tracker/api/time/quick-start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ habit_id: habitId })
            })
        );
    } else if (action === 'start_todo') {
        // Quick Start Todo Task
        const todoId = notification.data.todoId;
        event.waitUntil(
            fetch('/tracker/api/time/quick-start-todo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ todo_id: todoId })
            })
        );
    } else if (action === 'snooze' || action === 'snooze_todo') {
        console.log('Snoozed notification');
    } else {
        // Just open the app
        event.waitUntil(clients.openWindow(notification.data.url));
    }
});

// Track ignored notifications
self.addEventListener('notificationclose', function(event) {
    const habitId = event.notification.data.habitId;
    if (habitId) {
        fetch('/tracker/api/habits/ignore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ habit_id: habitId })
        });
    }
});

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((res) => res || fetch(event.request)));
});
