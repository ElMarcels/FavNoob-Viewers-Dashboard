const Alerts = {
    events: [],
    maxEvents: 100,

    render() {
        const events = this.events.slice(0, 50);

        return `
            <div class="page-header">
                <h1>🔔 Centro de Alertas</h1>
                <p class="page-subtitle">Eventos recientes del canal en tiempo real</p>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">💬</div>
                    <div class="stat-info">
                        <div class="stat-value" id="alertMsgCount">0</div>
                        <div class="stat-label">Mensajes Hoy</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-info">
                        <div class="stat-value" id="alertSubCount">0</div>
                        <div class="stat-label">Suscripciones Hoy</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💎</div>
                    <div class="stat-info">
                        <div class="stat-value" id="alertBitCount">0</div>
                        <div class="stat-label">Bits Hoy</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🎁</div>
                    <div class="stat-info">
                        <div class="stat-value" id="alertGiftCount">0</div>
                        <div class="stat-label">Gifts Hoy</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>📜 Eventos Recientes</h3>
                    <button class="btn btn-sm btn-outline" onclick="Alerts.clear()">🗑️ Limpiar</button>
                </div>
                <div class="events-list" id="eventsList">
                    ${events.length === 0 ? '<div class="empty-state"><span class="empty-icon">🔔</span><p>Los eventos aparecerán aquí cuando el chat esté conectado</p></div>' : ''}
                    ${events.map(e => this._renderEvent(e)).join('')}
                </div>
            </div>
        `;
    },

    _renderEvent(event) {
        const icons = {
            message: '💬',
            sub: '⭐',
            gift: '🎁',
            bits: '💎',
            follow: '❤️',
            raid: '🚀',
            level_up: '🎉',
            giveaway: '🎁',
            system: 'ℹ️',
        };

        const time = new Date(event.timestamp);
        const timeStr = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}:${String(time.getSeconds()).padStart(2, '0')}`;

        return `
            <div class="event-item event-${event.type}">
                <span class="event-icon">${icons[event.type] || 'ℹ️'}</span>
                <span class="event-time">${timeStr}</span>
                <span class="event-text">${event.html || Utils.escapeHtml(event.text)}</span>
            </div>
        `;
    },

    add(type, text, html = null) {
        const event = {
            type,
            text,
            html: html || null,
            timestamp: Date.now(),
        };

        this.events.unshift(event);
        if (this.events.length > this.maxEvents) {
            this.events.pop();
        }

        this._updateCounters();
        this._appendEvent(event);
    },

    _appendEvent(event) {
        const list = document.getElementById('eventsList');
        if (!list) return;

        const empty = list.querySelector('.empty-state');
        if (empty) empty.remove();

        const el = document.createElement('div');
        el.innerHTML = this._renderEvent(event);
        list.insertBefore(el.firstElementChild, list.firstChild);

        while (list.children.length > 50) {
            list.removeChild(list.lastChild);
        }
    },

    _updateCounters() {
        const today = new Date().toDateString();
        const todayEvents = this.events.filter(e => new Date(e.timestamp).toDateString() === today);

        const el = (id) => document.getElementById(id);
        const mc = el('alertMsgCount');
        const sc = el('alertSubCount');
        const bc = el('alertBitCount');
        const gc = el('alertGiftCount');

        if (mc) mc.textContent = todayEvents.filter(e => e.type === 'message').length;
        if (sc) sc.textContent = todayEvents.filter(e => e.type === 'sub').length;
        if (bc) bc.textContent = todayEvents.filter(e => e.type === 'bits').length;
        if (gc) gc.textContent = todayEvents.filter(e => e.type === 'gift').length;
    },

    clear() {
        this.events = [];
        Utils.showToast('Eventos limpiados', 'info');
        App.refreshCurrentPage();
    },
};
