const Polls = {
    render() {
        const polls = State.get('polls') || [];
        const activePolls = polls.filter(p => p.active);
        const closedPolls = polls.filter(p => !p.active).slice(0, 10);

        return `
            <div class="page-header">
                <h1>🗳️ Encuestas</h1>
                <p class="page-subtitle">Crea y participa en encuestas</p>
            </div>

            ${State.get('isAdmin') ? `
                <div class="card admin-panel">
                    <div class="card-header"><h3>⚙️ Crear Encuesta</h3></div>
                    <form id="pollForm" class="form-stack">
                        <div class="form-group">
                            <label class="form-label">📝 Pregunta</label>
                            <input type="text" id="pollQuestion" class="form-input" placeholder="¿Qué pregunta quieres hacer?" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">📋 Opciones (una por línea, mínimo 2)</label>
                            <textarea id="pollOptions" class="form-input" rows="4" placeholder="Opción 1&#10;Opción 2&#10;Opción 3" required></textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">⏱️ Duración (minutos, 0 = infinito)</label>
                                <input type="number" id="pollDuration" class="form-input" value="5" min="0" max="1440">
                            </div>
                            <div class="form-group">
                                <label class="form-label">🔒 Multi-voto</label>
                                <select id="pollMultiVote" class="form-input">
                                    <option value="false">No (1 voto por persona)</option>
                                    <option value="true">Sí (múltiples votos)</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block">🗳️ Crear Encuesta</button>
                    </form>
                </div>
            ` : ''}

            <div class="polls-section">
                ${activePolls.length === 0 && closedPolls.length === 0 ? '<div class="empty-state"><span class="empty-icon">🗳️</span><p>No hay encuestas aún</p></div>' : ''}

                ${activePolls.map(p => this._renderPoll(p)).join('')}
                ${closedPolls.length > 0 ? `
                    <h3 class="section-title">📜 Encuestas Anteriores</h3>
                    ${closedPolls.map(p => this._renderPoll(p)).join('')}
                ` : ''}
            </div>
        `;
    },

    _renderPoll(poll) {
        const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
        const isActive = poll.active;
        const user = State.get('user');
        const userVoted = user && poll.voted && poll.voted.includes(user.login);
        const maxVotes = Math.max(...poll.options.map(o => o.votes), 1);

        return `
            <div class="card poll-card ${isActive ? 'active' : 'closed'}">
                <div class="poll-header">
                    <h3 class="poll-question">🗳️ ${Utils.escapeHtml(poll.question)}</h3>
                    <span class="poll-status ${isActive ? 'live' : 'ended'}">${isActive ? '🟢 Activa' : '🔴 Cerrada'}</span>
                </div>
                <div class="poll-options">
                    ${poll.options.map((opt, i) => {
                        const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                        const barWidth = totalVotes > 0 ? Math.round((opt.votes / maxVotes) * 100) : 0;
                        const isLeading = opt.votes === maxVotes && opt.votes > 0;

                        return `
                            <div class="poll-option ${isLeading ? 'leading' : ''} ${userVoted ? 'voted' : ''}">
                                <div class="poll-option-bar" style="width: ${barWidth}%"></div>
                                <div class="poll-option-content">
                                    <span class="poll-option-text">${Utils.escapeHtml(opt.text)}</span>
                                    <span class="poll-option-stats">${opt.votes} votos (${pct}%)</span>
                                </div>
                                ${isActive && !userVoted && user ? `<button class="btn btn-sm btn-outline" onclick="Polls.vote('${poll.id}', ${i})">Votar</button>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="poll-footer">
                    <span>👥 ${totalVotes} votos totales</span>
                    ${State.get('isAdmin') && isActive ? `<button class="btn btn-sm btn-danger" onclick="Polls.close('${poll.id}')">🔒 Cerrar Encuesta</button>` : ''}
                    ${State.get('isAdmin' ) ? `<button class="btn btn-sm btn-outline" onclick="Polls.remove('${poll.id}')">🗑️</button>` : ''}
                </div>
            </div>
        `;
    },

    create(question, optionsText, duration, multiVote) {
        if (!Auth.requireAdmin()) return;

        const options = optionsText.split('\n').filter(o => o.trim()).map(text => ({
            text: text.trim(),
            votes: 0,
        }));

        if (options.length < 2) {
            Utils.showToast('Necesitas al menos 2 opciones', 'warning');
            return;
        }

        const poll = {
            id: Utils.generateId(),
            question,
            options,
            active: true,
            multiVote,
            voted: [],
            createdAt: Date.now(),
            endTime: duration > 0 ? Date.now() + duration * 60000 : null,
        };

        const polls = State.get('polls') || [];
        polls.unshift(poll);
        State.set('polls', polls);
        Utils.showToast('Encuesta creada!', 'success');
        App.refreshCurrentPage();
    },

    vote(pollId, optionIndex) {
        if (!Auth.requireAuth()) return;

        const user = State.get('user');
        const polls = State.get('polls') || [];
        const poll = polls.find(p => p.id === pollId);

        if (!poll || !poll.active) {
            Utils.showToast('Esta encuesta ya no está activa', 'warning');
            return;
        }

        if (!poll.voted) poll.voted = [];
        if (!poll.multiVote && poll.voted.includes(user.login)) {
            Utils.showToast('Ya votaste en esta encuesta', 'info');
            return;
        }

        poll.options[optionIndex].votes++;
        if (!poll.multiVote) poll.voted.push(user.login);

        State.set('polls', polls);
        Utils.showToast('Voto registrado!', 'success');
        App.refreshCurrentPage();
    },

    close(pollId) {
        if (!Auth.requireAdmin()) return;
        const polls = State.get('polls') || [];
        const poll = polls.find(p => p.id === pollId);
        if (poll) {
            poll.active = false;
            State.set('polls', polls);
            Utils.showToast('Encuesta cerrada', 'info');
            App.refreshCurrentPage();
        }
    },

    remove(pollId) {
        if (!Auth.requireAdmin()) return;
        const polls = (State.get('polls') || []).filter(p => p.id !== pollId);
        State.set('polls', polls);
        Utils.showToast('Encuesta eliminada', 'info');
        App.refreshCurrentPage();
    },

    updateTimers() {
        const polls = State.get('polls') || [];
        const now = Date.now();
        let changed = false;
        polls.forEach(p => {
            if (p.active && p.endTime && p.endTime <= now) {
                p.active = false;
                changed = true;
            }
        });
        if (changed) State.set('polls', polls);
    },
};
