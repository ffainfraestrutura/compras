<?php
include("../conecta.php");
$senha     =  addslashes($_POST['pass']);
session_start();
$matricula = $_SESSION['matricula'];
$_SESSION['matricula'] = $matricula;

if ($matricula == '' or $senha == '') {
    echo "<script>alert('Erro na criação');</script>";
  echo "<script>window.location=\"../\"</script>";
} else {
  $sql = "SELECT cargo, ccusto FROM bdcorp.tbfuncionario where matricula = '$matricula'";
  $resultado = mysqli_query($conexao, $sql) or die(mysqli_error($conexao));
  $row = mysqli_fetch_array($resultado, MYSQLI_BOTH);
  $cargo = $row[0];
  $ccusto = $row[1];

  $tenquete='0';

  if(strrpos($cargo, 'COORDENADOR') !== false){
    $tenquete='1';
  }

  if(strrpos($cargo, 'GERENTE') !== false){
    $tenquete='2';
  }

  if(strrpos($ccusto, 'PESSOAL') !== false){
    $tenquete='5';
  }
  

  $sql = "INSERT INTO bdcorp.tbusuario (usuario, mat_gestor,  sen_enquete, tipo, tipo_enquete) VALUES ('$matricula','$matricula','$senha','1','$tenquete')";
  $resultado = mysqli_query($conexao, $sql) or die(mysqli_error($conexao));

    echo "<script>alert('Usuário criado com sucesso');</script>";
  echo "<script>window.location=\"../\"</script>";
}


?>
