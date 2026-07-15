const Calendar = {
    render() {
        const schedule = State.get('schedule') || CONFIG.DEFAULT_SCHEDULE;
        const now = new Date();
        const weekDates = Utils.getWeekDates();
        const isAdmin = State.get('isAdmin');
        const nextStreams = State.getStreamDaysLeft();

        return `
            <div class="page-header">
                <h1>📅 Calendario de Streams</h1>
                <p class="page-subtitle">Horario semanal de ${CONFIG.CHANNEL}</p>
            </div>

            ${nextStreams.length > 0 ? `
                <div class="next-stream-banner">
                    <div class="next-stream-info">
                        <span class="next-stream-label">Próximo stream</span>
                        <span class="next-stream-title">${nextStreams[0].title}</span>
                        <span class="next-stream-time">${DAYS_ES[nextStreams[0].day]} a las ${nextStreams[0].time}</span>
                    </div>
                    <div class="next-stream-countdown" id="nextStreamCountdown">
                        ${this._formatCountdown(nextStreams[0].minutesUntil)}
                    </div>
                </div>
            ` : ''}

            <div class="calendar-grid">
                ${weekDates.map((date, i) => {
                    const daySchedule = schedule.filter(s => s.day === date.getDay());
                    const isToday = date.toDateString() === now.toDateString();
                    return `
                        <div class="calendar-day ${isToday ? 'today' : ''} ${daySchedule.length > 0 ? 'has-stream' : ''}">
                            <div class="calendar-day-header">
                                <span class="day-name">${DAYS_SHORT[date.getDay()]}</span>
                                <span class="day-date">${date.getDate()}</span>
                            </div>
                            <div class="calendar-day-content">
                                ${daySchedule.length > 0 ? daySchedule.map(s => `
                                    <div class="stream-event ${s.active ? '' : 'inactive'}">
                                        <span class="stream-time">🕐 ${s.time}</span>
                                        <span class="stream-title">${Utils.escapeHtml(s.title)}</span>
                                        ${isAdmin ? `<button class="btn-icon-sm" onclick="Calendar.toggleStream(${s.day}, '${s.time}')" title="${s.active ? 'Desactivar' : 'Activar'}">${s.active ? '🟢' : '🔴'}</button>` : ''}
                                    </div>
                                `).join('') : '<div class="no-stream">Sin stream</div>'}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>📋 Horario Semanal</h3>
                    ${isAdmin ? `<button class="btn btn-sm btn-primary" onclick="Calendar.showAddForm()">➕ Agregar Stream</button>` : ''}
                </div>
                <div class="schedule-list">
                    ${schedule.map((s, i) => `
                        <div class="schedule-item ${s.active ? '' : 'inactive'}">
                            <div class="schedule-day">${DAYS_ES[s.day]}</div>
                            <div class="schedule-time">🕐 ${s.time}</div>
                            <div class="schedule-title">${Utils.escapeHtml(s.title)}</div>
                            <div class="schedule-status">${s.active ? '🟢 Activo' : '🔴 Inactivo'}</div>
                            ${isAdmin ? `
                                <div class="schedule-actions">
                                    <button class="btn btn-sm btn-outline" onclick="Calendar.editStream(${i})">✏️</button>
                                    <button class="btn btn-sm btn-danger" onclick="Calendar.removeStream(${i})">🗑️</button>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="card">
                <div class="card-header"><h3>📊 Calendario del Mes</h3></div>
                <div class="month-calendar">
                    ${this._renderMonthCalendar(now, schedule)}
                </div>
            </div>
        `;
    },

    _renderMonthCalendar(now, schedule) {
        const year = now.getFullYear();
        const month = now.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = now.getDate();

        let html = `
            <div class="month-header">${MONTHS_ES[month]} ${year}</div>
            <div class="month-grid">
                ${DAYS_SHORT.map(d => `<div class="month-day-name">${d}</div>`).join('')}
        `;

        for (let i = 0; i < firstDay; i++) {
            html += '<div class="month-cell empty"></div>';
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const dayOfWeek = date.getDay();
            const hasStream = schedule.some(s => s.day === dayOfWeek && s.active);
            const isToday = d === today;

            html += `
                <div class="month-cell ${isToday ? 'today' : ''} ${hasStream ? 'has-stream' : ''}">
                    <span>${d}</span>
                    ${hasStream ? '<span class="month-dot"></span>' : ''}
                </div>
            `;
        }

        html += '</div>';
        return html;
    },

    _formatCountdown(minutesUntil) {
        if (minutesUntil < 60) return `En ${minutesUntil} minutos`;
        const h = Math.floor(minutesUntil / 60);
        const m = minutesUntil % 60;
        return m > 0 ? `En ${h}h ${m}m` : `En ${h}h`;
    },

    showAddForm() {
        if (!Auth.requireAdmin()) return;

        Utils.showModal('Agregar Stream', `
            <form id="streamForm" class="form-stack">
                <div class="form-group">
                    <label class="form-label">📅 Día</label>
                    <select id="sDay" class="form-input">
                        ${DAYS_ES.map((d, i) => `<option value="${i}">${d}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">🕐 Hora</label>
                    <input type="time" id="sTime" class="form-input" value="20:00">
                </div>
                <div class="form-group">
                    <label class="form-label">📝 Título</label>
                    <input type="text" id="sTitle" class="form-input" placeholder="Nombre del stream" required>
                </div>
                <button type="submit" class="btn btn-primary btn-block">➕ Agregar</button>
            </form>
        `);

        document.getElementById('streamForm').onsubmit = (e) => {
            e.preventDefault();
            this.addStream({
                day: parseInt(document.getElementById('sDay').value),
                time: document.getElementById('sTime').value,
                title: document.getElementById('sTitle').value,
            });
        };
    },

    addStream(data) {
        const schedule = State.get('schedule') || [];
        schedule.push({ ...data, active: true });
        schedule.sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
        State.set('schedule', schedule);
        Utils.hideModal();
        Utils.showToast('Stream agregado', 'success');
        App.refreshCurrentPage();
    },

    editStream(index) {
        if (!Auth.requireAdmin()) return;
        const schedule = State.get('schedule') || [];
        const stream = schedule[index];
        if (!stream) return;

        Utils.showModal('Editar Stream', `
            <form id="editStreamForm" class="form-stack">
                <div class="form-group">
                    <label class="form-label">📅 Día</label>
                    <select id="eDay" class="form-input">
                        ${DAYS_ES.map((d, i) => `<option value="${i}" ${i === stream.day ? 'selected' : ''}>${d}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">🕐 Hora</label>
                    <input type="time" id="eTime" class="form-input" value="${stream.time}">
                </div>
                <div class="form-group">
                    <label class="form-label">📝 Título</label>
                    <input type="text" id="eTitle" class="form-input" value="${Utils.escapeHtml(stream.title)}" required>
                </div>
                <button type="submit" class="btn btn-primary btn-block">💾 Guardar</button>
            </form>
        `);

        document.getElementById('editStreamForm').onsubmit = (e) => {
            e.preventDefault();
            schedule[index] = {
                ...stream,
                day: parseInt(document.getElementById('eDay').value),
                time: document.getElementById('eTime').value,
                title: document.getElementById('eTitle').value,
            };
            schedule.sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
            State.set('schedule', schedule);
            Utils.hideModal();
            Utils.showToast('Stream actualizado', 'success');
            App.refreshCurrentPage();
        };
    },

    toggleStream(day, time) {
        if (!Auth.requireAdmin()) return;
        const schedule = State.get('schedule') || [];
        const stream = schedule.find(s => s.day === day && s.time === time);
        if (stream) {
            stream.active = !stream.active;
            State.set('schedule', schedule);
            App.refreshCurrentPage();
        }
    },

    removeStream(index) {
        if (!Auth.requireAdmin()) return;
        if (!confirm('¿Eliminar este stream del horario?')) return;
        const schedule = State.get('schedule') || [];
        schedule.splice(index, 1);
        State.set('schedule', schedule);
        Utils.showToast('Stream eliminado', 'info');
        App.refreshCurrentPage();
    },
};
