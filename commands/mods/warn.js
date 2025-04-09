const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const db = require("quick.db");
const random_string = require("randomstring");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    name: 'warn',
    aliases: ["sanctions"],
    run: async (client, message, args, prefix, color) => {
        const logschannelID = db.get(`logmod_${message.guild.id}`);
        const logschannel = message.guild.channels.cache.get(logschannelID);
        let perm = "";

        message.member.roles.cache.forEach(role => {
            if (db.get(`modsp_${message.guild.id}_${role.id}`)) perm = true;
            if (db.get(`ownerp_${message.guild.id}_${role.id}`)) perm = true;
            if (db.get(`admin_${message.guild.id}_${role.id}`)) perm = true;
        });

        if (client.config.owner.includes(message.author.id) || db.get(`ownermd_${client.user.id}_${message.author.id}`) === true || perm) {
            if (args[0] === "add") {
                const use = message.mentions.users.first() || client.users.cache.get(args[1]);
                let user = client.users.cache.get(use.id);

                if (!user) return message.channel.send(`Aucun membre trouvé pour \`${args[1] || "rien"}\``);
                if (user.bot) return message.channel.send(`Vous ne pouvez pas sanctionner un bot !`);
                if (user.id === message.author.id) return message.channel.send(`Vous ne pouvez pas vous sanctionner vous-même !`);

                if (message.guild.members.cache.get(user.id).roles.highest.position >= message.member.roles.highest.position || user.id === message.guild.owner.id) 
                    return message.channel.send(`Cette personne est plus haute que vous sur le serveur, vous ne pouvez pas la sanctionner !`);

                let res = args.slice(2).join(" ") || "Aucune raison";

                let warnID = random_string.generate({
                    charset: 'numeric',
                    length: 8
                });

                db.push(`info.${message.guild.id}.${user.id}`, { moderator: message.author.tag, reason: res, date: Date.now() / 1000, id: warnID });
                db.add(`number.${message.guild.id}.${user.id}`, 1);

                message.channel.send(`${user} a été **warn**${res ? ` pour \`${res}\`` : ""}`);
                user.send(`Vous avez été **warn** sur ${message.guild.name}${res ? ` pour \`${res}\`` : ""}`);

                logschannel.send(new MessageEmbed()
                    .setColor(color)
                    .setDescription(`${message.author} a **warn** ${user}${res ? ` pour \`${res}\`` : ""}`)
                );
            }

            if (args[0] === "list") {
                const use = message.mentions.users.first() || client.users.cache.get(args[1]) || message.author;
                let user = client.users.cache.get(use.id);

                if (!user) return message.channel.send(`Aucun membre trouvé pour \`${args[1]}\``);

                const number = db.fetch(`number.${message.guild.id}.${user.id}`);
                const warnInfo = db.fetch(`info.${message.guild.id}.${user.id}`);

                if (!number || !warnInfo || warnInfo.length === 0) 
                    return message.channel.send(`Aucun membre trouvé avec des sanctions pour \`${args[1] || "rien"}\``);

                let p0 = 0;
                let p1 = 5;
                let page = 1;

                const embed = new MessageEmbed()
                    .setTitle(`Liste des sanctions de ${user.tag} (**${number}**)`)
                    .setDescription(warnInfo
                        .map((m, i) => `${i + 1}・\`${m.id}\`\n**Modérateur:** \`${m.moderator}\`\n**Raison:** \`${m.reason}\`\n**Date:** <t:${m.date}>`)
                        .slice(p0, p1)
                    )
                    .setFooter(`${page}/${Math.ceil(number / 15)} • ${client.config.name}`)
                    .setColor(color);

                message.channel.send(embed).then(async tdata => {
                    if (number > 15) {
                        const B1 = new MessageButton()
                            .setLabel("◀")
                            .setStyle("PRIMARY")
                            .setCustomId('warnlist1');

                        const B2 = new MessageButton()
                            .setLabel("▶")
                            .setStyle("PRIMARY")
                            .setCustomId('warnlist2');

                        const row = new MessageActionRow()
                            .addComponents(B1, B2);

                        tdata.edit({ content: "", embeds: [embed], components: [row] });

                        client.on('interactionCreate', async button => {
                            if (!button.isButton()) return;
                            if (button.user.id !== message.author.id) return button.reply({ content: "Vous ne pouvez pas interagir avec ce message.", ephemeral: true });

                            if (button.customId === "warnlist1") {
                                p0 -= 5;
                                p1 -= 5;
                                page--;

                                if (p0 < 0) return;

                                embed.setDescription(warnInfo
                                    .map((m, i) => `${i + 1}・\`${m.id}\`\n**Modérateur:** \`${m.moderator}\`\n**Raison:** \`${m.reason}\`\n**Date:** <t:${m.date}>`)
                                    .slice(p0, p1)
                                )
                                    .setFooter(`${page}/${Math.ceil(number / 15)} • ${client.config.name}`);
                                tdata.edit({ embeds: [embed] });
                            }

                            if (button.customId === "warnlist2") {
                                p0 += 5;
                                p1 += 5;
                                page++;

                                if (p1 > number) return;

                                embed.setDescription(warnInfo
                                    .map((m, i) => `${i + 1}・\`${m.id}\`\n**Modérateur:** \`${m.moderator}\`\n**Raison:** \`${m.reason}\`\n**Date:** <t:${m.date}>`)
                                    .slice(p0, p1)
                                )
                                    .setFooter(`${page}/${Math.ceil(number / 15)} • ${client.config.name}`);
                                tdata.edit({ embeds: [embed] });
                            }

                            button.deferUpdate();
                        });
                    }
                });
            }

            if (args[0] === "remove") {
                const use = message.mentions.users.first() || client.users.cache.get(args[1]);
                let user = client.users.cache.get(use.id);
                const id = args[2];

                let database = db.fetch(`info.${message.guild.id}.${user.id}`);
                if (!user) return message.channel.send(`Aucun membre trouvé pour \`${args[1]}\``);
                if (user.bot) return message.channel.send(`Aucun membre trouvé pour \`${args[1] || "rien"}\``);
                if (user.id === message.author.id) return message.react("❌");

                if (!database || database.length === 0) return message.channel.send(`Aucun membre trouvé avec des sanctions pour \`${args[1] || "rien"}\``);

                const sanctionIndex = database.findIndex(data => data.id === id);
                if (sanctionIndex === -1) return message.channel.send(`Aucune sanction trouvée pour \`${args[2] || "rien"}\``);

                database.splice(sanctionIndex, 1);

                if (database.length > 0) {
                    db.set(`info.${message.guild.id}.${user.id}`, database);
                    db.subtract(`number.${message.guild.id}.${user.id}`, 1);
                } else {
                    db.delete(`number.${message.guild.id}.${user.id}`);
                    db.delete(`info.${message.guild.id}.${user.id}`);
                }

                message.channel.send(`La sanction **${args[2]}** a été supprimée.`);
            }

            if (args[0] === "clear") {
                const use = message.mentions.users.first() || client.users.cache.get(args[1]);
                let user = client.users.cache.get(use.id);

                if (!user) return message.channel.send(`Aucun membre trouvé pour \`${args[1] || "rien"}\``);
                if (user.bot) return message.channel.send(`Aucun membre trouvé pour \`${args[1] || "rien"}\``);
                if (user.id === message.author.id) return message.react("❌");

                const number = db.fetch(`number.${message.guild.id}.${user.id}`);
                if (!number) return message.channel.send(`Aucune sanction trouvée`);

                message.channel.send(`${number} ${number > 1 ? "sanctions ont été supprimées" : "sanction a été supprimée"}`);

                db.delete(`number.${message.guild.id}.${user.id}`);
                db.delete(`info.${message.guild.id}.${user.id}`);
            }
        }
    }
};
