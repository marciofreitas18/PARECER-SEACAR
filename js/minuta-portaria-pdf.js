/**
 * Modelo de Minuta de Portaria PROGESP
 */
function gerarMinutaPortariaPROGESP(dados) {
    return `
PORTARIA PROGESP/UFFS Nº _____/ DE ${new Date().getFullYear()}

O PRÓ-REITOR DE GESTÃO DE PESSOAS DA UNIVERSIDADE FEDERAL DA FRONTEIRA SUL (UFFS), no uso de suas atribuições legais e considerando o considerando o disposto na Portaria Nº 4184/GR/UFFS/2025, na Lei 11.091/2005, no Decreto 13048/2026 e no Processo nº ${dados.numeroProcesso}, RESOLVE:

Art. 1º CONCEDER o Reconhecimento de Saberes e Competências (RSC-${dados.nivelRsc}) ao(à) servidor(a) ${dados.nomeServidor}, Cargo: ${dados.cargo}, SIAPE nº ${dados.siape}, lotado(a) na ${dados.lotacao}.

Art. 2º Os efeitos financeiros vigoram a partir de [Data de Requerimento/Efeitos].

Art. 3º Esta Portaria entra em vigor na data de sua publicação.

Chapecó-SC, ${new Date().toLocaleDateString('pt-BR')}.

Pró-Reitor de Gestão de Pessoas
UFFS
    `;
}
