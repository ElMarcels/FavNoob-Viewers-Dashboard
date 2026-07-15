const Giveaways = {
    render() {
        const giveaways = State.get('giveaways') || [];
        const isAdmin = State.get('isAdmin');
        const user = State.get('user');

        return `
            <div class="page-header">
                <h1>🎁 Sorteos</h1>
                <p class="page-subtitle">Participa en los sorteos del canal</p>
            </div>

            ${isAdmin ? `
                <div class="card admin-panel">
                    <div class="card-header">
                        <h3>⚙️ Panel de Administración</h3>
                    </div>
                    <div class="admin-content">
                        <button class="btn btn-primary" onclick="Giveaways.showCreateForm()">➕ Crear Sorteo</button>
                        <button class="btn btn-outline" onclick="Giveaways.cleanExpired()">🗑️ Limpiar Expirados</button>
                    </div>
                </div>
            ` : ''}

            <div class="giveaways-grid">
                ${giveaways.length === 0 ? '<div class="empty-state"><span class="empty-icon">🎁</span><p>No hay sorteos activos en este momento</p></div>' : ''}
                ${giveaways.map(g => this._renderGiveawayCard(g, user)).join('')}
            </div>
        `;
    },

    _renderGiveawayCard(giveaway, user) {
        const now = Date.now();
        const isActive = giveaway.active && (!giveaway.endTime || giveaway.endTime > now);
        const hasEntered = user && giveaway.participants && giveaway.participants.includes(user.login);
        const isFinished = !giveaway.active || (giveaway.endTime && giveaway.endTime <= now);

        let timeLeft = '';
        if (isActive && giveaway.endTime) {
            const diff = giveaway.endTime - now;
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            timeLeft = `${hours}h ${minutes}m ${seconds}s`;
        }

        return `
            <div class="giveaway-card ${isActive ? 'active' : 'finished'}">
                <div class="giveaway-header">
                    <span class="giveaway-status ${isActive ? 'live' : 'ended'}">${isActive ? '🟢 Activo' : '🔴 Finalizado'}</span>
                    ${timeLeft ? `<span class="giveaway-timer">⏱️ ${timeLeft}</span>` : ''}
                </div>
                <div class="giveaway-prize">
                    <span class="giveaway-prize-icon">🎁</span>
                    <span class="giveaway-prize-text">${Utils.escapeHtml(giveaway.prize)}</span>
                </div>
                <div class="giveaway-info">
                    <span>👤 ${giveaway.requirement || 'Todos'}</span>
                    <span>👥 ${(giveaway.participants || []).length} participantes</span>
                </div>
                ${giveaway.description ? `<p class="giveaway-desc">${Utils.escapeHtml(giveaway.description)}</p>` : ''}
                <div class="giveaway-actions">
                    ${isActive && !hasEntered && user ? `<button class="btn btn-primary" onclick="Giveaways.enter('${giveaway.id}')">🎉 Participar</button>` : ''}
                    ${isActive && hasEntered ? `<button class="btn btn-outline" disabled>✅ Participando</button>` : ''}
                    ${!user && isActive ? `<button class="btn btn-outline" onclick="Auth.login()">🔑 Inicia sesión para participar</button>` : ''}
                    ${isFinished && giveaway.winner ? `<div class="giveaway-winner">👑 Ganador: <strong>${Utils.escapeHtml(giveaway.winner)}</strong></div>` : ''}
                    ${State.get('isAdmin') ? `
                        <div class="giveaway-admin-actions">
                            ${isActive ? `<button class="btn btn-sm btn-accent" onclick="Giveaways.draw('${giveaway.id}')">🎰 Elegir Ganador</button>` : ''}
                            <button class="btn btn-sm btn-danger" onclick="Giveaways.remove('${giveaway.id}')">🗑️</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    showCreateForm() {
        if (!Auth.requireAdmin()) return;

        Utils.showModal('Crear Sorteo', `
            <form id="giveawayForm" class="form-stack">
                <div class="form-group">
                    <label class="form-label">🏆 Premio</label>
                    <input type="text" id="gPrize" class="form-input" placeholder="Ej: Suscripción, Gift Card, etc." required>
                </div>
                <div class="form-group">
                    <label class="form-label">📝 Descripción (opcional)</label>
                    <textarea id="gDesc" class="form-input" rows="2" placeholder="Detalles del sorteo..."></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">⏱️ Duración (minutos)</label>
                    <input type="number" id="gDuration" class="form-input" value="30" min="1" max="1440">
                </div>
                <div class="form-group">
                    <label class="form-label">📋 Requisito</label>
                    <select id="gRequirement" class="form-input">
                        <option value="">Todos pueden participar</option>
                        <option value=" Seguidor">Ser seguidor</option>
                        <option value=" Suscriptor">Ser suscriptor</option>
                        <option value=" Nv.5+">Nivel 5+</option>
                        <option value=" Nv.3+">Nivel 3+</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary btn-block">🎁 Crear Sorteo</button>
            </form>
        `);

        document.getElementById('giveawayForm').onsubmit = (e) => {
            e.preventDefault();
            this.create({
                prize: document.getElementById('gPrize').value,
                description: document.getElementById('gDesc').value,
                duration: parseInt(document.getElementById('gDuration').value) * 60000,
                requirement: document.getElementById('gRequirement').value,
            });
        };
    },

    create(data) {
        if (!Auth.requireAdmin()) return;

        const giveaway = {
            id: Utils.generateId(),
            prize: data.prize,
            description: data.description,
            requirement: data.requirement,
            participants: [],
            active: true,
            winner: null,
            createdBy: State.get('user').login,
            createdAt: Date.now(),
            endTime: Date.now() + data.duration,
        };

        const giveaways = State.get('giveaways') || [];
        giveaways.unshift(giveaway);
        State.set('giveaways', giveaways);

        Utils.hideModal();
        Utils.showToast('Sorteo creado!', 'success');
        App.refreshCurrentPage();
    },

    enter(giveawayId) {
        if (!Auth.requireAuth()) return;

        const user = State.get('user');
        const giveaways = State.get('giveaways') || [];
        const giveaway = giveaways.find(g => g.id === giveawayId);

        if (!giveaway || !giveaway.active) {
            Utils.showToast('Este sorteo ya no está activo', 'warning');
            return;
        }

        if (giveaway.requirement) {
            const chatter = State.getChatter(user.login);
            if (giveaway.requirement.includes('Seguidor') && !chatter.follows) {
                Utils.showToast('Necesitas ser seguidor del canal', 'warning');
                return;
            }
            if (giveaway.requirement.includes('Suscriptor') && chatter.subs === 0) {
                Utils.showToast('Necesitas ser suscriptor', 'warning');
                return;
            }
            if (giveaway.requirement.includes('Nv.')) {
                const requiredLevel = parseInt(giveaway.requirement.match(/\d+/)[0]);
                if (chatter.level < requiredLevel) {
                    Utils.showToast(`Necesitas ser nivel ${requiredLevel}+`, 'warning');
                    return;
                }
            }
        }

        if (!giveaway.participants) giveaway.participants = [];
        if (giveaway.participants.includes(user.login)) {
            Utils.showToast('Ya estás participando', 'info');
            return;
        }

        giveaway.participants.push(user.login);
        State.set('giveaways', giveaways);
        Utils.showToast('¡Participando en el sorteo! 🎉', 'success');
        App.refreshCurrentPage();
    },

    draw(giveawayId) {
        if (!Auth.requireAdmin()) return;

        const giveaways = State.get('giveaways') || [];
        const giveaway = giveaways.find(g => g.id === giveawayId);

        if (!giveaway) return;

        const participants = giveaway.participants || [];
        if (participants.length === 0) {
            Utils.showToast('No hay participantes', 'warning');
            return;
        }

        const shuffled = Utils.shuffleArray(participants);
        giveaway.winner = shuffled[0];
        giveaway.active = false;
        giveaway.endTime = Date.now();

        State.set('giveaways', giveaways);
        Utils.showToast(`🎉 Ganador: ${giveaway.winner}!`, 'success', 5000);
        Utils.playNotificationSound();
        App.refreshCurrentPage();
    },

    remove(giveawayId) {
        if (!Auth.requireAdmin()) return;
        const giveaways = (State.get('giveaways') || []).filter(g => g.id !== giveawayId);
        State.set('giveaways', giveaways);
        Utils.showToast('Sorteo eliminado', 'info');
        App.refreshCurrentPage();
    },

    cleanExpired() {
        if (!Auth.requireAdmin()) return;
        const now = Date.now();
        const giveaways = (State.get('giveaways') || []).filter(g => g.active || (g.endTime && g.endTime > now - 86400000));
        State.set('giveaways', giveaways);
        Utils.showToast('Sorteos expirados limpiados', 'success');
        App.refreshCurrentPage();
    },

    updateTimers() {
        const giveaways = State.get('giveaways') || [];
        let changed = false;
        giveaways.forEach(g => {
            if (g.active && g.endTime && g.endTime <= Date.now()) {
                g.active = false;
                changed = true;
            }
        });
        if (changed) {
            State.set('giveaways', giveaways);
        }
    },
};
