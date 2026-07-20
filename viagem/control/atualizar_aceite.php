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

// Verificar se a sessão tem os dados necessários
if (!isset($_SESSION['usuario']) || !isset($_SESSION['matricula'])) {
    die("<script>alert('Sessão inválida. Faça login novamente.'); window.location.href='../index.php';</script>");
}

$usuariof = $_SESSION['usuario'];
$matricula1 = $_SESSION['matricula'];

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (isset($_POST['aceite']) && isset($_POST['idtbsolviagem']) && isset($_POST['matsolicitante'])) {
        $aceite = $_POST['aceite'];
        $idtbsolviagem = $_POST['idtbsolviagem'];
        $matsolicitante = $_POST['matsolicitante'];
        $data = date('Y-m-d H:i:s');
        
        // NOVO: Receber a observação do POST. Se não vier, define como uma string vazia.
        $observacao_diretor = isset($_POST['observacao_diretor']) ? $_POST['observacao_diretor'] : '';

        // Usar a matrícula da sessão em vez do POST
        // $matricula1 já está definida da sessão acima

        // Determinar o nivel_coo baseado na matrícula com valor padrão 0        
        $nivel_coo = 0; // Valor padrão para outras matrículas

        if ($matricula1 == '270907') {
            $nivel_coo = 2;
        } elseif ($matricula1 == '601004' || $matricula1 == '001126' || $matricula1 == '583313') {
            $nivel_coo = 1;
        }

        // Log básico
        error_log("Iniciando o processamento para aceite: $aceite, ID: $idtbsolviagem, Matrícula: $matricula1, Nível COO: $nivel_coo");

        // Consulta para buscar o e-mail do solicitante (não precisa mudar)
        $sql = "SELECT email FROM bdcorp.tbusuario WHERE matricula = ?";
        $stmt = mysqli_prepare($conexao, $sql);

        if (!$stmt) {
            error_log("Erro ao preparar consulta SQL: " . mysqli_error($conexao));
            die("<script>alert('Erro ao buscar e-mail do solicitante.');</script>");
        }

        mysqli_stmt_bind_param($stmt, "s", $matsolicitante);
        mysqli_stmt_execute($stmt);
        $resultado = mysqli_stmt_get_result($stmt);
        
        // ... (código para pegar o e-mail continua o mesmo)

        // MODIFICADO: Atualiza o banco de dados incluindo a observação
        $updateSql = "UPDATE bdviagem.tbsolviagem 
                      SET aceite_do_diretor = ?, 
                          data_aceite_diretor = ?,
                          mat_aceite_diretor = ?,
                          nivel_coo = ?,
                          observacao_diretor = ? 
                      WHERE idtbsolviagem = ?";

        $stmt = mysqli_prepare($conexao, $updateSql);

        if (!$stmt) {
            error_log("Erro ao preparar atualização: " . mysqli_error($conexao));
            die("<script>alert('Erro ao preparar atualização no banco de dados.');</script>");
        }
        
        // MODIFICADO: Adiciona a nova variável e seu tipo ('s' de string) no bind_param
        mysqli_stmt_bind_param($stmt, "issisi", $aceite, $data, $matricula1, $nivel_coo, $observacao_diretor, $idtbsolviagem);

        if (!mysqli_stmt_execute($stmt)) {
            error_log("Erro ao atualizar aceite: " . mysqli_error($conexao));
            die("<script>alert('Erro ao atualizar aceite no banco de dados.');</script>");
        }

        // A lógica de envio de e-mail pode continuar a mesma
        if ($aceite == 3) {
            // ... seu código de envio de e-mail ...
            // (Você pode, se quiser, adicionar a $observacao_diretor no corpo do e-mail)
        }

        // MENSAGEM DE SUCESSO - Pode ser genérica
        echo "<script>alert('Atualizado com sucesso!');</script>";
        
    } else {
        echo "<script>alert('Parâmetros inválidos para atualização de aceite.');</script>";
    }
} else {
    echo "<script>alert('Método de requisição inválido para atualização de aceite.');</script>";
}

// Redireciona de volta para a página de solicitações de viagem
echo "<script>window.location='../aprovacaododiretor.php';</script>";
?>

// Redireciona de volta para a página de solicitações de viagem
echo "<script>window.location='../aprovacaododiretor.php';</script>";
