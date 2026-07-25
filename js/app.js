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
let pdfCRSCInput, statusLeitura, secaoDadosParecer, secaoValidacoes, acoesGeracao;
let inputNomeServidor, inputCargoServidor, inputSiape, inputNumeroProcesso, inputPontuacao, inputDataParecer;
let selectIQAtual, selectRscSolicitado, inputDataExercicio, selectEstagioProbatorio;
let alertaIncompatibilidadeRSC, alertaRetornoComissao, msgDivergenciaData;
let btnGerarSeacar, btnGerarPortaria, btnExportarExcel, btnLimparHistorico, tabelaHistorico;

document.addEventListener('DOMContentLoaded', () => {
    pdfCRSCInput = document.getElementById('pdfCRSCInput');
    statusLeitura = document.getElementById('statusLeitura');
    secaoDadosParecer = document.getElementById('secaoDadosParecer');
    secaoValidacoes = document.getElementById('secaoValidacoes');
    acoesGeracao = document.getElementById('acoesGeracao');

    // Campos de Edição Manual dos Dados do Parecer
    inputNomeServidor = document.getElementById('inputNomeServidor');
    inputCargoServidor = document.getElementById('inputCargoServidor') || document.getElementById('inputCargo');
    inputSiape = document.getElementById('inputSiape');
    inputNumeroProcesso = document.getElementById('inputNumeroProcesso');
    inputPontuacao = document.getElementById('inputPontuacao');
    inputDataParecer = document.getElementById('inputDataParecer');

    // Campos de Validação
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
    
    // Escuta alterações nos campos editáveis para atualizar o estado global
    const camposManuais = [
        inputNomeServidor, 
        inputCargoServidor, 
        inputSiape, 
        inputNumeroProcesso, 
        inputPontuacao, 
        inputDataParecer
    ];

    camposManuais.forEach(campo => {
        if (campo) {
            campo.addEventListener('input', sincronizarDadosManuais);
            campo.addEventListener('change', sincronizarDadosManuais);
        }
    });

    if (selectIQAtual) selectIQAtual.addEventListener('change', executarValidacoesRegras);
    if (selectRscSolicitado) selectRscSolicitado.addEventListener('change', executarValidacoesRegras);
    if (inputDataExercicio) {
        inputDataExercicio.addEventListener('change', executarValidacoesRegras);
        inputDataExercicio.addEventListener('input', executarValidacoesRegras);
    }
    if (selectEstagioProbatorio) selectEstagioProbatorio.addEventListener('change', executarValidacoesRegras);

    if (btnGerarSeacar) {
        btnGerarSeacar.addEventListener('click', () => {
            sincronizarDadosManuais();
            if (typeof window.gerarParecerSEACAR === 'function') {
                window.gerarParecerSEACAR(window.dadosExtraidosPDF);
            } else {
                alert("Função de geração do Parecer SEACAR não carregada.");
            }
        });
    }

    if (btnGerarPortaria) {
        btnGerarPortaria.addEventListener('click', () => {
            sincronizarDadosManuais();
            if (typeof window.gerarMinutaPortaria === 'function') {
                window.gerarMinutaPortaria(window.dadosExtraidosPDF);
            } else {
                alert("Função de geração da Minuta da Portaria não carregada.");
            }
        });
    }
    
    if (btnExportarExcel) btnExportarExcel.addEventListener('click', exportarHistoricoCSV);
    if (btnLimparHistorico) btnLimparHistorico.addEventListener('click', limparHistoricoLocal);

    carregarHistoricoTabela();
}

function sincronizarDadosManuais() {
    if (!window.dadosExtraidosPDF) {
        window.dadosExtraidosPDF = {};
    }
    
    // Atualiza o objeto global dinamicamente com os valores atuais dos campos
    window.dadosExtraidosPDF.nomeServidor = inputNomeServidor ? inputNomeServidor.value.trim() : '';
    window.dadosExtraidosPDF.cargo = inputCargoServidor ? inputCargoServidor.value.trim() : '';
    window.dadosExtraidosPDF.siape = inputSiape ? inputSiape.value.trim() : '';
    window.dadosExtraidosPDF.numeroProcesso = inputNumeroProcesso ? inputNumeroProcesso.value.trim() : '';
    window.dadosExtraidosPDF.pontuacaoObtida = inputPontuacao ? inputPontuacao.value : '';
    window.dadosExtraidosPDF.dataExercicioComissao = inputDataParecer ? inputDataParecer.value : '';

    executarValidacoesRegras();
}

function limparFormularioProcesso(limparArquivoInput = true) {
    if (limparArquivoInput && pdfCRSCInput) pdfCRSCInput.value = '';

    if (inputNomeServidor) inputNomeServidor.value = '';
    if (inputCargoServidor) inputCargoServidor.value = '';
    if (inputSiape) inputSiape.value = '';
    if (inputNumeroProcesso) inputNumeroProcesso.value = '';
    if (inputPontuacao) inputPontuacao.value = '';
    if (inputDataParecer) inputDataParecer.value = '';

    if (selectIQAtual) selectIQAtual.selectedIndex = 0;
    if (selectRscSolicitado) selectRscSolicitado.selectedIndex = 0;
    if (selectEstagioProbatorio) selectEstagioProbatorio.selectedIndex = 0;
    if (inputDataExercicio) inputDataExercicio.value = '';

    if (secaoDadosParecer) secaoDadosParecer.classList.add('d-none');
    if (secaoValidacoes) secaoValidacoes.classList.add('d-none');
    if (acoesGeracao) acoesGeracao.classList.add('d-none');
    if (statusLeitura) statusLeitura.classList.add('d-none');
    if (alertaIncompatibilidadeRSC) alertaIncompatibilidadeRSC.classList.add('d-none');
    if (alertaRetornoComissao) alertaRetornoComissao.classList.add('d-none');
    if (msgDivergenciaData) msgDivergenciaData.classList.add('d-none');

    window.dadosExtraidosPDF = {};
}

window.limparFormularioProcesso = limparFormularioProcesso;

async function processarArquivoPDF(e) {
    const file = e.target.files[0];
    if (!file) return;

    limparFormularioProcesso(false);

    if (statusLeitura) {
        statusLeitura.classList.remove('d-none', 'alert-danger', 'alert-success');
        statusLeitura.classList.add('alert-secondary');
        statusLeitura.textContent = "⌛ Lendo e analisando arquivo PDF...";
    }

    try {
        if (typeof window.parseParecerCRSC === 'function') {
            const dados = await window.parseParecerCRSC(file);
            window.dadosExtraidosPDF = { ...dados };
            
            // Preenche os campos editáveis
            if (inputNomeServidor) inputNomeServidor.value = dados.nomeServidor || '';
            if (inputCargoServidor) inputCargoServidor.value = dados.cargo || '';
            if (inputSiape) inputSiape.value = dados.siape || '';
            if (inputNumeroProcesso) inputNumeroProcesso.value = dados.numeroProcesso || '';
            if (inputPontuacao) inputPontuacao.value = dados.pontuacaoObtida || '';
            if (inputDataParecer) inputDataParecer.value = dados.dataExercicioComissao || '';

            if (dados.iqAtual && selectIQAtual) selectIQAtual.value = dados.iqAtual;
            if (dados.nivelSolicitado && selectRscSolicitado) selectRscSolicitado.value = dados.nivelSolicitado;

            if (dados.dataExercicioComissao && inputDataExercicio) {
                inputDataExercicio.value = dados.dataExercicioComissao;
            }

            if (statusLeitura) {
                statusLeitura.classList.replace('alert-secondary', 'alert-success');
                statusLeitura.innerHTML = `✅ <strong>Análise Concluída!</strong> Confira e/ou ajuste os dados abaixo se necessário.`;
            }
            
            if (secaoDadosParecer) secaoDadosParecer.classList.remove('d-none');
            if (secaoValidacoes) secaoValidacoes.classList.remove('d-none');
            if (acoesGeracao) acoesGeracao.classList.remove('d-none');
            
            executarValidacoesRegras();
            salvarProcessoNoHistorico(window.dadosExtraidosPDF);
        } else {
            throw new Error("A função parseParecerCRSC não está disponível.");
        }
    } catch (err) {
        console.error("Erro no processamento do PDF:", err);
        if (statusLeitura) {
            statusLeitura.classList.replace('alert-secondary', 'alert-danger');
            statusLeitura.textContent = `❌ Erro na leitura do arquivo: ${err.message}. Você pode preencher os dados manualmente no painel abaixo.`;
        }
        // Exibe o painel para preenchimento manual caso ocorra erro grave de OCR
        if (secaoDadosParecer) secaoDadosParecer.classList.remove('d-none');
        if (secaoValidacoes) secaoValidacoes.classList.remove('d-none');
        if (acoesGeracao) acoesGeracao.classList.remove('d-none');
    }
}

function executarValidacoesRegras() {
    let impedimentos = [];
    let requerDevolucaoCRSC = false;

    const iqVal = selectIQAtual ? parseInt(selectIQAtual.value, 10) : null;
    const rscVal = selectRscSolicitado ? selectRscSolicitado.value : null;

    if (iqVal && rscVal && REQUISITOS_DECRETO_13048[rscVal]) {
        const regra = REQUISITOS_DECRETO_13048[rscVal];
        if (iqVal < regra.iqExigido) {
            impedimentos.push(`Incompatibilidade: Para solicitar o ${rscVal}, exige-se IQ mínimo de ${regra.iqExigido}% (${regra.descricao}). IQ informado: ${iqVal}%.`);
            if (alertaIncompatibilidadeRSC) {
                alertaIncompatibilidadeRSC.innerHTML = `<strong>⛔ Incompatibilidade Legal:</strong> O nível <strong>${rscVal}</strong> exige no mínimo ${regra.descricao}.`;
                alertaIncompatibilidadeRSC.classList.remove('d-none');
            }
        } else if (alertaIncompatibilidadeRSC) {
            alertaIncompatibilidadeRSC.classList.add('d-none');
        }
    }

    if (selectEstagioProbatorio && selectEstagioProbatorio.value === 'sim') {
        impedimentos.push("Servidor em Estágio Probatório (Impedimento legal).");
    }

    const dataDigitadaStr = inputDataExercicio ? inputDataExercicio.value : "";
    const dataCRSCStr = inputDataParecer ? inputDataParecer.value : "";

    if (dataDigitadaStr && dataCRSCStr) {
        const dataDigitada = parseDataParaObjeto(dataDigitadaStr);
        const dataCRSC = parseDataParaObjeto(dataCRSCStr);

        if (dataDigitada && dataCRSC) {
            if (dataDigitada > dataCRSC) {
                requerDevolucaoCRSC = true;
                if (msgDivergenciaData) {
                    msgDivergenciaData.innerHTML = `⚠️ Data digitada (${formatarDataBr(dataDigitadaStr)}) é posterior à informada pela CRSC (${formatarDataBr(dataCRSCStr)}).`;
                    msgDivergenciaData.classList.remove('d-none');
                }
                impedimentos.push("Data de exercício posterior à informada pela CRSC.");
            } else if (dataDigitada.getTime() !== dataCRSC.getTime()) {
                requerDevolucaoCRSC = true;
                if (msgDivergenciaData) {
                    msgDivergenciaData.innerHTML = `⚠️ Divergência na data de exercício (${formatarDataBr(dataDigitadaStr)} x ${formatarDataBr(dataCRSCStr)}).`;
                    msgDivergenciaData.classList.remove('d-none');
                }
                impedimentos.push("Divergência na data de exercício.");
            } else if (msgDivergenciaData) {
                msgDivergenciaData.classList.add('d-none');
            }
        }
    }

    if (impedimentos.length > 0) {
        if (alertaRetornoComissao) {
            alertaRetornoComissao.classList.remove('d-none');
            if (requerDevolucaoCRSC) {
                alertaRetornoComissao.className = "alert alert-warning mt-3 mb-0 shadow-sm";
                alertaRetornoComissao.innerHTML = `<strong>⚠️ DEVOLUÇÃO NECESSÁRIA:</strong><br>- ${impedimentos.join('<br>- ')}`;
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
    if (!dados || (!dados.numeroProcesso && !dados.nomeServidor)) return;
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
