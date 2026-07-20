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
$_SESSION['perfil'] = $perfil['viagem'];

if ($usuariof == null) {
    echo "<script language='javascript' type='text/javascript'>alert('Você deve logar para ter acesso');window.location=\"index.php\"</script>";
}
// Query para selecionar os nomes dos usuários
$sql_nomes = "SELECT DISTINCT
                      nome 
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
    <title>Histórico de Aprovados</title>
    <link rel="icon" type="image/png" href="./src/images/favicon.png" />
    <link href="https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css" rel="stylesheet" />
    <link href="./src/css/styles.css" rel="stylesheet" />
    <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.13.1/css/jquery.dataTables.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
    <link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />

    <style>
        .table td,
        .table th {
            padding: 12px;
            text-align: center;
        }

        .nome {
            width: 25vw;
        }

        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }

        .highlight-red {
            background-color: #ff7b5a;
            color: black;
        }


        .btn-add-option:hover {
            background-color: #3a5ec0;
            transform: translateY(-1px);
        }

        .select2-container {
            z-index: 999999 !important;
            /* Garante que fique sobre o modal */
        }

        .select2-container--default .select2-selection--single {
            height: 38px;
            border-radius: 4px;
            border: 1px solid #d1d3e2;
        }

        .select2-container--default .select2-selection--single .select2-selection__rendered {
            line-height: 36px;
            padding-left: 12px;
        }

        .select2-container--default .select2-selection--single .select2-selection__arrow {
            height: 36px;
        }

        .select2-container--default.select2-container--focus .select2-selection--single {
            border-color: #bac8f3;
            box-shadow: 0 0 0 0.2rem rgba(78, 115, 223, 0.25);
        }

        .select2-dropdown {
            z-index: 99999 !important;
        }
    </style>

</head>

