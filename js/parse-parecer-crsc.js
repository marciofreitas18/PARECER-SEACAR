/**
 * Extrator de dados calibrado para o Parecer da Comissão (CRSC/UFFS)
 * Regra corrigida: O RSC concede o percentual do nível superior ao IQ atual do servidor
 */
async function extrairDadosParecerCRSC(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let textoCompleto = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        textoCompleto += pageText + "\n";
    }

    const textoLimpo = textoCompleto.replace(/\s+/g, ' ');

    // 1. Mapeamento da CRSC Responsável
    const comissoesValidas = [
        "Cerro Largo", "Chapecó", "Erechim", "Laranjeiras do Sul", "Realeza", "Reitoria", "Passo Fundo"
    ];

    let comissaoIdentificada = "Passo Fundo";
    for (const comissao of comissoesValidas) {
        const regexComissao = new RegExp(`CRSC(?:\\s*Campus|\\s*da\\s*Unidade|\\s*do\\s*Campus)?\\s*${comissao}`, "i");
        if (regexComissao.test(textoLimpo)) {
            comissaoIdentificada = comissao;
            break;
        }
    }

    // 2. Captura do Processo
    const matchProcessoPadrao = textoLimpo.match(/\b(23205\.\d{6}\/\d{4}-\d{2})\b/);
    const numeroProcessoExtraido = matchProcessoPadrao ? matchProcessoPadrao[1] : (
        extrairRegEx(textoLimpo, /(?:Processo(?:\s*SIPAC)?(?:\s*Nº|\s*nº|\s*num|\s*número)?[:;]?)\s*([\d\.\/-]{15,25})/i) || "Não identificado"
    );

    // 3. Resultado do Parecer
    const eFavoravel = /Parecer[:;]?\s*Favorável/i.test(textoLimpo) || 
                       (!/Não Favorável|Desfavorável/i.test(textoLimpo) && /Favorável/i.test(textoLimpo));

    // 4. Pontuação Homologada
    const pontos = extrairRegEx(textoLimpo, /Pontuação obtida[:;]?\s*([\d\.,]+)/i) || 
                   extrairRegEx(textoLimpo, /Total de pontos aceitos[:;]?\s*([\d\.,]+)/i) || 
                   extrairRegEx(textoLimpo, /pontuação homologada de\s*([\d\.,]+)/i) ||
                   extrairRegEx(textoLimpo, /(?:Pontuação|Pontos|Total)[:;]?\s*([\d\.,]+)/i) || "0";

    // 5. Nível RSC Solicitado
    let rawNivel = extrairRegEx(textoLimpo, /Nível de RSC requerido[:;]?\s*([^;]+?)(?=\s*(?:Percentual|Data|$))/i) || 
                   extrairRegEx(textoLimpo, /(RSC-PCCTAE-[I|V|X]+|RSC-[I|V|X]+|Nível\s*[I|V|X]+)/i) || "RSC-V";
    
    let nivelApenasRomano = extrairRegEx(rawNivel, /([I|V|X]+)/i) || "V";
    nivelApenasRomano = nivelApenasRomano.toUpperCase();

    // 6. Tabela de Correspondência Correta (Nível RSC -> Percentual Concedido)
    const tabelaRscParaPercentual = {
        'VI': '75',
        'V': '52',
        'IV': '30',
        'III': '25',
        'II': '20',
        'I': '15'
    };

    let percentualFinal = tabelaRscParaPercentual[nivelApenasRomano] || "52";

    // Extração das Datas
    const rawDataExercicio = extrairRegEx(textoLimpo, /Data de início do exercício no cargo atual[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || 
                             extrairRegEx(textoLimpo, /Data de Exercício[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || "";

    const rawDataDecisao = extrairRegEx(textoLimpo, /exarada em\s*(\d{2}\/\d{2}\/\d{4})/i) ||
                           extrairRegEx(textoLimpo, /Data do Parecer[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || "";

    const rawDataVigencia = extrairRegEx(textoLimpo, /a partir de\s*\[?(\d{2}\/\d{2}\/\d{4})\]?/i) ||
                            extrairRegEx(textoLimpo, /Vigência da Concessão a partir de[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || "";

    let dataExercicioIso = "";
    if (rawDataExercicio) {
        const partes = rawDataExercicio.split('/');
        if (partes.length === 3) {
            dataExercicioIso = `${partes[2]}-${partes[1]}-${partes[0]}`;
        }
    }

    return {
        numeroProcesso: numeroProcessoExtraido,
        nomeServidor: extrairRegEx(textoLimpo, /INTERESSADO\(A\)[:;]?\s*([A-Za-zÀ-ÿ\s]+?)(?=\s*(?:MATRÍCULA|SIAPE|CARGO|LOTAÇÃO|$))/i) || 
                      extrairRegEx(textoLimpo, /Servidor\(a\)[:;]?\s*([A-Za-zÀ-ÿ\s]+?)(?=\s*(?:Matrícula|SIAPE|Cargo|Lotação|$))/i) || "Servidor Não Identificado",
        siape: extrairRegEx(textoLimpo, /(?:MATRÍCULA\s*)?SIAPE[:;]?\s*(\d+)/i) || "Não identificado",
        cargo: extrairRegEx(textoLimpo, /CARGO[:;]?\s*([^\n\r;]+?)(?=\s*(?:LOTAÇÃO|Lotação|Data|$))/i) || "Assistente em Administração",
        lotacao: extrairRegEx(textoLimpo, /LOTAÇÃO[:;]?\s*([^\n\r;]+?)(?=\s*(?:NÍVEL|Nível|Data|$))/i) || "UFFS",
        campusCRSC: comissaoIdentificada,
        dataDecisaoCRSC: rawDataDecisao,
        iqAtual: percentualFinal,
        nivelSolicitado: `RSC-${nivelApenasRomano}`,
        nivelRscRomano: nivelApenasRomano,
        percentual: percentualFinal + "%",
        pontuacaoObtida: pontos,
        dataExercicioComissao: dataExercicioIso,
        dataExercicio: dataExercicioIso,
        dataRequerimento: extrairRegEx(textoLimpo, /Data do requerimento[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || "",
        dataVigencia: rawDataVigencia,
        resultado: eFavoravel ? "DEFERIDO" : "INDEFERIDO"
    };
}

function extrairRegEx(texto, regex) {
    const match = texto.match(regex);
    return match && match[1] ? match[1].trim() : null;
}

window.parseParecerCRSC = extrairDadosParecerCRSC;
window.extrairDadosParecerCRSC = extrairDadosParecerCRSC;
