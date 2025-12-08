const isAdmin = require('../lib/isAdmin');

async function muteCommand(sock, chatId, senderId, message, durationInMinutes) {
    

    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
    if (!isBotAdmin) {
        await sock.sendMessage(chatId, { text: '❌ ME DA ADMMM 😭😭😭😭😭😭😭😭' }, { quoted: message });
        return;
    }

    if (!isSenderAdmin) {
        await sock.sendMessage(chatId, { text: '❌ Só ADM pode usar esse comando, seu beta.' }, { quoted: message });
        return;
    }

    try {
        // Mute the group
        await sock.groupSettingUpdate(chatId, 'announcement');
        
        if (durationInMinutes !== undefined && durationInMinutes > 0) {
            const durationInMilliseconds = durationInMinutes * 60 * 1000;
            await sock.sendMessage(chatId, { text: `🥱 O grupo foi mutado por ${durationInMinutes} minutos.` }, { quoted: message });
            
            // Set timeout to unmute after duration
            setTimeout(async () => {
                try {
                    await sock.groupSettingUpdate(chatId, 'not_announcement');
                    await sock.sendMessage(chatId, { text: '🥱 O grupo está mutado.' });
                } catch (unmuteError) {
                    console.error('Error unmuting group:', unmuteError);
                }
            }, durationInMilliseconds);
        } else {
            await sock.sendMessage(chatId, { text: '🥱 O grupo está mutado.' }, { quoted: message });
        }
    } catch (error) {
        console.error('Error muting/unmuting the group:', error);
        await sock.sendMessage(chatId, { text: '❌ Ocorreu um erro durante o mute/demute do grupo. Por favor tente de novo.' }, { quoted: message });
    }
}

module.exports = muteCommand;
