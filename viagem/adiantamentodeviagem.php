<?php
date_default_timezone_set('America/Sao_Paulo');
session_start();
include "./conecta.php";
header("Content-type: text/html; charset=utf-8");
$usuariof = $_SESSION['usuario'];
$matricula1 = $_SESSION['matricula'];
$tipo = $_SESSION['tipo'];
$tipo_enquete = $_SESSION['tipo_enquete'];
$data = date('Y-m-d H:i:s');
$hojeformato = date('d/m/Y H:i:s');

if ($usuariof == null) {
    echo "<script language='javascript' type='text/javascript'>alert('Você deve logar para ter acesso');window.location=\"index.php\"</script>";
}
// Query para selecionar os nomes dos usuários
$sql_nomes = "SELECT DISTINCT
                       nome 
                  FROM bdviagem.tbsolviagem 
                WHERE aceite_do_diretor = '1'";
$resultado_nomes = mysqli_query($conexao, $sql_nomes) or die(mysqli_error($conexao));

// Inicialização dos filtros com valores padrão
$dataInicial = date('Y-m-d', strtotime('-30 days')); // Data inicial é 7 dias antes
// $dataFinal = date('Y-m-d'); // Data final é o dia de hoje
$statusViagem = '';
$nomeSelecionado = '';

// Verifica se os filtros foram enviados via POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Captura e limpa os valores dos filtros
    $dataInicial = isset($_POST["dataInicial"]) ? $_POST["dataInicial"] : '';
    $dataFinal = isset($_POST["dataFinal"]) ? $_POST["dataFinal"] : '';
    $statusViagem = isset($_POST["aceite_do_diretor"]) ? $_POST["aceite_do_diretor"] : '';
    $nomeSelecionado = isset($_POST["nomeSelecionado"]) ? $_POST["nomeSelecionado"] : '';
}

// Query para obter os nomes disponíveis no banco de dados
$queryNomes = "SELECT DISTINCT nome FROM bdviagem.tbsolviagem ORDER BY nome";
$resultadoNomes = mysqli_query($conexao, $queryNomes) or die(mysqli_error($conexao));

$nomes = array();
while ($rowNome = mysqli_fetch_array($resultadoNomes)) {
    $nomes[] = $rowNome['nome'];
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <meta name="description" content="FFA" />
    <meta name="author" content="FFA" />
    <title>Histórico de Aprovados</title>
    <link rel="icon" type="image/png" href="./src/images/favicon.png" />
    <link href="https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css" rel="stylesheet" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
    <link href="https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css" rel="stylesheet" />
    <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.13.1/css/jquery.dataTables.css">
    <link href="./src/css/styles.css" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
    <script src="https://use.fontawesome.com/releases/v6.1.0/js/all.js" crossorigin="anonymous"></script>
    <script type="text/javascript" src='https://code.jquery.com/jquery-3.5.1.js'></script>
    <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.13.1/js/jquery.dataTables.js"></script>
    <script src="https://cdn.datatables.net/plug-ins/1.13.4/sorting/date-eu.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous"></script>
    <script src="./src/js/scripts.js"></script>
    <script>
        window.jQuery || document.write('<script src="src/vendor/jquery/jquery.min.js"><\/script>')
    </script>

    <style>
        /* Estilo para ajustar o tamanho e espaçamento das células */
        .table td,
        .table th {
            padding: 12px;
            /* Espaçamento interno das células */
            text-align: center;
            /* Centraliza o conteúdo */
        }

        .nome {
            /* Ajuste de largura manual para cada coluna */
            width: 25vw;
            /* Exemplo de largura para a coluna Nome */
        }

        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }

        .highlight-red {
            background-color: #ff7b5a;
            color: black;
            /* Opcional: para garantir que o texto fique visível sobre o fundo vermelho */
        }
    </style>

</head>

