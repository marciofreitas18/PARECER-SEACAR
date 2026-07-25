window.gerarMinutaPortaria = function(dados) {
    if (!dados) dados = {};

    const nome = dados.nomeServidor ? dados.nomeServidor.toUpperCase() : "NOME DO SERVIDOR";
    const cargo = dados.cargo || "CARGO DO SERVIDOR";
    const siape = dados.siape || "SIAPE";
    const processo = dados.numeroProcesso || "23205.XXXXXX/2026-XX";
    
    // Tratamento padronizado para o nível RSC (Ex: "RSC-V", "V" ou "RSC-PCCTAE-V")
    let nivel = dados.nivelSolicitado || "RSC-PCCTAE-X";
    if (nivel && !nivel.startsWith("RSC-PCCTAE")) {
        const nivelRomano = nivel.includes('-') ? nivel.split('-')[1] : nivel;
        nivel = `RSC-PCCTAE-${nivelRomano}`;
    }

    // Tratamento de segurança para a data de exercício
    let dataExercicio = "XX/XX/XXXX";
    if (dados.dataExercicio) {
        if (typeof formatarDataBr === 'function') {
            dataExercicio = formatarDataBr(dados.dataExercicio);
        } else if (dados.dataExercicio.includes('-')) {
            const [ano, mes, dia] = dados.dataExercicio.split('-');
            dataExercicio = `${dia}/${mes}/${ano}`;
        } else {
            dataExercicio = dados.dataExercicio;
        }
    }
    
    // Captura a CRSC selecionada na tela ou define o fallback padrão
    const comissaoCRSC = (dados.unidadeCRSC && dados.unidadeCRSC.trim() !== "") 
        ? dados.unidadeCRSC 
        : "Comissão de Reconhecimento de Saberes e Competências (CRSC)";

    const conteudoDoc = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Minuta de Portaria - RSC</title></head>
        <body style="font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; margin: 3cm 2cm 2cm 3cm;">
            <p style="text-align: center; font-weight: bold;">MINISTÉRIO DA EDUCAÇÃO<br>UNIVERSIDADE FEDERAL DA FRONTEIRA SUL (UFFS)</p>
            <br>
            <p style="text-align: center; font-weight: bold;">PORTARIA Nº XXX/PROGESP/UFFS/2026</p>
            <br>
            <p style="text-align: justify;">O(A) PRÓ-REITOR(A) DE GESTÃO DE PESSOAS DA UNIVERSIDADE FEDERAL DA FRONTEIRA SUL, no uso de suas atribuições legais e regimentais, com fundamento na Lei nº 11.091, de 12 de janeiro de 2005, no Decreto nº 13.048, de 3 de julho de 2026, e na Portaria nº 4725/GR/UFFS/2026, e considerando a decisão da <strong>${comissaoCRSC}</strong>, constante no Processo SIPAC nº <strong>${processo}</strong>,</p>
            <br>
            <p style="text-align: justify;"><strong>RESOLVE:</strong></p>
            <br>
            <p style="text-align: justify;"><strong>Art. 1º</strong> CONCEDER o Reconhecimento de Saberes e Competências (<strong>${nivel}</strong>) ao(à) servidor(a) <strong>${nome}</strong>, ocupante do cargo de <strong>${cargo}</strong>, Matrícula SIAPE nº <strong>${siape}</strong>, considerando o parecer favorável da <strong>${comissaoCRSC}</strong> constante no Processo nº <strong>${processo}</strong>, com efeitos financeiros a contar de <strong>${dataExercicio}</strong>.</p>
            <br>
            <p style="text-align: justify;"><strong>Art. 2º</strong> Esta Portaria entra em vigor na data de sua publicação.</p>
        </body>
        </html>
    `;

    // Nome de arquivo limpo (sem caracteres especiais indevidos)
    const nomeLimpo = nome.replace(/[^a-zA-Z0-9_ ]/g, "").replace(/\s+/g, "_");
    
    const blob = new Blob(['\ufeff' + conteudoDoc], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Minuta_Portaria_Concede_RSC_${nomeLimpo}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
