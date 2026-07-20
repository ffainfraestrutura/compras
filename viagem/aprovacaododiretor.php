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


if ($usuariof == null) {
    echo "<script language='javascript' type='text/javascript'>alert('Você deve logar para ter acesso');window.location=\"index.php\"</script>";
}

include "./conecta.php";
header("Content-type: text/html; charset=utf-8");

$_6_meses = !isset($_GET['historico_completo']) || $_GET['historico_completo'] != '1';

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
    <link rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
    <!--data tables - css e js-->
    <link href="https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css" rel="stylesheet" />
    <link href="./src/css/styles.css" rel="stylesheet" />
    <script type="text/javascript" src='https://code.jquery.com/jquery-3.5.1.js'></script>
    <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.13.1/css/jquery.dataTables.css">
    <script type="text/javascript" charset="utf8"
        src="https://cdn.datatables.net/1.13.1/js/jquery.dataTables.js"></script>
    <script src="https://cdn.datatables.net/plug-ins/1.13.4/sorting/date-eu.js"></script>
</head>
<style>
    .btn:disabled,
    .btn[disabled] {
        opacity: 0.65;
        cursor: not-allowed;
    }

    .switch {
        position: relative;
        display: inline-block;
        width: 60px;
        height: 34px;
    }

    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
    }

    .slider:before {
        position: absolute;
        content: "";
        height: 26px;
        width: 26px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .4s;
    }

    input:checked+.slider {
        background-color: #2196F3;
    }

    input:focus+.slider {
        box-shadow: 0 0 1px #2196F3;
    }

    input:checked+.slider:before {
        transform: translateX(26px);
    }

    .slider.round {
        border-radius: 34px;
    }

    .slider.round:before {
        border-radius: 50%;
    }

    .switch-container {
        display: flex;
        align-items: center;
        gap: 10px;
        justify-content: flex-end;
        margin-bottom: 15px;
    }

    .switch-label {
        font-size: 14px;
        font-weight: 500;
    }

    .switch-label.active {
        color: #2196F3;
        font-weight: bold;
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
                    <div class="switch-container">
                        <span class="switch-label <?php echo $_6_meses ? 'active' : ''; ?>">60 dias</span>
                        <label class="switch">
                            <input type="checkbox" id="historicoSwitch" <?php echo !$_6_meses ? 'checked' : ''; ?>>
                            <span class="slider round"></span>
                        </label>
                        <span class="switch-label <?php echo !$_6_meses ? 'active' : ''; ?>">Histórico Completo</span>
                    </div>

                    <table id='tabela1' class='table' style="font-size: 13px;">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Centro de Custo</th>
                                <th>Data da ida</th>
                                <th>Volta</th>
                                <th>Adiatamento</th>
                                <th>Valor</th>
                                <th>Mudar Adiantamento</th>
                                <th>Ver Descrição</th>
                                <th>Aceite Diretor</th>
                                <!-- <th>Ação</th> -->
                            </tr>
                        </thead>

                        <tbody>
                            <?php
                            $sql = "WITH usuarios_ativos AS (
                                    SELECT matricula, nome 
                                    FROM bdcorp.tbfuncionario 
                                    WHERE status != 'Ativos'
                                )
                                SELECT 
                                    sv.idtbsolviagem,
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
                                    ua_supervisor.nome AS nome_supervisor,  -- Do CTE
                                    s.matricula AS matricula_supervisor,
                                    c.idtbcoordenador,
                                    ua_coordenador.nome AS nome_coordenador,  -- Do CTE
                                    c.matricula AS matricula_coordenador,
                                    g.idtbgerente,
                                    ua_gerente.nome AS nome_gerente,  -- Do CTE
                                    g.matricula AS matricula_gerente,
                                    d.id,
                                    ua_diretor.nome AS nome_diretor,  -- Do CTE
                                    d.matricula AS matricula_diretor,
                                    sv.matricula_aceite_gerente,
                                    f_gerente.nome AS nome_gerente_aprovador,
                                    sv.observacao_gerente,
                                    sv.data_aceite_obs_gerente,
                                    sv.mat_aceite_diretor,
                                    sv.data_aceite_diretor,
                                    sv.observacao_diretor,
                                    f_diretor.nome AS nome_diretor_aprovador
                                FROM
                                    bdviagem.tbsolviagem sv
                                    LEFT JOIN bdviagem.tbauxlocalidade f ON sv.idfilial_origem = f.idlocalidade
                                    LEFT JOIN bdviagem.tbauxlocalidade f_destino ON sv.idfilial_destino = f_destino.idlocalidade
                                    LEFT JOIN bdviagem.tbmotivo a ON sv.idmotivo = a.idtbmotivo
                                    LEFT JOIN bdviagem.tbempresas e ON sv.idempresa_ida = e.id_empresa
                                    LEFT JOIN bdviagem.tbhoteis h ON sv.idhotel = h.idhotel
                                    LEFT JOIN bdviagem.tblocalviagem AS embarque_ida ON sv.idembarque_ida = embarque_ida.idlocal_viagem
                                    LEFT JOIN bdviagem.tblocalviagem AS desembarque_ida ON sv.iddesembarque_ida = desembarque_ida.idlocal_viagem
                                    LEFT JOIN bdviagem.tblocalviagem AS embarque_volta ON sv.idembarque_volta = embarque_volta.idlocal_viagem
                                    LEFT JOIN bdviagem.tblocalviagem AS desembarque_volta ON sv.iddesembarque_volta = desembarque_volta.idlocal_viagem
                                    
                                    -- Supervisor
                                    LEFT JOIN bdcorp.tbsupervisor s ON sv.matsolicitante = s.matricula
                                    LEFT JOIN usuarios_ativos ua_supervisor ON s.matricula = ua_supervisor.matricula
                                    
                                    -- Coordenador
                                    LEFT JOIN bdcorp.tbcoord c ON s.idtbcoordenador = c.idtbcoordenador
                                    LEFT JOIN usuarios_ativos ua_coordenador ON c.matricula = ua_coordenador.matricula
                                    
                                    -- Gerente
                                    LEFT JOIN bdcorp.tbgerente g ON c.idtbgerente = g.idtbgerente OR sv.matsolicitante = g.matricula
                                    LEFT JOIN usuarios_ativos ua_gerente ON g.matricula = ua_gerente.matricula
                                    
                                    -- Diretor
                                    LEFT JOIN bdcorp.tbdiretor d ON d.id = g.idtbdiretor
                                    LEFT JOIN usuarios_ativos ua_diretor ON d.matricula = ua_diretor.matricula
                                    
                                    -- Aprovadores (mantive da tabela original)
                                    LEFT JOIN bdcorp.tbfuncionario f_gerente ON sv.matricula_aceite_gerente = f_gerente.matricula
                                    LEFT JOIN bdcorp.tbfuncionario f_diretor ON sv.mat_aceite_diretor = f_diretor.matricula  -- Adicionado este JOIN
                                     WHERE sv.aceite_do_diretor = 1
                                       AND sv.aceite_gegeral = 3
                                       AND EXISTS( SELECT 
                                                    1
                                                FROM
                                                    bdcorp.tbcadeia_aprovacao ca
                                                WHERE
                                                    ca.matricula = $matricula1
                                                    AND (sv.departamento = ca.grupo_ccusto 
                                                        OR sv.departamento LIKE CONCAT(ca.grupo_ccusto, ' %')
                                                        OR sv.departamento LIKE CONCAT('% ', ca.grupo_ccusto)))";


                            if ($_6_meses) {
                                $sql .= "AND datasol >= CURDATE() - INTERVAL 2 MONTH ";
                            }

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
                                $nome_sol = $row['nome_sol'];
                                $cargo_sol = $row['cargo_sol'];
                                $receita = $row['receita'];
                                $adiantamentoTexto = $row[''];
                                $ccusto = $row['departamento'];
                                if ($adiantamento == 0) {
                                    $adiantamentoTexto = 'Não';
                                } elseif ($adiantamento == 1) {
                                    $adiantamentoTexto = 'Sim';
                                } else {
                                    $adiantamentoTexto = 'Indefinido';
                                }
                                ;

                                $observacao_gerente = $row['observacao_gerente'];
                                $matricula_aceite_gerente = $row['matricula_aceite_gerente'];
                                $data_aceite_obs_gerente = $row['data_aceite_obs_gerente'];
                                if (!empty($data_aceite_obs_gerente) && $data_aceite_obs_gerente !== '0000-00-00 00:00:00') {
                                    $data_aceite_obs_gerente_formatada = date('d/m/Y H:i:s', strtotime($data_aceite_obs_gerente));
                                } else {
                                    $data_aceite_obs_gerente_formatada = ''; // ou 'Não informado'
                                }

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
                                }
                                ;
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
                                $aceiteDiretor = "<td class='text-center'>
                                                    <button type='button' class='btn btn-sm btn-success' data-bs-toggle='modal' data-bs-target='#modalAceite$id' data-aceite='3'>Sim</button>
                                                    <button type='button' class='btn btn-sm btn-danger' data-bs-toggle='modal' data-bs-target='#modalAceite$id' data-aceite='2'>Não</button>
                                                </td>";
                                print "
                                    <tr>
                                        <td>$nome</td>
                                        <td>$ccusto</td>
                                        <td>$dataini</td>
                                        <td>$datafim</td>
                                        <td>$adiantamentoTexto</td>
                                        <td>R$$valor_adiantamento</td>
                                            $botaoAdiantamento
                                            $botaoDetalhes
                                            $aceiteDiretor
                                    </tr>";
                                echo "
                                    <div class='modal fade' id='modalDetalhes$id' tabindex='-1' aria-labelledby='modalDetalhesLabel$id' aria-hidden='true'>
                                        <div class='modal-dialog modal-dialog-centered modal-lg'>
                                            <div class='modal-content'>
                                                <div class='modal-header'>
                                                    <h5 class='modal-title' id='modalDetalhesLabel$id'>Detalhes da Viagem</h5>
                                                    <button type='button' class='btn-close' data-bs-dismiss='modal' aria-label='Fechar'></button>
                                                </div>
                                                <div class='modal-body' style='font-size: 13px;'>
                                                    <div class='row'>
                                                        <div class='col-md-6'>
                                                            <p><strong>Nome:</strong> $nome</p>
                                                            <p><strong>Data de Ida:</strong> $dataini</p>
                                                            <p><strong>Data de Volta:</strong> $datafim</p>
                                                            <p><strong>Origem:</strong> $origem</p>
                                                            <p><strong>Destino:</strong> $destino</p>
                                                            <p><strong>Motivo da Viagem:</strong> $motivo</p>
                                                        </div>
                                                        <div class='col-md-6'>
                                                            <p><strong>Nome do Solicitante:</strong> $nome_sol</p>
                                                            <p><strong>Adiantamento:</strong> $adiantamento_option</p>
                                                            <p><strong>Valor do Adiantamento:</strong> R$ " . number_format($valor_adiantamento, 2, ',', '.') . "</p>
                                                            <p><strong>Alimentação:</strong> $option_alimentacao</p>
                                                            <p><strong>Receita:</strong> R$ " . number_format($receita, 2, ',', '.') . "</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <hr>
                                                    <h5>Passagem de Ida:</h5>
                                                    <div class='row'>
                                                        <div class='col-md-6'>
                                                            <p><strong>Passagem:</strong> $passagemTextoIda</p>
                                                            <p><strong>Empresa:</strong> $empresa_ida</p>
                                                            <p><strong>N° da Passagem:</strong> $nr_reserva_ida</p>
                                                        </div>
                                                        <div class='col-md-6'>
                                                            <p><strong>Local de Origem:</strong> $embarque_ida</p>
                                                            <p><strong>Horário da Viagem:</strong> $horario_voo_ida</p>
                                                            <p><strong>Local de Destino:</strong> $desembarque_ida</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <hr>
                                                    <h5>Passagem de Volta:</h5>
                                                    <div class='row'>
                                                        <div class='col-md-6'>
                                                            <p><strong>Passagem:</strong> $passagemTextoVolta</p>
                                                            <p><strong>Empresa:</strong> $empresa_volta</p>
                                                            <p><strong>N° da Passagem:</strong> $nr_reserva_volta</p>
                                                        </div>
                                                        <div class='col-md-6'>
                                                            <p><strong>Local de Origem:</strong> $embarque_volta</p>
                                                            <p><strong>Horário da Viagem:</strong> $horario_voo_volta</p>
                                                            <p><strong>Local de Destino:</strong> $desembarque_volta</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <hr>
                                                    <h5>Hotel:</h5>
                                                    <p><strong>Hospedagem:</strong> $hospedagemTexto</p>
                                                    <p><strong>Hotel:</strong> $hotel</p>
                                                    
                                                    <hr>
                                                    <h5>Pagamentos de Viagem:</h5>
                                                    <p><strong>Adiantamento:</strong> $option_adiantamento_finalizado</p>
                                                    <p><strong>Alimentação:</strong> $option_alimentacao_finalizada</p>
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
                                                <form action='./control/modal/processa_Adiantamento.php' method='POST'>
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

                                echo "<div class='modal fade' id='modalAceite$id' tabindex='-1' aria-labelledby='modalAceiteLabel$id' aria-hidden='true'>
                                    <div class='modal-dialog modal-dialog-centered'>
                                        <div class='modal-content'>
                                            <div class='modal-header'>
                                                <h5 class='modal-title' id='modalAceiteLabel$id'>Justificativa do Aceite</h5>
                                                <button type='button' class='btn-close' data-bs-dismiss='modal' aria-label='Fechar'></button>
                                            </div>
                                            <form method='post' action='./control/atualizar_aceite_claro.php'>
                                                <div class='modal-body'>
                                                    <p>Informe a justificativa:</p>
                                                    <textarea name='justificativa' class='form-control' rows='4' required></textarea>
                                                    <input type='hidden' name='idtbsolviagem' value='$id'>
                                                    <input type='hidden' name='matsolicitante' value='$matsolicitante'>
                                                    <input type='hidden' name='nome' value='$nome'>
                                                    <input type='hidden' name='matricula' value='$matricula1'>
                                                    <input type='hidden' name='aceite' id='aceiteInput$id' value=''>
                                                </div>
                                                <div class='modal-footer'>
                                                    <button type='submit' class='btn btn-primary'>Enviar</button>
                                                    <button type='button' class='btn btn-secondary' data-bs-dismiss='modal'>Cancelar</button>
                                                </div>
                                            </form>
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

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"
        crossorigin="anonymous"></script>
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


        $(document).ready(function () {
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

        $(document).ready(function () {
            $('#historicoSwitch').change(function () {
                var historicoCompleto = $(this).is(':checked') ? '1' : '0';
                var url = new URL(window.location.href);
                if (historicoCompleto === '1') {
                    url.searchParams.set('historico_completo', '1');
                } else {
                    url.searchParams.delete('historico_completo');
                }
                window.location.href = url.toString();
            });
        });
    </script>
    <script>
        const modais = document.querySelectorAll('[id^="modalAceite"]');

        modais.forEach(modal => {
            modal.addEventListener('show.bs.modal', function (event) {
                const button = event.relatedTarget; // Botão que abriu o modal
                const aceiteValue = button.getAttribute('data-aceite'); // 2 ou 3
                const inputHidden = modal.querySelector('input[name="aceite"]');
                inputHidden.value = aceiteValue;
            });
        });
    </script>

</body>

</html>