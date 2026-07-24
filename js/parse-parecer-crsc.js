/**
 * Extrator de dados calibrado para o Parecer CRSC-PCCTAE da UFFS
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

    // Identifica se o parecer é Favorável (DEFERIDO)
    const eFavoravel = /Parecer[:;]?\s*Favorável/i.test(textoLimpo) || 
                       (!/Não Favorável|Desfavorável/i.test(textoLimpo) && /Favorável/i.test(textoLimpo));

    // Captura da pontuação obtida no parecer
    const pontos = extrairRegEx(textoLimpo, /Pontuação obtida[:;]?\s*(\d+)/i) || 
                   extrairRegEx(textoLimpo, /(?:Pontuação|Pontos|Total)[:;]?\s*([\d,\.]+)/i) || "0";

    const dados = {
        // Dados do Processo e Servidor
        numeroProcesso: extrairRegEx(textoLimpo, /Processo[:;]?\s*([\d\.\/-]+)/i) || "Não identificado",
        nomeServidor: extrairRegEx(textoLimpo, /Servidor\(a\)[:;]?\s*([A-ZÁÉÍÓÚÃÕÂÊÔ\s]+?)(?=\s*(?:Matrícula|SIAPE|Cargo|Lotação|$))/i) || "Servidor Não Identificado",
        siape: extrairRegEx(textoLimpo, /(?:Matrícula\s*)?SIAPE[:;]?\s*(\d+)/i) || "Não identificado",
        cargo: extrairRegEx(textoLimpo, /Cargo[:;]?\s*([^\n\r;]+?)(?=\s*(?:Lotação|Data|$))/i) || "Assistente em Administração",
        lotacao: extrairRegEx(textoLimpo, /Lotação[:;]?\s*([^\n\r;]+?)(?=\s*(?:Data|$))/i) || "UFFS",
        
        // Dados do RSC
        nivelRsc: extrairRegEx(textoLimpo, /Nível de RSC requerido[:;]?\s*([^;]+?)(?=\s*(?:Percentual|Data|$))/i) || "RSC-PCCTAE V",
        nivelConcedido: extrairRegEx(textoLimpo, /Nível concedido[:;]?\s*([^;]+?)(?=\s*(?:Percentual|Vigência|$))/i) || "RSC-PCCTAE V",
        percentual: extrairRegEx(textoLimpo, /Percentual correspondente[:;]?\s*(\d+%?)/i) || "52%",
        
        // Mapeia os pontos para ambas as chaves (evita o erro undefined)
        pontuacaoObtida: pontos,
        pontuacaoTotal: pontos,
        
        // Datas e Resultado
        dataRequerimento: extrairRegEx(textoLimpo, /Data do requerimento[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || "",
        dataVigencia: extrairRegEx(textoLimpo, /Vigência da Concessão a partir de[:;]?\s*(\d{2}\/\d{2}\/\d{4})/i) || "",
        resultado: eFavoravel ? "DEFERIDO" : "INDEFERIDO"
    };

    return dados;
}

function extrairRegEx(texto, regex) {
    const match = texto.match(regex);
    return match && match[1] ? match[1].trim() : null;
}
