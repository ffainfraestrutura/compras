<?php
include "../conecta.php";
$hoje = date('Y-m-d H:i:s');
session_start();

require '../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Capturar os dados do formulário
    $idtbsolviagem = !empty($_POST['idtbsolviagem']) ? (int) $_POST['idtbsolviagem'] : 0;
    $usar_id_manual = ($idtbsolviagem > 0);

    $idfuncionario = mysqli_real_escape_string($conexao, $_POST['idfuncionario']);
    $matfuncionario = mysqli_real_escape_string($conexao, $_POST['matfuncionario']);
    $nome = mysqli_real_escape_string($conexao, $_POST['nome']);
    $cpf = mysqli_real_escape_string($conexao, $_POST['cpf']);
    $dtnasc = mysqli_real_escape_string($conexao, $_POST['dtnasc']);
    $cargo_viajante = mysqli_real_escape_string($conexao, $_POST['cargo_viajante']);
    $departamento = mysqli_real_escape_string($conexao, $_POST['departamento']);
    $dataini = mysqli_real_escape_string($conexao, $_POST['dataini']);
    $datafim = mysqli_real_escape_string($conexao, $_POST['datafim']);
    $idfilial_origem = mysqli_real_escape_string($conexao, $_POST['idfilial_origem']);
    $periodo_ida = mysqli_real_escape_string($conexao, $_POST['periodo_ida']);
    $idfilial_destino = mysqli_real_escape_string($conexao, $_POST['idfilial_destino']);
    $periodo_volta = mysqli_real_escape_string($conexao, $_POST['periodo_volta']);
    $passagem_ida = mysqli_real_escape_string($conexao, $_POST['passagem_ida']);
    $passagem_volta = mysqli_real_escape_string($conexao, $_POST['passagem_volta']);
    $receita_raw = $_POST['receita'];
    // Remove pontos de milhar e converte vírgula para ponto
    $receita = str_replace('.', '', $receita_raw); // Remove pontos de milhar
    $receita = str_replace(',', '.', $receita);    // Converte vírgula para ponto
    $receita = (float) $receita;                   // Converte para float
    $receita = mysqli_real_escape_string($conexao, $receita);
    // TRATAMENTO DIAS - Extrair apenas o número
    $dias_raw = $_POST['dias'];
    $dias_numero = filter_var($dias_raw, FILTER_SANITIZE_NUMBER_INT);
    $dias = (int) $dias_numero;
    $dias = mysqli_real_escape_string($conexao, $dias);

    $hospedagem = mysqli_real_escape_string($conexao, $_POST['hospedagem']);
    $idmotivo = mysqli_real_escape_string($conexao, $_POST['idmotivo']);
    $motivo_obs = mysqli_real_escape_string($conexao, $_POST['motivo_obs']);

    // TRATAMENTO ADIANTAMENTO (provavelmente booleano/tinyint)
    $adiantamento_raw = $_POST['adiantamento'];
    $adiantamento = ($adiantamento_raw === '' || $adiantamento_raw === null) ? '0' : (int) $adiantamento_raw;
    $adiantamento = mysqli_real_escape_string($conexao, $adiantamento);

    // TRATAMENTO VALOR_ADIANTAMENTO (DECIMAL)
    $valor_adiantamento_raw = $_POST['valor_adiantamento'];
    if ($valor_adiantamento_raw === '' || $valor_adiantamento_raw === null) {
        $valor_adiantamento = 'NULL';
    } else {
        // Remover pontos de milhar e converter vírgula para ponto
        $valor_adiantamento = str_replace('.', '', $valor_adiantamento_raw); // Remove pontos de milhar
        $valor_adiantamento = str_replace(',', '.', $valor_adiantamento); // Converte vírgula decimal para ponto
        $valor_adiantamento = (float) $valor_adiantamento;
        $valor_adiantamento = "'" . mysqli_real_escape_string($conexao, $valor_adiantamento) . "'";
    }

    // TRATAMENTO TIPO_PIX
    $tipo_pix = $_POST['tipo_pix'];
    if ($tipo_pix === 'Selecione...' || $tipo_pix === '') {
        $tipo_pix = 'NULL';
    } else {
        $tipo_pix = "'" . mysqli_real_escape_string($conexao, $tipo_pix) . "'";
    }

    // TRATAMENTO CHAVE_PIX
    $chave_pix_raw = $_POST['chave_pix'];
    if ($chave_pix_raw === '') {
        $chave_pix = 'NULL';
    } else {
        $chave_pix = "'" . mysqli_real_escape_string($conexao, $chave_pix_raw) . "'";
    }

    $alimentacao = mysqli_real_escape_string($conexao, $_POST['alimentacao']);
    $idsolicitante = mysqli_real_escape_string($conexao, $_POST['idsolicitante']);
    $matsolicitante = mysqli_real_escape_string($conexao, $_POST['matsolicitante']);
    $nome_sol = mysqli_real_escape_string($conexao, $_POST['nome_sol']);
    $datasol = mysqli_real_escape_string($conexao, $_POST['datasol']);
    $cargo_sol = mysqli_real_escape_string($conexao, $_POST['cargo_sol']);
    $aceite_do_diretor = '1';
    $matricula1 = mysqli_real_escape_string($conexao, $_POST['matricula1']);

    $aceite_gegeral = null;
    if (
        $matsolicitante == '003051' ||
        str_contains(strtoupper($departamento), 'CLARO PR') ||
        !str_contains(strtoupper($departamento), 'CLARO') ||
        str_contains(strtoupper($departamento), 'CLARO MG')
    ) {
        $aceite_gegeral = 3;
    }

    if ($matsolicitante == '024097') {
        $aceite_do_diretor = 3; // Altera o valor do aceite do diretor
        $aceite_gegeral = 3;    // Define aceite_geral
        $nivel_coo = 1;         // Define nível_coo
    }

    // Construir a SQL
    $campos = "matfuncionario, nome, cpf, dtnasc, cargo_viajante, 
               departamento, dataini, datafim, idfilial_origem, periodo_ida, idfilial_destino, 
               periodo_volta, passagem_ida, passagem_volta, dias, hospedagem, idmotivo, motivo_obs, 
               adiantamento, receita, valor_adiantamento, tipo_pix, chave_pix, alimentacao, idsolicitante, 
               matsolicitante, nome_sol, datasol, cargo_sol, aceite_do_diretor, mat_aceite_gerente";

    $valores = "'$matfuncionario', '$nome', '$cpf', '$dtnasc', 
                '$cargo_viajante', '$departamento', '$dataini', '$datafim', '$idfilial_origem', 
                '$periodo_ida', '$idfilial_destino', '$periodo_volta', '$passagem_ida', '$passagem_volta', 
                '$dias', '$hospedagem', '$idmotivo', '$motivo_obs', '$adiantamento', '$receita', 
                $valor_adiantamento, $tipo_pix, $chave_pix, '$alimentacao', '$idsolicitante', 
                '$matsolicitante', '$nome_sol', '$datasol', '$cargo_sol', '$aceite_do_diretor', '$matricula1'";


    // Adicionar aceite_gegeral se necessário
    if ($aceite_gegeral !== null) {
        $campos .= ", aceite_gegeral";
        $valores .= ", '$aceite_gegeral'";
    }

    if ($nivel_coo !== null) {
        $campos .= ", nivel_coo";
        $valores .= ", '$nivel_coo'";
    }

    $sql = "INSERT INTO bdviagem.tbsolviagem ($campos) VALUES ($valores)";

    // Executar a consulta SQL
    $resultado = mysqli_query($conexao, $sql);

    if (!$resultado) {
        die("Erro MySQL: " . mysqli_error($conexao));
    }

    echo "<script>
            alert('Solicitação de viagem cadastrada com sucesso!');
            window.location.href='../telainicialgerenteclaro.php';
        </script>";

}
?>
<!-- $sql = "SELECT email FROM bdcorp.tbusuario WHERE matricula = '$matsolicitante'";
    $resultado = mysqli_query($conexao, $sql) or die(mysqli_error($conexao));
    $row = mysqli_fetch_array($resultado, MYSQLI_BOTH);
    $email = $row['email'];

    $sqlSegEmail = "SELECT g.matricula AS matricula_gerente,  
                           g.nome AS nome_gerente,            
                           d.nome AS nome_diretor,            
                           u.email AS email_diretor           
                      FROM bdcorp.tbgerente g
                      JOIN bdcorp.tbdiretor d ON g.idtbdiretor = d.idtbdiretor
                      JOIN bdcorp.tbusuario u ON d.matricula = u.matricula
                     WHERE g.matricula = '$matsolicitante'";
    $resultado = mysqli_query($conexao, $sqlSegEmail) or die(mysqli_error($conexao));
    $row = mysqli_fetch_array($resultado, MYSQLI_BOTH);
    $email_diretor = $row['email_diretor'];
    $nome_gerente = $row['nome_gerente'];
    $nome_diretor = $row['nome_diretor'];

    if ($resultado) {
        // Configuração do primeiro e-mail
        $mail = new PHPMailer(true);

        try {
            // Configurações do servidor de e-mail
            $mail->IsSMTP();
            $mail->Port = 587;
            $mail->Host = "smtp.ffainfraestrutura.com.br";
            $mail->SMTPAuth = true;
            $mail->Username = 'informatica@ffainfraestrutura.com.br';
            $mail->Password = 'PFBaeX1V32yk9Ttq';

            // // Remetente e destinatário
            $mail->setFrom('informatica@ffainfraestrutura.com.br', 'Portal de Viagem');
            $mail->addAddress($email_diretor, $nome_diretor);

            $mail->CharSet = 'UTF-8';
            $mail->Encoding = 'base64';

            // Conteúdo do o Email do diretor do Solicitante
            $mail->isHTML(true);
            $mail->Subject = 'Viagem solicitada com sucesso';
            $mail->Body = "<p>Prezado(a) $nome_diretor,</p>
                           <p> O  $nome_gerente solicitou uma viagem para o colaborador $nome,</p>
                           <p>por favor acessar o portal para mais detalhes</p>
                           <p> https://ffasip.ddns.net:4545/viagem/index.php </p>
                           <p>Aguarde, por mais atualizações!</p>
                           <p>Atenciosamente,</p>";
            // Enviar primeiro e-mail
            $mail->send();

            // Enviar o segundo e-mail(Para o Solicitante (Gerente))
            $mail->clearAddresses(); // Limpar o destinatário anterior
            $mail->addAddress($email, $nome_sol); // Novo destinatário
            // Conteúdo do segundo e-mail
            $mail->Body = "<p>Prezado(a) $nome_sol,</p>
                           <p>Sua Solicitação para o $nome foi concluida com sucesso!</p>
                           <p>Atenciosamente,</p>
                           <p>Equipe de Viagens</p>";
            // Enviar segundo e-mail
            $mail->send();
            echo "<script>alert('Solicitação de viagem cadastrada com sucesso e e-mails enviados.'); window.location.href = '../historicodesolicitacao.php';</script>";
        } catch (Exception $e) {
            echo "Erro ao enviar o e-mail porém sua solicitação foi feita com sucesso: {$mail->ErrorInfo}";

            // Redireciona para a tela inicial após um pequeno atraso (opcional)
            header("Refresh: 1; url=../historicodesolicitacao.php"); // Substitua 'index.php' pelo caminho da sua tela inicial
            exit; // Encerra a execução do script
        }
    } else {
        echo "Erro ao cadastrar solicitação de viagem: " . mysqli_error($conexao);
    }
} else {
    echo "Método de requisição inválido.";
}
?> -->