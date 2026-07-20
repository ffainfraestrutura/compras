<?php
date_default_timezone_set('America/Sao_Paulo');
session_start();

$usuariof = $_SESSION['usuario'];
$matricula1 = $_SESSION['matricula'];
$tipo = $_SESSION['tipo'];
$tipo_enquete = $_SESSION['tipo_enquete'];

if ($usuariof == null) {
    echo "<script language='javascript' type='text/javascript'>alert('Você deve logar para ter acesso');window.location=\"index.php\"</script>";
}

$_SESSION['tipo'] = $tipo;
$_SESSION['matricula'] = $matricula1;
$_SESSION['usuario'] = $usuariof;
$_SESSION['tipo_enquete'] = $tipo_enquete;

$data = date('Y-m-d H:i:s');
$hojeformato = date('d/m/Y H:i:s');

include"./conecta.php";
//include_once"./func/log.php";
header("Content-type: text/html; charset=utf-8");

if($conexao){
  $r= "tudo ok";
}
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, , shrink-to-fit=no" />
  <meta name="description" content="FFA" />
  <meta name="author" content="FFA" />
  <link rel="icon" type="image/png" href="./src/images/favicon.png"/>

  <title> Adicionar Colaborador </title>

  <link href="https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css" rel="stylesheet" />
  
  <script src="https://use.fontawesome.com/releases/v6.1.0/js/all.js" crossorigin="anonymous"></script>

  <!-- Vendor CSS
  <link href="src/vendor/select2/select2.min.css" rel="stylesheet" media="all">
  <link href="src/vendor/datepicker/daterangepicker.css" rel="stylesheet" media="all">-->

  <!-- Bootstrap core CSS 
  <link href="src/index_files/bootstrap.css" rel="stylesheet">-->

  <!-- Custom styles for this template -->
  <!--<script src="src/index_files/ie-emulation-modes-warning.js.download"></script>
  <script type='text/javascript' src='src/vendor/jquery/jquery-3.2.1.min.js'></script>
  <script type='text/javascript' src='src/vendor/jquery/jquery.min.js'></script>-->

  <!--link Material Symbols - simbolos do input-->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />

  <!--data tables - css e js-->
  <link href="https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css" rel="stylesheet" />
  <link href="./src/css/styles.css" rel="stylesheet" />
  <script type="text/javascript" src='https://code.jquery.com/jquery-3.5.1.js'></script>
  <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.13.1/css/jquery.dataTables.css">
  <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.13.1/js/jquery.dataTables.js"></script>

  <script src="https://cdn.datatables.net/plug-ins/1.13.4/sorting/date-eu.js"></script>

  <!-- jquery e masks 
  <script src='https://code.jquery.com/jquery-3.6.0.min.js' integrity='sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=' crossorigin='anonymous'></script>

  <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jquery.mask/1.14.15/jquery.mask.min.js"></script>-->

