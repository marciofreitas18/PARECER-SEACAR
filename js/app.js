document.addEventListener('DOMContentLoaded', () => {
    const inputPdf = document.getElementById('pdfCRSCInput');
    const statusDiv = document.getElementById('statusLeitura');
    const acoesDiv = document.getElementById('acoesGeracao');
    const btnSeacar = document.getElementById('btnGerarSeacar');
    const btnPortaria = document.getElementById('btnGerarPortaria');

    let dadosExtraidos = null;

    if (inputPdf) {
        inputPdf.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            statusDiv.classList.remove('d-none', 'alert-danger', 'alert-success');
            statusDiv.classList.add('alert-info');
            statusDiv.textContent = "⏳ Lendo e processando o PDF do Parecer da CRSC...";

            try {
                dadosExtraidos = await extrairDadosParecerCRSC(file);
                
                statusDiv.classList.remove('alert-info');
                statusDiv.classList.add('alert-success');
                statusDiv.innerHTML = `✅ <b>Leitura concluída!</b><br>Servidor: <b>${dadosExtraidos.nomeServidor}</b> (SIAPE: ${dadosExtraidos.siape})<br>Resultado CRSC: <b>${dadosExtraidos.resultado}</b> (RSC-${dadosExtraidos.nivelRsc})`;
                
                acoesDiv.classList.remove('d-none');
            } catch (error) {
                console.error(error);
                statusDiv.classList.remove('alert-info');
                statusDiv.classList.add('alert-danger');
                statusDiv.textContent = "❌ Erro ao ler o arquivo PDF. Verifique se o arquivo não está corrompido ou protegido.";
            }
        });
    }

    if (btnSeacar) {
        btnSeacar.addEventListener('click', () => {
            if (!dadosExtraidos) return alert("Por favor, selecione um arquivo PDF primeiro!");
            const texto = gerarParecerSEACAR(dadosExtraidos);
            baixarComoHTML(texto, `Parecer_SEACAR_${dadosExtraidos.siape}.html`);
        });
    }

    if (btnPortaria) {
        btnPortaria.addEventListener('click', () => {
            if (!dadosExtraidos) return alert("Por favor, selecione um arquivo PDF primeiro!");
            const texto = gerarMinutaPortariaPROGESP(dadosExtraidos);
            baixarComoDOCX(texto, `Minuta_Portaria_RSC_${dadosExtraidos.siape}.doc`);
        });
    }
});

// Funções de Download
function baixarComoHTML(texto, nomeArquivo) {
    const conteudoHTML = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"><title>Parecer SEACAR</title></head>
    <body style="font-family: Arial, sans-serif; margin: 40px; line-height: 1.6;">
        <div style="white-space: pre-wrap;">${texto}</div>
    </body>
    </html>`;
    fazerDownload(new Blob([conteudoHTML], { type: 'text/html;charset=utf-8' }), nomeArquivo);
}

function baixarComoDOCX(texto, nomeArquivo) {
    const conteudoWord = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'></head>
    <body style="font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5;">
        ${texto.replace(/\n/g, '<br>')}
    </body>
    </html>`;
    fazerDownload(new Blob(['\ufeff' + conteudoWord], { type: 'application/msword' }), nomeArquivo);
}

function fazerDownload(blob, nomeArquivo) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
}
