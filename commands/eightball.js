const eightBallResponses = [
    "*SIM COM CERTEZA*",
    "*Nem ferrando*",
    "*Pergunte depois*",
    "*Isso é certeza*",
    "*Bem duvidoso...",
    "*Nenhum pouco duvidoso",
    "*Minha resposta é não.",
    "*Os sinais dizem que sim.*"
];

async function eightBallCommand(sock, chatId, question) {
    if (!question) {
        await sock.sendMessage(chatId, { text: 'Pergunte-me algo seu betinha! 🐯' });
        return;
    }

    const randomResponse = eightBallResponses[Math.floor(Math.random() * eightBallResponses.length)];
    await sock.sendMessage(chatId, { text: `🎱 ${randomResponse}` });
}

module.exports = { eightBallCommand };
