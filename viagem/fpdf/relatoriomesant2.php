<?php
require'./fpdf.php';

require('../conecta.php');
header("Content-type: text/html; charset=utf-8");

$id = $_POST['id'];

$sql = "SELECT * FROM bdcorp.tbpesquisafunc where idtbpesquisafunc='$id';";
$resultado = mysqli_query($conexao, $sql) or die(mysqli_error($conexao));
$linhas=mysqli_num_rows($resultado);

if($linhas<=0){
  echo "<script>window.alert('Não existe entrevista do bimestre anterior com o(a) colaborador(a) especificado(a).'); window.close();  </script>";
  //echo $anomesf;
} //window.location=\"../telainicialgerente.php\"

while($row = mysqli_fetch_array($resultado, MYSQLI_BOTH)){
  $filial = utf8_encode($row['filial']);
  $ccusto = utf8_encode($row['ccusto']);
  $matrcol = $row['matriculafunc'];
  $nomecol = utf8_encode($row['nomefunc']);
  $nomesup = utf8_encode($row['supervisor']);
  $nomecoord = utf8_encode($row['coordenador']);
  $nomeger = utf8_encode($row['gerente']);
  $cargo = utf8_encode($row['funcao']);
  $tempoempresa = $row['tempoempresa'];
  $datahora = utf8_encode($row['datahora']);
  $remuneracao = $row['remuneracao'];
  $naoremuneracao = utf8_encode($row['naoremuneracao']);
  $remuneracaocomp = $row['remuneracaocomp'];
  $naoremuneracaocomp = utf8_encode($row['naoremuneracaocomp']);
  $beneficios = $row['beneficios'];
  $naobeneficio = utf8_encode($row['naobeneficio']);
  $ferramentas  = $row['ferramentas'];
  $naoferramenta = utf8_encode($row['naoferramenta']);
  $material  = $row['material'];
  $naomaterial = utf8_encode($row['naomaterial']);
  $epiepc = $row['epiepc'];
  $naoepiepc = utf8_encode($row['naoepiepc']);
  $politicaproducao = $row['politicaproducao'];
  $naopproducao = utf8_encode($row['naopproducao']);
  $politicaregras = $row['politicaregras'];
  $naopregras = utf8_encode($row['naopregras']);
  $politicasatisfacao = $row['politicasatisfacao'];
  $naopsatisfacao = utf8_encode($row['naopsatisfacao']);
  $valorizacao= $row['valorizacao'];
  $naovalorizacao = utf8_encode($row['naovalorizacao']);
  $realizacao = $row['realizacao'];
  $naorealizacao = utf8_encode($row['naorealizacao']);
  
  $dificuldade = utf8_encode($row['dificuldade']);
  $suportesupervisor = utf8_encode($row['suportesupervisor']);
  $supervresolucao = $row['supervresolucao'];
  $supervcomentario = utf8_encode($row['supervcomentario']);
  $sugestoes = utf8_encode($row['sugestoes']);
  $entrevistador = $row['entrevistador'];
  $tipo_entrevistador = $row['tipo_entrevistador'];

  $solimediata = $row['solimediata'];
  $simsolimediata = utf8_encode($row['simsolimediata']);

  $solcritica = $row['solcritica'];
  $simsolcritica = utf8_encode($row['simsolcritica']);

  $observacao = utf8_encode($row['observacao']);

  $fentrevista = $row['fentrevista'];
  $simfentrevista = utf8_encode($row['simfentrevista']);

  $obsdir = $row['obsdir'];
}

if($remuneracao=="0"){
  $remuneracao = 'Não';
} elseif($remuneracao=="1"){
  $remuneracao = 'Sim';
}

if($remuneracaocomp=="0"){
  $remuneracaocomp = 'Não';
} elseif($remuneracaocomp=="1"){
  $remuneracaocomp = 'Sim';
}

if($beneficios=="0"){
  $beneficios = 'Não';
}elseif($beneficios=="1"){
  $beneficios = 'Sim';
}

if($ferramentas=="0"){
  $ferramentas = 'Não';
}elseif($ferramentas=="1"){
  $ferramentas = 'Sim';
}

if($material=="0"){
  $material = 'Não';
}elseif($material=="1"){
  $material = 'Sim';
}

if($epiepc=="0"){
  $epiepc = 'Não';
}elseif($epiepc=="1"){
  $epiepc = 'Sim';
}

if($politicaproducao=="0"){
  $politicaproducao = 'Não';
}elseif($politicaproducao=="1"){
  $politicaproducao = 'Sim';
}

if($politicaregras=="0"){
  $politicaregras = 'Não';
}elseif($politicaregras=="1"){
  $politicaregras = 'Sim';
}

if($politicasatisfacao=="0"){
  $politicasatisfacao = 'Não';
}elseif($politicasatisfacao=="1"){
  $politicasatisfacao = 'Sim';
}

if($valorizacao=="0"){
  $valorizacao = 'Não';
}elseif($valorizacao=="1"){
  $valorizacao = 'Sim';
}

if($realizacao=="0"){
  $realizacao = 'Não';
}elseif($realizacao=="1"){
  $realizacao = 'Sim';
}

if($suportesupervisor=="0"){
  $suportesupervisor = 'Não';
}elseif($suportesupervisor=="1"){
  $suportesupervisor = 'Sim';
}

