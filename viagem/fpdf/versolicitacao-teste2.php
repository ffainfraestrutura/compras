<?php
require'./fpdf.php';

require('../conecta.php');

header("Content-type: text/html; charset=utf-8");

$id = $_POST['idtbdesligamento'];
$id='53';

$sql="SELECT * FROM bdcorp.tbdesligamento WHERE idtbdesligamento='$id'";
$resultado = mysqli_query($conexao, $sql) or die(mysqli_error($conexao));

while($row = mysqli_fetch_array($resultado, MYSQLI_BOTH)){
  $nome = utf8_encode($row['nomefunc']);
  $matricula = $row['matrfunc'];
  $funcao = utf8_encode($row['funcao']);
  $ccusto = utf8_encode($row['ccusto']);
  $dataadmissao = $row['dataadmissao'];
  $datademissao = $row['datademissao'];
  $advertencia = $row['advertencia'];
  $simadvertencia = utf8_encode($row['simadvertencia']);
  $suspensao = $row['suspensao'];
  $simsuspensao = utf8_encode($row['simsuspensao']);
  $faltas = $row['faltas'];
  $simfaltas = utf8_encode($row['simfaltas']);
  $atestados = $row['atestados'];
  $simatestados = utf8_encode($row['simatestados']);
  $maconduta = $row['maconduta'];
  $atrasos = $row['atrasos'];
  $simatrasos = utf8_encode($row['simatrasos']);
  $produtividade = $row['produtividade'];
  $performance = $row['performance'];
  $outros = $row['outros'];
  $simoutros = utf8_encode($row['simoutros']);
  $observacao = utf8_encode($row['observacao']);
  $nomesol = utf8_encode($row['nomesol']);
  $datasol = $row['datasol'];
  $cargosol =utf8_encode($row['cargosol']);
  $matrsol = $row['matrsol'];
  // , , , , ,
  $qtdadvertencia = $row['qtdadvertencia'];
  $qtdsuspensao = $row['qtdsuspensao'];
  $qtdfaltas = $row['qtdfaltas'];
  $qtdatestados = $row['qtdatestados'];
  $qtdatrasos = $row['qtdatrasos'];

  $tipodemissao = $row['tipodemissao']; 
//0-Término de experiência; 1-Sem justa causa; 2-Com justa causa
  $simjcausa = utf8_encode($row['simjcausa']);

  $tipodemissaoger = $row['tipodemissaoger'];
  $motivodemissaoger = utf8_encode($row['motivodemissaoger']);

  $tipodemissaodir = $row['tipodemissaodir'];
  $motivodemissaodir = utf8_encode($row['motivodemissaodir']);


  $tipodemissaoceo = $row['tipodemissaoceo'];
  $motivodemissaoceo = utf8_encode($row['motivodemissaoceo']);
}

if($advertencia=="0"){
  $advertencia = '';
} elseif($advertencia=="1"){
  $advertencia = 'Advertências recebidas;';
}

if($suspensao=="0"){
  $suspensao = '';
} elseif($suspensao=="1"){
  $suspensao = 'Suspensões aplicadas;';
}

if($faltas=="0"){
  $faltas = '';
}elseif($faltas=="1"){
  $faltas = 'Faltas injustificadas;';
}

if($atestados=="0"){
  $atestados = '';
}elseif($atestados=="1"){
  $atestados = 'Atestados médicos;';
}

if($maconduta=="0"){
  $maconduta = '';
}elseif($maconduta=="1"){
  $maconduta = 'Má conduta;';
}

if($atrasos=="0"){
  $atrasos = '';
}elseif($atrasos=="1"){
  $atrasos = 'Atraso de horário;';
}

if($produtividade=="0"){
  $produtividade = '';
}elseif($produtividade=="1"){
  $produtividade = 'Baixa produtividade;';
}

if($performance=="0"){
  $performance = '';
}elseif($performance=="1"){
  $performance = 'Baixa performance;';
}

if($outros=="0"){
  $outros = '';
}elseif($outros=="1"){
  $outros = 'Outros;';
}
//0-Término de experiência; 1-Sem justa causa; 2-Com justa causa

