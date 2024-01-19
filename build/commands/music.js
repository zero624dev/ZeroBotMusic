"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const classes_1 = require("../core/classes");
const ytdl_core_1 = __importDefault(require("@distube/ytdl-core"));
const ytsr_1 = __importDefault(require("@distube/ytsr"));
class Play extends classes_1.Command {
    youtubeDomain = /^https?:\/\/(youtu\.be|(www\.|music\.)?youtube\.com)/;
    constructor(client) {
        super(client, {
            name: "music",
            description: "Music related commands.",
            nameLocalizations: {
                ko: "음악"
            },
            descriptionLocalizations: {
                ko: "음악 관련 명령어."
            },
            options: [
                {
                    name: "play",
                    description: "Play a song.",
                    nameLocalizations: {
                        ko: "재생"
                    },
                    descriptionLocalizations: {
                        ko: "노래를 재생해요."
                    },
                    type: discord_js_1.ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "query",
                            description: "The query to search for.",
                            nameLocalizations: {
                                ko: "노래"
                            },
                            descriptionLocalizations: {
                                ko: "재생할 노래를 검색해요."
                            },
                            type: discord_js_1.ApplicationCommandOptionType.String,
                            autocomplete: true,
                            required: true
                        }
                    ]
                },
                {
                    name: "leave",
                    description: "Leaves the voice channel.",
                    nameLocalizations: {
                        ko: "끊기"
                    },
                    descriptionLocalizations: {
                        ko: "재생 중인 음성 채널에서 나가요."
                    },
                    type: discord_js_1.ApplicationCommandOptionType.Subcommand
                },
                {
                    name: "pause",
                    description: "Pauses the music.",
                    nameLocalizations: {
                        ko: "일시정지"
                    },
                    descriptionLocalizations: {
                        ko: "음악을 일시정지해요."
                    },
                    type: discord_js_1.ApplicationCommandOptionType.Subcommand
                },
                {
                    name: "resume",
                    description: "Resumes the music.",
                    nameLocalizations: {
                        ko: "재개"
                    },
                    descriptionLocalizations: {
                        ko: "음악을 재개해요."
                    },
                    type: discord_js_1.ApplicationCommandOptionType.Subcommand
                },
                {
                    name: "skip",
                    description: "Skips the music.",
                    nameLocalizations: {
                        ko: "스킵"
                    },
                    descriptionLocalizations: {
                        ko: "음악을 스킵해요."
                    },
                    type: discord_js_1.ApplicationCommandOptionType.Subcommand
                },
                {
                    name: "volume",
                    description: "Changes the volume.",
                    nameLocalizations: {
                        ko: "볼륨"
                    },
                    descriptionLocalizations: {
                        ko: "볼륨을 변경해요."
                    },
                    type: discord_js_1.ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "volume",
                            description: "The volume to set",
                            nameLocalizations: {
                                ko: "볼륨"
                            },
                            descriptionLocalizations: {
                                ko: "설정할 볼륨"
                            },
                            type: discord_js_1.ApplicationCommandOptionType.Integer,
                            minValue: 1,
                            maxValue: 100,
                            required: true
                        }
                    ]
                },
                {
                    name: "seek",
                    description: "Seeks the music.",
                    nameLocalizations: {
                        ko: "이동"
                    },
                    descriptionLocalizations: {
                        ko: "음악의 시간을 이동해요."
                    },
                    type: discord_js_1.ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "time",
                            description: "The time to seek.",
                            nameLocalizations: {
                                ko: "시간"
                            },
                            descriptionLocalizations: {
                                ko: "이동할 시간"
                            },
                            type: discord_js_1.ApplicationCommandOptionType.Integer,
                            minValue: 0,
                            autocomplete: true,
                            required: true
                        }
                    ]
                }
            ]
        });
    }
    run(interaction) {
        return new Promise(async (resolve, reject) => {
            const memberVoice = interaction.member?.voice?.channel, queue = this.client.music.getQueue(interaction.guildId);
            const subcommand = interaction.options.getSubcommand();
            const errorMessage = this.getErrorMessage(interaction, subcommand == "play" ? "song" :
                subcommand == "leave" ? "song" :
                    undefined);
            if (errorMessage)
                return resolve(errorMessage);
            if (subcommand == "play") {
                interaction.deferReply().then(async () => {
                    const query = interaction.options.getString("query", true);
                    if (query.startsWith("V=")) { // /^[a-zA-Z0-9-_]{11}$/.test(query)
                        this.playSong(interaction, memberVoice, `https://youtu.be/${query.slice(2)}`, queue);
                    }
                    else if (this.youtubeDomain.test(query)) {
                        const id = query.match(/(?<=v=|\/)([a-zA-Z0-9-_]+)/g)?.pop();
                        if (!id) {
                            return resolve({
                                embeds: [
                                    {
                                        title: "링크가 잘못되었어요.",
                                        description: "링크에서 아이디를 찾을 수 없어요.",
                                        footer: { text: `Not Available URL • ${this.client.user?.username}` },
                                        color: this.client.config.errorColor
                                    }
                                ]
                            });
                        }
                        this.playSong(interaction, memberVoice, `https://youtu.be/${id}`, queue);
                    }
                    else if (/^https?:\/\//.test(query)) {
                        this.playSong(interaction, memberVoice, query, queue);
                    }
                    else {
                        const items = await this.search(query);
                        if (!items?.length) {
                            return resolve({
                                embeds: [
                                    {
                                        title: "검색 결과가 없어요.",
                                        footer: { text: `No Result • ${this.client.user?.username}` },
                                        color: this.client.config.errorColor
                                    }
                                ]
                            });
                        }
                        resolve({
                            embeds: [
                                {
                                    title: `\"${query}\" 유튜브 검색 결과예요.`,
                                    color: this.client.config.accentColor
                                }
                            ], components: [
                                {
                                    type: discord_js_1.ComponentType.ActionRow,
                                    components: [
                                        {
                                            type: discord_js_1.ComponentType.StringSelect,
                                            customId: `${interaction.user.id}|${this.data.name}|selectSong`,
                                            placeholder: "재생할 노래를 선택해주세요.",
                                            options: items.map(song => {
                                                return {
                                                    label: this.client.utils.ellipsis(song.name, 100),
                                                    value: `${song.id}`,
                                                    description: `${this.client.utils.ellipsis(song.author?.name ?? "??", 47 - (song.duration.length ?? 0))} - ${song.duration}`,
                                                    emoji: song.type == "video" ? "🎵" : "🎶"
                                                };
                                            })
                                        }
                                    ]
                                }
                            ]
                        });
                    }
                });
            }
            else if (subcommand == "leave") {
                const voice = this.client.music.voices.get(interaction);
                if (!voice) {
                    return resolve({
                        embeds: [
                            {
                                title: "이미 음성 채널에 없어요.",
                                footer: { text: `Not Exist On Channel • ${this.client.user?.username}` },
                                color: this.client.config.errorColor
                            }
                        ], components: []
                    });
                }
                voice.leave();
                resolve({
                    embeds: [
                        {
                            title: `<#${voice.channel.id}>에서 나왔어요.`,
                            color: this.client.config.accentColor
                        }
                    ], components: []
                });
            }
            else if (subcommand == "pause") {
                if (queue.playing) {
                    queue.pause();
                    resolve({
                        embeds: [
                            {
                                title: "음악을 일시정지했어요.",
                                color: this.client.config.accentColor
                            }
                        ], components: []
                    });
                }
                else {
                    resolve({
                        embeds: [
                            {
                                title: "이미 일시정지되어 있어요.",
                                footer: { text: `Already Paused • ${this.client.user?.username}` },
                                color: this.client.config.errorColor
                            }
                        ], components: []
                    });
                }
            }
            else if (subcommand == "resume") {
                if (queue.paused) {
                    queue.resume();
                    resolve({
                        embeds: [
                            {
                                title: "음악을 재개했어요.",
                                color: this.client.config.accentColor
                            }
                        ], components: []
                    });
                }
                else {
                    resolve({
                        embeds: [
                            {
                                title: "이미 재생되어 있어요.",
                                footer: { text: `Already Playing • ${this.client.user?.username}` },
                                color: this.client.config.errorColor
                            }
                        ], components: []
                    });
                }
            }
            else if (subcommand == "skip") {
                if (queue.songs.length > 1 || queue.autoplay) {
                    queue.skip();
                }
                else {
                    queue.seek(queue.songs[0].duration);
                }
                resolve({
                    embeds: [
                        {
                            title: "음악을 스킵했어요.",
                            color: this.client.config.accentColor
                        }
                    ], components: []
                });
            }
            else if (subcommand == "volume") {
                const volume = interaction.options.getInteger("volume", true);
                queue.setVolume(volume);
                resolve({
                    embeds: [
                        {
                            title: `볼륨을 ${volume}으로 설정했어요.`,
                            color: this.client.config.accentColor
                        }
                    ], components: []
                });
            }
            else if (subcommand == "seek") {
                const seek = Math.min(queue.songs[0].duration, interaction.options.getInteger("time", true));
                queue.seek(seek);
                resolve({
                    embeds: [
                        {
                            title: `${this.client.utils.formatDuration(seek)}로 이동했어요.`,
                            color: this.client.config.accentColor
                        }
                    ], components: []
                });
            }
        });
    }
    button(interaction, args) {
        return new Promise((resolve, reject) => {
            const memberVoice = interaction.member?.voice?.channel, queue = this.client.music.getQueue(interaction.guildId);
            const errorMessage = this.getErrorMessage(interaction, args[0] == "changeChannel" ? "channel" : undefined);
            if (errorMessage)
                return interaction.reply({ ...errorMessage, ephemeral: true });
            if (args[0] == "changeChannel") {
                if (args[1] == "agree") {
                    interaction.guild?.members.me?.voice.setChannel(memberVoice);
                    resolve({
                        embeds: [
                            {
                                title: "재생 중인 채널을 옮겼어요.",
                                color: this.client.config.accentColor
                            }
                        ], components: []
                    });
                }
                else {
                    resolve({
                        embeds: [
                            {
                                title: "재생 중인 채널에 그대로 있을게요.",
                                color: this.client.config.accentColor
                            }
                        ], components: []
                    });
                }
            }
            else if (args[0] == "togglePlaying") {
                if (queue.playing) {
                    queue.pause();
                }
                else {
                    queue.resume();
                }
                resolve(this.client.music.getNowPlaying(queue));
            }
            else if (args[0] == "toggleRepeat") {
                if (queue.repeatMode + 1 > 2) {
                    queue.toggleAutoplay();
                    queue.setRepeatMode(0);
                }
                else if (queue.autoplay) {
                    queue.toggleAutoplay();
                }
                else {
                    queue.setRepeatMode(queue.repeatMode + 1);
                }
                resolve(this.client.music.getNowPlaying(queue));
            }
            else if (args[0] == "skip") {
                if (queue.songs.length > 1 || queue.autoplay) {
                    queue.skip();
                }
                else {
                    queue.seek(queue.songs[0].duration);
                }
                resolve(this.client.music.getNowPlaying(queue));
            }
            else if (args[0] == "prev") {
                if (queue.currentTime > 5) {
                    queue.seek(0);
                }
                else {
                    queue.previous();
                }
                resolve(this.client.music.getNowPlaying(queue));
            }
            else if (args[0] == "selectChapter") {
                const playing = queue.songs[0];
                const max = Math.ceil((playing.chapters.length - 24) / 23) + 1;
                interaction.reply({
                    embeds: [
                        {
                            title: "챕터 선택 메뉴",
                            color: this.client.config.accentColor,
                        }
                    ], components: [
                        {
                            type: discord_js_1.ComponentType.ActionRow,
                            components: [
                                {
                                    type: discord_js_1.ComponentType.StringSelect,
                                    customId: `${interaction.user.id}|${this.data.name}|selectChapter|${playing.id}`,
                                    placeholder: `재생할 챕터를 선택해주세요. ${max > 1 ? `(1/${max})` : ""}`,
                                    options: this.client.utils.getPageMenu({
                                        data: playing.chapters, page: 1,
                                        format: (v) => ({
                                            label: v.title,
                                            description: this.client.utils.formatDuration(v.start_time),
                                            value: `${v.start_time}s`
                                        })
                                    })
                                }
                            ]
                        }
                    ], ephemeral: true
                });
            }
            else if (args[0] == "jump") {
                const index = Number(args[1]);
                if (args[3] == "prev") {
                    for (let i = 0; i < queue.previousSongs.length; i++) {
                        if (Math.abs(i - index) < 2 && queue.previousSongs[i].id == args[2]) {
                            queue.jump(-(i + 1));
                            return resolve({ components: [] });
                        }
                    }
                }
                else {
                    for (let i = 1; i < queue.songs.length; i++) {
                        if (Math.abs(i - index) < 2 && queue.songs[i].id == args[2]) {
                            queue.jump(i);
                            return resolve({ components: [] });
                        }
                    }
                }
                interaction.reply({
                    embeds: [
                        {
                            title: "해당 노래를 찾지 못했어요.",
                            footer: { text: `Not Found Song • ${this.client.user?.username}` },
                            color: this.client.config.errorColor,
                        }
                    ], ephemeral: true
                });
            }
            else if (args[0] == "delete") {
                const index = Number(args[1]);
                if (args[3] == "prev") {
                    for (let i = 0; i < queue.previousSongs.length; i++) {
                        if (Math.abs(i - index) < 2 && queue.previousSongs[i].id == args[2]) {
                            queue.previousSongs.splice(i, 1);
                            return resolve({ components: [] });
                        }
                    }
                }
                else {
                    for (let i = 0; i < queue.songs.length; i++) {
                        if (Math.abs(i - index) < 2 && queue.songs[i].id == args[2]) {
                            queue.songs.splice(i, 1);
                            return resolve({ components: [] });
                        }
                    }
                }
                interaction.reply({
                    embeds: [
                        {
                            title: "해당 노래를 찾지 못했어요.",
                            footer: { text: `Not Found Song • ${this.client.user?.username}` },
                            color: this.client.config.errorColor,
                        }
                    ], ephemeral: true
                });
            }
        });
    }
    stringSelect(interaction, args) {
        return new Promise((resolve, reject) => {
            const memberVoice = interaction.member?.voice?.channel, queue = this.client.music.getQueue(interaction.guildId);
            const errorMessage = this.getErrorMessage(interaction, args[0] == "selectSong" ? "song" : undefined);
            if (errorMessage)
                return interaction.reply({ ...errorMessage, ephemeral: true });
            if (args[0] == "selectSong") {
                const song = interaction.values[0];
                this.playSong(interaction, memberVoice, `https://youtu.be/${song}`, queue);
                resolve({
                    components: [
                        {
                            type: discord_js_1.ComponentType.ActionRow,
                            components: [
                                {
                                    type: discord_js_1.ComponentType.StringSelect,
                                    customId: "disabled",
                                    options: interaction.component.options.map(o => ({ ...o, default: o.value == song })),
                                    disabled: true
                                }
                            ]
                        }
                    ]
                });
            }
            else if (args[0] == "selectChapter") {
                const playing = queue.songs[0];
                if (playing.id != args[1]) {
                    return resolve({
                        embeds: [
                            {
                                title: "재생 중인 노래와 다른 노래에요.",
                                footer: { text: `Not Match Songs • ${this.client.user?.username}` },
                                color: this.client.config.errorColor,
                            }
                        ], components: []
                    });
                }
                const select = interaction.values[0];
                if (select.endsWith('p')) {
                    const curpage = Number(select.slice(0, -1)), max = Math.ceil((playing.chapters.length - 24) / 23) + 1;
                    resolve({
                        components: [
                            {
                                type: discord_js_1.ComponentType.ActionRow,
                                components: [
                                    {
                                        type: discord_js_1.ComponentType.StringSelect,
                                        customId: `${interaction.user.id}|${this.data.name}|${playing.id}`,
                                        placeholder: `재생할 챕터를 선택해주세요. ${max > 1 ? `(${curpage}/${max})` : ""}`,
                                        options: this.client.utils.getPageMenu({
                                            data: playing.chapters, page: curpage,
                                            format: (v) => ({
                                                label: v.title,
                                                description: this.client.utils.formatDuration(v.start_time),
                                                value: `${v.start_time}s`
                                            })
                                        }),
                                    }
                                ]
                            }
                        ]
                    });
                }
                else {
                    const sec = Number(select.slice(0, -1));
                    queue.seek(sec);
                    resolve({
                        embeds: [
                            {
                                title: `${queue.songs[0].getChapter(sec) ?? "???"}가 선택되었어요.`,
                                description: `${this.client.utils.formatDuration(sec)}(으)로 이동할게요.`,
                                color: this.client.config.accentColor,
                            }
                        ], components: []
                    });
                }
            }
            else if (args[0] == "nextSongs") {
                const select = interaction.values[0];
                if (select == "shuffle") {
                    queue.shuffle();
                    resolve(this.client.music.getNowPlaying(queue));
                }
                else if (select.endsWith('p')) {
                    queue.nextSongsPage = Number(select.slice(0, -1));
                    resolve(this.client.music.getNowPlaying(queue));
                }
                else {
                    const [index, videoId] = select.split("|");
                    for (let i = 0; i < queue.songs.length; i++) {
                        if (Math.abs(i - Number(index)) < 2 && queue.songs[i].id == videoId) {
                            return interaction.reply({
                                embeds: [
                                    {
                                        title: queue.songs[i].name,
                                        url: queue.songs[i].url,
                                        author: {
                                            name: `${queue.songs[i].user?.tag ?? this.client.user?.username}${queue.songs[i].user?.id == this.client.user?.id ? "의 추천곡" : "님의 신청곡"}`,
                                            icon_url: queue.songs[i].user?.displayAvatarURL()
                                        },
                                        color: this.client.config.accentColor,
                                        thumbnail: queue.songs[i].thumbnail ? {
                                            url: queue.songs[i].thumbnail
                                        } : undefined
                                    }
                                ], components: [
                                    {
                                        type: discord_js_1.ComponentType.ActionRow,
                                        components: [
                                            {
                                                type: discord_js_1.ComponentType.Button,
                                                customId: `${interaction.user.id}|${this.data.name}|delete|${i}|${queue.songs[i].id}`,
                                                emoji: "🗑️",
                                                style: discord_js_1.ButtonStyle.Danger,
                                            },
                                            {
                                                type: discord_js_1.ComponentType.Button,
                                                customId: `${interaction.user.id}|${this.data.name}|jump|${i}|${queue.songs[i].id}`,
                                                emoji: "▶️",
                                                style: discord_js_1.ButtonStyle.Primary,
                                            },
                                        ]
                                    }
                                ], ephemeral: true
                            });
                        }
                    }
                    interaction.reply({
                        embeds: [
                            {
                                title: "해당 노래를 찾지 못했어요.",
                                footer: { text: `Not Found Song • ${this.client.user?.username}` },
                                color: this.client.config.errorColor,
                            }
                        ], ephemeral: true
                    });
                }
            }
            else if (args[0] == "previousSongs") {
                const select = interaction.values[0];
                if (select.endsWith('p')) {
                    queue.previousSongsPage = Number(select.slice(0, -1));
                    resolve(this.client.music.getNowPlaying(queue));
                }
                else {
                    const [index, videoId] = select.split("|");
                    for (let i = 0; i < queue.previousSongs.length; i++) {
                        if (Math.abs(i - Number(index)) < 2 && (queue.previousSongs[i].id ?? "") == videoId) {
                            return interaction.reply({
                                embeds: [
                                    {
                                        title: queue.previousSongs[i].name,
                                        url: queue.previousSongs[i].url,
                                        author: {
                                            name: `${queue.previousSongs[i].user?.tag ?? this.client.user?.username}${queue.previousSongs[i].user?.id == this.client.user?.id ? "의 추천곡" : "님의 신청곡"}`,
                                            icon_url: queue.previousSongs[i].user?.displayAvatarURL()
                                        },
                                        color: this.client.config.accentColor,
                                        thumbnail: queue.previousSongs[i].thumbnail ? {
                                            url: queue.previousSongs[i].thumbnail
                                        } : undefined
                                    }
                                ], components: [
                                    {
                                        type: discord_js_1.ComponentType.ActionRow,
                                        components: [
                                            {
                                                type: discord_js_1.ComponentType.Button,
                                                customId: `${interaction.user.id}|${this.data.name}|delete|${i}|${videoId}|prev`,
                                                emoji: "🗑️",
                                                style: discord_js_1.ButtonStyle.Danger,
                                            },
                                            {
                                                type: discord_js_1.ComponentType.Button,
                                                customId: `${interaction.user.id}|${this.data.name}|jump|${i}|${videoId}|prev`,
                                                emoji: "▶️",
                                                style: discord_js_1.ButtonStyle.Primary,
                                            },
                                        ]
                                    }
                                ], ephemeral: true
                            });
                        }
                    }
                    interaction.reply({
                        embeds: [
                            {
                                title: "해당 노래를 찾지 못했어요.",
                                footer: { text: `Not Found Song • ${this.client.user?.username}` },
                                color: this.client.config.errorColor,
                            }
                        ], ephemeral: true
                    });
                }
            }
        });
    }
    autocomplete(interaction) {
        return new Promise(async (resolve, reject) => {
            const subcommand = interaction.options.getSubcommand();
            if (subcommand == "play") {
                const query = interaction.options.getString("query", true);
                if (!query) {
                    return resolve([]);
                }
                else if (this.youtubeDomain.test(query)) {
                    const id = query.match(/(?<=v=|\/)([a-zA-Z0-9-_]+)/g)?.pop();
                    const playlistId = query.match(/(?<=list=)([a-zA-Z0-9-_]+)/g)?.pop();
                    this.getVideo(id).then(video => {
                        const choiceData = [];
                        if (video) {
                            choiceData.push({
                                name: this.client.utils.ellipsis(video.title, 100),
                                value: `V=${video.videoId}`,
                            });
                        }
                        if (playlistId) {
                            // const playlist = await this.client.music.getPlaylist(playlistId);
                            choiceData.push({
                                name: "플레이리스트는 아직 지원하지 않아요.",
                                value: `V=${id}`,
                            });
                        }
                        resolve(choiceData);
                    });
                }
                else {
                    this.search(query).then(res => {
                        resolve(res.map(song => ({
                            name: this.client.utils.ellipsis(song.name, 100),
                            value: `V=${song.id}`,
                        })));
                    });
                }
            }
            else if (subcommand == "seek") {
                const time = interaction.options.getInteger("time", true).toString();
                const queue = this.client.music.getQueue(interaction.guildId);
                if (!queue?.songs.length) {
                    return resolve([]);
                }
                const seek = Math.min(queue.songs[0].duration, Number(time) || time.split(":").reverse().map(v => Number(v) || 0).reduce((s, v, i) => s += v * 60 ** i || v));
                const chapters = (queue.songs[0].chapters.filter(v => v.start_time >= seek) ?? []).map(v => {
                    return {
                        name: this.client.utils.ellipsis(v.title, 100),
                        value: v.start_time
                    };
                });
                if (seek) {
                    chapters.unshift({
                        name: `${this.client.utils.formatDuration(seek)}로 이동하기`,
                        value: seek,
                    });
                }
                resolve(chapters);
            }
        });
    }
    getErrorMessage(interaction, except) {
        const memberVoice = interaction.member?.voice?.channel, queue = this.client.music.getQueue(interaction.guildId);
        if (!memberVoice) {
            return ({
                embeds: [
                    {
                        title: "먼저 음성 채널에 들어가주세요.",
                        color: this.client.config.errorColor,
                        footer: { text: `No Voice Joined • ${this.client.user?.username}` }
                    }
                ], components: []
            });
        }
        else if (queue && !queue.shared && queue.host.id !== interaction.user.id) {
            return ({
                embeds: [
                    {
                        title: "노래 큐에 접근할 권한이 없어요.",
                        description: "호스트에게 노래 큐의 공유 상태를 변경해달라고 요청해주세요.",
                        color: this.client.config.errorColor,
                        footer: { text: `You Can Not Access • ${this.client.user?.username}` }
                    }
                ], components: []
            });
        }
        else if (queue && memberVoice.id != queue.voiceChannel?.id && except != "channel") {
            return ({
                embeds: [
                    {
                        title: "다른 채널에서 노래를 재생 중이에요.",
                        description: "재생 중인 채널을 옮길까요?",
                        color: this.client.config.accentColor
                    }
                ], components: [
                    {
                        type: discord_js_1.ComponentType.ActionRow,
                        components: [
                            {
                                type: discord_js_1.ComponentType.Button,
                                customId: `${interaction.user.id}|${this.data.name}|changeChannel|decline`,
                                emoji: "❌",
                                style: discord_js_1.ButtonStyle.Primary,
                            },
                            {
                                type: discord_js_1.ComponentType.Button,
                                customId: `${interaction.user.id}|${this.data.name}|changeChannel|agree`,
                                emoji: "⭕",
                                style: discord_js_1.ButtonStyle.Primary,
                            },
                        ]
                    }
                ]
            });
        }
        else if (!queue && except != "song") {
            return ({
                embeds: [
                    {
                        title: "먼저 노래를 재생해주세요.",
                        color: this.client.config.errorColor,
                        footer: { text: `Error Message • ${this.client.user?.username}` }
                    }
                ], components: []
            });
        }
        return undefined;
    }
    playSong(interaction, voiceChannel, song, queue) {
        this.client.music.play(voiceChannel, song, {
            textChannel: interaction.channel,
            member: interaction.member
        }).then(() => {
            const curQueue = this.client.music.getQueue(interaction.guildId);
            if (!curQueue) {
                const option = {
                    embeds: [
                        {
                            title: "노래를 재생할 수 없어요.",
                            description: "노래를 재생할 수 없어요.",
                            footer: { text: `Not Available • ${this.client.user?.username}` },
                            color: this.client.config.errorColor
                        }
                    ]
                };
                if (interaction.isChatInputCommand()) {
                    interaction.editReply(option);
                }
                else {
                    interaction.message.channel.send(option);
                }
            }
            else if (!queue) {
                curQueue.host = interaction.user;
                curQueue.nextSongsPage = 1;
                curQueue.previousSongsPage = 1;
                (() => {
                    if (interaction.isChatInputCommand()) {
                        return interaction.editReply(this.client.music.getNowPlaying(curQueue));
                    }
                    else {
                        return interaction.message.channel.send(this.client.music.getNowPlaying(curQueue));
                    }
                })().then(message => {
                    curQueue.message = message;
                    curQueue.interval = setInterval(async () => {
                        if (curQueue.message?.id !== curQueue.textChannel?.lastMessage?.id) {
                            if (curQueue.message?.deletable)
                                curQueue.message.delete();
                            delete curQueue.message;
                        }
                        if (!curQueue.message) {
                            curQueue.message = await curQueue.textChannel?.send(this.client.music.getNowPlaying(curQueue));
                        }
                        else {
                            curQueue.message.edit(this.client.music.getNowPlaying(curQueue));
                        }
                    }, 5000);
                });
            }
            else {
                const song = curQueue.songs.slice(-1)[0];
                const option = {
                    embeds: [
                        {
                            title: song.name,
                            url: song.url,
                            author: {
                                name: `${interaction.user.tag}님의 신청곡`,
                                icon_url: interaction.user.displayAvatarURL()
                            },
                            color: this.client.config.accentColor,
                            thumbnail: song.thumbnail ? {
                                url: song.thumbnail
                            } : undefined
                        }
                    ]
                };
                if (interaction.isChatInputCommand()) {
                    interaction.editReply(option);
                }
                else {
                    interaction.message.channel.send(option);
                }
            }
        });
    }
    search(searchterms) {
        return new Promise((resolve, reject) => {
            if (!searchterms)
                return resolve([]);
            (0, ytsr_1.default)(searchterms).then(res => resolve(res.items));
        });
    }
    getVideo(id) {
        return new Promise((resolve, reject) => {
            if (!id)
                return resolve(undefined);
            return ytdl_core_1.default.getBasicInfo(id).then(({ videoDetails }) => resolve(videoDetails)).catch(() => resolve(undefined));
        });
    }
}
exports.default = Play;
