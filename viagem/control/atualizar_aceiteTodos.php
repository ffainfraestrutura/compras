<?php
session_start();
include "./conecta.php"; // Verifique o caminho correto do seu arquivo de conexão

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Verifica se foi enviado o valor do aceite (1 para Sim, 0 para Não)
    if (isset($_POST['aceite']) && isset($_POST['idtbsolviagem'])) {
        $aceite = $_POST['aceite'];
        $idtbsolviagem = $_POST['idtbsolviagem'];

        // Atualiza o banco de dados
        $sql = "UPDATE bdviagem.tbsolviagem SET aceite_do_diretor = $aceite WHERE idtbsolviagem = $idtbsolviagem";

        if (mysqli_query($conexao, $sql)) {
            echo "<script>alert('Atualizado com sucesso!');</script>";
        } else {
            echo "<script>alert('Erro ao atualizar aceite: " . mysqli_error($conexao) . "');</script>";
        }
    } else {
        echo "<script>alert('Parametros inválidos para atualização de aceite.');</script>";
    }
} else {
    echo "<script>alert('Método de requisição inválido para atualização de aceite.');</script>";
}

// Redireciona de volta para a página de solicitações de viagem
echo "<script>window.location='../aprovacaododiretorTodos.php';</script>";
?>