<body class="sb-nav-fixed">
    <!-- Nav -->
    <?php include "./menu.php"; ?>
    <div id="layoutSidenav_content">
        <main style="width: 100%;" class="mb-2">
            <div class="container-fluid px-4 col-sm-12">
                <h1 class="h1 pt-3 pb-2 col-12 text-center">Aprovados pelo Diretor</h1>

                <!-- Formulário de Filtros -->
                <form method="post" action="<?php echo $_SERVER['PHP_SELF']; ?>" class="mb-3">
                    <div class="row">
                        <div class="col-md-3">
                            <label for="nomeSelecionado" class="form-label">Selecione o Nome:</label>
                            <select id="nomeSelecionado" name="nomeSelecionado" class="form-select">
                                <option value="">Todos</option>
                                <?php
                                foreach ($nomes as $nome) {
                                    $selected = ($nome == $nomeSelecionado) ? 'selected' : '';
                                    echo "<option value='$nome' $selected>$nome</option>";
                                }
                                ?>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label for="dataInicial" class="form-label">Data Inicial:</label>
                            <input type="date" id="dataInicial" name="dataInicial" class="form-control" value="<?php echo $dataInicial; ?>">
                        </div>
                        <div class="col-md-2">
                            <label for="dataFinal" class="form-label">Data Final:</label>
                            <input type="date" id="dataFinal" name="dataFinal" class="form-control" value="<?php echo $dataFinal; ?>">
                        </div>
                        <div>
                            <button type="submit" class="btn btn-sm btn-primary mt-3">Filtrar</button>
                        </div>
                        <div class="form-group col-md-2">
                            <label for="exampleInputEmail1"><b style="color: white">.</b></label>
                            <button class="form-control form-control-md btn-sm btn-success" onclick="baixarExcel()">Baixar Excel</button>
                        </div>
                    </div>
                </form>

                <div class='mt-2 col-13 m-auto'>
                    <table id='tabela1' class='table' style="font-size: 13px;">
                        <thead>
                            <tr class='text-center'>
                                <th class="nome">Nome</th>
                                <th class="ida">Data de Solicitação</th>
                                <th class="ida">Ida</th>
                                <th class="volta">Volta</th>
                                <th class="origem">Origem</th>
                                <th class="destino">Destino</th>
                                <th class="acao">Detalhes</th>
                                <th class="concluir">Concluir</th>

                            </tr>
                        </thead>
                        <tbody>
                            <?php
                            // Monta a query base
                             $sql = "SELECT sv.idtbsolviagem,
                                            sv.nome,
    DATE_FORMAT(sv.datasol, '%d/%m/%Y %H:%i:%s') AS datasol,
    DATE_FORMAT(sv.dataini, '%d/%m/%Y') AS dataini,
    DATE_FORMAT(sv.datafim, '%d/%m/%Y') AS datafim,
    CONCAT(f.nome) AS origem,
    CONCAT(f_destino.nome) AS destino,
    sv.hospedagem,
    sv.idsolicitante,
    sv.passagem_ida,
    sv.valor_ida,
    sv.nr_reserva_ida,
    sv.embarque_ida,
    sv.horario_voo_ida,
    sv.desembarque_ida,
    sv.nr_reserva_volta,
    sv.embarque_volta,
    sv.horario_voo_volta,
    sv.desembarque_volta,
    sv.nome_hotel,
    a.descricao AS motivo,
    sv.endereco_hotel,
    sv.img_passagem_ida,
    sv.img_passagem_volta,
    sv.valor_passagem_volta,
    sv.valor_diaria,
    sv.passagem_volta,
    sv.aceite_do_diretor,
    sv.adiantamento,
    sv.valor_adiantamento,
    sv.adiantamento_finalizado,
    sv.nome_sol,
    sv.motivo_obs,
    sv.tipo_pix,
    sv.chave_pix,
    sv.cargo_sol,
    CONCAT(sv.idempresa_ida, ' - ', e.nome_empresa) AS empresa_ida,
    CONCAT(sv.idempresa_volta, ' - ', e.nome_empresa) AS empresa_volta,
    CONCAT(h.nome_hotel, '-', h.endereco_hotel, '-', h.cidade_hotel) AS hotel,
    CONCAT(embarque_ida.nome_do_aeroporto, '-', embarque_ida.cidade) AS embarque_ida,
    CONCAT(desembarque_ida.nome_do_aeroporto, '-', desembarque_ida.cidade) AS desembarque_ida,
    CONCAT(embarque_volta.nome_do_aeroporto, '-', embarque_volta.cidade) AS embarque_volta,
    CONCAT(desembarque_volta.nome_do_aeroporto, '-', desembarque_volta.cidade) AS desembarque_volta,
    sv.matsolicitante,
    s.idtbsupervisor,
    s.nome AS nome_supervisor,
    s.matricula AS matricula_supervisor,
    c.idtbcoordenador,
    c.nome AS nome_coordenador,
    c.matricula AS matricula_coordenador,
    g.idtbgerente,
    g.nome AS nome_gerente,
    g.matricula AS matricula_gerente,
    d.idtbdiretor,
    d.nome AS nome_diretor,
    d.matricula AS matricula_diretor
