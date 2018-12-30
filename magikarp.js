const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const SQLite = require("better-sqlite3");
const sql = new SQLite('./players.sqlite');

/**
 *   Required for command cooldown to work.
 */
client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();

client.on("ready", () => {
        console.log(`Logged in as Magikarp#6679. Serving ${client.users.size} people on ${client.guilds.size} servers.`);
        client.user.setActivity(`Splashing ${client.users.size} people!`);

        /**
         *   Prepare the table to insert or replace member profiles into the database. It also checks to see
         *   if a profile already exists. If it doesn't then it will create a new one for that member.
         */
        const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'players';").get();

        if (!table['count(*)']) {
                sql.prepare("CREATE TABLE players (id TEXT PRIMARY KEY, user TEXT, guild TEXT, exp INTEGER, level INTEGER, coins INTEGER, hp INTERGER, mhand TEXT, ohand TEXT, armor TEXT, accessory TEXT);").run();
                sql.prepare("CREATE UNIQUE INDEX idx_players_id ON players (id);").run();
                sql.pragma("synchronous = 1");
                sql.pragma("journal_mode = wal");
        }

        client.getPlayer = sql.prepare("SELECT * FROM players WHERE user = ? AND guild = ?");
        client.setPlayer = sql.prepare("INSERT OR REPLACE INTO players (id, user, guild, exp, level, coins, hp, mhand, ohand, armor, accessory) VALUES (@id, @user, @guild, @exp, @level, @coins, @hp, @mhand, @ohand, @armor, @accessory);");
});

client.on("guildCreate", guild => {
        console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
        client.user.setActivity(`Splashing ${client.users.size} people!`);
});


client.on("guildDelete", guild => {
        console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
        client.user.setActivity(`Splashing ${client.users.size} people!`);
});

