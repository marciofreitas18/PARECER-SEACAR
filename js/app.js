// Configuração do Worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

async function processarDocumentoCRSC() {
  const fileInput = document.getElementById('pdfFile');
  const statusDiv = document.getElementById('status');
  
  if (!fileInput.files[0]) {
    alert("Selecione o arquivo do Parecer/Relatório da CRSC!");
    return;
  }

  document.getElementById('statusSection').style.display = 'block';
  statusDiv.innerHTML = "Lendo texto do documento da comissão...";

  const file = fileInput.files[0];
  const arrayBuffer = await file.arrayBuffer();
  
  // 1. Extração de texto nativo (PDF.js)
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let textoCompleto = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    textoCompleto += strings.join(" ") + "\n";
  }

  // 2. OCR complementar para carimbos e blocos de assinatura digital achatados
  statusDiv.innerHTML = "Analisando assinaturas e blocos digitais (OCR)...";
  const worker = await Tesseract.createWorker('por+eng');
  const ret = await worker.recognize(file);
  let textoOCR = ret.data.text;
  await worker.terminate();

  statusDiv.innerHTML = "Leitura e validação concluídas!";
  
  // 3. Parser focado no resultado da CRSC
  const dadosExtraidos = parsearDocumentoCRSC(textoCompleto + "\n" + textoOCR);
  exibirMinutaParaAssinatura(dadosExtraidos);
}

function parsearDocumentoCRSC(texto) {
  // RegEx para identificar o resultado final, pontuação e assinaturas
  const deferido = /DEFERIDO/i.test(texto) && !/INDEFERIDO/i.test(texto);
  
  // Busca por padrões numéricos de pontuação (ex: "Pontuação Final: 45", "Total: 45 pontos")
  const matchPontos = texto.match(/(?:pontua[çc][ãa]o\s*final|total\s*de\s*pontos?)[:\s]*([\d.,]+)/i);
  const pontosFinal = matchPontos ? matchPontos[1] : "Não identificado";

  // Busca por assinaturas digitais / carimbos institucionais
  const temAssinaturaDigital = /assinado\s*digitalmente|SIPAC|gov\.br|ICP-Brasil/i.test(texto);

  return {
    resultado: deferido ? "DEFERIDO" : "INDEFERIDO / EM EXIGÊNCIA",
    pontos: pontosFinal,
    assinado: temAssinaturaDigital,
    rawText: texto
  };
}

function exibirMinutaParaAssinatura(dados) {
  const resSection = document.getElementById('resultadoSection');
  const div = document.getElementById('comparacaoCampos');
  
  resSection.style.display = 'block';
  div.innerHTML = `
    <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #0056b3; margin-bottom: 15px;">
      <h3>Resumo da Avaliação da CRSC</h3>
      <p><strong>Resultado Detectado:</strong> <span style="color: ${dados.resultado === 'DEFERIDO' ? 'green' : 'red'};">${dados.resultado}</span></p>
      <p><strong>Pontuação Homologada:</strong> ${dados.pontos}</p>
      <p><strong>Validação de Assinatura/Carimbo:</strong> ${dados.assinado ? '✓ Detectada' : '⚠️ Não identificada no texto nativo'}</p>
    </div>
    <label><strong>Texto Extraído para Conferência:</strong></label>
    <textarea rows="6" style="width:100%" readonly>${dados.rawText.substring(0, 1000)}...</textarea>
  `;
}
