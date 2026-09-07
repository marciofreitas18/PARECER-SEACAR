// Matriz de Requisitos da Titulação/IQ Atual do Servidor por Nível Solicitado
const REQUISITOS_DECRETO_13048 = {
    'RSC-I':   { iqExigido: 0,  descricao: 'Sem ensino fundamental completo (IQ 0%)' },
    'RSC-II':  { iqExigido: 10, descricao: 'Ensino fundamental completo (IQ 10%)' },
    'RSC-III': { iqExigido: 15, descricao: 'Ensino Médio / Técnico (IQ 15%)' },
    'RSC-IV':  { iqExigido: 25, descricao: 'Graduação / Ensino Superior (IQ 25%)' },
    'RSC-V':   { iqExigido: 30, descricao: 'Especialização / Lato Sensu (IQ 30%)' },
    'RSC-VI':  { iqExigido: 52, descricao: 'Mestrado (IQ 52%)' }
};

/**
 * Dicionário completo com correções de acentuação para a lista de cargos
 */
const DICIONARIO_CORRECOES = {
    'administrador': 'Administrador',
    'analista de tecnologia da informacao': 'Analista de Tecnologia da Informação',
    'arquiteto e urbanista': 'Arquiteto e Urbanista',
    'arquivista': 'Arquivista',
    'assistente em administracao': 'Assistente em Administração',
    'assistente social': 'Assistente Social',
    'auditor': 'Auditor',
    'bibliotecario-documentalista': 'Bibliotecário-Documentalista',
    'biologo': 'Biólogo',
    'contador': 'Contador',
    'economista': 'Economista',
    'enfermeiro': 'Enfermeiro',
    'engenheiro de seguranca do trabalho': 'Engenheiro de Segurança do Trabalho',
    'engenheiro de segurança do trabalho': 'Engenheiro de Segurança do Trabalho',
    'engenheiro-area': 'Engenheiro-Área',
    'farmaceutico': 'Farmacêutico',
    'fisioterapeuta': 'Fisioterapeuta',
    'jornalista': 'Jornalista',
    'medico veterinario': 'Médico Veterinário',
    'medico-area': 'Médico-Área',
    'nutricionista-habilitacao': 'Nutricionista-Habilitação',
    'pedagogo-area': 'Pedagogo-Área',
    'produtor cultural': 'Produtor Cultural',
    'programador visual': 'Programador Visual',
    'psicologo': 'Psicólogo',
    'relacoes publicas': 'Relações Públicas',
    'revisor de textos': 'Revisor de Textos',
    'sanitarista': 'Sanitarista',
    'secretario executivo': 'Secretário Executivo',
    'tecnico de laboratorio/area': 'Técnico de Laboratório/Área',
    'técnico de laboratorio/área': 'Técnico de Laboratório/Área',
    'tecnico de tecnologia da informacao': 'Técnico de Tecnologia da Informação',
    'tecnico em agropecuaria': 'Técnico em Agropecuária',
    'tecnico em anatomia e necropsia': 'Técnico em Anatomia e Necropsia',
    'tecnico em arquivo': 'Técnico em Arquivo',
    'tecnico em assuntos educacionais': 'Técnico em Assuntos Educacionais',
    'tecnico em audiovisual': 'Técnico em Audiovisual',
    'tecnico em contabilidade': 'Técnico em Contabilidade',
    'tecnico em edificacoes': 'Técnico em Edificações',
    'tecnico em eletronica': 'Técnico em Eletrônica',
    'tecnico em eletrotecnica': 'Técnico em Eletrotécnica',
    'tecnico em enfermagem': 'Técnico em Enfermagem',
    'tecnico em nutricao e dietetica': 'Técnico em Nutrição e Dietética',
    'tecnico em quimica': 'Técnico em Química',
    'tecnico em seguranca do trabalho': 'Técnico em Segurança do Trabalho',
    'tecnologo': 'Tecnólogo',
    'tradutor e interprete de linguagem de sinais': 'Tradutor e Intérprete de Linguagem de Sinais'
};

// Memória global para os dados extraídos e base de servidores CSV
window.dadosExtraidosPDF = window.dadosExtraidosPDF || {};
window.baseServidoresCSV = window.baseServidoresCSV || [];

