const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const SQLite = require("better-sqlite3");
const sql = new SQLite('./players.sqlite');
const cooldowns = new Discord.Collection();
client.commands = new Discord.Collection();

/**
 *   Project:  Magikarp Bot
 *   Version:  1.0.0 Developmental 1
 *   Authors:  Traven <@TravenWest or Traven#1337>
 *   License:  MIT License
 *   
 *   Welcome to the main file of the Magikarp Bot. This file contains the all
 *   of the commands, functions, and everything that we need for the bot to
 *   work. I also explain each function and important point of code for people
 *   to be able to help me with expanding the bot and making it better.
 *   
 *   This bot was made for fun and a good use for my personal Discord server. It
 *   is also open source for anyone else who wants to contribute to it or even work
 *   their own commands, ideas, and whatever else they add to it.
 */

client.on("ready", () => {
        
        console.log(`Logged in as Magikarp Bot. Serving ${client.users.size} people on ${client.guilds.size} servers.`);
        client.user.setActivity(`Splashing ${client.users.size} people!`);
        
        const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'players';").get();

        if (!table['count(*)']) {
                sql.prepare("CREATE TABLE players (id TEXT PRIMARY KEY, user TEXT, guild TEXT, level INTEGER, exp INTEGER, coins INTEGER, health INTEGER, attack INTEGER, defense INTEGER);").run();
                sql.prepare("CREATE UNIQUE INDEX idx_players_id ON players (id);").run();
                sql.pragma("synchronous = 1");
                sql.pragma("journal_mode = wal");
        }
        
        client.getPlayer = sql.prepare("SELECT * FROM players WHERE user = ? AND guild = ?");
        client.setPlayer = sql.prepare("INSERT OR REPLACE INTO players (id, user, guild, level, exp, coins, health, attack, defense) VALUES (@id, @user, @guild, @level, @exp, @coins, @health, @attack, @defense);");
        
});


/**
 *   This function adds to the total people being splashed by Magikarp when the
 *   bot is invited to a new server. In the console, it will also give a small
 *   amount of information related to the server joined.
 */
client.on("guildCreate", guild => {
        
        console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
        client.user.setActivity(`Splashing ${client.users.size} people!`);
        
});

/**
 *   This function removes the total people in a server being splashed by Magikarp
 *   bot. The total will update based on the amount of people in the server when the
 *   bot is removed. It also provides a small amount of information regarding the
 *   server in the console.
 */
client.on("guildDelete", guild => {
        
        console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
        client.user.setActivity(`Splashing ${client.users.size} people!`);
        
});


/**
 *   Final Warning. There is a lot going on below. I seriously mean a lot. Make
 *   sure to read all documentation below to understand what is going on exactly
 *   in the code. The code for all of the commands for the bot is below. Each
 *   command is documented as best as I could do.
 *   
 *   Remember, this is your final warning when it comes to reading below.
 */
