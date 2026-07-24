/**
 * Extrator de dados do Parecer da CRSC
 */
async function extrairDadosParecerCRSC(file) {
    // Utiliza pdfjsLib/OCR já existente na aplicação
    const textoCompleto = await extrairTextoDoPDF(file);

    const dados = {
        nomeServidor: extrairRegEx(textoCompleto, /Nome(?:\sdo\sServidor)?:?\s*([^\n\r]+)/i),
        siape: extrairRegEx(textoCompleto, /SIAPE:?\s*(\d+)/i),
        cargo: extrairRegEx(textoCompleto, /Cargo:?\s*([^\n\r]+)/i),
        lotacao: extrairRegEx(textoCompleto, /Lotação|Unidade:?\s*([^\n\r]+)/i),
        nivelRsc: extrairRegEx(textoCompleto, /RSC-?(I|II|III)/i),
        resultado: textoCompleto.includes("DEFERIDO") ? "DEFERIDO" : "INDEFERIDO",
        pontuacaoTotal: extrairRegEx(textoCompleto, /Pontuação\s*Total:?\s*([\d,\.]+)/i),
        dataParecerCRSC: extrairRegEx(textoCompleto, /Chapecó[^\n]*(\d{2}\/\d{2}\/\d{4})/i),
        numeroProcesso: extrairRegEx(textoCompleto, /Processo[^\d]*(\d{23}|\d{5}\.\d{6}\/\d{4}-\d{2})/i)
    };

    return dados;
}

function extrairRegEx(texto, regex) {
    const match = texto.match(regex);
    return match ? match[1].trim() : "Não identificado";
}
