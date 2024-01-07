import {
    Collection,
    SelectMenuComponentOptionData
} from 'discord.js';
import { ExtendedClient } from './classes';

interface MessageSelectMenuPageOptions {
    contentSize?: number;
    page?: number;
    data: any[] | Collection<string, any>;
    format(value: any, index: number, array: any[]): SelectMenuComponentOptionData;
}

export default class Utils {
    client: ExtendedClient;

    constructor(client: ExtendedClient) {
        this.client = client;
    }

    formatDuration(ms: number) {
        const seconds = Math.floor(ms % 60).toString().padStart(2, "0");
        const minutes = Math.floor((ms % 3600) / 60).toString().padStart(2, "0");
        const hours = Math.floor(ms / 3600);
        if (hours > 0)
            return `${hours.toString().padStart(2, "0")}:${minutes}:${seconds}`;
        return `${minutes}:${seconds}`;
    }

    ellipsis(str: string | null | undefined, max: number) {
        if (str) return str.length > max ? `${str.slice(0, max - 3)}...` : str;
        else return "";
    }

    getPageMenu({ format, data, page = 1, contentSize = 25 }: MessageSelectMenuPageOptions) {
        if (data instanceof Collection) data = Array.from(data.values());

        const max = Math.ceil(Math.max((data.length - contentSize) / (contentSize - 2), 0)) + 1, options: SelectMenuComponentOptionData[] = [];
        if (max == 1) {
            options.push(
                ...data.map(format)
            );
        } else if (max == page) {
            options.push({
                label: "이전 페이지",
                description: `${page - 1}번째 페이지로 넘어가요.`,
                value: `${page - 1}p`,
                emoji: "⬅️"
            });
            options.push(
                ...data.slice(1 - contentSize - data.length + contentSize + (contentSize - 2) * (max - 1)).map(format)
            );
        } else {
            if (page != 1) {
                options.push({
                    label: "이전 페이지",
                    description: `${page - 1}번째 페이지로 넘어가요.`,
                    value: `${page - 1}p`,
                    emoji: "⬅️"
                });
            }
            options.push(
                ...data.slice((contentSize - (page == 1 ? 2 : 1)) + (contentSize - 2) * (page - 2), (contentSize - 1) + (contentSize - 2) * (page - 1)).map(format)
            )
            options.push({
                label: "다음 페이지",
                description: `${page + 1}번째 페이지로 넘어가요.`,
                value: `${page + 1}p`,
                emoji: "➡️"
            });
        }
        return options;
    }

    shuffleArray(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

