const State = {
    _data: {
        user: null,
        isAdmin: false,
        accessToken: null,
        chatters: {},
        battlePass: {},
        giveaways: [],
        polls: [],
        goals: [],
        schedule: [],
        streamTimer: { running: false, startTime: null, totalSeconds: 0 },
        settings: { theme: 'dark', notifications: true, sounds: true },
    },

    _listeners: [],

    init() {
        const saved = localStorage.getItem('favnooob_dashboard');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this._data = { ...this._data, ...parsed };
            } catch (e) {
                console.warn('Error loading state:', e);
            }
        }
        if (!this._data.schedule.length) {
            this._data.schedule = [...CONFIG.DEFAULT_SCHEDULE];
        }
    },

    save() {
        localStorage.setItem('favnooob_dashboard', JSON.stringify(this._data));
        this._notify();
    },

    get(key) {
        return this._data[key];
    },

    set(key, value) {
        this._data[key] = value;
        this.save();
    },

    subscribe(fn) {
        this._listeners.push(fn);
        return () => {
            this._listeners = this._listeners.filter(l => l !== fn);
        };
    },

    _notify() {
        this._listeners.forEach(fn => fn(this._data));
    },

    getChatter(username) {
        const key = username.toLowerCase();
        if (!this._data.chatters[key]) {
            this._data.chatters[key] = {
                username: username,
                displayName: username,
                xp: 0,
                level: 1,
                title: 'Novato',
                messages: 0,
                watchTime: 0,
                bits: 0,
                subs: 0,
                gifts: 0,
                follows: false,
                firstSeen: Date.now(),
                lastSeen: Date.now(),
                missions: {},
                dailyMissions: [],
                dailyMissionsDate: null,
            };
        }
        return this._data.chatters[key];
    },

    addXP(username, amount, reason) {
        const chatter = this.getChatter(username);
        chatter.xp += amount;
        chatter.lastSeen = Date.now();

        let newLevel = 1;
        for (const lvl of CONFIG.LEVELS) {
            if (chatter.xp >= lvl.xp) {
                newLevel = lvl.level;
            }
        }

        const leveledUp = newLevel > chatter.level;
        chatter.level = newLevel;
        const levelInfo = CONFIG.LEVELS.find(l => l.level === newLevel);
        chatter.title = levelInfo ? levelInfo.title : 'Novato';

        this._updateMissionProgress(username, 'xp', amount);
        this.save();

        return { leveledUp, newLevel, title: chatter.title };
    },

    _updateMissionProgress(username, type, amount) {
        const chatter = this.getChatter(username);
        const today = new Date().toDateString();

        if (chatter.dailyMissionsDate !== today) {
            chatter.dailyMissions = this._generateDailyMissions();
            chatter.dailyMissionsDate = today;
        }

        const allMissions = [...CONFIG.MISIONES, ...chatter.dailyMissions];
        allMissions.forEach(mission => {
            if (mission.type === type) {
                if (!chatter.missions[mission.id]) {
                    chatter.missions[mission.id] = { progress: 0, completed: false };
                }
                const m = chatter.missions[mission.id];
                if (!m.completed) {
                    m.progress = Math.min(m.progress + amount, mission.target);
                    if (m.progress >= mission.target) {
                        m.completed = true;
                        this.addXP(username, mission.xp, `Misión: ${mission.name}`);
                    }
                }
            }
        });
    },

    _generateDailyMissions() {
        const pool = [...CONFIG.MISIONES];
        const selected = [];
        for (let i = 0; i < 3 && pool.length > 0; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            const mission = { ...pool.splice(idx, 1)[0] };
            mission.id = 'daily_' + Date.now() + '_' + i;
            mission.daily = true;
            mission.target = Math.ceil(mission.target * 0.5);
            mission.xp = Math.ceil(mission.xp * 0.7);
            selected.push(mission);
        }
        return selected;
    },

    getTopChatters(limit = 20) {
        return Object.values(this._data.chatters)
            .sort((a, b) => b.xp - a.xp)
            .slice(0, limit);
    },

    getBattlePassTier(username) {
        const chatter = this.getChatter(username);
        return Math.floor(chatter.xp / CONFIG.BATTLE_PASS.XP_PER_TIER);
    },

    getBattlePassProgress(username) {
        const chatter = this.getChatter(username);
        const currentTierXP = chatter.xp % CONFIG.BATTLE_PASS.XP_PER_TIER;
        return {
            tier: Math.min(Math.floor(chatter.xp / CONFIG.BATTLE_PASS.XP_PER_TIER), CONFIG.BATTLE_PASS.TOTAL_TIERS),
            progress: currentTierXP / CONFIG.BATTLE_PASS.XP_PER_TIER,
            totalXP: chatter.xp,
        };
    },

    getStreamDaysLeft() {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const currentMinutes = hour * 60 + minute;

        return this._data.schedule
            .filter(s => s.active)
            .map(s => {
                const [sh, sm] = s.time.split(':').map(Number);
                const streamMinutes = sh * 60 + sm;
                const diff = streamMinutes - currentMinutes;
                return { ...s, minutesUntil: diff > 0 ? diff : diff + 1440 };
            })
            .sort((a, b) => a.minutesUntil - b.minutesUntil);
    },

    resetDailyMissions(username) {
        const chatter = this.getChatter(username);
        chatter.dailyMissions = this._generateDailyMissions();
        chatter.dailyMissionsDate = new Date().toDateString();
        this.save();
    },

    exportData() {
        return JSON.stringify(this._data, null, 2);
    },

    importData(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            this._data = { ...this._data, ...data };
            this.save();
            return true;
        } catch (e) {
            return false;
        }
    },

    resetData() {
        localStorage.removeItem('favnooob_dashboard');
        location.reload();
    },
};
