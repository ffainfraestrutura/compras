<?php
date_default_timezone_set('America/Sao_Paulo');
session_start();
include "./conecta.php";


if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $idtbsolviagem = $_POST['idtbsolviagem'];
    $adiantamento_finalizado = $_POST['adiantamento_finalizado'];

    // Preparar a consulta SQL de atualização usando prepared statements
    $stmt = $conexao->prepare("UPDATE bdviagem.tbsolviagem SET adiantamento_finalizado = ? WHERE idtbsolviagem = ?");
    $stmt->bind_param("ii", $adiantamento_finalizado, $idtbsolviagem);

    // Executar a consulta e verificar se foi bem-sucedida
    if ($stmt->execute()) {
        // Redirecionar para a página principal após a atualização bem-sucedida
        header("Location: ../adiantamentodeviagem.php"); // Substitua com o caminho correto da sua página principal
        exit();
    } else {
        echo "Erro ao atualizar os dados: " . $stmt->error;
    }

    // Fechar o statement
    $stmt->close();
}
