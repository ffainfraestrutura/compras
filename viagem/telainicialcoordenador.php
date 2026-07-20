<?php
    date_default_timezone_set('America/Sao_Paulo');
    session_start();

    // Verifica se o usuário está logado e possui permissão
    $usuariof = $_SESSION['usuario'];
    $matricula1 = $_SESSION['matricula'];
    $tipo = $_SESSION['tipo'];
    $tipo_enquete = $_SESSION['tipo_enquete'];

    if ($usuariof == null) {
        echo "<script language='javascript' type='text/javascript'>alert('Você deve logar para ter acesso');window.location=\"index.php\"</script>";
    }

    // Configurações adicionais da sessão
    $_SESSION['tipo'] = $tipo;
    $_SESSION['matricula'] = $matricula1;
    $_SESSION['usuario'] = $usuariof;
    $_SESSION['tipo_enquete'] = $tipo_enquete;

    include "./conecta.php";
    header("Content-type: text/html; charset=utf-8");

    // Verifica se a conexão com o banco de dados foi estabelecida corretamente
    if (!$conexao) {
      die("Erro ao conectar ao banco de dados: " . mysqli_connect_error());
    }

    // Busca o centro de custo do coordenador
    $sqlCoord = "SELECT fc.ccusto
                FROM bdcorp.tbfuncionario fc
                WHERE fc.matricula = '{$matricula1}'";
    $resultadoCoord = mysqli_query($conexao, $sqlCoord) or die(mysqli_error($conexao));
    $rowCoord = mysqli_fetch_assoc($resultadoCoord);
    $ccustoger = isset($rowCoord['ccusto']) ? $rowCoord['ccusto'] : '';

    // Ajusta a matrícula do coordenador (removendo prefixo 'crd')
    if (strpos($matricula1, "crd") !== false) {
      $matricula1 = substr($matricula1, 3);
    }
?>

<!DOCTYPE html>
<html lang="pt-br">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
  <meta name="description" content="FFA" />
  <meta name="author" content="FFA" />
  <title>Inicial</title>
  <link rel="icon" type="image/png" href="./src/images/favicon.png" />
  <link href="https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css" rel="stylesheet" />
  <link href="./src/css/styles.css" rel="stylesheet" />
  <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.13.1/css/jquery.dataTables.css">
  <script type="text/javascript" src="https://code.jquery.com/jquery-3.5.1.js"></script>
  <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.13.1/js/jquery.dataTables.js"></script>
  <script src="https://cdn.datatables.net/plug-ins/1.13.4/sorting/date-eu.js"></script>
  <script src="https://use.fontawesome.com/releases/v6.1.0/js/all.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous"></script>
  <script src="./src/js/scripts.js"></script>
</head>

<body class="sb-nav-fixed">
  <!-- Menu e popups -->
  <?php include "./menu.php"; ?>
  <?php include "./popupmeses.php"; ?>

  <!-- Conteúdo principal -->
  <div id="layoutSidenav_content">
    <main style="width: 100%;" class="mb-2">
      <div class="container-fluid px-4 col-sm-12">
        <h1 class="h1 pt-3 pb-2 col-11 text-center">Iniciar Solicitação de Viagem</h1>
        <h5 class="m-auto text-center">Para iniciar uma solicitação de viagem, informe os dados do colaborador.</h5>
        <input type='hidden' name='tipo_enquete' value='<?php echo $tipo_enquete; ?>' />
        <div class="m-auto pt-2 col-12 mt-4 border-top border-dark" style="width: 100%;">
          <h6 class='pb-2' style="font-size: 1.05em;">Busque pelo nome do colaborador e clique em Solicitação de viagem:</h6>
          <div>
            <table id='tabela1' class='table table-striped'>
              <thead>
                <tr>
                  <th>Matrícula</th>
                  <th>Nome</th>
                  <th>Centro de Custo</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                <?php
                // Consulta SQL para buscar colaboradores ativos do setor do coordenador
                $sql = "SELECT fc.matricula, 
                               fc.nome, 
                               fc.ccusto
                          FROM bdcorp.tbfuncionario fc
                    INNER JOIN bdcorp.tbcolabcoord cc ON fc.matricula = cc.matrcolab
                        WHERE (cc.matrcoord = '{$matricula1}' OR fc.ccusto = '{$ccustoger}') -- Filtro que permite um ou outro
                          AND fc.status <> 'Demitido'
                     ORDER BY fc.nome";

                $resultado = mysqli_query($conexao, $sql) or die(mysqli_error($conexao));

                while ($row = mysqli_fetch_assoc($resultado)) {
                  $matricula = $row['matricula'];
                  $nome = $row['nome'];
                  $ccusto = $row['ccusto'];
                  // Define o centro de custo como o do coordenador se não estiver definido
                  if ($ccusto == '') {
                    $ccusto = $ccustoger;
                  }

                  // Botão para solicitar viagem
                  $botao = "<form method='post' action='./questionariosolicitacaoviagem.php'>
                              <input type='hidden' name='matfunc' value='$matricula'>
                              <input type='hidden' name='tipo_enquete' value='$tipo_enquete'>
                              <input type='hidden' name='solicitante' value='$matricula1'>
                              <input type='hidden' name='ccusto' value='$ccusto'>
                              <button type='submit' class='btn btn-success'>Solicitar viagem</button>
                            </form>";

                  echo "<tr>
                          <td>$matricula</td>
                          <td>$nome</td>
                          <td>$ccusto</td>
                          <td>$botao</td>
                        </tr>";
                }
                ?>
              </tbody>
            </table>
          </div>
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

  <!-- Scripts JavaScript -->
  <script>
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
        },
        lengthMenu: [
          [10, 20, 50, -1],
          [10, 20, 50, 'Todos'],
        ],
      });
    });
  </script>

</body>

</html>