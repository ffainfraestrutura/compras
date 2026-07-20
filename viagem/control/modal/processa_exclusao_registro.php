<?php 
/*
 - Fazendo esse processamento para 
   adicionar no banco informações sobre o ajuste no banco 
 */
if ($_SERVER["REQUEST_METHOD"] == "POST") {
   
    include "../conecta.php";
    session_start(); // Certifique-se de iniciar a sessão antes de usar $_SESSION

    // Verifica se houve algum erro na conexão
    if ($conexao->connect_error) {
        die("Erro na conexão com o banco de dados: " . $conexao->connect_error);
    }
    
    // Obtém os dados do Modal 

    $id = $_POST['idtbsolviagem'];
    $motivo_exclusao = $_POST['motivo_exclusao'];


    // print_r($id);
    // print_r($motivo_exclusao);
    // exit;
    //SELECT * FROM bdviagem.tbmotivo_exclusao;
    // Prepara a consulta SQL para inserir os dados na tabela
    $sql = "INSERT INTO  bdviagem.tbmotivo_exclusao (motivo_exclusao,
                                                     idtbsolviagem)
                                             VALUES ('$motivo_exclusao',
                                                     '$id')";

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