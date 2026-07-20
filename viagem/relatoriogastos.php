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

// Verifica se o usuário está logado
if ($usuariof == null) {
    echo "<script language='javascript' type='text/javascript'>alert('Você deve logar para ter acesso');window.location=\"index.php\"</script>";
}
// Query para selecionar os nomes dos usuários
$sql_nomes = "SELECT DISTINCT nome 
              FROM bdviagem.tbsolviagem 
              WHERE aceite_do_diretor = '1'";
$resultado_nomes = mysqli_query($conexao, $sql_nomes) or die(mysqli_error($conexao));
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <meta name="description" content="FFA" />
    <meta name="author" content="FFA" />
    <title>Gastos por Adiantamento</title>
    <link rel="icon" type="image/png" href="./src/images/favicon.png" />
    <link href="https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css" rel="stylesheet" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
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
        .table td, .table th {
            padding: 12px; /* Espaçamento interno das células */
            text-align: center; /* Centraliza o conteúdo */
        }
        .nome {
            width: 25vw; /* Largura para a coluna Nome */
        }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        .highlight-red {
            background-color: #ff7b5a;
            color: black; /* Texto visível sobre o fundo vermelho */
        }
    </style>
</head>

<body class="sb-nav-fixed">
    <!-- Nav -->
    <?php include "./menu.php"; ?>
    <div id="layoutSidenav_content">
        <main style="width: 100%;" class="mb-2">
            <div class="container-fluid px-4 col-sm-12">
                <h1 class="h1 pt-3 pb-2 col-12 text-center">Gastos por Adiantamento</h1>
                <div class='mt-2 col-13 m-auto'>
                    <table id='tabela1' class='table' style="font-size: 13px;">
                        <thead>
                            <tr class='text-center'>
                                <th class="nome">Nome</th>
                                <th class="ccusto">Cargo</th>
                                <th class="qt_solicitacoes">Quantidade de Solicitações</th>
                                <th class="origem">Total de Adiantamento</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php
                            // Monta a query base
                            $sql = "SELECT matsolicitante,
                                       nome_sol,
                                       cargo_sol,
                                       COUNT(*) AS quantidade_viagens,
                                       SUM(valor_adiantamento) AS total_adiantamento
                                    FROM bdviagem.tbsolviagem
                                    GROUP BY matsolicitante, nome_sol, cargo_sol";
                            $resultado = mysqli_query($conexao, $sql) or die(mysqli_error($conexao));
                            while ($row = mysqli_fetch_array($resultado, MYSQLI_BOTH)) {
                                $matsolicitante = $row['matsolicitante'];
                                $nome_sol = $row['nome_sol'];
                                $cargo_sol = $row['cargo_sol'];
                                $quantidade_viagens = $row['quantidade_viagens'];
                                $total_adiantamento = $row['total_adiantamento'];

                                // Exibição dos dados na tabela
                                echo "<tr>
                                        <td>$nome_sol</td>
                                        <td>$cargo_sol</td>
                                        <td>$quantidade_viagens</td>
                                        <td>R$$total_adiantamento</td>
                                      </tr>";
                            }
                            ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>

    <!-- Modal para detalhes do solicitante -->
    <div class="modal fade" id="detailsModal" tabindex="-1" aria-labelledby="detailsModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="detailsModalLabel">Detalhes do Solicitante</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body" id="modalContent">
                    <!-- Os detalhes serão carregados aqui -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts para a funcionalidade de tabelas -->
    <script src="https://cdn.jsdelivr.net/npm/simple-datatables@latest" crossorigin="anonymous"></script>
    <script>
        $(document).ready(function() {
            // Inicializa o DataTable
            $('#tabela1').DataTable();

            // Evento de clique em uma linha para carregar detalhes na linha seguinte
            $('#tabela1 tbody').on('click', '.clickable-row', function() {
                var $detailsRow = $(this).next('.details-row');

                // Verifica se os detalhes já estão carregados
                if ($detailsRow.is(':visible')) {
                    $detailsRow.toggle(); // Oculta se já visível
                } else {
                    const matsolicitante = $(this).data('matsolicitante');

                    // AJAX para buscar os detalhes
                    $.ajax({
                        url: 'detalhes_solicitante.php',
                        type: 'POST',
                        data: { matsolicitante: matsolicitante },
                        success: function(response) {
                            $detailsRow.html('<td colspan="4">' + response + '</td>');
                            $detailsRow.toggle(); // Mostra a linha com detalhes
                        },
                        error: function() {
                            $detailsRow.html('<td colspan="4">Erro ao carregar os detalhes.</td>');
                            $detailsRow.toggle(); // Mostra a linha com erro
                        }
                    });
                }
            });
        });
    </script>
</body>
</html>
