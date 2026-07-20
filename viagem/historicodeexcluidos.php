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
    <title>Histórico de Excluidos</title>
    <link rel="icon" type="image/png" href="./src/images/favicon.png" />
    <link href="https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css" rel="stylesheet" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
    <link href="https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css" rel="stylesheet" />
    <link href="./src/css/styles.css" rel="stylesheet" />
    <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.13.1/css/jquery.dataTables.css">
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
                <h1 class="h1 pt-3 pb-2 col-12 text-center">Historico de Excluidos</h1>
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
                                    CONCAT(sv.idempresa_ida, ' - ', e.nome_empresa) AS empresa_ida,
                                    CONCAT(sv.idempresa_volta, ' - ', e.nome_empresa) AS empresa_volta,
                                    CONCAT(h.nome_hotel, '-', h.endereco_hotel, '-', h.cidade_hotel) AS hotel,
                                    CONCAT(embarque_ida.nome_do_aeroporto, '-', embarque_ida.cidade) AS embarque_ida,
                                    CONCAT(desembarque_ida.nome_do_aeroporto, '-', desembarque_ida.cidade) AS desembarque_ida,
                                    CONCAT(embarque_volta.nome_do_aeroporto, '-', embarque_volta.cidade) AS embarque_volta,
                                    CONCAT(desembarque_volta.nome_do_aeroporto, '-', desembarque_volta.cidade) AS desembarque_volta,
                                            me.idtbmotivo_exclusao,
                                            me.motivo_exclusao
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
                                     WHERE me.idtbsolviagem IS NOT NULL";

                            $resultado = mysqli_query($conexao, $sql) or die(mysqli_error($conexao));

                            while ($row = mysqli_fetch_array($resultado, MYSQLI_BOTH)) {
                                $id = $row['idtbsolviagem'];
                                $datasol = $row['datasol'];
                                $nome_sol = $row['nome_sol'];
                                $nome = $row['nome'];
                                $cpf = $row['cpf'];
                                $dtnasc = $row['dtnasc'];
                                $dtnascFormatada = (new DateTime($dtnasc))->format('d/m/Y '); // Formata a data de nascimento para o padrão brasileiro com data e hora
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
                                $data_aceite_gerente = $row['data_aceite_gerente'];
                                $data_formatadaGerente = date('d/m/Y H:i:s', strtotime($data_aceite_gerente));

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

                                $motivo_exclusao = $row['motivo_exclusao'];
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
                                        <td>$dataini</td>
                                        <td>$datafim</td>
                                        <td>$origem</td>
                                        <td>$destino</td>
                                        <td>$hospedagemTexto</td>
                                        <td>$passagemTextoIda</td>
                                        <td>$passagemTextoVolta</td>
                                        <td><button type='button' class='btn btn-sm btn-primary' data-bs-toggle='modal' data-bs-target='#modalDetalhes2$id'>Detalhes</button></td>
                                      </tr>";
                                /* Modal pra ver os detalhes da Viagem */


                                echo "
                                <div class='modal fade' id='modalDetalhes2$id' tabindex='-1' aria-labelledby='exampleModalLabel' aria-hidden='true' enctype='multipart/form-data'>
                                   <div class='modal-dialog modal-dialog-centered'>
                                      <div class='modal-content'>
                                        <div class='modal-header'>
                                        <h5 class='modal-title' id='modalDetalhesLabel$id'>Detalhes da Viagem</h5>
                                        <button type='button' class='btn-sm btn-close' data-bs-dismiss='modal' aria-label='Fechar'></button>
                                        </div>
                                        <div class='modal-body' style='font-size: 13px;'>
                                            <p><strong>Nome:</strong> $nome</p>
                                            <p><strong>CPF:</strong> $cpf</p>
                                            <p><strong>Data de Nascimento:</strong> $dtnascFormatada</p>
                                            <p><strong>Data de Ida:</strong> $dataini</p>
                                            <p><strong>Data de Volta:</strong> $datafim</p>
                                            <p><strong>Origem:</strong> $origem</p>
                                            <p><strong>Destino:</strong> $destino</p>
                                            <p><strong>Motivo da Viagem:</strong> $motivo</p>
                                            <p><strong>Observação Viagem:</strong> $motivo_obs</p>
                                            <p><strong>Adiantamento:</strong> $adiantamento_option</p>
                                            <p><strong>Valor Adiantamento:</strong> R$$valor_adiantamento</p>
                                            <p><strong>Tipo de Pix:</strong> $option_pix</p>
                                            <p><strong>Pix: </strong> $chave_pix</p>
                                            <p><strong>Aprovado pelo Gerente: </strong> $data_formatadaGerente</p>
                                            <p><strong>Aprovado pelo Diretor: </strong> $data_formatadaDiretor</p>
                                            <hr>
                                            <h5>Passagem de Ida:</h5>
                                            <p><strong>Passagem:</strong> $passagemTextoIda</p>
                                            <p><strong>Empresa:</strong> $empresa_ida</p>
                                            <p><strong>N° da Passagem:</strong> $nr_reserva_ida</p>
                                            <p><strong>Local de Origem:</strong> $embarque_ida</p>
                                            <p><strong>Horário da Viagem:</strong> $horario_voo_ida</p>
                                            <p><strong>Local de Destino:</strong> $desembarque_ida</p>
                                            <p><strong>Valor da Ida:</strong>R$$valor_ida</p>
                                            <hr>
                                            <h5>Passagem de Volta:</h5>
                                            <p><strong>Passagem:</strong> $passagemTextoVolta </p>
                                            <p><strong>Empresa:</strong> $empresa_volta</p>
                                            <p><strong>N° da Passagem:</strong> $nr_reserva_volta </p>
                                            <p><strong>Local de Origem:</strong> $embarque_volta</p>
                                            <p><strong>Horário da Viagem</strong> $horario_voo_volta</p>
                                            <p><strong>Local de Destino:</strong> $desembarque_volta</p>
                                            <p><strong>Valor da Volta:</strong>R$$valor_passagem_volta</p>
                                            <hr>
                                            <p><strong>Hospedagem:</strong> $hospedagemTexto</p>
                                            <p><strong>Hotel:</strong> $hotel</p>
                                            <p><strong> Valor Hospedagem:</strong>R$$valor_diaria</p>
                                            <hr>
                                            <p><strong>Dados do Solicitante:</strong></p>
                                            <p><strong>Solicitante:</strong> $nome_sol</p>
                                            <p><strong>Cargo:</strong> $cargo_sol</p>
                                            <hr>
                                            <p><strong>Motivo da Exclusão:</strong></p>
                                            <p><strong>Motivo:</strong> $motivo_exclusao</p>
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