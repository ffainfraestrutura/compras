<?php
date_default_timezone_set('America/Sao_Paulo');
session_start();
include "./conecta.php"; // Verifique o caminho correto do seu arquivo de conexão

require '../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Verifica se foi enviado o valor do aceite
    if (isset($_POST['aceite']) && isset($_POST['idtbsolviagem'])) {
        $aceite = $_POST['aceite'];
        $idtbsolviagem = $_POST['idtbsolviagem'];
        $nome = $_POST['nome'];
        $matsolicitante = $_POST['matsolicitante'];
        $matricula1 = $_POST['matricula'];
        $data = date('Y-m-d H:i:s'); 

        // Defina a consulta SQL para buscar o email do solicitante
        $sql = "SELECT email FROM bdcorp.tbusuario WHERE matricula = '$matsolicitante'";
        $resultado = mysqli_query($conexao, $sql) or die(mysqli_error($conexao));
        $row = mysqli_fetch_array($resultado, MYSQLI_BOTH);
        $email = $row['email'];

        // Atualiza o banco de dados
        $updateSql = "UPDATE bdviagem.tbsolviagem 
                            SET aceite_do_diretor = $aceite, 
                                data_aceite_diretor = '$data',
                                mat_aceite_diretor = '$matricula1' 
                            WHERE idtbsolviagem = $idtbsolviagem";
        if (mysqli_query($conexao, $updateSql)) {
            // Verifica se o aceite é igual a 3
            if ($aceite == 3) {
                // Configura o PHPMailer
                $mail = new PHPMailer(true);

                try {
                    // Configurações do servidor de e-mail
                    $mail->IsSMTP();
                    $mail->Port = 587;
                    $mail->Host = "smtp.ffainfraestrutura.com.br";
                    $mail->SMTPAuth = true;
                    $mail->Username = 'informatica@ffainfraestrutura.com.br';
                    $mail->Password = 'PFBaeX1V32yk9Ttq';

                    // Remetente e destinatário
                    $mail->setFrom('informatica@ffainfraestrutura.com.br', 'Portal de Viagem');
                    // JULIA ENTROU DE FERIAS TIVE QUE FAZER A TROCA 
                    // $mail->addAddress('dp@ffainfraestrutura.com.br');
                    $mail->addAddress('dp2@ffainfraestrutura.com.br');
                    $mail->addAddress('giseleamancio@ffainfraestrutura.com.br');
                    $mail->addAddress('carlosjunior@ffainfraestrutura.com.br');
                    $mail->addAddress('franciscosousa@ffainfraestrutura.com.br');
                    $mail->addAddress('administrativo@ffainfraestrutura.com.br');

                    // Conteúdo do e-mail
                    $mail->CharSet = 'UTF-8';
                    $mail->Encoding = 'base64';
                    $mail->isHTML(true);
                    $mail->Subject = 'Portal de Viagem';
                    $mail->Body = "<p>Uma solicitação foi aprovada pelo Gerente, </p>
                                   <p><a href='https://ffasip.ddns.net:4545/viagem/index.php'>Clique aqui para mais detalhes</a></p>";

                    // Envia o e-mail
                    $mail->send();

                    echo "<script>alert('Atualizado com sucesso e e-mail enviado!');</script>";
                } catch (Exception $e) {
                    echo "<script>alert('Atualizado com sucesso, mas não foi possível enviar o e-mail. Erro: " . $mail->ErrorInfo . "');</script>";
                }
            }
        } else {
            echo "<script>alert('Erro ao atualizar aceite: " . mysqli_error($conexao) . "');</script>";
        }
    } else {
        echo "<script>alert('Parâmetros inválidos para atualização de aceite.');</script>";
    }
} else {
    echo "<script>alert('Método de requisição inválido para atualização de aceite.');</script>";
}

// Redireciona de volta para a página de solicitações de viagem
echo "<script>window.location='../aprovacaododiretor.php';</script>";
?>
