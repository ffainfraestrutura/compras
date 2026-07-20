<?php
date_default_timezone_set('America/Sao_Paulo');
include"../conecta.php";

/*$usuariof = $_SESSION['usuario'];
$matricula1 = $_SESSION['matricula'];
$tipo = $_SESSION['tipo'];
$tipo_enquete = $_SESSION['tipo_enquete'];

$_SESSION['tipo'] = $tipo;
$_SESSION['matricula'] = $matricula1;
$_SESSION['usuario'] = $usuariof;
$_SESSION['tipo_enquete'] = $tipo_enquete;*/

$hoje = date('Y-m-d H:i:s');

session_start();

$matfunc=$_POST['matfunc'];
$nomefunc=$_POST['nomefunc'];
$tipo_enquete=$_POST['tipo_enquete'];
$entrevistador=$_POST['entrevistador'];

$sqla="SELECT nome FROM bdcorp.tbfuncionario WHERE matricula='$entrevistador';";
$resultadoa = mysqli_query($conexao, $sqla) or die (mysqli_error());
$rowa=mysqli_fetch_array($resultadoa, MYSQLI_BOTH);
	$nomecoord=$rowa['nome'];

//conferir se a matricula do colaborador jÃ¡ estÃ¡ cadastarada na tbcolabcoord
$sql="SELECT matrcolab, matrcoord FROM bdcorp.tbcolabcoord WHERE matrcolab='$matfunc'";
$resultado = mysqli_query($conexao, $sql) or die (mysqli_error());
$linhas = mysqli_num_rows($resultado);

$row=mysqli_fetch_array($resultado, MYSQLI_BOTH);
	$matrcolab=$row['matrcolab'];
	$matrcoord=$row['matrcoord'];

if($linhas<=0){

	$sql2="SELECT nome FROM bdcorp.tbfuncionario WHERE matricula='$matrcolab'";
	$resultado2 = mysqli_query($conexao, $sql2) or die (mysqli_error());
	$row2=mysqli_fetch_array($resultado2, MYSQLI_BOTH);
		$nomecolab=$row2['nome'];
		
	$sql3="INSERT INTO bdcorp.tbcolabcoord (nomecolab, matrcolab, nomecoord, matrcoord) VALUES ('$nomefunc', '$matfunc','$nomecoord', '$entrevistador'); ";
	$resultado3= mysqli_query($conexao, $sql3) or die (mysqli_error());
	echo "<script> window.alert('Colaborador adicionado com sucesso!'); window.location=\"../adicionarcolaborador.php\"</script>";
	
	//print $sql3;
} else{
	//conferir se a matricula do colaborador estÃ¡ com o coordenador certo
	if($matrcoord == $entrevistador){
		echo"<script> windows.alert('Colaborador jÃ¡ associado!'); window.location=\"../adicionarcolaborador.php\"</script>";
		//print 'nÃ£o muda';
	} else {
		$sql3="UPDATE bdcorp.tbcolabcoord SET nomecoord='$nomecoord', matrcoord='$entrevistador' WHERE matrcolab='$matfunc'; ";
		$resultado3= mysqli_query($conexao, $sql3) or die (mysqli_error());
		echo "<script> window.alert('Colaborador adicionado com sucesso!'); window.location=\"../adicionarcolaborador.php\"</script>";
		//print $sql3; //print $matrcoord;
	}
}

?>