client.on("message", message => {
        if (message.author.bot) return;

        let player;

        if (message.guild) {
                player = client.getPlayer.get(message.author.id, message.guild.id);

                if (!player) {
                        player = { id: `${message.guild.id}-${message.author.id}`, user: message.author.id, guild: message.guild.id, exp: 0, level: 1, coins: 1000, hp: 10, mhand: 0, ohand: 0, armor: 0, accessory: 0 }
                }
                
                var minEXP = 5;
                var maxEXP = 20;
                
                function getRandomInt(minEXP, maxEXP) {
                        min = Math.ceil(minEXP);
                        max = Math.floor(maxEXP);
                        return Math.floor(Math.random() * (maxEXP - minEXP)) + minEXP;
                }

                giveEXP = Math.floor(Math.random() * (maxEXP - minEXP)) + minEXP;
                addHealth = 1;

                if(player.exp += giveEXP) {
                        player.exp++;
                }
                
                const curLevel = Math.floor(0.1 * Math.sqrt(player.exp));

                if(player.level < curLevel) {
                        player.level++;
                        
                        if(player.hp += addHealth) {
                                player.hp++
                        }
                }

                client.setPlayer.run(player);
        }

        if (message.content.indexOf(config.prefix) !== 0) return;

        const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();
        
        
        /**
         *   Cooldown function. Checks to see if a command has been init already within the length of time.
         *   The default cooldown is 15 seconds here.
         */
        if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 1) * 1000;

	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			return message.reply(`You need to wait ${timeLeft.toFixed(1)} more seconds before using the command.`);
		}
	}

	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        
        
        /**
         *   Help Command. This command allows you to bring up a list of all the commands of the bot.
         */
        if(command === "help" || command === "support") {
                const embed = new Discord.RichEmbed()
                
                .setTitle('Magikarp Bot\'s Help')
                .setThumbnail(client.user.avatarURL)
                .setColor(0xFF6600)
                .addField('$Profile', 'Displays your profile.', true)
                .addField('$Give', 'Give coins to someone', true)
                .addField('$Chop', 'Earn coins woodcutting.', true)
                .addField('$Mine', 'Earn coins mining.', true)
                .addField('$Fish', 'Earn coins fishing.', true)
                .addField('$Rank', 'Shows level and experience.', true)
                .addField('$Richest', 'Shows richest members.', true)
                .addField('$Ping', 'Shows current latency.', true)
                
                return message.channel.send({embed});
        }
       
        /**
         *   Profile Command. This command allows members to check their profile.
         */
         if(command === "profile" || command === "me") {
                const embed = new Discord.RichEmbed()

                .setTitle(`${message.author.username}'s Profile`)
                .setThumbnail(message.author.avatarURL)
                .setColor(0xFF6600)
                .addField('Coins', player.coins, true)
                .addField('Current Level', player.level, true)
                .addField('Current Experience', player.exp, true)
                .addField('Max Health', player.hp, true)
                .addField('Main Hand', player.mHand, true)
                .addField('Off Hand', player.oHand)
                .addField('Armor', player.armor, true)
                .addField('Accessory', player.accessory, true)

                return message.channel.send({embed});
        }
        
        /**
         *   Adventure command. Take your character on an adventure to earn a lot of coins and experience.
         */
        if(command === "adventure" || command === "mission") {
                let player;
                player = client.getPlayer.get(message.author.id, message.guild.id);
                
                if(!player) {
                        player = { id: `${message.guild.id}-${message.author.id}`, user: message.author.id, guild: message.guild.id, exp: 0, level: 1, coins: 1000, hp: 10, mhand: 0, ohand:0, armor: 0, accessory: 0 }
                }     
        }

        /**
         *   Give coins to another member of the server.
         */
        if(command === "give") {  
                let sender;
                sender = client.getPlayer.get(message.author.id, message.guild.id);
                
                if (!sender) {
                        player = { id: `${message.guild.id}-${message.author.id}`, user: message.author.id, guild: message.guild.id, exp: 0, level: 1, coins: 1000, hp: 10, mhand: 0, ohand: 0, armor: 0, accessory: 0 }
                }
                
                const user = message.mentions.users.first() || client.users.get(args[0]);
                if(!user) return message.reply('You forgot to mention someone or give the amount of coins.');
                
                const coinsToAdd = parseInt(args[1], 10);
                if(!coinsToAdd) return message.reply('You forgot the amount of coins to give.');
                        
                let player = client.getPlayer.get(user.id, message.guild.id);
                if (!player) {
                        player = { id: `${message.guild.id}-${user.id}`, user: user.id, guild: message.guild.id, exp: 0, level: 1, coins: 1000 }
                }
                
                sender.coins -= coinsToAdd;
                player.coins += coinsToAdd;
                
                client.setPlayer.run(sender);
                client.setPlayer.run(player);
                
                return message.channel.send(`${user} has recieved ${coinsToAdd} points and now has ${player.coins}.`)
        }
        
        /**
         *   Mining Command. This command allows users to gain some experience and money.
         */
        if(command === "mine") {
                let player;

                player = client.getPlayer.get(message.author.id, message.guild.id);

                minCoins = 100;
                maxCoins = 500;
                minEXP   = 10;
                maxEXP   = 50;

                function getRandomInt(minCoins, maxCoins) {
                        min = Math.ceil(minCoins);
                        max = Math.floor(maxCoins);
                        return Math.floor(Math.random() * (maxCoins - minCoins)) + minCoins;
                }

                giveCoins = Math.floor(Math.random() * (maxCoins - minCoins)) + minCoins;

                function getRandomInt(minEXP, maxEXP) {
                        min = Math.ceil(minEXP);
                        max = Math.floor(maxEXP);
                        return Math.floor(Math.random() * (maxEXP - minEXP)) + minEXP;
                }

                giveEXP = Math.floor(Math.random() * (maxEXP - minEXP)) + minEXP;

                if(player.coins += giveCoins) {
                        player.coins++;
                }

                if(player.exp += giveEXP) {
                        player.exp++;
                }

                client.setPlayer.run(player);

                var mineItems = [
                        "Copper",
                        "Tin",
                        "Iron",
                        "Silver",
                        "Gold",
                        "Mithril",
                        "Adamantite",
                        "Rune"
                ]

                var giveItem = mineItems[Math.floor(Math.random()*mineItems.length)];

                const embed = new Discord.RichEmbed()

                .setTitle(`${message.author.username} went mining.`)
                .setThumbnail(message.author.avatarURL)
                .setColor(0x993300)
                .setDescription(`You swing your pickaxe feriously and gained **${giveItem}**! Also, you gained ${giveCoins} coins and ${giveEXP} experience from mining.`)

                return message.channel.send({embed});
        }
        
        
        /**
         *   Fishing Command. This command allows users to gain some experience and money.
         */
        if(command === "fish") {
                let player;

                player = client.getPlayer.get(message.author.id, message.guild.id);

                minCoins = 100;
                maxCoins = 500;
                minEXP   = 10;
                maxEXP   = 50;

                function getRandomInt(minCoins, maxCoins) {
                        min = Math.ceil(minCoins);
                        max = Math.floor(maxCoins);
                        return Math.floor(Math.random() * (maxCoins - minCoins)) + minCoins;
                }

                giveCoins = Math.floor(Math.random() * (maxCoins - minCoins)) + minCoins;

                function getRandomInt(minEXP, maxEXP) {
                        min = Math.ceil(minEXP);
                        max = Math.floor(maxEXP);
                        return Math.floor(Math.random() * (maxEXP - minEXP)) + minEXP;
                }

                giveEXP = Math.floor(Math.random() * (maxEXP - minEXP)) + minEXP;

                if(player.coins += giveCoins) {
                        player.coins++;
                }

                if(player.exp += giveEXP) {
                        player.exp++;
                }

                client.setPlayer.run(player);

                var fishItems = [
                        "Tuna",
                        "Salmon",
                        "Lobster",
                        "Shrimp",
                        "Cod",
                        "Bass",
                        "Shark",
                ]

                var giveItem = fishItems[Math.floor(Math.random()*fishItems.length)];

                const embed = new Discord.RichEmbed()

                .setTitle(`${message.author.username} went fishing.`)
                .setThumbnail(message.author.avatarURL)
                .setColor(0x3399FF)
                .setDescription(`You sat at the lake all day and after waiting gained **${giveItem}**! Also, you gained ${giveCoins} coins and ${giveEXP} experience from fishing.`)

                return message.channel.send({embed});
        }
        
        
        /**
         *   Woodcutting Command. This command allows you to gain some experience and money.
         */
        if(command === "chop" || command === "woodcut") {
                let player;

                player = client.getPlayer.get(message.author.id, message.guild.id);

                minCoins = 100;
                maxCoins = 500;
                minEXP   = 10;
                maxEXP   = 50;

                function getRandomInt(minCoins, maxCoins) {
                        min = Math.ceil(minCoins);
                        max = Math.floor(maxCoins);
                        return Math.floor(Math.random() * (maxCoins - minCoins)) + minCoins;
                }

                giveCoins = Math.floor(Math.random() * (maxCoins - minCoins)) + minCoins;

                function getRandomInt(minEXP, maxEXP) {
                        min = Math.ceil(minEXP);
                        max = Math.floor(maxEXP);
                        return Math.floor(Math.random() * (maxEXP - minEXP)) + minEXP;
                }

                giveEXP = Math.floor(Math.random() * (maxEXP - minEXP)) + minEXP;

                if(player.coins += giveCoins) {
                        player.coins++;
                }

                if(player.exp += giveEXP) {
                        player.exp++;
                }

                client.setPlayer.run(player);

                var treeItems = [
                        "Maple",
                        "Oak",
                        "Birch",
                        "Magic",
                        "Willow",
                        "Yew"
                ]

                var giveItem = treeItems[Math.floor(Math.random()*treeItems.length)];

                const embed = new Discord.RichEmbed()

                .setTitle(`${message.author.username} went woodcutting.`)
                .setThumbnail(message.author.avatarURL)
                .setColor(0x66CC33)
                .setDescription(`You finally yelled TIMBER while the tree fell. You gained **${giveItem}** Logs! Also, you gained ${giveCoins} coins and ${giveEXP} experience from woodcutting.`)

                return message.channel.send({embed});
        }
        
        
        /**
         *   Rank Command. This command allows members to check their current level and points.
         */
        if(command === "rank") {
                const embed = new Discord.RichEmbed()

                .setTitle(`${message.author.username}'s Experience`)
                .setThumbnail(message.author.avatarURL)
                .setColor(0xFF6600)
                .addField('Current Level:', player.level, true)
                .addField('Current Experience:', player.exp, true)

                return message.channel.send({embed});
        }
        
        
        /**
         *   Leaderboard Command. This command allows members to view the leaderboard for the server they are in.
         */
        //if(command == "richest") {
        //        const top10 = sql.prepare("SELECT * FROM players WHERE guild = ? ORDER BY coins DESC LIMIT 10;").all(message.guild.id);
        //
        //        const embed = new Discord.RichEmbed()
        //        .setTitle("Server Leaderboard")
        //        .setColor(0xFF6600);
        //
        //        for(const data of top10) {
        //                embed.addField(client.users.get(data.user).username, data.coins, true);
        //        }
        //
        //        return message.channel.send({embed});
        //}
        
        
        /**
         *   Ping Command. This command gets the current latency of the bot to the Discord API.
         */
        if(command === "ping") {
                const embed = new Discord.RichEmbed()
                .setTitle("Current latency")
                .setThumbnail(message.author.avatarURL)
                .setColor(0xFF6600)
                .setDescription(`My current latency is ${Math.round(client.ping)}ms.`)

                return message.channel.send({embed});
        }
        
        
        /**
         *   Admin EXP Give Command. This command allows an Admin to give experience to a member of a server.
         */
        if(command === "adminexp") {
                if(!message.author.id == '144284575072256000') return message.reply('You need to be a bot admin to use this command.');
                
                const user = message.mentions.users.first() || client.users.get(args[0]);
                if(!user) return message.reply('You forgot to mention the person who you want to give experience to.');
                
                const expToAdd = parseInt(args[1], 10);
                if(!expToAdd) return message.reply('You forgot the amount of experience to give.');
                        
                let player = client.getPlayer.get(user.id, message.guild.id);
                if (!player) {
                        player = { id: `${message.guild.id}-${user.id}`, user: user.id, guild: message.guild.id, exp: 0, level: 1, coins: 1000, hp: 10, mhand: 0, ohand: 0, armor: 0, accessory: 0 }
                }
                
                player.exp += expToAdd;
                
                let playerLevel = Math.floor(0.1 * Math.sqrt(player.exp));
                player.level = playerLevel;
                
                client.setPlayer.run(player);
                
                return message.channel.send(`${user} has recieved ${expToAdd} points and now is level ${player.level}.`)
        }
        
        
        /**
         *   Admin coins Give Command. This command allows an Admin to give coins to a member of a server.
         */
        if(command === "admincoins") {
                if(!message.author.id == '144284575072256000') return message.reply('You need to be a bot admin to use this command.');
                
                const user = message.mentions.users.first() || client.users.get(args[0]);
                if(!user) return message.reply('You forgot to mention the person who you want to give coins to.');
                
                const coinsToAdd = parseInt(args[1], 10);
                if(!coinsToAdd) return message.reply('You forgot the amount of coins to give.');
                        
                let player = client.getPlayer.get(user.id, message.guild.id);
                if (!player) {
                        player = { id: `${message.guild.id}-${user.id}`, user: user.id, guild: message.guild.id, exp: 0, level: 1, coins: 1000, hp: 10, mhand: 0, ohand: 0, armor: 0, accessory: 0 }
                }
                
                player.coins += coinsToAdd;
                
                client.setPlayer.run(player);
                
                return message.channel.send(`${user} has recieved ${coinsToAdd} points and now has ${player.coins}.`)
        }
});

client.login(config.token);
