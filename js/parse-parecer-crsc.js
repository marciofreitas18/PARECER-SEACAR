/**
 * Realiza a leitura e extração de dados do Parecer da CRSC-PCCTAE/UFFS
 */
async function parseParecerCRSC(file) {
    if (typeof pdfjsLib === 'undefined') {
        throw new Error("A biblioteca PDF.js não foi carregada corretamente.");
    }

    const statusEl = document.getElementById('statusLeitura');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let textoCompleto = '';

    // 1. Extração do texto do PDF
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        textoCompleto += pageText + ' ';
    }

    let textoLimpo = normalizarTexto(textoCompleto);

    // 2. Fallback para OCR caso seja PDF escaneado (imagem)
    if (textoLimpo.length < 40) {
        if (statusEl) {
            statusEl.className = "alert alert-warning text-center shadow-sm rounded-3";
            statusEl.innerHTML = "🔍 Documento escaneado detectado! Processando OCR...";
        }

        textoCompleto = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.5 });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            if (typeof Tesseract !== 'undefined') {
                const result = await Tesseract.recognize(canvas, 'por');
                textoCompleto += (result.data ? result.data.text : '') + ' ';
            } else {
                throw new Error("Tesseract.js não foi carregado.");
            }
        }
        textoLimpo = normalizarTexto(textoCompleto);
    }

    console.log("=== TEXTO OBTIDO DO PARECER ===");
    console.log(textoLimpo);

    // 3. Mapeamento Direto com base no modelo do Parecer da CRSC
    return {
        nomeServidor: extrairNomeServidor(textoLimpo),
        siape: extrairSiape(textoLimpo),
        cargo: extrairCargoServidor(textoLimpo),
        dataExercicioComissao: extrairDataExercicio(textoLimpo),
        nivelSolicitado: extrairNivelRSC(textoLimpo),
        pontuacaoObtida: extrairPontos(textoLimpo),
        numeroProcesso: extrairProcesso(textoLimpo)
    };
}

function normalizarTexto(texto) {
    if (!texto) return '';
    return texto
        .replace(/\r?\n|\r/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Busca por "Servidor(a): [NOME]"
 */
function extrairNomeServidor(texto) {
    const reg = /(?:Servidor\(a\)|Servidor|Interessado\(a\)|Interessado)[\s:]+([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{4,60}?)(?=\s*(?:Matrícula|SIAPE|Cargo|Lotação|$))/i;
    const match = texto.match(reg);
    return match && match[1] ? match[1].trim() : '';
}

/**
 * Busca por "Matrícula SIAPE: [NÚMERO]"
 */
function extrairSiape(texto) {
    const reg = /(?:Matrícula\s*SIAPE|SIAPE)[\s:]*([0-9OISl]{6,9})/i;
    const match = texto.match(reg);
    if (match && match[1]) {
        return match[1]
            .replace(/O/gi, '0')
            .replace(/I/gi, '1')
            .replace(/S/gi, '5')
            .replace(/l/gi, '1');
    }
    return '';
}

/**
 * Busca por "Cargo: [NOME DO CARGO]"
 */
function extrairCargoServidor(texto) {
    const reg = /(?:Cargo)[\s:]+([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s\/–-]{4,50}?)(?=\s*(?:Lotação|Data|Matrícula|SIAPE|Nível|$))/i;
    const match = texto.match(reg);
    return match && match[1] ? match[1].trim() : '';
}

/**
 * Busca por "Data de início do exercício no cargo atual: [DATA]" ou "Vigência...: [DATA]"
 */
function extrairDataExercicio(texto) {
    const reg = /(?:Data\s+de\s+início\s+do\s+exercício\s+no\s+cargo\s+atual|Exercício|Vigência\s+da\s+Concessão\s+a\s+partir\s+de)[\s:]*([0-9]{2}[\/\.-][0-9]{2}[\/\.-][0-9]{4})/i;
    const match = texto.match(reg);
    if (match && match[1]) {
        const partes = match[1].replace(/[\.-]/g, '/').split('/');
        // Converte DD/MM/AAAA para AAAA-MM-DD (padrão aceito pelo <input type="date">)
        return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    return '';
}

/**
 * Busca por "Nível de RSC requerido: RSC-PCCTAE V" ou "RSC-V"
 */
function extrairNivelRSC(texto) {
    const reg = /(?:Nível\s+de\s+RSC\s+requerido|Nível\s+concedido|RSC)[\s:]*(?:RSC\s*[-–]?\s*PCCTAE|RSC)?\s*([I|V|X]+)/i;
    const match = texto.match(reg);
    if (match && match[1]) {
        return `RSC-${match[1].toUpperCase()}`;
    }
    return '';
}

/**
 * Busca por "Pontuação obtida: [PONTOS]"
 */
function extrairPontos(texto) {
    const reg = /(?:Pontuação\s+obtida)[\s:]*([0-9]+(?:[.,][0-9]+)?)/i;
    const match = texto.match(reg);
    if (match && match[1]) {
        return match[1].replace(',', '.');
    }
    return '';
}

/**
 * Extrai o número do processo UFFS (ex: 23205.XXXXXX/XXXX-XX ou Portaria/Designação)
 */
function extrairProcesso(texto) {
    const match = texto.match(/23205[\s.]*[0-9]{6}[\/\s]*[0-9]{4}[-.\s]*[0-9]{2}/i);
    if (match) {
        return match[0].replace(/\s+/g, '').replace(/[\/]/g, '/');
    }
    const matchGeral = texto.match(/([0-9]{5}\.[0-9]{6}\/[0-9]{4}-[0-9]{2})/);
    return matchGeral ? matchGeral[1] : '';
}

window.parseParecerCRSC = parseParecerCRSC;
