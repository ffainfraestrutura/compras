<?php
date_default_timezone_set('America/Sao_Paulo');
session_start();
include "./conectanovo.php";
header("Content-type: text/html; charset=utf-8");

$usuariof = $_SESSION['usuario'];
$matricula1 = $_SESSION['matricula'];
$tipo = $_SESSION['tipo'];
$tipo_enquete = $_SESSION['tipo_enquete'];
$matfunc = $_POST['matfunc'];

// print_r($matfunc);
// exit;

if ($usuariof == null) {
    echo "<script language='javascript' type='text/javascript'>alert('Você deve logar para ter acesso');window.location=\"index.php\"</script>";
}
$data = date('Y-m-d H:i:s');
$hojeformato = date('d/m/Y H:i:s');

// Inicialização dos filtros com valores padrão
$dataInicial = '';
$dataFinal = '';
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
<html lang="pt-br">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <meta name="description" content="FFA" />
    <meta name="author" content="FFA" />
    <link rel="icon" type="image/png" href="./src/images/favicon.png" />
    <title> Histórico de Viagem </title>
    </style>
    <link href="https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css" rel="stylesheet" />
    <link rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
    <link href="https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css" rel="stylesheet" />
    <link href="./src/css/styles.css" rel="stylesheet" />
    <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.13.1/css/jquery.dataTables.css">
    <script type="text/javascript" src='https://code.jquery.com/jquery-3.5.1.js'></script>
    <script src="https://use.fontawesome.com/releases/v6.1.0/js/all.js" crossorigin="anonymous"></script>
    <script type="text/javascript" charset="utf8"
        src="https://cdn.datatables.net/1.13.1/js/jquery.dataTables.js"></script>
    <script src="https://cdn.datatables.net/plug-ins/1.13.4/sorting/date-eu.js"></script>
    <script src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"></script>
</head>

