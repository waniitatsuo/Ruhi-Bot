const fs = require('fs');
const path = require('path');

async function verificarGatilhos(sock, chatId, message) {
    try {
        // 1. Extrai o texto da mensagem com segurança
        const texto = message.message?.conversation || 
                      message.message?.extendedTextMessage?.text || 
                      message.message?.imageMessage?.caption || "";

        if (!texto) return; 

        // 2. Palavras-chave (Gatilhos)
        const gatilhos = ['gay', 'boiola', 'la ele', 'lá ele', 'viado', 'baitola', 'la ele boy', 'tchola', 'bicha', 'bixa', 'qualira'];
        
        // Verifica se tem alguma das palavras
        const contemGatilho = gatilhos.some(palavra => texto.toLowerCase().includes(palavra));

        if (contemGatilho) {
            // Caminho da pasta (ajuste os ".." se necessário dependendo de onde salvou esse arquivo)
            const pastaGay = path.join(__dirname, 'media', 'images', 'gay');

            if (!fs.existsSync(pastaGay)) return;

            const arquivos = fs.readdirSync(pastaGay);
            const stickers = arquivos.filter(f => f.endsWith('.webp'));

            if (stickers.length === 0) return;

            // Sorteia o sticker
            const aleatorio = stickers[Math.floor(Math.random() * stickers.length)];
            const caminhoFinal = path.join(pastaGay, aleatorio);

            // --- AQUI ESTÁ A MÁGICA DA MARCAÇÃO ---
            
            // 1. Descobre quem mandou a mensagem (se for grupo pega o participant, se for PV pega o Jid)
            const quemMandou = message.key.participant || message.key.remoteJid;

            await sock.sendMessage(chatId, { 
                sticker: fs.readFileSync(caminhoFinal),
                // Adiciona a pessoa na lista de menções (faz notificar ela)
                mentions: [quemMandou] 
            }, { 
                // Faz o bot responder especificamente a mensagem da pessoa
                quoted: message 
            });
            
            console.log(`[TRIGGER] Respondi o gay ${quemMandou.split('@')[0]} com sticker.`);
        }

    } catch (e) {
        console.error("Erro no gatilho:", e);
    }
}

module.exports = verificarGatilhos;