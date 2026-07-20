<?php
session_start();
include "./conecta.php"; // Verifique o caminho correto do seu arquivo de conexão

// Carrega o autoloader do Composer para o PHPMailer
require '../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
// Verifica se a requisição é do tipo POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Verifica se os campos essenciais foram enviados
    if (isset($_POST['aceite'], $_POST['idtbsolviagem'], $_POST['matricula'])) {

        // --- 1. CAPTURAR OS DADOS DO FORMULÁRIO ---
        $aceite = $_POST['aceite']; // 1 para Aprovado, 2 para Recusado
        $idtbsolviagem = $_POST['idtbsolviagem'];
        $matricula_gerente = $_POST['matricula']; // Matricula de quem realiza a ação
        $data_acao = date('Y-m-d H:i:s');         // Data e hora da ação

        $sql_ccusto = "SELECT ccusto FROM bdcorp.tbfuncionario WHERE matriucla = '$matricula_gerente'";

        // --- 1. BUSCAR O CENTRO DE CUSTO DO GERENTE ---
        $sql_ccusto = "SELECT ccusto FROM bdcorp.tbfuncionario WHERE matricula = ?";
        $stmt_cc = $conexao->prepare($sql_ccusto);
        $stmt_cc->bind_param("s", $matricula_gerente);
        $stmt_cc->execute();
        $result_cc = $stmt_cc->get_result();
        $row_cc = $result_cc->fetch_assoc();

        $ccusto = $row_cc['ccusto'] ?? null;

        // --- 2. VERIFICAR SE O CCUSTO NÃO CONTÉM 'CLARO' ---
        if ($ccusto !== null && strpos(strtolower($ccusto), 'claro') === false) {
            $aceite_gergeral = 3;
        } else {
            $aceite_gergeral = null; // ou outro valor padrão
        }

        // --- 3. CAPTURAR OBSERVAÇÃO ---
        $observacao = !empty($_POST['observacao_gerente']) ? $_POST['observacao_gerente'] : null;

        // --- 4. PREPARAR E EXECUTAR A QUERY DE UPDATE ---
        if ($aceite == 1) {
            // Preparar a query
            $sql = "UPDATE bdviagem.tbsolviagem 
        SET aceite_do_diretor = ?, 
            data_aceite_gerente = ?, 
            matricula_aceite_gerente = ?, 
            observacao_gerente = ?,
            data_aceite_obs_gerente = ?, 
            aceite_gegeral = ?
        WHERE idtbsolviagem = ?";

            $stmt = $conexao->prepare($sql);

            // ⚠️ Verificar se o prepare funcionou
            if (!$stmt) {
                die("Erro no prepare: " . $conexao->error);
            }

            // Bind de parâmetros
            $stmt->bind_param("issssii", $aceite, $data_hoje, $matricula_gerente, $observacao, $data_hoje, $aceite_gergeral, $idtbsolviagem);

            $stmt->execute();

        } elseif ($aceite == 2) {
            // Nenhuma mudança aqui, pois não há observação na recusa
            $sql = "UPDATE bdviagem.tbsolviagem 
                    SET aceite_do_diretor = ?, 
                        data_aceite_gerente = ?, 
                        matricula_aceite_gerente = ? 
                    WHERE idtbsolviagem = ?";

            $stmt = $conexao->prepare($sql);
            $stmt->bind_param("issi", $aceite, $data_acao, $matricula_gerente, $idtbsolviagem);
        }

        // Executa a query preparada
        if ($stmt && $stmt->execute()) {

            // --- 3. ENVIAR E-MAIL DE NOTIFICAÇÃO (SE APROVADO) ---
            if ($aceite == 1) {
                // (O código de envio de e-mail permanece o mesmo da versão anterior, já está correto)
                $mail = new PHPMailer(true);
                try {
                    // Configurações do servidor
                    $mail->IsSMTP();
                    $mail->Port = 587;
                    $mail->Host = "smtp.ffainfraestrutura.com.br";
                    $mail->SMTPAuth = true;
                    $mail->Username = 'informatica@ffainfraestrutura.com.br';
                    $mail->Password = 'PFBaeX1V32yk9Ttq';
                    $mail->CharSet = 'UTF-8';

                    // Remetente e destinatário
                    $mail->setFrom('informatica@ffainfraestrutura.com.br', 'Portal de Viagem');
                    $mail->addAddress('carlosbarreto@ffainfraestrutura.com.br');

                    // Conteúdo
                    $mail->isHTML(true);
                    $mail->Subject = 'Viagem Aprovada - Notificação';

                    $corpoEmail = "<p>Uma solicitação de viagem foi <strong>aprovada</strong> pelo Gerente.</p>";

                    if (!empty($observacao)) {
                        $corpoEmail .= "<p><strong>Observação do Gerente:</strong> " . htmlspecialchars($observacao) . "</p>";
                    }

                    $corpoEmail .= "<p>Por favor, entre no portal de viagem para dar continuidade ao processo:</p>
                                    <p><a href='https://ffasip.ddns.net:4545/viagem/index.php'>Acessar Portal de Viagem</a></p>";

                    $mail->Body = $corpoEmail;
                    $mail->send();

                } catch (Exception $e) {
                    error_log('Erro ao enviar e-mail: ' . $mail->ErrorInfo);
                }
            }

            $_SESSION['feedback'] = ['tipo' => 'sucesso', 'mensagem' => 'A solicitação foi atualizada com sucesso!'];

        } else {
            $_SESSION['feedback'] = ['tipo' => 'erro', 'mensagem' => 'Erro ao atualizar a solicitação: ' . $stmt->error];
        }

        $stmt->close();

    } else {
        $_SESSION['feedback'] = ['tipo' => 'erro', 'mensagem' => 'Dados inválidos. A operação não pôde ser concluída.'];
    }
} else {
    $_SESSION['feedback'] = ['tipo' => 'erro', 'mensagem' => 'Método de requisição inválido.'];
}

// Redireciona de volta para a página de aprovações
header("Location: ../aprovacaocoordernador.php");
exit();
?>