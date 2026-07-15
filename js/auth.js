const Auth = {
    TOKEN_KEY: 'twitch_access_token',
    USER_KEY: 'twitch_user',

    init() {
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const token = params.get('access_token');
            if (token) {
                localStorage.setItem(this.TOKEN_KEY, token);
                window.history.replaceState(null, '', window.location.pathname);
                this.fetchUser(token);
                return;
            }
        }

        const savedToken = localStorage.getItem(this.TOKEN_KEY);
        const savedUser = localStorage.getItem(this.USER_KEY);
        if (savedToken && savedUser) {
            State.set('accessToken', savedToken);
            State.set('user', JSON.parse(savedUser));
            State.set('isAdmin', JSON.parse(savedUser).login === CONFIG.CHANNEL);
        }
        this.updateUI();
    },

    login() {
        if (!CONFIG.CLIENT_ID) {
            Utils.showToast('Configura el CLIENT_ID en config.js para usar Twitch OAuth', 'warning', 5000);
            Utils.showModal('Configurar Twitch App', `
                <div class="auth-setup">
                    <p>Para habilitar el login con Twitch, necesitas crear una aplicación en <a href="https://dev.twitch.tv/console/apps" target="_blank">Twitch Developer Console</a>.</p>
                    <ol>
                        <li>Crea una nueva aplicación</li>
                        <li>Copia el <strong>Client ID</strong></li>
                        <li>Agrega tu dominio como <strong>OAuth Redirect URL</strong></li>
                        <li>Pega el Client ID en <code>js/config.js</code></li>
                    </ol>
                    <div class="form-group">
                        <label>O ingresa tu Client ID aquí (temporal):</label>
                        <input type="text" id="tempClientId" class="form-input" placeholder="tu_client_id_aqui">
                        <button class="btn btn-primary" onclick="Auth.setTempClientId()" style="margin-top:8px">Guardar y Conectar</button>
                    </div>
                </div>
            `);
            return;
        }

        const scopes = ['chat:read', 'chat:edit', 'channel:read:subscriptions', 'channel:read:redemptions', 'user:read:follows'];
        const url = `https://id.twitch.tv/oauth2/authorize?client_id=${CONFIG.CLIENT_ID}&redirect_uri=${encodeURIComponent(CONFIG.REDIRECT_URI)}&response_type=token&scope=${scopes.join('+')}`;
        window.location.href = url;
    },

    setTempClientId() {
        const input = document.getElementById('tempClientId');
        if (input && input.value.trim()) {
            CONFIG.CLIENT_ID = input.value.trim();
            Utils.hideModal();
            this.login();
        }
    },

    async fetchUser(token) {
        try {
            const res = await fetch('https://api.twitch.tv/helix/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Client-Id': CONFIG.CLIENT_ID,
                }
            });
            if (!res.ok) throw new Error('API error');
            const data = await res.json();
            if (data.data && data.data[0]) {
                const user = data.data[0];
                const userData = {
                    id: user.id,
                    login: user.login,
                    display_name: user.display_name,
                    profile_image_url: user.profile_image_url,
                    description: user.description,
                };
                localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
                State.set('accessToken', token);
                State.set('user', userData);
                State.set('isAdmin', user.login === CONFIG.CHANNEL);
                CONFIG.CHANNEL_ID = user.id;
                Utils.showToast(`Bienvenido, ${user.display_name}!`, 'success');
                this.updateUI();
                App.refreshCurrentPage();
            }
        } catch (e) {
            console.error('Error fetching user:', e);
            Utils.showToast('Error al obtener datos de Twitch', 'error');
        }
    },

    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        State.set('user', null);
        State.set('accessToken', null);
        State.set('isAdmin', false);
        this.updateUI();
        App.refreshCurrentPage();
        Utils.showToast('Sesión cerrada', 'info');
    },

    updateUI() {
        const user = State.get('user');
        const loginBtn = document.getElementById('loginBtn');
        const adminBadge = document.getElementById('adminBadge');

        if (user) {
            loginBtn.innerHTML = `
                <img src="${user.profile_image_url}" alt="" class="avatar-mini">
                <span>${user.display_name}</span>
                <button class="btn-icon" onclick="Auth.logout()" title="Cerrar sesión">⏻</button>
            `;
            loginBtn.classList.add('logged-in');
            loginBtn.onclick = null;

            if (State.get('isAdmin')) {
                adminBadge.classList.add('active');
                adminBadge.querySelector('.badge-text').textContent = 'FavNooob Admin';
            } else {
                adminBadge.classList.remove('active');
                adminBadge.querySelector('.badge-text').textContent = 'Viewer';
            }
        } else {
            loginBtn.innerHTML = '🔑 Identificarse con Twitch';
            loginBtn.classList.remove('logged-in');
            loginBtn.onclick = () => Auth.login();
            adminBadge.classList.remove('active');
            adminBadge.querySelector('.badge-text').textContent = 'No identificado';
        }
    },

    requireAuth() {
        if (!State.get('user')) {
            Utils.showToast('Debes iniciar sesión con Twitch', 'warning');
            return false;
        }
        return true;
    },

    requireAdmin() {
        if (!State.get('isAdmin')) {
            Utils.showToast('Solo FavNooob puede realizar esta acción', 'error');
            return false;
        }
        return true;
    },
};
