const listaPalavras = require('../lib/termo'); 

// --- PRÉ-PROCESSAMENTO (Para o bot ficar rápido) ---
// Cria uma lista de "Busca Rápida" com todas as palavras sem acento e maiúsculas
// Assim, se a lista tem "SÓTÃO", aqui salvamos "SOTAO" para validar o chute
const palavrasValidas = new Set(
    listaPalavras.map(p => removeAcentos(p).toUpperCase())
);

// Memória do Jogo
const jogosAtivos = {}; 

// Tempo limite (2 horas)
const TEMPO_LIMITE = 2 * 60 * 60 * 1000;

async function termoCommand(sock, chatId, message) {
    
    // Captura o texto (seja digitado ou vindo do clique do botão)
    const textoMensagem = message.message?.conversation || 
                          message.message?.extendedTextMessage?.text || 
                          message.message?.buttonsResponseMessage?.selectedButtonId || 
                          "";

    const args = textoMensagem.trim().split(/\s+/);
    // args[0] = .termo
    // args[1] = chute ou "sair"
    const acao = args[1]?.toLowerCase();
    const chute = args[1]?.toUpperCase();

    // --- LÓGICA DE SAIR ---
    if (acao === 'sair') {
        if (jogosAtivos[chatId]) {
            clearTimeout(jogosAtivos[chatId].timer); // Para o relógio
            delete jogosAtivos[chatId]; // Apaga o jogo
            await sock.sendMessage(chatId, { text: "👋 Jogo de Termo encerrado!" }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: "❌ Não há jogo ativo para sair." }, { quoted: message });
        }
        return;
    }

    // --- 1. INÍCIO DE JOGO (Novo Jogo) ---
    if (!jogosAtivos[chatId]) {
        // Sorteia uma palavra da lista original (pode vir com acento, ex: "SÓTÃO")
        const palavraSecreta = listaPalavras[Math.floor(Math.random() * listaPalavras.length)].toUpperCase();
        
        jogosAtivos[chatId] = {
            palavra: palavraSecreta,
            tentativas: [],
            // Inicia o temporizador de morte súbita
            timer: setTimeout(() => {
                if (jogosAtivos[chatId]) {
                    delete jogosAtivos[chatId];
                    sock.sendMessage(chatId, { text: "⌛ *Tempo Esgotado!* O jogo de Termo foi encerrado por inatividade." });
                }
            }, TEMPO_LIMITE)
        };

        const tabuleiro = montarTabuleiro(jogosAtivos[chatId]);
        await sock.sendMessage(chatId, { text: tabuleiro }, { quoted: message });
        return;
    }

    // --- 2. JOGO EM ANDAMENTO ---
    const jogo = jogosAtivos[chatId];

    // Reinicia o relógio (jogador está vivo)
    clearTimeout(jogo.timer);
    jogo.timer = setTimeout(() => {
        if (jogosAtivos[chatId]) {
            delete jogosAtivos[chatId];
            sock.sendMessage(chatId, { text: "⌛ *Tempo Esgotado!* O jogo de Termo foi encerrado por inatividade." });
        }
    }, TEMPO_LIMITE);

    // VALIDAÇÃO 1: Tamanho
    if (!chute || chute.length !== 5) {
        await sock.sendMessage(chatId, { text: "⚠️ Digite uma palavra de 5 letras! Ex: .termo VASCO" }, { quoted: message });
        return;
    }

    // VALIDAÇÃO 2: Dicionário (Verifica se a palavra existe na lista)
    const chuteLimpo = removeAcentos(chute); // "SÓTÃO" vira "SOTAO"

    if (!palavrasValidas.has(chuteLimpo)) {
        await sock.sendMessage(chatId, { 
            text: "📚 *Palavra desconhecida!* Essa palavra não está na minha lista. Tente outra." 
        }, { quoted: message });
        return; // Não gasta tentativa
    }

    // Se passou, adiciona o chute (do jeito que o usuário escreveu)
    jogo.tentativas.push(chute);

    // --- 3. VERIFICAÇÃO DE VITÓRIA/DERROTA ---
    const palavraLimpa = removeAcentos(jogo.palavra); // Senha sem acento
    
    const ganhou = chuteLimpo === palavraLimpa;
    const perdeu = jogo.tentativas.length >= 6;
    let terminou = ganhou || perdeu;

    let textoFinal = montarTabuleiro(jogo);

    if (ganhou) {
        textoFinal += `\n\n🏆 *PARABÉNS!* A palavra era: ${jogo.palavra}`;
    } else if (perdeu) {
        textoFinal += `\n\n💀 *PERDEU!* A palavra era: ${jogo.palavra}`;
    }

    // --- ENVIO DA RESPOSTA ---
    
    if (terminou) {
        // Limpa tudo da memória
        clearTimeout(jogo.timer);
        delete jogosAtivos[chatId];

        // Manda mensagem com BOTÕES
        const buttonsMessage = {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: {
                        body: { text: textoFinal },
                        // Usa o nome global do bot no rodapé (Footer)
                        footer: { text: global.botname || "Bot do Ruhi" },
                        header: { title: "", subtitle: "" },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: "quick_reply",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "Jogar de Novo",
                                        id: ".termo" 
                                    })
                                },
                                {
                                    name: "quick_reply",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "Sair",
                                        id: ".termo sair"
                                    })
                                }
                            ]
                        }
                    }
                }
            }
        };

        await sock.sendMessage(chatId, buttonsMessage, { quoted: message });

    } else {
        // Jogo continua (Texto simples)
        textoFinal += `\n\nPróximo chute: .termo [palavra]`;
        await sock.sendMessage(chatId, { text: textoFinal }, { quoted: message });
    }
}

