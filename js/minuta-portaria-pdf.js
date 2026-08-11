window.gerarMinutaPortaria = function(dados) {
    if (!dados) dados = {};

    const nome = dados.nomeServidor ? dados.nomeServidor.trim() : "SERVIDOR";
    const cargo = dados.cargo || "CARGO DO SERVIDOR";
    const siape = dados.siape || "SIAPE";
    const processo = dados.numeroProcesso || "23205.XXXXXX/2026-XX";

    // Mapeamento e Tratamento Padronizado do Nível RSC
    let nivel = dados.nivelSolicitado || "RSC-PCCTAE-III";
    if (nivel && !nivel.startsWith("RSC-PCCTAE")) {
        const nivelRomano = nivel.includes('-') ? nivel.split('-')[1] : nivel;
        nivel = `RSC-PCCTAE-${nivelRomano}`;
    }

    // Tratamento da Data de Vigência Financeira
    let dataVigencia = "XX/XX/XXXX";
    const dataVigenciaRaw = dados.dataVigenciaCRSC || dados.dataVigencia || dados.dataParecer;

    if (dataVigenciaRaw) {
        if (typeof formatarDataBr === 'function') {
            dataVigencia = formatarDataBr(dataVigenciaRaw);
        } else if (dataVigenciaRaw.includes('-')) {
            const [ano, mes, dia] = dataVigenciaRaw.split('-');
            dataVigencia = `${dia}/${mes}/${ano}`;
        } else {
            dataVigencia = dataVigenciaRaw;
        }
    }

    // Captura a CRSC selecionada
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
            <p style="text-align: justify;">O(A) PRÓ-REITOR(A) DE GESTÃO DE PESSOAS EM EXERCÍCIO DA UNIVERSIDADE FEDERAL DA FRONTEIRA SUL, no uso de suas atribuições legais e regimentais, com fundamento na Lei nº 11.091, de 12 de janeiro de 2005, no Decreto nº 13.048, de 3 de julho de 2026, a Portaria nº 4725/GR/UFFS/2026 e a Portaria nº 4731/GR/UFFS/2026, e considerando a decisão da ${comissaoCRSC}, constante no Processo SIPAC nº ${processo},</p>
            <br>
            <p style="text-align: justify;"><strong>RESOLVE:</strong></p>
            <br>
            <p style="text-align: justify;"><strong>Art. 1º</strong> CONCEDER o Reconhecimento de Saberes e Competências (<strong>${nivel}</strong>) ao(à) servidor(a) <strong>${nome}</strong>, ocupante do cargo de <strong>${cargo}</strong>, Matrícula SIAPE nº <strong>${siape}</strong>, considerando o parecer favorável da ${comissaoCRSC} constante no Processo nº <strong>${processo}</strong>, com efeitos financeiros a contar de <strong>${dataVigencia}</strong>.</p>
            <br>
            <p style="text-align: justify;"><strong>Art. 2º</strong> Esta Portaria entra em vigor na data de sua publicação.</p>
        </body>
        </html>
    `;

    const blob = new Blob(['\ufeff' + conteudoDoc], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `Minuta_Portaria XXXX - Concede RSC a ${nome}.doc`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};
