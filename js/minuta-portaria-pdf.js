/**
 * Gerador de Minuta de Portaria PROGESP (.doc)
 * Atualizado com o modelo oficial da PROGESP / UFFS (Decreto nº 13.048/2026)
 */
function gerarMinutaPortaria(dados) {
    if (!dados || !dados.nomeServidor) {
        alert("Nenhum dado do processo foi carregado para gerar a Portaria.");
        return;
    }

    // Formatações de Data para o Padrão do Documento
    const anoAtual = new Date().getFullYear();
    const dataHojeExtenso = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    
    // Tratamento de dados extraídos com fallbacks
    const processo = dados.numeroProcesso || '23205.XXXXXX/2026-XX';
    const servidor = dados.nomeServidor ? dados.nomeServidor.toUpperCase() : 'XXXXXXXXXXXXXXXX';
    const siape = dados.siape || 'XXXXXXX';
    const cargo = dados.cargo || 'XXXXXXXXXXX';
    const lotacao = dados.lotacao || 'XXXXXXXXXXXXX';
    const nivelRsc = dados.nivelSolicitado || 'RSC-PCCTAE, Nível V';
    const iqPercentual = dados.iqAtual ? `${dados.iqAtual}%` : '52%';
    const pontuacao = dados.pontuacaoObtida || '0.0';
    const dataVigencia = dados.dataVigencia || dados.dataRequerimento || '23/07/2026';
    const campusCRSC = dados.campusCRSC || 'Passo Fundo';
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
            .texto-concessao { 
                text-indent: 1.25cm; 
                margin-top: 15px;
                margin-bottom: 30px; 
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
            O(A) PRÓ-REITOR(A) DE GESTÃO DE PESSOAS DA UNIVERSIDADE FEDERAL DA FRONTEIRA SUL, no uso de suas atribuições legais e regimentais, com fundamento na Lei nº 11.091, de 12 de janeiro de 2005, no Decreto nº 13.048, de 3 de julho de 2026, e na Portaria nº 4725/GR/UFFS/2026, e considerando a decisão da CRSC Campus ${campusCRSC}, exarada em ${dataDecisaoCRSC}, constante no Processo SIPAC nº ${processo}, resolve:
        </p>

        <p class="texto-concessao">
            Conceder, a partir de <strong>${dataVigencia}</strong>, ao(à) servidor(a) <strong>${servidor}</strong>, matrícula SIAPE nº <strong>${siape}</strong>, ocupante do cargo de <strong>${cargo}</strong>, lotado(a) em <strong>${lotacao}</strong>, o Reconhecimento de Saberes e Competências (<strong>${nivelRsc}</strong>), correspondente a <strong>${iqPercentual}</strong> do valor do vencimento básico, com pontuação homologada de <strong>${pontuacao}</strong> pontos.
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

    // Download do arquivo Word (.doc)
    const blob = new Blob([conteudoDoc], { type: 'application/msword;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    // Nome limpo para o arquivo
    const nomeArquivo = `Portaria_PROGESP_${processo.replace(/[\/\.]/g, '_')}.doc`;
    link.download = nomeArquivo;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Vincula a função ao escopo global do navegador
window.gerarMinutaPortaria = gerarMinutaPortaria;
