<?php
session_start();
include("../conecta.php");
$usuario = $_POST['login'];
$pass = $_POST['pass'];
$cpf = $_POST['cpf'];

$sql = "SELECT cpf FROM bdcorp.tbfuncionario WHERE matricula = '$usuario'";
$resultado = mysqli_query($conexao, $sql) or die(mysqli_error($conexao));
$row = mysqli_fetch_array($resultado, MYSQLI_BOTH);
     
    if ($cpf == $row[0]) {
    	$sql = "UPDATE bdcorp.tbusuario set senha = '$pass' WHERE usuario = '$usuario'";
        $resultado = mysqli_query($conexao, $sql) or die(mysqli_error($conexao));
        echo"<script language='javascript' type='text/javascript'>alert('Senha alterada com sucesso');window.location=\"../index.php\"</script>";
    } else {
    	 echo"<script language='javascript' type='text/javascript'>alert('CPF e Matrícula divergentes');window.location=\"../recsenha.php\"</script>";
    }

?>
