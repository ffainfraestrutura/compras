<?php
date_default_timezone_set('America/Sao_Paulo');
session_start();

$usuariof = $_SESSION['usuario'];
$matricula1 = $_SESSION['matricula'];
$tipo = $_SESSION['tipo'];
$tipo_enquete = $_SESSION['tipo_enquete'];
$data = date('Y-m-d H:i:s');
$hojeformato = date('d/m/Y H:i:s');
$idsolicitante = $_SESSION['idsolicitante'];

if ($usuariof == null) {
    echo "<script language='javascript' type='text/javascript'>alert('Você deve logar para ter acesso');window.location=\"index.php\"</script>";
}

include "./conecta.php";
header("Content-type: text/html; charset=utf-8");
?>

<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, , shrink-to-fit=no" />
    <meta name="description" content="FFA" />
    <meta name="author" content="FFA" />
    <link rel="icon" type="image/png" href="./src/images/favicon.png" />
    <title> Histório de Viagem </title>
    <link href="https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css" rel="stylesheet" />
    <script src="https://use.fontawesome.com/releases/v6.1.0/js/all.js" crossorigin="anonymous"></script>
    <!--link Material Symbols - simbolos do input-->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
    <!--data tables - css e js-->
    <link href="https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css" rel="stylesheet" />
    <link href="./src/css/styles.css" rel="stylesheet" />
    <script type="text/javascript" src='https://code.jquery.com/jquery-3.5.1.js'></script>
    <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.13.1/css/jquery.dataTables.css">
    <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.13.1/js/jquery.dataTables.js"></script>
    <script src="https://cdn.datatables.net/plug-ins/1.13.4/sorting/date-eu.js"></script>

</head>

<body class="sb-nav-fixed">


    <!--nav-->
    <?php include "./menu.php"; ?>

    <div id="layoutSidenav_content">

        <main style="width: 100%;" class="mb-2">

            <div class="container-fluid px-4 col-sm-12">
                <h1 class="h1 pt-3 pb-2 col-12 text-center"> Solicitações de Viagem </h1>
                <div class='mt-2 col-15 m-auto'>

                    <table id='tabela1' class='table' style="font-size: 13px;">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Data de Solicitação</th>
                                <th>Data da ida</th>
                                <th>Volta</th>
                                <th>Adiatamento</th>
                                <th>Valor</th>
                                <th>Adiantamento</th>
                                <th>Ver Descrição</th>
                                <th>Aceite Diretor</th>
                                <!-- <th>Ação</th> -->
                            </tr>
                        </thead>

                        <tbody>
                            <?php
                            $sql = "SELECT 
    sv.idtbsolviagem,
    sv.idfuncionario,
    sv.idsolicitante,
    sv.nome,
    DATE_FORMAT(sv.datasol, '%d/%m/%Y %H:%i:%s') AS datasol,
    DATE_FORMAT(sv.dataini, '%d/%m/%Y') AS dataini,
    DATE_FORMAT(sv.datafim, '%d/%m/%Y') AS datafim,
    CONCAT(f.nome) AS origem,  -- Origem da viagem
    CONCAT(f_destino.nome) AS destino,  -- Destino corrigido
    sv.hospedagem,
    sv.passagem_ida,
    sv.passagem_volta,
    a.descricao AS motivo,
    sv.motivo_obs,
    sv.adiantamento,
    sv.valor_adiantamento,
    sv.aceite_do_diretor,
    g.matricula AS matricula_gerente,  -- Alias para diferenciar
    g.idtbdiretor,
    td.matricula AS matricula_diretor,  -- Alias para diferenciar
    sv.nome_sol,
    sv.cargo_sol
FROM bdviagem.tbsolviagem sv
LEFT JOIN bdviagem.tbauxlocalidade f ON sv.idfilial_origem = f.idlocalidade  -- Correção de origem
LEFT JOIN bdviagem.tbauxlocalidade f_destino ON sv.idfilial_destino = f_destino.idlocalidade  -- Correção do destino
LEFT JOIN bdviagem.tbmotivo a ON sv.idmotivo = a.idtbmotivo
LEFT JOIN bdcorp.tbgerente g ON sv.matsolicitante = g.matricula
LEFT JOIN bdcorp.tbdiretor td ON g.idtbdiretor = td.idtbdiretor
WHERE 
    sv.aceite_do_diretor = 1;  -- Removido aspas finais
