<?php
date_default_timezone_set('America/Sao_Paulo');
session_start();
include "./conecta.php";

// Verifica se as datas foram enviadas pelo formulário
$totalDias = '';
if (isset($_POST['dataini']) && isset($_POST['datafim'])) {
    $dataini = $_POST['dataini'];
    $datafim = $_POST['datafim'];

    if (!empty($dataini) && !empty($datafim)) {
        $date1 = new DateTime($dataini);
        $date2 = new DateTime($datafim);
        $interval = $date1->diff($date2);
        $totalDias = $interval->days;
    } else {
        $totalDias = 'As datas não foram preenchidas corretamente.';
    }
} else {
    $totalDias = 'As datas não foram enviadas.';
}

// Exibir total de dias (para fins de depuração)
// echo "Total de dias: " . $totalDias;

// Restante do seu código
$usuariof = $_SESSION['usuario'];
$matricula1 = $_SESSION['matricula'];
$tipo = $_SESSION['tipo'];
$tipo_enquete = $_SESSION['tipo_enquete'];
$datasol = date('Y-m-d H:i:s');
$hojeformato = date('Y-m-d');
$mes = date("m");
$ano = date("Y");
$matfunc = $_POST['matfunc'];
$tipo_enquete = $_POST['tipo_enquete'];
$solicitante = $_POST['solicitante'];


if ($usuariof == null) {
    echo "<script language='javascript' type='text/javascript'>alert('Você deve logar para ter acesso');window.location=\"index.php\"</script>";
}

$sql = "SELECT status
          FROM bdcorp.tbfuncionario
         WHERE matricula='$matfunc'; ";
$resultado = mysqli_query($conexao, $sql) or die(mysqli_error($conexao));
$row = mysqli_fetch_array($resultado, MYSQLI_BOTH);
$statusfunc = $row['status'];

header("Content-type: text/html; charset=utf-8");

