<?php
require'./fpdf.php';

require('../conecta.php');

header("Content-type: text/html; charset=utf-8");

$id = $_POST['idtbdesligamento'];
$id=53;

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
  $simmaconduta = utf8_encode($row['simconduta']);
  $atrasos = $row['atrasos'];
  $simatrasos = utf8_encode($row['simatrasos']);
  $produtividade = $row['produtividade'];
  $performance = $row['performance'];
  $simperformance = utf8_encode($row['simperformance']);
  $outros = $row['outros'];
  $simoutros = utf8_encode($row['simoutros']);
  $observacao = utf8_encode($row['observacao']);
  $nomesol = utf8_encode($row['nomesol']);
  $datasol = $row['datasol'];
  $cargosol =utf8_encode($row['cargosol']);
  $matrsol = $row['matrsol'];
  
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

  $aceitegerente = $row['aceitegerente'];
  $aceitediretor = $row['aceitediretorn1'];
  $aceiteceo = $row['aceitediretorn2'];

  $justificativager = utf8_encode($row['justificativager']);
  $justificativadir = utf8_encode($row['justificativadir1']);
  $justificativaceo = utf8_encode($row['justificativadir2']);

  $observacaoger = utf8_encode($row['observacaoger']);
  $observacaodir = utf8_encode($row['observacaodir1']);
  $observacaoceo = utf8_encode($row['observacaodir2']);

  $matgerente=$row['gerente'];
}

$sqla="SELECT nome FROM bdcorp.tbfuncionario WHERE matricula='$matgerente' ";
$resultadoa= mysqli_query($conexao, $sqla) or die(mysqli_error($conexao));
$rowa = mysqli_fetch_array($resultadoa, MYSQLI_BOTH);
  $nomeger = $rowa['nome'];

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

if($aceitegerente == '1'){
  $aceitegerente = 'Sim';
} elseif($aceitegerente == '0') {
  $aceitegerente = 'Não';
}elseif($aceitegerente == '') {
  $aceitegerente = '-';
}

if($aceitediretor == '1'){
  $aceitediretor = 'Sim';
} elseif($aceitediretor == '0') {
  $aceitediretor = 'Não';
}elseif($aceitediretor == '') {
  $aceitediretor = '-';
}

if($aceiteceo == '1'){
  $aceiteceo = 'Sim';
} elseif($aceiteceo == '0') {
  $aceiteceo = 'Não';
}elseif($aceiteceo == '') {
  $aceiteceo = '-';
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
$pdf->SetFillColor(169, 169, 169);

$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("INFORMAÇÕES PESSOAIS DO FUNCIONÁRIO"),1,1, true);

$pdf->Ln(0);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("Nome Completo: $nome\nMatrícula: $matricula\nCargo: $funcao\nDepartameto: $ccusto\nData de Admissão: $dataadmissao2\nData de Demissão Pretendida: $datademissao2\n"),1,1);

$pdf->Ln(3);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("TIPO DE DESLIGAMENTO"),1,1, true);
$pdf->Ln(0);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("Tipo de Desligamento: $tpdemissao\nMotivo(para justa causa): $motivof.\n"),1,1);

$pdf->Ln(3);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("MOTIVOS SELECIONADOS PARA SOLICITAÇÃO DE DESLIGAMENTO"),1,1, true);
$pdf->Ln(0);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("$advertencia $suspensao $faltas $atestados $maconduta $atrasos $produtividade $performance $outros.\n"),1,1);

if($advertencia<>''){
  $pdf->Ln(3);
  $pdf->Cell(20);
  $pdf->MultiCell(160,5,utf8_decode("DETALHES ADVERTÊNCIAS"),1,1, true);
  $pdf->Ln(0);
  $pdf->Cell(20);
  $pdf->MultiCell(160,7,utf8_decode("$simadvertencia"),1,1);
}

if($suspensao<>''){
  $pdf->Ln(3);
  $pdf->Cell(20);
  $pdf->MultiCell(160,5,utf8_decode("DETALHES SUSPENSÕES APLICADAS"),1,1, true);

  $pdf->Ln(0);
  $pdf->Cell(20);
  $pdf->MultiCell(160,7,utf8_decode("$simsuspensao"),1,1);
}

