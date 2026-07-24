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

    // Normaliza espaços duplicados para facilitar a busca por expressão regular
    const textoLimpo = textoCompleto.replace(/\s+/g, ' ');

    // Extração dos dados baseada no modelo real do parecer
    const parecerStatus = extrairRegEx(textoLimpo, /Parecer:\s*(Favorável|Não Favorável|Desfavorável)/i) || "Favorável";
    
    const dados = {
        numeroProcesso: extrairRegEx(textoLimpo, /Processo:\s*([\d\.\/-]+)/i) || "Não identificado",
        nomeServidor: extrairRegEx(textoLimpo, /Servidor\(a\):\s*([A-ZÁÉÍÓÚÃÕÂÊÔ\s]+?)(?=\s*Matrícula|\s*SIAPE|\s*Cargo)/i) || "Servidor Não Identificado",
        siape: extrairRegEx(textoLimpo, /Matrícula SIAPE:\s*(\d+)/i) || "Não identificado",
        cargo: extrairRegEx(textoLimpo, /Cargo:\s*([^\n\r]+?)(?=\s*Lotação|\s*Data)/i) || "Assistente em Administração",
        lotacao: extrairRegEx(textoLimpo, /Lotação:\s*([^\n\r]+?)(?=\s*Data)/i) || "PROGESP",
        
        // Dados específicos do RSC
        nivelRsc: extrairRegEx(textoLimpo, /Nível de RSC requerido:\s*(RSC-PCCTAE\s*[I|V|X]+|RSC-[I|V|X]+|\d+)/i) || "RSC-PCCTAE V",
        nivelConcedido: extrairRegEx(textoLimpo, /Nível concedido:\s*(RSC-PCCTAE\s*[I|V|X]+|RSC-[I|V|X]+|\d+)/i) || "RSC-PCCTAE V",
        percentual: extrairRegEx(textoLimpo, /Percentual correspondente:\s*(\d+%?)/i) || "52%",
        
        // Pontuações
        pontuacaoExigida: extrairRegEx(textoLimpo, /Pontuação mínima exigida:\s*(\d+)/i) || "0",
        pontuacaoObtida: extrairRegEx(textoLimpo, /Pontuação obtida:\s*(\d+)/i) || "0",
        saldoPontos: extrairRegEx(textoLimpo, /Saldo de pontuação para novos pedidos:\s*(\d+)/i) || "0",
        
        // Datas e Parecer
        dataRequerimento: extrairRegEx(textoLimpo, /Data do requerimento:\s*(\d{2}\/\d{2}\/\d{4})/i) || "",
        dataVigencia: extrairRegEx(textoLimpo, /Vigência da Concessão a partir de:\s*(\d{2}\/\d{2}\/\d{4})/i) || "",
        parecer: parecerStatus,
        resultado: parecerStatus.toLowerCase().includes("favorável") && !parecerStatus.toLowerCase().includes("não") ? "DEFERIDO" : "INDEFERIDO"
    };

    return dados;
}

function extrairRegEx(texto, regex) {
    const match = texto.match(regex);
    return match && match[1] ? match[1].trim() : null;
}