";
                            $resultado = mysqli_query($conexao, $sql) or die(mysqli_error($conexao));
                            // adiantamento,valor_adiantamento
                            while ($row = mysqli_fetch_array($resultado, MYSQLI_BOTH)) {
                                $id = $row['idtbsolviagem'];
                                $nome = $row['nome'];
                                $datasol = $row['datasol'];
                                $dataini = $row['dataini'];
                                $datafim = $row['datafim'];
                                $origem = $row['origem'];
                                $destino = $row['destino'];
                                $hospedagem = $row['hospedagem'];
                                $motivo = $row['motivo'];
                                $motivo_obs = $row['motivo_obs'];
                                $nome_sol = $row['nome_sol'];
                                $cargo_sol = $row['cargo_sol'];
                                $adiantamento = $row['adiantamento'];
                                $adiantamentoTexto = $row[''];
                                if($adiantamento == 0){
                                   $adiantamentoTexto = 'Não';
                                }elseif($adiantamento == 1){
                                   $adiantamentoTexto = 'Sim';
                                } else {
                                    $adiantamentoTexto = 'Indefinido';
                                }
                                ;
                                $valor_adiantamento = $row['valor_adiantamento'];
                                $hospedagemTexto = ($hospedagem == 1) ? 'Sim' : 'Não';
                                $passagemTexto = ($passagem == 1) ? 'Sim' : 'Não';
                                $passagem_ida = $row['passagem_ida'];
                                $passagemTextoIda = '';
                                if ($passagem_ida == 0) {
                                    $passagemTextoIda = 'Não';
                                } elseif ($passagem_ida == 1) {
                                    $passagemTextoIda = 'Avião';
                                } elseif ($passagem_ida == 2) {
                                    $passagemTextoIda = 'Ônibus';
                                } else {
                                    $passagemTextoIda = 'Indefinido'; // Caso o valor de $passagem não seja 0, 1 ou 2
                                };
                                $passagem_volta = $row['passagem_volta'];
                                $passagemTextoVolta = '';
                                if ($passagem_volta == 0) {
                                    $passagemTextoVolta = 'Não';
                                } elseif ($passagem_volta == 1) {
                                    $passagemTextoVolta = 'Avião';
                                } elseif ($passagem_volta == 2) {
                                    $passagemTextoVolta = 'Ônibus';
                                } else {
                                    $passagemTextoVolta = 'Indefinido'; // Caso o valor de $passagem não seja 0, 1 ou 2
                                }

                                $pdf = "
                                    <td class='text-center'> 
                                        <form method='post' action='./fpdf/versolicitacao.php' target='_blank'>                    
                                            <button type='submit' title='Visualizar Solicitação' style='border: none; background-color: transparent;'> <span class='material-symbols-outlined'>visibility</span> </button>
                                        </form>
                                    </td>";
                                $botaoDetalhes = "<td class='text-center'> 
                                                    <button type='button' class='btn btn-sm btn-primary' data-bs-toggle='modal' data-bs-target='#modalDetalhes$id'>Detalhes</button></td>";
                                $botaoAdiantamento = ($adiantamento == 0) 
                                                    ? "<td class='text-center'>
                                                            <button type='button' class='btn btn-sm btn-secondary' disabled>Mudar adiantamento</button>
                                                        </td>"
                                                    : "<td class='text-center'>
                                                            <button type='button' class='btn btn-sm btn-secondary' data-bs-toggle='modal' data-bs-target='#modalAdiantamento$id'>Mudar adiantamento</button>
                                                        </td>";
                                $aceiteDiretor = "<td>
                                                    <form method='post' action='./control/atualizar_aceiteTodos.php'>
                                                        <input type='hidden' name='idtbsolviagem' value='$id'>
                                                        <button type='submit' class='btn btn-sm btn-success' name='aceite' value='3'>Sim</button>
                                                        <button type='submit' class='btn btn-sm btn-danger' name='aceite' value='2'>Não</button>
                                                    </form>
                                                </td>";

                                print "
                                    <tr>
                                        <td>$nome</td>
                                        <td>$datasol</td>
                                        <td>$dataini</td>
                                        <td>$datafim</td>
                                        <td>$adiantamentoTexto</td>
                                        <td>R$$valor_adiantamento</td>
                                            $botaoAdiantamento
                                            $botaoDetalhes
                                            $aceiteDiretor
                                    </tr>";

                                echo "<div class='modal fade' id='modalDetalhes$id' tabindex='-1' aria-labelledby='modalDetalhesLabel$id' aria-hidden='true'>
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
                                                    <p><strong>Motivo da Viagem:</strong> $motivo</p>
                                                    <p><strong>Observação Viagem:</strong> $motivo_obs</p>
                                                    <p><strong>Nome do Solicitante:</strong> $nome_sol</p>
                                                    <p><strong>Cargo do Solicitante:</strong> $cargo_sol</p>
                                                    <hr>
                                                    <h5>Passagem de Ida:</h5>
                                                    <p><strong>Passagem:</strong> $passagemTextoIda</p>
                                                    <hr>
                                                    <h5>Passagem de Volta:</h5>
                                                    <p><strong>Passagem:</strong> $passagemTextoVolta</p>
                                                    <hr>
                                                    <h5>Hotel:</h5>
                                                    <p><strong>Hospedagem:</strong> $hospedagemTexto</p>
                                                </div>
                                                <div class='modal-footer'>
                                                    <button type='button' class='btn btn-secondary' data-bs-dismiss='modal'>Fechar</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>";
                                    echo "<div class='modal fade' id='modalAdiantamento$id' tabindex='-1' aria-labelledby='modalAdiantamentoLabel$id' aria-hidden='true'>
                                    <div class='modal-dialog modal-dialog-centered'>
                                        <div class='modal-content'>
                                            <div class='modal-header'>
                                                <h5 class='modal-title' id='modalAdiantamentoLabel$id'>Adiantamento de Viagem:</h5>
                                                <button type='button' class='btn-sm btn-close' data-bs-dismiss='modal' aria-label='Fechar'></button>
                                            </div>
                                            <div class='modal-body' style='font-size: 13px;'>
                                                <form action='./control/modal/processa_AdiantamentoTodos.php' method='POST'>
                                                    <div class='input-group'>
                                                        <span class='input-group-text'>R$</span>
                                                        <input type='text' name='valor_adiantamento' id='valor_adiantamento' class='form-control' placeholder='0,00' value='$valor_adiantamento' onkeyup='formatarMoeda(this)'>
                                                    </div>
                                                    <br>
                                                    <input type='hidden' name='id' value='$id'>
                                                    <div class='modal-footer'>
                                                        <button type='submit' class='btn btn-primary'>Enviar</button>
                                                        <button type='button' class='btn btn-secondary' data-bs-dismiss='modal'>Fechar</button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </div>";                                
                            }
                            ?>
                        </tbody>
                    </table>
                </div>


            </div>
        </main>

        <footer class="py-4 bg-light mt-auto">
            <div class="container-fluid px-4">
                <div class="d-flex align-items-center justify-content-between small">
                    <div class="text-muted">Copyright &copy; FFA Infraestrutura</div>
                </div>
            </div>
        </footer>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous"></script>
    <script src="./src/js/scripts.js"></script>
    <script type='text/javascript' src='/var/www/html/presenca/src/vendor/bootstrap/js/bootstrap.min.js'></script>
    <script>
        window.jQuery || document.write('<script src="src/vendor/jquery/jquery.min.js"><\/script>')
    </script>
    <script type="text/javascript">
        function formatarMoeda(campo) {
            let valor = campo.value;

            // Remove caracteres não numéricos, exceto a vírgula
            valor = valor.replace(/\D/g, '');

            // Adiciona a vírgula no lugar correto
            valor = (valor / 100).toFixed(2) + '';
            valor = valor.replace(".", ",");
            valor = valor.replace(/(\d)(?=(\d{3})+\,)/g, "$1.");

            campo.value = valor;
        }


        $(document).ready(function() {
            $('#tabela1').DataTable({
                order: [
                    [1, 'asc']
                ],

                "language": {
                    "decimal": "",
                    "emptyTable": "Nada para exibir",
                    "info": "Mostrando de _START_ até _END_ de _TOTAL_ registros",
                    "infoEmpty": "Exibindo página 0 de 0 de 0 registros",
                    "infoFiltered": "(filtrado do total de _MAX_ registros)",
                    "infoPostFix": "",
                    "thousands": ",",
                    "lengthMenu": "Exibir _MENU_ registros",
                    "loadingRecords": "Carregando...",
                    "processing": "Processando...",
                    "search": "Buscar:",
                    "zeroRecords": "Nenhum resultado encontrado",
                    "paginate": {
                        "first": "Primeira",
                        "last": "Última",
                        "next": "Próxima",
                        "previous": "Anterior"
                    }
                }
            });
        });
    </script>

</body>

</html>