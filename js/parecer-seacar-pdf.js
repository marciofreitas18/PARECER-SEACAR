/**
 * Gerador do Parecer SEACAR em formato HTML para impressão/download
 */
function gerarParecerSEACAR(dados) {
    if (!dados || !dados.nomeServidor) {
        alert("Nenhum dado do processo foi carregado para gerar o Parecer.");
        return;
    }

    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    const conteudoHTML = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Parecer SEACAR - ${dados.numeroProcesso || 'Processo'}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
            h2, h3 { text-align: center; color: #004010; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #004010; padding-bottom: 10px; }
            .campo { margin-bottom: 10px; }
            .label { font-weight: bold; }
            .box-resultado { background-color: #f8f9fa; border: 1px solid #ccc; padding: 15px; margin-top: 20px; border-radius: 5px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <h2>UNIVERSIDADE FEDERAL DA FRONTEIRA SUL - UFFS</h2>
            <h3>SECRETARIA ESPECIAL DE ADMINISTRAÇÃO EM CARREIRA - SEACAR</h3>
            <h4>PARECER TÉCNICO DE ANÁLISE DE RSC</h4>
        </div>

        <div class="campo"><span class="label">Processo nº:</span> ${dados.numeroProcesso || '--'}</div>
        <div class="campo"><span class="label">Servidor(a):</span> ${dados.nomeServidor || '--'}</div>
        <div class="campo"><span class="label">SIAPE:</span> ${dados.siape || '--'}</div>
        <div class="campo"><span class="label">Cargo:</span> ${dados.cargo || '--'}</div>
        <div class="campo"><span class="label">Lotação:</span> ${dados.lotacao || '--'}</div>
        <div class="campo"><span class="label">Nível Solicitado:</span> ${dados.nivelSolicitado || '--'}</div>
        <div class="campo"><span class="label">Incentivo à Qualificação (IQ):</span> ${dados.iqAtual || '0'}%</div>
        <div class="campo"><span class="label">Pontuação Apurada:</span> ${dados.pontuacaoObtida || '0'} pontos</div>

        <div class="box-resultado">
            <h4>RESULTADO DA ANÁLISE SEACAR:</h4>
            <p><strong>Status:</strong> ${dados.resultado || 'ANALISADO'}</p>
            <p><strong>Data da Análise:</strong> ${dataAtual}</p>
        </div>

        <div class="footer">
            <p>Documento gerado automaticamente pelo Assistente RSC SEACAR / PROGESP - UFFS</p>
        </div>
    </body>
    </html>
    `;

    const blob = new Blob([conteudoHTML], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Parecer_SEACAR_${dados.numeroProcesso ? dados.numeroProcesso.replace(/[\/\.]/g, '_') : 'RSC'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Torna a função visível para o app.js
window.gerarParecerSEACAR = gerarParecerSEACAR;
