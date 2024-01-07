import { ButtonStyle, ComponentType, Message, User } from "discord.js";
import { ExtendedClient } from "./classes";
import DisTube, { DisTubeOptions, Queue, Song } from "distube";

declare module "distube" {
    interface DisTube {
        getQueue(id?: string | null): Queue | undefined;
    }

    interface Queue {
        host: User;
        shared: boolean;
        timeout?: NodeJS.Timeout;
        interval?: NodeJS.Timeout;
        message?: Message;
        nextSongsPage: number;
        previousSongsPage: number;
        getNowPlaying(): any;
    }

    interface Song {
        getChapter(time: number): string | undefined;
    }
}

Song.prototype.getChapter = function (time: number) {
    if (!this.chapters || !this.chapters[0]) return undefined;
    for (let i = this.chapters.length - 1; i >= 0; i--)
        if (this.chapters[i].start_time <= time)
            return this.chapters[i].title;
}

export default class MusicManager extends DisTube {
    client: ExtendedClient;

    constructor(client: ExtendedClient, options?: DisTubeOptions) {
        super(client, options);
        this.client = client;

        this
            .on("initQueue", queue => {
                queue.shared = true;

                // if (!queue.voice.voiceState) return;
                // if (queue.voice.channel.manageable) {
                //     queue.voice.voiceState.setSuppressed(false);
                // } else if (queue.voice.voiceState.suppress) {
                //     queue.voice.voiceState.setRequestToSpeak(true)
                //         .then(() => {
                //             queue.textChannel?.send({
                //                 embeds: [
                //                     {
                //                         title: "스테이지 관리 권한이 없어요.",
                //                         description: "스테이지 관리 권한을 추가하거나 발언권 요청을 받아주세요.",
                //                         image: { url: "https://cdn.discordapp.com/attachments/843156045865418752/849642566466273370/request_speaker.gif" },
                //                         color: client.config.errorColor
                //                     }
                //                 ]
                //             });
                //         }).catch(() => {
                //             queue.textChannel?.send({
                //                 embeds: [
                //                     {
                //                         title: "발언권 요청을 보낼 수 없어요.",
                //                         description: "everyone으로부터 요청 허용을 켜주세요.",
                //                         image: { url: "https://cdn.discordapp.com/attachments/843156045865418752/849650606976401448/allow_speaker.gif" },
                //                         color: client.config.errorColor
                //                     }
                //                 ]
                //             }).then(() => {
                //                 queue.stop();
                //                 queue.voice.leave();
                //             });
                //         })
                // }
            })
            .on("deleteQueue", queue => {
                if (queue.timeout) clearTimeout(queue.timeout);
                if (queue.interval) clearInterval(queue.interval);
            })
            .on("finish", queue => {
                queue.previousSongs.push(queue.songs.pop()!);
                if (queue.message) {
                    queue.message.edit(this.getNowPlaying(queue));
                }
            })
    }

