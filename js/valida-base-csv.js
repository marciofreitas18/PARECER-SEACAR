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

// Função chamada pelo leitor do PDF após extrair o SIAPE
function cruzarDadosComBaseCSV(siapeExtraido) {
    if (!baseServidoresCSV || baseServidoresCSV.length === 0 || !siapeExtraido) {
        return false;
    }

    const siapeLimpo = siapeExtraido.replace(/\D/g, '');
    
    // Procura na planilha pelo SIAPE
    const servidorEncontrado = baseServidoresCSV.find(row => {
        const siapeRow = (row.SIAPE || row.siape || row.Siape || '').replace(/\D/g, '');
        return siapeRow === siapeLimpo;
    });

    if (servidorEncontrado) {
        // Mapeia e auto-preenche os campos
        if (servidorEncontrado.Nome || servidorEncontrado.NOME) {
            document.getElementById('inputNomeServidor').value = servidorEncontrado.Nome || servidorEncontrado.NOME;
        }
        if (servidorEncontrado.Cargo || servidorEncontrado.CARGO) {
            document.getElementById('inputCargo').value = servidorEncontrado.Cargo || servidorEncontrado.CARGO;
        }
        if (servidorEncontrado.Lotacao || servidorEncontrado.LOTACAO) {
            document.getElementById('inputLotacaoServidor').value = servidorEncontrado.Lotacao || servidorEncontrado.LOTACAO;
        }
        if (servidorEncontrado.Data_Exercicio || servidorEncontrado.DATA_EXERCICIO) {
            document.getElementById('inputDataExercicio').value = servidorEncontrado.Data_Exercicio || servidorEncontrado.DATA_EXERCICIO;
        }

        // Mapeamento automático de Titulação/IQ
        const iqPlanilha = (servidorEncontrado.Titulacao_IQ || servidorEncontrado.TITULACAO || '').toLowerCase();
        const selectIQ = document.getElementById('selectIQAtual');
        
        if (iqPlanilha.includes('médio') || iqPlanilha.includes('medio') || iqPlanilha.includes('técnico')) selectIQ.value = '0';
        else if (iqPlanilha.includes('gradua')) selectIQ.value = '25';
        else if (iqPlanilha.includes('especializa')) selectIQ.value = '30';
        else if (iqPlanilha.includes('mestra')) selectIQ.value = '52';

        const badge = document.getElementById('badgeOrigemDados');
        if (badge) {
            badge.className = "badge bg-success text-white";
            badge.innerHTML = "🟢 Auditado via Base Cadastral CSV";
        }
        return true;
    }

    return false;
}
