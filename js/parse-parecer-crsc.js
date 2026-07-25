/**
 * Extrator de dados calibrado e ultra-resiliente para Pareceres CRSC/UFFS
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

    // Normaliza espaços e caracteres
    const textoLimpo = textoCompleto.replace(/\s+/g, ' ');

    // 1. Número do Processo (SIPAC UFFS: 23205.XXXXXX/XXXX-XX)
    const matchProc = textoLimpo.match(/23205\.\d{6}\/\d{4}-\d{2}/);
    const numProcesso = matchProc ? matchProc[0] : (
        extrairRegEx(textoLimpo, /Processo[:;]?\s*([\d\.\/-]{15,25})/i) || "Não identificado"
    );

    // 2. Servidor(a) / Interessado(a)
    const nomeServidor = extrairRegEx(textoLimpo, /Servidor\(a\)[:;]?\s*([A-Za-zÀ-ÿ\s]+?)(?=\s*(?:Matrícula|SIAPE|Cargo|Lotação|$))/i) ||
                         extrairRegEx(textoLimpo, /INTERESSADO\(A\)[:;]?\s*([A-Za-zÀ-ÿ\s]+?)(?=\s*(?:MATRÍCULA|SIAPE|CARGO|LOTAÇÃO|$))/i) || "Servidor Não Identificado";

    // 3. Matrícula SIAPE
    const siape = extrairRegEx(textoLimpo, /SIAPE[:;]?\s*(\d+)/i) || "Não identificado";

    // 4. Cargo e Lotação
    const cargo = extrairRegEx(textoLimpo, /Cargo[:;]?\s*([^\n\r;]+?)(?=\s*(?:Lotação|Data|$))/i) || "Assistente em Administração";
    const lotacao = extrairRegEx(textoLimpo, /Lotação[:;]?\s*([^\n\r;]+?)(?=\s*(?:Data|Nível|$))/i) || "UFFS";

    // 5. CRSC / Campus Responsável
    const comissoesValidas = ["Cerro Largo", "Chapecó", "Erechim", "Laranjeiras do Sul", "Realeza", "Reitoria", "Passo Fundo"];
    let campusIdentificado = "Passo Fundo";
    for (const c of comissoesValidas) {
        if (new RegExp(c, "i").test(textoLimpo)) {
            campusIdentificado = c;
            break;
        }
    }

    // 6. Pontuação Homologada
    const pontos = extrairRegEx(textoLimpo, /Pontuação\s*obtida[:;]?\s*([\d\.,]+)/i) || 
                   extrairRegEx(textoLimpo, /Total\s*de\s*pontos\s*aceitos\s*neste\s*relatório[:;]?\s*([\d\.,]+)/i) ||
                   extrairRegEx(textoLimpo, /Total\s*de\s*pontos\s*aceitos[:;]?\s*([\d\.,]+)/i) || "0";

    // 7. Nível RSC e Percentual
    let rawNivel = extrairRegEx(textoLimpo, /Nível\s*(?:de\s*RSC\s*requerido|concedido)[:;]?\s*([^;]+?)(?=\s*(?:Percentual|Data|$))/i) || "RSC-V";
    let nivelRomano = (extrairRegEx(rawNivel, /([I|V|X]+)/i) || "V").toUpperCase();

    const tabelaRscParaPercentual = { 'VI': '75', 'V': '52', 'IV': '30', 'III': '25', 'II': '20', 'I': '15' };
    let percentualFinal = tabelaRscParaPercentual[nivelRomano] || "52";

    // 8. Data de Início do Exercício
    const rawDataExercicio = extrairRegEx(textoLimpo, /exercício\s*(?:no\s*cargo\s*atual)?[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || "";

    let dataExercicioIso = "";
    if (rawDataExercicio) {
        const p = rawDataExercicio.split('/');
        if (p.length === 3) dataExercicioIso = `${p[2]}-${p[1]}-${p[0]}`;
    }

    // Outras datas
    const rawDataRequerimento = extrairRegEx(textoLimpo, /Data\s*do\s*requerimento[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || "";
    const rawDataVigencia = extrairRegEx(textoLimpo, /a\s*partir\s*de[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || rawDataRequerimento;

    // 9. Resultado Parecer
    const eFavoravel = !/Não\s*Favorável|Desfavorável/i.test(textoLimpo) && /Favorável/i.test(textoLimpo);

    return {
        // Chaves duplas para compatibilidade total com a interface do seu sistema
        numeroProcesso: numProcesso,
        processo: numProcesso,
        
        nomeServidor: nomeServidor,
        servidor: nomeServidor,
        
        siape: siape,
        cargo: cargo,
        lotacao: lotacao,
        
        campusCRSC: campusIdentificado,
        
        iqAtual: percentualFinal,
        nivelSolicitado: `RSC-${nivelRomano}`,
        nivelRscRomano: nivelRomano,
        percentual: percentualFinal + "%",
        pontuacaoObtida: pontos,
        pontos: pontos,
        
        dataExercicio: dataExercicioIso,
        dataExercicioComissao: dataExercicioIso,
        dataRequerimento: rawDataRequerimento,
        dataVigencia: rawDataVigencia,
        dataDecisaoCRSC: rawDataRequerimento,
        resultado: eFavoravel ? "DEFERIDO" : "INDEFERIDO"
    };
}

function extrairRegEx(texto, regex) {
    const match = texto.match(regex);
    return match && match[1] ? match[1].trim() : null;
}

// Vincula a ambas as nomenclaturas de janela
window.parseParecerCRSC = extrairDadosParecerCRSC;
window.extrairDadosParecerCRSC = extrairDadosParecerCRSC;
