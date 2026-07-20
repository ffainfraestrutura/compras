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
$matsolicitante = $_SESSION['matsolicitante'];

include "./conecta.php";
header("Content-type: text/html; charset=utf-8");

if ($usuariof == null) {
    echo "<script language='javascript' type='text/javascript'>alert('Você deve logar para ter acesso');window.location=\"index.php\"</script>";
}
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
<style>
    .btn:disabled,
    .btn[disabled] {
        opacity: 0.65;
        cursor: not-allowed;
    }
</style>

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
                                <th>Data da ida</th>
                                <th>Volta</th>
                                <th>Adiatamento</th>
                                <th>Valor</th>
                                <th>Mudar Adiantamento</th>
                                <th>Ver Descrição</th>
                                <th>Aceite Diretor</th>
                            </tr>
                        </thead>

                        <tbody>
                            <?php
                            $sql = "SELECT sv.idtbsolviagem,
                                           sv.nome,
                               DATE_FORMAT(sv.datasol, '%d/%m/%Y') AS datasol,
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
                                           sv.motivo_obs,
                                           sv.adiantamento,
                                           sv.alimentacao,
                                           sv.valor_adiantamento,
                                           sv.nome_sol,
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
                                 LEFT JOIN bdcorp.tbfilial f ON sv.idfilial_origem = f.idtbfilial
                                 LEFT JOIN bdcorp.tbfilial f_destino ON sv.idfilial_destino = f_destino.idtbfilial
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
                                    WHERE (sv.matsolicitante = '$matricula1' 
                                        OR s.matricula = '$matricula1' 
                                        OR c.matricula = '$matricula1' 
                                       OR (g.matricula = '$matricula1' AND d.idtbdiretor IS NOT NULL) 
                                        OR d.matricula = '$matricula1')
                                       AND sv.aceite_do_diretor = 1";
                                  
                                  //echo $sql;

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
                                $periodo_ida = $row['periodo_ida'];
                                $periodo_volta = $row['periodo_volta'];
                                $adiantamento = $row['adiantamento'];
                                $matsolicitante = $row['matsolicitante'];
                                $nome_sol =  $row['nome_sol'];
                                $cargo_sol = $row['cargo_sol'];
                                $adiantamentoTexto = $row[''];
                                if ($adiantamento == 0) {
                                    $adiantamentoTexto = 'Não';
                                } elseif ($adiantamento == 1) {
                                    $adiantamentoTexto = 'Sim';
                                } else {
                                    $adiantamentoTexto = 'Indefinido';
                                };
                                $alimentacao = $row['alimentacao'];
                                if ($alimentacao == 0) {
                                    $option_alimentacao = 'Não';
                                } elseif ($alimentacao == 1) {
                                    $option_alimentacao = 'Sim, Almoço';
                                } elseif ($alimentacao == 2) {
                                    $option_alimentacao = 'Sim, Almoço e Janta';
                                } elseif ($alimentacao == 3) {
                                    $option_alimentacao = 'Sim, Janta';
                                };
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
                                                <form id='formAceite$id' method='post' action='./control/atualizar_aceite.php'>
                                                    <input type='hidden' name='idtbsolviagem' value='$id'>
                                                    <input type='hidden' name='matsolicitante' value='$matsolicitante'>
                                                    <input type='hidden' name='nome' value='$nome'>
                                                    <button type='button' class='btn btn-sm btn-success' data-bs-toggle='modal' data-bs-target='#modalAceite$id'>Sim</button>
                                                    <button type='submit' class='btn btn-sm btn-danger' name='aceite' value='2'>Não</button>
                                                </form>
                                            </td>";
                                print "
                                    <tr>
                                        <td>$nome</td>
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
                                                    <p><strong>Motivo da Viagem:</strong> $motivo</p>
                                                    <p><strong>Observação Viagem:</strong> $motivo_obs</p>
                                                    <p><strong>Adiantamento:</strong> $adiantamentoTexto</p>
                                                    <p><strong>Valor do Adiantamento:</strong> R$$valor_adiantamento</p>
                                                    <p><strong>Alimetação:</strong> $option_alimentacao</p>
                                                    <p><strong>Solicitado por:</strong> $nome_sol</p>
                                                    <p><strong>Cargo do Solicitante :</strong> $cargo_sol</p>
                                                    <hr>
                                                    <h5>Passagem de Ida:</h5>
                                                    <p><strong>Data de Ida:</strong> $dataini</p>
                                                    <p><strong>Origem:</strong> $origem</p>
                                                    <p><strong>Passagem:</strong> $passagemTextoIda</p>
                                                    <p><strong>Período Ida:</strong> $periodo_ida</p>
                                                    <hr>
                                                    <h5>Passagem de Volta:</h5>
                                                    <p><strong>Data de Volta:</strong> $datafim</p>
                                                    <p><strong>Destino:</strong> $destino</p>
                                                    <p><strong>Passagem:</strong> $passagemTextoVolta</p>
                                                    <p><strong>Período Volta:</strong> $periodo_volta</p>
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
                                 echo "<div class='modal fade' id='modalAceite$id' tabindex='-1' aria-labelledby='modalAceiteLabel$id' aria-hidden='true'>
                                        <div class='modal-dialog modal-dialog-centered'>
                                            <div class='modal-content'>
                                                <div class='modal-header'>
                                                    <h5 class='modal-title' id='modalAceiteLabel$id'>Confirmar Aceite</h5>
                                                    <button type='button' class='btn-close' data-bs-dismiss='modal' aria-label='Fechar'></button>
                                                </div>
                                                <div class='modal-body'>
                                                    <form id='formModalAceite$id'>
                                                        <div class='mb-3'>
                                                            <label for='observacao_diretor$id' class='form-label'>Observação:</label>
                                                            <textarea class='form-control' id='observacao_diretor$id' name='observacao_diretor' rows='3'></textarea>
                                                        </div>
                                                    </form>
                                                </div>
                                                <div class='modal-footer'>
                                                    <button type='button' class='btn btn-secondary' data-bs-dismiss='modal'>Cancelar</button>
                                                    <button type='button' class='btn btn-primary' onclick='submeterAceiteComObservacao(\"$id\")'>Confirmar Aceite</button>
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

    <!-- jQuery (Opcional para Bootstrap 5, mas necessário para DataTables) -->
    <script src="https://code.jquery.com/jquery-3.5.1.js"></script>
    
    <!-- Bootstrap 5 Bundle (inclui Popper.js) -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous"></script>
    
    <!-- Scripts do seu Tema -->
    <script src="./src/js/scripts.js"></script>
    
    <!-- DataTables JS -->
    <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.13.1/js/jquery.dataTables.js"></script>
    <script src="https://cdn.datatables.net/plug-ins/1.13.4/sorting/date-eu.js"></script>
    
    <!-- SEU SCRIPT PERSONALIZADO (AQUI VAI A MÁGICA) -->
    <script>
        // Função que será chamada pelo botão "Confirmar Aceite" do modal
        function submeterAceiteComObservacao(id) {
            // 1. Pega o texto da observação de dentro do modal
            const observacao = document.getElementById('observacao_diretor' + id).value;

            // 2. Encontra o formulário principal daquela linha da tabela
            const formPrincipal = document.getElementById('formAceite' + id);

            // 3. Cria um campo escondido (hidden input) para a observação
            const inputObservacao = document.createElement('input');
            inputObservacao.type = 'hidden';
            inputObservacao.name = 'observacao_diretor';
            inputObservacao.value = observacao;

            // 4. Cria um campo escondido para o aceite com valor '1' (Sim)
            const inputAceite = document.createElement('input');
            inputAceite.type = 'hidden';
            inputAceite.name = 'aceite';
            inputAceite.value = '3';

            // 5. Adiciona os novos campos ao formulário principal
            formPrincipal.appendChild(inputObservacao);
            formPrincipal.appendChild(inputAceite);

            // 6. Envia o formulário
            formPrincipal.submit();
        }

        function formatarMoeda(campo) {
            let valor = campo.value;
            valor = valor.replace(/\D/g, '');
            valor = (valor / 100).toFixed(2) + '';
            valor = valor.replace(".", ",");
            valor = valor.replace(/(\d)(?=(\d{3})+\,)/g, "$1.");
            campo.value = valor;
        }

        $(document).ready(function() {
            $('#tabela1').DataTable({
                order: [[1, 'asc']],
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
    </script>

</body>

</html>