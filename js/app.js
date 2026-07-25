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

// Mapeamento de Elementos do DOM
const pdfCRSCInput = document.getElementById('pdfCRSCInput');
const statusLeitura = document.getElementById('statusLeitura');
const secaoValidacoes = document.getElementById('secaoValidacoes');
const acoesGeracao = document.getElementById('acoesGeracao');

const selectIQAtual = document.getElementById('selectIQAtual');
const selectRscSolicitado = document.getElementById('selectRscSolicitado');
const inputDataExercicio = document.getElementById('inputDataExercicio');
const selectEstagioProbatorio = document.getElementById('selectEstagioProbatorio');

const alertaIncompatibilidadeRSC = document.getElementById('alertaIncompatibilidadeRSC');
const alertaRetornoComissao = document.getElementById('alertaRetornoComissao');
const msgDivergenciaData = document.getElementById('msgDivergenciaData');

const btnGerarSeacar = document.getElementById('btnGerarSeacar');
const btnGerarPortaria = document.getElementById('btnGerarPortaria');
const btnExportarExcel = document.getElementById('btnExportarExcel');
const btnLimparHistorico = document.getElementById('btnLimparHistorico');
const tabelaHistorico = document.getElementById('tabelaHistorico');

// Listeners de Evento
document.addEventListener('DOMContentLoaded', inicializarApp);

function inicializarApp() {
    pdfCRSCInput.addEventListener('change', processarArquivoPDF);
    
    selectIQAtual.addEventListener('change', executarValidacoesRegras);
    selectRscSolicitado.addEventListener('change', executarValidacoesRegras);
    inputDataExercicio.addEventListener('change', executarValidacoesRegras);
    inputDataExercicio.addEventListener('input', executarValidacoesRegras); // Atualização instantânea ao digitar
    selectEstagioProbatorio.addEventListener('change', executarValidacoesRegras);

    btnGerarSeacar.addEventListener('click', () => window.gerarParecerSEACAR && window.gerarParecerSEACAR(window.dadosExtraidosPDF));
    btnGerarPortaria.addEventListener('click', () => window.gerarMinutaPortaria && window.gerarMinutaPortaria(window.dadosExtraidosPDF));
    
    btnExportarExcel.addEventListener('click', exportarHistoricoCSV);
    btnLimparHistorico.addEventListener('click', limparHistoricoLocal);

    carregarHistoricoTabela();
}

// Handler do envio de PDF
async function processarArquivoPDF(e) {
    const file = e.target.files[0];
    if (!file) return;

    statusLeitura.classList.remove('d-none', 'alert-danger', 'alert-success');
    statusLeitura.classList.add('alert-secondary');
    statusLeitura.textContent = "⌛ Lendo e extraindo informações do PDF...";

    try {
        if (typeof window.parseParecerCRSC === 'function') {
            const dados = await window.parseParecerCRSC(file);
            window.dadosExtraidosPDF = { ...window.dadosExtraidosPDF, ...dados };
            
            // 1. Pré-seleciona os menus com base no PDF
            if (dados.iqAtual) selectIQAtual.value = dados.iqAtual;
            if (dados.nivelSolicitado) selectRscSolicitado.value = dados.nivelSolicitado;

            // 2. Preenche a data de exercício se o campo estiver vazio
            if (dados.dataExercicioComissao && !inputDataExercicio.value) {
                inputDataExercicio.value = dados.dataExercicioComissao;
            }

            statusLeitura.classList.replace('alert-secondary', 'alert-success');
            statusLeitura.textContent = "✅ Leitura concluída com sucesso! Verifique ou digite os dados nos campos abaixo.";
            
            secaoValidacoes.classList.remove('d-none');
            acoesGeracao.classList.remove('d-none');
            
            executarValidacoesRegras();
            salvarProcessoNoHistorico(window.dadosExtraidosPDF);
        } else {
            throw new Error("Módulo parse-parecer-crsc.js não encontrado.");
        }
    } catch (err) {
        console.error(err);
        statusLeitura.classList.replace('alert-secondary', 'alert-danger');
        statusLeitura.textContent = "❌ Erro ao ler o arquivo PDF. Certifique-se de que é um parecer válido da CRSC.";
    }
}

