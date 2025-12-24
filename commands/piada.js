const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// Configura o ffmpeg portátil (igual fizemos no rirCommand)
ffmpeg.setFfmpegPath(ffmpegPath);

// Importa suas libs de dados
const listaPiadas = require('../lib/piada'); 
const listaAudios = require('../lib/risadasData'); 

async function piadaCommand(sock, chatId, message) {
    
    // --- LÓGICA DE ALVO ---
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

    // --- PASSO 1: Envia a Piada (TEXTO) ---
    // Envia o texto primeiro para garantir a interação rápida
    const textoSorteado = listaPiadas[Math.floor(Math.random() * listaPiadas.length)];

    await sock.sendMessage(chatId, { 
        text: textoSorteado 
    }, { quoted: messageToQuote }); // Marca a pessoa certa


    // --- PASSO 2: Envia a Risada (ÁUDIO OTIMIZADO) ---
    if (listaAudios.length > 0) {
        const audioSorteado = listaAudios[Math.floor(Math.random() * listaAudios.length)];

        // Configuração da pasta temporária
        const tempFolder = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder, { recursive: true });

        // Nome do arquivo (OGG para funcionar nota de voz)
        const outputFilename = `piada_risada_${Date.now()}.ogg`;
        const outputPath = path.join(tempFolder, outputFilename);

        try {
            // Conversão Pesada (O Segredo do iPhone)
            await new Promise((resolve, reject) => {
                ffmpeg(audioSorteado)
                    .audioCodec('libopus')   // Codec
                    .audioChannels(1)        // Mono (Vital para iOS)
                    .audioFrequency(48000)   // 48kHz (Padrão Opus)
                    .audioBitrate('128k')
                    .toFormat('ogg')
                    .save(outputPath)
                    .on('end', () => resolve())
                    .on('error', (err) => reject(err));
            });

            // Envia como Nota de Voz (Bolinha Verde)
            await sock.sendMessage(chatId, { 
                audio: fs.readFileSync(outputPath), 
                mimetype: 'audio/ogg; codecs=opus', 
                ptt: true // Agora o iPhone aceita!
            }); 
            // Sem { quoted: ... } aqui, conforme seu pedido original.

            // Limpeza
            fs.unlinkSync(outputPath);

        } catch (error) {
            console.error('❌ Erro no áudio da piada:', error.message);
            
            // Fallback: Se a conversão falhar, tenta mandar o áudio original sem ser nota de voz
            // Assim a pessoa pelo menos ouve a risada, mesmo que não fique "bonitinho"
            try {
                await sock.sendMessage(chatId, { 
                    audio: { url: audioSorteado }, 
                    mimetype: 'audio/mp4', 
                    ptt: false // Manda como arquivo de áudio normal
                });
            } catch (err2) {
                console.error('Falha total no envio do áudio');
            }

            // Limpa arquivo se existir
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }
    }
}

module.exports = piadaCommand;