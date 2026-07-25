// Matriz de Requisitos da Titulação/IQ Atual do Servidor por Nível Solicitado
const REQUISITOS_DECRETO_13048 = {
    'RSC-I':   { iqExigido: 10,  descricao: 'Sem ensino fundamental completo (IQ 10%)' },
    'RSC-II':  { iqExigido: 15,  descricao: 'Ensino fundamental completo (IQ 15%)' },
    'RSC-III': { iqExigido: 15,  descricao: 'Ensino fundamental completo (IQ 15%)' },
    'RSC-IV':  { iqExigido: 25,  descricao: 'Ensino Médio / Técnico (IQ 25%)' },
    'RSC-V':   { iqExigido: 30,  descricao: 'Graduação / Ensino Superior (IQ 30%)' },
    'RSC-VI':  { iqExigido: 52,  descricao: 'Especialização / Lato Sensu (IQ 52%)' }
};

// Objeto global de dados do processo atual
window.dadosExtraidosPDF = window.dadosExtraidosPDF || {};

// Mapeamento Elementos do DOM
let pdfCRSCInput, statusLeitura, secaoValidacoes, acoesGeracao;
let selectIQAtual, selectRscSolicitado, inputDataExercicio, selectEstagioProbatorio;
let alertaIncompatibilidadeRSC, alertaRetornoComissao, msgDivergenciaData;
let btnGerarSeacar, btnGerarPortaria, btnExportarExcel, btnLimparHistorico, tabelaHistorico;

document.addEventListener('DOMContentLoaded', () => {
    pdfCRSCInput = document.getElementById('pdfCRSCInput');
    statusLeitura = document.getElementById('statusLeitura');
    secaoValidacoes = document.getElementById('secaoValidacoes');
    acoesGeracao = document.getElementById('acoesGeracao');

    selectIQAtual = document.getElementById('selectIQAtual');
    selectRscSolicitado = document.getElementById('selectRscSolicitado');
    inputDataExercicio = document.getElementById('inputDataExercicio');
    selectEstagioProbatorio = document.getElementById('selectEstagioProbatorio');

    alertaIncompatibilidadeRSC = document.getElementById('alertaIncompatibilidadeRSC');
    alertaRetornoComissao = document.getElementById('alertaRetornoComissao');
    msgDivergenciaData = document.getElementById('msgDivergenciaData');

    btnGerarSeacar = document.getElementById('btnGerarSeacar');
    btnGerarPortaria = document.getElementById('btnGerarPortaria');
    btnExportarExcel = document.getElementById('btnExportarExcel');
    btnLimparHistorico = document.getElementById('btnLimparHistorico');
    tabelaHistorico = document.getElementById('tabelaHistorico');

    inicializarApp();
});

function inicializarApp() {
    if (pdfCRSCInput) pdfCRSCInput.addEventListener('change', processarArquivoPDF);
    
    if (selectIQAtual) selectIQAtual.addEventListener('change', executarValidacoesRegras);
    if (selectRscSolicitado) selectRscSolicitado.addEventListener('change', executarValidacoesRegras);
    if (inputDataExercicio) {
        inputDataExercicio.addEventListener('change', executarValidacoesRegras);
        inputDataExercicio.addEventListener('input', executarValidacoesRegras);
    }
    if (selectEstagioProbatorio) selectEstagioProbatorio.addEventListener('change', executarValidacoesRegras);

    if (btnGerarSeacar) {
        btnGerarSeacar.addEventListener('click', () => {
            if (typeof window.gerarParecerSEACAR === 'function') {
                window.gerarParecerSEACAR(window.dadosExtraidosPDF);
            } else {
                alert("A função de geração do Parecer SEACAR ainda não foi carregada no sistema.");
            }
        });
    }

    if (btnGerarPortaria) {
        btnGerarPortaria.addEventListener('click', () => {
            if (typeof window.gerarMinutaPortaria === 'function') {
                window.gerarMinutaPortaria(window.dadosExtraidosPDF);
            } else {
                alert("A função de geração da Minuta da Portaria ainda não foi carregada no sistema.");
            }
        });
    }
    
    if (btnExportarExcel) btnExportarExcel.addEventListener('click', exportarHistoricoCSV);
    if (btnLimparHistorico) btnLimparHistorico.addEventListener('click', limparHistoricoLocal);

    carregarHistoricoTabela();
}