// Lógica de Validação Principal com Trativa Robusta de Datas
function executarValidacoesRegras() {
    let impedimentos = [];
    let requerDevolucaoCRSC = false;

    // 1. Validação Decreto 13.048/2026 (IQ vs RSC)
    const iqVal = parseInt(selectIQAtual.value, 10);
    const rscVal = selectRscSolicitado.value;

    if (iqVal && rscVal && REQUISITOS_DECRETO_13048[rscVal]) {
        const regra = REQUISITOS_DECRETO_13048[rscVal];
        
        if (iqVal < regra.iqExigido) {
            impedimentos.push(`Incompatibilidade com Dec. 13.048/2026: Para solicitar o ${rscVal}, exige-se IQ mínimo de ${regra.iqExigido}% (${regra.descricao}). IQ informado: ${iqVal}%.`);
            
            alertaIncompatibilidadeRSC.innerHTML = `<strong>⛔ Incompatibilidade Legal:</strong> O nível <strong>${rscVal}</strong> exige no mínimo ${regra.descricao}.`;
            alertaIncompatibilidadeRSC.classList.remove('d-none');
        } else {
            alertaIncompatibilidadeRSC.classList.add('d-none');
        }
    }

    // 2. Validação Estágio Probatório
    if (selectEstagioProbatorio.value === 'sim') {
        impedimentos.push("Servidor em Estágio Probatório (Impedimento legal para concessão de RSC).");
    }

    // 3. Validação Data de Exercício (Tratamento e Comparação Robusta)
    const dataDigitadaStr = inputDataExercicio.value; // YYYY-MM-DD
    const dataCRSCStr = window.dadosExtraidosPDF.dataExercicioComissao || window.dadosExtraidosPDF.dataExercicio;

    if (dataDigitadaStr && dataCRSCStr) {
        // Padroniza ambas as datas para o objeto Date do JavaScript
        const dataDigitada = parseDataParaObjeto(dataDigitadaStr);
        const dataCRSC = parseDataParaObjeto(dataCRSCStr);

        if (dataDigitada && dataCRSC) {
            // Comparação: Se a data digitada for posterior à data da CRSC
            if (dataDigitada > dataCRSC) {
                requerDevolucaoCRSC = true;
                msgDivergenciaData.innerHTML = `⚠️ Data de exercício digitada (${formatarDataBr(dataDigitadaStr)}) é <strong>POSTERIOR</strong> à considerada pela CRSC (${formatarDataBr(dataCRSCStr)}). O processo deve ser retornado!`;
                msgDivergenciaData.classList.remove('d-none');
                
                impedimentos.push(`Data de exercício informada (${formatarDataBr(dataDigitadaStr)}) é posterior à considerada pela CRSC (${formatarDataBr(dataCRSCStr)}). Necessário retorno para readequação.`);
            } 
            // Se as datas forem diferentes (mesmo que anterior)
            else if (dataDigitada.getTime() !== dataCRSC.getTime()) {
                requerDevolucaoCRSC = true;
                msgDivergenciaData.innerHTML = `⚠️ Divergência detectada entre a data digitada (${formatarDataBr(dataDigitadaStr)}) e a do parecer da CRSC (${formatarDataBr(dataCRSCStr)}).`;
                msgDivergenciaData.classList.remove('d-none');
                
                impedimentos.push("Divergência entre a Data de Exercício digitada e a apurada no parecer da CRSC.");
            } 
            else {
                msgDivergenciaData.classList.add('d-none');
            }
        }
    }

    // Atualização da Interface e Botões
    if (impedimentos.length > 0) {
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
        
        btnGerarPortaria.disabled = true;
    } else {
        alertaRetornoComissao.classList.add('d-none');
        btnGerarPortaria.disabled = false;
        window.dadosExtraidosPDF.resultado = "DEFERIDO";
    }

    // Sincroniza dados selecionados
    window.dadosExtraidosPDF.iqAtual = selectIQAtual.value;
    window.dadosExtraidosPDF.nivelSolicitado = selectRscSolicitado.value;
    window.dadosExtraidosPDF.dataExercicio = inputDataExercicio.value;
    window.dadosExtraidosPDF.estagioProbatorio = selectEstagioProbatorio.value;
}

// Auxiliar: Converte strings YYYY-MM-DD ou DD/MM/YYYY para o objeto Date
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

// Gestão de Histórico no LocalStorage
function salvarProcessoNoHistorico(dados) {
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
    historico.unshift(item);
    localStorage.setItem('historicoRSC', JSON.stringify(historico));
    carregarHistoricoTabela();
}

function carregarHistoricoTabela() {
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
