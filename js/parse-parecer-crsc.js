/**
 * Extrator de dados calibrado para Pareceres CRSC/UFFS
 * Suporta múltiplos formatos do SIPAC e captura garantida de Processo e Exercício
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

    // Normaliza múltiplos espaços e quebras de linha em espaço simples
    const textoLimpo = textoCompleto.replace(/\s+/g, ' ');

    // 1. Mapeamento do Campus / CRSC Responsável
    const comissoesValidas = [
        "Cerro Largo", "Chapecó", "Erechim", "Laranjeiras do Sul", "Realeza", "Reitoria", "Passo Fundo"
    ];

    let comissaoIdentificada = "Passo Fundo"; // Fallback
    for (const comissao of comissoesValidas) {
        const regexComissao = new RegExp(`(?:CRSC(?:-PCCTAE)?|Campus|Unidade)\\s*(?:da|do)?\\s*${comissao}`, "i");
        if (regexComissao.test(textoLimpo) || new RegExp(`Unidade:\\s*Campus\\s*${comissao}`, "i").test(textoLimpo)) {
            comissaoIdentificada = comissao;
            break;
        }
    }

    // 2. Captura do Número do Processo (SIPAC: 23205.XXXXXX/XXXX-XX)
    const matchProcessoPadrao = textoLimpo.match(/23205\.\d{6}\/\d{4}-\d{2}/);
    const numeroProcessoExtraido = matchProcessoPadrao ? matchProcessoPadrao[0] : (
        extrairRegEx(textoLimpo, /Processo[:;]?\s*([\d\.\/-]{15,25})/i) || "Não identificado"
    );

    // 3. Resultado do Parecer
    const eFavoravel = /Parecer[:;]?\s*Favorável/i.test(textoLimpo) || 
                       (!/Não Favorável|Desfavorável/i.test(textoLimpo) && /Favorável/i.test(textoLimpo));

    // 4. Captura da Pontuação Homologada
    const pontos = extrairRegEx(textoLimpo, /Pontuação\s*obtida[:;]?\s*([\d\.,]+)/i) || 
                   extrairRegEx(textoLimpo, /Total\s*de\s*pontos\s*aceitos[:;]?\s*([\d\.,]+)/i) || 
                   extrairRegEx(textoLimpo, /Total\s*de\s*pontos\s*aceitos\s*neste\s*relatório[:;]?\s*([\d\.,]+)/i) ||
                   extrairRegEx(textoLimpo, /(?:Pontuação|Pontos)[:;]?\s*([\d\.,]+)/i) || "0";

    // 5. Nível RSC Solicitado / Concedido
    let rawNivel = extrairRegEx(textoLimpo, /Nível\s*(?:de\s*RSC\s*requerido|concedido)[:;]?\s*([^;]+?)(?=\s*(?:Percentual|Data|$))/i) || 
                   extrairRegEx(textoLimpo, /(RSC-PCCTAE\s*[I|V|X]+|RSC-[I|V|X]+|Nível\s*[I|V|X]+)/i) || "RSC-V";
    
    let nivelApenasRomano = extrairRegEx(rawNivel, /([I|V|X]+)/i) || "V";
    nivelApenasRomano = nivelApenasRomano.toUpperCase();

    // 6. Tabela de Correspondência Oficial (Nível RSC -> Percentual IQ)
    const tabelaRscParaPercentual = {
        'VI': '75',
        'V': '52',
        'IV': '30',
        'III': '25',
        'II': '20',
        'I': '15'
    };

    let percentualFinal = tabelaRscParaPercentual[nivelApenasRomano] || "52";

    // 7. Data de Início do Exercício
    const rawDataExercicio = extrairRegEx(textoLimpo, /Data\s*de\s*início\s*do\s*exercício\s*no\s*cargo\s*atual[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || 
                             extrairRegEx(textoLimpo, /Data\s*de\s*Exercício[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || 
                             extrairRegEx(textoLimpo, /exercício[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || "";

    // Outras datas
    const rawDataDecisao = extrairRegEx(textoLimpo, /exarada\s*em\s*(\d{2}\/\d{2}\/\d{4})/i) ||
                           extrairRegEx(textoLimpo, /Data\s*do\s*requerimento[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || "";

    const rawDataVigencia = extrairRegEx(textoLimpo, /Vigência\s*da\s*Concessão\s*a\s*partir\s*de[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) ||
                            extrairRegEx(textoLimpo, /a\s*partir\s*de[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || "";

    // Converte Data de Exercício para formato ISO (YYYY-MM-DD)
    let dataExercicioIso = "";
    if (rawDataExercicio) {
        const partes = rawDataExercicio.split('/');
        if (partes.length === 3) {
            dataExercicioIso = `${partes[2]}-${partes[1]}-${partes[0]}`;
        }
    }

    return {
        numeroProcesso: numeroProcessoExtraido,
        nomeServidor: extrairRegEx(textoLimpo, /Servidor\(a\)[:;]?\s*([A-Za-zÀ-ÿ\s]+?)(?=\s*(?:Matrícula|SIAPE|Cargo|Lotação|$))/i) || 
                      extrairRegEx(textoLimpo, /INTERESSADO\(A\)[:;]?\s*([A-Za-zÀ-ÿ\s]+?)(?=\s*(?:MATRÍCULA|SIAPE|CARGO|LOTAÇÃO|$))/i) || "Servidor Não Identificado",
        siape: extrairRegEx(textoLimpo, /(?:Matrícula\s*)?SIAPE[:;]?\s*(\d+)/i) || "Não identificado",
        cargo: extrairRegEx(textoLimpo, /Cargo[:;]?\s*([^\n\r;]+?)(?=\s*(?:Lotação|Data|$))/i) || "Assistente em Administração",
        lotacao: extrairRegEx(textoLimpo, /Lotação[:;]?\s*([^\n\r;]+?)(?=\s*(?:Data|Nível|$))/i) || "UFFS",
        
        campusCRSC: comissaoIdentificada,
        dataDecisaoCRSC: rawDataDecisao,
        
        iqAtual: percentualFinal,
        nivelSolicitado: `RSC-${nivelApenasRomano}`,
        nivelRscRomano: nivelApenasRomano,
        percentual: percentualFinal + "%",
        pontuacaoObtida: pontos,
        
        dataExercicioComissao: dataExercicioIso,
        dataExercicio: dataExercicioIso,
        dataRequerimento: extrairRegEx(textoLimpo, /Data\s*do\s*requerimento[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || "",
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
