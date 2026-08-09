let baseServidoresCSV = [];

document.addEventListener('DOMContentLoaded', () => {
    const csvInput = document.getElementById('csvBaseInput');
    if (csvInput) {
        csvInput.addEventListener('change', carregarBaseCSV);
    }
});

function carregarBaseCSV(event) {
    const file = event.target.files[0];
    const statusText = document.getElementById('statusBaseCsv');

    if (!file) return;

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: "UTF-8",
        complete: function(results) {
            baseServidoresCSV = results.data;
            if (statusText) {
                statusText.className = "form-text mt-1 text-success fw-bold";
                statusText.innerHTML = `✅ Base cadastral carregada com sucesso! (${baseServidoresCSV.length} registros cadastrados).`;
            }
        },
        error: function(error) {
            if (statusText) {
                statusText.className = "form-text mt-1 text-danger fw-bold";
                statusText.innerHTML = "❌ Erro ao ler a planilha CSV. Verifique a formatação do arquivo.";
            }
            console.error("Erro no PapaParse:", error);
        }
    });
}

// Converte datas formato BR (DD/MM/AAAA) para ISO (AAAA-MM-DD) para compatibilidade com <input type="date">
function formatarDataParaInput(dataStr) {
    if (!dataStr) return '';
    const limpa = dataStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(limpa)) return limpa; // Já em formato ISO
    
    const partes = limpa.split('/');
    if (partes.length === 3) {
        const [dia, mes, ano] = partes;
        return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    return limpa;
}

// Função para buscar valores nas linhas independente de espaços extras nos cabeçalhos
function obterValorColuna(row, nomesPossiveis) {
    const chave = Object.keys(row).find(k => 
        nomesPossiveis.some(nome => k.trim().toUpperCase() === nome.toUpperCase())
    );
    return chave ? row[chave] : null;
}

// Função chamada após a extração do SIAPE do PDF
function cruzarDadosComBaseCSV(siapeExtraido) {
    if (!baseServidoresCSV || baseServidoresCSV.length === 0 || !siapeExtraido) {
        return false;
    }

    const siapeLimpo = siapeExtraido.toString().replace(/\D/g, '');
    
    // Procura na planilha pelo SIAPE
    const servidorEncontrado = baseServidoresCSV.find(row => {
        const valSiape = obterValorColuna(row, ['SIAPE', 'MATRICULA', 'MATRICULA_SIAPE']);
        return valSiape ? valSiape.toString().replace(/\D/g, '') === siapeLimpo : false;
    });

    if (servidorEncontrado) {
        const nome = obterValorColuna(servidorEncontrado, ['NOME', 'NOME_SERVIDOR', 'SERVIDOR']);
        const cargo = obterValorColuna(servidorEncontrado, ['CARGO', 'CARGO_EFETIVO']);
        const lotacao = obterValorColuna(servidorEncontrado, ['LOTACAO', 'UNIDADE', 'CAMPUS']);
        const dataExercicio = obterValorColuna(servidorEncontrado, ['DATA_EXERCICIO', 'DATA_EXERCICIO_CARGO', 'EXERCICIO']);
        const titulacao = obterValorColuna(servidorEncontrado, ['TITULACAO_IQ', 'TITULACAO', 'IQ']);

        if (nome) document.getElementById('inputNomeServidor').value = nome.trim();
        if (cargo) document.getElementById('inputCargo').value = cargo.trim();
        if (lotacao) document.getElementById('inputLotacaoServidor').value = lotacao.trim();
        if (dataExercicio) {
            document.getElementById('inputDataExercicio').value = formatarDataParaInput(dataExercicio);
        }

        // Mapeamento automático de Titulação/IQ
        if (titulacao) {
            const iqPlanilha = titulacao.toLowerCase();
            const selectIQ = document.getElementById('selectIQAtual');
            
            if (iqPlanilha.includes('médio') || iqPlanilha.includes('medio') || iqPlanilha.includes('técnico')) selectIQ.value = '0';
            else if (iqPlanilha.includes('gradua')) selectIQ.value = '25';
            else if (iqPlanilha.includes('especializa')) selectIQ.value = '30';
            else if (iqPlanilha.includes('mestra')) selectIQ.value = '52';
        }

        const badge = document.getElementById('badgeOrigemDados');
        if (badge) {
            badge.className = "badge bg-success text-white";
            badge.innerHTML = "🟢 Auditado via Base Cadastral CSV";
        }
        return true;
    }

    return false;
}
