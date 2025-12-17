const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { downloadMediaMessage } = require('@whiskeysockets/baileys'); 
const settings = require('../settings'); 

async function salvarCommand(sock, chatId, message) {
    
    // 1. Verificação de Dono
    const senderNumber = message.key.participant || message.key.remoteJid;
    const donoLimpo = settings.ownerNumber.replace(/\D/g, '');
    const isOwner = senderNumber.includes(donoLimpo); 

    if (!isOwner) {
        await sock.sendMessage(chatId, { text: "⛔ Apenas o dono pode salvar arquivos." }, { quoted: message });
        return;
    }

    // 2. Lógica de Pastas (TRAVA RIGOROSA)
    const texto = message.message?.conversation || message.message?.extendedTextMessage?.text || "";
    const args = texto.trim().split(/\s+/);
    const subPastaNome = args[1] ? args[1].toLowerCase() : null;

    // A lista exata de pastas
    const pastasPermitidas = ['gay', 'opiniao']; 
    let pastaDestino;

    // AQUI MUDOU: Verifica se a pasta existe E se está na lista permitida
    if (!subPastaNome || !pastasPermitidas.includes(subPastaNome)) {
        // Se cair aqui, é porque não digitou nada OU digitou errado
        const listaFormatada = pastasPermitidas.map(p => `• ${p}`).join('\n');
        
        await sock.sendMessage(chatId, { 
            text: `❌ *Erro! Você precisa escolher uma pasta válida.*\n\nPastas disponíveis:\n${listaFormatada}\n\nUse: *.salvar [nome_da_pasta]*` 
        }, { quoted: message });
        return; // Para o código aqui. Não salva nada.
    }

    // Se passou da trava acima, define o caminho
    pastaDestino = path.join(__dirname, '..', 'media', 'images', subPastaNome);

    // 3. Verifica se tem imagem
    const isImage = message.message?.imageMessage;
    const isQuotedImage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

    if (!isImage && !isQuotedImage) {
        await sock.sendMessage(chatId, { text: "⚠️ Mande uma imagem com .salvar [pasta]" }, { quoted: message });
        return;
    }

    try {
        // Garante que a pasta existe
        if (!fs.existsSync(pastaDestino)) {
            fs.mkdirSync(pastaDestino, { recursive: true });
        }

        // --- NUMERAÇÃO SEQUENCIAL ---
        const arquivosExistentes = fs.readdirSync(pastaDestino);
        const numerosUsados = arquivosExistentes
            .map(arquivo => {
                const match = arquivo.match(/^sticker_(\d+)\./);
                return match ? parseInt(match[1]) : 0;
            });

        const maiorNumero = numerosUsados.length > 0 ? Math.max(...numerosUsados) : 0;
        const novoNumero = maiorNumero + 1;
        const nomeArquivo = `sticker_${novoNumero}.webp`;

        // --- DOWNLOAD ---
        let messageToDownload = message;
        if (isQuotedImage) {
            messageToDownload = {
                message: message.message.extendedTextMessage.contextInfo.quotedMessage
            };
        }

        const bufferOriginal = await downloadMediaMessage(
            messageToDownload,
            'buffer',
            {},
            { logger: console }
        );

        // --- CONVERSÃO AUTOMÁTICA (SHARP) ---
        const bufferWebp = await sharp(bufferOriginal)
            .resize(512, 512, { 
                fit: 'fill' 
            })
            .webp({ quality: 80 })
            .toBuffer();

        // Salva no disco
        const caminhoFinal = path.join(pastaDestino, nomeArquivo);
        fs.writeFileSync(caminhoFinal, bufferWebp);

        // --- BACKUP NO PRIVADO DO DONO ---
        const donoJid = `${donoLimpo}@s.whatsapp.net`;
        
        await sock.sendMessage(donoJid, { 
            document: bufferWebp, 
            mimetype: 'image/webp',
            fileName: nomeArquivo,
            caption: `📦 *Backup WebP*\n\n📂 Pasta: ${subPastaNome}\n📄 Arquivo: ${nomeArquivo}`
        });

        // --- CONFIRMAÇÃO NO GRUPO ---
        await sock.sendMessage(chatId, { 
            text: `✅ *Salvo na pasta ${subPastaNome.toUpperCase()}!*\n📄 Arquivo: *${nomeArquivo}*\n_Backup enviado no PV!_` 
        }, { quoted: message });

    } catch (erro) {
        console.error("Erro ao salvar:", erro);
        await sock.sendMessage(chatId, { text: "❌ Erro ao converter/salvar a imagem." }, { quoted: message });
    }
}

module.exports = salvarCommand;