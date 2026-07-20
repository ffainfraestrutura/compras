<?php
session_start();
include "./conecta.php"; // Verifique o caminho correto do seu arquivo de conexão

require '../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Verifica se foi enviado o valor do aceite (1 para Sim, 0 para Não)
    if (isset($_POST['aceite']) && isset($_POST['idtbsolviagem'])) {

        $aceite = $_POST['aceite'];
        $idtbsolviagem = $_POST['idtbsolviagem'];
        $nome = $_POST['nome'];
        $matricula1 = $_POST['matricula'];
        $data = date('Y-m-d H:i:s');

        // $sql = "SELECT email FROM bdcorp.tbusuario WHERE matricula = '$matsolicitante'";
        // $resultado = mysqli_query($conexao, $sql) or die(mysqli_error($conexao));
        // $row = mysqli_fetch_array($resultado, MYSQLI_BOTH);
        // $email = $row['email'];

        if ($aceite == 1) {
            $aceiteTextoIda = 'Aprovada';
        } elseif ($aceite == 2) {
            $aceiteTextoIda = 'Negada';
        }

        // Atualiza o banco de dados
        $updateSql = "UPDATE bdviagem.tbsolviagem SET aceite_do_diretor = $aceite, data_aceite_gerente = '$data' , mat_aceite_gerente  = '$matricula1' WHERE idtbsolviagem = $idtbsolviagem";

        if (mysqli_query($conexao, $updateSql)) {
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
                $mail->setFrom('informatica@ffainfraestrutura.com.br', 'Portal de Viagem'); // Substitua pelo seu e-mail e nome
                $mail->addAddress('josecordebel@ffainfraestrutura.com.br');

                $mail->CharSet = 'UTF-8';
                $mail->Encoding = 'base64';

                // Conteúdo do e-mail
                $mail->isHTML(true);
                $mail->Subject = 'Aprovação da Viagem';
                $mail->Body = "<p>Prezado(a)</p>
                <p> Sua solicitação de viagem foi $aceiteTextoIda.</p>
                <p> Para o Funcionário: $nome </p>
                <p> <a href='https://ffasip.ddns.net:4545/viagem/index.php'>Clique aqui para mais detalhes</a></p>
                <p>Aguarde, por mais atualizações!</p>
                <p>Atenciosamente,</p>";

                // Verifique os dados do e-mail antes de enviar (teste)
                echo "<pre>";
                echo "Remetente: informatica@ffainfraestrutura.com.br\n";
                echo "Destinatário: josecordebel@ffainfraestrutura.com.br\n";
                echo "Assunto: Aprovação da Viagem\n";
                echo "Corpo do e-mail: " . $mail->Body . "\n";
                echo "</pre>";
                exit(); // Interrompe a execução do código antes de enviar o e-mail

                // Envia o e-mail
                $mail->send();
                echo "<script>alert('Atualizado com sucesso e e-mails enviados!');</script>";

            } catch (Exception $e) {
                echo "<script>alert('Atualizado com sucesso, mas não foi possível enviar os e-mails. Erro: " . $mail->ErrorInfo . "');</script>";
            }
        }
    }
}
// Redireciona de volta para a página de solicitações de viagem
echo "<script>window.location='../aprovacaocoordernador.php';</script>";
?>