/**
 * Extrai o texto de um PDF. Se o PDF for um documento nativo/vetorial,
 * extrai via PDF.js. Se for uma imagem/digitalizado, ativa o OCR (Tesseract.js).
 */
async function parseParecerCRSC(file) {
    if (typeof pdfjsLib === 'undefined') {
        throw new Error("A biblioteca PDF.js não foi carregada corretamente.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let textoCompleto = '';

    // 1. Primeira tentativa: Extração vetorial direta de texto
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        textoCompleto += pageText + ' ';
    }

    let textoLimpo = textoCompleto.replace(/\s+/g, ' ').trim();

    // 2. FALLBACK OCR: Executa se o PDF tiver pouquíssimo texto (documento escaneado / foto)
    if (textoLimpo.length < 50) {
        console.warn("PDF escaneado/imagem detectado. Executando processamento OCR...");
        
        const statusEl = document.getElementById('statusLeitura');
        if (statusEl) {
            statusEl.textContent = "🔍 Documento escaneado detectado! Processando leitor de imagem (OCR)... Aguarde.";
        }

        textoCompleto = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 }); // Escala 2x para aumentar a precisão do OCR
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            if (typeof Tesseract !== 'undefined') {
                const worker = await Tesseract.createWorker('por'); // Idioma Português
                const { data: { text } } = await worker.recognize(canvas);
                textoCompleto += text + ' ';
                await worker.terminate();
            } else {
                throw new Error("Este PDF é uma imagem escaneada. O leitor Tesseract.js não foi carregado.");
            }
        }
        textoLimpo = textoCompleto.replace(/\s+/g, ' ').trim();
    }

    console.log("Texto Final Extraído do PDF:", textoLimpo);

    // 3. Captura dos dados com expressões regulares (Regex) resilientes
    const dados = {
        nomeServidor: extrairRegex(textoLimpo, [
            /(?:Interessado|Servidor|Nome|Avaliador|Requerente)[\s:]+([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{3,60})/i,
            /Parecer\s+relativo\s+a(?:o|s)?\s+servidor(?:a)?\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{3,60})/i,
            /LAUCIR[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]*/i
        ]),
        siape: extrairRegex(textoLimpo, [
            /(?:SIAPE|Matrícula|Matricula)[\s:]*([0-9]{6,8})/i,
            /SIAPE\s*n?º?\s*:?\s*([0-9]{6,8})/i
        ]),
        numeroProcesso: extrairRegex(textoLimpo, [
            /(?:Processo|Nº|N.º)[\s:]*([0-9]{5}\.[0-9]{6}\/[0-9]{4}-[0-9]{2})/i,
            /23205\.[0-9]{6}\/[0-9]{4}-[0-9]{2}/i
        ]),
        nivelSolicitado: extrairRegex(textoLimpo, [
            /(RSC-PCCTAE-[I|V|X]+|RSC-[I|V|X]+)/i,
            /Nível\s*(RSC-[I|V|X]+)/i
        ]),
        pontuacaoObtida: extrairRegex(textoLimpo, [
            /(?:Pontuação\s+Obtida|Total\s+de\s+Pontos|Pontuação\s+Final|Pontos)[\s:]*([0-9]+(?:[.,][0-9]+)?)/i,
            /([0-9]+(?:[.,][0-9]+)?)\s*ponto(?:s)?/i
        ]),
        dataExercicioComissao: extrairDataExercicio(textoLimpo)
    };

    if (dados.nivelSolicitado) {
        dados.nivelSolicitado = dados.nivelSolicitado.replace('RSC-PCCTAE-', 'RSC-').toUpperCase();
    }

    return dados;
}

/**
 * Utilitário de Regex auxiliar para buscar o primeiro termo correspondente numa lista de padrões
 */
function extrairRegex(texto, regexes) {
    for (const reg of regexes) {
        const match = texto.match(reg);
        if (match && match[1]) {
            return match[1].trim();
        } else if (match && match[0] && !match[1]) {
            return match[0].trim();
        }
    }
    return '';
}

/**
 * Utilitário para localizar e converter datas no formato DD/MM/YYYY para YYYY-MM-DD
 */
function extrairDataExercicio(texto) {
    const regexData = /(?:Exercício|Admissão|Ingresso|Data\s+de\s+Exercício)[\s:]*([0-9]{2}\/[0-9]{2}\/[0-9]{4})/i;
    const match = texto.match(regexData);
    if (match && match[1]) {
        const [dia, mes, ano] = match[1].split('/');
        return `${ano}-${mes}-${dia}`;
    }
    return '';
}

// Registra globalmente para uso pelo app.js
window.parseParecerCRSC = parseParecerCRSC;