client.on("message", message => {
        
        /**
         *   The following line of code will keep bots from causing bot inception from happening. We
         *   do not need Magikarp responding to any other bot.
         */
        if (message.author.bot) return;
        
        
        /**
         *   Experience Function.
         *   
         *   The following code setups players and gives experience to them when they post a message
         *   in the discord server. First, we check to see if the Discord member has a character in
         *   the database. If not, we insert default information into the database for them. Next, we
         *   setup an experience modifier to adjust if needed before we reach 1.0.0 Gold. When the
         *   Discord Member posts a message, it gives a random amount of experience based on the min
         *   and max allowed. Finally, the code checks to see when we need to increase the level based
         *   on how much experience that the member has currently. As all of this happens... the level
         *   and experience gain, we update the database with the new information.
         */
        let player;

        if (message.guild) {
                player = client.getPlayer.get(message.author.id, message.guild.id);

                if (!player) {
                        player = { id: `${message.guild.id}-${message.author.id}`, user: message.author.id, guild: message.guild.id, level: 1, exp: 0, coins: 1000, health: 10, attack: 1, defense: 1 }
                }
                
                /**
                 *   Experience Modifier.
                 *   
                 *   These can be adjusted if we need to make it easier or harder to gain a level
                 *   with the leveling system. The default values that works for the support server
                 *   is min of 5 and max of 15.
                 */
                const curLevel  = Math.floor(0.25 * Math.sqrt(player.exp));
                var giveHealth  = 1;
                var giveAttack  = 1;
                var giveDefense = 1;
                var minEXP      = 5;
                var maxEXP      = 15;
                
                function getRandomInt(minEXP, maxEXP) {
                        min = Math.ceil(minEXP);
                        max = Math.floor(maxEXP);
                }

                giveEXP = Math.floor(Math.random() * (maxEXP - minEXP)) + minEXP;
                
                /**
                 *   TODO:  Cooldown (maybe?)
                 */
                if(player.exp += giveEXP) {
                        player.exp++;
                }
                
                
                if(player.level < curLevel) {
                        player.level++;
                }
                
                if(player.health =+ giveHealth) {
                        player.health++
                }
                
                if(player.attack =+ giveAttack) {
                        player.attack++
                }
                
                if(player.defense =+ giveDefense) {
                        player.defense++
                }

                client.setPlayer.run(player);
        }
        
        /**
         *   Cooldown Function.
         *
         *   This is to prevent spam and abuse when it comes to initing commands from members. It 
         *   will also only allow people to only use the mining, fishing, and woodcutting commands
         *   once per 60 seconds. This can also be modified if needed.
         */
        if (message.content.indexOf(config.prefix) !== 0) return;
        
        const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();
        
        if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 5) * 1000;

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
         *   Prefix Function.
         *   
         *   The following code sets the prefix of the bot. The default prefix is $ for all commands
         *   which are init by Discord members.
         */
        if (message.content.indexOf(config.prefix) !== 0) return;   
         
        /**
         *   Help Command. Lists all bot commands for the user.
         */
        if(command === "help" || command === "support") {
                const embed = new Discord.RichEmbed()
                
                .setTitle('Magikarp Bot\'s Help')
                .setThumbnail(client.user.avatarURL)
                .setColor(0xFF6600)
                .addField('Ping', 'Displays the bot\'s ping.', true)
                .addField('Give', 'Give coins to another user.', true)
                .addField('Chop', 'Go mining!', true)
                .addField('Fish', 'Go fishing!', true)
                .addField('Mine', 'Go woodcutting!', true)
                
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
                .addField('Current Level', player.level, true)
                .addField('Current Experience', player.exp, true)
                .addField('Coins', player.coins, true)
                .addField('Health', player.health, true)
                .addField('Attack', player.attack, true)
                .addField('Defense', player.defense, true)

                return message.channel.send({embed});
        }
        
        /**
         *   Give coins to another member of the server.
         */
        if(command === "give") {  
                let sender;
                sender = client.getPlayer.get(message.author.id, message.guild.id);
                
                if (!sender) {
                        player = { 
                                id: `${message.guild.id}-${message.author.id}`, user: message.author.id, guild: message.guild.id, level: 1, exp: 0, coins: 1000, health: 10, attack: 1, defense: 1 }
                }
                
                const user = message.mentions.users.first() || client.users.get(args[0]);
                if(!user) return message.reply('You forgot to mention someone or give the amount of coins.');
                
                const coinsToAdd = parseInt(args[1], 10);
                if(!coinsToAdd) return message.reply('You forgot the amount of coins to give.');
                // check if theyre trying to remove points.....
                if(coinsToAdd < 0) return message.reply('You cannot remove points, pussy.');
                        
                let player = client.getPlayer.get(user.id, message.guild.id);
                if (!player) {
                        player = { id: `${message.guild.id}-${user.id}`, user: message.author.id, guild: message.guild.id, level: 1, exp: 0, coins: 1000, health: 10, attack: 1, defense: 1 }
                }
                
                sender.coins -= coinsToAdd;
                player.coins += coinsToAdd;
                
                client.setPlayer.run(sender);
                client.setPlayer.run(player);
                
                return message.channel.send(`${user} has recieved ${coinsToAdd} points and now has ${player.coins}.`)
        }
        
        /**
         *   Richest Command.
         */
        if(command == "richest") {
                const top10 = sql.prepare("SELECT * FROM players WHERE guild = ? ORDER BY coins DESC LIMIT 10;").all(message.guild.id);
        
                const embed = new Discord.RichEmbed()
                .setTitle("Richest Players")
                .setColor(0xFF6600);
        
                for(const data of top10) {
                        embed.addField(client.users.get(data.user).username, data.coins, true);
                }
        
                return message.channel.send({embed});
        }
        
	/**
         *   Mining Command.
         */
        if(command === "mine") {
                let player;

                player = client.getPlayer.get(message.author.id, message.guild.id);

                minCoins = 10;
                maxCoins = 100;
                minEXP   = 5;
                maxEXP   = 25;

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
         *   Fishing Command.
         */
        if(command === "fish") {
                let player;

                player = client.getPlayer.get(message.author.id, message.guild.id);

                minCoins = 10;
                maxCoins = 100;
                minEXP   = 5;
                maxEXP   = 25;

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
         *   Woodcutting Command.
         */
        if(command === "chop") {
                let player;

                player = client.getPlayer.get(message.author.id, message.guild.id);

                minCoins = 10;
                maxCoins = 100;
                minEXP   = 5;
                maxEXP   = 25;

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
         *   Administrator's Experience giving command.
         */
        if(command === "adminexp") {
                if(!message.author.id == '144284575072256000') return message.reply('You need to be a bot admin to use this command.');
                
                const user = message.mentions.users.first() || client.users.get(args[0]);
                if(!user) return message.reply('You forgot to mention the person who you want to give experience to.');
                
                const expToAdd = parseInt(args[1], 10);
                if(!expToAdd) return message.reply('You forgot the amount of experience to give.');
                        
                let player = client.getPlayer.get(user.id, message.guild.id);
                if (!player) {
                        player = {  id: `${message.guild.id}-${user.id}`, user: user.id, guild: message.guild.id, level: 1, exp: 0, coins: 1000, health: 10, attack: 1, defense: 1 }
                }
                
                player.exp += expToAdd;
                
                let playerLevel = Math.floor(0.1 * Math.sqrt(player.exp));
                player.level = playerLevel;
                
                client.setPlayer.run(player);
                
                return message.channel.send(`${user} has recieved ${expToAdd} points and now is level ${player.level}.`)
        }
        
        /**
         *   Administrator's Coins give command.
         */
        if(command === "admincoins") {
                if(!message.author.id == '144284575072256000') return message.reply('You need to be a bot admin to use this command.');
                
                const user = message.mentions.users.first() || client.users.get(args[0]);
                if(!user) return message.reply('You forgot to mention the person who you want to give coins to.');
                
                const coinsToAdd = parseInt(args[1], 10);
                if(!coinsToAdd) return message.reply('You forgot the amount of coins to give.');
                        
                let player = client.getPlayer.get(user.id, message.guild.id);
                if (!player) {
                        player = { id: `${message.guild.id}-${user.id}`, user: user.id, guild: message.guild.id, level: 1, exp: 0, coins: 1000, health: 10, attack: 1, defense: 1 }
                }
                
                player.coins += coinsToAdd;
                
                client.setPlayer.run(player);
                
                return message.channel.send(`${user} has recieved ${coinsToAdd} points and now has ${player.coins}.`)
        }
});

client.login(config.token);
