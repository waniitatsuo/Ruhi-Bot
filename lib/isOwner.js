const { isSudo } = require('./index');

async function isOwnerOrSudo(senderId, sock = null, chatId = null) {
    
    // ==============================================================================
    // ÁREA DE CONFIGURAÇÃO MANUAL (FORÇA BRUTA)
    // Coloque seus números aqui dentro, entre aspas e separados por virgula.
    // ==============================================================================
    const MEUS_DONOS = [
        "5598989027500",
		"251625004347514",  // SEU NÚMERO
        "243241781821672",  // NÚMERO DO SEU AMIGO
        "5598988189683"
    ];
    // ==============================================================================

    // 1. Limpa o ID de quem enviou (tira @s.whatsapp.net, :23, etc)
    // Deixa apenas os digitos. Ex: 5598989027500
    let senderNum = senderId.split(':')[0].split('@')[0].replace(/[^0-9]/g, '');

    // LOG DE DEBUG: Vai aparecer no seu terminal. OLHE O TERMINAL!
    // Ele vai mostrar exatamente como o bot está lendo seu número.
    // console.log(`[DEBUG] Tentativa de comando. ID detectado: ${senderNum}`);

    // 2. Verifica se o número está na lista (Verificação Simples)
    if (MEUS_DONOS.includes(senderNum)) {
        return true;
    }

    // 3. Verifica o 9º Dígito (O Pulo do Gato)
    // O WhatsApp às vezes manda com 9, às vezes sem. O bot precisa testar os dois.
    for (let dono of MEUS_DONOS) {
        let donoLimpo = dono.replace(/[^0-9]/g, '');

        // Se o número que chegou é maior que o dono (tem 9 digito e o dono não)
        if (senderNum.length > donoLimpo.length && senderNum.includes(donoLimpo)) {
             return true; 
        }
        // Se o dono configurado tem 9 digito e o que chegou não tem
        if (donoLimpo.length > senderNum.length && donoLimpo.includes(senderNum)) {
             return true;
        }
        
        // Teste Específico para Brasil (DDD + 9)
        // Remove o nono digito do senderNum para ver se bate com o dono
        if (senderNum.startsWith('55') && senderNum.length === 13) {
            // Transforma 5598988887777 em 559888887777
            let senderSem9 = senderNum.slice(0, 4) + senderNum.slice(5);
            if (senderSem9 === donoLimpo) return true;
        }
    }

    // 4. Se for o próprio bot falando
    if (sock && sock.user) {
        let botId = sock.user.id.split(':')[0].split('@')[0].replace(/[^0-9]/g, '');
        if (senderNum === botId) return true;
    }

    // 5. Verifica Sudo
    try {
        if (await isSudo(senderId)) return true;
    } catch (e) {}

    return false;
}

module.exports = isOwnerOrSudo;