/*if($tipodemissao=='0'){
  $tipodemissao='Término de experiência.';
} elseif($tipodemissao=='1'){
  $tipodemissao='Sem justa causa.';
} elseif($tipodemissao=='2'){
  $tipodemissao='Com justa causa.';
}

if($tipodemissaoger=='0'){
  $tipodemissaoger='Término de experiência.';
} elseif($tipodemissaoger=='1'){
  $tipodemissaoger='Sem justa causa.';
} elseif($tipodemissaoger=='2'){
  $tipodemissaoger='Com justa causa.';
}

if($tipodemissaodir=='0'){
  $tipodemissaodir='Término de experiência.';
} elseif($tipodemissaodir=='1'){
  $tipodemissaodir='Sem justa causa.';
} elseif($tipodemissaodir=='2'){
  $tipodemissaodir='Com justa causa.';
}

if($tipodemissaoceo=='0'){
  $tipodemissaoceo='Término de experiência.';
} elseif($tipodemissaoceo=='1'){
  $tipodemissaoceo='Sem justa causa.';
} elseif($tipodemissaoceo=='2'){
  $tipodemissaoceo='Com justa causa.';
}*/

$dataadmissao1=explode(" ", $dataadmissao);
$dataadmissao1= explode("-", $dataadmissao1[0]);
$dataadmissao2= $dataadmissao1[2]."/".$dataadmissao1[1]."/".$dataadmissao1[0];

$datademissao1=explode(" ", $datademissao);
$datademissao1= explode("-", $datademissao1[0]);
$datademissao2= $datademissao1[2]."/".$datademissao1[1]."/".$datademissao1[0];

$datasol1=explode(" ", $datasol);
$datasol1= explode("-", $datasol1[0]);
$datasol2= $datasol1[2]."/".$datasol1[1]."/".$datasol1[0];

if($tipodemissaoceo == ''){
  if($tipodemissaodir==''){
    if($tipodemissaoger == ''){
      $tpdemissao = $tipodemissao;
    } else{
      $tpdemissao = $tipodemissaoger;
    }
  }else{
    $tpdemissao = $tipodemissaodir;
  }
} else{
  $tpdemissao = $tipodemissaoceo;
}

if($tpdemissao=='0'){
  $tpdemissao='Término de experiência.';
} elseif($tpdemissao=='1'){
  $tpdemissao='Sem justa causa.';
} elseif($tpdemissao=='2'){
  $tpdemissao='Com justa causa.';
}

if($motivodemissaoceo == ''){
  if($motivodemissaodir==''){
    if($motivodemissaoger == ''){
      $motivof = $simjcausa;
    } else{
      $motivof = $motivodemissaoger;
    }
  }else{
    $motivof = $motivodemissaodir;
  }
} else{
  $motivof = $motivodemissaoceo;
}

// ,  ,  ,
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
    $this->Cell(160,12,utf8_decode('SOLICITAÇÃO DE DESLIGAMENTO'),1,1,'C','true');
    // Line break
    $this->Ln(2);
  }
}

// Instanciation of inherited class
$pdf = new PDF();
$pdf->AliasNbPages();
$pdf->AddPage();

$pdf->SetFont('Times','',12);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("INFORMAÇÕES PESSOAIS DO FUNCIONÁRIO:\nNome Completo: $nome\nMatrícula: $matricula\nCargo: $funcao\nDepartameto: $ccusto\nData de Admissão: $dataadmissao2\nData de Demissão Pretendida: $datademissao2\n"),0,1);

$pdf->Ln(3);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("TIPO DE DESLIGAMENTO:\nTipo de Desligamento: $tpdemissao\nMotivo (para justa causa): $motivof.\n"),0,1);

$pdf->SetTextColor(0, 0, 255);
$pdf->Ln(3);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("MOTIVOS SELECIONADOS PARA SOLICITAÇÃO DE DESLIGAMENTO:\n"),0,1);

$pdf->SetTextColor(0, 0, 0);
$pdf->Ln(1);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("$advertencia $suspensao $faltas $atestados $maconduta $atrasos $produtividade $performance $outros.\n"),0,1);

