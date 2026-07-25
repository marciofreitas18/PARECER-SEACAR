<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
    <meta charset='utf-8'>
    <title>Parecer Técnico - Concessão de RSC</title>
</head>
<body style="font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; margin: 3cm 2cm 2cm 3cm;">

    <p style="text-align: center; font-weight: bold;">
        MINISTÉRIO DA EDUCAÇÃO<br>
        UNIVERSIDADE FEDERAL DA FRONTEIRA SUL (UFFS)<br>
        PRÓ-REITORIA DE GESTÃO DE PESSOAS (PROGESP)<br>
        SECRETARIA DE ADMINISTRAÇÃO E CADASTRO DE PESSOAL (SEACAR)
    </p>

    <br>

    <p style="text-align: right; font-weight: bold;">
        PARECER TÉCNICO Nº XXX/SEACAR/PROGESP/2026<br>
        PROCESSO SIPAC Nº: ${processo}<br>
        INTERESSADO(A): ${nome}<br>
        MATRÍCULA SIAPE: ${siape}<br>
        CARGO: ${cargo} | LOTAÇÃO: ${lotacao}
    </p>

    <br>

    <p style="font-weight: bold; text-decoration: underline;">1. RELATÓRIO</p>
    <p style="text-align: justify;">
        Trata-se do exame do processo administrativo em referência, no qual o(a) servidor(a) <strong>${nome}</strong>, ocupante do cargo de <strong>${cargo}</strong>, solicita a concessão do Reconhecimento de Saberes e Competências no nível <strong>${nivel}</strong>, nos termos da Lei nº 11.091, de 12 de janeiro de 2005, e do Decreto nº 13.048, de 3 de julho de 2026.
    </p>
    <p style="text-align: justify;">
        O processo foi instruído com a documentação probatória do(a) servidor(a) e submetido à análise da <strong>${comissaoCRSC}</strong>, a qual exarou parecer favorável à concessão, atribuindo o total de <strong>${pontuacaoObtida} pontos</strong> às atividades e saberes comprovados, fixando a data de vigência do parecer em <strong>${dataVigencia}</strong>.
    </p>

    <br>

    <p style="font-weight: bold; text-decoration: underline;">2. FUNDAMENTAÇÃO E ANÁLISE TÉCNICO-LEGAL</p>
    
    <p style="text-align: justify;">
        <strong>2.1. Do Cumprimento do Requisito de Titulação e Incentivo à Qualificação (IQ):</strong><br>
        O Decreto nº 13.048/2026 estabelece a correlação indispensável entre o nível de Incentivo à Qualificação (IQ) detido pelo servidor técnico-administrativo e o nível de RSC pretendido. Consultados os registros funcionais, verifica-se que o(a) servidor(a) possui o percentual atual de IQ de <strong>${iqAtual}%</strong>.
    </p>
    
    <!-- CONDIÇÃO: Se aprovado na validação de IQ -->
    <p style="text-align: justify;">
        Constata-se que o IQ atual atende aos requisitos mínimos exigidos pelo regramento vigente para o nível <strong>${nivel}</strong>, não havendo impedimento legal quanto ao critério de titulação/escolaridade prévia.
    </p>

    <p style="text-align: justify;">
        <strong>2.2. Da Situação Funcional e Estágio Probatório:</strong><br>
        Em atendimento às vedações expressas no Decreto nº 13.048/2026 e demais regulamentações vigentes, certifica-se que o(a) servidor(a) <strong>não se encontra em estágio probatório</strong> na data da análise deste requerimento.
    </p>

    <p style="text-align: justify;">
        <strong>2.3. Da Data de Exercício e Efeitos Financeiros:</strong><br>
        A data de exercício no cargo efetivo verificada nos sistemas cadastrais é <strong>${dataExercicio}</strong>. 
        Com base no parecer emitido pela <strong>${comissaoCRSC}</strong>, a data de vigência/requerimento para fins de efeitos financeiros resta fixada em <strong>${dataVigencia}</strong>.
    </p>

    <!-- BLOCO ALTERNATIVO CASO HAJA DIVERGÊNCIA NAS DATAS -->
    <!-- 
    <p style="text-align: justify; color: #856404; background-color: #fff3cd; padding: 10px; border: 1px solid #ffeeba;">
        <strong>ATENÇÃO / DIVERGÊNCIA IDENTIFICADA:</strong> Constatou-se divergência entre a data de exercício registrada no sistema (${dataExercicio}) e a data informada no Parecer da CRSC (${dataExercicioComissao}). Em observância à segurança jurídica e à exatidão dos assentamentos funcionais, o processo deverá ser retornado à comissão para adequação e/ou esclarecimentos.
    </p>
    -->

    <br>

    <p style="font-weight: bold; text-decoration: underline;">3. CONCLUSÃO E ENCAMINHAMENTO</p>
    
    <p style="text-align: justify;">
        Diante do exposto, considerando o parecer favorável da <strong>${comissaoCRSC}</strong> e o preenchimento de todos os requisitos técnicos, funcionais e legais estabelecidos na Lei nº 11.091/2005 e no Decreto nº 13.048/2026:
    </p>

    <p style="text-align: justify;">
        <strong>[ X ] OPINA-SE PELO DEFERIMENTO</strong> do pedido, sugerindo-se o encaminhamento dos autos ao Pró-Reitor de Gestão de Pessoas para emissão da respectiva Portaria de concessão do <strong>${nivel}</strong>, com efeitos financeiros a contar de <strong>${dataVigencia}</strong>.
    </p>

    <!-- OPÇÃO DE RETORNO / INDEFERIMENTO (USAR VIA LÓGICA DO JS) -->
    <!-- 
    <p style="text-align: justify;">
        <strong>[   ] OPINA-SE PELA DEVOLUÇÃO À CRSC</strong> para correção/revisão dos dados apontados na seção 2.3 deste parecer.
    </p>
    -->

    <br><br>

    <p style="text-align: center;">
        Chapecó-SC, ${dataAtualExtenso}.
    </p>

    <br><br>

    <p style="text-align: center;">
        __________________________________________<br>
        <strong>Analista / Técnico em Assuntos Educacionais</strong><br>
        SEACAR / PROGESP / UFFS
    </p>

</body>
</html>
