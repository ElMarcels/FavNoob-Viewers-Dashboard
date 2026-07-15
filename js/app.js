const App = {
    currentPage: 'dashboard',
    timerInterval: null,
    countdownInterval: null,

    init() {
        State.init();
        Auth.init();
        this.bindEvents();
        this.navigateTo('dashboard');
        this.startTimers();
        this._updateStreamStatus();

        document.getElementById('modalClose').onclick = () => Utils.hideModal();
        document.getElementById('modalOverlay').onclick = (e) => {
            if (e.target === e.currentTarget) Utils.hideModal();
        };
    },

    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) this.navigateTo(page);
            });
        });

        document.getElementById('menuToggle').onclick = () => {
            document.getElementById('sidebar').classList.toggle('open');
        };

        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                document.getElementById('sidebar').classList.remove('open');
            });
        });
    },

    navigateTo(page) {
        this.currentPage = page;

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        const titles = {
            dashboard: 'Dashboard',
            chatters: 'Top Chatters',
            battlepass: 'Pase de Batalla',
            giveaways: 'Sorteos',
            chat: 'Chat en Vivo',
            goals: 'Objetivos del Canal',
            settings: 'Configuración',
        };

        document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';

        this.renderPage(page);
        document.getElementById('pageContent').scrollTop = 0;
    },

    renderPage(page) {
        const content = document.getElementById('pageContent');

        switch (page) {
            case 'dashboard':
                content.innerHTML = this.renderDashboard();
                break;
            case 'chatters':
                content.innerHTML = Chatters.render();
                break;
            case 'battlepass':
                content.innerHTML = BattlePass.render();
                break;
            case 'giveaways':
                content.innerHTML = Giveaways.render();
                break;
            case 'chat':
                content.innerHTML = Chat.render();
                Chat.init();
                break;
            case 'goals':
                content.innerHTML = Goals.render();
                this._initGoalForm();
                break;
            case 'settings':
                content.innerHTML = this.renderSettings();
                break;
            default:
                content.innerHTML = this.renderDashboard();
        }
    },

    renderDashboard() {
        const user = State.get('user');
        const chatters = Object.values(State.get('chatters'));
        const totalXP = chatters.reduce((s, c) => s + c.xp, 0);
        const totalMessages = chatters.reduce((s, c) => s + c.messages, 0);
        const topChatter = chatters.sort((a, b) => b.xp - a.xp)[0];
        const activeGiveaways = (State.get('giveaways') || []).filter(g => g.active);
        const goals = State.get('goals') || [];

        return `
            <div class="dashboard-welcome">
                <h1>¡Hola, ${user ? user.display_name : 'Viewer'}! 👋</h1>
                <p>Bienvenido al dashboard de <strong>FavNooob</strong></p>
            </div>

            <div class="stats-grid">
                <div class="stat-card primary">
                    <div class="stat-icon">👥</div>
                    <div class="stat-info">
                        <div class="stat-value">${chatters.length}</div>
                        <div class="stat-label">Chatters</div>
                    </div>
                </div>
                <div class="stat-card accent">
                    <div class="stat-icon">💬</div>
                    <div class="stat-info">
                        <div class="stat-value">${Utils.formatNumber(totalMessages)}</div>
                        <div class="stat-label">Mensajes</div>
                    </div>
                </div>
                <div class="stat-card success">
                    <div class="stat-icon">✨</div>
                    <div class="stat-info">
                        <div class="stat-value">${Utils.formatNumber(totalXP)}</div>
                        <div class="stat-label">XP Total</div>
                    </div>
                </div>
                <div class="stat-card warning">
                    <div class="stat-icon">🏆</div>
                    <div class="stat-info">
                        <div class="stat-value">${topChatter ? Utils.escapeHtml(topChatter.displayName) : '—'}</div>
                        <div class="stat-label">Top Chatter</div>
                    </div>
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header"><h3>🏆 Top 5 Chatters</h3></div>
                    <div class="dash-top-list">
                        ${chatters.slice(0, 5).map((c, i) => `
                            <div class="dash-top-item">
                                <span class="dash-rank">${Utils.getMedal(i)}</span>
                                <span class="dash-name" style="color:${Utils.getLevelColor(c.level)}">${Utils.escapeHtml(c.displayName)}</span>
                                <span class="dash-xp">${Utils.formatNumber(c.xp)} XP</span>
                            </div>
                        `).join('') || '<div class="empty-state-small">Sin datos aún</div>'}
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><h3>🎯 Objetivos</h3></div>
                    <div class="dash-goals">
                        ${goals.slice(0, 3).map(g => `
                            <div class="dash-goal-item">
                                <span class="dash-goal-name">${Utils.escapeHtml(g.name)}</span>
                                <div class="progress-bar-container">${Utils.createProgressBar(g.current / g.target, g.color || 'var(--primary)', '8px')}</div>
                                <span class="dash-goal-text">${Utils.formatNumber(g.current)}/${Utils.formatNumber(g.target)}</span>
                            </div>
                        `).join('') || '<div class="empty-state-small">Sin objetivos</div>'}
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><h3>🔔 Actividad Reciente</h3></div>
                    <div class="dash-activity">
                        ${Alerts.events.slice(0, 8).map(e => {
                            const icons = { message: '💬', sub: '⭐', gift: '🎁', bits: '💎', follow: '❤️', level_up: '🎉' };
                            return `<div class="dash-activity-item"><span>${icons[e.type] || 'ℹ️'}</span><span class="dash-activity-text">${Utils.escapeHtml(e.text)}</span></div>`;
                        }).join('') || '<div class="empty-state-small">Sin actividad reciente</div>'}
                    </div>
                </div>
            </div>

            <div class="dashboard-grid">
                ${activeGiveaways.length > 0 ? `
                    <div class="card">
                        <div class="card-header"><h3>🎁 Sorteos Activos</h3></div>
                        ${activeGiveaways.map(g => `
                            <div class="dash-mini-item">
                                <span>🎁</span><span>${Utils.escapeHtml(g.prize)}</span>
                                <span class="dash-mini-count">${(g.participants || []).length} participantes</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    },

    renderSettings() {
        const settings = State.get('settings');
        const isAdmin = State.get('isAdmin');

        return `
            <div class="page-header">
                <h1>⚙️ Configuración</h1>
                <p class="page-subtitle">Personaliza tu experiencia</p>
            </div>

            <div class="settings-grid">
                <div class="card">
                    <div class="card-header"><h3>🎨 Preferencias</h3></div>
                    <div class="settings-list">
                        <div class="setting-item">
                            <div class="setting-info">
                                <span class="setting-label">🔊 Sonidos</span>
                                <span class="setting-desc">Sonidos de notificación</span>
                            </div>
                            <label class="toggle">
                                <input type="checkbox" ${settings.sounds ? 'checked' : ''} onchange="App.toggleSetting('sounds', this.checked)">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <span class="setting-label">🔔 Notificaciones</span>
                                <span class="setting-desc">Mostrar notificaciones toast</span>
                            </div>
                            <label class="toggle">
                                <input type="checkbox" ${settings.notifications ? 'checked' : ''} onchange="App.toggleSetting('notifications', this.checked)">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><h3>💾 Datos</h3></div>
                    <div class="settings-list">
                        <div class="setting-item">
                            <div class="setting-info">
                                <span class="setting-label">📥 Exportar Datos</span>
                                <span class="setting-desc">Descarga todos los datos del dashboard</span>
                            </div>
                            <button class="btn btn-sm btn-outline" onclick="App.exportAll()">📥 Exportar</button>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <span class="setting-label">📤 Importar Datos</span>
                                <span class="setting-desc">Restaura datos desde un archivo JSON</span>
                            </div>
                            <button class="btn btn-sm btn-outline" onclick="App.importAll()">📤 Importar</button>
                        </div>
                        ${isAdmin ? `
                            <div class="setting-item">
                                <div class="setting-info">
                                    <span class="setting-label">🔄 Reset Completo</span>
                                    <span class="setting-desc">Borra todos los datos ( irreversible)</span>
                                </div>
                                <button class="btn btn-sm btn-danger" onclick="App.fullReset()">🗑️ Reset</button>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><h3>ℹ️ Acerca de</h3></div>
                    <div class="about-info">
                        <p><strong>FavNooob Dashboard</strong> v1.0</p>
                        <p>Dashboard exclusivo para el canal <a href="https://twitch.tv/favnooob" target="_blank">twitch.tv/favnooob</a></p>
                        <p class="text-muted">Creado con 💜 para la comunidad de FavNooob</p>
                    </div>
                </div>
            </div>
        `;
    },

    toggleSetting(key, value) {
        const settings = State.get('settings');
        settings[key] = value;
        State.set('settings', settings);
    },

    exportAll() {
        const data = State.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `favnooob_dashboard_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Utils.showToast('Datos exportados', 'success');
    },

    importAll() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (State.importData(ev.target.result)) {
                    Utils.showToast('Datos importados correctamente', 'success');
                    this.refreshCurrentPage();
                } else {
                    Utils.showToast('Error al importar datos', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },

    fullReset() {
        if (!State.get('isAdmin')) {
            Utils.showToast('Solo el admin puede hacer reset', 'error');
            return;
        }
        if (confirm('¿Estás seguro? Esto borrará TODOS los datos permanentemente.')) {
            if (confirm('ÚLTIMA OPORTUNIDAD: ¿Borrar todo?')) {
                State.resetData();
            }
        }
    },

    _initGoalForm() {
        const form = document.getElementById('goalForm');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                Goals.create(
                    document.getElementById('goalName').value,
                    document.getElementById('goalTarget').value,
                    document.getElementById('goalType').value,
                    document.getElementById('goalColor').value
                );
            };
        }
    },

    refreshCurrentPage() {
        this.renderPage(this.currentPage);
    },

    startTimers() {
        this.timerInterval = setInterval(() => {
            Giveaways.updateTimers();
        }, 10000);

        setInterval(() => {
            this._updateStreamStatus();
        }, 300000);
    },

    _updateStreamStatus() {
        const el = document.getElementById('streamStatus');
        if (!el) return;

        const nextStreams = State.getStreamDaysLeft();
        if (nextStreams.length > 0 && nextStreams[0].minutesUntil <= 0 && nextStreams[0].minutesUntil > -300) {
            el.innerHTML = '<span class="status-dot online"></span><span class="status-text">En Vivo</span>';
        } else {
            el.innerHTML = '<span class="status-dot offline"></span><span class="status-text">Offline</span>';
        }
    },
};

document.addEventListener('DOMContentLoaded', () => App.init());