if($supervresolucao=="0"){
  $supervresolucao = 'Não';
}elseif($supervresolucao=="1"){
  $supervresolucao = 'Sim';
}

if($solimediata=="0"){
  $solimediata = 'Não';
}elseif($solimediata=="1"){
  $solimediata = 'Sim';
}

if($solcritica=="0"){
  $solcritica = 'Não';
}elseif($solcritica=="1"){
  $solcritica = 'Sim';
}

if($fentrevista=="0"){
  $fentrevista = 'Não';
}elseif($fentrevista=="1"){
  $fentrevista = 'Sim';
}

if($tipo_entrevistador=="1"){
  $tipo_entrevistador = 'Coordenador';
}elseif($tipo_entrevistador=="2"){
  $tipo_entrevistador = 'Gerente';
} elseif($tipo_entrevistador==""){
  $tipo_entrevistador = 'Diretor';
}

class PDF extends FPDF
{
	// Page header
	function Header()
	{
		// Logo
		$this->Image('../src/images/logoredonda.png',10,10,15);
		// Arial bold 15
		$this->SetFont('Arial','B',12);
		// Cor de fundo
		$this->SetFillColor(255);
		// Line break
		$this->Ln(3);
		// Move to the right
		$this->Cell(20);
		// Title
		$this->Cell(160,12,utf8_decode('RELATÓRIO DE ENTREVISTA'),1,1,'C','true');
		// Line break
		$this->Ln(2);
	}

	function RotatedImage($file,$x,$y,$w,$h,$angle)	{
    //Image rotated around its upper-left corner
    $this->Rotate($angle,$x,$y);
    $this->Image($file,$x,$y,$w,$h);
    $this->Rotate(0);
	}
}

// Instanciation of inherited class
$pdf = new PDF();
$pdf->AliasNbPages();
$pdf->AddPage();

$pdf->SetFont('Times','',10);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("INFORMAÇÕES DO FUNCIONÁRIO\n\nNome: $nomecol\nMatrícula: $matrcol\nFilia: $filial\nCentro de custo: $ccusto\nFunção: $cargo \nTempo de empresa: $tempoempresa\nSupervisor: $nomesup\nCoordenador: $nomecoord\nGerente: $nomeger"),1,1);

$pdf->Ln(2);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("AVALIAÇÃO DA EMPRESA\n\nSua remuneração está de acordo com o tratado na contratação? $remuneracao\nJustificativa: $naoremuneracao\nSua remuneração está compatível com sua função e atuação? $remuneracaocomp\nJustificativa: $naoremuneracaocomp\nOs benefícios oferecidos pela empresa estão dentro da sua expectativa? $beneficios\nJustificativa: $naobeneficio\nPossui ferramentas e/ou equipamentos necessários para sua atividade? $ferramentas\nJustificativa: $naoferramenta\nRecebe material suficiente para suas atividades? $material\nJustificativa: $naomaterial\nPossui EPI e EPC completo para sua segurança? $epiepc\nJustificativa: $naoepiepc\nSua função possui Politica de Produção e premiação? $politicaproducao\nVoce conhece as regras da sua politica de premiação? $politicaregras\nJustificativa: $naopregras\nVoce considera a politica de premiação satisfatória para sua expectativa profissional? $politicasatisfacao\nJustificativa: $naopsatisfacao\nSe sente valorizado na empresa? $valorizacao\nJustificativa: $naovalorizacao\nEstá feliz de trabalhar na FFA? $realizacao\nJustificativa: $naorealizacao"),1,1);

$pdf->Ln(2);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("ATUAÇÃO NA EMPRESA\n\nPerguntar ao Colaborador sobre sua atuação na empresa, se tem alguma dificuldade, se precisa de algum tipo de ajuda para exercer suas atividades ou resolver algum problema pessoal/profissional.\nResposta do colaborador: $dificuldade"),1,1);

$pdf->Ln(2);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("AVALIAÇÃO DA SUPERVISÃO\n\nPerguntar ao Colaborador qual avaliação ele tem da sua supervisão, se oferece suporte adequado, se ajuda a resolver suas dificuldades do dia a dia.\nResposta do colaborador: $suportesupervisor\nPerguntar ao Colaborador sobre sugestões de melhoria para a empresa e para o seu trabalho, criticas ou elogios para melhorar o ambiente de trabalho.\nResposta do colaborador: $sugestoes"),1,1);

/*$pdf->Ln(2);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("SUGESTÕES DO FUNCIONÁRIO\n\nDeixe suas sugestões de melhoria para a empresa e para o seu trabalho, críticas ou elogios: $sugestoes"),1,J);*/

$pdf->Ln(4);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("CAMPO COORDENADOR\n\nO colaborador relatou algum problema que necessita de solução imediata? $solimediata\nQual a solução dada ao problema apresentado? $simsolimediata\nO colaborador apresentou alguma crítica ou sugestão? $solcritica\nQual a tratativa dada a crítica ou sugestão? $simsolcritica\nAlguma observação relevante sobre a entrevista com o colaborador? $observacao"),1,J);

$pdf->Ln(2);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("CAMPO GERENTE\n\nFoi feita entrevista? $fentrevista\nRelatar o que conversou com o colaborador. $simfentrevista"),1,J);

$pdf->Ln(2);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("CAMPO DIRETOR\n\nObservações: $obsdir"),1,J);
	
$pdf->Output();

?>

