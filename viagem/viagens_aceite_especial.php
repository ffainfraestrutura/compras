<?php
date_default_timezone_set('America/Sao_Paulo');
session_start();

$usuariof = $_SESSION['usuario'] ?? null;
$matricula1 = $_SESSION['matricula'] ?? null;

include "./conecta.php";
header("Content-type: text/html; charset=utf-8");

$matriculasPermitidas = ['620027', '601003'];
if ($usuariof == null) {
    echo "<script>alert('Você deve logar para ter acesso');window.location='index.php'</script>";
    exit;
}

if (!in_array((string) $matricula1, $matriculasPermitidas, true) && !in_array((string) $usuariof, $matriculasPermitidas, true)) {
    echo "<script>alert('Você não tem permissão para essa tela.');window.location='index.php'</script>";
    exit;
}

$mensagem = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['acao'], $_POST['idtbsolviagem'])) {
    $acao = $_POST['acao'];
    $id = (int) $_POST['idtbsolviagem'];
    $dataAgora = date('Y-m-d H:i:s');

    if ($id > 0 && ($acao === 'aprovar' || $acao === 'negar')) {
        if ($acao === 'aprovar') {
            $aceiteDiretor = 3;
            $aceiteCoo = 1;
            $aceiteGeral = 3;
            $obsGerente = 'Aprovado automaticamente via tela especial de viagens. (' . $matricula1 . ')';
            $obsDiretor = 'Aprovado automaticamente via tela especial de viagens. (' . $matricula1 . ')';
        } else {
            $aceiteDiretor = 2;
            $aceiteCoo = 0;
            $aceiteGeral = 2;
            $obsGerente = 'Negado automaticamente via tela especial de viagens. (' . $matricula1 . ')';
            $obsDiretor = 'Negado automaticamente via tela especial de viagens. (' . $matricula1 . ')';
        }

        $sqlUpdate = "UPDATE bdviagem.tbsolviagem
                        SET aceite_do_diretor = ?,
                            data_aceite_diretor = ?,
                            mat_aceite_diretor = ?,
                            observacao_diretor = ?,
                            matricula_aceite_gerente = ?,
                            data_aceite_gerente = ?,
                            observacao_gerente = ?,
                            data_aceite_obs_gerente = ?,
                            aceite_gegeral = ?,
                            nivel_coo = '2',
                            aprovado_coo = ?,
                            hora_aprovacao_coo = ?
                        WHERE idtbsolviagem = ?";

        $stmt = mysqli_prepare($conexao, $sqlUpdate);
        if ($stmt) {
            mysqli_stmt_bind_param(
                $stmt,
                "isssssssissi",
                $aceiteDiretor,
                $dataAgora,
                $matricula1,
                $obsDiretor,
                $matricula1,
                $dataAgora,
                $obsGerente,
                $dataAgora,
                $aceiteGeral,
                $aceiteCoo,
                $dataAgora,
                $id
            );

            if (mysqli_stmt_execute($stmt)) {
                $mensagem = ($acao === 'aprovar')
                    ? 'Solicitação aprovada e todos os requisitos necessários foram preenchidos.'
                    : 'Solicitação negada e todos os requisitos necessários foram preenchidos.';
            } else {
                $mensagem = 'Erro ao atualizar solicitação: ' . mysqli_error($conexao);
            }
            mysqli_stmt_close($stmt);
        } else {
            $mensagem = 'Erro ao preparar atualização: ' . mysqli_error($conexao);
        }
    }
}

// Calcular datas padrão (mês atual e anterior)
$dataHoje = new DateTime();
$dataInicioPadrão = $dataHoje->modify('first day of -1 month')->format('Y-m-d');
$dataFimPadrão = new DateTime();
$dataFimPadrão = $dataFimPadrão->format('Y-m-d');

// Receber filtros (padrão: mês atual e anterior)
$dataInicio = trim($_GET['data_inicio'] ?? $dataInicioPadrão);
$dataFim = trim($_GET['data_fim'] ?? $dataFimPadrão);
$filtroAplicado = false;

