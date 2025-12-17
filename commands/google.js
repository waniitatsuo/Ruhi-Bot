// commands/google.js
const { GOOGLE_IMG_SCRAP } = require('google-img-scrap');

async function googleCommand(sock, chatId, message) {
    
    // 1. Pega o termo da pesquisa
    const texto = message.message?.conversation || message.message?.extendedTextMessage?.text || "";
    // Remove o comando ".img" ou ".google" para ficar só a pesquisa
    // Ex: ".img gatinho fofo" vira "gatinho fofo"
    const termoPesquisa = texto.replace(/^\S+\s+/, '').trim();
    const comando = texto.split(' ')[0].toLowerCase();

    // Se o usuário digitou só ".img", avisa ele
    if (!termoPesquisa || termoPesquisa === comando) {
        await sock.sendMessage(chatId, { text: "⚠️ Digite o que você quer buscar!\nExemplo: .img paisagem cyberpunk" }, { quoted: message });
        return;
    }

    try {
        await sock.sendMessage(chatId, { text: "🔍 Pesquisando..." }, { quoted: message });

        // 2. Faz a busca usando a lib
        const resultado = await GOOGLE_IMG_SCRAP({
            search: termoPesquisa,
            safeSearch: true, // 🛡️ O FILTRO ANTI +18 ESTÁ AQUI
            execute: true
        });

        // Verifica se achou algo
        if (!resultado.result || resultado.result.length === 0) {
            await sock.sendMessage(chatId, { text: "❌ Não encontrei imagens para esse termo." }, { quoted: message });
            return;
        }

        // 3. Sorteia uma imagem da lista de resultados
        const listaImagens = resultado.result;
        const imagemSorteada = listaImagens[Math.floor(Math.random() * listaImagens.length)];

        // 4. Envia a imagem
        await sock.sendMessage(chatId, { 
            image: { url: imagemSorteada.url }, 
            caption: `🔎 Resultado para: *${termoPesquisa}*\n🔗 Fonte: Google Imagens` 
        }, { quoted: message });

    } catch (erro) {
        console.error("Erro na busca do Google:", erro);
        await sock.sendMessage(chatId, { text: "❌ Ocorreu um erro ao buscar a imagem. Tente outro termo." }, { quoted: message });
    }
}

module.exports = googleCommand;