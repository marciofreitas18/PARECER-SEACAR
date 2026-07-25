/**
 * Gerador de Minuta de Portaria PROGESP (.doc)
 * Ajustado conforme as normas de Redação Oficial (Artigos em negrito, RESOLVE em destaque)
 */
function gerarMinutaPortaria(dados) {
    if (!dados || !dados.nomeServidor) {
        alert("Nenhum dado do processo foi carregado para gerar a Portaria.");
        return;
    }

    // Tabela de correspondência oficial (Nível RSC -> Percentual do IQ)
    const tabelaRscParaPercentual = {
        'VI': '75%',
        'V': '52%',
        'IV': '30%',
        'III': '25%',
        'II': '20%',
        'I': '15%'
    };

    const nivelRomano = (dados.nivelRscRomano || 'V').toUpperCase();
    const percentualCorreto = tabelaRscParaPercentual[nivelRomano] || '52%';

    const anoAtual = new Date().getFullYear();
    const dataHojeExtenso = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    
    // Tratamento e limpeza de dados
    const processo = dados.numeroProcesso || '23205.XXXXXX/2026-XX';
    const servidor = dados.nomeServidor ? dados.nomeServidor.toUpperCase() : 'XXXXXXXXXXXXXXXX';
    const siape = dados.siape || 'XXXXXXX';
    const cargo = dados.cargo || 'XXXXXXXXXXX';
    const lotacao = dados.lotacao || 'XXXXXXXXXXXXX';
    
    const nivelExtenso = `RSC-PCCTAE, Nível ${nivelRomano}`;
    const pontuacao = dados.pontuacaoObtida || '0,0';
    const dataVigencia = dados.dataVigencia || dados.dataRequerimento || dataHojeExtenso;
    
    // Trata identificação da comissão CRSC
    const comissaoNome = dados.campusCRSC || 'Passo Fundo';
    const textoCRSC = comissaoNome.toLowerCase() === 'reitoria' 
        ? 'CRSC Reitoria' 
        : `CRSC Campus ${comissaoNome}`;

    const dataDecisaoCRSC = dados.dataDecisaoCRSC || dataVigencia;

    const conteudoDoc = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
        <meta charset='utf-8'>
        <title>Portaria PROGESP - RSC</title>
        <style>
            body { 
                font-family: 'Calibri', 'Arial', sans-serif; 
                font-size: 11pt; 
                line-height: 1.5; 
                text-align: justify; 
                margin: 2.5cm;
            }
            .cabecalho-oficial { 
                text-align: center; 
                font-weight: bold; 
                font-size: 10pt; 
                margin-bottom: 25px; 
            }
            .titulo-portaria { 
                text-align: center; 
                font-weight: bold;
                font-size: 11pt;
                margin-top: 20px;
                margin-bottom: 20px; 
            }
            .preambulo { 
                text-indent: 0cm; 
                margin-bottom: 15px; 
            }
            .artigo { 
                text-indent: 1.25cm; 
                margin-top: 10px;
                margin-bottom: 10px; 
            }
            .data-local { 
                margin-top: 40px; 
                margin-bottom: 40px;
                text-align: left; 
            }
            .assinatura { 
                text-align: center; 
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="cabecalho-oficial">
            MINISTÉRIO DA EDUCAÇÃO<br>
            UNIVERSIDADE FEDERAL DA FRONTEIRA SUL<br>
            PRÓ-REITORIA DE GESTÃO DE PESSOAS
        </div>

        <div class="titulo-portaria">
            PORTARIA PROGESP Nº xx/${anoAtual}, DE ${dataHojeExtenso.toUpperCase()}.
        </div>

        <p class="preambulo">
            O(A) PRÓ-REITOR(A) DE GESTÃO DE PESSOAS DA UNIVERSIDADE FEDERAL DA FRONTEIRA SUL, no uso de suas atribuições legais e regimentais, com fundamento na Lei nº 11.091, de 12 de janeiro de 2005, no Decreto nº 13.048, de 3 de julho de 2026, e na Portaria nº 4725/GR/UFFS/2026, e considerando a decisão da ${textoCRSC}, exarada em ${dataDecisaoCRSC}, constante no Processo SIPAC nº ${processo}, <strong>RESOLVE:</strong>
        </p>

        <p class="artigo">
            <strong>Art. 1º</strong> Conceder, a partir de ${dataVigencia}, ao(à) servidor(a) <strong>${servidor}</strong>, matrícula SIAPE nº ${siape}, ocupante do cargo de ${cargo}, lotado(a) em ${lotacao}, o Reconhecimento de Saberes e Competências (<strong>${nivelExtenso}</strong>), correspondente a <strong>${percentualCorreto}</strong> do valor do vencimento básico, com pontuação homologada de ${pontuacao} pontos.
        </p>

        <p class="artigo">
            <strong>Art. 2º</strong> Esta Portaria entra em vigor na data de sua publicação no Boletim Oficial da UFFS.
        </p>

        <p class="data-local">
            Chapecó-SC, ${dataHojeExtenso}.
        </p>

        <div class="assinatura">
            <p>PRÓ-REITOR(A) DE GESTÃO DE PESSOAS<br>
            Universidade Federal da Fronteira Sul</p>
        </div>
    </body>
    </html>
    `;

    // Download do arquivo .doc
    const blob = new Blob([conteudoDoc], { type: 'application/msword;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Portaria_PROGESP_${processo.replace(/[\/\.]/g, '_')}.doc`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

window.gerarMinutaPortaria = gerarMinutaPortaria;
