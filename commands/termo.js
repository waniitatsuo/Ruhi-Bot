const listaPalavras = require('../lib/termo'); 

// --- PRÉ-PROCESSAMENTO ---
const palavrasValidas = new Set(
    listaPalavras.map(p => removeAcentos(p).toUpperCase())
);

// Memória do Jogo (Onde a mágica da separação por grupos acontece)
const jogosAtivos = {}; 

// Tempo limite (2 horas)
const TEMPO_LIMITE = 2 * 60 * 60 * 1000;

module.exports = async (sock, msg) => {
    try {
        // --- 1. DEFININDO O CHATID ---
        // Aqui garantimos que o chatId existe e é o ID de onde veio a mensagem (Grupo ou PV)
        const chatId = msg.key.remoteJid;

        // Captura o texto
        const textoMensagem = msg.message?.conversation || 
                              msg.message?.extendedTextMessage?.text || 
                              "";

        const args = textoMensagem.trim().split(/\s+/);
        const acao = args[1]?.toLowerCase(); // ex: sair
        const chute = args[1]?.toUpperCase(); // ex: VASCO

        // --- LÓGICA DE SAIR ---
        if (acao === 'sair') {
            // Verifica se ESSE grupo (chatId) tem jogo ativo
            if (jogosAtivos[chatId]) {
                clearTimeout(jogosAtivos[chatId].timer);
                delete jogosAtivos[chatId]; // Apaga o jogo SÓ desse grupo
                return await sock.sendMessage(chatId, { text: "👋 Jogo de Termo encerrado neste grupo!" }, { quoted: msg });
            } else {
                return await sock.sendMessage(chatId, { text: "❌ Não há jogo ativo aqui." }, { quoted: msg });
            }
        }

        // --- 2. INÍCIO DE JOGO (Se não tiver jogo nesse chatId) ---
        if (!jogosAtivos[chatId]) {
            const palavraSecreta = listaPalavras[Math.floor(Math.random() * listaPalavras.length)].toUpperCase();
            
            console.log(`[TERMO] Novo jogo em ${chatId}. Palavra: ${palavraSecreta}`);

            // Cria a sessão exclusiva para este chatId
            jogosAtivos[chatId] = {
                palavra: palavraSecreta,
                tentativas: [],
                timer: setTimeout(() => {
                    if (jogosAtivos[chatId]) {
                        delete jogosAtivos[chatId];
                        sock.sendMessage(chatId, { text: "⌛ *Tempo Esgotado!* O jogo encerrou." });
                    }
                }, TEMPO_LIMITE)
            };

            const tabuleiro = montarTabuleiro(jogosAtivos[chatId]);
            await sock.sendMessage(chatId, { text: tabuleiro }, { quoted: msg });
            return;
        }

        // --- 3. JOGO EM ANDAMENTO ---
        // Recupera o jogo DESTE grupo específico
        const jogo = jogosAtivos[chatId];

        // Reinicia timer (Morte súbita resetada)
        clearTimeout(jogo.timer);
        jogo.timer = setTimeout(() => {
            if (jogosAtivos[chatId]) {
                delete jogosAtivos[chatId];
                sock.sendMessage(chatId, { text: "⌛ *Tempo Esgotado!*" });
            }
        }, TEMPO_LIMITE);

        // --- VALIDAÇÕES ---
        if (!chute || chute.length !== 5) {
            await sock.sendMessage(chatId, { text: "⚠️ Digite uma palavra de 5 letras! Ex: .termo VASCO" }, { quoted: msg });
            return;
        }

        const chuteLimpo = removeAcentos(chute);
        if (!palavrasValidas.has(chuteLimpo)) {
            await sock.sendMessage(chatId, { text: "📚 *Palavra desconhecida!* Tente outra." }, { quoted: msg });
            return; 
        }

        // Adiciona tentativa
        jogo.tentativas.push(chute);

        // --- VERIFICAÇÃO DE VITÓRIA ---
        const palavraLimpa = removeAcentos(jogo.palavra);
        const ganhou = chuteLimpo === palavraLimpa;
        const perdeu = jogo.tentativas.length >= 6;
        let terminou = ganhou || perdeu;

        let textoFinal = montarTabuleiro(jogo);

        if (ganhou) {
            textoFinal += `\n\n🏆 *PARABÉNS!* A palavra era: ${jogo.palavra}`;
            textoFinal += `\n\nPara jogar de novo, digite *.termo*`;
        } else if (perdeu) {
            textoFinal += `\n\n💀 *PERDEU!* A palavra era: ${jogo.palavra}`;
            textoFinal += `\n\nPara tentar de novo, digite *.termo*`;
        } else {
            textoFinal += `\n\nPróximo chute: .termo [palavra]`;
        }

        // --- FINALIZAÇÃO ---
        if (terminou) {
            clearTimeout(jogo.timer);
            delete jogosAtivos[chatId]; // Remove o jogo deste grupo da memória
        }

        await sock.sendMessage(chatId, { text: textoFinal }, { quoted: msg });

    } catch (e) {
        console.error("Erro no comando termo:", e);
        // Tenta avisar onde deu erro, se possível
        if (msg.key && msg.key.remoteJid) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ Erro interno no jogo.' });
        }
    }
};

// --- FUNÇÕES AUXILIARES (Padrão) ---
function removeAcentos(str) { return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

function montarTabuleiro(jogo) {
    let board = "🎱 *JOGO DO TERMO* 🎱\n\n";
    const maxTentativas = 6;
    for (let i = 0; i < maxTentativas; i++) {
        const tentativa = jogo.tentativas[i];
        if (tentativa) {
            const resultadoEmojis = gerarEmojis(tentativa, jogo.palavra);
            const palavraVisual = embelezarPalavra(tentativa, jogo.palavra);
            board += `*${palavraVisual.split('').join(' ')}*\n`; 
            board += `${resultadoEmojis}\n`;
        } else {
            board += "_ _ _ _ _\n\n";
        }
    }
    const palavraLimpa = removeAcentos(jogo.palavra);
    const todasLetrasChutadas = jogo.tentativas.join('').split('');
    const letrasDescartadas = [...new Set(todasLetrasChutadas.filter(letra => !palavraLimpa.includes(removeAcentos(letra))))].sort();
    if (letrasDescartadas.length > 0) board += `\n🗑️ *Não tem:* ${letrasDescartadas.join(' - ')}`;
    return board;
}

function gerarEmojis(chute, senha) {
    let output = ['', '', '', '', ''];
    let letrasSenha = removeAcentos(senha).split('');
    let letrasChute = removeAcentos(chute).split('');
    for (let i = 0; i < 5; i++) {
        if (letrasChute[i] === letrasSenha[i]) { output[i] = '🟢'; letrasSenha[i] = null; letrasChute[i] = null; }
    }
    for (let i = 0; i < 5; i++) {
        if (letrasChute[i] !== null) {
            const index = letrasSenha.indexOf(letrasChute[i]);
            if (index !== -1) { output[i] = '🟡'; letrasSenha[index] = null; } else { output[i] = '⚪'; }
        }
    }
    return output.join(' ');
}

function embelezarPalavra(chute, senha) {
    let resultado = "";
    const chuteLimpo = removeAcentos(chute);
    const senhaLimpa = removeAcentos(senha);
    for (let i = 0; i < 5; i++) {
        if (chuteLimpo[i] === senhaLimpa[i]) { resultado += senha[i]; } else { resultado += chute[i]; }
    }
    return resultado;
}