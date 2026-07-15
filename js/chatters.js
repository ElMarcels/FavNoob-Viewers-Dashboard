const Chatters = {
    render() {
        const chatters = State.getTopChatters(50);
        const user = State.get('user');

        return `
            <div class="page-header">
                <h1>🏆 Top Chatters</h1>
                <p class="page-subtitle">Ranking de viewers por XP acumulado</p>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-info">
                        <div class="stat-value">${Object.keys(State.get('chatters')).length}</div>
                        <div class="stat-label">Chatters Totales</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💬</div>
                    <div class="stat-info">
                        <div class="stat-value">${this._totalMessages()}</div>
                        <div class="stat-label">Mensajes Totales</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⏱️</div>
                    <div class="stat-info">
                        <div class="stat-value">${Utils.formatDuration(this._totalWatchTime())}</div>
                        <div class="stat-label">Tiempo Total Visto</div>
                    </div>
                </div>
            </div>

            ${user ? this._renderMyStats(user) : ''}

            <div class="card">
                <div class="card-header">
                    <h3>Ranking General</h3>
                    <div class="card-actions">
                        <button class="btn btn-sm btn-outline" onclick="Chatters.exportChatters()">📥 Exportar</button>
                        ${State.get('isAdmin') ? `<button class="btn btn-sm btn-danger" onclick="Chatters.resetAllXP()">🔄 Reset XP</button>` : ''}
                    </div>
                </div>
                <div class="chatters-list" id="chattersList">
                    ${chatters.length === 0 ? '<div class="empty-state"><span class="empty-icon">🏆</span><p>No hay chatters aún. ¡Los mensajes del chat generarán XP!</p></div>' : ''}
                    ${chatters.map((c, i) => this._renderChatterCard(c, i)).join('')}
                </div>
            </div>

            <div class="card">
                <div class="card-header"><h3>📊 Niveles</h3></div>
                <div class="levels-grid">
                    ${CONFIG.LEVELS.map(l => `
                        <div class="level-item" style="--level-color: ${Utils.getLevelColor(l.level)}">
                            <div class="level-badge" style="background: ${Utils.getLevelColor(l.level)}">${l.level}</div>
                            <div class="level-info">
                                <div class="level-title">${l.title}</div>
                                <div class="level-xp">${Utils.formatNumber(l.xp)} XP</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    _renderMyStats(user) {
        const me = State.getChatter(user.login);
        const nextLevel = Utils.getNextLevelInfo(me.level);
        const progress = Utils.getXPProgress(me.xp, me.level);

        return `
            <div class="card my-stats-card">
                <div class="card-header"><h3>📊 Mis Estadísticas</h3></div>
                <div class="my-stats-content">
                    <div class="my-level">
                        <div class="level-circle" style="--level-color: ${Utils.getLevelColor(me.level)}">
                            <span class="level-num">${me.level}</span>
                        </div>
                        <div class="my-level-info">
                            <div class="my-title" style="color: ${Utils.getLevelColor(me.level)}">${me.title}</div>
                            <div class="my-xp">${Utils.formatNumber(me.xp)} XP${nextLevel ? ` — ${Utils.formatNumber(nextLevel.xp - me.xp)} XP para ${nextLevel.title}` : ' — ¡Nivel Máximo!'}</div>
                        </div>
                    </div>
                    <div class="progress-bar-container">
                        ${Utils.createProgressBar(progress, Utils.getLevelColor(me.level), '12px')}
                    </div>
                    <div class="my-details">
                        <div class="detail-item"><span>💬</span><span>${me.messages} mensajes</span></div>
                        <div class="detail-item"><span>👁️</span><span>${Utils.formatDuration(me.watchTime)}</span></div>
                        <div class="detail-item"><span>💎</span><span>${Utils.formatNumber(me.bits)} bits</span></div>
                        <div class="detail-item"><span>⭐</span><span>${me.subs} subs</span></div>
                    </div>
                </div>
            </div>
        `;
    },

    _renderChatterCard(chatter, rank) {
        const progress = Utils.getXPProgress(chatter.xp, chatter.level);
        const color = Utils.getLevelColor(chatter.level);

        return `
            <div class="chatter-card ${rank < 3 ? 'top-three' : ''}" style="--rank-color: ${color}">
                <div class="chatter-rank">${Utils.getMedal(rank)}</div>
                <div class="chatter-info">
                    <div class="chatter-name">
                        <span class="chatter-display">${Utils.escapeHtml(chatter.displayName)}</span>
                        <span class="chatter-level" style="color: ${color}">Nv.${chatter.level} ${chatter.title}</span>
                    </div>
                    <div class="chatter-xp-bar">
                        ${Utils.createProgressBar(progress, color, '6px')}
                        <span class="chatter-xp-text">${Utils.formatNumber(chatter.xp)} XP</span>
                    </div>
                    <div class="chatter-details">
                        <span>💬 ${chatter.messages}</span>
                        <span>👁️ ${Utils.formatDuration(chatter.watchTime)}</span>
                        ${chatter.bits > 0 ? `<span>💎 ${Utils.formatNumber(chatter.bits)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    _totalMessages() {
        return Object.values(State.get('chatters')).reduce((sum, c) => sum + c.messages, 0);
    },

    _totalWatchTime() {
        return Object.values(State.get('chatters')).reduce((sum, c) => sum + c.watchTime, 0);
    },

    onMessage(username) {
        const result = State.addXP(username, CONFIG.XP.MESSAGE, 'message');
        const chatter = State.getChatter(username);
        chatter.messages++;

        if (result.leveledUp) {
            Utils.showToast(`${username} subió al nivel ${result.newLevel}: ${result.title}!`, 'xp', 4000);
            Utils.playXPSound();
        }
    },

    onWatch(username, minutes) {
        State.addXP(username, minutes * CONFIG.XP.MINUTE_WATCHED, 'watch');
        const chatter = State.getChatter(username);
        chatter.watchTime += minutes;
        State.save();
    },

    onBits(username, amount) {
        const xp = amount * CONFIG.XP.CHEER_BASE;
        State.addXP(username, xp, 'bits');
        const chatter = State.getChatter(username);
        chatter.bits += amount;
        State.save();
        Utils.showToast(`${username} envió ${amount} bits (+${xp} XP)!`, 'xp');
    },

    onSub(username) {
        State.addXP(username, CONFIG.XP.SUB_BASE, 'sub');
        const chatter = State.getChatter(username);
        chatter.subs++;
        State.save();
    },

    onGift(username, count) {
        const xp = count * CONFIG.XP.GIFT_BASE;
        State.addXP(username, xp, 'gifts');
        const chatter = State.getChatter(username);
        chatter.gifts += count;
        State.save();
    },

    exportChatters() {
        const data = JSON.stringify(State.getTopChatters(100), null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `favnooob_chatters_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Utils.showToast('Chatters exportados', 'success');
    },

    resetAllXP() {
        if (confirm('¿Estás seguro de resetear toda la XP? Esta acción no se puede deshacer.')) {
            State.set('chatters', {});
            Utils.showToast('XP reseteada', 'warning');
            App.refreshCurrentPage();
        }
    },
};
