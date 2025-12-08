const fs = require('fs');
const path = require('path');

// 1. Define o caminho da pasta de forma robusta
// Nota: '..' sobe um nível. Ajuste se sua pasta 'media/audio' for em outro lugar
const AUDIO_DIR = path.join('..', 'media', 'audio');

let risadasAudio = [];

try {
    // Verifica se a pasta existe antes de tentar ler
    if (fs.existsSync(AUDIO_DIR)) {
        // 2. Lê o conteúdo do diretório (retorna nomes de arquivos)
        const arquivos = fs.readdirSync(AUDIO_DIR);
        
        // 3. Itera sobre os NOMES de arquivos lidos
        risadasAudio = arquivos
            // Filtra apenas arquivos MP3 (ou OGG)
            .filter(nome => nome.endsWith('.mp3')) 
            // Constrói o caminho completo para cada arquivo (obrigatório para o Baileys)
            .map(nome => path.join(AUDIO_DIR, nome)); 
            
        console.log(`[DATA] Áudios de risada carregados: ${risadasAudio.length}`);
    } else {
        console.warn(`[DATA] Pasta de áudios não encontrada: ${AUDIO_DIR}`);
    }
    
} catch (err) {
    console.error(`❌ Erro ao carregar a lista de áudios: ${err.message}`);
}

// Exporta o array pronto para uso imediato em qualquer comando
module.exports = risadasAudio;