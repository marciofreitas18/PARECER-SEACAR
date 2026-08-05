/**
 * Gerador de Parecer Técnico SEACAR (.html)
 * Formatação técnica completa segundo as diretrizes do Decreto nº 13.048/2026.
 */
function gerarParecerSEACAR(dados) {
    if (!dados || (!dados.nomeServidor && !dados.nome)) {
        alert("Nenhum dado do processo foi carregado para gerar o Parecer.");
        return;
    }

    const dataAtualExtenso = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const dataHojeFormatada = new Date().toLocaleDateString('pt-BR');

    // Mapeamento e Tratamento das Variáveis do Modelo
    const processo = dados.numeroProcesso || '23205.XXXXXX/2026-XX';
    const nome = dados.nomeServidor ? dados.nomeServidor.trim().toUpperCase() : (dados.nome ? dados.nome.trim().toUpperCase() : 'XXXXXXXXXXXXXXXXXXXX');
    const siape = dados.siape || 'XXXXXXX';
    const cargo = dados.cargo || 'XXXXXXXXXXXXXXX';
    const lotacao = dados.lotacao || 'XXXXXXXXXXX';
    const pontuacaoObtida = dados.pontuacaoObtida || '0.0';
    const iqAtual = dados.iqAtual || '0';
    
    // Nível do RSC (Ex: RSC-PCCTAE-V ou RSC-V)
    let nivel = dados.nivelSolicitado || 'RSC-V';
    if (dados.nivelRscRomano && !nivel.includes('-')) {
        nivel = `RSC-${dados.nivelRscRomano}`;
    }

    // Comissão Emissora (CRSC)
    const comissaoCRSC = (dados.unidadeCRSC && dados.unidadeCRSC.trim() !== '')
        ? dados.unidadeCRSC
        : (dados.campusCRSC 
            ? (dados.campusCRSC.toLowerCase() === 'reitoria' ? 'CRSC Reitoria' : `CRSC Campus ${dados.campusCRSC}`)
            : 'Comissão de Reconhecimento de Saberes e Competências (CRSC)');

    // Tratamento e Formatação das Datas
    let dataVigencia = dataHojeFormatada;
    const dataVigenciaRaw = dados.dataVigenciaCRSC || dados.dataParecer || dados.dataVigencia;
    if (dataVigenciaRaw) {
        dataVigencia = typeof formatarDataBr === 'function' ? formatarDataBr(dataVigenciaRaw) : dataVigenciaRaw;
    }

    let dataExercicio = "Não informada";
    if (dados.dataExercicio) {
        dataExercicio = typeof formatarDataBr === 'function' ? formatarDataBr(dados.dataExercicio) : dados.dataExercicio;
    }

    let dataExercicioComissao = "Não informada";
    if (dados.dataExercicioComissao) {
        dataExercicioComissao = typeof formatarDataBr === 'function' ? formatarDataBr(dados.dataExercicioComissao) : dados.dataExercicioComissao;
    }

    // Determinação do Resultado e Seleção das Opções
    const resultado = dados.resultado || "DEFERIDO";
    const impedimentos = dados.impedimentos || [];

    // Lógica Dinâmica da Seção 2 (Análise Técnico-Legal)
    let blocoIQ = "";
    if (impedimentos.some(i => i.toLowerCase().includes("incompatibilidade") || i.toLowerCase().includes("iq"))) {
        const iqExigidoMatch = impedimentos.join(" ").match(/iq mínimo de (\d+)%/i);
        const iqExigido = iqExigidoMatch ? iqExigidoMatch[1] : "--";
        blocoIQ = `<strong>INCOMPATIBILIDADE DETECTADA:</strong> O IQ atual do(a) servidor(a) (<strong>${iqAtual}%</strong>) é inferior ao mínimo exigido pelo Decreto nº 13.048/2026 para o nível <strong>${nivel}</strong> (exigido: <strong>${iqExigido}%</strong>).`;
    } else {
        blocoIQ = `Constata-se que o IQ atual atende aos requisitos mínimos exigidos pelo regramento vigente para o nível <strong>${nivel}</strong>, não havendo impedimento legal quanto ao critério de titulação/escolaridade prévia.`;
    }

    // 2.2 Estágio Probatório
    let situacaoEstagio = "não se encontra em estágio probatório";
    if (dados.estagioProbatorio === 'sim' || impedimentos.some(i => i.toLowerCase().includes("estágio probatório"))) {
        situacaoEstagio = "se encontra em estágio probatório (impedimento legal)";
    }

// 2.3 Alerta / Registro de Divergência de Data
    let blocoDivergenciaData = "";
    const ehErroMaterial = dados.erroMaterialSanavel || false;

    if (ehErroMaterial) {
        blocoDivergenciaData = `
            <div style="background-color: #e2e3e5; border-left: 4px solid #6c757d; color: #383d41; padding: 10px; margin-top: 10px; margin-bottom: 10px; border-radius: 4px; text-indent: 0;">
                <strong>📌 RESSALVA DE ERRO MATERIAL SANÁVEL:</strong> Constatou-se divergência pontual entre a data de exercício registrada no cadastro do servidor (<strong>${dataExercicio}</strong>) e a grafada no Parecer da CRSC (<strong>${dataExercicioComissao}</strong>). Por tratar-se de mero <strong>erro material sanável</strong>, que não altera o preenchimento dos requisitos do Decreto nº 13.048/2026 nem afeta a vigência financeira, <strong>retifica-se o dado de ofício nesta análise técnica</strong>, restando desnecessária a devolução dos autos à comissão de origem para este fim.
            </div>
        `;
    } else if (resultado === "RETORNAR À CRSC" || impedimentos.some(i => i.toLowerCase().includes("divergência na data de exercício"))) {
        blocoDivergenciaData = `
            <div style="background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 10px; margin-top: 10px; border-radius: 4px; text-indent: 0;">
                <strong>⚠️ DIVERGÊNCIA IDENTIFICADA:</strong> Constatou-se divergência entre a data de exercício registrada nos assentamentos funcionais (<strong>${dataExercicio}</strong>) e a data informada no Parecer da CRSC (<strong>${dataExercicioComissao}</strong>). Em observância à segurança jurídica e à exatidão dos registros cadastrais, o processo deverá retornar à comissão para adequação.
            </div>
        `;
    }

    // Checkboxes do Item 3 (Conclusão)
    const checkDeferido = resultado === "DEFERIDO" ? "[ X ]" : "[ &nbsp; ]";
    const checkDevolucao = resultado === "RETORNAR À CRSC" ? "[ X ]" : "[ &nbsp; ]";
    const checkIndeferido = resultado === "INDEFERIDO" ? "[ X ]" : "[ &nbsp; ]";

    const conteudoHTML = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Parecer Técnico SEACAR - ${processo}</title>
        <style>
            @page { size: A4; margin: 2.5cm 2cm 2.5cm 2cm; }
            body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #000; margin: 40px; }
            .cabecalho { text-align: center; font-weight: bold; font-size: 10pt; margin-bottom: 25px; border-bottom: 1px solid #000; padding-bottom: 10px; }
            .titulo-parecer { text-align: right; font-weight: bold; margin-bottom: 20px; }
            .tabela-dados { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11pt; }
            .tabela-dados td { padding: 3px 0; vertical-align: top; }
            .label { font-weight: bold; width: 180px; }
            h3.secao { font-size: 11pt; font-weight: bold; margin-top: 20px; margin-bottom: 8px; text-transform: uppercase; }
            p { text-align: justify; text-indent: 1.25cm; margin-bottom: 12px; margin-top: 0; }
            .sem-recuo { text-indent: 0; }
            .data-local { margin-top: 35px; text-align: center; }
            .assinatura { margin-top: 50px; text-align: center; font-weight: bold; }
        </style>
    </head>
    <body>

        <div class="cabecalho">
            MINISTÉRIO DA EDUCAÇÃO<br>
            UNIVERSIDADE FEDERAL DA FRONTEIRA SUL (UFFS)<br>
            PRÓ-REITORIA DE GESTÃO DE PESSOAS (PROGESP)<br>
            SERVIÇO ESPECIAL DE ACOMPANHAMENTO DA CARREIRA (SEACAR)
        </div>

        <div class="titulo-parecer">
            PARECER TÉCNICO Nº XXX/SEACAR/PROGESP/2026
        </div>

        <table class="tabela-dados">
            <tr>
                <td class="label">PROCESSO SIPAC Nº:</td>
                <td>${processo}</td>
            </tr>
            <tr>
                <td class="label">INTERESSADO(A):</td>
                <td>${nome}</td>
            </tr>
            <tr>
                <td class="label">MATRÍCULA SIAPE:</td>
                <td>${siape}</td>
            </tr>
            <tr>
                <td class="label">CARGO | LOTAÇÃO:</td>
                <td>${cargo} | ${lotacao}</td>
            </tr>
        </table>

        <h3 class="secao">1. RELATÓRIO</h3>
        <p>
            Trata-se do exame do processo administrativo em referência, no qual o(a) servidor(a) <strong>${nome}</strong>, ocupante do cargo de <strong>${cargo}</strong>, solicita a concessão do Reconhecimento de Saberes e Competências no nível <strong>${nivel}</strong>, nos termos da Lei nº 11.091, de 12 de janeiro de 2005, e do Decreto nº 13.048, de 3 de julho de 2026.
        </p>
        <p>
            O processo foi instruído com a documentação probatória do(a) servidor(a) e submetido à análise da <strong>${comissaoCRSC}</strong>, a qual exarou parecer favorável à concessão, atribuindo o total de <strong>${pontuacaoObtida} pontos</strong> às atividades e saberes comprovados, fixando a data de vigência do parecer em <strong>${dataVigencia}</strong>.
        </p>

        <h3 class="secao">2. FUNDAMENTAÇÃO E ANÁLISE TÉCNICO-LEGAL</h3>
        
        <p class="sem-recuo">
            <strong>2.1. Do Cumprimento do Requisito de Titulação e Incentivo à Qualificação (IQ):</strong><br>
            O Decreto nº 13.048/2026 estabelece a correlação indispensável entre o nível de Incentivo à Qualificação (IQ) detido pelo servidor técnico-administrativo e o nível de RSC pretendido. Consultados os registros funcionais, verifica-se que o(a) servidor(a) possui o percentual atual de IQ de <strong>${iqAtual}%</strong>.
        </p>
        <p>
            ${blocoIQ}
        </p>

        <p class="sem-recuo">
            <strong>2.2. Da Situação Funcional e Estágio Probatório:</strong><br>
            Em atendimento às vedações expressas no Decreto nº 13.048/2026 e demais regulamentações vigentes, certifica-se que o(a) servidor(a) <strong>${situacaoEstagio}</strong>.
        </p>

        <p class="sem-recuo">
            <strong>2.3. Da Data de Exercício e Efeitos Financeiros:</strong><br>
            A data de exercício no cargo efetivo confirmada no cadastro do servidor é <strong>${dataExercicio}</strong>. Com base no parecer emitido pela <strong>${comissaoCRSC}</strong>, a data de vigência para fins de efeitos financeiros resta fixada em <strong>${dataVigencia}</strong>.
        </p>
        ${blocoDivergenciaData}

        <h3 class="secao">3. CONCLUSÃO E ENCAMINHAMENTO</h3>
        <p class="sem-recuo">
            Diante do exposto, considerando o parecer da <strong>${comissaoCRSC}</strong> e a validação dos requisitos legais e cadastrais:
        </p>

        <p class="sem-recuo" style="margin-left: 0.5cm;">
            <strong>${checkDeferido} OPINA-SE PELO DEFERIMENTO</strong> do pedido, sugerindo-se o encaminhamento dos autos ao Pró-Reitor de Gestão de Pessoas para emissão da respectiva Portaria de concessão do <strong>${nivel}</strong>, com efeitos financeiros a contar de <strong>${dataVigencia}</strong>.<br><br>
            <strong>${checkDevolucao} OPINA-SE PELA DEVOLUÇÃO À CRSC</strong> em virtude de divergência cadastral na data de exercício apontada na Seção 2.3 deste parecer.<br><br>
            <strong>${checkIndeferido} OPINA-SE PELO INDEFERIMENTO</strong> tendo em vista o não cumprimento dos requisitos estipulados no Decreto nº 13.048/2026.
        </p>

        <div class="data-local">
            Chapecó-SC, ${dataAtualExtenso}.
        </div>

        <div class="assinatura">
            __________________________________________<br>
            <strong>SEACAR / PROGESP / UFFS</strong>
        </div>

    </body>
    </html>
    `;

    // Download do Documento Parecer
    const blob = new Blob([conteudoHTML], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Parecer_SEACAR_${resultado.replace(/\s+/g, '_')}_${processo.replace(/[\/\.]/g, '_')}.html`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Vinculação com o escopo global do navegador
window.gerarParecerSEACAR = gerarParecerSEACAR;