FROM bdviagem.tbsolviagem sv
LEFT JOIN bdviagem.tbauxlocalidade f ON sv.idfilial_origem = f.idlocalidade  -- Correção aqui
LEFT JOIN bdviagem.tbauxlocalidade f_destino ON sv.idfilial_destino = f_destino.idlocalidade  -- Corrigido aqui
LEFT JOIN bdviagem.tbmotivo a ON sv.idmotivo = a.idtbmotivo
LEFT JOIN bdviagem.tbempresas e ON sv.idempresa_ida = e.id_empresa
LEFT JOIN bdviagem.tbhoteis h ON sv.idhotel = h.idhotel
LEFT JOIN bdviagem.tblocalviagem AS embarque_ida ON sv.idembarque_ida = embarque_ida.idlocal_viagem
LEFT JOIN bdviagem.tblocalviagem AS desembarque_ida ON sv.iddesembarque_ida = desembarque_ida.idlocal_viagem
LEFT JOIN bdviagem.tblocalviagem AS embarque_volta ON sv.idembarque_volta = embarque_volta.idlocal_viagem
LEFT JOIN bdviagem.tblocalviagem AS desembarque_volta ON sv.iddesembarque_volta = desembarque_volta.idlocal_viagem
LEFT JOIN bdcorp.tbsupervisor s ON sv.matsolicitante = s.matricula
LEFT JOIN bdcorp.tbcoord c ON s.idtbcoordenador = c.idtbcoordenador
LEFT JOIN bdcorp.tbgerente g ON c.idtbgerente = g.idtbgerente OR sv.matsolicitante = g.matricula
LEFT JOIN bdcorp.tbdiretor d ON d.idtbdiretor = g.idtbdiretor
                                        WHERE sv.aceite_do_diretor IN (3, 4)
                                        AND sv.adiantamento = '1'
                                        AND sv.adiantamento_finalizado IS NULL";
                            if (!empty($nomeSelecionado)) {
                                $sql .= " AND sv.nome = '" . mysqli_real_escape_string($conexao, $nomeSelecionado) . "'";
                            }
                            if (!empty($dataInicial)) {
                                $sql .= " AND sv.dataini >= '" . mysqli_real_escape_string($conexao, $dataInicial) . "'";
                            }
                            if (!empty($dataFinal)) {
                                $sql .= " AND sv.datafim <= '" . mysqli_real_escape_string($conexao, $dataFinal) . "'";
                            }
                            if ($statusViagem !== '') {
                                $sql .= " AND sv.aceite_do_diretor = '" . mysqli_real_escape_string($conexao, $statusViagem) . "'";
                            }
                            $sql .= " ORDER BY sv.datasol DESC";

                            $resultado = mysqli_query($conexao, $sql) or die(mysqli_error($conexao));

                            while ($row = mysqli_fetch_array($resultado, MYSQLI_BOTH)) {
                                $id = $row['idtbsolviagem'];
                                $nome = $row['nome'];
                                $datasol = $row['datasol'];
                                $dataini = $row['dataini'];
                                $datafim = $row['datafim'];
                                $origem = $row['origem'];
                                $destino = $row['destino'];
                                $nome_sol = $row['nome_sol'];
                                $cargo_sol = $row['cargo_sol'];

                                $adiantamento = $row['adiantamento'];
                                if ($adiantamento == 0) {
                                    $adiantamento_option = 'Não';
                                } elseif ($adiantamento == 1) {
                                    $adiantamento_option = 'Sim';
                                }

                                $valor_adiantamento = $row['valor_adiantamento'];
                                $adiantamento_finalizado = $row['adiantamento_finalizado'];
                                if ($alimentacao_finalizada == NULL) {
                                    $option_adiantamento_finalizado = 'Em Andamento';
                                } elseif ($alimentacao_finalizada == 1) {
                                    $option_adiantamento_finalizado = 'Concluido';
                                }
                                $alimentacao = $row['alimentacao'];
                                if ($alimentacao == 0) {
                                    $option_alimentacao = 'Não';
                                } elseif ($alimentacao == 1) {
                                    $option_alimentacao = 'Sim, Almoço';
                                } elseif ($alimentacao == 2) {
                                    $option_alimentacao = 'Sim, Almoço e Janta';
                                } elseif ($alimentacao == 3) {
                                    $option_alimentacao = 'Sim, Janta';
                                }

                                $tipo_pix = $row['tipo_pix'];
                                if ($tipo_pix == 1) {
                                    $option_pix = 'CPF';
                                } elseif ($tipo_pix == 2) {
                                    $option_pix = 'CNPJ';
                                } elseif ($tipo_pix == 3) {
                                    $option_pix = 'Email';
                                } elseif ($tipo_pix == 4) {
                                    $option_pix = 'Telefone';
                                } elseif ($tipo_pix == 5) {
                                    $option_pix = 'Chave Aleatória';
                                }
                                $chave_pix = $row['chave_pix'];


                                $currentDate = new DateTime();
                                $dateInicio = DateTime::createFromFormat('d/m/Y', $dataini);

                                // Calcular a diferença em dias
                                $interval = $currentDate->diff($dateInicio);
                                $daysDiff = $interval->days;

                                // Verificar se a data de início é hoje ou nos próximos 2 dias
                                $highlightClass = ($daysDiff <= 2 && $dateInicio->format('Y-m-d') >= $currentDate->format('Y-m-d')) ? 'highlight-red' : '';

                                // Exibição dos dados na tabela
                                echo "<tr class='$highlightClass'>
                                        <td>$nome</td>
                                        <td>$datasol</td>
                                        <td>$dataini</td>
                                        <td>$datafim</td>
                                        <td>$origem</td>
                                        <td>$destino</td>
                                        <td><button type='button' class='btn btn-sm btn-primary' data-bs-toggle='modal' data-bs-target='#modalDetalhes$id'>Detalhes</button></td>
                                        <td><button type='button' class='btn btn-sm btn-primary' data-bs-toggle='modal' data-bs-target='#modalConcluido$id'>Concluir</button></td>
                                        </tr>";
                                // Modal de detalhes da viagem
                                echo "
                  <div class='modal fade' id='modalDetalhes$id' tabindex='-1' aria-labelledby='exampleModalLabel' aria-hidden='true' enctype='multipart/form-data'>
                     <div class='modal-dialog modal-dialog-centered'>
                        <div class='modal-content'>
                          <div class='modal-header'>
                          <h5 class='modal-title' id='modalDetalhesLabel$id'>Detalhes da Viagem</h5>
                          <button type='button' class='btn-sm btn-close' data-bs-dismiss='modal' aria-label='Fechar'></button>
                          </div>
                          <div class='modal-body' style='font-size: 13px;'>
                              <p><strong>Nome:</strong> $nome</p>
                              <p><strong>Data de Ida:</strong> $dataini</p>
                              <p><strong>Data de Volta:</strong> $datafim</p>
                              <p><strong>Origem:</strong> $origem</p>
                              <p><strong>Destino:</strong> $destino</p>
                              <p><strong>Adiantamento:</strong> $adiantamento_option</p>
                              <p><strong>Valor do Adiantamento:</strong> R$$valor_adiantamento</p>
                              <p><strong>Tipo de Pix:</strong> $option_pix</p>
                              <p><strong>Pix: </strong> $chave_pix</p>
                              <hr>
                              <h6>Detalhes da Viagem:</h6>
                              <p><strong>Nome do Solicitante:</strong> $nome_sol</p>
                              <p><strong>Cargo do Solicitante: </strong> $cargo_sol</p>
                              
                          </div>
                        <div class='modal-footer'>
                            <button type='button' class='btn btn-secondary' data-bs-dismiss='modal'>Fechar</button>
                        </div>
                      </div>
                    </div>
                  </div>";


                  echo "
                  <div class='modal fade' id='modalConcluido$id' tabindex='-1' aria-labelledby='exampleModalLabel' aria-hidden='true' enctype='multipart/form-data'>
                     <div class='modal-dialog modal-dialog-centered'>
                        <div class='modal-content'>
                          <div class='modal-header'>
                          <h5 class='modal-title' id='modalDetalhesLabel$id'>Adiantamento de viagem</h5>
                          <button type='button' class='btn-sm btn-close' data-bs-dismiss='modal' aria-label='Fechar'></button>
                          </div>
                          <div class='modal-body' style='font-size: 13px;'>
                          <h6>Foi concluido o pagamento do adiantamento de viagem?</h6>
                          </div>
                        <div class='modal-footer'>
                       <form method='post' action='./control/adiantamento_finalizado.php'>
                            <input type='hidden' name='idtbsolviagem' value='$id'>
                            <button type='submit' class='btn btn-success' name='adiantamento_finalizado' value='1'>Sim</button>
                        </form>
                            <button type='button' class='btn btn-secondary' data-bs-dismiss='modal'>Fechar</button>
                        </div>
                      </div>
                    </div>
                  </div>";
                            
                            }?>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>
    <!-- Scripts para a funcionalidade de tabelas -->
    <script src="https://cdn.jsdelivr.net/npm/simple-datatables@latest" crossorigin="anonymous"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            new simpleDatatables.DataTable('#tabela1', {
                searchable: true,
                fixedHeight: true
            });
        });
    </script>
</body>

</html>