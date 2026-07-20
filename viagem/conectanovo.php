<?php
/* Novo acesso ao banco de usuario para os usuarios de frotas */

$servidor = "10.17.0.2";
$usuario = "blvp";
$senha = "@F3r7n6c2";
$db = "bdcorp";
$conexao = mysqli_connect("$servidor", "$usuario", "$senha", "$db");

if (!$conexao) {
    die("<script>alert('Erro na conexão: " . mysqli_connect_error() . "');</script>");
}
?>
