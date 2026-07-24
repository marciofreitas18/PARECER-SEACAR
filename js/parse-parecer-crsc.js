/**
 * Extrator de dados do Parecer da CRSC via PDF.js
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

    // Procura as informações no texto extraído via Expressões Regulares (RegEx)
    const dados = {
        nomeServidor: extrairRegEx(textoCompleto, /(?:Nome|Servidor):\s*([A-ZÁÉÍÓÚÃÕÂÊÔ\s]+?)(?=\s*(?:SIAPE|Cargo|Lotação|\n|$))/i) || "Servidor não identificado",
        siape: extrairRegEx(textoCompleto, /SIAPE:?\s*(\d+)/i) || "Não identificado",
        cargo: extrairRegEx(textoCompleto, /Cargo:?\s*([^\n\r,]+)/i) || "Não identificado",
        lotacao: extrairRegEx(textoCompleto, /(?:Lotação|Unidade):?\s*([^\n\r,]+)/i) || "UFFS",
        nivelRsc: extrairRegEx(textoCompleto, /RSC-?\s*(I{1,3})/i) || "I",
        resultado: textoCompleto.toUpperCase().includes("DEFERIDO") ? "DEFERIDO" : "INDEFERIDO",
        pontuacaoTotal: extrairRegEx(textoCompleto, /(?:Pontuação|Pontos|Total):?\s*([\d,\.]+)/i) || "0",
        numeroProcesso: extrairRegEx(textoCompleto, /(?:Processo|Nº):?\s*(\d{5}\.\d{6}\/\d{4}-\d{2}|\d{23})/i) || "23205.XXXXXX/202X-XX"
    };

    return dados;
}

function extrairRegEx(texto, regex) {
    const match = texto.match(regex);
    return match && match[1] ? match[1].trim() : null;
}
