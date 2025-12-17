const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    const helpMessage = `
╔═══════════════════╗
   *🐯 ${settings.botName}*  
   Version: *${settings.version}*
   by ${settings.botOwner}
   YT : ${global.ytch}
╚═══════════════════╝

*Comandos válidos:*

╔═══════════════════╗
🌐 *General Commands*:
║ ➤ .ping
║ ➤ .owner
║ ➤ .quote
║ ➤ .lyrics <titulo da música> 
║ ➤ .groupinfo 
║ ➤ .staff ou .admins 
║ ➤ .vv ou .dxeuver (visu única)
╚═══════════════════╝ 

╔═══════════════════╗
👮‍♂️ *Admin Commands*:
║ ➤ .ban @user
║ ➤ .promote @user
║ ➤ .demote @user
║ ➤ .mute <minutes>
║ ➤ .unmute
║ ➤ .delete or .del
║ ➤ .kick @user
║ ➤ .warnings @user
║ ➤ .warn @user
║ ➤ .antilink
║ ➤ .antibadword
║ ➤ .clear
║ ➤ .tag <message>
║ ➤ .tagall
║ ➤ .tagnotadmin
║ ➤ .hidetag <message>
║ ➤ .chatbot
║ ➤ .resetlink
║ ➤ .antitag <on/off>
║ ➤ .welcome <on/off>
║ ➤ .goodbye <on/off>
║ ➤ .setgdesc <description>
║ ➤ .setgname <new name>
║ ➤ .setgpp (reply to image)
║ ➤ .salvar (sticker para resposta)
╚═══════════════════╝

╔═══════════════════╗
🔒 *Owner Commands*:
║ ➤ .mode <public/private>
║ ➤ .clearsession
║ ➤ .antidelete
║ ➤ .cleartmp
║ ➤ .update
║ ➤ .settings
║ ➤ .setpp <reply to image>
║ ➤ .autoreact <on/off>
║ ➤ .autostatus <on/off>
║ ➤ .autostatus react <on/off>
║ ➤ .autotyping <on/off>
║ ➤ .autoread <on/off>
║ ➤ .anticall <on/off>
║ ➤ .pmblocker <on/off/status>
║ ➤ .pmblocker setmsg <text>
║ ➤ .setmention <reply to msg>
║ ➤ .mention <on/off>
╚═══════════════════╝

╔═══════════════════╗
🎨 *Image/Sticker Commands*:
║ ➤ .simage <reply to sticker> 
║ ➤ .sticker <reply to image>
║ ➤ .crop <reply to image>
║ ➤ .tgsticker <Link>
║ ➤ .take <packname> 
║ ➤ .igs <insta link>
║ ➤ .igsc <insta link>
╚═══════════════════╝  

╔═══════════════════╗
🎮 *Game Commands*:
║ ➤ .jogodavelha @user
║ ➤ .termo
╚═══════════════════╝

╔═══════════════════╗
🎯 *Fun Commands*:
║ ➤ .opine
║ ➤ .rir
║ ➤ .piada
║ ➤ .8ball <question>
║ ➤ .img
╚═══════════════════╝

╔═══════════════════╗
📥 *Downloader*:
║ ➤ .play <song_name>
║ ➤ .song <song_name>
║ ➤ .spotify <query>
║ ➤ .instagram <link>
║ ➤ .facebook <link>
║ ➤ .tiktok <link>
║ ➤ .video <song name>
║ ➤ .ytmp4 <Link>
╚═══════════════════╝

╔═══════════════════╗
🧩 *MISC*:
║ ➤ .tweet
║ ➤ .ytcomment 
╚═══════════════════╝`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.png');
        
        const buttons = [
            { buttonId: 'Canal', buttonText: { displayText: '📢 Entre no Canal' }, type: 1 },
            { buttonId: 'Dono', buttonText: { displayText: '📞 Dono' }, type: 1 },
            { buttonId: 'Suporte', buttonText: { displayText: '🔗 Suporte' }, type: 1 }
        ];

        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: helpMessage,
                buttons: buttons,
                headerType: 1
            }, { quoted: message });
        } else {
            console.error('Bot image not found at:', imagePath);
            await sock.sendMessage(chatId, { 
                text: helpMessage,
                buttons: buttons,
                headerType: 1
            });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage });
    }
}

module.exports = helpCommand;