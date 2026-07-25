/**
 * Extrator de dados calibrado para o Parecer CRSC-PCCTAE da UFFS
 * Integrado com o app.js para validações automáticas do Decreto nº 13.048/2026
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

    // Normaliza espaços para facilitar a busca por RegEx
    const textoLimpo = textoCompleto.replace(/\s+/g, ' ');

    // Identifica se o parecer é Favorável (DEFERIDO)
    const eFavoravel = /Parecer[:;]?\s*Favorável/i.test(textoLimpo) || 
                       (!/Não Favorável|Desfavorável/i.test(textoLimpo) && /Favorável/i.test(textoLimpo));

    // Captura da pontuação obtida no parecer
    const pontos = extrairRegEx(textoLimpo, /Pontuação obtida[:;]?\s*([\d\.,]+)/i) || 
                   extrairRegEx(textoLimpo, /Total de pontos aceitos[:;]?\s*([\d\.,]+)/i) || 
                   extrairRegEx(textoLimpo, /(?:Pontuação|Pontos|Total)[:;]?\s*([\d\.,]+)/i) || "0";

    // Extração e normalização do IQ (número puro para o selectIQAtual)
    const rawIQ = extrairRegEx(textoLimpo, /Percentual correspondente[:;]?\s*(\d+)%?/i) || 
                  extrairRegEx(textoLimpo, /(?:IQ|Incentivo à Qualificação)[:;]?\s*(\d+)%?/i) || "52";

    // Extração e normalização do Nível RSC (Garante formato padrão ex: RSC-V ou RSC-PCCTAE-V)
    let rawNivel = extrairRegEx(textoLimpo, /Nível de RSC requerido[:;]?\s*([^;]+?)(?=\s*(?:Percentual|Data|$))/i) || 
                   extrairRegEx(textoLimpo, /(RSC-PCCTAE-[I|V|X]+|RSC-[I|V|X]+)/i) || "RSC-V";
    
    // Formata nivelSolicitado para compatibilidade (ex: "RSC-PCCTAE V" -> "RSC-V")
    let nivelFormatado = rawNivel.replace(/RSC-PCCTAE\s*/i, 'RSC-').replace(/\s+/g, '').toUpperCase();
    if (!nivelFormatado.startsWith('RSC-')) nivelFormatado = 'RSC-' + nivelFormatado;

    // CAPTURA DA DATA DE EXERCÍCIO (Inclui o rótulo completo da UFFS / SIPAC)
    const rawDataExercicio = extrairRegEx(textoLimpo, /Data de início do exercício no cargo atual[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || 
                             extrairRegEx(textoLimpo, /Data de Exercício[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || 
                             extrairRegEx(textoLimpo, /Data de ingresso[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || "";
    
    // Conversão de DD/MM/AAAA para YYYY-MM-DD para preenchimento e comparação exata
    let dataExercicioIso = "";
    if (rawDataExercicio) {
        const partes = rawDataExercicio.split('/');
        if (partes.length === 3) {
            dataExercicioIso = `${partes[2]}-${partes[1]}-${partes[0]}`;
        }
    }

    const dados = {
        // Dados do Processo e Servidor
        numeroProcesso: extrairRegEx(textoLimpo, /Processo[:;]?\s*([\d\.\/-]+)/i) || "Não identificado",
        nomeServidor: extrairRegEx(textoLimpo, /Servidor\(a\)[:;]?\s*([A-Za-zÀ-ÿ\s]+?)(?=\s*(?:Matrícula|SIAPE|Cargo|Lotação|$))/i) || "Servidor Não Identificado",
        siape: extrairRegEx(textoLimpo, /(?:Matrícula\s*)?SIAPE[:;]?\s*(\d+)/i) || "Não identificado",
        cargo: extrairRegEx(textoLimpo, /Cargo[:;]?\s*([^\n\r;]+?)(?=\s*(?:Lotação|Data|$))/i) || "Assistente em Administração",
        lotacao: extrairRegEx(textoLimpo, /Lotação[:;]?\s*([^\n\r;]+?)(?=\s*(?:Data|$))/i) || "UFFS",
        
        // Dados do RSC e Legislação (Decreto 13.048/2026)
        iqAtual: rawIQ,
        nivelSolicitado: nivelFormatado,
        nivelRsc: rawNivel,
        nivelConcedido: rawNivel,
        percentual: rawIQ + "%",
        
        // Pontuação
        pontuacaoObtida: pontos,
        pontuacaoTotal: pontos,
        
        // Datas (A chave dataExercicioComissao é utilizada pelo app.js)
        dataExercicioComissao: dataExercicioIso,
        dataExercicio: dataExercicioIso,
        dataRequerimento: extrairRegEx(textoLimpo, /Data do requerimento[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || "",
        dataVigencia: extrairRegEx(textoLimpo, /Vigência da Concessão a partir de[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || "",
        
        // Resultado do Parecer da Comissão
        resultado: eFavoravel ? "DEFERIDO" : "INDEFERIDO"
    };

    return dados;
}

function extrairRegEx(texto, regex) {
    const match = texto.match(regex);
    return match && match[1] ? match[1].trim() : null;
}

// Mapeia a função globalmente para compatibilidade com o app.js
window.parseParecerCRSC = extrairDadosParecerCRSC;
window.extrairDadosParecerCRSC = extrairDadosParecerCRSC;
