// Matriz de Requisitos da Titulação/IQ Atual do Servidor por Nível Solicitado
const REQUISITOS_DECRETO_13048 = {
    'RSC-I':   { iqExigido: 10,  descricao: 'Sem ensino fundamental completo (IQ 10%)' },
    'RSC-II':  { iqExigido: 15,  descricao: 'Ensino fundamental completo (IQ 15%)' },
    'RSC-III': { iqExigido: 15,  descricao: 'Ensino fundamental completo (IQ 15%)' },
    'RSC-IV':  { iqExigido: 25,  descricao: 'Ensino Médio / Técnico (IQ 25%)' },
    'RSC-V':   { iqExigido: 30,  descricao: 'Graduação / Ensino Superior (IQ 30%)' },
    'RSC-VI':  { iqExigido: 52,  descricao: 'Especialização / Lato Sensu (IQ 52%)' }
};

// Lógica de Validação e Comparação
function executarValidacoesRegras() {
    let impedimentos = [];
    let requerDevolucaoCRSC = false;

    // 1. Validação do IQ Atual vs RSC Solicitado (Dec. 13.048/2026)
    const iqVal = parseInt(selectIQAtual.value, 10);
    const rscVal = selectRscSolicitado.value;

    if (iqVal && rscVal && REQUISITOS_DECRETO_13048[rscVal]) {
        const regra = REQUISITOS_DECRETO_13048[rscVal];
        
        if (iqVal < regra.iqExigido) {
            impedimentos.push(`Incompatibilidade de Titulação (Dec. 13.048/2026): Para solicitar o ${rscVal}, o servidor deve possuir IQ Atual de no mínimo ${regra.iqExigido}% (${regra.descricao}). IQ informado: ${iqVal}%.`);
            
            alertaIncompatibilidadeRSC.innerHTML = `<strong>⛔ Requisito Não Preenchido:</strong> O nível <strong>${rscVal}</strong> exige que o servidor possua IQ de no mínimo <strong>${regra.iqExigido}%</strong> (${regra.descricao}).`;
            alertaIncompatibilidadeRSC.classList.remove('d-none');
        } else {
            alertaIncompatibilidadeRSC.classList.add('d-none');
        }
    }

    // 2. Validação de Estágio Probatório
    if (selectEstagioProbatorio.value === 'sim') {
        impedimentos.push("Servidor em Estágio Probatório (Impedimento legal para concessão de RSC).");
    }

    // 3. Validação da Data de Exercício (Comparação: Digitada > CRSC)
    const dataDigitadaStr = inputDataExercicio.value; // Formato YYYY-MM-DD
    const dataCRSCStr = window.dadosExtraidosPDF.dataExercicioComissao; // Formato YYYY-MM-DD

    if (dataDigitadaStr && dataCRSCStr) {
        // Converte para objetos de Data para comparação exata
        const dataDigitada = new Date(dataDigitadaStr);
        const dataCRSC = new Date(dataCRSCStr);

        // Se a data digitada for MAIOR (posterior) que a data apontada pela CRSC
        if (dataDigitada > dataCRSC) {
            requerDevolucaoCRSC = true;
            msgDivergenciaData.innerHTML = `⚠️ Data de exercício digitada (${formatarDataBr(dataDigitadaStr)}) é <strong>MAIOR/POSTERIOR</strong> à lançada no parecer da CRSC (${formatarDataBr(dataCRSCStr)}). O processo deve ser retornado!`;
            msgDivergenciaData.classList.remove('d-none');
            
            impedimentos.push(`Data de exercício informada (${formatarDataBr(dataDigitadaStr)}) é posterior à data considerada pela CRSC (${formatarDataBr(dataCRSCStr)}). Necessário retorno para adequação dos cálculos de tempo.`);
        } 
        // Se houver qualquer outra divergência
        else if (dataDigitadaStr !== dataCRSCStr) {
            requerDevolucaoCRSC = true;
            msgDivergenciaData.innerHTML = `⚠️ Divergência detectada entre a data digitada (${formatarDataBr(dataDigitadaStr)}) e a do parecer da CRSC (${formatarDataBr(dataCRSCStr)}).`;
            msgDivergenciaData.classList.remove('d-none');
            
            impedimentos.push("Divergência entre a Data de Exercício digitada e a apurada no parecer da CRSC.");
        } 
        else {
            msgDivergenciaData.classList.add('d-none');
        }
    }

    // Atualização da Interface e Botões
    if (impedimentos.length > 0) {
        alertaRetornoComissao.classList.remove('d-none');
        
        // Se a causa for divergência de data, destaca como ATENÇÃO / RETORNO À CRSC (amarelo)
        // Se for Estágio Probatório ou Incompatibilidade de IQ, destaca como INDEFERIDO (vermelho)
        if (requerDevolucaoCRSC) {
            alertaRetornoComissao.className = "alert alert-warning mt-3 mb-0 shadow-sm";
            alertaRetornoComissao.innerHTML = `<strong>⚠️ DEVOLUÇÃO NECESSÁRIA À CRSC:</strong><br>- ${impedimentos.join('<br>- ')}`;
            window.dadosExtraidosPDF.resultado = "RETORNAR À CRSC";
        } else {
            alertaRetornoComissao.className = "alert alert-danger mt-3 mb-0 shadow-sm";
            alertaRetornoComissao.innerHTML = `<strong>⛔ INDEFERIDO:</strong><br>- ${impedimentos.join('<br>- ')}`;
            window.dadosExtraidosPDF.resultado = "INDEFERIDO";
        }
        
        // Bloqueia a Portaria de Concessão
        btnGerarPortaria.disabled = true;
    } else {
        alertaRetornoComissao.classList.add('d-none');
        btnGerarPortaria.disabled = false;
        window.dadosExtraidosPDF.resultado = "DEFERIDO";
    }

    // Sincroniza os dados selecionados no objeto global
    window.dadosExtraidosPDF.iqAtual = selectIQAtual.value;
    window.dadosExtraidosPDF.nivelSolicitado = selectRscSolicitado.value;
    window.dadosExtraidosPDF.dataExercicio = inputDataExercicio.value;
    window.dadosExtraidosPDF.estagioProbatorio = selectEstagioProbatorio.value;
}

// Função Auxiliar de Formatação de Data para exibição amigável (YYYY-MM-DD -> DD/MM/YYYY)
function formatarDataBr(dataIso) {
    if (!dataIso) return '';
    const partes = dataIso.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
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
            
            // 1. Pré-seleciona os menus com base no PDF (mas permite que você altere)
            if (dados.iqAtual) selectIQAtual.value = dados.iqAtual;
            if (dados.nivelSolicitado) selectRscSolicitado.value = dados.nivelSolicitado;

            // 2. Se o PDF trouxe a data apurada pela comissão, guardamos para comparação
            // O campo inputDataExercicio fica livre para você digitar a data oficial do assentamento
            if (dados.dataExercicioComissao && !inputDataExercicio.value) {
                inputDataExercicio.value = dados.dataExercicioComissao;
            }

            statusLeitura.classList.replace('alert-secondary', 'alert-success');
            statusLeitura.textContent = "✅ Leitura concluída com sucesso! Verifique ou digite os dados nos campos abaixo.";
            
            secaoValidacoes.classList.remove('d-none');
            acoesGeracao.classList.remove('d-none');
            
            // Executa a primeira validação com os dados extraídos/digitados
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