async function processarArquivoPDF(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (statusLeitura) {
        statusLeitura.classList.remove('d-none', 'alert-danger', 'alert-success');
        statusLeitura.classList.add('alert-secondary');
        statusLeitura.textContent = "⌛ Lendo e extraindo informações do PDF...";
    }

    try {
        if (typeof window.parseParecerCRSC === 'function') {
            const dados = await window.parseParecerCRSC(file);
            window.dadosExtraidosPDF = { ...window.dadosExtraidosPDF, ...dados };
            
            if (dados.iqAtual && selectIQAtual) selectIQAtual.value = dados.iqAtual;
            if (dados.nivelSolicitado && selectRscSolicitado) selectRscSolicitado.value = dados.nivelSolicitado;

            if (dados.dataExercicioComissao && inputDataExercicio && !inputDataExercicio.value) {
                inputDataExercicio.value = dados.dataExercicioComissao;
            }

            if (statusLeitura) {
                statusLeitura.classList.replace('alert-secondary', 'alert-success');
                statusLeitura.textContent = "✅ Leitura concluída com sucesso!";
            }
            
            if (secaoValidacoes) secaoValidacoes.classList.remove('d-none');
            if (acoesGeracao) acoesGeracao.classList.remove('d-none');
            
            executarValidacoesRegras();
            salvarProcessoNoHistorico(window.dadosExtraidosPDF);
        } else {
            throw new Error("A função parseParecerCRSC não está disponível. Verifique a importação do arquivo js/parse-parecer-crsc.js.");
        }
    } catch (err) {
        console.error("Erro no processamento do PDF:", err);
        if (statusLeitura) {
            statusLeitura.classList.replace('alert-secondary', 'alert-danger');
            statusLeitura.textContent = `❌ Erro: ${err.message}`;
        }
    }
}

function executarValidacoesRegras() {
    let impedimentos = [];
    let requerDevolucaoCRSC = false;

    // 1. Validação IQ vs RSC
    const iqVal = selectIQAtual ? parseInt(selectIQAtual.value, 10) : null;
    const rscVal = selectRscSolicitado ? selectRscSolicitado.value : null;

    if (iqVal && rscVal && REQUISITOS_DECRETO_13048[rscVal]) {
        const regra = REQUISITOS_DECRETO_13048[rscVal];
        if (iqVal < regra.iqExigido) {
            impedimentos.push(`Incompatibilidade com Dec. 13.048/2026: Para solicitar o ${rscVal}, exige-se IQ mínimo de ${regra.iqExigido}% (${regra.descricao}). IQ informado: ${iqVal}%.`);
            if (alertaIncompatibilidadeRSC) {
                alertaIncompatibilidadeRSC.innerHTML = `<strong>⛔ Incompatibilidade Legal:</strong> O nível <strong>${rscVal}</strong> exige no mínimo ${regra.descricao}.`;
                alertaIncompatibilidadeRSC.classList.remove('d-none');
            }
        } else if (alertaIncompatibilidadeRSC) {
            alertaIncompatibilidadeRSC.classList.add('d-none');
        }
    }

    // 2. Validação Estágio Probatório
    if (selectEstagioProbatorio && selectEstagioProbatorio.value === 'sim') {
        impedimentos.push("Servidor em Estágio Probatório (Impedimento legal para concessão de RSC).");
    }

    // 3. Validação Data de Exercício
    const dataDigitadaStr = inputDataExercicio ? inputDataExercicio.value : "";
    const dataCRSCStr = window.dadosExtraidosPDF ? (window.dadosExtraidosPDF.dataExercicioComissao || window.dadosExtraidosPDF.dataExercicio) : "";

    if (dataDigitadaStr && dataCRSCStr) {
        const dataDigitada = parseDataParaObjeto(dataDigitadaStr);
        const dataCRSC = parseDataParaObjeto(dataCRSCStr);

        if (dataDigitada && dataCRSC) {
            // Se Digitada > CRSC -> DEVOLUÇÃO
            if (dataDigitada > dataCRSC) {
                requerDevolucaoCRSC = true;
                if (msgDivergenciaData) {
                    msgDivergenciaData.innerHTML = `⚠️ Data de exercício digitada (${formatarDataBr(dataDigitadaStr)}) é <strong>POSTERIOR</strong> à considerada pela CRSC (${formatarDataBr(dataCRSCStr)}). O processo deve ser retornado!`;
                    msgDivergenciaData.classList.remove('d-none');
                }
                impedimentos.push(`Data de exercício informada (${formatarDataBr(dataDigitadaStr)}) é posterior à considerada pela CRSC (${formatarDataBr(dataCRSCStr)}). Necessário retorno para readequação.`);
            } 
            else if (dataDigitada.getTime() !== dataCRSC.getTime()) {
                requerDevolucaoCRSC = true;
                if (msgDivergenciaData) {
                    msgDivergenciaData.innerHTML = `⚠️ Divergência detectada entre a data digitada (${formatarDataBr(dataDigitadaStr)}) e a do parecer da CRSC (${formatarDataBr(dataCRSCStr)}).`;
                    msgDivergenciaData.classList.remove('d-none');
                }
                impedimentos.push("Divergência entre a Data de Exercício digitada e a apurada no parecer da CRSC.");
            } 
            else if (msgDivergenciaData) {
                msgDivergenciaData.classList.add('d-none');
            }
        }
    }

    // Atualização dos alertas na tela
    if (impedimentos.length > 0) {
        if (alertaRetornoComissao) {
            alertaRetornoComissao.classList.remove('d-none');
            if (requerDevolucaoCRSC) {
                alertaRetornoComissao.className = "alert alert-warning mt-3 mb-0 shadow-sm";
                alertaRetornoComissao.innerHTML = `<strong>⚠️ DEVOLUÇÃO NECESSÁRIA À CRSC:</strong><br>- ${impedimentos.join('<br>- ')}`;
                window.dadosExtraidosPDF.resultado = "RETORNAR À CRSC";
            } else {
                alertaRetornoComissao.className = "alert alert-danger mt-3 mb-0 shadow-sm";
                alertaRetornoComissao.innerHTML = `<strong>⛔ INDEFERIDO:</strong><br>- ${impedimentos.join('<br>- ')}`;
                window.dadosExtraidosPDF.resultado = "INDEFERIDO";
            }
        }
        if (btnGerarPortaria) btnGerarPortaria.disabled = true;
    } else {
        if (alertaRetornoComissao) alertaRetornoComissao.classList.add('d-none');
        if (btnGerarPortaria) btnGerarPortaria.disabled = false;
        if (window.dadosExtraidosPDF) window.dadosExtraidosPDF.resultado = "DEFERIDO";
    }

    // Sincronização Global
    if (window.dadosExtraidosPDF) {
        if (selectIQAtual) window.dadosExtraidosPDF.iqAtual = selectIQAtual.value;
        if (selectRscSolicitado) window.dadosExtraidosPDF.nivelSolicitado = selectRscSolicitado.value;
        if (inputDataExercicio) window.dadosExtraidosPDF.dataExercicio = inputDataExercicio.value;
        if (selectEstagioProbatorio) window.dadosExtraidosPDF.estagioProbatorio = selectEstagioProbatorio.value;
    }
}