<body class="sb-nav-fixed">
    <!--nav-->
    <?php include "./menu.php"; ?>
    <div id="layoutSidenav_content">
        <main style="width: 100%;" class="mb-2">
            <div class="container-fluid px-4 col-sm-12">
                <h1 class="h1 pt-3 pb-2 col-12 text-center"> Histórico de Solicitações de Viagem </h1>

                <!-- Formulário de Filtros -->
                <form method="post" action="<?php echo $_SERVER['PHP_SELF']; ?>" class="mb-3" id="formFiltros">
                    <div class="row">
                        <div class="col-md-3">
                            <label for="nomeSelecionado" class="form-label">Selecione o Nome:</label>
                            <select id="nomeSelecionado" name="nomeSelecionado" class="form-select select2">
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
                            <input type="date" id="dataInicial" name="dataInicial" class="form-control"
                                value="<?php echo $dataInicial; ?>">
                        </div>
                        <div class="col-md-2">
                            <label for="dataFinal" class="form-label">Data Final:</label>
                            <input type="date" id="dataFinal" name="dataFinal" class="form-control"
                                value="<?php echo $dataFinal; ?>">
                        </div>
                        <div class="col-md-2">
                            <label for="aceite_do_diretor" class="form-label">Status:</label>
                            <select id="aceite_do_diretor" name="aceite_do_diretor" class="form-select">
                                <option value="">Todos</option>
                                <option value="0" <?php echo ($statusViagem === '0') ? 'selected' : ''; ?>>Em Análise
                                </option>
                                <option value="1" <?php echo ($statusViagem === '1') ? 'selected' : ''; ?>>Aprovado pelo
                                    Gerente</option>
                                <option value="2" <?php echo ($statusViagem === '2') ? 'selected' : ''; ?>>Negado</option>
                                <option value="3" <?php echo ($statusViagem === '3') ? 'selected' : ''; ?>>Aprovado pelo
                                    COO</option>
                                <option value="4" <?php echo ($statusViagem === '4') ? 'selected' : ''; ?>>Concluído
                                </option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <button type="submit" class="btn btn-sm btn-primary mt-4">Filtrar</button>
                            <button type="button" class="btn btn-sm btn-secondary mt-4"
                                onclick="limparFiltros()">Limpar</button>
                        </div>
                        <div class="form-group col-md-1">
                            <label for="exampleInputEmail1"><b style="color: white">.</b></label>
                            <button type="button" class="form-control form-control-md btn-sm btn-success"
                                onclick="baixarExcel()">Baixar Excel</button>
                        </div>
                    </div>
                </form>

                <div class='mt-2 col-15 m-auto' styl>
                    <table id='tabela1' class='table' style="font-size: 13px;">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Data da Solicitação</th>
                                <th>Data da ida</th>
                                <th>Data da volta</th>
                                <th class='d-none'>$motivo</th>
                                <th>Detalhes</th>
                                <th>Status</th>
                                <th class="d-none">Filial de Origem</th>
                                <th class="d-none">Filial de Destino</th>
                                <th class="d-none">Receita</th>
                                <td class='d-none'>Alimentação</td>
                                <td class='d-none'>Adiantamento</td>
                                <td class='d-none'>Valor Adiantamento</td>
                                <th class="d-none">Passagem</th>
                                <th class="d-none">N° da Passagem Ida</th>
                                <th class="d-none">Local de Origem Ida</th>
                                <th class="d-none">Horário da Viagem Ida</th>
                                <th class="d-none">Local de Destino Ida</th>
                                <th class="d-none">N° da Passagem Volta</th>
                                <th class="d-none">Local de Origem Volta</th>
                                <th class="d-none">Horário da Viagem Volta</th>
                                <th class="d-none">Local de Destino Volta</th>
                                <td class='d-none'>Hospedagem</td>
                                <td class='d-none'>Hotel</td>
                            </tr>
                        </thead>
                        <tbody>
                            <?php
                            // Select da grid
                            $sql = "SELECT 
    sv.idtbsolviagem,
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
    sv.nome_sol,
    sv.motivo_obs,
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
    d.matricula AS matricula_diretor,
    sv.alimentacao,
    sv.adiantamento_finalizado,
    sv.alimentacao_finalizada,
    sv.aceite_gegeral
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
WHERE 1=1";

                            // Adiciona as condições dos filtros dinamicamente
                            if (!empty($dataInicial)) {
                                $sql .= " AND sv.datasol >= '$dataInicial'";
                            }

                            if (!empty($dataFinal)) {
                                // Adiciona 1 dia à data final para incluir o dia completo
                                $dataFinal = date('Y-m-d', strtotime($dataFinal . ' +1 day'));
                                $sql .= " AND sv.datasol < '$dataFinal'";
                            }

                            if ($statusViagem !== '') {
                                $sql .= " AND sv.aceite_do_diretor = '$statusViagem'";
                            }

                            if (!empty($nomeSelecionado)) {
                                $sql .= " AND sv.nome = '$nomeSelecionado'";
                            }

                            // Filtro de matrícula
                            if (!empty($matricula1)) {
                                $sql .= " AND sv.matsolicitante IN ('001938', '550016', '000052', '004783', '004085', '002271', '550015','050095','004572', '4901', '003051', '620002')
";
                            }


                            // Ordena pela data de solicitação (datasol) do maior para o menor
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
                                $motivo = $row['motivo'];
                                $matsolicitante = $row['matsolicitante'];
                                $nome_sol = $row['nome_sol'];
                                //PASSAGEM IDA
                                $endereco_embarque_ida = $row['endereco_embarque_ida'];
                                $empresa_ida = $row['empresa_ida'];
                                $nr_reserva_ida = $row['nr_reserva_ida'];
                                $embarque_ida = $row['embarque_ida'];
                                $horario_voo_ida = $row['horario_voo_ida'];
                                $desembarque_ida = $row['desembarque_ida'];
                                // $embarque_ida = $row['embarque_ida'];
                                $valor_ida = $row['valor'];
                                $img_passagem_ida = $row['img_passagem_ida'];
                                // $hospedagemTexto = ($hospedagem == 1) ? 'Sim' : 'Não';
                                // $hospedagemTexto = ($hospedagem == 1) ? 'Sim' : 'Não';
                                $hospedagem = $row['hospedagem'];
                                $hospedagemTexto = '';
                                if ($hospedagem == 0) {
                                    $hospedagemTexto = 'Não';
                                } elseif ($hospedagem == 1) {
                                    $hospedagemTexto = 'Sim';
                                }
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
                                //PASSAGEM VOLTA
                                $nr_reserva_volta = $row['nr_reserva_volta'];
                                $embarque_volta = $row['embarque_volta'];
                                $horario_voo_volta = $row['horario_voo_volta'];
                                $desembarque_volta = $row['desembarque_volta'];
                                $img_passagem_volta = $row['img_passagem_volta'];
                                $valor_passagem_volta = $row['valor_passagem_volta'];
                                $passagem_volta = $row['passagem_volta'];
                                $empresa_volta = $row['empresa_volta'];
                                $adiantamento = $row['adiantamento'];
                                if ($adiantamento == 0) {
                                    $adiantamento_option = 'Não';
                                } elseif ($adiantamento == 1) {
                                    $adiantamento_option = 'Sim';
                                }
                                $valor_adiantamento = $row['valor_adiantamento'];
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

                                // Definindo o status de finalização caso tenha pedido alimentação
                                if ($alimentacao != 0) {
                                    $alimentacao_finalizada = $row['alimentacao_finalizada'];
                                    if ($alimentacao_finalizada == NULL) {
                                        $option_alimentacao_finalizada = 'Em Andamento';
                                    } elseif ($alimentacao_finalizada == 1) {
                                        $option_alimentacao_finalizada = 'Email Enviado para o Financeiro';
                                    } elseif ($alimentacao_finalizada == 2) {
                                        $option_alimentacao_finalizada = 'Pagamento Concluído';
                                    }
                                }
                                $adiantamento = $row['adiantamento'];
                                if ($adiantamento == 0) {
                                    $adiantamento_option = 'Não';
                                    $option_adiantamento_finalizado = 'Não pediu adiantamento'; // Definindo a mensagem para ser exibida
                                } elseif ($adiantamento == 1) {
                                    $adiantamento_option = 'Sim';
                                    // Caso o adiantamento tenha sido solicitado, usa o valor da coluna para exibir o status
                                    $adiantamento_finalizado = $row['adiantamento_finalizado'];
                                    if ($adiantamento_finalizado == NULL) {
                                        $option_adiantamento_finalizado = 'Em Andamento';
                                    } elseif ($adiantamento_finalizado == 1) {
                                        $option_adiantamento_finalizado = 'Adiantamento Pago';
                                    }
                                }
                                //INFORMAÇÕES DO HOTEL
                                $hospedagem = $row['hospedagem'];
                                $nome_hotel = $row['nome_hotel'];
                                $endereco_hotel = $row['endereco_hotel'];
                                $valor_diaria = $row['valor_diaria'];
                                $hotel = $row['hotel'];
                                $botaoValor = "<td class='text-center'> 
                                               <button type='button' class='btn btn-sm btn-primary' data-bs-toggle='modal'
                                               data-bs-target='#modalDetalhes$id'>Detalhes</button></td>";
                                //    $aceite_gegeral = (int) $row['aceite_gegeral'];  // Converter para inteiro
                            
                                $aceite_gegeral = (int) $row['aceite_gegeral'];  // Converter para inteiro
                                /* SE FOR 1 É APROVADO PELO GERENTE GERAL, SE FOR 2 NEGADO */
                                if ($row['aceite_do_diretor'] === 0) {
                                    $status = 'Em Análise';
                                } else {
                                    switch ($row['aceite_do_diretor']) {
                                        case 1:
                                            $status = 'Aprovado pelo Gerente';

                                            // Verificar o aceite do Gerente Geral
                                            if ($aceite_gegeral === 3) {
                                                $status = 'Aprovado pelo Gerente Geral';  // Aprovado pelo Gerente Geral
                                            } elseif ($aceite_gegeral === 2) {
                                                $status = 'Negado pelo Gerente Geral';  // Negado pelo Gerente Geral
                                            } else {
                                                $status = ' Aguardando resposta do Gerente Geral'; // Sem decisão do Gerente Geral
                                            }
                                            break;
                                        case 2:
                                            $status = 'Negado pelo Gerente/Diretor';
                                            break;
                                        case 3:
                                            $status = 'Aprovado pelo Diretor';
                                            break;
                                        case 4:
                                            $status = 'Concluído';
                                            break;
                                        default:
                                            $status = 'Em Análise';
                                            break;
                                    }
                                }
                                print "
                                    <tr>
                                        <td>$nome</td>
                                        <td>$datasol</td>
                                        <td>$dataini</td>
                                        <td>$datafim</td>
                                        <td class='d-none'>$motivo</td>
                                        $botaoValor
                                        <td>$status</td>
                                        <td class='d-none'>$origem</td>
                                        <td class='d-none'>$destino</td>
                                        <td class='d-none'>$receita</td>
                                        <td class='d-none'>$option_alimentacao</td>
                                        <td class='d-none'>$adiantamento_option</td>
                                        <td class='d-none'>" . number_format($valor_adiantamento, 2, ',', '.') . "</td>
                                        <td class='d-none'>$passagemTextoIda</td>
                                        <td class='d-none'>$nr_reserva_ida</td>
                                        <td class='d-none'>$embarque_ida</td>
                                        <td class='d-none'>$horario_voo_ida</td>
                                        <td class='d-none'>$desembarque_ida</td>
                                        <td class='d-none'>$nr_reserva_volta</td>
                                        <td class='d-none'>$embarque_volta</td>
                                        <td class='d-none'>$horario_voo_volta</td>
                                        <td class='d-none'>$desembarque_volta</td>
                                        <td class='d-none'>$hospedagemTexto</td>
                                        <td class='d-none'>$hotel</td>
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
    </div><!--div para fechar a div que fica aberta no menu.php-->

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"
        crossorigin="anonymous"></script>
    <script src="./src/js/scripts.js"></script>

    <script type="text/javascript">
        // Aguarda o DOM carregar completamente
        $(document).ready(function () {
            // Inicializa o DataTable
            if ($.fn.DataTable) {
                $('#tabela1').DataTable({
                    "ordering": false,
                    "pageLength": 10,
                    "lengthMenu": [[10, 100, 500, -1], [10, 100, 500, "Todos"]],
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
                    },
                });
            } else {
                console.error("DataTable não está disponível");
            }

            // Inicializa o Select2
            if ($.fn.select2) {
                $('#nomeSelecionado').select2({
                    theme: 'bootstrap-5',
                    placeholder: 'Selecione ou busque um nome',
                    allowClear: true,
                    width: '100%',
                    minimumInputLength: 0,
                    language: {
                        noResults: function () {
                            return "Nenhum nome encontrado";
                        },
                        searching: function () {
                            return "Buscando...";
                        }
                    }
                });
            } else {
                console.error("Select2 não está disponível");
            }
        });

        function baixarExcel() {
            var tabela = document.getElementById('tabela1');
            var worksheet = XLSX.utils.table_to_sheet(tabela);
            var workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Histórico de Viagens');

            var hoje = new Date();
            var dia = String(hoje.getDate()).padStart(2, '0');
            var mes = String(hoje.getMonth() + 1).padStart(2, '0');
            var ano = hoje.getFullYear();
            var dataFormatada = dia + '-' + mes + '-' + ano;

            var xlsxFile = XLSX.write(workbook, {
                bookType: 'xlsx',
                type: 'array'
            });

            var blob = new Blob([xlsxFile], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            });
            var url = URL.createObjectURL(blob);

            var a = document.createElement('a');
            a.href = url;
            a.download = 'HistoricoViagem_' + dataFormatada + '.xlsx';
            a.click();

            URL.revokeObjectURL(url);
        }

        function limparFiltros() {
            document.getElementById('nomeSelecionado').value = '';
            document.getElementById('dataInicial').value = '';
            document.getElementById('dataFinal').value = '';
            document.getElementById('aceite_do_diretor').value = '';
            document.getElementById('formFiltros').submit();
        }
    </script>

</body>

</html>