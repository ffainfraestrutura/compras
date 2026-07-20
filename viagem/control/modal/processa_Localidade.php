<?php
// Verifica se os dados foram enviados via POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
   
    // Inclui o arquivo de conexão com o banco de dados
    include "../conecta.php";  // Certifique-se de que o caminho para `conecta.php` está correto
    
    // Obtém os dados do formulário
    $nome = $_POST["nome"];
    $estado = $_POST["estado"];
    
    // Verifica se houve algum erro na conexão
    if ($conexao->connect_error) {
        die("Erro na conexão com o banco de dados: " . $conexao->connect_error);
    }
    
    // Prepara a consulta SQL para inserir os dados na tabela
    $sql = "INSERT INTO bdviagem.tbauxlocalidade (nome, estado) VALUES ('$nome', '$estado')";
    
    // Executa a consulta e verifica se foi bem-sucedida
    if ($conexao->query($sql) === TRUE) {
        // Redireciona de volta para a página de sucesso ou onde desejar
        header("Location: ../../questionariosolicitacaoviagem.php");  // Altere o caminho para a página de sucesso desejada
        exit; // Certifica-se de que o script é encerrado após o redirecionamento
    } else {
        echo "Erro ao inserir dados: " . $conexao->error;
    }
    
    // Fecha a conexão com o banco de dados
    $conexao->close();
}
?>
