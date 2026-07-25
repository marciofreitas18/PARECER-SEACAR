/**
 * Extrator de dados calibrado para o Parecer da Comissão (CRSC/UFFS)
 * Identifica as 7 CRSCs oficiais: Cerro Largo, Chapecó, Erechim, Laranjeiras do Sul, Realeza, Reitoria e Passo Fundo
 */
async function extrairDadosParecerCRSC(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let textoCompleto = "";

    // Extrai o texto de todas as páginas do PDF
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        textoCompleto += pageText + "\n";
    }

    // Normaliza espaços para facilitar a busca
    const textoLimpo = textoCompleto.replace(/\s+/g, ' ');

    // 1. Mapeamento e Identificação Estrita da CRSC Responsável
    const comissoesValidas = [
        "Cerro Largo",
        "Chapecó",
        "Erechim",
        "Laranjeiras do Sul",
        "Realeza",
        "Reitoria",
        "Passo Fundo"
    ];

    let comissaoIdentificada = "Passo Fundo"; // Fallback padrão caso não encontre no PDF

    for (const comissao of comissoesValidas) {
        // Busca variações como "CRSC Campus Cerro Largo", "CRSC Cerro Largo", "CRSC Reitoria", etc.
        const regexComissao = new RegExp(`CRSC(?:\\s*Campus|\\s*da\\s*Unidade|\\s*do\\s*Campus)?\\s*${comissao}`, "i");
        if (regexComissao.test(textoLimpo)) {
            comissaoIdentificada = comissao;
            break;
        }
    }

    // 2. Identifica se o parecer é Favorável (DEFERIDO)
    const eFavoravel = /Parecer[:;]?\s*Favorável/i.test(textoLimpo) || 
                       (!/Não Favorável|Desfavorável/i.test(textoLimpo) && /Favorável/i.test(textoLimpo));

    // 3. Captura da pontuação obtida
    const pontos = extrairRegEx(textoLimpo, /Pontuação obtida[:;]?\s*([\d\.,]+)/i) || 
                   extrairRegEx(textoLimpo, /Total de pontos aceitos[:;]?\s*([\d\.,]+)/i) || 
                   extrairRegEx(textoLimpo, /pontuação homologada de\s*([\d\.,]+)/i) ||
                   extrairRegEx(textoLimpo, /(?:Pontuação|Pontos|Total)[:;]?\s*([\d\.,]+)/i) || "0";

    // 4. Extração e normalização do IQ (porcentagem pura)
    const rawIQ = extrairRegEx(textoLimpo, /Percentual correspondente[:;]?\s*(\d+)%?/i) || 
                  extrairRegEx(textoLimpo, /(?:IQ|Incentivo à Qualificação)[:;]?\s*(\d+)%?/i) || "52";

    // 5. Extração e normalização do Nível RSC
    let rawNivel = extrairRegEx(textoLimpo, /Nível de RSC requerido[:;]?\s*([^;]+?)(?=\s*(?:Percentual|Data|$))/i) || 
                   extrairRegEx(textoLimpo, /(RSC-PCCTAE-[I|V|X]+|RSC-[I|V|X]+|Nível\s*[I|V|X]+)/i) || "RSC-V";
    
    let nivelApenasRomano = extrairRegEx(rawNivel, /([I|V|X]+)/i) || "V";
    let nivelFormatado = `RSC-${nivelApenasRomano}`;

    // 6. Datas do Parecer da Comissão
    const rawDataExercicio = extrairRegEx(textoLimpo, /Data de início do exercício no cargo atual[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || 
                             extrairRegEx(textoLimpo, /Data de Exercício[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || 
                             extrairRegEx(textoLimpo, /Data de ingresso[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || "";

    const rawDataDecisao = extrairRegEx(textoLimpo, /exarada em\s*(\d{2}\/\d{2}\/\d{4})/i) ||
                           extrairRegEx(textoLimpo, /Data do Parecer[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || "";

    const rawDataVigencia = extrairRegEx(textoLimpo, /a partir de\s*\[?(\d{2}\/\d{2}\/\d{4})\]?/i) ||
                            extrairRegEx(textoLimpo, /Vigência da Concessão a partir de[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || "";

    // Converte Data de Exercício para YYYY-MM-DD
    let dataExercicioIso = "";
    if (rawDataExercicio) {
        const partes = rawDataExercicio.split('/');
        if (partes.length === 3) {
            dataExercicioIso = `${partes[2]}-${partes[1]}-${partes[0]}`;
        }
    }

    const dados = {
        numeroProcesso: extrairRegEx(textoLimpo, /Processo(?:\s*SIPAC)?\s*Nº[:;]?\s*([\d\.\/-]+)/i) || "Não identificado",
        nomeServidor: extrairRegEx(textoLimpo, /INTERESSADO\(A\)[:;]?\s*([A-Za-zÀ-ÿ\s]+?)(?=\s*(?:MATRÍCULA|SIAPE|CARGO|LOTAÇÃO|$))/i) || 
                      extrairRegEx(textoLimpo, /Servidor\(a\)[:;]?\s*([A-Za-zÀ-ÿ\s]+?)(?=\s*(?:Matrícula|SIAPE|Cargo|Lotação|$))/i) || "Servidor Não Identificado",
        siape: extrairRegEx(textoLimpo, /(?:MATRÍCULA\s*)?SIAPE[:;]?\s*(\d+)/i) || "Não identificado",
        cargo: extrairRegEx(textoLimpo, /CARGO[:;]?\s*([^\n\r;]+?)(?=\s*(?:LOTAÇÃO|Lotação|Data|$))/i) || "Assistente em Administração",
        lotacao: extrairRegEx(textoLimpo, /LOTAÇÃO[:;]?\s*([^\n\r;]+?)(?=\s*(?:NÍVEL|Nível|Data|$))/i) || "UFFS",
        
        // Comissão Unidade/Campus (Cerro Largo, Chapecó, Erechim, Laranjeiras do Sul, Realeza, Reitoria, Passo Fundo)
        campusCRSC: comissaoIdentificada,
        dataDecisaoCRSC: rawDataDecisao,
        
        iqAtual: rawIQ,
        nivelSolicitado: nivelFormatado,
        nivelRscRomano: nivelApenasRomano,
        percentual: rawIQ + "%",
        pontuacaoObtida: pontos,
        
        dataExercicioComissao: dataExercicioIso,
        dataExercicio: dataExercicioIso,
        dataRequerimento: extrairRegEx(textoLimpo, /Data do requerimento[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || "",
        dataVigencia: rawDataVigencia,
        resultado: eFavoravel ? "DEFERIDO" : "INDEFERIDO"
    };

    return dados;
}

function extrairRegEx(texto, regex) {
    const match = texto.match(regex);
    return match && match[1] ? match[1].trim() : null;
}

window.parseParecerCRSC = extrairDadosParecerCRSC;
window.extrairDadosParecerCRSC = extrairDadosParecerCRSC;
