<?php
// Verifica se os dados foram enviados via POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
   
    include "../conecta.php";
    session_start(); // Certifique-se de iniciar a sessão antes de usar $_SESSION

    $tipo_enquete = $_SESSION['tipo_enquete'];
    $hoje = date('Y-m-d H:i:s');

    // Verifica se houve algum erro na conexão
    if ($conexao->connect_error) {
        die("Erro na conexão com o banco de dados: " . $conexao->connect_error);
    }
    
    // Obtém os dados do formulário
    $nome_hotel = $_POST["nome_hotel"];
    $endereco_hotel = $_POST["endereco_hotel"];
    $cidade_hotel = $_POST["cidade_hotel"];

    // Prepara a consulta SQL para inserir os dados na tabela
    $sql = " INTO bdviagem.tbhoteis 
                        (nome_hotel, 
                         endereco_hotel, 
                         cidade_hotel)
               VALUES ('$nome_hotel', 
                       '$endereco_hotel', 
                       '$cidade_hotel')";

    // Executa a consulta e verifica se foi bem sucedida
    if ($conexao->query($sql) === TRUE) {
        // Redireciona de volta para a página questionariosolicitacaoviagem
        header("Location: ../../versolicitacao.php");
        exit; // Certifica-se de que o script é encerrado após o redirecionamento
    } else {
        echo "Erro ao inserir dados: " . $conexao->error;
    }

    // Fecha a conexão com o banco de dados
    $conexao->close();
}
?>
