/**
 * Realiza a leitura e extração de dados do PDF (Parecer da CRSC)
 * Suporta PDFs vetoriais e PDFs digitalizados/escaneados via OCR.
 */
async function parseParecerCRSC(file) {
    if (typeof pdfjsLib === 'undefined') {
        throw new Error("A biblioteca PDF.js não foi carregada corretamente.");
    }

    const statusEl = document.getElementById('statusLeitura');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let textoCompleto = '';

    // 1. Tenta extrair texto nativo do PDF
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        textoCompleto += pageText + ' ';
    }

    let textoLimpo = normalizarTexto(textoCompleto);

    // 2. Se não houver texto suficiente (ex: documento escaneado/imagem) -> Executa OCR
    if (textoLimpo.length < 40) {
        if (statusEl) {
            statusEl.className = "alert alert-warning text-center shadow-sm rounded-3";
            statusEl.innerHTML = "🔍 <strong>Documento em imagem/escaneado detectado!</strong> Executando OCR em português...";
        }

        textoCompleto = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            if (statusEl) {
                statusEl.innerHTML = `🔍 Processando OCR na página ${i} de ${pdf.numPages}... Aguarde.`;
            }

            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.5 }); // Escala 2.5x para máxima clareza do OCR
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            if (typeof Tesseract !== 'undefined') {
                const result = await Tesseract.recognize(canvas, 'por', {
                    logger: m => {
                        if (m.status === 'recognizing text' && statusEl) {
                            const pct = Math.round((m.progress || 0) * 100);
                            statusEl.innerHTML = `⌛ Lendo imagem da página ${i}/${pdf.numPages} (${pct}%)...`;
                        }
                    }
                });
                textoCompleto += (result.data ? result.data.text : '') + ' ';
            } else {
                throw new Error("Tesseract.js (OCR) não carregado no index.html.");
            }
        }
        textoLimpo = normalizarTexto(textoCompleto);
    }

    console.log("=== TEXTO BRUTO OBTIDO DO PDF ===");
    console.log(textoLimpo);

    // 3. Extração dos Dados via Expressões Regulares Flexíveis
    const dados = {
        nomeServidor: extrairNomeServidor(textoLimpo),
        siape: extrairSiape(textoLimpo),
        numeroProcesso: extrairProcesso(textoLimpo),
        nivelSolicitado: extrairNivelRSC(textoLimpo),
        pontuacaoObtida: extrairPontos(textoLimpo),
        dataExercicioComissao: extrairDataExercicio(textoLimpo)
    };

    return dados;
}

/**
 * Normaliza e limpa o texto removendo quebras de linha e caracteres ruidosos
 */
function normalizarTexto(texto) {
    if (!texto) return '';
    return texto
        .replace(/\r?\n|\r/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Busca por nomes de servidores, incluindo padrões com 'LAUCIR' e variações de OCR
 */
function extrairNomeServidor(texto) {
    // Busca direta para caso o nome do Laucir apareça com ruídos de OCR
    const matchLaucir = texto.match(/(LAUCIR[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{3,50})/i);
    if (matchLaucir) {
        return limpaTextoCapturado(matchLaucir[1]);
    }

    const regexes = [
        /(?:Interessado|Servidor|Nome|Avaliador|Requerente|Servidora)[\s:-]+([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{3,50})/i,
        /relativo\s+a(?:o|s)?\s+servidor(?:a)?\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{3,50})/i,
        /parecer\s+de\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{3,50})/i
    ];

    for (const reg of regexes) {
        const m = texto.match(reg);
        if (m && m[1]) {
            return limpaTextoCapturado(m[1]);
        }
    }
    return '';
}

function limpaTextoCapturado(txt) {
    return txt.split(/(?:SIAPE|Matrícula|Processo|CPF|Cargo|Nível|UF)/i)[0].trim();
}

function extrairSiape(texto) {
    // Trata erros comuns do OCR como trocar o número 5 por S ou 0 por O
    const regex = /(?:SIAPE|S1APE|5IAPE|Matrícula|Matricula)[\s:ºn°]*([0-9OISl]{6,9})/i;
    const match = texto.match(regex);
    if (match && match[1]) {
        return match[1]
            .replace(/O/gi, '0')
            .replace(/I/gi, '1')
            .replace(/S/gi, '5')
            .replace(/l/gi, '1');
    }
    // Fallback de 7 dígitos isolados
    const matchDigitos = texto.match(/\b([0-9]{7})\b/);
    return matchDigitos ? matchDigitos[1] : '';
}

function extrairProcesso(texto) {
    const match = texto.match(/23205[\s.]*[0-9]{6}[\/\s]*[0-9]{4}[-.\s]*[0-9]{2}/i);
    if (match) {
        return match[0].replace(/\s+/g, '').replace(/[\/]/g, '/');
    }
    const matchGeral = texto.match(/([0-9]{5}\.[0-9]{6}\/[0-9]{4}-[0-9]{2})/);
    return matchGeral ? matchGeral[1] : '';
}

function extrairNivelRSC(texto) {
    const match = texto.match(/RSC\s*[-–]?\s*(PCCTAE\s*[-–]?)?\s*([I|V|X]+)/i);
    if (match) {
        return `RSC-${match[2].toUpperCase()}`;
    }
    return '';
}

function extrairPontos(texto) {
    const regex = /(?:Pontuação|Pontos|Total|Pontos\s+Obtidos)[\s:]*([0-9]+(?:[.,][0-9]+)?)/i;
    const match = texto.match(regex);
    if (match && match[1]) {
        return match[1].replace(',', '.');
    }
    return '0';
}

function extrairDataExercicio(texto) {
    const regex = /(?:Exercício|Admissão|Ingresso)[\s:]*([0-9]{2}[\/\.-][0-9]{2}[\/\.-][0-9]{4})/i;
    const match = texto.match(regex);
    if (match && match[1]) {
        const partes = match[1].replace(/[\.-]/g, '/').split('/');
        return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    return '';
}

window.parseParecerCRSC = parseParecerCRSC;