</head>
<body class="sb-nav-fixed">

  <!--nav-->
  <?php include "./menu.php"; ?>

  <div id="layoutSidenav_content">

    <main style="width: 100%;" class="mb-2">

      <div class="container-fluid px-4 col-sm-12">
        <h1 class="h1 pt-3 pb-2 col-12 text-center"> Adicionar Colaborador </h1>

        
        <div class="m-auto" style="width: 90%;">
          <h5 class="m-auto text-center">Caso algum colaborador não esteja aparecendo na sua listagem, você pode adicioná-lo por meio do formulário abaixo. </h5>
            
          <!-- div form--> 
          <div class="m-auto mt-2 border-top border-bottom border-dark pt-2" style="width: 100%;">
            <h6 style="font-size: 1.05em;">Insira a matrícula do novo colaborador e clique em Cadastrar:<span style="color: red;">*</span></h6>
            <form method="post" action="./control/adicionarcolaborador.php">
              <div class='col-12'>
                <!--div insira a matricula-->
                <div class='col-md-5 m-auto text-center'>
                  <!--<label class='mb-0 form-label' for='matfunc'> Insira a matrícula do funcionário: !--<span style="color: red;">*</span></label>-->
                  <input type='text' name='matfunc' id='matfunc' class='form-control' placeholder='Matricula Funcionário' requiredkk  >
                  <?php print"<input type='hidden' name='tipo_enquete' value='$tipo_enquete'>
                  <input type='hidden' name='entrevistador' value='$matricula1'>";?>
                </div>

                <!-- div botão-->
                <div class="mt-2 col-12 text-center">
                  <button class="col-3 btn btn-success" type="submit" > Cadastrar </button>
                </div>

                <!-- div campos obrigatórios -->
                <div class="mt-2 col-12">
                  <p style='color: red;'> * Campos obrigatórios. </p>
                </div>
              </div>
            </form>
          </div>    
        </div>

        <!--div lista -->        
        <div class='m-auto col-12 col-md-12 mt-4' style='width: 90%;'>
          <div class='card mb-4'>
            <div class='card-header'>
              <i class='fas fa-table'></i>
                Listagem dos Colaboradores
            </div>
            <div class='card-body'>
              <table id="tabela1" class="table">
                <thead>
                  <tr>
                    <th>Matrícula</th>
                    <th>Nome</th>
                    <th> </th>
                  </tr>
                </thead>
                  
                <tbody>
                  
                  <?php
                  $sql="SELECT matricula,
                               nome
                          FROM bdcorp.tbfuncionario
                         WHERE matricula NOT IN (SELECT matrcolab FROM bdcorp.tbcolabcoord)
                           AND matricula NOT IN (SELECT matrcoord FROM bdcorp.tbcoordgerente)
                           AND matricula NOT IN (SELECT matrgerente FROM bdcorp.tbcoordgerente)
                           AND status <> 'demitido' AND MATRICULA <> '999999' AND NOME NOT LIKE '%TERC%'";
                  $resultado=mysqli_query($conexao, $sql) or die(mysqli_error($conexao));
                  while($row = mysqli_fetch_array($resultado, MYSQLI_BOTH)){
                    $matrcolab = $row['matricula'];
                    $nomecolab = $row['nome'];

                    print"
                    <tr>
                      <td>$matrcolab</td>
                      <td>$nomecolab</td>
                      <td class='text-center'><form action='./control/adicionarcolaborador.php' method='post'>
                          <input type='hidden' name='matfunc' value='$matrcolab'>
                          <input type='hidden' name='nomefunc' value='$nomecolab'>
                          <input type='hidden' name='tipo_enquete' value='$tipo_enquete'>
                          <input type='hidden' name='entrevistador' value='$matricula1'>
                          <button type='submit' class='btn btn-success'> Adicionar Colaborador </button>
                        </form>
                      </td>
                    </tr>";
                  }
                  ?>               
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </main>

    <footer class="py-4 bg-light mt-auto">
      <div class="container-fluid px-4">
        <div class="d-flex align-items-center justify-content-between small">
            <div class="text-muted">Copyright &copy; FFA Infraestrutura</div>
            <!--<div>
                <a href="#">Privacy Policy</a>
                &middot;
                <a href="#">Terms &amp; Conditions</a>
            </div>-->
        </div>
      </div>
    </footer>
  </div>
  </div><!--div para fechar a div que fica aberta no menu.php-->

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous"></script>
<script src="./src/js/scripts.js"></script>

<!--<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.8.0/Chart.min.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/simple-datatables@latest" crossorigin="anonymous"></script>-->
  

  <script type='text/javascript' src='/var/www/html/presenca/src/vendor/bootstrap/js/bootstrap.min.js'></script>

  <script>window.jQuery || document.write('<script src="src/vendor/jquery/jquery.min.js"><\/script>')</script>

  <script type="text/javascript">
    $(document).ready(function () {
      $("#selectcoordenador").change(function() {
        $('#coordenador1').val(" ");
      });

      $("#coordenador1").change(function() {
        $('#selectcoordenador').val(" ");
      });

      $('#tabela1').DataTable({
        order: [[1, 'asc']],

        "language": {
          "decimal":        "",
          "emptyTable":     "Nada para exibir",
          "info":           "Mostrando de _START_ até _END_ de _TOTAL_ registros",
          "infoEmpty":      "Exibindo página 0 de 0 de 0 registros",
          "infoFiltered":   "(filtrado do total de _MAX_ registros)",
          "infoPostFix":    "",
          "thousands":      ",",
          "lengthMenu":     "Exibir _MENU_ registros",
          "loadingRecords": "Carregando...",
          "processing":     "Processando...",
          "search":         "Buscar:",
          "zeroRecords":    "Nenhum resultado encontrado",
          "paginate": {
              "first":      "Primeira",
              "last":       "Última",
              "next":       "Próxima",
              "previous":   "Anterior"
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