// Verificar se foi enviado filtro customizado
if (isset($_GET['data_inicio']) || isset($_GET['data_fim'])) {
    $filtroAplicado = true;
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
    <title>Solicitações de Viagem - Gestão Especial</title>
    <link href="https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css" rel="stylesheet" />
    <script src="https://use.fontawesome.com/releases/v6.1.0/js/all.js" crossorigin="anonymous"></script>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
    <link href="./src/css/styles.css" rel="stylesheet" />
    <script type="text/javascript" src='https://code.jquery.com/jquery-3.5.1.js'></script>
    <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.13.1/css/jquery.dataTables.css">
    <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.13.1/js/jquery.dataTables.js"></script>
    <script src="https://cdn.datatables.net/plug-ins/1.13.4/sorting/date-eu.js"></script>
    <style>
        .btn:disabled,
        .btn[disabled] {
            opacity: 0.65;
            cursor: not-allowed;
        }
    </style>
</head>

<body class="sb-nav-fixed">

<?php include "./menu.php"; ?>

<div id="layoutSidenav_content">
    <main style="width: 100%;" class="mb-2">
        <div class="container-fluid px-4 col-sm-12">
            <h1 class="h1 pt-3 pb-2 col-12 text-center">Solicitações de Viagem - Gestão Especial</h1>

            <?php if ($mensagem !== '') { ?>
                <div class="alert alert-info mt-3 mb-0 alert-dismissible fade show" role="alert">
                    <?php echo htmlspecialchars($mensagem); ?>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
                </div>
            <?php } ?>

            <?php if ($filtroAplicado) { ?>
                <div class="alert alert-warning mt-3 mb-0 alert-dismissible fade show" role="alert">
                    <strong>⚠️ Filtro aplicado:</strong> Exibindo solicitações do período de <strong><?php echo date('d/m/Y', strtotime($dataInicio)); ?></strong> a <strong><?php echo date('d/m/Y', strtotime($dataFim)); ?></strong>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
                </div>
            <?php } else { ?>
                <div class="alert alert-info mt-3 mb-0 alert-dismissible fade show" role="alert">
                    <strong>ℹ️ Filtro padrão:</strong> Exibindo solicitações do período de <strong><?php echo date('d/m/Y', strtotime($dataInicio)); ?></strong> a <strong><?php echo date('d/m/Y', strtotime($dataFim)); ?></strong>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
                </div>
            <?php } ?>

            <form method="get" class="row g-3 align-items-end mt-3">
                <div class="col-md-3">
                    <label for="data_inicio" class="form-label">Data Início</label>
                    <input type="date" class="form-control" id="data_inicio" name="data_inicio" value="<?php echo htmlspecialchars($dataInicio); ?>">
                </div>
                <div class="col-md-3">
                    <label for="data_fim" class="form-label">Data Fim</label>
                    <input type="date" class="form-control" id="data_fim" name="data_fim" value="<?php echo htmlspecialchars($dataFim); ?>">
                </div>
                <div class="col-md-3 d-flex gap-2">
                    <button type="submit" class="btn btn-primary w-100">Filtrar</button>
                    <a href="viagens_aceite_especial.php" class="btn btn-outline-secondary w-100">Limpar</a>
                </div>
            </form>

            <div class='mt-4 col-15 m-auto'>
                <table id='tabela1' class='table' style="font-size: 13px;">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Solicitação</th>
                            <th>Ida</th>
                            <th>Volta</th>
                            <th>Adiantamento</th>
                            <th>Valor</th>
                            <th>Mudar Adiantamento</th>
                            <th>Detalhes</th>
                            <th>Ação Especial</th>
                        </tr>
                    </thead>

                    <tbody>
                        <?php
                        $sql = "SELECT sv.idtbsolviagem,
                                       sv.nome,
                                       DATE_FORMAT(sv.datasol, '%d/%m/%Y %H:%i') AS datasol,
                                       DATE_FORMAT(sv.dataini, '%d/%m/%Y') AS dataini,
                                       DATE_FORMAT(sv.datafim, '%d/%m/%Y') AS datafim,
                                       origem.nome AS origem,
                                       destino.nome AS destino,
                                       sv.hospedagem,
                                       sv.passagem_ida,
                                       sv.passagem_volta,
                                       mot.descricao AS motivo,
                                       sv.motivo_obs,
                                       sv.adiantamento,
                                       sv.alimentacao,
                                       sv.valor_adiantamento,
                                       sv.nome_sol,
                                       sv.cargo_sol,
                                       sv.observacao_gerente,
                                       sv.observacao_diretor,
                                       sv.data_aceite_obs_gerente,
                                       sv.data_aceite_diretor,
                                       sv.aceite_do_diretor,
                                       sv.aprovado_coo,
                                       sv.aceite_gegeral,
                                       f_gerente.nome AS nome_gerente_aprovador,
                                       f_diretor.nome AS nome_diretor_aprovador
                                FROM bdviagem.tbsolviagem sv
                                LEFT JOIN bdviagem.tbauxlocalidade origem ON sv.idfilial_origem = origem.idlocalidade
                                LEFT JOIN bdviagem.tbauxlocalidade destino ON sv.idfilial_destino = destino.idlocalidade
                                LEFT JOIN bdviagem.tbmotivo mot ON sv.idmotivo = mot.idtbmotivo
                                LEFT JOIN bdcorp.tbfuncionario f_gerente ON sv.matricula_aceite_gerente = f_gerente.matricula
                                LEFT JOIN bdcorp.tbfuncionario f_diretor ON sv.mat_aceite_diretor = f_diretor.matricula
                                WHERE (sv.aceite_do_diretor IS NULL OR sv.aceite_do_diretor IN (1,3))
                                  AND (sv.aprovado_coo IS NULL OR sv.aprovado_coo = '')
                                  AND DATE(sv.datasol) >= ?
                                  AND DATE(sv.datasol) <= ?
                                ORDER BY sv.datasol DESC";

                        $stmt = mysqli_prepare($conexao, $sql);
                        if ($stmt) {
                            mysqli_stmt_bind_param($stmt, "ss", $dataInicio, $dataFim);
                            mysqli_stmt_execute($stmt);
                            $resultado = mysqli_stmt_get_result($stmt);
                            mysqli_stmt_close($stmt);
                        } else {
                            $resultado = mysqli_query($conexao, $sql) or die(mysqli_error($conexao));
                        }

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
                            $adiantamento = $row['adiantamento'];
                            $nome_sol = $row['nome_sol'];
                            $cargo_sol = $row['cargo_sol'];
                            $observacao_gerente = $row['observacao_gerente'];
                            $observacao_diretor = $row['observacao_diretor'];
                            $nome_gerente_aprovador = $row['nome_gerente_aprovador'];
                            $nome_diretor_aprovador = $row['nome_diretor_aprovador'];

                            $adiantamentoTexto = ($adiantamento == 1) ? 'Sim' : 'Não';
                            $alimentacao = $row['alimentacao'];
                            $option_alimentacao = 'Não';
                            if ($alimentacao == 1) {
                                $option_alimentacao = 'Sim, Almoço';
                            } elseif ($alimentacao == 2) {
                                $option_alimentacao = 'Sim, Almoço e Janta';
                            } elseif ($alimentacao == 3) {
                                $option_alimentacao = 'Sim, Janta';
                            }

                            $valor_adiantamento = $row['valor_adiantamento'];
                            $hospedagemTexto = ($hospedagem == 1) ? 'Sim' : 'Não';

                            $passagem_ida = $row['passagem_ida'];
                            if ($passagem_ida == 0) {
                                $passagemTextoIda = 'Não';
                            } elseif ($passagem_ida == 1) {
                                $passagemTextoIda = 'Avião';
                            } elseif ($passagem_ida == 2) {
                                $passagemTextoIda = 'Ônibus';
                            } else {
                                $passagemTextoIda = 'Indefinido';
                            }

                            $passagem_volta = $row['passagem_volta'];
                            if ($passagem_volta == 0) {
                                $passagemTextoVolta = 'Não';
                            } elseif ($passagem_volta == 1) {
                                $passagemTextoVolta = 'Avião';
                            } elseif ($passagem_volta == 2) {
                                $passagemTextoVolta = 'Ônibus';
                            } else {
                                $passagemTextoVolta = 'Indefinido';
                            }

                            $botaoDetalhes = "<td class='text-center'>
                                                <button type='button' class='btn btn-sm btn-primary' data-bs-toggle='modal' data-bs-target='#modalDetalhes$id'>Detalhes</button>
                                              </td>";

                            $botaoAdiantamento = ($adiantamento == 0)
                                ? "<td class='text-center'>
                                        <button type='button' class='btn btn-sm btn-secondary' disabled>Mudar adiantamento</button>
                                   </td>"
                                : "<td class='text-center'>
                                        <button type='button' class='btn btn-sm btn-secondary' data-bs-toggle='modal' data-bs-target='#modalAdiantamento$id'>Mudar adiantamento</button>
                                   </td>";

                            $acoes = "<td>
                                        <form method='post' class='d-flex gap-2'>
                                            <input type='hidden' name='idtbsolviagem' value='$id'>
                                            <button type='submit' class='btn btn-sm btn-success' name='acao' value='aprovar'>Aceitar</button>
                                            <button type='submit' class='btn btn-sm btn-danger' name='acao' value='negar'>Negar</button>
                                        </form>
                                      </td>";

                            echo "<tr>
                                    <td>$nome</td>
                                    <td>$datasol</td>
                                    <td>$dataini</td>
                                    <td>$datafim</td>
                                    <td>$adiantamentoTexto</td>
                                    <td>R$$valor_adiantamento</td>
                                    $botaoAdiantamento
                                    $botaoDetalhes
                                    $acoes
                                  </tr>";

                            echo "<div class='modal fade' id='modalDetalhes$id' tabindex='-1' aria-hidden='true'>
                                    <div class='modal-dialog modal-dialog-centered'>
                                        <div class='modal-content'>
                                            <div class='modal-header'>
                                                <h5 class='modal-title'>Detalhes da Viagem</h5>
                                                <button type='button' class='btn-sm btn-close' data-bs-dismiss='modal' aria-label='Fechar'></button>
                                            </div>
                                            <div class='modal-body' style='font-size: 13px;'>
                                                <p><strong>Nome:</strong> $nome</p>
                                                <p><strong>Motivo da Viagem:</strong> $motivo</p>
                                                <p><strong>Observação Viagem:</strong> $motivo_obs</p>
                                                <p><strong>Adiantamento:</strong> $adiantamentoTexto</p>
                                                <p><strong>Valor do Adiantamento:</strong> R$$valor_adiantamento</p>
                                                <p><strong>Alimentação:</strong> $option_alimentacao</p>
                                                <p><strong>Solicitado por:</strong> $nome_sol</p>
                                                <p><strong>Cargo do Solicitante:</strong> $cargo_sol</p>
                                                <hr>
                                                <p><strong>Gerente que aprovou:</strong> " . ($nome_gerente_aprovador ?: 'N/A') . "</p>
                                                <p><strong>Observação do Gerente:</strong> " . ($observacao_gerente ?: '-') . "</p>
                                                <p><strong>Diretor que aprovou:</strong> " . ($nome_diretor_aprovador ?: 'N/A') . "</p>
                                                <p><strong>Observação do Diretor:</strong> " . ($observacao_diretor ?: '-') . "</p>
                                                <hr>
                                                <h5>Passagem de Ida:</h5>
                                                <p><strong>Data de Ida:</strong> $dataini</p>
                                                <p><strong>Origem:</strong> $origem</p>
                                                <p><strong>Passagem:</strong> $passagemTextoIda</p>
                                                <hr>
                                                <h5>Passagem de Volta:</h5>
                                                <p><strong>Data de Volta:</strong> $datafim</p>
                                                <p><strong>Destino:</strong> $destino</p>
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

                            echo "<div class='modal fade' id='modalAdiantamento$id' tabindex='-1' aria-hidden='true'>
                                    <div class='modal-dialog modal-dialog-centered'>
                                        <div class='modal-content'>
                                            <div class='modal-header'>
                                                <h5 class='modal-title'>Adiantamento de Viagem:</h5>
                                                <button type='button' class='btn-sm btn-close' data-bs-dismiss='modal' aria-label='Fechar'></button>
                                            </div>
                                            <div class='modal-body' style='font-size: 13px;'>
                                                <form action='./control/modal/processa_Adiantamento.php' method='POST'>
                                                    <div class='input-group'>
                                                        <span class='input-group-text'>R$</span>
                                                        <input type='text' name='valor_adiantamento' class='form-control' placeholder='0,00' value='$valor_adiantamento' onkeyup='formatarMoeda(this)'>
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
<script>
    function formatarMoeda(campo) {
        let valor = campo.value;
        valor = valor.replace(/\D/g, '');
        valor = (valor / 100).toFixed(2) + '';
        valor = valor.replace('.', ',');
        valor = valor.replace(/(\d)(?=(\d{3})+\,)/g, "$1.");
        campo.value = valor;
    }

    $(document).ready(function() {
        $('#tabela1').DataTable({
            order: [[1, 'desc']],
            language: {
                decimal: "",
                emptyTable: "Nada para exibir",
                info: "Mostrando de _START_ até _END_ de _TOTAL_ registros",
                infoEmpty: "Exibindo página 0 de 0 de 0 registros",
                infoFiltered: "(filtrado do total de _MAX_ registros)",
                thousands: ",",
                lengthMenu: "Exibir _MENU_ registros",
                loadingRecords: "Carregando...",
                processing: "Processando...",
                search: "Buscar:",
                zeroRecords: "Nenhum resultado encontrado",
                paginate: {
                    first: "Primeira",
                    last: "Última",
                    next: "Próxima",
                    previous: "Anterior"
                }
            }
        });
    });
</script>

</body>
</html>