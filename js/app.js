// Aguarda o carregamento completo do HTML
document.addEventListener('DOMContentLoaded', () => {
  const inputPdf = document.getElementById('pdfCRSCInput');
  const statusDiv = document.getElementById('statusLeitura');
  const acoesDiv = document.getElementById('acoesGueracao');
  const btnSeacar = document.getElementById('btnGerarSeacar');
  const btnPortaria = document.getElementById('btnGerarPortaria');

  let dadosExtraidos = null;

  if (inputPdf) {
    inputPdf.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      statusDiv.classList.remove('d-none');
      statusDiv.textContent = "Lendo e extraindo dados do Parecer da CRSC...";

      try {
        // Função do arquivo parse-parecer-crsc.js
        dadosExtraidos = await extrairDadosParecerCRSC(file);
        
        statusDiv.className = "alert alert-success";
        statusDiv.textContent = `Dados extraídos com sucesso! Servidor: ${dadosExtraidos.nomeServidor || 'Identificado'}`;
        acoesDiv.classList.remove('d-none');
      } catch (error) {
        console.error(error);
        statusDiv.className = "alert alert-danger";
        statusDiv.textContent = "Erro ao processar o PDF. Verifique se o arquivo é um parecer válido.";
      }
    });
  }

  // 1. GERAÇÃO DO PARECER SEACAR EM HTML
  if (btnSeacar) {
    btnSeacar.addEventListener('click', () => {
      if (!dadosExtraidos) return alert("Envie um PDF primeiro!");
      const conteudoTexto = gerarParecerSEACAR(dadosExtraidos);
      
      baixarComoHTML(conteudoTexto, `Parecer_SEACAR_${dadosExtraidos.siape || 'RSC'}.html`);
    });
  }

  // 2. GERAÇÃO DA MINUTA DE PORTARIA EM DOCX (WORD)
  if (btnPortaria) {
    btnPortaria.addEventListener('click', () => {
      if (!dadosExtraidos) return alert("Envie um PDF primeiro!");
      const conteudoTexto = gerarMinutaPortariaPROGESP(dadosExtraidos);
      
      baixarComoDOCX(conteudoTexto, `Minuta_Portaria_${dadosExtraidos.siape || 'RSC'}.doc`);
    });
  }
});

// --- FUNÇÕES DE DOWNLOAD ---

// Função para baixar o Parecer SEACAR em HTML
function baixarComoHTML(texto, nomeArquivo) {
  const conteudoHTML = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Parecer SEACAR</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
        .cabecalho { text-align: center; font-weight: bold; margin-bottom: 30px; }
        .conteudo { white-space: pre-wrap; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="conteudo">${texto}</div>
    </body>
    </html>
  `;

  const blob = new Blob([conteudoHTML], { type: 'text/html;charset=utf-8' });
  fazerDownload(blob, nomeArquivo);
}

// Função para baixar a Portaria em formato compatível com Word (.doc/.docx)
function baixarComoDOCX(texto, nomeArquivo) {
  const conteudoWord = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'></head>
    <body style="font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5;">
      ${texto.replace(/\n/g, '<br>')}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + conteudoWord], { type: 'application/msword' });
  fazerDownload(blob, nomeArquivo);
}

// Auxiliar de disparo do download
function fazerDownload(blob, nomeArquivo) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = nomeArquivo;
  link.click();
}