if($faltas<>''){
  $pdf->Ln(3);
  $pdf->Cell(20);
  $pdf->MultiCell(160,5,utf8_decode("DETALHES FALTAS INJUSTIFICADAS"),1,1, true);

  $pdf->Ln(0);
  $pdf->Cell(20);
  $pdf->MultiCell(160,7,utf8_decode("$simfaltas."),1,1);
}

if($atestados<>''){
  $pdf->Ln(3);
  $pdf->Cell(20);
  $pdf->MultiCell(160,5,utf8_decode("DETALHES ATESTADOS MÉDICOS"),1,1, true);
  $pdf->Ln(0);
  $pdf->Cell(20);
  $pdf->MultiCell(160,6,utf8_decode("$simatestados"),1,1);
}

if($maconduta<>''){
  $pdf->Ln(3);
  $pdf->Cell(20);
  $pdf->MultiCell(160,5,utf8_decode("DETALHES MÁ CONDUTA"),1,1,true);
  $pdf->Ln(0);
  $pdf->Cell(20);
  $pdf->MultiCell(160,5,utf8_decode("$simmaconduta"),1,1);
}

if($atrasos<>''){
  $pdf->Ln(3);
  $pdf->Cell(20);
  $pdf->MultiCell(160,5,utf8_decode("DETALHES ATRASOS DE HORÁRIO"),1,1,true);
  $pdf->Ln(0);
  $pdf->Cell(20);
  $pdf->MultiCell(160,5,utf8_decode("$simatrasos"),1,1);
}

if($performance<>''){
  $pdf->Ln(3);
  $pdf->Cell(20);
  $pdf->MultiCell(160,5,utf8_decode("DETALHES BAIXA PERFORMANCE"),1,1,true);
  $pdf->Ln(0);
  $pdf->Cell(20);
  $pdf->MultiCell(160,5,utf8_decode("$simperformance"),1,1);
}



if($outros<>''){
  $pdf->Ln(3);
  $pdf->Cell(20);
  $pdf->MultiCell(160,5,utf8_decode("DETALHES OUTROS"),1,1, true);
  $pdf->Ln(0);
  $pdf->Cell(20);
  $pdf->MultiCell(160,6,utf8_decode("$simoutros"),1,1);
}

$pdf->Ln(3);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("DETALHES ADICIONAIS"),1,1, true);
$pdf->Ln(0);
$pdf->Cell(20);
$pdf->MultiCell(160,6,utf8_decode("- Quantas advertências foram aplicadas? $qtdadvertencia\n- Quantas suspensões foram aplicadas? $qtdsuspensao\n- Quantas faltas injustificadas foram registradas? $qtdfaltas \n- Quantos atestados médicos foram apresentados? $qtdatestados \n- Quantos atrasos foram registrados? $qtdatrasos"),1,1);

$pdf->Ln(3);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("OBSERVAÇÕES ADICIONAIS"),1,1, true);
$pdf->Ln(0);
$pdf->Cell(20);
$pdf->MultiCell(160,6,utf8_decode("Coordenador: $observacao\nGerente - $nomeger: $observacaoger\nDiretor - JOSE LUIZ CORDOBEL: $observacaodir\nCEO - FABRICIO CABRAL CASADO DE BARROS: $observacaoceo"),1,1);

$pdf->Ln(3);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("ACEITES:"),1,1, true);
$pdf->Ln(0);
$pdf->Cell(20);
$pdf->MultiCell(160,6,utf8_decode("- Solicitação aceita pelo gerente? $aceitegerente\n-Justificativa gerente: $justificativager\n- Solicitação aceita pelo diretor? $aceitediretor\n- Justificativa diretor: $justificativadir\n- Solicitação aceita pelo CEO? $aceiteceo\n- Justificativa CEO: $justificativaceo"),1,1);

$pdf->Ln(3);
$pdf->Cell(20);
$pdf->MultiCell(160,5,utf8_decode("DADOS DO SOLICITANTE"),1,1, true);
$pdf->Ln(0);
$pdf->Cell(20);
$pdf->MultiCell(160,6,utf8_decode("- Data da solicitação: $datasol2\n- Nome do solicitante: $nomesol\n- Matrícula do solicitante: $matrsol\n- Cargo do solicitante: $cargosol"),1,1);
  
$pdf->Output();

?>

