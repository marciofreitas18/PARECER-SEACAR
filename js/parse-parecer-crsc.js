/**
 * Realiza a leitura e extração de dados do Parecer da CRSC-PCCTAE/UFFS
 */
async function parseParecerCRSC(file) {
    if (typeof pdfjsLib === 'undefined') {
        throw new Error("A biblioteca PDF.js não foi carregada corretamente.");
    }

    const statusEl = document.getElementById('statusLeitura');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true
    }).promise;
    
    let textoCompleto = '';

    // 1. Extração do texto do PDF (preservando quebras para leitura estruturada)
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        textoCompleto += pageText + '\n';
    }

    let textoLimpo = normalizarTexto(textoCompleto);

    // 2. OCR Fallback caso o documento seja imagem/escaneado
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
                textoCompleto += (result.data ? result.data.text : '') + '\n';
            } else {
                throw new Error("Tesseract.js não foi carregado.");
            }
        }
        textoLimpo = normalizarTexto(textoCompleto);
    }

    console.log("=== TEXTO INTEGRAL EXTRAÍDO DO PDF ===");
    console.log(textoLimpo);

    return {
        nomeServidor: extrairNomeServidor(textoLimpo),
        siape: extrairSiape(textoLimpo),
        cargo: extrairCargoServidor(textoLimpo),
        lotacao: extrairLotacao(textoLimpo),
        dataExercicioComissao: extrairDataExercicio(textoLimpo),
        dataVigenciaCRSC: extrairDataParecer(textoLimpo),
        nivelSolicitado: extrairNivelRSC(textoLimpo),
        pontuacaoObtida: extrairPontos(textoLimpo),
        numeroProcesso: extrairProcesso(textoLimpo)
    };
}

function normalizarTexto(texto) {
    if (!texto) return '';
    return texto
        .replace(/\r/g, '')
        .replace(/[ \t]+/g, ' ')
        .trim();
}

/**
 * Busca pelo nome do servidor
 */
function extrairNomeServidor(texto) {
    const regexes = [
        /Servidor\(a\)[\s:]*([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{4,60})(?=\s*(?:Matrícula|SIAPE|Cargo|Lotação|Data|\n|$))/i,
        /(?:Interessado|Interessada|Requerente)[\s:]*([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{4,60})/i
    ];
    for (const reg of regexes) {
        const m = texto.match(reg);
        if (m && m[1]) {
            return limpaTextoCapturado(m[1]);
        }
    }
    return '';
}

/**
 * Busca pelo Cargo
 */
function extrairCargoServidor(texto) {
    const regexes = [
        /Cargo[\s:]*([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s\/–-]{4,50})(?=\s*(?:Lotação|Data|Matrícula|SIAPE|Nível|\n|$))/i,
        /ocupante\s+do\s+cargo\s+de[\s:]*([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s\/–-]{4,50})/i
    ];
    for (const reg of regexes) {
        const m = texto.match(reg);
        if (m && m[1]) {
            return limpaTextoCapturado(m[1]);
        }
    }
    return '';
}

/**
 * Busca pela Lotação
 */
function extrairLotacao(texto) {
    const regexes = [
        /Lotação[\s:]*([A-ZÁÉÍÓÚÂÊÔÃÕÇa-záéíóúâêôãõç0-9\s\/–-]{3,80})(?=\s*(?:Data|Matrícula|SIAPE|Nível|Pontuação|Processo|\n|$))/i,
        /Lotação\s+do\s+Servidor[\s:]*([A-ZÁÉÍÓÚÂÊÔÃÕÇa-záéíóúâêôãõç0-9\s\/–-]{3,80})/i
    ];
    for (const reg of regexes) {
        const m = texto.match(reg);
        if (m && m[1]) {
            return limpaTextoCapturado(m[1]);
        }
    }
    return '';
}

/**
 * Busca por "Matrícula SIAPE:"
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
    const matchDigitos = texto.match(/\b([0-9]{7})\b/);
    return matchDigitos ? matchDigitos[1] : '';
}

/**
 * Busca pela data de exercício no cargo atual
 */
function extrairDataExercicio(texto) {
    const reg = /(?:Data\s+de\s+início\s+do\s+exercício\s+no\s+cargo\s+atual|Início\s+no\s+cargo|Exercício\s+no\s+cargo)[\s:]*([0-9]{2}[\/\.-][0-9]{2}[\/\.-][0-9]{4})/i;
    const match = texto.match(reg);
    if (match && match[1]) {
        const partes = match[1].replace(/[\.-]/g, '/').split('/');
        if (partes.length === 3) {
            return `${partes[2]}-${partes[1]}-${partes[0]}`;
        }
    }
    return '';
}

/**
 * Busca pela Data do Parecer
 */
function extrairDataParecer(texto) {
    const regexes = [
        /(?:Data\s+do\s+Parecer|Data\s+do\s+Vigência\s+da\s+Concessão|Chapecó)[\s,:-]*([0-9]{2}[\/\.-][0-9]{2}[\/\.-][0-9]{4})/i,
        /([0-9]{2}[\/\.-][0-9]{2}[\/\.-][0-9]{4})/
    ];
    for (const reg of regexes) {
        const match = texto.match(reg);
        if (match && match[1]) {
            const partes = match[1].replace(/[\.-]/g, '/').split('/');
            if (partes.length === 3) {
                return `${partes[2]}-${partes[1]}-${partes[0]}`;
            }
        }
    }
    return '';
}

/**
 * Busca pela pontuação
 */
function extrairPontos(texto) {
    const reg = /Pontuação\s+obtida[\s:]*([0-9]+(?:[.,][0-9]+)?)/i;
    const match = texto.match(reg);
    if (match && match[1]) {
        return match[1].replace(',', '.');
    }
    return '';
}

/**
 * Busca pelo Nível de RSC
 */
function extrairNivelRSC(texto) {
    const reg = /(?:Nível\s+de\s+RSC\s+requerido|Nível\s+concedido)[\s:]*(?:RSC\s*[-–]?\s*PCCTAE|RSC)?\s*([I|V|X]+)/i;
    const match = texto.match(reg);
    if (match && match[1]) {
        return `RSC-${match[1].toUpperCase()}`;
    }
    return '';
}

/**
 * Busca pelo Número do Processo
 */
function extrairProcesso(texto) {
    const match = texto.match(/23205[\s.]*[0-9]{6}[\/\s]*[0-9]{4}[-.\s]*[0-9]{2}/i);
    if (match) {
        return match[0].replace(/\s+/g, '').replace(/[\/]/g, '/');
    }
    const matchGeral = texto.match(/([0-9]{5}\.[0-9]{6}\/[0-9]{4}-[0-9]{2})/);
    return matchGeral ? matchGeral[1] : '';
}

function limpaTextoCapturado(txt) {
    if (!txt) return '';
    return txt
        .replace(/[\n\r]/g, ' ')
        .split(/(?:Matrícula|SIAPE|Processo|CPF|Cargo|Lotação|Nível|Classe|UF|Data)/i)[0]
        .replace(/\s+/g, ' ')
        .trim();
}

window.parseParecerCRSC = parseParecerCRSC;
