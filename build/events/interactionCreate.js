"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
async function run(client, interaction) {
    if (interaction.isChatInputCommand()) {
        const command = client.cache.commands.get(interaction.commandName);
        if (!command) {
            return interaction.reply({
                embeds: [{
                        title: "Error",
                        description: "로드되지 않는 커맨드입니다.",
                        color: client.config.errorColor
                    }],
                ephemeral: true
            });
        }
        if (command.options.whitelist && !command.options.whitelist.includes(interaction.user.id)) {
            return interaction.reply({
                embeds: [{
                        title: "Error",
                        description: "이 커맨드를 사용할 권한이 없습니다.",
                        color: client.config.errorColor
                    }],
                ephemeral: true
            });
        }
        command.run(interaction).then(res => {
            if (interaction.replied || interaction.deferred) {
                interaction.editReply(res);
            }
            else {
                interaction.reply(res);
            }
        });
    }
    else if (interaction.isButton()) {
        const [id, command, ...args] = interaction.customId.split("|");
        if (id == interaction.user.id || id == 'all') {
            client.cache.commands.get(command)?.button?.(interaction, args).then(res => {
                if (interaction.replied || interaction.deferred) {
                    interaction.message.edit(res);
                }
                else {
                    interaction.update(res);
                }
            });
        }
        else {
            interaction.reply({ content: "다른 사람의 상호작용이에요.", ephemeral: true });
        }
    }
    else if (interaction.isStringSelectMenu()) {
        const [id, command, ...args] = interaction.customId.split("|");
        if (id == interaction.user.id || id == 'all') {
            client.cache.commands.get(command)?.stringSelect?.(interaction, args).then(res => {
                if (interaction.replied || interaction.deferred) {
                    interaction.message.edit(res);
                }
                else {
                    interaction.update(res);
                }
            });
        }
        else {
            interaction.reply({ content: "다른 사람의 상호작용이에요.", ephemeral: true });
        }
    }
    else if (interaction.isModalSubmit()) {
        const [id, command, ...args] = interaction.customId.split("|");
        if (id == interaction.user.id || id == 'all') {
            client.cache.commands.get(command)?.modalSubmit?.(interaction, args);
        }
        else {
            interaction.reply({ content: "다른 사람의 상호작용이에요.", ephemeral: true });
        }
    }
    else if (interaction.isAutocomplete()) {
        client.cache.commands.get(interaction.commandName)?.autocomplete?.(interaction).then(res => {
            interaction.respond(res);
        });
    }
    else {
        interaction.reply({ content: 'soon:tm:', ephemeral: true });
    }
}
exports.run = run;
