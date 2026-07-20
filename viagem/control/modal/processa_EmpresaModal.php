<?php
// Verifica se os dados foram enviados via POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Inclua o arquivo de conexão com o banco de dados
    include "../conecta.php"; // Ajuste o caminho conforme necessário

    // Inicia a sessão, se necessário
    session_start();

    // Verifica se houve algum erro na conexão
    if ($conexao->connect_error) {
        die("Erro na conexão com o banco de dados: " . $conexao->connect_error);
    }

    // Obtém os dados do formulário
    $nome_empresa = $_POST["nome_empresa"];

    // Prepara a consulta SQL para inserir os dados na tabela
    $sql = "INSERT INTO bdviagem.tbempresas (nome_empresa) VALUES (?)";

    // Prepara a instrução SQL
    $stmt = $conexao->prepare($sql);
    if (!$stmt) {
        die("Erro na preparação da consulta: " . $conexao->error);
    }

    // Associa o parâmetro e executa a consulta
    $stmt->bind_param("s", $nome_empresa);

    // Executa a consulta e verifica se foi bem sucedida
    if ($stmt->execute()) {
        // Redireciona de volta para a página desejada após sucesso
        header("Location: ../../versolicitacao.php"); // Ajuste o caminho conforme necessário
        exit; // Certifica-se de que o script é encerrado após o redirecionamento
    } else {
        echo "Erro ao inserir dados: " . $stmt->error;
    }

    // Fecha a conexão com o banco de dados
    $stmt->close();
    $conexao->close();
} else {
    echo "Método de requisição inválido.";
}
?>