if($advertencia<>''){
  $pdf->SetTextColor(0, 0, 255);
  $pdf->Ln(3);
  $pdf->Cell(20);
  $pdf->MultiCell(160,5,utf8_decode("Detalhes advertência: $simadvertencia."),0,1);

  $pdf->SetTextColor(0, 0, 0);
  $pdf->Ln(1);
  $pdf->Cell(20);
  $pdf->MultiCell(160,5,utf8_decode("$simadvertencia."),0,1);
}

if($suspensao<>''){
  $pdf->SetTextColor(0, 0, 255);
  $pdf->Ln(3);
  $pdf->Cell(20);
  $pdf->MultiCell(160,5,utf8_decode("Detalhes suspensões aplicadas:"),0,1);

  $pdf->SetTextColor(0, 0, 0);
  $pdf->Ln(1);
  $pdf->Cell(20);
  $pdf->MultiCell(160,5,utf8_decode("$simsuspensao."),0,1);
}

if($faltas<>''){
  $pdf->SetTextColor(0, 0, 255);
  $pdf->Ln(3);
  $pdf->Cell(20);
  $pdf->MultiCell(160,5,utf8_decode("Detalhes faltas injustificadas:"),0,1);

  $pdf->SetTextColor(0, 0, 0);
  $pdf->Ln(1);
  $pdf->Cell(20);
  $pdf->MultiCell(160,5,utf8_decode("$simfaltas."),0,1);
}

if($atestados<>''){
  $pdf->SetTextColor(0, 0, 255);
  $pdf->Ln(3);
  $pdf->Cell(20);
  $pdf->MultiCell(160,5,utf8_decode("Detalhes atestados médicos:"),0,1);

  $pdf->SetTextColor(0, 0, 0);
  $pdf->Ln(1);
  $pdf->Cell(20);
  $pdf->MultiCell(160,5,utf8_decode("$simatestados."),0,1);
}

if($atrasos<>''){
  $pdf->SetTextColor(0, 0, 255);
  $pdf->Ln(3);
  $pdf->Cell(20);
  $pdf->MultiCell(160,5,utf8_decode("Detalhes atrasos de horário:"),0,1);

  $pdf->SetTextColor(0, 0, 0);
  $pdf->Ln(1);
  $pdf->Cell(20);
  $pdf->MultiCell(160,5,utf8_decode("$simatrasos."),0,1);

}

if($outros<>''){
  $pdf->SetTextColor(0, 0, 255);
  $pdf->Ln(3);
  $pdf->Cell(20);
  $pdf->MultiCell(160,5,utf8_decode("Detalhes outros:"),0,1);

  $pdf->SetTextColor(0, 0, 0);
  $pdf->Ln(1);
  $pdf->Cell(20);
  $pdf->MultiCell(160,5,utf8_decode("$simoutros."),0,1);
}

$pdf->SetTextColor(0, 0, 255);
$pdf->Ln(3);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("DETALHES ADICIONAIS:"),0,1);

$pdf->SetTextColor(0, 0, 0);
$pdf->Ln(1);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("Quantas advertências foram aplicadas? $qtdadvertencia\nQuantas suspensões foram aplicadas? $qtdsuspensao\nQuantas faltas injustificadas foram registradas? $qtdfaltas \nQuantos atestados médicos foram apresentados? $qtdatestados \nQuantos atrasos foram registrados? $qtdatrasos"),0,1);

$pdf->SetTextColor(0, 0, 255);
$pdf->Ln(3);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("OBSERVAÇÕES ADICIONAIS:\nCaso haja mais informações relevantes ou detalhes que você gostaria de compartilhar, por favor, utilize este espaço para descrevê-los.\n"),0,1);

$pdf->SetTextColor(0, 0, 0);
$pdf->Ln(1);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("$observacao"),0,1);

//$pdf->SetTextColor(0, 0, 255);
$pdf->Ln(3);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("DADOS DO SOLICITANTE:\nData da solicitação: $datasol2\nNome do solicitante: $nomesol\nMatrícula do solicitante: $matrsol\nCargo do solicitante: $cargosol"),0,1);
  
$pdf->Output();

?>

