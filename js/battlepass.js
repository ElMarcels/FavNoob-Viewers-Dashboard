const BattlePass = {
    render() {
        const user = State.get('user');
        const myTier = user ? State.getBattlePassTier(user.login) : 0;
        const myProgress = user ? State.getBattlePassProgress(user.login) : null;

        return `
            <div class="page-header">
                <h1>🎖️ Pase de Batalla</h1>
                <p class="page-subtitle">Sube de nivel completando misiones y ganando XP</p>
            </div>

            ${user ? this._renderMyProgress(myProgress) : '<div class="card"><p style="text-align:center;padding:20px">Inicia sesión con Twitch para ver tu progreso</p></div>'}

            <div class="card">
                <div class="card-header">
                    <h3>📋 Misiones</h3>
                    ${user ? '<button class="btn btn-sm btn-outline" onclick="BattlePass.refreshDailyMissions()">🔄 Refrescar Diarias</button>' : ''}
                </div>
                ${this._renderMissions(user)}
            </div>

            <div class="card">
                <div class="card-header"><h3>🗺️ Mapa de Recompensas</h3></div>
                <div class="rewards-track">
                    ${this._renderRewardsTrack(myTier)}
                </div>
            </div>
        `;
    },

    _renderMyProgress(progress) {
        if (!progress) return '';
        const nextTierXP = (progress.tier + 1) * CONFIG.BATTLE_PASS.XP_PER_TIER;
        const xpForNext = nextTierXP - progress.totalXP;

        return `
            <div class="card bp-progress-card">
                <div class="bp-progress-content">
                    <div class="bp-tier-display">
                        <div class="bp-tier-circle">
                            <span class="bp-tier-num">${Math.min(progress.tier, CONFIG.BATTLE_PASS.TOTAL_TIERS)}</span>
                            <span class="bp-tier-label">Tier</span>
                        </div>
                    </div>
                    <div class="bp-progress-info">
                        <h2>${Math.min(progress.tier, CONFIG.BATTLE_PASS.TOTAL_TIERS)} / ${CONFIG.BATTLE_PASS.TOTAL_TIERS}</h2>
                        <p>${xpForNext > 0 ? `${Utils.formatNumber(xpForNext)} XP para el siguiente tier` : '🏆 ¡Tier Máximo Alcanzado!'}</p>
                        <div class="progress-bar-container">
                            ${Utils.createProgressBar(progress.progress, 'var(--accent)', '14px')}
                        </div>
                        <div class="bp-total-xp">Total: ${Utils.formatNumber(progress.totalXP)} XP</div>
                    </div>
                </div>
            </div>
        `;
    },

    _renderMissions(user) {
        const chatter = user ? State.getChatter(user.login) : null;
        const today = new Date().toDateString();
        const dailyMissions = chatter && chatter.dailyMissionsDate === today ? chatter.dailyMissions : [];

        const allMissions = [...CONFIG.MISIONES.slice(0, 6), ...dailyMissions];

        if (allMissions.length === 0) {
            return '<div class="empty-state"><p>Inicia sesión para ver misiones</p></div>';
        }

        return `
            <div class="missions-grid">
                ${dailyMissions.length > 0 ? `
                    <div class="missions-section">
                        <h4 class="missions-section-title">🌅 Misiones Diarias</h4>
                        ${dailyMissions.map(m => this._renderMission(m, chatter)).join('')}
                    </div>
                ` : ''}
                <div class="missions-section">
                    <h4 class="missions-section-title">📌 Misiones Permanentes</h4>
                    ${CONFIG.MISIONES.slice(0, 6).map(m => this._renderMission(m, chatter)).join('')}
                </div>
            </div>
        `;
    },

    _renderMission(mission, chatter) {
        const progress = chatter && chatter.missions[mission.id] ? chatter.missions[mission.id] : { progress: 0, completed: false };
        const pct = Math.min(progress.progress / mission.target, 1);

        return `
            <div class="mission-card ${progress.completed ? 'completed' : ''}">
                <div class="mission-icon">${mission.icon}</div>
                <div class="mission-info">
                    <div class="mission-name">${Utils.escapeHtml(mission.name)}</div>
                    <div class="mission-desc">${Utils.escapeHtml(mission.desc)}</div>
                    <div class="mission-progress-bar">
                        ${Utils.createProgressBar(pct, progress.completed ? 'var(--success)' : 'var(--primary)', '6px')}
                    </div>
                    <div class="mission-progress-text">
                        <span>${progress.progress} / ${mission.target}</span>
                        <span class="mission-xp">+${mission.xp} XP</span>
                    </div>
                </div>
                ${progress.completed ? '<div class="mission-check">✅</div>' : ''}
            </div>
        `;
    },

    _renderRewardsTrack(currentTier) {
        const rewards = Object.entries(CONFIG.REWARD_TIERS).map(([tier, reward]) => ({
            tier: parseInt(tier),
            ...reward,
        }));
        rewards.sort((a, b) => a.tier - b.tier);

        return `
            <div class="rewards-scroll">
                ${rewards.map(r => `
                    <div class="reward-node ${currentTier >= r.tier ? 'unlocked' : 'locked'}">
                        <div class="reward-tier">${r.tier}</div>
                        <div class="reward-icon">${r.icon}</div>
                        <div class="reward-name">${r.name}</div>
                        ${currentTier >= r.tier ? '<div class="reward-check">✅</div>' : ''}
                    </div>
                `).join('')}
            </div>
        `;
    },

    refreshDailyMissions() {
        if (!Auth.requireAuth()) return;
        const user = State.get('user');
        State.resetDailyMissions(user.login);
        Utils.showToast('Misiones diarias refrescadas!', 'success');
        App.refreshCurrentPage();
    },
};