function parseDataParaObjeto(strData) {
    if (!strData) return null;
    if (strData.includes('-')) {
        const [ano, mes, dia] = strData.split('-');
        return new Date(ano, mes - 1, dia);
    }
    if (strData.includes('/')) {
        const [dia, mes, ano] = strData.split('/');
        return new Date(ano, mes - 1, dia);
    }
    return null;
}

function formatarDataBr(dataIso) {
    if (!dataIso) return '';
    if (dataIso.includes('/')) return dataIso;
    const partes = dataIso.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function salvarProcessoNoHistorico(dados) {
    if (!dados || !dados.numeroProcesso) return;
    let historico = JSON.parse(localStorage.getItem('historicoRSC') || '[]');
    const item = {
        dataHora: new Date().toLocaleString('pt-BR'),
        processo: dados.numeroProcesso || '--',
        servidor: dados.nomeServidor || '--',
        siape: dados.siape || '--',
        nivel: dados.nivelSolicitado || '--',
        pontos: dados.pontuacaoObtida || '0',
        percentual: (dados.iqAtual || '0') + '%',
        resultado: dados.resultado || 'ANALISADO'
    };
    
    // Evita duplicatas consecutivas
    if (historico.length === 0 || historico[0].processo !== item.processo) {
        historico.unshift(item);
        localStorage.setItem('historicoRSC', JSON.stringify(historico));
        carregarHistoricoTabela();
    }
}

function carregarHistoricoTabela() {
    if (!tabelaHistorico) return;
    let historico = JSON.parse(localStorage.getItem('historicoRSC') || '[]');
    tabelaHistorico.innerHTML = '';
    
    if (historico.length === 0) {
        tabelaHistorico.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Nenhum processo analisado localmente.</td></tr>';
        return;
    }

    historico.forEach(item => {
        const tr = document.createElement('tr');
        const badgeClass = item.resultado === 'DEFERIDO' ? 'bg-success' : (item.resultado === 'RETORNAR À CRSC' ? 'bg-warning text-dark' : 'bg-danger');
        tr.innerHTML = `
            <td><small>${item.dataHora}</small></td>
            <td><strong>${item.processo}</strong></td>
            <td>${item.servidor}</td>
            <td>${item.siape}</td>
            <td>${item.nivel}</td>
            <td>${item.pontos}</td>
            <td>${item.percentual}</td>
            <td><span class="badge ${badgeClass}">${item.resultado}</span></td>
        `;
        tabelaHistorico.appendChild(tr);
    });
}

function exportarHistoricoCSV() {
    let historico = JSON.parse(localStorage.getItem('historicoRSC') || '[]');
    if (historico.length === 0) return alert("Não há dados para exportar.");

    let csvContent = "data:text/csv;charset=utf-8,Data/Hora,Processo,Servidor,SIAPE,Nivel,Pontos,Percentual,Resultado\n";
    historico.forEach(i => {
        csvContent += `"${i.dataHora}","${i.processo}","${i.servidor}","${i.siape}","${i.nivel}","${i.pontos}","${i.percentual}","${i.resultado}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `controle_rsc_seacar_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function limparHistoricoLocal() {
    if (confirm("Deseja realmente apagar o histórico local de análises?")) {
        localStorage.removeItem('historicoRSC');
        carregarHistoricoTabela();
    }
}
