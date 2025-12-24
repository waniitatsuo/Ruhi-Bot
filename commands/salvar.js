const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { downloadMediaMessage } = require('@whiskeysockets/baileys'); 
const settings = require('../settings'); 

async function salvarCommand(sock, chatId, message) {
    
    // 1. Verificação de Dono (Permite que qualquer dono da lista use)
    const senderNumber = message.key.participant || message.key.remoteJid;
    
    // Garante que a lista de donos seja um Array
    let owners = settings.ownerNumber;
    if (!Array.isArray(owners)) owners = [owners];

    // Limpa o número de quem enviou
    const senderClean = senderNumber.split('@')[0].split(':')[0].replace(/\D/g, '');

    // Verifica se quem enviou está na lista
    const isOwner = owners.some(dono => {
        const donoClean = dono.toString().replace(/\D/g, '');
        return senderClean === donoClean;
    });

    if (!isOwner) {
        await sock.sendMessage(chatId, { text: "⛔ Apenas donos podem salvar arquivos." }, { quoted: message });
        return;
    }

    // 2. Lógica de Pastas
    const texto = message.message?.conversation || message.message?.extendedTextMessage?.text || "";
    const args = texto.trim().split(/\s+/);
    const subPastaNome = args[1] ? args[1].toLowerCase() : null;

    const pastasPermitidas = ['gay', 'opiniao']; 
    let pastaDestino;

    if (!subPastaNome || !pastasPermitidas.includes(subPastaNome)) {
        const listaFormatada = pastasPermitidas.map(p => `• ${p}`).join('\n');
        await sock.sendMessage(chatId, { 
            text: `❌ *Erro! Escolha uma pasta válida.*\n\nPastas:\n${listaFormatada}\n\nUse: *.salvar [pasta]*` 
        }, { quoted: message });
        return; 
    }

    pastaDestino = path.join(__dirname, '..', 'media', 'images', subPastaNome);

    // 3. Verifica imagem
    const isImage = message.message?.imageMessage;
    const isQuotedImage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

    if (!isImage && !isQuotedImage) {
        await sock.sendMessage(chatId, { text: "⚠️ Mande uma imagem com .salvar [pasta]" }, { quoted: message });
        return;
    }

    try {
        if (!fs.existsSync(pastaDestino)) {
            fs.mkdirSync(pastaDestino, { recursive: true });
        }

        // Numeração Sequencial
        const arquivosExistentes = fs.readdirSync(pastaDestino);
        const numerosUsados = arquivosExistentes
            .map(arquivo => {
                const match = arquivo.match(/^response_(\d+)\./);
                return match ? parseInt(match[1]) : 0;
            });

        const maiorNumero = numerosUsados.length > 0 ? Math.max(...numerosUsados) : 0;
        const novoNumero = maiorNumero + 1;
        const nomeArquivo = `response_${novoNumero}.webp`;

        // Download
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

        // Conversão
        const bufferWebp = await sharp(bufferOriginal)
            .resize(512, 512, { fit: 'fill' })
            .webp({ quality: 80 })
            .toBuffer();

        // Salva arquivo
        const caminhoFinal = path.join(pastaDestino, nomeArquivo);
        fs.writeFileSync(caminhoFinal, bufferWebp);

        // --- BACKUP NO PRIVADO (PARA O 2º DONO) ---
        
        // Pega o segundo dono da lista (índice 1)
        // Se não existir segundo dono, pega o primeiro (índice 0) pra não dar erro
        const donoAlvo = owners[1] ? owners[1] : owners[0];
        
        // Limpa e formata o JID
        const donoAlvoClean = donoAlvo.toString().replace(/\D/g, '');
        const donoJid = `${donoAlvoClean}@s.whatsapp.net`;
        
        await sock.sendMessage(donoJid, { 
            document: bufferWebp, 
            mimetype: 'image/webp',
            fileName: nomeArquivo,
            caption: `📦 *Backup Automático*\n\n📂 Pasta: ${subPastaNome}\n📄 Arquivo: ${nomeArquivo}`
        });

        // Confirmação no Grupo
        await sock.sendMessage(chatId, { 
            text: `✅ *Salvo na pasta ${subPastaNome.toUpperCase()}!*\n📄 Arquivo: *${nomeArquivo}*\n_Backup enviado para o Admin Secundário._` 
        }, { quoted: message });

    } catch (erro) {
        console.error("Erro ao salvar:", erro);
        await sock.sendMessage(chatId, { text: "❌ Erro ao processar imagem." }, { quoted: message });
    }
}

module.exports = salvarCommand;