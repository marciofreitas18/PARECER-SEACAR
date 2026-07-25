/**
 * Gerador de Parecer Técnico SEACAR (.html)
 * Trata dinamicamente a CRSC emissora, análises cadastrais/legais (Decreto nº 13.048/2026) 
 * e os cenários de Deferimento / Devolução à CRSC / Indeferimento.
 */
function gerarParecerSEACAR(dados) {
    if (!dados || !dados.nomeServidor) {
        alert("Nenhum dado do processo foi carregado para gerar o Parecer.");
        return;
    }

    const dataAtualExtenso = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const dataHojeFormatada = new Date().toLocaleDateString('pt-BR');

    const processo = dados.numeroProcesso || '23205.XXXXXX/2026-XX';
    const servidor = dados.nomeServidor ? dados.nomeServidor.toUpperCase() : 'XXXXXXXXXXXXXXXXXXXX';
    const siape = dados.siape || 'XXXXXXX';
    const cargo = dados.cargo || 'XXXXXXXXXXXXXXX';
    const lotacao = dados.lotacao || 'XXXXXXXXXXX';
    
    // Tratamento padronizado para o nível RSC
    let nivelRomano = dados.nivelRscRomano || 'V';
    if (dados.nivelSolicitado) {
        nivelRomano = dados.nivelSolicitado.includes('-') ? dados.nivelSolicitado.split('-')[1] : dados.nivelSolicitado;
    }
    const nivelExibicao = `RSC-PCCTAE Nível ${nivelRomano}`;
    const pontuacao = dados.pontuacaoObtida || '0.0';
    const iqAtual = dados.iqAtual ? `${dados.iqAtual}%` : 'Não informado';

    // Tratamento dinâmico para Reitoria vs Campus vs Campo Manual
    let textoCRSC = 'Comissão de Reconhecimento de Saberes e Competências (CRSC)';
    if (dados.unidadeCRSC && dados.unidadeCRSC.trim() !== '') {
        textoCRSC = dados.unidadeCRSC;
    } else if (dados.campusCRSC) {
        const comissaoNome = dados.campusCRSC;
        textoCRSC = comissaoNome.toLowerCase() === 'reitoria' 
            ? 'CRSC Reitoria' 
            : `CRSC Campus ${comissaoNome}`;
    }

    // Tratamento e priorização da Data de Vigência / Parecer
    let dataVigenciaBr = dataHojeFormatada;
    if (dados.dataVigenciaCRSC) {
        dataVigenciaBr = typeof formatarDataBr === 'function' ? formatarDataBr(dados.dataVigenciaCRSC) : dados.dataVigenciaCRSC;
    } else if (dados.dataParecer) {
        dataVigenciaBr = typeof formatarDataBr === 'function' ? formatarDataBr(dados.dataParecer) : dados.dataParecer;
    } else if (dados.dataVigencia || dados.dataRequerimento) {
        dataVigenciaBr = typeof formatarDataBr === 'function' ? formatarDataBr(dados.dataVigencia || dados.dataRequerimento) : (dados.dataVigencia || dados.dataRequerimento);
    }

    // Tratamento da Data de Exercício Funcional x Parecer
    let dataExercicioBr = "Não informada";
    if (dados.dataExercicio) {
        dataExercicioBr = typeof formatarDataBr === 'function' ? formatarDataBr(dados.dataExercicio) : dados.dataExercicio;
    }

    const resultado = dados.resultado || "DEFERIDO";
    const impedimentos = dados.impedimentos || [];

    // Lógica Dinâmica do Corpo do Parecer
    let tituloAssunto = "ASSUNTO: Análise de conformidade legal e documental — RSC-PCCTAE.";
    let secaoRelatorio = "";
    let secaoAnalise = "";
    let secaoConclusao = "";

    if (resultado === "RETORNAR À CRSC" || resultado === "INDEFERIDO") {
        const ehDevolucao = resultado === "RETORNAR À CRSC";
        tituloAssunto = ehDevolucao 
            ? "ASSUNTO: Devolução do processo para adequação / reanálise pela CRSC." 
            : "ASSUNTO: Análise de conformidade legal — Indeferimento do pleito.";

        secaoRelatorio = `
            <p>
                Trata-se de processo administrativo de solicitação de concessão de Reconhecimento de Saberes e Competências (${nivelExibicao}), encaminhado pela <strong>${textoCRSC}</strong>, referente ao(à) servidor(a) supracitado(a).
            </p>
            <p>
                O processo foi submetido à apreciação da comissão de origem, a qual exarou parecer técnico atribuindo a pontuação de <strong>${pontuacao} pontos</strong>.
            </p>
        `;

        const listaPendencias = impedimentos.length > 0 
            ? `<ul style="margin-top: 5px; margin-bottom: 10px;">${impedimentos.map(imp => `<li>${imp}</li>`).join('')}</ul>`
            : `<p>Inconsistência cadastral, divergência documental ou descumprimento dos requisitos regulamentares identificados nos autos.</p>`;

        secaoAnalise = `
            <p>
                Ao proceder à conferência instrucional e cadastral do processo à luz da Lei nº 11.091/2005, do Decreto nº 13.048/2026 e da Portaria nº 4725/GR/UFFS/2026, identificaram-se as seguintes pendências/impedimentos legais ou cadastrais:
            </p>
            ${listaPendencias}
        `;

        if (ehDevolucao) {
            secaoConclusao = `
                <p>
                    Em face do exposto, o SEACAR conclui pela <strong>NECESSIDADE DE DEVOLUÇÃO DO PROCESSO À ${textoCRSC.toUpperCase()}</strong> para conhecimento, reanálise e prestação dos esclarecimentos necessários ou correção/adequação dos dados informados no parecer de origem.
                </p>
                <p>
                    Encaminhe-se o processo à comissão de origem para as devidas providências.
                </p>
            `;
        } else {
            secaoConclusao = `
                <p>
                    Em face do exposto, o SEACAR conclui pelo <strong>INDEFERIMENTO</strong> da solicitação de ${nivelExibicao} devido ao descumprimento dos requisitos regulamentares e legais estabelecidos na Lei nº 11.091/2005 e no Decreto nº 13.048/2026.
                </p>
            `;
        }
    } else {
        // Fluxo Padrão: DEFERIDO
        secaoRelatorio = `
            <p>
                Trata-se de processo administrativo de solicitação de concessão de Reconhecimento de Saberes e Competências (${nivelExibicao}), encaminhado pela <strong>${textoCRSC}</strong>, com parecer favorável à concessão ao(à) servidor(a) supracitado(a), tendo sido homologada a pontuação de <strong>${pontuacao} pontos</strong> e fixada a data do parecer/requerimento em <strong>${dataVigenciaBr}</strong>.
            </p>
        `;

        secaoAnalise = `
            <p>
                O SEACAR procedeu à conferência instrucional do processo à luz da Lei nº 11.091/2005, do Decreto nº 13.048/2026 e da Portaria nº 4725/GR/UFFS/2026, bem como à verificação cadastral dos dados funcionais do(a) servidor(a) na base oficial da UFFS:
            </p>
            <div class="subitem">
                2.1. O(A) servidor(a) matrícula SIAPE <strong>${siape}</strong> foi localizado(a) com cadastro ativo na base oficial do sistema de gestão de pessoas.
            </div>
            <div class="subitem">
                2.2. Os dados de nome, cargo e lotação informados no processo são condizentes com os assentamentos funcionais.
            </div>
            <div class="subitem">
                2.3. Constata-se que o percentual atual de Incentivo à Qualificação (IQ) informado (<strong>${iqAtual}</strong>) atende aos requisitos de titulação/escolaridade prévia exigidos pelo Decreto nº 13.048/2026 para o nível solicitado.
            </div>
            <div class="subitem">
                2.4. A data de exercício confirmada no cadastro funcional é <strong>${dataExercicioBr}</strong>, estando o(a) servidor(a) em pleno cumprimento dos requisitos funcionais, sem impedimentos decorrentes de estágio probatório.
            </div>
        `;

        secaoConclusao = `
            <p>
                Em face do exposto, o SEACAR conclui pela <strong>CONFORMIDADE LEGAL E CADASTRAL</strong> do processo em epígrafe, atestando estarem satisfeitos os requisitos do Decreto nº 13.048/2026 e da Portaria nº 4725/GR/UFFS/2026.
            </p>
            <p>
                Sugere-se o encaminhamento à Divisão de Avaliação e Carreira (DAC) e à Diretoria de Desenvolvimento de Pessoal (DDP) para os atos subsequentes e, na sequência, à Pró-Reitoria de Gestão de Pessoas (PROGESP) para expedição da respectiva Portaria de Concessão do <strong>${nivelExibicao}</strong>, com efeitos financeiros a contar de <strong>${dataVigenciaBr}</strong>, nos termos do Decreto nº 13.048/2026.
            </p>
        `;
    }

    const conteudoHTML = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Parecer SEACAR - Processo ${processo}</title>
        <style>
            @page {
                size: A4;
                margin: 2.5cm 2cm 2.5cm 2cm;
            }
            body { 
                font-family: 'Calibri', 'Arial', sans-serif; 
                font-size: 11pt; 
                line-height: 1.5; 
                color: #000;
                margin: 40px; 
            }
            .cabecalho-oficial { 
                text-align: center; 
                font-weight: bold; 
                font-size: 10pt; 
                margin-bottom: 25px; 
                border-bottom: 1px solid #000;
                padding-bottom: 10px;
            }
            .tabela-cabecalho {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                font-size: 11pt;
            }
            .tabela-cabecalho td {
                padding: 3px 0;
                vertical-align: top;
            }
            .label {
                font-weight: bold;
                width: 200px;
            }
            .assunto {
                font-weight: bold;
                margin-top: 15px;
                margin-bottom: 20px;
            }
            h3.secao {
                font-size: 11pt;
                font-weight: bold;
                margin-top: 20px;
                margin-bottom: 8px;
            }
            p {
                text-align: justify;
                text-indent: 1.25cm;
                margin-bottom: 12px;
                margin-top: 0;
            }
            .subitem {
                text-indent: 0;
                margin-left: 1.25cm;
                margin-bottom: 6px;
                text-align: justify;
            }
            .data-local {
                margin-top: 35px;
                text-align: left;
            }
            .assinatura-box {
                margin-top: 50px;
                text-align: center;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="cabecalho-oficial">
            MINISTÉRIO DA EDUCAÇÃO<br>
            UNIVERSIDADE FEDERAL DA FRONTEIRA SUL - UFFS<br>
            SERVIÇO ESPECIAL DE ACOMPANHAMENTO DA CARREIRA - SEACAR
        </div>

        <table class="tabela-cabecalho">
            <tr>
                <td class="label">PROCESSO SIPAC Nº:</td>
                <td>${processo}</td>
            </tr>
            <tr>
                <td class="label">INTERESSADO(A):</td>
                <td>${servidor}</td>
            </tr>
            <tr>
                <td class="label">MATRÍCULA SIAPE:</td>
                <td>${siape}</td>
            </tr>
            <tr>
                <td class="label">CARGO:</td>
                <td>${cargo}</td>
            </tr>
            <tr>
                <td class="label">LOTAÇÃO:</td>
                <td>${lotacao}</td>
            </tr>
            <tr>
                <td class="label">NÍVEL DE RSC-PCCTAE:</td>
                <td>${nivelExibicao}</td>
            </tr>
            <tr>
                <td class="label">PONTUAÇÃO TOTAL:</td>
                <td>${pontuacao}</td>
            </tr>
        </table>

        <div class="assunto">
            ${tituloAssunto}
        </div>

        <h3 class="secao">1. RELATÓRIO</h3>
        ${secaoRelatorio}

        <h3 class="secao">2. ANÁLISE DE CONFORMIDADE E REQUISITOS LEGAIS</h3>
        ${secaoAnalise}

        <h3 class="secao">3. CONCLUSÃO E ENCAMINHAMENTO</h3>
        ${secaoConclusao}

        <div class="data-local">
            Chapecó-SC, ${dataAtualExtenso}.
        </div>

        <div class="assinatura-box">
            SERVIÇO ESPECIAL DE ACOMPANHAMENTO DA CARREIRA<br>
            Universidade Federal da Fronteira Sul
        </div>
    </body>
    </html>
    `;

    const blob = new Blob([conteudoHTML], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Parecer_SEACAR_${resultado.replace(/\s+/g, '_')}_${processo.replace(/[\/\.]/g, '_')}.html`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Vinculação explícita com o escopo global
window.gerarParecerSEACAR = gerarParecerSEACAR;
