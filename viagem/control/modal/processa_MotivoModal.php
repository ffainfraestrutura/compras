<?php
// Verifica se os dados foram enviados via POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
   
    include "../conecta.php";
    $hoje = date('Y-m-d H:i:s');
    session_start();
    // Verifica se houve algum erro na conexão
    if ($conexao->connect_error) {
        die("Erro na conexão com o banco de dados: " . $conexao->connect_error);
    }
    
    // Obtém os dados do formulário
    $descricao = $_POST["descricao"];

    // Prepara a consulta SQL para inserir os dados na tabela
    $sql = "INSERT INTO  bdviagem.tbmotivo (descricao) VALUES ('$descricao')";

    // Executa a consulta e verifica se foi bem sucedida
    if ($conexao->query($sql) === TRUE) {
        // Redireciona de volta para a página questionariosolicitacaoviagem
        header("Location: ../../questionariosolicitacaoviagem.php");
        exit; // Certifica-se de que o script é encerrado após o redirecionamento
    } else {
        echo "Erro ao inserir dados: " . $conexao->error;
    }

    // Fecha a conex�o com o banco de dados
    $conexao->close();
}
?>