// --- FUNÇÕES AUXILIARES ---

// 1. Remove acentos (Á -> A, Ç -> C)
function removeAcentos(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// 2. Monta o visual do jogo
function montarTabuleiro(jogo) {
    let board = "🎱 *JOGO DO TERMO* 🎱\n\n";
    const maxTentativas = 6;

    for (let i = 0; i < maxTentativas; i++) {
        const tentativa = jogo.tentativas[i];
        if (tentativa) {
            const resultadoEmojis = gerarEmojis(tentativa, jogo.palavra);
            // Embelezar: Usa os acentos da senha se a letra estiver certa
            const palavraVisual = embelezarPalavra(tentativa, jogo.palavra);
            
            board += `*${palavraVisual.split('').join(' ')}*\n`; 
            board += `${resultadoEmojis}\n`;
        } else {
            board += "_ _ _ _ _\n\n";
        }
    }

    // 3. Lista de letras erradas (Não tem na palavra)
    const palavraLimpa = removeAcentos(jogo.palavra);
    const todasLetrasChutadas = jogo.tentativas.join('').split('');
    
    // Filtra letras que foram chutadas mas NÃO existem na senha
    const letrasDescartadas = [...new Set(
        todasLetrasChutadas.filter(letra => !palavraLimpa.includes(removeAcentos(letra)))
    )].sort();

    if (letrasDescartadas.length > 0) {
        board += `\n🗑️ *Não tem:* ${letrasDescartadas.join(' - ')}`;
    }

    return board;
}

// 4. Lógica das Cores (Verde/Amarelo/Branco)
function gerarEmojis(chute, senha) {
    let output = ['', '', '', '', ''];
    // Normaliza para comparar sem acentos
    let letrasSenha = removeAcentos(senha).split('');
    let letrasChute = removeAcentos(chute).split('');

    // Verdes
    for (let i = 0; i < 5; i++) {
        if (letrasChute[i] === letrasSenha[i]) {
            output[i] = '🟢';
            letrasSenha[i] = null;
            letrasChute[i] = null;
        }
    }
    // Amarelos
    for (let i = 0; i < 5; i++) {
        if (letrasChute[i] !== null) {
            const index = letrasSenha.indexOf(letrasChute[i]);
            if (index !== -1) {
                output[i] = '🟡';
                letrasSenha[index] = null;
            } else {
                output[i] = '⚪';
            }
        }
    }
    return output.join(' ');
}

// 5. Visual Inteligente (Mantém acento se acertar)
function embelezarPalavra(chute, senha) {
    let resultado = "";
    const chuteLimpo = removeAcentos(chute);
    const senhaLimpa = removeAcentos(senha);

    for (let i = 0; i < 5; i++) {
        // Se a letra for a mesma (ex: A e Á), usa a da SENHA para ficar bonito
        if (chuteLimpo[i] === senhaLimpa[i]) {
            resultado += senha[i];
        } else {
            resultado += chute[i];
        }
    }
    return resultado;
}

module.exports = termoCommand;