if ($statusfunc == 'Demitido') {
    echo "<script language='javascript' type='text/javascript'>alert('Funcionário demitido.');window.location=\"telainicial.php\"</script>";
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
    <title> Solicitação de Viagem</title>
    <link href="https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css" rel="stylesheet" />
    <!--link Material Symbols - simbolos do input-->
    <link rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
    <!--data tables - css e js-->
    <link href="https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css" rel="stylesheet" />
    <link href="src/css/styles.css" rel="stylesheet" />
    <script type="text/javascript" src='https://code.jquery.com/jquery-3.5.1.js'></script>
    <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.13.1/css/jquery.dataTables.css">
    <script type="text/javascript" charset="utf8"
        src="https://cdn.datatables.net/1.13.1/js/jquery.dataTables.js"></script>
    <script src="https://use.fontawesome.com/releases/v6.1.0/js/all.js" crossorigin="anonymous"></script>
    <!-- jquery e masks -->
    <script src='https://code.jquery.com/jquery-3.6.0.min.js'
        integrity='sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=' crossorigin='anonymous'></script>
    <script type="text/javascript"
        src="https://cdnjs.cloudflare.com/ajax/libs/jquery.mask/1.14.15/jquery.mask.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"
        crossorigin="anonymous"></script>
    <script src="./src/js/scripts.js"></script>
    <script type='text/javascript' src='/var/www/html/presenca/src/vendor/bootstrap/js/bootstrap.min.js'></script>
    <style>
        .motivos {
            display: flex;
            gap: 20px;
        }
    </style>
</head>

<body class="sb-nav-fixed">
    <!--nav-->
    <?php include "./menu.php"; ?>
    <div id="layoutSidenav_content">
        <main style="width: 100%;" class="mb-2">
            <div class="container-fluid px-4 col-sm-12">
                <h2 class="h2 pt-3 pb-2 col-12 text-center"> Formulário para Solicitação de Viagem de Funcionário </h2>
                <!-- div form style="width: 70%;"-->
                <div class="m-auto col-9">
                    <form method="post" action="./control/questionariogerente.php">
                        <!--div Informações pessoais do funcionário-->
                        <?php
                        $sql = "SELECT idtbfuncionario,
                                       nome, 
                                       matricula,
                                       codfilial,
                                       codempresa, 
                                       ccusto, 
                                       cargo, 
                                       status,
                                       dtnasc,
                                       cpf 
                           FROM bdcorp.tbfuncionario 
                          WHERE matricula='$matfunc';";
                        $resultado = mysqli_query($conexao, $sql) or die(mysqli_error());
                        $row = mysqli_fetch_array($resultado, MYSQLI_ASSOC);

                        $idtbfuncionario = $row['idtbfuncionario'];
                        $nome = $row['nome'];
                        $matr = $row['matricula'];
                        $codfilial = $row['codfilial'];
                        $codempresa = $row['codempresa'];
                        $ccusto = $row['ccusto']; //departamento
                        $cargo = $row['cargo'];
                        $status = $row['status'];
                        $cpf = $row['cpf'];
                        $dtnasc = date('Y-m-d', strtotime($row['dtnasc']));
                        $dataini = $row['dataini'];
                        $datafim = $row['datafim'];
                        $passagem_volta = $row['passagem_volta'];
                        ?>
                        <div>
                            <fieldset>
                                <legend>Informações pessoais do funcionário:</legend>
                                <!--d-flex col-sm-12 col-12 m-auto-->
                                <div class='row justify-content-start justify-content-start'>
                                    <?php print "
                    <!--div nome colaborador-->
                    <div class='col-md-8 col-12'>
                        <label class='mb-0 form-label' for='nome'> Nome Completo: </label>
                        <input type='text' name='nome' id='nome' class='form-control' placeholder='Nome do Colaborador'  value='$nome' readonly>
                    </div>
                    <div class='ms-0 col-md-3 col-12'>
                        <label class='mb-0 form-label' for='cpf'> CPF: </label>
                        <input type='text' name='cpf' id='cpf' class='form-control' placeholder='CPF'  value='$cpf' readonly>
                    </div>
                    <div class='ms-0 col-md-3 col-12'>
                        <label class='mb-0 form-label' for='dtnasc'> Data de Nascimento: </label>
                        <input type='date' name='dtnasc' id='dtnasc' class='form-control' placeholder='Data de Nascimento'  value='$dtnasc' readonly>
                    </div>                    
                 </div>
              <!--mt-3 col-sm-12 d-flex m-auto justify-content-start-->
                 <div class='mt-3 row justify-content-start'>
                  <!--div Função -->
                    <div class='col-md-6'>
                        <label class='mb-0 form-label' for='cargo_viajante'> Cargo: </label>
                        <input type='text' name='cargo_viajante' id='cargo_viajante' class='form-control' placeholder='Função'  value='$cargo' readonly>
                    </div>
                  <!--div ccusto/departamento -->
                    <div class='col-md-6'>
                        <label class='mb-0 form-label' for='departamento'> Departamento: </label>
                        <input type='text' name='departamento' id='departamento' class='form-control' placeholder='Centro de custo'  value='$ccusto' readonly>            
                    </div>            
                    </div>
                  <div class='mt-3 row justify-content-start'>"; ?>
                                    <!--div data da viagem -->
                                    <div class='col-md-6'>
                                        <label class='mb-0 form-label' for='dataini'> Data de viagem pretendida:<span
                                                style='color:red;'>*<span></label>
                                        <input type='date' name='dataini' id='dataini' class='form-control'
                                            onchange='calcularDataSol(); calcularDiferencaDatas();'>
                                    </div>
                                    <div class='col-md-6'>
                                        <label class='mb-0 form-label' for='datafim'> Data de viagem da volta: </label>
                                        <input type='date' name='datafim' id='datafim' class='form-control'
                                            onchange='calcularDiferencaDatas()'>
                                    </div>
                                    <div class='col-sm-6'>
                                        <label class='mb-0 form-label' for='idfilial_origem'>Origem:<span
                                                style='color:red;'>*<span></label>
                                        <select class='form-select' name='idfilial_origem' id='idfilial_origim' required
                                            onchange="verifica(this.value)">
                                            <option>Selecione...</option>
                                            <?php
                                            $sqlfilo = "SELECT idlocalidade, 
                                         nome, 
                                         estado 
                                    FROM bdviagem.tbauxlocalidade";
                                            $resultadofilo = mysqli_query($conexao, $sqlfilo) or die(mysqli_error());
                                            while ($rowfilo = mysqli_fetch_array($resultadofilo, MYSQLI_ASSOC)) {
                                                $nomefilial = str_replace("FFA ", "", $rowfilo['nome']);
                                                $estadofilial = $rowfilo['estado'];
                                                $idfilial = $rowfilo['idlocalidade'];
                                                print "<option value='$idfilial'>$nomefilial - $estadofilial</option>";
                                            }
                                            ?>
                                        </select>
                                    </div>
                                    <div class='col-sm-6'>
                                        <label class='mb-0 form-label' for='idfilial_destino'>Destino:<span
                                                style='color:red;'>*<span></label>
                                        <select class='form-select' name='idfilial_destino' id='idfilial_destino'
                                            required onchange="verifica(this.value)">
                                            <option>Selecione...</option>
                                            <?php
                                            $sqlfild = "SELECT idlocalidade, 
                                         nome, 
                                         estado 
                                    FROM bdviagem.tbauxlocalidade";
                                            $resultadofild = mysqli_query($conexao, $sqlfild) or die(mysqli_error());
                                            while ($rowfild = mysqli_fetch_array($resultadofild, MYSQLI_ASSOC)) {
                                                $nomefilial = str_replace("FFA ", "", $rowfild['nome']);
                                                $estadofilial = $rowfild['estado'];
                                                $idfilial = $rowfild['idlocalidade'];
                                                print "<option value='$idfilial'>$nomefilial - $estadofilial</option>";
                                            }
                                            ?>
                                        </select>
                                        <button type="button" class="btn btn-primary abrir-modal" data-bs-toggle="modal"
                                            data-bs-target="#modalLocalidade">+</button>
                                    </div>
                                    <div class='col-sm-6'>
                                        <label class='mb-0 form-label' for='passagem_ida'>Passagem de ida?<span
                                                style='color:red;'>*<span></label>
                                        <select class='form-select' name='passagem_ida' id='passagem_ida' required
                                            onchange="verifica(this.value)">
                                            <option value=''>Selecione...</option>
                                            <?php if ($intervalo < 90)
                                                print "<option value='0'>Não</option> 
                                                        <option value='1'>Avião</option>
                                                        <option value='2'>Onibus</option>" ?>
                                            </select>
                                        </div>
                                        <div class='col-sm-6'>
                                            <label class='mb-0 form-label' for='periodo_ida'>Período ida:<span
                                                    style='color:red;'>*<span></label>
                                            <select class='form-select' name='periodo_ida' id='periodo_ida' required
                                                onchange="verifica(this.value)">
                                                <option>Selecione...</option>
                                                <?php
                                            $sqlPeriodo = "SELECT idperiodo, 
                                            periodo 
                                       FROM bdviagem.tbauxperiodo";
                                            $resultadoPeriodo = mysqli_query($conexao, $sqlPeriodo) or die(mysqli_error());
                                            while ($rowPeriodo = mysqli_fetch_array($resultadoPeriodo, MYSQLI_ASSOC)) {
                                                ;
                                                $idperiodo = $rowPeriodo['idperiodo'];
                                                $periodo = $rowPeriodo['periodo'];
                                                print "<option value='$idperiodo'>$periodo</option>";
                                            }
                                            ?>
                                        </select>
                                    </div>
                                    <div class='col-sm-6'>
                                        <label class='mb-0 form-label' for='passagem_volta'>Passagem de volta?<span
                                                style='color:red;'>*<span></label>
                                        <select class='form-select' name='passagem_volta' id='passagem_volta' required
                                            onchange="verifica(this.value)">
                                            <option value=''>Selecione...</option>
                                            <?php if ($intervalo < 90)
                                                print "<option value='0'>Não</option> 
                                                        <option value='1'>Avião</option>
                                                        <option value='2'>Onibus</option>"; ?>
                                        </select>
                                    </div>
                                    <div class='col-sm-6'>
                                        <label class='mb-0 form-label' for='periodo_volta'>Período Volta:<span
                                                style='color:red;'>*<span></label>
                                        <select class='form-select' name='periodo_volta' id='periodo_volta' required
                                            onchange="verifica(this.value)">
                                            <option>Selecione...</option>
                                            <?php
                                            $sqlPeriodo = "SELECT idperiodo, 
                                            periodo 
                                       FROM bdviagem.tbauxperiodo";
                                            $resultadoPeriodo = mysqli_query($conexao, $sqlPeriodo) or die(mysqli_error());
                                            while ($rowPeriodo = mysqli_fetch_array($resultadoPeriodo, MYSQLI_ASSOC)) {
                                                ;
                                                $idperiodo = $rowPeriodo['idperiodo'];
                                                $periodo = $rowPeriodo['periodo'];
                                                print "<option value='$idperiodo'>$periodo</option>";
                                            }
                                            ?>
                                        </select>
                                    </div>
                                    <div class='col-md-6'>
                                        <label class='form-label' for='dias'> Total de Dias: </label>
                                        <input type='text' name='dias' id='dias' class='form-control' readonly>
                                    </div>
                                    <div class='col-sm-6'>
                                        <label class='mb-0 form-label' for='hospedagem'>Precisa de Hospedagem?<span
                                                style='color:red;'>*<span></label>
                                        <select class='form-select' name='hospedagem' id='hospedagem' required
                                            onchange="verifica(this.value)">
                                            <option value=''>Selecione...</option>
                                            <?php if ($intervalo < 90)
                                                print "
                                            <option value='0'>Não</option>
                                            <option value='1'>Sim</option>"; ?>
                                        </select>
                                    </div>
                                </div>
                                <!--col-sm-12 d-flex m-auto-->
                            </fieldset>
                        </div>
                        <!-- div questionário -->
                        <div class='mt-4 border-top pt-2'>
                            <fieldset>
                                <legend>Motivo da solicitação da viagem:</legend>
                                <p>Por favor selecione um ou mais motivos para solicitação da viagem do funcionário e
                                    preencha os campos relevantes para cada motivo selecionado:</p>
                                <div class='col-sm-6'>
                                    <label class='form-label' for='idmotivo'>Motivo: <span
                                            style='color: red;'>*</span></label>
                                    <div class="motivos">
                                        <select class='form-select' name='idmotivo' id='idmotivo' required
                                            onchange="verifica(this.value)">
                                            <option value="">Selecione...</option>
                                            <?php
                                            // Aqui você deve substituir pela sua lógica de conexão com o banco de dados e consulta
                                            $sqlMotivo = "SELECT idtbmotivo, 
                                           descricao 
                                      FROM bdviagem.tbmotivo";
                                            $resultadoMotivo = mysqli_query($conexao, $sqlMotivo) or die(mysqli_error());
                                            while ($rowMotivo = mysqli_fetch_array($resultadoMotivo, MYSQLI_ASSOC)) {
                                                $idMotivo = $rowMotivo['idtbmotivo'];
                                                $descMotivo = $rowMotivo['descricao'];
                                                echo "<option value='$idMotivo'>$descMotivo</option>";
                                            }
                                            ?>
                                        </select>
                                        <button type="button" class="btn btn-primary abrir-modal" data-bs-toggle="modal"
                                            data-bs-target="#modalMotivos">+</button>
                                    </div>
                                    <br>
                                    <div>
                                        <label class="text-left text-md text-gray-600"
                                            for="motivo_obs">Justificativa:<span style='color:red;'>*</span></label>
                                        <textarea name="motivo_obs" class="border border-black p-1 rounded-md"
                                            id="motivo_obs" cols="70" rows="3"
                                            placeholder="Por favor, insira uma Justificativa referente ao motivo da viagem."></textarea>
                                        <p id="msg_erro" style="color:red; display:none;">* A Justificativa deve conter
                                            pelo menos 10 caracteres e não deve conter caracteres especiais.</p>
                                    </div>
                                    <label class='mb-0 form-label' for='receita'>Receita:</label>
                                    <div class="input-group">
                                        <span class="input-group-text">R$</span>
                                        <input type='text' name='receita' id='receita'
                                            class='form-control' placeholder='0,00' onkeyup="formatarMoeda(this)">
                                    </div>
                                </div>
                            </fieldset>
                        </div>

                        <div class='mt-4 border-top pt-2'>
                            <fieldset>
                                <legend>Adiantamento de Viagem:</legend>
                                <div class='col-sm-6'>
                                    <label class='mb-0 form-label' for='adiantamento'>Precisa de adiantamento?<span
                                            style='color:red;'>*<span></label>
                                    <select class='form-select' name='adiantamento' id='adiantamento' required
                                        onchange="mostrarCamposAdiantamento(this.value)">
                                        <option value=''>Selecione...</option>
                                        <?php if ($intervalo < 90)
                                            print "
                                            <option value='0'>Não</option>
                                            <option value='1'>Sim</option>"; ?>
                                    </select>
                                </div>
                                <br>
                                <div class='col-sm-6'>
                                    <label class='mb-0 form-label' for='alimentacao'> Precisa de Alimentação?<span
                                            style='color:red;'>*<span></label>
                                    <select class='form-select' name='alimentacao' id='alimentacao' required
                                        onchange="mostrarCamposAdiantamento(this.value)">
                                        <option value=''>Selecione...</option>
                                        <?php if ($intervalo < 90)
                                            print "
                                            <option value='0'>Não</option>
                                            <option value='1'>Sim, Almoço</option>
                                            <option value='2'>Sim, Almoço e Janta</option>
                                            <option value='3'>Sim, Janta</option>"; ?>
                                    </select>
                                </div>
                            </fieldset>
                        </div>

                        <!-- Campos adicionais para adiantamento -->
                        <div id='campos_adiantamento' style='display: none;'>
                            <div class='col-sm-6'>
                                <label class='mb-0 form-label' for='valor_adiantamento'>Valor do Adiantamento:</label>
                                <div class="input-group">
                                    <span class="input-group-text">R$</span>
                                    <input type='text' name='valor_adiantamento' id='valor_adiantamento'
                                        class='form-control' placeholder='0,00' onkeyup="formatarMoeda(this)">
                                </div>
                            </div>
                            <div class='col-sm-6'>
                                <label class='mb-0 form-label' for='tipo_pix'>Chave Pix:<span
                                        style='color:red;'>*<span></label>
                                <select class='form-select' name='tipo_pix' id='tipo_pix' required
                                    onchange="verifica(this.value)">
                                    <option>Selecione...</option>
                                    <?php
                                    $sqlPix = "SELECT idpix, 
                                    tipo_pix 
                               FROM bdviagem.tbauxpix
                           ORDER BY tipo_pix";
                                    $resultadoPix = mysqli_query($conexao, $sqlPix) or die(mysqli_error());
                                    while ($rowPix = mysqli_fetch_array($resultadoPix, MYSQLI_ASSOC)) {
                                        ;
                                        $idPix = $rowPix['idpix'];
                                        $Pix = $rowPix['tipo_pix'];
                                        print "<option value='$idPix'>$Pix</option>";
                                    }
                                    ?>
                                </select>
                            </div>
                            <div class='col-sm-6'>
                                <label class='mb-0 form-label' for='chave_pix'>Informe a Chave Pix:</label>
                                <input type='text' name='chave_pix' id='chave_pix' class='form-control'
                                    placeholder='Pix'>
                            </div>
                            <div class="mt-4 col-12">
                                <p style='color: red;'> * Lembre-se que o Valor colocado de ADIANTAMENTO pode não ser o
                                    mesmo pago.</p>
                            </div>
                        </div>

                        <div class='mt-4 col-12 mt-2 align-items-center border-top'>
                            <fieldset>
                                <legend>Dados do solicitante:</legend>
                                <!--col-sm-12 d-flex m-auto-->
                                <div class='mt-3 row justify-content-start align-items-start'>
                                    <?php
                                    $sql3 = "SELECT idtbfuncionario,
                                  nome,
                                  matricula, 
                                  cargo,
                                  email 
                             FROM bdcorp.tbfuncionario 
                            WHERE matricula = '$solicitante' ";
                                    $resultado3 = mysqli_query($conexao, $sql3) or die(mysqli_error($conexao));
                                    $row3 = mysqli_fetch_array($resultado3, MYSQLI_BOTH);
                                    $idtbfuncionarioGerente = $row3['idtbfuncionario'];
                                    $nomesol = $row3['nome'];
                                    $matsolicitante = $row3['matricula'];
                                    $cargosol = $row3['cargo'];
                                    $emailsol = $row3['email'];
                                    // print_r($emailsol);
                                    // exit;
                                    print "              
                                    <!--div nome do solicitante -->
                                    <div class='col-12 mt-2 align-items-center'>
                                        <label class='form-label' for='nome_sol'> Nome do solicitante: <span style='color: red;'>*</span> </label>
                                        <input type='text' name='nome_sol' id='nome_sol' class='form-control' placeholder='Nome do Solicitante'  value='$nomesol' disabled>
                                    </div>";
                                    ?>
                                </div>
                                <!--col-sm-12 d-flex m-auto-->
                                <div class='mt-3 row justify-content-start align-items-start'>
                                    <?php
                                    print "              
                                    <!--div data da solicitação -->
                                    <div class='col-12 col-md-4 mt-2 align-items-center'>
                                        <label class='form-label' for='datasol'> Data da solicitação: <span style='color: red;'>*</span> </label>
                                        <input type='date' name='datasol' id='datasol' class='form-control'  value='$hojeformato' disabled>
                                    </div>
                                    <!--div cargo do solicitante -->
                                    <div class='col-12 col-md-8 mt-2 align-items-center'>
                                        <label class='form-label' for='cargo_sol'> Cargo do solicitante: <span style='color: red;'>*</span> </label>
                                        <input type='text' name='cargo_sol' id='cargo_sol' class='form-control' placeholder='Cargo do Solicitante'  value='$cargosol' disabled>
                                    </div>
                                    <input type='hidden' name='datasol' value='$datasol'>
                                    <input type='hidden' name='nome_sol' value='$nomesol'>             
                                    <input type='hidden' name='idsolicitante' value='$matriculasol'>
                                    <input type='hidden' name='tipo_enquete' value='$tipo_enquete'>
                                    <input type='hidden' name='usuario' value='$usuariof'>
                                    <input type='hidden' name='tipo' value='$tipo'>
                                    <input type='hidden' name='idfuncionario' value='$idtbfuncionario'>
                                    <input type='hidden' name='matfuncionario' value='$matr'>
                                    <input type='hidden' name='idsolicitante' value='$idtbfuncionarioGerente'>
                                    <input type='hidden' name='matsolicitante' value='$matsolicitante'>
                                    <input type='hidden' name='cargo_sol' value='$cargosol'>
                                    <input type='hidden' name='matricula1'value='$matricula1'>";
                                    ?>
                                </div>
                            </fieldset>
                        </div>
                        <!-- div campos obrigatorios-->
                        <div class="mt-4 col-12">
                            <p style='color: red;'> * Campos obrigatários. </p>
                        </div>
                        <!-- div botão-->
                        <div class="mt-4 col-12 justify-content-start d-flex">
                            <div class="col-6 text-center">
                                <button class="btn btn-success" type="submit"> Enviar </button>
                            </div>

                            <?php print "
                            <div class='col-6 text-center'>
                                <a href='$link'class='btn btn-danger'> Voltar </a>
                            </div>"; ?>
                        </div>
                    </form>
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
    <!-- Modal adicionar Motivos -->
    <div class="modal fade" id="modalMotivos" tabindex="-1" aria-labelledby="modalMotivosLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalMotivosLabel">Cadastrar de Motivos</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                </div>
                <div class="modal-body">
                    <form id="formMotivos" method="post" action="./control/modal/processa_MotivoModal.php">
                        <div class="mb-3">
                            <label for="descricao" class="form-label">Motivo</label>
                            <input type="text" class="form-control" id="descricao" name="descricao" required>
                            <?php print "<input type='hidden' name='tipo_enquete' value='$tipo_enquete'>" ?>
                        </div>
                        <div class="modal-footer">
                            <button type="submit" class="btn btn-primary">Enviar</button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                            <!-- <button type="button" class="btn btn-danger" id="deleteMotivoButton">Excluir</button> -->
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>


    <?php
    // Array com os estados e suas iniciais
    $estados = [
        'AC' => 'Acre',
        'AL' => 'Alagoas',
        'AP' => 'Amapá',
        'AM' => 'Amazonas',
        'BA' => 'Bahia',
        'CE' => 'Ceará',
        'DF' => 'Distrito Federal',
        'ES' => 'Espírito Santo',
        'GO' => 'Goiás',
        'MA' => 'Maranhão',
        'MT' => 'Mato Grosso',
        'MS' => 'Mato Grosso do Sul',
        'MG' => 'Minas Gerais',
        'PA' => 'Pará',
        'PB' => 'Paraíba',
        'PR' => 'Paraná',
        'PE' => 'Pernambuco',
        'PI' => 'Piauí',
        'RJ' => 'Rio de Janeiro',
        'RN' => 'Rio Grande do Norte',
        'RS' => 'Rio Grande do Sul',
        'RO' => 'Rondônia',
        'RR' => 'Roraima',
        'SC' => 'Santa Catarina',
        'SP' => 'São Paulo',
        'SE' => 'Sergipe',
        'TO' => 'Tocantins'
    ];

    ?>
    <!-- Modal adicionar Localidade -->
    <div class="modal fade" id="modalLocalidade" tabindex="-1" aria-labelledby="modalMotivosLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalMotivosLabel">Cadastramento de Localidade</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                </div>
                <div class="modal-body">
                    <form id="formMotivos" method="post" action="./control/modal/processa_Localidade.php">
                        <div class="mb-3">
                            <label for="nome" class="form-label">Localidade:</label>
                            <input type="text" class="form-control" id="nome" name="nome" required>
                        </div>
                        <div class="mb-3">
                            <label for="estado" class="form-label">Estado:</label>
                            <select class="form-select" id="estado" name="estado" required>
                                <option value="">Selecione...</option>
                                <?php
                                foreach ($estados as $sigla => $nome) {
                                    echo "<option value='$sigla'>$sigla - $nome</option>";
                                }
                                ?>
                            </select>
                        </div>
                        <div class="modal-footer">
                            <button type="submit" class="btn btn-primary">Enviar</button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                            <!-- <button type="button" class="btn btn-danger" id="deleteMotivoButton">Excluir</button> -->
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <!-- Modal de Exclusão -->
    <script>
        function verifica(valor) {
            // Aqui você pode adicionar qualquer lógica de validação que precisar
            if (valor === "") {
                alert("Por favor, selecione um motivo para a solicitação da viagem.");
                document.getElementById('idmotivo').focus(); // Define o foco de volta no campo motivo
                return false; // Evita que o formulário seja enviado
            }
            return true; // Permite que o formulário seja enviado
        }

        function calcularDataSol() {
            // Obter os valores dos campos
            const datasol = document.querySelector('input[name="datasol"]').value;
            const dataini = document.getElementById('dataini').value;

            // Verificar se ambos os campos têm valor
            if (!datasol || !dataini) {
                return; // Não faça nada se algum dos campos estiver vazio
            }

            // Converter os valores para objetos Date
            const dataSolDate = new Date(datasol);
            const dataIniDate = new Date(dataini);

            // Calcular a diferença em milissegundos
            const diferencaMillis = dataIniDate - dataSolDate;

            // Converter a diferença para dias
            const diferencaDias = Math.floor(diferencaMillis / (1000 * 60 * 60 * 24));

            // Verificar se a diferença é 2 dias ou menos
            if (diferencaDias <= 2 && diferencaDias >= 0) {
                alert('Faltam menos de 2 dias para a sua viagem solicitada, não podemos garantir que será aprovada a tempo');

            }
        }

        function calcularDiferencaDatas() {
            // Seleciona os elementos HTML
            const inputInicio = document.getElementById('dataini');
            const inputFim = document.getElementById('datafim');
            const resultado = document.getElementById('dias');

            // Obtém os valores dos campos de data
            const dataini = new Date(inputInicio.value);
            const datafim = new Date(inputFim.value);

            // Verifica se as datas são válidas
            if (isNaN(dataini.getTime()) || isNaN(datafim.getTime())) {
                resultado.value = '';
                return;
            }

            // Calcula a diferença em milissegundos entre as datas
            const diferencaMilissegundos = datafim.getTime() - dataini.getTime();

            // Converte a diferença de milissegundos para dias
            const diferencaDias = Math.round(diferencaMilissegundos / (1000 * 60 * 60 * 24));

            if (diferencaDias < 0) {
                resultado.value = 'A data final não pode ser anterior à data inicial.';
                return;
            }

            // Exibe o resultado arredondado para duas casas decimais
            if (diferencaDias === 1) {
                resultado.value = '1 dia';
            } else {
                resultado.value = `${diferencaDias} dias`;
            }
        }

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

        function mostrarCamposAdiantamento() {
            // Obtém os valores dos campos de seleção
            var adiantamentoValue = document.getElementById('adiantamento').value;
            var alimentacaoValue = document.getElementById('alimentacao').value;

            // Obtém os elementos dos campos adicionais
            var camposAdiantamento = document.getElementById('campos_adiantamento');
            var valorAdiantamento = document.getElementById('valor_adiantamento');

            // Verifica se pelo menos um dos campos tem o valor '1'
            if (adiantamentoValue === '1' || alimentacaoValue != '0') {
                // Se pelo menos um for 'Sim', mostra os campos adicionais
                camposAdiantamento.style.display = 'block';
            } else {
                // Se ambos forem 'Não', oculta os campos adicionais
                camposAdiantamento.style.display = 'none';
                valorAdiantamento.value = ''; // Limpa o valor
            }

            // Habilita ou desabilita o campo Valor do Adiantamento
            if (adiantamentoValue === '1') {
                valorAdiantamento.disabled = false; // Habilita
            } else {
                valorAdiantamento.disabled = true; // Desabilita
                valorAdiantamento.value = ''; // Limpa o valor quando desabilitado
            }
        }

        function validarEntrada(campo) {
            // Permite apenas letras, números e espaços
            const regex = /^[a-zA-Z0-9\s]*$/;
            const texto = campo.value;

            // Remove caracteres não permitidos
            const textoFiltrado = texto.split('').filter(char => regex.test(char)).join('');
            campo.value = textoFiltrado;

            // Exibe uma mensagem de erro se o texto tiver menos de 10 caracteres
            const msgErro = document.getElementById('msg_erro');
            if (campo.value.length < 10) {
                msgErro.style.display = 'block';
            } else {
                msgErro.style.display = 'none';
            }
        }
    </script>
</body>

</html>