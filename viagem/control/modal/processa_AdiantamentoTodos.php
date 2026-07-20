<?php
// Verifica se os dados foram enviados via POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    include "../conecta.php";  // Inclui o arquivo de conexão com o banco de dados
    session_start(); // Inicia a sessão

    // Obtém a data atual
    $hoje = date('Y-m-d H:i:s');

    // Verifica se houve algum erro na conexão
    if ($conexao->connect_error) {
        die("Erro na conexão com o banco de dados: " . $conexao->connect_error);
    }
    
    // Obtém os dados do formulário
    $id = $_POST["id"];
    $valor_adiantamento = $_POST["valor_adiantamento"];

    // Prepara a consulta SQL para inserir ou atualizar os dados na tabela
    $sql = "UPDATE bdviagem.tbsolviagem 
            SET valor_adiantamento = '$valor_adiantamento'
            WHERE idtbsolviagem = '$id'";

    if ($conexao->query($sql) === TRUE) {
        // Verifica a matrícula do usuário
        $matricula = $_SESSION['matricula']; // Supondo que a matrícula está armazenada na sessão
        
        // Redireciona para a página apropriada com base na matrícula
        if ($matricula == '270907') {
            header("Location: ../../aprovacaododiretorTodos.php");
        } else {
            header("Location: ../../aprovacaododiretor.php");
        }
        exit; // Certifica-se de que o script é encerrado após o redirecionamento
    } else {
        echo "Erro ao atualizar os dados: " . $conexao->error;
    }

    // Fecha a conexão com o banco de dados
    $conexao->close();
}
?>
