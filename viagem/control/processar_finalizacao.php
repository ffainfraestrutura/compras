<?php
include "../conecta.php";
session_start();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Captura os dados do formulário
    $id = $_POST['idtbsolviagem'];
    $aceite_do_diretor = $_POST['aceite_do_diretor'];

    if (empty($id )) {
        die("ID da viagem não fornecido.");
    }
    // Atualiza a coluna 'aceite_do_diretor' na tabela 'tbsolviagem'
    $sql = "UPDATE bdviagem.tbsolviagem 
            SET aceite_do_diretor = '$aceite_do_diretor' 
            WHERE idtbsolviagem = '$id'";

    // Executa a consulta
    $resultado = mysqli_query($conexao, $sql);

    // Verifica se a consulta foi executada com sucesso
    if ($resultado) {
        echo "<script>alert('Detalhes da viagem atualizados com sucesso.'); window.location.href = '../versolicitacao.php';</script>";
    } else {
        echo "Erro ao atualizar detalhes da viagem: " . mysqli_error($conexao);
    }
} else {
    echo "Método de requisição inválido.";
}
?>