// Mapeamento Elementos do DOM
let pdfCRSCInput, csvServidoresInput, statusCSV, statusLeitura, secaoDadosParecer, secaoValidacoes, acoesGeracao;
let inputNomeServidor, inputCargoServidor, inputLotacaoServidor, inputSiape, inputEscolaridade, inputNumeroProcesso, inputPontuacao, inputDataParecer, inputDataExercicioComissao, inputCRSC;
let selectIQAtual, selectRscSolicitado, inputDataExercicio, selectEstagioProbatorio;
let alertaIncompatibilidadeRSC, alertaRetornoComissao, msgDivergenciaData;
let checkErroMaterial, boxErroMaterial;
let btnGerarSeacar, btnGerarPortaria, btnExportarExcel, btnLimparHistorico, tabelaHistorico;

/**
 * Helper para formatar nomes em Title Case mantendo conectivos em minúsculo
 * e aplicando a acentuação de cargos e palavras conhecidas
 */
function formatarNomeProprio(nome) {
    if (!nome) return '';
    
    const excecoes = ['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'com'];
    let textoProcessado = nome.toLowerCase().trim();

    // 1. Substituição de expressões completas e acentuações via dicionário
    Object.keys(DICIONARIO_CORRECOES).forEach(termo => {
        const regex = new RegExp(`\\b${termo.replace('/', '\\/')}\\b`, 'gi');
        textoProcessado = textoProcessado.replace(regex, DICIONARIO_CORRECOES[termo]);
    });

    // 2. Formatação em Title Case para palavras gerais não cobertas pelo dicionário
    return textoProcessado
        .split(/\s+/)
        .map((palavra, index) => {
            if (palavra.toLowerCase() !== palavra) {
                return palavra; // Preserva palavras modificadas pelo dicionário
            }
            if (index > 0 && excecoes.includes(palavra.toLowerCase())) {
                return palavra.toLowerCase(); // Preserva conectivos em minúsculo
            }
            return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
        })
        .join(' ');
}

document.addEventListener('DOMContentLoaded', () => {
    // Inputs de Arquivo
    pdfCRSCInput = document.getElementById('pdfCRSCInput');
    csvServidoresInput = document.getElementById('csvServidoresInput');
    statusCSV = document.getElementById('statusCSV');
    
    // Status e Seções
    statusLeitura = document.getElementById('statusLeitura');
    secaoDadosParecer = document.getElementById('secaoDadosParecer');
    secaoValidacoes = document.getElementById('secaoValidacoes');
    acoesGeracao = document.getElementById('acoesGeracao');

    // Campos de Edição Manual dos Dados do Parecer (Seção 2)
    inputNomeServidor = document.getElementById('inputNomeServidor');
    inputCargoServidor = document.getElementById('inputCargo'); // Alinhado com o id="inputCargo" do HTML
    inputLotacaoServidor = document.getElementById('inputLotacaoServidor');
    inputSiape = document.getElementById('inputSiape');
    inputEscolaridade = document.getElementById('inputEscolaridade');
    inputNumeroProcesso = document.getElementById('inputNumeroProcesso');
    inputPontuacao = document.getElementById('inputPontuacao');
    inputDataParecer = document.getElementById('inputDataParecer');
    inputDataExercicioComissao = document.getElementById('inputDataExercicioComissao');
    inputCRSC = document.getElementById('inputCRSC');

    // Campos de Validação (Seção 3)
    selectIQAtual = document.getElementById('selectIQAtual');
    selectRscSolicitado = document.getElementById('selectRscSolicitado');
    inputDataExercicio = document.getElementById('inputDataExercicio');
    selectEstagioProbatorio = document.getElementById('selectEstagioProbatorio');

    // Mapeamento do Alerta e Checkbox de Erro Material
    alertaIncompatibilidadeRSC = document.getElementById('alertaIncompatibilidadeRSC');
    alertaRetornoComissao = document.getElementById('alertaRetornoComissao');
    msgDivergenciaData = document.getElementById('msgDivergenciaData');
    checkErroMaterial = document.getElementById('checkErroMaterial');
    boxErroMaterial = document.getElementById('boxErroMaterial');

    // Botões e Tabela
    btnGerarSeacar = document.getElementById('btnGerarSeacar');
    btnGerarPortaria = document.getElementById('btnGerarPortaria');
    btnExportarExcel = document.getElementById('btnExportarExcel');
    btnLimparHistorico = document.getElementById('btnLimparHistorico');
    tabelaHistorico = document.getElementById('tabelaHistorico');

    inicializarApp();
});

function inicializarApp() {
    if (pdfCRSCInput) pdfCRSCInput.addEventListener('change', processarArquivoPDF);
    if (csvServidoresInput) csvServidoresInput.addEventListener('change', processarArquivoCSV);

    const camposManuais = [
        inputNomeServidor, 
        inputCargoServidor, 
        inputLotacaoServidor,
        inputSiape, 
        inputEscolaridade,
        inputNumeroProcesso, 
        inputPontuacao, 
        inputDataParecer,
        inputDataExercicioComissao,
        inputCRSC
    ];

    camposManuais.forEach(campo => {
        if (campo) {
            campo.addEventListener('input', () => {
                sincronizarDadosManuais();
                if (campo === inputSiape || campo === inputNomeServidor) buscarEPreencherDadosCSV();
            });
            campo.addEventListener('change', () => {
                sincronizarDadosManuais();
                if (campo === inputSiape || campo === inputNomeServidor) buscarEPreencherDadosCSV();
            });
        }
    });

    if (inputNomeServidor) {
       if (inputDataExercicio) {
        window.dadosExtraidosPDF.dataExercicio = inputDataExercicio.value;
    }
    if (selectEstagioProbatorio) window.dadosExtraidosPDF.estagioProbatorio = selectEstagioProbatorio.value;

    // CORREÇÃO: Apenas lê o valor do checkbox sem forçar 'false'
    if (checkErroMaterial) {
        window.dadosExtraidosPDF.erroMaterialSanavel = checkErroMaterial.checked;
    }

    executarValidacoesRegras();
    }

    if (inputEscolaridade) {
        inputEscolaridade.addEventListener('blur', () => {
            inputEscolaridade.value = formatarNomeProprio(inputEscolaridade.value);
            sincronizarDadosManuais();
        });
    }

    if (selectIQAtual) selectIQAtual.addEventListener('change', sincronizarDadosManuais);
    if (selectRscSolicitado) selectRscSolicitado.addEventListener('change', sincronizarDadosManuais);
    if (inputDataExercicio) {
        inputDataExercicio.addEventListener('change', sincronizarDadosManuais);
        inputDataExercicio.addEventListener('input', sincronizarDadosManuais);
    }
    if (selectEstagioProbatorio) selectEstagioProbatorio.addEventListener('change', sincronizarDadosManuais);
    if (checkErroMaterial) checkErroMaterial.addEventListener('change', sincronizarDadosManuais);

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

function processarArquivoCSV(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = function(evt) {
        const buffer = evt.target.result;
        let texto = "";

        try {
            const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
            texto = utf8Decoder.decode(buffer);
        } catch (err) {
            const latinDecoder = new TextDecoder('iso-8859-1');
            texto = latinDecoder.decode(buffer);
        }

        window.baseServidoresCSV = converterCSVParaArray(texto);

        if (statusCSV) {
            statusCSV.classList.remove('d-none');
            statusCSV.innerHTML = `✅ Base cadastral carregada com sucesso! (${window.baseServidoresCSV.length} registros cadastrados).`;
        }

        buscarEPreencherDadosCSV();
    };

    reader.readAsArrayBuffer(file);
}

function converterCSVParaArray(textoCsv) {
    const textoLimpo = textoCsv.replace(/^\uFEFF/, '');
    const linhas = textoLimpo.split(/\r\n|\n/);
    if (linhas.length === 0) return [];

    const separador = linhas[0].includes(';') ? ';' : ',';
    // Limpa aspas e espaços extras das chaves/cabeçalhos
    const cabecalhos = linhas[0].split(separador).map(c => c.trim().replace(/^"|"$/g, '').toUpperCase());

    const resultado = [];
    for (let i = 1; i < linhas.length; i++) {
        if (!linhas[i].trim()) continue;
        const valores = linhas[i].split(separador).map(v => v.trim().replace(/^"|"$/g, ''));
        const obj = {};
        cabecalhos.forEach((cabecalho, idx) => {
            obj[cabecalho] = valores[idx] || '';
        });
        resultado.push(obj);
    }
    return resultado;
}

/**
 * Função responsável por buscar no CSV e preencher o formulário
 */
function buscarEPreencherDadosCSV() {
    if (!window.baseServidoresCSV || window.baseServidoresCSV.length === 0) return;

    const siapeInformado = inputSiape ? inputSiape.value.trim() : '';
    const nomeInformado = inputNomeServidor ? inputNomeServidor.value.trim().toUpperCase() : '';

    if (!siapeInformado && !nomeInformado) return;

    let servidorEncontrado = null;

    // 1. Busca por SIAPE
    if (siapeInformado) {
        servidorEncontrado = window.baseServidoresCSV.find(s => {
            const siapeCsv = String(s['SIAPE'] || s['MATRICULA'] || s['MATRÍCULA'] || '').trim();
            return siapeCsv === siapeInformado;
        });
    }

    // 2. Busca por Nome
    if (!servidorEncontrado && nomeInformado && nomeInformado.length > 3) {
        servidorEncontrado = window.baseServidoresCSV.find(s => {
            const nomeCsv = (s['NOME'] || s['SERVIDOR'] || s['NOME DO SERVIDOR'] || '').toUpperCase();
            return nomeCsv.includes(nomeInformado) || nomeInformado.includes(nomeCsv);
        });
    }

    if (servidorEncontrado) {
        // Função utilitária interna para obter o valor ignorando pequenas variações no cabeçalho
        const obterValorColuna = (chavesValidas) => {
            for (let chave of chavesValidas) {
                if (servidorEncontrado[chave] !== undefined && servidorEncontrado[chave] !== '') {
                    return servidorEncontrado[chave];
                }
            }
            return '';
        };

        // Nome
        const nomeCsv = obterValorColuna(['NOME', 'SERVIDOR', 'NOME DO SERVIDOR']);
        if (nomeCsv && inputNomeServidor) {
            const nomeFormatado = formatarNomeProprio(nomeCsv);
            inputNomeServidor.value = nomeFormatado;
            window.dadosExtraidosPDF.nomeServidor = nomeFormatado;
        }

        // SIAPE
        const siapeCsv = obterValorColuna(['SIAPE', 'MATRICULA', 'MATRÍCULA']);
        if (siapeCsv && inputSiape) {
            inputSiape.value = siapeCsv;
            window.dadosExtraidosPDF.siape = siapeCsv;
        }

        // Cargo -> Verificação flexível da coluna Cargo
        const cargoCsv = obterValorColuna(['CARGO', 'CARGO EFETIVO', 'DESCRICAO CARGO', 'CARGO_EFETIVO']);
        if (cargoCsv && inputCargoServidor) {
            const cargoFormatado = formatarNomeProprio(cargoCsv);
            inputCargoServidor.value = cargoFormatado;
            window.dadosExtraidosPDF.cargo = cargoFormatado;
        }

        // Lotação
        const lotacaoCsv = obterValorColuna(['LOTAÇÃO', 'LOTACAO', 'UNIDADE', 'SETOR', 'CAMPUS']);
        if (lotacaoCsv && inputLotacaoServidor) {
            inputLotacaoServidor.value = lotacaoCsv;
            window.dadosExtraidosPDF.lotacao = lotacaoCsv;
        }

        // Escolaridade / Titulação
        const escolaridadeCsv = obterValorColuna(['TITULACAO_IQ', 'TITULAÇÃO_IQ', 'TITULACAO IQ', 'TITULAÇÃO IQ', 'ESCOLARIDADE', 'TITULAÇÃO', 'TITULACAO']);
        if (escolaridadeCsv && inputEscolaridade) {
            const escolaridadeFormatada = formatarNomeProprio(escolaridadeCsv);
            inputEscolaridade.value = escolaridadeFormatada;
            window.dadosExtraidosPDF.escolaridade = escolaridadeFormatada;
        }

        // Data de Exercício
        const dataExercicioCsv = obterValorColuna(['DATA DE EXERCÍCIO', 'DATA_EXERCICIO', 'EXERCICIO', 'DATA POSSE', 'POSSE']);
        if (dataExercicioCsv && inputDataExercicio) {
            if (dataExercicioCsv.includes('/')) {
                const [d, m, a] = dataExercicioCsv.split('/');
                inputDataExercicio.value = `${a}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
            } else {
                inputDataExercicio.value = dataExercicioCsv;
            }
            window.dadosExtraidosPDF.dataExercicio = inputDataExercicio.value;
        }

        sincronizarDadosManuais();
    }
}

function sincronizarDadosManuais() {
    if (!window.dadosExtraidosPDF) window.dadosExtraidosPDF = {};

    window.dadosExtraidosPDF.nomeServidor = inputNomeServidor ? inputNomeServidor.value.trim() : '';
    window.dadosExtraidosPDF.cargo = inputCargoServidor ? inputCargoServidor.value.trim() : '';

    const lotacaoInformada = inputLotacaoServidor ? inputLotacaoServidor.value.trim() : '';
    window.dadosExtraidosPDF.lotacao = lotacaoInformada || window.dadosExtraidosPDF.lotacao || 'Não informada';

    window.dadosExtraidosPDF.siape = inputSiape ? inputSiape.value.trim() : '';
    window.dadosExtraidosPDF.escolaridade = inputEscolaridade ? inputEscolaridade.value.trim() : '';
    window.dadosExtraidosPDF.numeroProcesso = inputNumeroProcesso ? inputNumeroProcesso.value.trim() : '';
    window.dadosExtraidosPDF.pontuacaoObtida = inputPontuacao ? inputPontuacao.value : '';

    const dataVigenciaInput = inputDataParecer ? inputDataParecer.value : '';
    window.dadosExtraidosPDF.dataVigenciaCRSC = dataVigenciaInput;
    window.dadosExtraidosPDF.dataVigencia = dataVigenciaInput;
    window.dadosExtraidosPDF.dataExercicioComissao = inputDataExercicioComissao ? inputDataExercicioComissao.value : '';
    window.dadosExtraidosPDF.unidadeCRSC = inputCRSC ? inputCRSC.value : '';

    if (selectIQAtual) window.dadosExtraidosPDF.iqAtual = selectIQAtual.value;
    if (selectRscSolicitado) {
        window.dadosExtraidosPDF.nivelSolicitado = selectRscSolicitado.value;
        const valorRsc = selectRscSolicitado.value;
        window.dadosExtraidosPDF.nivelRscRomano = valorRsc.includes('-') ? valorRsc.split('-')[1] : valorRsc;
    }

    if (inputDataExercicio) {
        window.dadosExtraidosPDF.dataExercicio = inputDataExercicio.value;
    }
    if (selectEstagioProbatorio) window.dadosExtraidosPDF.estagioProbatorio = selectEstagioProbatorio.value;
    if (checkErroMaterial) checkErroMaterial.checked = false; // ou window.dadosExtraidosPDF.erroMaterialSanavel

    if (checkErroMaterial) window.dadosExtraidosPDF.erroMaterialSanavel = checkErroMaterial.checked;

    executarValidacoesRegras();
}

function limparFormularioProcesso(limparArquivoInput = true) {
    if (limparArquivoInput && pdfCRSCInput) pdfCRSCInput.value = '';

    if (inputNomeServidor) inputNomeServidor.value = '';
    if (inputCargoServidor) inputCargoServidor.value = '';
    if (inputLotacaoServidor) inputLotacaoServidor.value = '';
    if (inputSiape) inputSiape.value = '';
    if (inputEscolaridade) inputEscolaridade.value = '';
    if (inputNumeroProcesso) inputNumeroProcesso.value = '';
    if (inputPontuacao) inputPontuacao.value = '';
    if (inputDataParecer) inputDataParecer.value = '';
    if (inputDataExercicioComissao) inputDataExercicioComissao.value = '';
    if (inputCRSC) inputCRSC.selectedIndex = 0;

    if (selectIQAtual) selectIQAtual.selectedIndex = 0;
    if (selectRscSolicitado) selectRscSolicitado.selectedIndex = 0;
    if (selectEstagioProbatorio) selectEstagioProbatorio.selectedIndex = 0;
    if (inputDataExercicio) inputDataExercicio.value = '';

    if (checkErroMaterial) checkErroMaterial.checked = false;
    if (boxErroMaterial) boxErroMaterial.classList.add('d-none');

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

            if (inputNomeServidor) inputNomeServidor.value = formatarNomeProprio(dados.nomeServidor || '');
            if (inputCargoServidor) inputCargoServidor.value = formatarNomeProprio(dados.cargo || '');
            if (inputLotacaoServidor) inputLotacaoServidor.value = dados.lotacao || dados.unidadeLotacao || dados.unidade || '';
            if (inputSiape) inputSiape.value = dados.siape || '';
            if (inputEscolaridade) inputEscolaridade.value = formatarNomeProprio(dados.escolaridade || '');
            if (inputNumeroProcesso) inputNumeroProcesso.value = dados.numeroProcesso || '';
            if (inputPontuacao) inputPontuacao.value = dados.pontuacaoObtida || '';
            if (inputDataParecer) inputDataParecer.value = dados.dataVigenciaCRSC || dados.dataVigencia || '';
            if (inputDataExercicioComissao) inputDataExercicioComissao.value = dados.dataExercicioComissao || dados.dataExercicio || '';
            if (inputCRSC && dados.unidadeCRSC) inputCRSC.value = dados.unidadeCRSC;

            if (dados.iqAtual && selectIQAtual) selectIQAtual.value = dados.iqAtual;
            if (dados.nivelSolicitado && selectRscSolicitado) selectRscSolicitado.value = dados.nivelSolicitado;
            if (inputDataExercicio) inputDataExercicio.value = dados.dataExercicio || dados.dataExercicioComissao || '';

            // Dispara a busca no CSV e sobrepõe/completa os dados cadastrais
            buscarEPreencherDadosCSV();

            if (statusLeitura) {
                statusLeitura.classList.replace('alert-secondary', 'alert-success');
                statusLeitura.innerHTML = `✅ <strong>Análise Concluída!</strong> Confira e/ou ajuste os dados abaixo se necessário.`;
            }

            exibirPaineisEValidar();
        } else {
            throw new Error("A função parseParecerCRSC não está disponível.");
        }
    } catch (err) {
        console.error("Erro no processamento do PDF:", err);
        if (statusLeitura) {
            statusLeitura.classList.replace('alert-secondary', 'alert-danger');
            statusLeitura.innerHTML = `⚠️ <strong>Não foi possível ler o PDF automaticamente.</strong> Preencha os campos abaixo manualmente para gerar a portaria/parecer.`;
        }

        exibirPaineisEValidar();
    }
}

function exibirPaineisEValidar() {
    if (secaoDadosParecer) secaoDadosParecer.classList.remove('d-none');
    if (secaoValidacoes) secaoValidacoes.classList.remove('d-none');
    if (acoesGeracao) acoesGeracao.classList.remove('d-none');

    sincronizarDadosManuais();
    salvarProcessoNoHistorico(window.dadosExtraidosPDF);
}

function executarValidacoesRegras() {
    let impedimentos = [];
    let requerDevolucaoCRSC = false;

    const iqVal = selectIQAtual ? parseInt(selectIQAtual.value, 10) : null;
    const rscVal = selectRscSolicitado ? selectRscSolicitado.value : null;

    if (iqVal !== null && !isNaN(iqVal) && rscVal && REQUISITOS_DECRETO_13048[rscVal]) {
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

    const dataConfirmadaStr = inputDataExercicio ? inputDataExercicio.value : "";
    const dataCRSCStr = inputDataExercicioComissao ? inputDataExercicioComissao.value : "";
    const ehErroMaterial = checkErroMaterial ? checkErroMaterial.checked : false;

    if (dataConfirmadaStr && dataCRSCStr) {
        const dataConfirmada = parseDataParaObjeto(dataConfirmadaStr);
        const dataCRSC = parseDataParaObjeto(dataCRSCStr);

        if (dataConfirmada && dataCRSC) {
            if (dataConfirmada.getTime() !== dataCRSC.getTime()) {
                if (boxErroMaterial) boxErroMaterial.classList.remove('d-none');

                if (ehErroMaterial) {
                    const textoMensagem = `ℹ️ Divergência identificada (SIAPE: <strong>${formatarDataBr(dataConfirmadaStr)}</strong> | Parecer: <strong>${formatarDataBr(dataCRSCStr)}</strong>), tratada como <strong>Erro Material Sanável</strong>. Data cadastral retificada de ofício no Parecer SEACAR.`;

                    if (msgDivergenciaData) {
                        msgDivergenciaData.innerHTML = textoMensagem;
                        msgDivergenciaData.className = "form-text text-warning d-block fw-bold mt-1";
                    }
                } else {
                    requerDevolucaoCRSC = true;
                    const textoMensagem = `⚠️ Divergência na data de exercício! Confirmada no sistema: <strong>${formatarDataBr(dataConfirmadaStr)}</strong> | Informada no Parecer CRSC: <strong>${formatarDataBr(dataCRSCStr)}</strong>.`;

                    if (msgDivergenciaData) {
                        msgDivergenciaData.innerHTML = textoMensagem;
                        msgDivergenciaData.className = "form-text text-danger d-block fw-bold mt-1";
                    }

                    impedimentos.push(`Divergência na data de exercício: data confirmada (${formatarDataBr(dataConfirmadaStr)}) difere do parecer da CRSC (${formatarDataBr(dataCRSCStr)}).`);
                }

            } else {
                if (msgDivergenciaData) msgDivergenciaData.classList.add('d-none');
                if (boxErroMaterial) {
                    boxErroMaterial.classList.add('d-none');
                    if (checkErroMaterial) checkErroMaterial.checked = false;
                }
            }
        }
    } else {
        if (boxErroMaterial) boxErroMaterial.classList.add('d-none');
    }

    window.dadosExtraidosPDF.impedimentos = impedimentos;

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

    const dataVigenciaRaw = inputDataParecer ? inputDataParecer.value : (dados.dataVigenciaCRSC || dados.dataVigencia || '');
    const dataVigenciaFormatada = dataVigenciaRaw ? formatarDataBr(dataVigenciaRaw) : '--';

    const item = {
        dataHora: new Date().toLocaleString('pt-BR'),
        processo: dados.numeroProcesso || '--',
        servidor: dados.nomeServidor || '--',
        cargo: dados.cargo || '--',
        lotacao: dados.lotacao || '--',
        siape: dados.siape || '--',
        escolaridade: dados.escolaridade || '--',
        nivel: dados.nivelSolicitado || '--',
        vigencia: dataVigenciaFormatada,
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
        tabelaHistorico.innerHTML = '<tr><td colspan="10" class="text-center text-muted">Nenhum processo analisado localmente.</td></tr>';
        return;
    }

    historico.forEach(item => {
        const tr = document.createElement('tr');
        const badgeClass = item.resultado === 'DEFERIDO' ? 'bg-success' : (item.resultado === 'RETORNAR À CRSC' ? 'bg-warning text-dark' : 'bg-danger');
        tr.innerHTML = `
            <td><small>${item.dataHora}</small></td>
            <td><strong>${item.processo}</strong></td>
            <td>${item.servidor}</td>
            <td>${item.cargo}</td>
            <td>${item.lotacao}</td>
            <td>${item.siape}</td>
            <td>${item.escolaridade || '--'}</td>
            <td>${item.nivel}</td>
            <td>${item.vigencia || '--'}</td>
            <td><span class="badge ${badgeClass}">${item.resultado}</span></td>
        `;
        tabelaHistorico.appendChild(tr);
    });
}

function exportarHistoricoCSV() {
    let historico = JSON.parse(localStorage.getItem('historicoRSC') || '[]');
    if (historico.length === 0) return alert("Não há dados para exportar.");

    let csvContent = "data:text/csv;charset=utf-8,Data/Hora,Processo,Servidor,Cargo,Lotacao,SIAPE,Escolaridade,Nivel,Vigencia,Resultado\n";
    historico.forEach(i => {
        csvContent += `"${i.dataHora}","${i.processo}","${i.servidor}","${i.cargo}","${i.lotacao}","${i.siape}","${i.escolaridade || '--'}","${i.nivel}","${i.vigencia || '--'}","${i.resultado}"\n`;
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
