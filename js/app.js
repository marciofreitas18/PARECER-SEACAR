document.addEventListener('DOMContentLoaded', () => {
    const inputPdf = document.getElementById('pdfCRSCInput');
    const statusDiv = document.getElementById('statusLeitura');
    const acoesDiv = document.getElementById('acoesGeracao');
    const btnSeacar = document.getElementById('btnGerarSeacar');
    const btnPortaria = document.getElementById('btnGerarPortaria');
    
    // Elementos do Relatório
    const tabelaHistorico = document.getElementById('tabelaHistorico');
    const btnExportarExcel = document.getElementById('btnExportarExcel');
    const btnLimparHistorico = document.getElementById('btnLimparHistorico');

    let dadosExtraidos = null;

    // Carrega o histórico salvo no navegador ao abrir a página
    carregarTabelaHistorico();

    if (inputPdf) {
        inputPdf.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            statusDiv.classList.remove('d-none', 'alert-danger', 'alert-success', 'alert-secondary');
            statusDiv.classList.add('alert-info');
            statusDiv.textContent = "⏳ Lendo arquivo PDF e extraindo informações...";

            try {
                dadosExtraidos = await extrairDadosParecerCRSC(file);
                
                statusDiv.classList.remove('alert-info');
                statusDiv.classList.add('alert-success');
                statusDiv.innerHTML = `✅ <b>Parecer CRSC Lido com Sucesso!</b><br>` +
                                      `Servidor: <b>${dadosExtraidos.nomeServidor}</b> | SIAPE: <b>${dadosExtraidos.siape}</b><br>` +
                                      `Resultado: <b>${dadosExtraidos.resultado}</b> (${dadosExtraidos.nivelConcedido})`;
                
                acoesDiv.classList.remove('d-none');

                // SALVA NO RELATÓRIO AUTOMATICAMENTE
                salvarNoHistorico(dadosExtraidos);
                carregarTabelaHistorico();

            } catch (error) {
                console.error(error);
                statusDiv.classList.remove('alert-info');
                statusDiv.classList.add('alert-danger');
                statusDiv.textContent = "❌ Erro ao ler o PDF. Verifique se o arquivo enviado é um PDF válido.";
            }
        });
    }

    // Botões de Download
    if (btnSeacar) {
        btnSeacar.addEventListener('click', () => {
            if (!dadosExtraidos) return alert("Selecione o PDF primeiro!");
            const texto = gerarParecerSEACAR(dadosExtraidos);
            baixarComoHTML(texto, `Parecer_SEACAR_${dadosExtraidos.siape}.html`);
        });
    }

    if (btnPortaria) {
        btnPortaria.addEventListener('click', () => {
            if (!dadosExtraidos) return alert("Selecione o PDF primeiro!");
            const texto = gerarMinutaPortariaPROGESP(dadosExtraidos);
            baixarComoDOCX(texto, `Minuta_Portaria_RSC_${dadosExtraidos.siape}.doc`);
        });
    }

    // Ações do Relatório
    if (btnExportarExcel) {
        btnExportarExcel.addEventListener('click', exportarParaCSV);
    }

    if (btnLimparHistorico) {
        btnLimparHistorico.addEventListener('click', () => {
            if (confirm("Tem certeza que deseja apagar todo o histórico de processos salvos neste computador?")) {
                localStorage.removeItem('historicoProcessosSEACAR');
                carregarTabelaHistorico();
            }
        });
    }
});

// --- FUNÇÕES DO RELATÓRIO / HISTÓRICO ---

function salvarNoHistorico(dados) {
    let historico = JSON.parse(localStorage.getItem('historicoProcessosSEACAR')) || [];
    
    // Evita duplicar o mesmo processo lido em sequência
    const jaExiste = historico.some(item => item.numeroProcesso === dados.numeroProcesso && item.siape === dados.siape);
    
    if (!jaExiste) {
        const novoRegistro = {
            dataAnalise: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
            numeroProcesso: dados.numeroProcesso,
            nomeServidor: dados.nomeServidor,
            siape: dados.siape,
            nivelConcedido: dados.nivelConcedido,
            resultado: dados.resultado
        };

        historico.unshift(novoRegistro); // Adiciona no início da lista
        localStorage.setItem('historicoProcessosSEACAR', JSON.stringify(historico));
    }
}

