/**
 * Modelo de Geração do Parecer SEACAR
 */
function gerarParecerSEACAR(dados) {
    return `
PARECER Nº _____/SEACAR/PROGESP/UFFS/${new Date().getFullYear()}

PROCESSO Nº: ${dados.numeroProcesso}
INTERESSADO(A): ${dados.nomeServidor}
SIAPE: ${dados.siape}
CARGO: ${dados.cargo}
ASSUNTO: Concessão de Reconhecimento de Saberes e Competências (RSC-${dados.nivelRsc})

1. RELATÓRIO
Trata-se do processo de concessão de RSC-${dados.nivelRsc} do(a) servidor(a) ${dados.nomeServidor}, pertencente ao PCCTAE desta Universidade.

2. ANÁLISE TÉCNICA
Analisando a documentação acostada ao processo, verifica-se que a Comissão Regional de Reconhecimento de Saberes e Competências (CRSC) emitiu parecer favorável (${dados.resultado}) à concessão do nível ${dados.nivelRsc}, atingindo a pontuação total de ${dados.pontuacaoTotal} pontos.

3. CONCLUSÃO
Diante do exposto, o Setor de Acompanhamento da Carreira (SEACAR) ratifica o parecer da CRSC e manifesta-se FAVORAVELMENTE à concessão do RSC-${dados.nivelRsc} ao(à) servidor(a), encaminhando os autos à Pró-Reitoria de Gestão de Pessoas para emissão da respectiva Portaria.

Chapecó-SC, ${new Date().toLocaleDateString('pt-BR')}.

Setor de Acompanhamento da Carreira - SEACAR
PROGESP/UFFS
    `;
}
