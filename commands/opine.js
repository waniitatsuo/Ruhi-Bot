const fs = require('fs');
const path = require('path');

module.exports = async (sock, msg) => {
    try {
        const from = msg.key.remoteJid;

        // --- 1. IDENTIFICAR O ALVO (Quem vai tomar a opinada?) ---
        
        // Padrão: O alvo é quem mandou o comando
        let alvo = msg.key.participant || msg.key.remoteJid; 
        
        // Verifica se é uma resposta a outra mensagem (Reply)
        const isReply = msg.message?.extendedTextMessage?.contextInfo?.participant;
        
        // Verifica se houve marcação (@) (Mentions)
        const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;

        if (isReply) {
            // Se respondeu alguém, o alvo vira o dono da mensagem respondida
            alvo = isReply;
        } else if (mentions && mentions.length > 0) {
            // Se marcou alguém (ex: .opine @Joao), o alvo vira o @Joao
            alvo = mentions[0];
        }

        // --- 2. SORTEAR A FIGURINHA ---
        // Vamos usar a pasta de stickers que já estão prontos (WebP)
        const pastaOpiniao = path.join(__dirname, '..', 'media', 'images', 'opiniao');

        if (!fs.existsSync(pastaOpiniao)) {
            return await sock.sendMessage(from, { text: '❌ Pasta de opinião não localizada.' }, { quoted: msg });
        }

        const arquivos = fs.readdirSync(pastaOpiniao);
        const stickers = arquivos.filter(f => f.endsWith('.webp'));

        if (stickers.length === 0) {
            return await sock.sendMessage(from, { text: '❌ A pasta de opiniões está vazia.' }, { quoted: msg });
        }

        const aleatorio = stickers[Math.floor(Math.random() * stickers.length)];
        const caminhoSticker = path.join(pastaOpiniao, aleatorio);

        // --- 3. ENVIAR COM MARCAÇÃO ---
        
        // Aqui está o segredo: Enviamos o sticker e colocamos o alvo no 'mentions'.
        // Isso faz o celular da pessoa notificar.
        await sock.sendMessage(from, { 
            sticker: fs.readFileSync(caminhoSticker),
            mentions: [alvo] 
        }, { 
            // O bot responde ao seu comando (.opine), mas marca a outra pessoa
            quoted: msg 
        });

    } catch (e) {
        console.error("Erro no comando opine:", e);
    }
};