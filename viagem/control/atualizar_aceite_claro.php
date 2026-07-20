<?php
date_default_timezone_set('America/Sao_Paulo');
session_start();
include "./conecta.php"; // Verifique o caminho correto do seu arquivo de conexão

require '../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Ativar exibição de erros
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (isset($_POST['aceite']) && isset($_POST['idtbsolviagem'])) {
        $aceite = $_POST['aceite'];
        $idtbsolviagem = $_POST['idtbsolviagem'];
        $nome = $_POST['nome'];
        $matsolicitante = $_POST['matsolicitante'];
        $matricula1 = $_POST['matricula'];
        $jutificativa = $_POST['justificativa'];
        $data = date('Y-m-d H:i:s');

        if ($aceite == 3) {
            $nivel_coo = 1;
        } elseif ($aceite == 2) {
            $nivel_coo = "NULL";
        } else {
            $nivel_coo = "NULL"; // padrão
        }

        // Log básico
        error_log("Iniciando o processamento para aceite: $aceite, ID: $idtbsolviagem");

        // Consulta para buscar o e-mail do solicitante
        $sql = "SELECT email FROM bdcorp.tbusuario WHERE matricula = '$matsolicitante'";
        $resultado = mysqli_query($conexao, $sql);

        if (!$resultado) {
            error_log("Erro na consulta SQL: " . mysqli_error($conexao));
            die("<script>alert('Erro ao buscar e-mail do solicitante.');</script>");
        }

        $row = mysqli_fetch_array($resultado, MYSQLI_BOTH);
        $email = $row['email'];

        // Atualiza o banco de dados
        $updateSql = "UPDATE bdviagem.tbsolviagem 
              SET aceite_do_diretor = $aceite, 
                  data_aceite_diretor = '$data',
                  mat_aceite_diretor = '$matricula1',
                  observacao_diretor = '$jutificativa',
                  nivel_coo = " . ($nivel_coo === "NULL" ? "NULL" : "'$nivel_coo'") . " 
              WHERE idtbsolviagem = $idtbsolviagem";

        


        if (!mysqli_query($conexao, $updateSql)) {
            error_log("Erro ao atualizar aceite: " . mysqli_error($conexao));
            die("<script>alert('Erro ao atualizar aceite no banco de dados.');</script>");
        }

        // Se aceite for igual a 3, enviar e-mail
        if ($aceite == 3) {
            // $destinatarios = [
            //     // 'dp@ffainfraestrutura.com.br',
            //     'dp2@ffainfraestrutura.com.br',
            //     'giseleamancio@ffainfraestrutura.com.br',
            //     'carlosjunior@ffainfraestrutura.com.br',
            //     'franciscosousa@ffainfraestrutura.com.br',
            //     'administrativo@ffainfraestrutura.com.br'
            // ];
            // foreach ($destinatarios as $destinatario) {
            //     $mail = new PHPMailer(true);

            //     try {
            //         // Configurações do servidor de e-mail
            //         $mail->isSMTP();
            //         $mail->Host = "smtp.ffainfraestrutura.com.br";
            //         $mail->SMTPAuth = true;
            //         $mail->Username = 'informatica@ffainfraestrutura.com.br';
            //         $mail->Password = 'PFBaeX1V32yk9Ttq';
            //         $mail->Port = 587;

            //         // Remetente
            //         $mail->setFrom('informatica@ffainfraestrutura.com.br', 'Portal de Viagem');

            //         // Destinatário único
            //         $mail->addAddress($destinatario);

            //         // Conteúdo do e-mail
            //         $mail->CharSet = 'UTF-8';
            //         $mail->isHTML(true);
            //         $mail->Subject = 'Portal de Viagem';
            //         $mail->Body = "<p>Olá,</p>
            //                        <p>Uma solicitação foi aprovada pelo Diretor.</p>
            //                        <p>Para mais detalhes, clique no link abaixo:</p>
            //                        <p><a href='https://ffasip.ddns.net:4545/viagem/index.php'>Clique aqui para acessar o Portal de Viagem</a></p>
            //                        <p>Atenciosamente,</p>
            //                        <p>Equipe Portal de Viagem</p>";
            //         // Envia o e-mail
            //         if ($mail->send()) {
            //             error_log("E-mail enviado com sucesso para $destinatario.");
            //         } else {
            //             error_log("Erro ao enviar e-mail para $destinatario: " . $mail->ErrorInfo);
            //         }
            //     } catch (Exception $e) {
            //         error_log("Exceção ao enviar e-mail para $destinatario: " . $e->getMessage());
            //     }
            // }

            echo "<script>alert('Atualizado com sucesso e e-mails enviados!');</script>";
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