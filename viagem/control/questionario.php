<?php
include "../conecta.php";
$hoje = date('Y-m-d H:i:s');
session_start();

// Ativar exibição de erros para debug (remova em produção)

require '../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Capturar os dados do formulário
    $idtbsolviagem = $_POST['idtbsolviagem'];
    $idfuncionario = $_POST['idfuncionario'];
    $matfuncionario = $_POST['matfuncionario'];
    $nome = mysqli_real_escape_string($conexao, $_POST['nome']);
    $cpf = $_POST['cpf'];

    // TRATAMENTO PARA DATA DE NASCIMENTO
    $dtnasc = $_POST['dtnasc'];
    if (empty($dtnasc)) {
        $dtnasc = 'NULL';
    } else {
        $dtnasc = "'" . $dtnasc . "'";
    }

    $cargo_viajante = mysqli_real_escape_string($conexao, $_POST['cargo_viajante']);
    $departamento = mysqli_real_escape_string($conexao, $_POST['departamento']);
    $dataini = $_POST['dataini'];
    $datafim = $_POST['datafim'];
    $idfilial_origem = $_POST['idfilial_origem'];
    $periodo_ida = $_POST['periodo_ida'];
    $idfilial_destino = $_POST['idfilial_destino'];
    $periodo_volta = $_POST['periodo_volta'];
    $passagem_ida = $_POST['passagem_ida'];
    $passagem_volta = $_POST['passagem_volta'];
    $receita_raw = $_POST['receita'];
    // Remove pontos de milhar e converte vírgula para ponto
    $receita = str_replace('.', '', $receita_raw); // Remove pontos de milhar
    $receita = str_replace(',', '.', $receita);    // Converte vírgula para ponto
    $receita = (float) $receita;                   // Converte para float
    $receita = mysqli_real_escape_string($conexao, $receita);

    // TRATAMENTO PARA DIAS
    $dias = $_POST['dias'];
    if (strpos($dias, ' ') !== false) {
        $partes = explode(' ', $dias);
        $dias = $partes[0];
    }
    $dias = intval($dias);

    $hospedagem = $_POST['hospedagem'];
    $idmotivo = $_POST['idmotivo'];
    $motivo_obs = mysqli_real_escape_string($conexao, $_POST['motivo_obs']);
    $adiantamento = $_POST['adiantamento'];

    // TRATAMENTO PARA VALOR_ADIANTAMENTO
    $valor_adiantamento = $_POST['valor_adiantamento'];
    if (empty($valor_adiantamento)) {
        $valor_adiantamento = 0;
    } else {
        $valor_adiantamento = str_replace(['R$', '.', ','], ['', '', '.'], $valor_adiantamento);
        $valor_adiantamento = floatval($valor_adiantamento);
    }

    // TRATAMENTO ESPECIAL PARA TIPO_PIX
    $tipo_pix = $_POST['tipo_pix'];
    // Se for "Selecione..." ou vazio, definir como NULL ou string vazia
    if ($tipo_pix == 'Selecione...' || empty($tipo_pix)) {
        $tipo_pix = 'NULL'; // Para campos que aceitam NULL
        // Ou se o campo não aceitar NULL, use:
        // $tipo_pix = "''"; // String vazia
    } else {
        $tipo_pix = "'" . mysqli_real_escape_string($conexao, $tipo_pix) . "'";
    }

    // TRATAMENTO PARA CHAVE_PIX
    $chave_pix = $_POST['chave_pix'];
    if (empty($chave_pix)) {
        $chave_pix = 'NULL';
    } else {
        $chave_pix = "'" . mysqli_real_escape_string($conexao, $chave_pix) . "'";
    }

    $alimentacao = $_POST['alimentacao'];
    $idsolicitante = $_POST['idsolicitante'];
    $matsolicitante = $_POST['matsolicitante'];
    $nome_sol = mysqli_real_escape_string($conexao, $_POST['nome_sol']);
    $datasol = $_POST['datasol'];
    $cargo_sol = mysqli_real_escape_string($conexao, $_POST['cargo_sol']);

    // Preparar a consulta SQL para inserir os dados no banco de dados
    $sql = "INSERT INTO bdviagem.tbsolviagem (
                                              idfuncionario,
                                              matfuncionario,
                                              nome,
                                              cpf,
                                              dtnasc,
                                              receita,
                                              cargo_viajante,
                                              departamento,
                                              dataini,
                                              datafim,
                                              idfilial_origem,
                                              periodo_ida,
                                              idfilial_destino,
                                              periodo_volta,
                                              passagem_ida,
                                              passagem_volta,
                                              dias,
                                              hospedagem,
                                              idmotivo,
                                              motivo_obs,
                                              adiantamento,
                                              valor_adiantamento,
                                              tipo_pix,
                                              chave_pix,
                                              alimentacao,
                                              idsolicitante,
                                              matsolicitante,
                                              nome_sol,
                                              datasol,
                                              cargo_sol)
        VALUES (
               '$idfuncionario',
               '$matfuncionario',
               '$nome',
               '$cpf',
               $dtnasc,
               '$receita',
               '$cargo_viajante',
               '$departamento',
               '$dataini',
               '$datafim',
               '$idfilial_origem',
               '$periodo_ida',
               '$idfilial_destino',
               '$periodo_volta',
               '$passagem_ida',
               '$passagem_volta',
               $dias,
               '$hospedagem',
               '$idmotivo',
               '$motivo_obs',
               '$adiantamento',
               $valor_adiantamento,
               $tipo_pix,  /* Agora tratado corretamente */
               $chave_pix, /* Agora tratado corretamente */
               '$alimentacao',
               '$idsolicitante',
               '$matsolicitante',
               '$nome_sol',
               '$datasol',
               '$cargo_sol')";


    // Executar a consulta SQL e VERIFICAR se funcionou
    $resultado_insert = mysqli_query($conexao, $sql);

    if (!$resultado_insert) {
        die("Erro no INSERT: " . mysqli_error($conexao) . "<br>SQL: " . $sql);
    }


    // CONTINUAÇÃO DO CÓDIGO PARA EMAILS...
    // Buscar email do solicitante
    $sql_email = "SELECT email FROM bdcorp.tbusuario WHERE matricula = '$matsolicitante'";
    $resultado_email = mysqli_query($conexao, $sql_email) or die("Erro na consulta de email: " . mysqli_error($conexao));

    if (mysqli_num_rows($resultado_email) > 0) {
        $row_email = mysqli_fetch_array($resultado_email, MYSQLI_BOTH);
        $email_solicitante = $row_email['email'];
    } else {
        die("Nenhum email encontrado para a matrícula: " . $matsolicitante);
    }

    // Buscar email do gerente
    $sqlSegEmail = "SELECT c.matricula AS matricula_coordenador, 
                           c.nome AS nome_coordenador, 
                           gu.nome AS nome_usuario, 
                           gu.email AS email_usuario,
                           g.matricula AS matricula_gerente, 
                           g.nome AS nome_gerente, 
                           gu_gerente.email AS email_gerente
                      FROM bdcorp.tbcoord c
                 LEFT JOIN bdcorp.tbgerente g ON c.idtbgerente = g.idtbgerente
                 LEFT JOIN bdcorp.tbusuario gu ON gu.matricula = '$matsolicitante'
                 LEFT JOIN bdcorp.tbusuario gu_gerente ON gu_gerente.matricula = g.matricula
                     WHERE c.matricula = gu.matricula";

    $resultado_gerente = mysqli_query($conexao, $sqlSegEmail) or die("Erro na consulta do gerente: " . mysqli_error($conexao));

    if (mysqli_num_rows($resultado_gerente) > 0) {
        $row_gerente = mysqli_fetch_array($resultado_gerente, MYSQLI_BOTH);
        $email_gerente = $row_gerente['email_gerente'];
        $nome_gerente = $row_gerente['nome_gerente'];
        $nome_usuario = $row_gerente['nome_usuario'];


        if (empty($email_gerente)) {
            // die("Email do gerente está vazio!");
        }
    } else {
        die("Nenhum gerente encontrado para o solicitante: " . $nome_usuario);
    }
    echo "<script>alert('Solicitação de viagem cadastrada com sucesso e e-mails enviados.'); window.location.href = '../historicodesolicitacao.php';</script>";



    // Configuração do e-mail
    $mail = new PHPMailer(true);

    try {
        // Configurações do servidor de e-mail
        $mail->IsSMTP();
        $mail->Port = 587;
        $mail->Host = "smtp.ffainfraestrutura.com.br";
        $mail->SMTPAuth = true;
        $mail->Username = 'informatica@ffainfraestrutura.com.br';
        $mail->Password = 'PFBaeX1V32yk9Ttq';
        $mail->SMTPSecure = 'tls';

        // Remetente
        $mail->setFrom('informatica@ffainfraestrutura.com.br', 'Portal de Viagem');

        // Configurações de codificação
        $mail->CharSet = 'UTF-8';
        $mail->Encoding = 'base64';

        // E-mail para o gerente
        $mail->addAddress($email_gerente, $nome_gerente);

        // Conteúdo do e-mail
        $mail->isHTML(true);
        $mail->Subject = 'Viagem solicitada com sucesso';
        $mail->Body = "<p>Prezado(a) $nome_gerente,</p>
                       <p>O <strong>$nome_usuario</strong> solicitou uma viagem para <strong>$nome</strong>.</p>
                       <p>Período: $dataini a $datafim</p>
                       <p>Por favor, acesse o portal para mais detalhes:</p>
                       <p><a href='https://ffasip.ddns.net:4545/viagem/index.php'>Clique aqui para mais detalhes</a></p>
                       <p>Atenciosamente,<br>Equipe de Viagens</p>";

        // Enviar e-mail para o gerente
        if ($mail->send()) {
        }

        // Enviar e-mail de confirmação para o solicitante
        $mail->clearAddresses();
        $mail->addAddress($email_solicitante, $nome_sol);
        $mail->Subject = 'Solicitação de viagem confirmada';
        $mail->Body = "<p>Prezado(a) $nome_sol,</p>
                       <p>Sua solicitação de viagem para <strong>$nome</strong> foi cadastrada com sucesso!</p>
                       <p><strong>Detalhes da viagem:</strong></p>
                       <ul>
                           <li>Período: $dataini a $datafim</li>
                           <li>Dias: $dias</li>
                           <li>Destino: " . ($idfilial_destino) . "</li>
                       </ul>
                       <p>Você receberá atualizações por e-mail.</p>
                       <p>Atenciosamente,<br>Equipe de Viagens</p>";

        if ($mail->send()) {
        }

        // Redirecionar após sucesso

    } catch (Exception $e) {

        header("refresh:5;url=../historicodesolicitacao.php");
        exit;
    }
    echo "<script>alert('Solicitação de viagem cadastrada com sucesso e e-mails enviados.'); window.location.href = '../historicodesolicitacao.php';</script>";


} else {
    echo "Método de requisição inválido.";

}
echo "<script>alert('Solicitação de viagem cadastrada com sucesso e e-mails enviados.'); window.location.href = '../historicodesolicitacao.php';</script>";

?>