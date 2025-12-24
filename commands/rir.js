const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// Configura o ffmpeg para usar o binário portátil
ffmpeg.setFfmpegPath(ffmpegPath);

const risadasAudio = require('../lib/risadasData');
const risadasTexto = require('../lib/rir');

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

    // --- CONFIGURAÇÃO ---
    const chanceDeAudio = 0.3; 
    const sorteio = Math.random(); 

    if (sorteio < chanceDeAudio && risadasAudio.length > 0) {
        // >>> MODO ÁUDIO (CORRIGIDO PARA IOS/IPHONE) <<<
        
        const audioEscolhido = risadasAudio[Math.floor(Math.random() * risadasAudio.length)];
        
        // Pasta temporária
        const tempFolder = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder, { recursive: true });

        // Nome do arquivo .ogg (Container obrigatório do WhatsApp)
        const outputFilename = `risada_${Date.now()}.ogg`;
        const outputPath = path.join(tempFolder, outputFilename);

        try {
            await new Promise((resolve, reject) => {
                ffmpeg(audioEscolhido)
                    .audioCodec('libopus')   // Codec OBRIGATÓRIO: OPUS
                    .audioChannels(1)        // OBRIGATÓRIO: Mono (iPhone odeia PTT estéreo)
                    .audioFrequency(48000)   // OBRIGATÓRIO: 48kHz (Qualidade padrão Opus)
                    .audioBitrate('128k')    // Bitrate estável
                    .toFormat('ogg')         // Container OGG
                    .save(outputPath)
                    .on('end', () => resolve())
                    .on('error', (err) => reject(err));
            });

            // Verifica se o arquivo foi criado e tem tamanho maior que 0
            const stats = fs.statSync(outputPath);
            if (stats.size === 0) {
                throw new Error('Arquivo de áudio gerado está vazio.');
            }

            // Envia como PTT (Nota de voz)
            await sock.sendMessage(chatId, { 
                audio: fs.readFileSync(outputPath), 
                mimetype: 'audio/ogg; codecs=opus', 
                ptt: true 
            }, { quoted: messageToQuote });

            // Limpa o arquivo
            fs.unlinkSync(outputPath);

        } catch (error) {
            console.error('❌ Erro ao converter áudio para iPhone:', error.message);
            
            // Fallback: Se der erro, manda o áudio original como ARQUIVO (não PTT)
            // Isso garante que pelo menos dê para ouvir, mesmo que sem a bolinha verde
            try {
                 await sock.sendMessage(chatId, { 
                    audio: { url: audioEscolhido }, 
                    mimetype: 'audio/mp4',
                    ptt: true // Manda como música normal pra não bugar
                }, { quoted: messageToQuote });
            } catch (err2) {
                // Se tudo falhar, manda texto
                const textoErro = risadasTexto[Math.floor(Math.random() * risadasTexto.length)];
                await sock.sendMessage(chatId, { text: textoErro }, { quoted: messageToQuote });
            }
            
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }

    } else {
        // >>> MODO TEXTO <<<
        const textoEscolhido = risadasTexto[Math.floor(Math.random() * risadasTexto.length)];
        await sock.sendMessage(chatId, { text: textoEscolhido }, { quoted: messageToQuote });
    }
}

module.exports = rirCommand;