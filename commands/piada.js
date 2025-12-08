// Importa suas libs de dados
const listaPiadas = require('../lib/piada'); 
const listaAudios = require('../lib/risadasData'); 

async function piadaCommand(sock, chatId, message) {
    
    // --- LÓGICA DE ALVO (Igual ao .rir) ---
    // 1. O padrão é responder quem mandou o comando (.piada)
    let messageToQuote = message;
    
    // 2. Verificamos se é uma resposta a outra mensagem
    const quotedContext = message.message?.extendedTextMessage?.contextInfo;

    if (quotedContext && quotedContext.quotedMessage) {
        // Se for resposta, mudamos o alvo para a mensagem original
        messageToQuote = {
            key: {
                remoteJid: chatId,
                id: quotedContext.stanzaId,      // ID da mensagem antiga
                participant: quotedContext.participant // Quem mandou a mensagem antiga
            },
            message: quotedContext.quotedMessage
        };
    }

    // --- PASSO 1: Envia a Piada (TEXTO) ---
    // Aqui usamos o messageToQuote para marcar a pessoa certa
    const textoSorteado = listaPiadas[Math.floor(Math.random() * listaPiadas.length)];

    await sock.sendMessage(chatId, { 
        text: textoSorteado 
    }, { quoted: messageToQuote }); // 👈 Marca o alvo calculado acima


    // --- PASSO 2: Envia a Risada (ÁUDIO) ---
    // Aqui NÃO usamos quoted, para o áudio ir solto logo em seguida
    if (listaAudios.length > 0) {
        const audioSorteado = listaAudios[Math.floor(Math.random() * listaAudios.length)];

        await sock.sendMessage(chatId, { 
            audio: { url: audioSorteado }, 
            mimetype: 'audio/mp4', 
            ptt: true // Manda como Nota de Voz (verde)
        }); 
        // ⚠️ Sem { quoted: ... } aqui, então ele não marca ninguém.
    }
}

module.exports = piadaCommand;