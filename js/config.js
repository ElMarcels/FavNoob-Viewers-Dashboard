const CONFIG = {
    CHANNEL: 'favnooob',
    CHANNEL_ID: '',
    ADMIN_USERS: ['favnooob', 'elmarcels_'],
    CLIENT_ID: '8n2q42elv8wzd9ogx9o4ebkgbf2dae',
    REDIRECT_URI: window.location.origin + window.location.pathname,
    TMI_USERNAME: 'justinfan' + Math.floor(Math.random() * 99999),
    
    XP: {
        MESSAGE: 5,
        MINUTE_WATCHED: 1,
        CHEER_BASE: 10,
        SUB_BASE: 100,
        GIFT_BASE: 50,
        FOLLOW: 200,
    },

    LEVELS: [
        { level: 1, xp: 0, title: 'Novato' },
        { level: 2, xp: 500, title: 'Aprendiz' },
        { level: 3, xp: 1500, title: 'Habitual' },
        { level: 4, xp: 3500, title: 'Veterano' },
        { level: 5, xp: 7000, title: 'Élite' },
        { level: 6, xp: 12000, title: 'Leyenda' },
        { level: 7, xp: 20000, title: 'Maestro' },
        { level: 8, xp: 35000, title: 'Invicto' },
        { level: 9, xp: 60000, title: 'Divo' },
        { level: 10, xp: 100000, title: 'Supremo' },
    ],

    BATTLE_PASS: {
        TOTAL_TIERS: 50,
        XP_PER_TIER: 1000,
    },

    MISIONES: [
        { id: 'chat_50', name: 'Chatter Activo', desc: 'Escribe 50 mensajes en el chat', type: 'messages', target: 50, xp: 200, icon: '💬' },
        { id: 'chat_200', name: 'No Para de Hablar', desc: 'Escribe 200 mensajes en el chat', type: 'messages', target: 200, xp: 500, icon: '🗣️' },
        { id: 'watch_60', name: 'Fiel Espectador', desc: 'Mira 60 minutos del stream', type: 'watch_time', target: 60, xp: 300, icon: '👁️' },
        { id: 'watch_300', name: 'Maratonista', desc: 'Mira 5 horas del stream', type: 'watch_time', target: 300, xp: 1000, icon: '📺' },
        { id: 'cheer_100', name: 'Generoso', desc: 'Envía 100 bits en total', type: 'bits', target: 100, xp: 500, icon: '💎' },
        { id: 'sub_1', name: 'Suscriptor', desc: 'Suscríbete o regala una suscripción', type: 'subs', target: 1, xp: 800, icon: '⭐' },
        { id: 'follow', name: 'Seguidor', desc: 'Sigue el canal', type: 'follow', target: 1, xp: 200, icon: '❤️' },
        { id: 'chat_500', name: 'Leyenda del Chat', desc: 'Escribe 500 mensajes en el chat', type: 'messages', target: 500, xp: 1500, icon: '👑' },
        { id: 'watch_1000', name: 'Adicto Total', desc: 'Mira 1000 minutos del stream', type: 'watch_time', target: 1000, xp: 3000, icon: '🔥' },
        { id: 'gift_5', name: 'Alma Generosa', desc: 'Regala 5 suscripciones', type: 'gifts', target: 5, xp: 2000, icon: '🎁' },
    ],

    DEFAULT_SCHEDULE: [
        { day: 1, time: '20:00', title: 'Gaming Session', active: true },
        { day: 3, time: '20:00', title: 'Variety Stream', active: true },
        { day: 5, time: '21:00', title: 'Friday Night Stream', active: true },
        { day: 6, time: '18:00', title: 'Saturday Gaming', active: true },
        { day: 0, time: '19:00', title: 'Sunday Chill', active: false },
    ],

    REWARD_TIERS: {
        2: { name: 'Emote Exclusiva FavNooob', icon: '💜', type: 'emote', description: 'Emote única para sus seguidores más fieles' },
        5: { name: 'Badge "Fiel"', icon: '🏅', type: 'badge', description: 'Badge especial que aparece junto a tu nombre en el chat' },
        8: { name: 'VIP Temporal (24h)', icon: '💎', type: 'vip', description: 'Color de nombre único y acceso a comandos VIP por 24 horas' },
        12: { name: 'Emote Animada', icon: '✨', type: 'emote', description: 'Emote animada exclusiva desbloqueable' },
        15: { name: 'Subscriber Temporal (7 días)', icon: '⭐', type: 'sub', description: 'Suscripción gratuita al canal por 7 días' },
        20: { name: 'Emote "Leyenda"', icon: '👑', type: 'emote', description: 'Emote de leyenda solo para los más dedicados' },
        25: { name: 'VIP Temporal (7 días)', icon: '🔮', type: 'vip', description: 'VIP延长 por una semana entera' },
        30: { name: 'Emote Especial Animada', icon: '🌟', type: 'emote', description: 'Emote animada premium del pase de batalla' },
        35: { name: 'Subscriber Temporal (1 mes)', icon: '🎯', type: 'sub', description: 'Suscripción gratuita por todo un mes' },
        40: { name: 'Mención en Stream', icon: '🎤', type: 'mention', description: 'FavNooob te menciona y agradece en el stream' },
        45: { name: 'Emote "Invicto"', icon: '🔥', type: 'emote', description: 'Emote animada de nivel invicto' },
        50: { name: 'VIP Permanente + Emote Legend', icon: '🏆', type: 'vip_permanent', description: 'VIP permanente y emote definitiva del canal' },
    },

    DAILY_MISSION_REFRESH_HOUR: 8,
};

const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
