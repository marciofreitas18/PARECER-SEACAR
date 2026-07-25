// Matriz de Requisitos - Decreto nº 13.048/2026 (Art. 5º, § 1º)
const REQUISITOS_DECRETO_13048 = {
    'RSC-I':   { iqMinimo: 10,  descricao: 'sem ensino fundamental completo (IQ 10%)' },
    'RSC-II':  { iqMinimo: 15,  descricao: 'ensino fundamental completo (IQ 15%)' },
    'RSC-III': { iqMinimo: 25,  descricao: 'ensino médio ou técnico (IQ 25%)' },
    'RSC-IV':  { iqMinimo: 30,  descricao: 'graduação no ensino superior (IQ 30%)' },
    'RSC-V':   { iqMinimo: 52,  descricao: 'pós-graduação lato sensu (IQ 52%)' },
    'RSC-VI':  { iqMinimo: 75,  descricao: 'mestrado (IQ 75%)' }
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
    selectEstagioProbatorio.addEventListener('change', executarValidacoesRegras);

    btnGerarSeacar.addEventListener('click', () => window.gerarParecerSEACAR && window.gerarParecerSEACAR(window.dadosExtraidosPDF));
    btnGerarPortaria.addEventListener('click', () => window.gerarMinutaPortaria && window.gerarMinutaPortaria(window.dadosExtraidosPDF));
    
    btnExportarExcel.addEventListener('click', exportarHistoricoCSV);
    btnLimparHistorico.addEventListener('click', limparHistoricoLocal);

    carregarHistoricoTabela();
}

// Handler de Leitura do PDF
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
            
            // Preenche os campos da interface se capturados do PDF
            if (dados.iqAtual) selectIQAtual.value = dados.iqAtual;
            if (dados.nivelSolicitado) selectRscSolicitado.value = dados.nivelSolicitado;
            if (dados.dataExercicio) inputDataExercicio.value = dados.dataExercicio;

            statusLeitura.classList.replace('alert-secondary', 'alert-success');
            statusLeitura.textContent = "✅ Leitura concluída com sucesso! Verifique as validações abaixo.";
            
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

// Lógica de Validação Principal
function executarValidacoesRegras() {
    let impedimentos = [];
    let requerDevolucaoCRSC = false;

    // 1. Validação Decreto 13.048/2026 (IQ vs RSC)
    const iqVal = parseInt(selectIQAtual.value, 10);
    const rscVal = selectRscSolicitado.value;

    if (iqVal && rscVal && REQUISITOS_DECRETO_13048[rscVal]) {
        const regra = REQUISITOS_DECRETO_13048[rscVal];
        if (iqVal < regra.iqMinimo) {
            impedimentos.push(`Incompatibilidade com Art. 5º, § 1º do Dec. 13.048/2026: Para ${rscVal} exige-se no mínimo ${regra.descricao}. IQ informado: ${iqVal}%.`);
            alertaIncompatibilidadeRSC.innerHTML = `<strong>⛔ Incompatibilidade Legal:</strong> O nível <strong>${rscVal}</strong> exige no mínimo ${regra.descricao}.`;
            alertaIncompatibilidadeRSC.classList.remove('d-none');
        } else {
            alertaIncompatibilidadeRSC.classList.add('d-none');
        }
    }

    // 2. Validação Estágio Probatório
    if (selectEstagioProbatorio.value === 'sim') {
        impedimentos.push("Servidor em Estágio Probatório (Impedimento para concessão de RSC).");
    }

    // 3. Validação Data de Exercício
    const dataDigitada = inputDataExercicio.value;
    const dataPDF = window.dadosExtraidosPDF.dataExercicioComissao;
    if (dataDigitada && dataPDF && dataDigitada !== dataPDF) {
        requerDevolucaoCRSC = true;
        msgDivergenciaData.classList.remove('d-none');
        impedimentos.push("Divergência entre a Data de Exercício informada e a apurada pela CRSC.");
    } else {
        msgDivergenciaData.classList.add('d-none');
    }

    // Atualização do Estado do Processo e Interface
    if (impedimentos.length > 0) {
        alertaRetornoComissao.classList.remove('d-none');
        alertaRetornoComissao.className = requerDevolucaoCRSC ? "alert alert-warning mt-3 mb-0" : "alert alert-danger mt-3 mb-0";
        alertaRetornoComissao.innerHTML = `<strong>⚠️ Ocorrências Detectadas:</strong><br>- ${impedimentos.join('<br>- ')}`;
        
        btnGerarPortaria.disabled = true; // Bloqueia concessão
        window.dadosExtraidosPDF.resultado = requerDevolucaoCRSC ? "RETORNAR À CRSC" : "INDEFERIDO";
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
