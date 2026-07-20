<?php
date_default_timezone_set('America/Sao_Paulo');
session_start();
include "../conecta.php"; // caminho relativo ao diretório atual

// Ativar exibição de erros
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Verificar se a sessão está ativa
if (!isset($_SESSION['usuario']) || !isset($_SESSION['matricula'])) {
    echo "<script>alert('Sessão expirada. Faça login novamente.'); window.location.href='../index.php';</script>";
    exit;
}

$usuario = $_SESSION['usuario'];
$matricula_coo = $_SESSION['matricula'];

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (isset($_POST['aceite'], $_POST['idtbsolviagem'], $_POST['matsolicitante'])) {
        $aceite = $_POST['aceite'];
        $id = $_POST['idtbsolviagem'];
        $matsolicitante = $_POST['matsolicitante'];
        $data = date('Y-m-d H:i:s');

        // Determinar o nível de COO (opcional)

        $sql = "UPDATE bdviagem.tbsolviagem 
                SET aprovado_coo = ?
                WHERE idtbsolviagem = ?";

        $stmt = mysqli_prepare($conexao, $sql);
        if (!$stmt) {
            error_log("Erro ao preparar o UPDATE: " . mysqli_error($conexao));
            echo "<script>alert('Erro ao atualizar aceite do COO.'); window.history.back();</script>";
            exit;
        }

        mysqli_stmt_bind_param($stmt, "si", $aceite, $id);


        if (mysqli_stmt_execute($stmt)) {
            echo "<script>alert('Aceite atualizado com sucesso.'); window.location.href='../aprovacaodocoo.php';</script>";
        } else {
            error_log("Erro ao executar o UPDATE: " . mysqli_error($conexao));
            echo "<script>alert('Erro ao registrar aceite do coordenador.'); window.history.back();</script>";
        }
    } else {
        echo "<script>alert('Parâmetros incompletos.'); window.history.back();</script>";
    }
} else {
    echo "<script>alert('Requisição inválida.'); window.history.back();</script>";
}
