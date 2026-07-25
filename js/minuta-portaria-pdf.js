window.gerarMinutaPortaria = function(dados) {
    const nome = dados.nomeServidor || "NOME DO SERVIDOR";
    const cargo = dados.cargo || "CARGO DO SERVIDOR";
    const siape = dados.siape || "SIAPE";
    const nivel = dados.nivelSolicitado || "RSC-PCCTAE-X";
    const processo = dados.numeroProcesso || "23205.XXXXXX/XXXX-XX";
    const dataExercicio = dados.dataExercicio ? formatarDataBr(dados.dataExercicio) : "XX/XX/XXXX";

    const conteudoDoc = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Minuta de Portaria - RSC</title></head>
        <body style="font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; margin: 3cm 2cm 2cm 3cm;">
            <p style="text-align: center; font-weight: bold;">MINISTÉRIO DA EDUCAÇÃO<br>UNIVERSIDADE FEDERAL DA FRONTEIRA SUL (UFFS)</p>
            <br>
            <p style="text-align: center; font-weight: bold;">PORTARIA Nº XXX/PROGESP/UFFS/2026</p>
            <br>
            <p style="text-align: justify;">O PRÓ-REITOR DE GESTÃO DE PESSOAS DA UNIVERSIDADE FEDERAL DA FRONTEIRA SUL (UFFS), no uso de suas atribuições legais...</p>
            <br>
            <p style="text-align: justify;"><strong>RESOLVE:</strong></p>
            <br>
            <p style="text-align: justify;"><strong>Art. 1º</strong> CONCEDER o Reconhecimento de Saberes e Competências (<strong>${nivel}</strong>) ao(à) servidor(a) <strong>${nome}</strong>, ocupante do cargo de <strong>${cargo}</strong>, Matrícula SIAPE nº <strong>${siape}</strong>, referente ao Processo nº <strong>${processo}</strong>, com efeitos financeiros a contar de <strong>${dataExercicio}</strong>.</p>
            <br>
            <p style="text-align: justify;"><strong>Art. 2º</strong> Esta Portaria entra em vigor na data de sua publicação.</p>
        </body>
        </html>
    `;

    const blob = new Blob(['\ufeff' + conteudoDoc], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Minuta_Portaria_RSC_${siape}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};
