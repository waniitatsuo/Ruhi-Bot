const risadasAudio = require('../lib/risadasData');
const risadasTexto = require('../lib/rir');

// pega risada random no /lib/rir e escreve no chat, ele marca a mensagem da pessoa que usou o .rir, e também marca a pessoa que ela 
// quis usar o .rir, tanto ri sozinho, e também manda audio!!!!!!!
async function rirCommand(sock, chatId, message) {
    
    let messageToQuote = message;

    const quotedContext = message.message?.extendedTextMessage?.contextInfo;

    if (quotedContext && quotedContext.quotedMessage) {
        messageToQuote = {
            key: {
                remoteJid: chatId,
                id: quotedContext.stanzaId,
                participant: quotedContext.participant
            },
            message: quotedContext.quotedMessage
        };
    }

    console.log(risadasAudio.length);
    // --- CONFIGURAÇÃO ---
    
    // 1. Defina a chance de ser áudio (0.3 = 30%, 0.5 = 50%, etc.)
    const chanceDeAudio = 0.3; 

    const sorteio = Math.random(); // Gera um número entre 0.0 e 1.0

    if (sorteio < chanceDeAudio && risadasAudio.length > 0) {
        // >>> VAI MANDAR ÁUDIO <<<
        
        const audioEscolhido = risadasAudio[Math.floor(Math.random() * risadasAudio.length)];


        await sock.sendMessage(chatId, { 
            audio: { url: audioEscolhido }, // Lê o arquivo do caminho
            mimetype: 'audio/mp4',          // Formato padrão do WhatsApp
            ptt: true                       // ptt: true = Envia como "Nota de Voz" (microfone verde)
        }, { quoted: messageToQuote });

    } else {
        // >>> VAI MANDAR TEXTO <<<
        
        const textoEscolhido = risadasTexto[Math.floor(Math.random() * risadasTexto.length)];

        await sock.sendMessage(chatId, { 
            text: textoEscolhido 
        }, { quoted: messageToQuote });
    }
}

module.exports = rirCommand;