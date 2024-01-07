import { ChannelType, VoiceState } from 'discord.js';
import { ExtendedClient } from '../core/classes';

export async function run(client: ExtendedClient, o: VoiceState, n: VoiceState) {
    const voice = client.music.voices.get(n.guild.id), queue = client.music.getQueue(n.guild.id);
    if (voice) {
        const audienceCount = voice.channel.members.filter(m => !m.user.bot && !m.voice.deaf).size
        if (!audienceCount && !queue?.songs.length) {
            queue?.stop();
            return voice.leave();
        }
        if (queue) {
            if (n.id == client.user?.id && o.channel?.id != n.channel?.id && voice.channel.type === ChannelType.GuildStageVoice) {
                if (voice.channel.manageable) {
                    n.setSuppressed(false);
                } else if (n.suppress) {
                    n.setRequestToSpeak(true)
                        .then(() => {
                            queue.textChannel?.send({
                                embeds: [
                                    {
                                        title: "스테이지 관리 권한이 없어요.",
                                        description: "스테이지 관리 권한을 추가하거나 발언권 요청을 받아주세요.",
                                        image: { url: "https://cdn.discordapp.com/attachments/843156045865418752/849642566466273370/request_speaker.gif" },
                                        color: client.config.errorColor
                                    }
                                ]
                            });
                        }).catch(() => {
                            queue.textChannel?.send({
                                embeds: [
                                    {
                                        title: "발언권 요청을 보낼 수 없어요.",
                                        description: "everyone으로부터 요청 허용을 켜주세요.",
                                        image: { url: "https://cdn.discordapp.com/attachments/843156045865418752/849650606976401448/allow_speaker.gif" },
                                        color: client.config.errorColor
                                    }
                                ]
                            });
                        });
                }
            }
            if (!audienceCount) {
                if (queue.playing) {
                    queue.pause();
                    queue.timeout = setTimeout(() => {
                        queue.textChannel?.send({
                            embeds: [
                                {
                                    title: "자동으로 채널에서 나왔어요.",
                                    description: "5분동안 음성채널에 음악을 듣는 사람이 없어요.",
                                    color: client.config.errorColor
                                }
                            ]
                        });
                        voice.leave();
                        queue.stop();
                    }, 300_000);
                }
            } else if (!queue.playing && queue.timeout) {
                queue.resume();
                clearTimeout(queue.timeout);
                delete queue.timeout;
            }
        }
    } else if (queue) {
        if (queue.timeout) clearTimeout(queue.timeout);
        if (queue.interval) clearInterval(queue.interval);
        client.music.stop(n.guild.id);
    }
}