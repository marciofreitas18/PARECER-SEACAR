/**
 * Gerador de Parecer Técnico SEACAR (.html)
 * Trata dinamicamente a CRSC emissora (Reitoria vs Campi)
 */
function gerarParecerSEACAR(dados) {
    if (!dados || !dados.nomeServidor) {
        alert("Nenhum dado do processo foi carregado para gerar o Parecer.");
        return;
    }
const unidadeOrigem = dados.unidadeCRSC || 'CRSC - Comissão de Reconhecimento de Saberes e Competências';
    const dataAtualExtenso = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const dataHojeFormatada = new Date().toLocaleDateString('pt-BR');

    const processo = dados.numeroProcesso || '23205.XXXXXX/2026-XX';
    const servidor = dados.nomeServidor ? dados.nomeServidor.toUpperCase() : 'XXXXXXXXXXXXXXXXXXXX';
    const siape = dados.siape || 'XXXXXXX';
    const cargo = dados.cargo || 'XXXXXXXXXXXXXXX';
    const lotacao = dados.lotacao || 'XXXXXXXXXXX';
    const nivelRomano = dados.nivelRscRomano || 'V';
    const pontuacao = dados.pontuacaoObtida || '0.0';
    
    // Tratamento dinâmico para Reitoria vs Campus
    const comissaoNome = dados.campusCRSC || 'Passo Fundo';
    const textoCRSC = comissaoNome.toLowerCase() === 'reitoria' 
        ? 'CRSC Reitoria' 
        : `CRSC Campus ${comissaoNome}`;

    const dataVigencia = dados.dataVigencia || dados.dataRequerimento || dataHojeFormatada;

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
                <td>${nivelRomano}</td>
            </tr>
            <tr>
                <td class="label">PONTUAÇÃO TOTAL:</td>
                <td>${pontuacao}</td>
            </tr>
        </table>

        <div class="assunto">
            ASSUNTO: Análise de conformidade legal e documental — RSC-PCCTAE.
        </div>

        <h3 class="secao">1. RELATÓRIO</h3>
        <p>
            Trata-se de processo administrativo de solicitação de concessão de Reconhecimento de Saberes e Competências (RSC-PCCTAE), encaminhado pela <strong>${textoCRSC}</strong>, com decisão favorável ao deferimento do nível ${nivelRomano} ao(à) servidor(a) supracitado(a), com pontuação homologada de ${pontuacao} pontos.
        </p>

        <h3 class="secao">2. ANÁLISE DE CONFORMIDADE</h3>
        <p>
            O SEACAR procedeu à conferência instrucional do processo à luz da Lei nº 11.091/2005, do Decreto nº 13.048/2026 e da Portaria nº 4725/GR/UFFS/2026, e à conferência cadastral dos dados funcionais do(a) servidor(a) frente à base oficial de servidores da UFFS.
        </p>
        <div class="subitem">
            2.1. O(A) servidor(a) matrícula SIAPE ${siape} foi localizado(a) na base oficial.
        </div>
        <div class="subitem">
            2.2. Os dados de nome, cargo e lotação informados no processo são idênticos aos constantes na base oficial da UFFS.
        </div>

        <h3 class="secao">3. CONCLUSÃO</h3>
        <p>
            Em face do exposto, o SEACAR conclui pela CONFORMIDADE LEGAL e CADASTRAL do processo em epígrafe, atestando estarem satisfeitos os requisitos do art. 13 do Decreto nº 13.048/2026 e do art. 20 da Portaria nº 4725/GR/UFFS/2026, e que os dados informados coincidem com o cadastro funcional oficial da UFFS.
        </p>
        <p>
            Sugere-se o encaminhamento à Divisão de Avaliação e Carreira (DAC) e à Diretoria de Desenvolvimento de Pessoal (DDP) para os atos subsequentes e, na sequência, à Pró-Reitoria de Gestão de Pessoas (PROGESP) para expedição da respectiva Portaria de Concessão do RSC-PCCTAE Nível ${nivelRomano}, com efeitos financeiros a contar de ${dataVigencia}, nos termos do Decreto nº 13.048/2026.
        </p>

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
    link.download = `Parecer_SEACAR_${processo.replace(/[\/\.]/g, '_')}.html`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

window.gerarParecerSEACAR = gerarParecerSEACAR;
