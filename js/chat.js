const Chat = {
    client: null,
    messages: [],
    maxMessages: 200,
    connected: false,

    render() {
        return `
            <div class="page-header">
                <h1>💬 Chat en Vivo</h1>
                <p class="page-subtitle">Chat de Twitch en tiempo real</p>
            </div>

            <div class="chat-container">
                <div class="chat-sidebar">
                    <div class="card">
                        <div class="card-header"><h3>⚙️ Chat</h3></div>
                        <div class="chat-controls">
                            <div class="form-group">
                                <label class="form-label">Canal</label>
                                <input type="text" id="chatChannel" class="form-input" value="${CONFIG.CHANNEL}" ${State.get('isAdmin') ? '' : 'disabled'}>
                            </div>
                            <div class="chat-toggle-group">
                                <label class="toggle-label">
                                    <input type="checkbox" id="chatAutoScroll" checked onchange="Chat.toggleAutoScroll()">
                                    <span>Auto-scroll</span>
                                </label>
                                <label class="toggle-label">
                                    <input type="checkbox" id="chatShowBadges" checked onchange="Chat.toggleBadges()">
                                    <span>Mostrar badges</span>
                                </label>
                                <label class="toggle-label">
                                    <input type="checkbox" id="chatShowEmotes" checked onchange="Chat.toggleEmotes()">
                                    <span>Emotes</span>
                                </label>
                            </div>
                            <button class="btn btn-primary btn-block" id="chatConnectBtn" onclick="Chat.toggleConnection()">
                                📡 Conectar
                            </button>
                            <div class="chat-status" id="chatStatus">
                                <span class="status-dot offline"></span>
                                <span>Desconectado</span>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header"><h3>👥 Chatters Online</h3></div>
                        <div class="online-list" id="onlineList">
                            <div class="empty-state-small">Conéctate para ver chatters</div>
                        </div>
                    </div>
                </div>

                <div class="chat-main">
                    <div class="chat-messages" id="chatMessages">
                        <div class="chat-welcome">
                            <span class="chat-welcome-icon">💬</span>
                            <p>Conéctate al chat de <strong>${CONFIG.CHANNEL}</strong></p>
                            <p class="chat-welcome-sub">Los mensajes generarán XP automáticamente</p>
                        </div>
                    </div>
                    <div class="chat-input-container" id="chatInputContainer" style="display:none">
                        <input type="text" id="chatInput" class="chat-input" placeholder="Escribe un mensaje..." maxlength="500" onkeydown="if(event.key==='Enter')Chat.send()">
                        <button class="btn btn-primary" onclick="Chat.send()">Enviar</button>
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        this.loadSettings();
    },

    loadSettings() {
        const settings = State.get('chatSettings') || { autoScroll: true, showBadges: true, showEmotes: true };
        setTimeout(() => {
            const as = document.getElementById('chatAutoScroll');
            const sb = document.getElementById('chatShowBadges');
            const se = document.getElementById('chatShowEmotes');
            if (as) as.checked = settings.autoScroll;
            if (sb) sb.checked = settings.showBadges;
            if (se) se.checked = settings.showEmotes;
        }, 50);
    },

    toggleConnection() {
        if (this.connected) {
            this.disconnect();
        } else {
            this.connect();
        }
    },

    connect() {
        if (this.connected) return;

        const channel = CONFIG.CHANNEL.toLowerCase();

        if (typeof tmi === 'undefined') {
            Utils.showToast('TMI.js no está cargado. Verifica tu conexión a internet.', 'error');
            return;
        }

        this.client = new tmi.Client({
            options: { debug: false },
            connection: { reconnect: true, secure: true },
            channels: [channel],
        });

        this.client.connect().then(() => {
            this.connected = true;
            this.updateConnectionUI(true);
            Utils.showToast(`Conectado al chat de ${channel}`, 'success');
        }).catch(err => {
            console.error('TMI connection error:', err);
            Utils.showToast('Error al conectar al chat', 'error');
        });

        this.client.on('message', (channel, tags, message, self) => {
            if (self) return;
            this.addMessage({
                id: tags.id,
                username: tags['display-name'] || tags.username,
                message: message,
                color: tags.color || '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
                badges: tags.badges,
                'badge-info': tags['badge-info'],
                subscriber: tags.subscriber,
                mod: tags.mod,
                room_id: tags['room-id'],
                user_id: tags['user-id'],
                tmi_sent_ts: tags['tmi-sent-ts'],
            });

            const username = tags.username;
            if (username) {
                Chatters.onMessage(username);

                if (tags.bits) {
                    Chatters.onBits(username, parseInt(tags.bits));
                }
            }
        });

        this.client.on('subscription', (channel, username, method, message, userstate) => {
            Chatters.onSub(username);
            this.addSystemMessage(`${username} se suscribió al canal! ⭐`);
            Utils.playNotificationSound();
        });

        this.client.on('submysterygift', (channel, username, numbOfSubs, methods, userstate) => {
            Chatters.onGift(username, numbOfSubs);
            this.addSystemMessage(`${username} regaló ${numbOfSubs} suscripciones! 🎁`);
            Utils.playNotificationSound();
        });

        this.client.on('cheer', (channel, message, tags) => {
            const username = tags.username;
            if (username && tags.bits) {
                this.addSystemMessage(`${username} envió ${tags.bits} bits! 💎`);
            }
        });
    },

    disconnect() {
        if (this.client) {
            this.client.disconnect();
            this.client = null;
        }
        this.connected = false;
        this.updateConnectionUI(false);
        Utils.showToast('Desconectado del chat', 'info');
    },

    updateConnectionUI(connected) {
        const btn = document.getElementById('chatConnectBtn');
        const status = document.getElementById('chatStatus');
        const inputContainer = document.getElementById('chatInputContainer');

        if (btn) {
            btn.textContent = connected ? '🔴 Desconectar' : '📡 Conectar';
            btn.className = connected ? 'btn btn-danger btn-block' : 'btn btn-primary btn-block';
        }
        if (status) {
            status.innerHTML = connected
                ? '<span class="status-dot online"></span><span>Conectado</span>'
                : '<span class="status-dot offline"></span><span>Desconectado</span>';
        }
        if (inputContainer) {
            inputContainer.style.display = connected ? 'flex' : 'none';
        }
    },

    addMessage(data) {
        this.messages.push(data);
        if (this.messages.length > this.maxMessages) {
            this.messages.shift();
        }
        this.renderMessage(data);
        this.updateOnlineUsers(data.username);
    },

    addSystemMessage(text) {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        const el = document.createElement('div');
        el.className = 'chat-message system-message';
        el.innerHTML = `<span class="system-text">${text}</span>`;
        container.appendChild(el);
        this.autoScroll(container);
    },

    renderMessage(data) {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        const welcome = container.querySelector('.chat-welcome');
        if (welcome) welcome.remove();

        const el = document.createElement('div');
        el.className = 'chat-message';

        const badges = this._renderBadges(data);
        const emotes = this._parseEmotes(data.message, data['emotes']);

        el.innerHTML = `
            <span class="msg-badges">${badges}</span>
            <span class="msg-name" style="color:${data.color}">${Utils.escapeHtml(data.username)}</span><span class="msg-colon">: </span>
            <span class="msg-text">${emotes}</span>
        `;

        container.appendChild(el);
        this.autoScroll(container);
    },

    _renderBadges(data) {
        if (!data.badges || !State.get('chatSettings')?.showBadges) return '';
        const badgeIcons = {
            'broadcaster': '👑',
            'moderator': '⚔️',
            'vip': '💎',
            'subscriber': '⭐',
            'premium': '✨',
            'partner': '✅',
        };
        return Object.keys(data.badges).map(b => {
            return badgeIcons[b] ? `<span class="badge" title="${b}">${badgeIcons[b]}</span>` : '';
        }).join('');
    },

    _parseEmotes(message, emotes) {
        if (!emotes || !State.get('chatSettings')?.showEmotes) return Utils.escapeHtml(message);

        let result = Utils.escapeHtml(message);
        const emoteList = [];
        Object.entries(emotes).forEach(([id, positions]) => {
            positions.forEach(pos => {
                const [start, end] = pos.split('-').map(Number);
                const emoteText = message.substring(start, end + 1);
                emoteList.push({ start, end, text: emoteText, id });
            });
        });
        emoteList.sort((a, b) => b.start - a.start);
        emoteList.forEach(e => {
            const emoteUrl = `<img class="chat-emote" src="https://static-cdn.jtvnw.net/emoticons/v2/${e.id}/default/dark/1.0" alt="${e.text}" title="${e.text}">`;
            const escaped = Utils.escapeHtml(e.text);
            result = result.replace(escaped, emoteUrl);
        });

        return result;
    },

    autoScroll(container) {
        const settings = State.get('chatSettings') || { autoScroll: true };
        if (!settings.autoScroll) return;
        requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
        });
    },

    updateOnlineUsers(username) {
        if (!username) return;
        const list = document.getElementById('onlineList');
        if (!list) return;

        if (!this._onlineUsers) this._onlineUsers = new Set();
        this._onlineUsers.add(username.toLowerCase());

        const items = [...this._onlineUsers].map(u => `<div class="online-user">● ${Utils.escapeHtml(u)}</div>`).join('');
        list.innerHTML = items;
    },

    send() {
        if (!this.connected || !this.client) return;
        const input = document.getElementById('chatInput');
        if (!input || !input.value.trim()) return;

        this.client.say(CONFIG.CHANNEL, input.value.trim());
        input.value = '';
    },

    toggleAutoScroll() {
        this._updateSetting('autoScroll', document.getElementById('chatAutoScroll').checked);
    },

    toggleBadges() {
        this._updateSetting('showBadges', document.getElementById('chatShowBadges').checked);
    },

    toggleEmotes() {
        this._updateSetting('showEmotes', document.getElementById('chatShowEmotes').checked);
    },

    _updateSetting(key, value) {
        const settings = State.get('chatSettings') || {};
        settings[key] = value;
        State.set('chatSettings', settings);
    },

    cleanup() {
        this.disconnect();
    },
};
