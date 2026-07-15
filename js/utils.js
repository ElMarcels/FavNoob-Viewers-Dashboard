const Utils = {
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    },

    formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m ${s}s`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    },

    formatDuration(minutes) {
        if (minutes >= 60) {
            const h = Math.floor(minutes / 60);
            const m = minutes % 60;
            return m > 0 ? `${h}h ${m}m` : `${h}h`;
        }
        return `${minutes}m`;
    },

    timeAgo(timestamp) {
        const diff = Date.now() - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `hace ${days}d`;
        if (hours > 0) return `hace ${hours}h`;
        if (minutes > 0) return `hace ${minutes}m`;
        return 'ahora';
    },

    getLevelInfo(level) {
        return CONFIG.LEVELS.find(l => l.level === level) || CONFIG.LEVELS[0];
    },

    getNextLevelInfo(level) {
        return CONFIG.LEVELS.find(l => l.level === level + 1) || null;
    },

    getXPProgress(xp, level) {
        const current = CONFIG.LEVELS.find(l => l.level === level);
        const next = CONFIG.LEVELS.find(l => l.level === level + 1);
        if (!next) return 1;
        const progress = (xp - current.xp) / (next.xp - current.xp);
        return Math.max(0, Math.min(1, progress));
    },

    getLevelColor(level) {
        if (level >= 8) return '#ffd700';
        if (level >= 6) return '#ff6b9d';
        if (level >= 4) return '#9146ff';
        if (level >= 2) return '#40c4ff';
        return '#a89ec8';
    },

    getMedal(rank) {
        if (rank === 0) return '🥇';
        if (rank === 1) return '🥈';
        if (rank === 2) return '🥉';
        return `#${rank + 1}`;
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    sanitizeChatMessage(msg) {
        return this.escapeHtml(msg)
            .replace(/(\bhttps?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    },

    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️', xp: '✨' };
        toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-message">${message}</span>`;
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    showModal(title, bodyHtml) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = bodyHtml;
        document.getElementById('modalOverlay').classList.add('active');
    },

    hideModal() {
        document.getElementById('modalOverlay').classList.remove('active');
    },

    shuffleArray(arr) {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    debounce(fn, ms) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), ms);
        };
    },

    createProgressBar(progress, color = 'var(--primary)', height = '8px') {
        return `<div class="progress-bar" style="height:${height}"><div class="progress-fill" style="width:${Math.round(progress * 100)}%;background:${color}"></div></div>`;
    },

    formatDate(date) {
        return `${date.getDate()} de ${MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`;
    },

    formatTime24(date) {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },

    getWeekDates() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const start = new Date(now);
        start.setDate(now.getDate() - dayOfWeek);
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            dates.push(d);
        }
        return dates;
    },

    playNotificationSound() {
        if (!State.get('settings').sounds) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.2);
        } catch (e) {}
    },

    playXPSound() {
        if (!State.get('settings').sounds) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523, ctx.currentTime);
            osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
            osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {}
    },
};