    getNowPlaying(queue: Queue) {
        const {
            songs, currentTime, volume, filters,
            repeatMode, playing, previousSongs, host, shared,
            formattedCurrentTime, formattedDuration, autoplay
        } = queue;
        const song = songs[0], chapter = song?.getChapter(currentTime);
        const messageOptions = {
            embeds: [
                song ? {
                    author: {
                        name: `${song.user?.tag ?? this.client.user?.username}${song.user?.id == this.client.user?.id ? "의 추천곡" : "님의 신청곡"}`,
                        icon_url: song.user?.displayAvatarURL()
                    },
                    fields: [
                        {
                            name: "현재 재생 중인 노래",
                            value: `[${song.name}](${song.url})`,
                            inline: false
                        },
                        {
                            name: "호스트",
                            value: `<@${host.id}>\`(${shared ? "공용" : "전용"})\``,
                            inline: true
                        },
                        {
                            name: "볼륨",
                            value: `\`${volume}%\``,
                            inline: true
                        },
                        {
                            name: "필터",
                            value: `\`${filters.names.join("`, `") || "없음"}\``,
                            inline: true
                        },
                    ],
                    thumbnail: { url: song.thumbnail },
                    color: this.client.config.accentColor,
                } : {
                    title: "현재 재생중인 곡이 없어요.",
                    description: `노래를 듣지 않을 거라면 음성채널에서 나가거나 </music leave:${this.client.application?.commands.cache.find(c => c.name == "music")?.id}> 명령어를 사용해주세요.`,
                    color: this.client.config.accentColor
                }
            ], components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            customId: 'all|music|prev',
                            emoji: "⏮️",
                            style: ButtonStyle.Primary,
                            disabled: !previousSongs.length && (currentTime < 5 || song?.isLive),
                            type: ComponentType.Button
                        },
                        {
                            customId: 'all|music|togglePlaying',
                            emoji: playing ? "⏸️" : "▶️",
                            style: ButtonStyle.Primary,
                            type: ComponentType.Button
                        },
                        {
                            customId: 'all|music|skip',
                            emoji: "⏭️",
                            style: ButtonStyle.Primary,
                            disabled: !songs.length,
                            type: ComponentType.Button
                        },
                        {
                            customId: 'all|music|selectChapter',
                            label: song ? `${formattedCurrentTime} / ${song.formattedDuration}` : "00:00",
                            style: ButtonStyle.Secondary,
                            disabled: !song?.chapters.length,
                            type: ComponentType.Button
                        },
                        {
                            customId: 'all|music|toggleRepeat',
                            emoji: ['➡️', '🔂', '🔁', '🤖'][autoplay ? 3 : repeatMode],
                            style: ButtonStyle.Primary,
                            type: ComponentType.Button
                        },
                    ] as any
                }
            ]
        };
        if (chapter && messageOptions.embeds[0].fields)
            messageOptions.embeds[0].fields.splice(1, 0, {
                name: "현재 재생 중인 챕터",
                value: `\`${chapter}\``,
                inline: false
            });
        if (songs.length > 1) {
            const maxPage = Math.ceil(Math.max((songs.length - 24) / 22, 0)) + 1;
            if (maxPage < queue.nextSongsPage) queue.nextSongsPage = maxPage;
            const options = this.client.utils.getPageMenu({
                page: queue.nextSongsPage, data: songs.slice(1), contentSize: 24,
                format: (v: Song, i: number) => ({
                    label: this.client.utils.ellipsis(v.name, 100),
                    description: v.formattedDuration,
                    value: `${i + (queue.nextSongsPage - 1) * 24}|${v.id ?? ""}`,
                    emoji: "🎵"
                })
            });
            if (options.length > 1)
                options.splice(0, 0, {
                    label: "셔플",
                    description: "대기열의 노래를 무작위로 섞어요.",
                    value: "shuffle",
                    emoji: "🔀"
                });
            messageOptions.components.splice(0, 0, {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.StringSelect,
                        customId: `all|music|nextSongs`,
                        placeholder: `다음 노래 : ${songs.length - 1}곡 - ${this.client.utils.formatDuration(
                            songs.slice(1).reduce((a, b) => a + b.duration, 0)
                        )} (${queue.nextSongsPage}/${maxPage})`,
                        options
                    }
                ]
            });
        }
        if (previousSongs.length > 0) {
            const maxPage = Math.ceil(Math.max((previousSongs.length - 25) / 23, 0)) + 1
            if (maxPage < queue.previousSongsPage) queue.previousSongsPage = maxPage;
            const options = this.client.utils.getPageMenu({
                page: queue.previousSongsPage, data: previousSongs, contentSize: 25,
                format: (v: Song, i: number) => ({
                    label: this.client.utils.ellipsis(v.name, 100),
                    description: v.formattedDuration,
                    value: `${i + (queue.previousSongsPage - 1) * 24}|${v.id ?? ""}`,
                    emoji: "🎵"
                })
            });
            messageOptions.components.splice(0, 0, {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.StringSelect,
                        customId: `all|music|previousSongs`,
                        placeholder: `이전 노래 : ${previousSongs.length}곡 - ${this.client.utils.formatDuration(
                            previousSongs.reduce((a, b) => a + b.duration, 0)
                        )} (${queue.previousSongsPage}/${maxPage})`,
                        options
                    }
                ]
            });
        }
        return messageOptions as any;
    }
};