<?php
date_default_timezone_set('America/Sao_Paulo');
session_start();
include "./conecta.php"; 

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $idtbsolviagem = $_POST['idtbsolviagem'];
    $alimentacao_finalizada = $_POST['alimentacao_finalizada'];

    // print_r($alimentacao_finalizada);
    // exit;
    // Preparar a consulta SQL de atualização usando prepared statements
    $stmt = $conexao->prepare("UPDATE bdviagem.tbsolviagem SET alimentacao_finalizada = ? WHERE idtbsolviagem = ?");
    $stmt->bind_param("ii", $alimentacao_finalizada, $idtbsolviagem);

    // Executar a consulta e verificar se foi bem-sucedida
    if ($stmt->execute()) {
        // Redirecionar para a página principal após a atualização bem-sucedida
        header("Location: ../alimentacaopagamento.php"); // Substitua com o caminho correto da sua página principal
        exit();
    } else {
        echo "Erro ao atualizar os dados: " . $stmt->error;
    }

    // Fechar o statement
    $stmt->close();
}
?>