function carregarTabelaHistorico() {
    const tabela = document.getElementById('tabelaHistorico');
    let historico = JSON.parse(localStorage.getItem('historicoProcessosSEACAR')) || [];

    if (historico.length === 0) {
        tabela.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Nenhum processo analisado no histórico local.</td></tr>`;
        return;
    }

    tabela.innerHTML = historico.map(item => `
        <tr>
            <td><small>${item.dataAnalise}</small></td>
            <td><b>${item.numeroProcesso}</b></td>
            <td>${item.nomeServidor}</td>
            <td>${item.siape}</td>
            <td><span class="badge bg-info text-dark">${item.nivelConcedido}</span></td>
            <td><span class="badge bg-${item.resultado === 'DEFERIDO' ? 'success' : 'danger'}">${item.resultado}</span></td>
        </tr>
    `).join('');
}

function exportarParaCSV() {
    let historico = JSON.parse(localStorage.getItem('historicoProcessosSEACAR')) || [];
    if (historico.length === 0) return alert("Não há dados para exportar!");

    let csvContent = "\uFEFFData/Hora;Processo;Servidor;SIAPE;Nível Concedido;Resultado\n";

    historico.forEach(row => {
        csvContent += `"${row.dataAnalise}";"${row.numeroProcesso}";"${row.nomeServidor}";"${row.siape}";"${row.nivelConcedido}";"${row.resultado}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_Controle_SEACAR_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- FUNÇÕES DE DOWNLOAD DE DOCUMENTOS ---
function baixarComoHTML(texto, nomeArquivo) {
  const conteudoHTML = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Parecer SEACAR</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; margin: 40px; line-height: 1.5; color: #000; }
        .header-oficial { text-align: center; margin-bottom: 25px; font-weight: bold; font-size: 11pt; }
        .header-oficial img { height: 70px; margin-bottom: 8px; }
        .conteudo { white-space: pre-wrap; font-size: 12pt; text-align: justify; }
      </style>
    </head>
    <body>
      <div class="header-oficial">
        <!-- Brasão da República / Logo Institucional -->
        <img src="https://upload.wikimedia.org/wikipedia/commons/b/bf/Coat_of_arms_of_Brazil.svg" alt="Brasão da República"><br>
        MINISTÉRIO DA EDUCAÇÃO<br>
        UNIVERSIDADE FEDERAL DA FRONTEIRA SUL – UFFS<br>
        SECRETARIA ESPECIAL DE ADMINISTRAÇÃO EM CARREIRA - SEACAR
      </div>
      <hr style="border: 0; border-top: 1px solid #000; margin-bottom: 20px;">
      <div class="conteudo">${texto}</div>
    </body>
    </html>
  `;

    fazerDownload(new Blob([conteudoHTML], { type: 'text/html;charset=utf-8' }), nomeArquivo);
}

function baixarComoDOCX(texto, nomeArquivo) {
  const conteudoWord = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'></head>
    <body style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5;">
      <div style="text-align: center; margin-bottom: 20px; font-weight: bold;">
        <img src="https://upload.wikimedia.org/wikipedia/commons/b/bf/Coat_of_arms_of_Brazil.svg" width="70" height="70"><br><br>
        MINISTÉRIO DA EDUCAÇÃO<br>
        UNIVERSIDADE FEDERAL DA FRONTEIRA SUL – UFFS<br>
        PRÓ-REITORIA DE GESTÃO DE PESSOAS - PROGESP
      </div>
      <hr>
      <br>
      <div>${texto.replace(/\n/g, '<br>')}</div>
    </body>
    </html>
  `;

  fazerDownload(new Blob(['\ufeff' + conteudoWord], { type: 'application/msword' }), nomeArquivo);
}

function fazerDownload(blob, nomeArquivo) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 100);
}
