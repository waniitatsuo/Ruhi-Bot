const isAdmin = require('../lib/isAdmin');

async function tagNotAdminCommand(sock, chatId, senderId, message) {
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: '*Me da adm fi :(*' }, { quoted: message });
            return;
        }

        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '*Só ADMS podem usar o comando .tagnotadmin*' }, { quoted: message });
            return;
        }

        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants || [];

        const nonAdmins = participants.filter(p => !p.admin).map(p => p.id);
        if (nonAdmins.length === 0) {
            await sock.sendMessage(chatId, { text: 'Não tem "não-adms" para marcar.' }, { quoted: message });
            return;
        }

        let text = '🔊 *ACORRRDA K7777777777777:*\n\n';
        nonAdmins.forEach(jid => {
            text += `@${jid.split('@')[0]}\n`;
        });

        await sock.sendMessage(chatId, { text, mentions: nonAdmins }, { quoted: message });
    } catch (error) {
        console.error('Error in tagnotadmin command:', error);
        await sock.sendMessage(chatId, { text: 'Deu ruim pra marcar os não admins.' }, { quoted: message });
    }
}

module.exports = tagNotAdminCommand;


