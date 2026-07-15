const Goals = {
    render() {
        const goals = State.get('goals') || [];
        const isAdmin = State.get('isAdmin');

        return `
            <div class="page-header">
                <h1>🎯 Objetivos del Canal</h1>
                <p class="page-subtitle">Metas y objetivos de la comunidad</p>
            </div>

            ${isAdmin ? `
                <div class="card admin-panel">
                    <div class="card-header"><h3>⚙️ Crear Objetivo</h3></div>
                    <form id="goalForm" class="form-stack">
                        <div class="form-row">
                            <div class="form-group flex-2">
                                <label class="form-label">📝 Nombre</label>
                                <input type="text" id="goalName" class="form-input" placeholder="Ej: 1000 Seguidores" required>
                            </div>
                            <div class="form-group flex-1">
                                <label class="form-label">🎯 Meta</label>
                                <input type="number" id="goalTarget" class="form-input" placeholder="1000" min="1" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group flex-1">
                                <label class="form-label">📊 Tipo</label>
                                <select id="goalType" class="form-input">
                                    <option value="followers">Seguidores</option>
                                    <option value="subscribers">Suscriptores</option>
                                    <option value="bits">Bits</option>
                                    <option value="xp">XP Total</option>
                                    <option value="custom">Personalizado</option>
                                </select>
                            </div>
                            <div class="form-group flex-1">
                                <label class="form-label">🎨 Color</label>
                                <select id="goalColor" class="form-input">
                                    <option value="var(--primary)">Morado</option>
                                    <option value="var(--accent)">Rosa</option>
                                    <option value="var(--success)">Verde</option>
                                    <option value="var(--warning)">Naranja</option>
                                    <option value="var(--info)">Azul</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">🎯 Crear Objetivo</button>
                    </form>
                </div>
            ` : ''}

            <div class="goals-grid">
                ${goals.length === 0 ? '<div class="empty-state"><span class="empty-icon">🎯</span><p>No hay objetivos creados aún</p></div>' : ''}
                ${goals.map((g, i) => this._renderGoal(g, i)).join('')}
            </div>
        `;
    },

    _renderGoal(goal, index) {
        const pct = Math.min(goal.current / goal.target, 1);
        const remaining = Math.max(goal.target - goal.current, 0);

        return `
            <div class="card goal-card">
                <div class="goal-header">
                    <h3 class="goal-name">${Utils.escapeHtml(goal.name)}</h3>
                    ${State.get('isAdmin') ? `
                        <div class="goal-actions">
                            <button class="btn btn-sm btn-outline" onclick="Goals.adjustGoal(${index}, 10)">+10</button>
                            <button class="btn btn-sm btn-outline" onclick="Goals.adjustGoal(${index}, 100)">+100</button>
                            <button class="btn btn-sm btn-danger" onclick="Goals.remove(${index})">🗑️</button>
                        </div>
                    ` : ''}
                </div>
                <div class="goal-progress-section">
                    <div class="goal-numbers">
                        <span class="goal-current" style="color: ${goal.color || 'var(--primary)'}">${Utils.formatNumber(goal.current)}</span>
                        <span class="goal-separator">/</span>
                        <span class="goal-target">${Utils.formatNumber(goal.target)}</span>
                    </div>
                    <div class="progress-bar-container goal-bar">
                        ${Utils.createProgressBar(pct, goal.color || 'var(--primary)', '16px')}
                    </div>
                    <div class="goal-percentage">${Math.round(pct * 100)}% completado${remaining > 0 ? ` — Faltan ${Utils.formatNumber(remaining)}` : ' — 🎉 ¡Meta alcanzada!'}</div>
                </div>
                <div class="goal-type-badge">${this._getTypeIcon(goal.type)} ${this._getTypeName(goal.type)}</div>
            </div>
        `;
    },

    _getTypeIcon(type) {
        const icons = { followers: '❤️', subscribers: '⭐', bits: '💎', xp: '✨', custom: '📌' };
        return icons[type] || '📌';
    },

    _getTypeName(type) {
        const names = { followers: 'Seguidores', subscribers: 'Suscriptores', bits: 'Bits', xp: 'XP Total', custom: 'Personalizado' };
        return names[type] || 'Personalizado';
    },

    create(name, target, type, color) {
        if (!Auth.requireAdmin()) return;
        const goals = State.get('goals') || [];
        goals.push({
            id: Utils.generateId(),
            name,
            target: parseInt(target),
            current: 0,
            type,
            color,
            createdAt: Date.now(),
        });
        State.set('goals', goals);
        Utils.showToast('Objetivo creado!', 'success');
        App.refreshCurrentPage();
    },

    adjustGoal(index, amount) {
        if (!Auth.requireAdmin()) return;
        const goals = State.get('goals') || [];
        if (goals[index]) {
            goals[index].current = Math.max(0, goals[index].current + amount);
            State.set('goals', goals);
            if (goals[index].current >= goals[index].target) {
                Utils.showToast(`🎉 ¡Objetivo "${goals[index].name}" alcanzado!`, 'success', 5000);
                Utils.playNotificationSound();
            }
            App.refreshCurrentPage();
        }
    },

    remove(index) {
        if (!Auth.requireAdmin()) return;
        if (!confirm('¿Eliminar este objetivo?')) return;
        const goals = State.get('goals') || [];
        goals.splice(index, 1);
        State.set('goals', goals);
        Utils.showToast('Objetivo eliminado', 'info');
        App.refreshCurrentPage();
    },

    increment(type, amount = 1) {
        const goals = (State.get('goals') || []).filter(g => g.type === type);
        let changed = false;
        goals.forEach(g => {
            g.current += amount;
            changed = true;
            if (g.current >= g.target) {
                Utils.showToast(`🎉 ¡Objetivo "${g.name}" alcanzado!`, 'success', 5000);
                Utils.playNotificationSound();
            }
        });
        if (changed) State.set('goals', goals);
    },
};