<body class="sb-nav-fixed">
    <!-- Nav -->
    <?php include "./menu.php"; ?>
    <div id="layoutSidenav_content">
        <main style="width: 100%;" class="mb-2">
            <div class="container-fluid px-4 col-sm-12">
                <h1 class="h1 pt-3 pb-2 col-12 text-center">Aprovados pelo COO/CFO</h1>
                <!-- Formulário de Filtros -->
                <form method="post" action="<?php echo $_SERVER['PHP_SELF']; ?>" class="mb-3">
                    <div class="row">
                        <div class="col-md-4">
                            <label for="nome" class="form-label">Nome:</label>
                            <select id="nome" name="nome" class="form-control">
                                <option value="">Selecione um nome...</option>
                                <?php while ($row = mysqli_fetch_assoc($resultado_nomes)) : ?>
                                    <option value="<?php echo htmlspecialchars($row['nome']); ?>"><?php echo htmlspecialchars($row['nome']); ?></option>
                                <?php endwhile; ?>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label for="dataInicial" class="form-label">Data Inicial:</label>
                            <input type="date" id="dataInicial" name="dataInicial" class="form-control">
                        </div>
                        <div class="col-md-2">
                            <label for="dataFinal" class="form-label">Data Final:</label>
                            <input type="date" id="dataFinal" name="dataFinal" class="form-control">
                        </div>
                        <div>
                            <button type="submit" class="btn btn-sm btn-primary mt-3">Filtrar</button>
                        </div>
                    </div>
                </form>

                <div class='mt-2 col-13 m-auto'>
                    <table id='tabela1' class='table' style="font-size: 13px;">
                        <thead>
                            <tr class='text-center'>
                                <th class="nome">Nome</th>
                                <th class="ida">Ida</th>
                                <th class="volta">Volta</th>
                                <th class="origem">Origem</th>
                                <th class="destino">Destino</th>
                                <th class="hospedagem">Hospedagem</th>
                                <th class="passagem">Ida</th>
                                <th class="passagem">Volta</th>
                                <th class="acao">Detalhes</th>
                                <th class="acao">Editar</th>
                                <th class="acao">Ex. Solicitação</th>
                            </tr>
                        </thead>

                        <tbody>
                            <?php
                            // Monta a query base
                            $sql = "SELECT sv.idtbsolviagem,
                                sv.datasol,
                                sv.nome_sol,
                                sv.cargo_sol,
                                sv.nome,
                                sv.cpf,
                                sv.dtnasc,
                    DATE_FORMAT(sv.dataini, '%d/%m/%Y') AS dataini,
                    DATE_FORMAT(sv.datafim, '%d/%m/%Y') AS datafim,
                         CONCAT(loc_origem.nome) AS origem,
                         CONCAT(loc_destino.nome) AS destino,
                                sv.hospedagem,
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
                                sv.motivo_obs,
                                sv.adiantamento,
                                sv.valor_adiantamento,
                                sv.tipo_pix,
                                sv.chave_pix,
                                sv.endereco_hotel,
                                sv.img_passagem_ida,
                                sv.img_passagem_volta,
                                sv.valor_passagem_volta,
                                sv.valor_diaria,
                                sv.passagem_volta,
                                sv.aceite_do_diretor,
                                sv.data_aceite_diretor,
                                sv.data_aceite_gerente,
                                e.nome_empresa AS empresa_ida,
                                e.nome_empresa AS empresa_volta,
                         CONCAT(h.nome_hotel, '-', h.endereco_hotel, '-', h.cidade_hotel) AS hotel,
                         CONCAT(embarque_ida.nome_do_aeroporto, '-', embarque_ida.cidade) AS embarque_ida,
                         CONCAT(desembarque_ida.nome_do_aeroporto, '-', desembarque_ida.cidade) AS desembarque_ida,
                         CONCAT(embarque_volta.nome_do_aeroporto, '-', embarque_volta.cidade) AS embarque_volta,
                         CONCAT(desembarque_volta.nome_do_aeroporto, '-', desembarque_volta.cidade) AS desembarque_volta,
                                me.idtbmotivo_exclusao,
                                me.motivo_exclusao,
                                sv.hora_aprovacao_coo
                        FROM bdviagem.tbsolviagem sv
                        LEFT JOIN bdviagem.tbauxlocalidade loc_origem ON sv.idfilial_origem = loc_origem.idlocalidade
                        LEFT JOIN bdviagem.tbauxlocalidade loc_destino ON sv.idfilial_destino = loc_destino.idlocalidade
                        INNER JOIN bdviagem.tbmotivo a ON sv.idmotivo = a.idtbmotivo
                        LEFT JOIN bdviagem.tbempresas e ON sv.idempresa_ida = e.id_empresa
                        LEFT JOIN bdviagem.tbhoteis h ON sv.idhotel = h.idhotel
                        LEFT JOIN bdviagem.tblocalviagem AS embarque_ida ON sv.idembarque_ida = embarque_ida.idlocal_viagem
                        LEFT JOIN bdviagem.tblocalviagem AS desembarque_ida ON sv.iddesembarque_ida = desembarque_ida.idlocal_viagem
                        LEFT JOIN bdviagem.tblocalviagem AS embarque_volta ON sv.idembarque_volta = embarque_volta.idlocal_viagem
                        LEFT JOIN bdviagem.tblocalviagem AS desembarque_volta ON sv.iddesembarque_volta = desembarque_volta.idlocal_viagem
                        LEFT JOIN bdviagem.tbmotivo_exclusao me ON sv.idtbsolviagem = me.idtbsolviagem
                        WHERE (
                            (sv.datasol < '2025-06-19' AND sv.aceite_do_diretor = '3')
                            OR
                            (sv.datasol >= '2025-06-19' AND sv.aprovado_coo IS NOT NULL AND sv.aceite_do_diretor = '3')
                            -- OR
                            -- (sv.mat_aceite_diretor = 270907 AND aceite_do_diretor != 4 AND nivel_coo IS NOT NULL)
                        )
                        AND me.idtbsolviagem IS NULL";

                            $resultado = mysqli_query($conexao, $sql) or die(mysqli_error($conexao));

                            while ($row = mysqli_fetch_array($resultado, MYSQLI_BOTH)) {
                                $id = $row['idtbsolviagem'];
                                $datasol = $row['datasol'];
                                $nome_sol = $row['nome_sol'];
                                $nome = $row['nome'];
                                $cpf = $row['cpf'];
                                $dtnasc = $row['dtnasc'];
                                $dtnascFormatada = (new DateTime($dtnasc))->format('d/m/Y ');
                                $cargo_sol = $row['cargo_sol'];
                                $dataini = $row['dataini'];
                                $datafim = $row['datafim'];
                                $origem = $row['origem'];
                                $destino = $row['destino'];
                                $aceite_do_diretor = $row['aceite_do_diretor'];
                                $motivo = $row['motivo'];
                                $motivo_obs = $row['motivo_obs'];

                                $data_aceite_diretor = $row['data_aceite_diretor'];
                                $data_formatadaDiretor = date('d/m/Y H:i:s', strtotime($data_aceite_diretor));
                                $data_aceite_gerente = $row['data_aceite_gerente'] ?? $row['datasol'];
                                $data_formatadaGerente = date('d/m/Y H:i:s', strtotime($data_aceite_gerente));
                                $hora_aprovacao_coo = $row['hora_aprovacao_coo'];
                                $data_formatadacoo = (!empty($hora_aprovacao_coo) && $hora_aprovacao_coo !== '0000-00-00 00:00:00')
                                    ? date('d/m/Y \à\s H:i', strtotime($hora_aprovacao_coo))
                                    : '';
                                $adiantamento = $row['adiantamento'];
                                if ($adiantamento == 0) {
                                    $adiantamento_option = 'Não';
                                } elseif ($adiantamento == 1) {
                                    $adiantamento_option = 'Sim';
                                }
                                $valor_adiantamento = $row['valor_adiantamento'];
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
                                // Passagem Ida
                                $nr_reserva_ida = $row['nr_reserva_ida'];
                                $embarque_ida = $row['embarque_ida'];
                                $horario_voo_ida = $row['horario_voo_ida'];
                                $desembarque_ida = $row['desembarque_ida'];
                                $img_passagem_ida = $row['img_passagem_ida'];
                                $idempresa_ida = $row['idempresa_ida'];
                                $empresa_ida = $row['empresa_ida'];
                                $nome_empresa = $row['nome_empresa'];
                                $valor_ida = $row['valor_ida'];
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

                                // Passagem Volta
                                $idempresa_volta = $row['idempresa_volta'];
                                $nr_reserva_volta = $row['nr_reserva_volta'];
                                $embarque_volta = $row['embarque_volta'];
                                $horario_voo_volta = $row['horario_voo_volta'];
                                $desembarque_volta = $row['desembarque_volta'];
                                $img_passagem_volta = $row['img_passagem_volta'];
                                $valor_passagem_volta = $row['valor_passagem_volta'];
                                $passagem_volta = $row['passagem_volta'];
                                $empresa_volta = $row['empresa_volta'];
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

                                // Informações do Hotel
                                $hospedagem = $row['hospedagem'];
                                $hospedagemTexto = ($hospedagem == 1) ? 'Sim' : 'Não';
                                $nome_hotel = $row['nome_hotel'];
                                $hotel = $row['hotel'];
                                $endereco_hotel = $row['endereco_hotel'];
                                $valor_diaria = $row['valor_diaria'];

                                $currentDate = new DateTime();
                                $dateInicio = DateTime::createFromFormat('d/m/Y', $dataini);

                                // Calcular a diferença em dias
                                $interval = $currentDate->diff($dateInicio);
                                $daysDiff = $interval->days;

                                // Verificar se a data de início é hoje ou nos próximos 2 dias
                                $highlightClass = ($daysDiff <= 2 && $dateInicio->format('Y-m-d') >= $currentDate->format('Y-m-d')) ? 'highlight-red' : '';
                            ?>
                                <tr class='<?php echo $highlightClass; ?>'>
                                    <td><?php echo $nome; ?></td>
                                    <td><?php echo $dataini; ?></td>
                                    <td><?php echo $datafim; ?></td>
                                    <td><?php echo $origem; ?></td>
                                    <td><?php echo $destino; ?></td>
                                    <td><?php echo $hospedagemTexto; ?></td>
                                    <td><?php echo $passagemTextoIda; ?></td>
                                    <td><?php echo $passagemTextoVolta; ?></td>
                                    <td><button type='button' class='btn btn-sm btn-primary' data-bs-toggle='modal' data-bs-target='#modalDetalhes<?php echo $id; ?>'>Detalhes</button></td>
                                    <td><button type='button' class='btn btn-sm btn-primary' data-bs-toggle='modal' data-bs-target='#modalConcluir<?php echo $id; ?>'>Editar</button></td>
                                    <td><button type='button' class='btn btn-sm btn-danger' data-bs-toggle='modal' data-bs-target='#modalExcluir<?php echo $id; ?>'>Excluir</button></td>
                                </tr>
                            <?php


                                /* Modal pra ver os detalhes da Viagem */
                                include "./modal/detalhes_viagem.php";
                                /* Modal pra finalizar a viagem */
                                include "./modal/finalizar_viagem.php";
                                /* Modal pra excluir a viagem mas ele não exclui do banco */
                                include "./modal/excluir_registro.php";
                                /* Modal pra cadastrar a empresa da passagem */
                                include "./modal/cadastro_empresa.php";
                                /* Modal pra cadastrar o Local de Embarque e Desembarque da passagem */
                                include "./modal/cadastro_embarque.php";
                                /* Modal pra cadastrar a hospedagem da viagem */
                                include "./modal/cadastro_hotel.php";
                            }
                            ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>
    <script type="text/javascript" src='https://code.jquery.com/jquery-3.5.1.js'></script>
    <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.13.1/js/jquery.dataTables.js"></script>
    <script src="https://cdn.datatables.net/plug-ins/1.13.4/sorting/date-eu.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous"></script>
    <script src="./src/js/scripts.js"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>

    <script>
        $(document).ready(function() {
            // Detecta a abertura de QUALQUER modal cujo ID comece com 'modalConcluir'
            $(document).on('shown.bs.modal', '[id^="modalConcluir"]', function() {
                const $modal = $(this);
                // Inicializa todos os selects com Select2 dentro deste modal específico
                $modal.find('select.select2').each(function() {
                    if (!$(this).hasClass("select2-hidden-accessible")) {
                        $(this).select2({
                            dropdownParent: $modal.find('.modal-content'),
                            width: '100%'
                        });
                    }
                });
            });
        });
    </script>
</body>

</html>