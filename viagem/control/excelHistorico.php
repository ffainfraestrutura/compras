<?php
require 'vendor/autoload.php'; // Inclua o autoload do Composer

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

// Conectar ao banco de dados
include '../conecta.php';

// Recuperar matrícula do solicitador
session_start();
$matricula1 = $_SESSION['matricula'];

// Consultar o nome do solicitador
$sqla = "SELECT nome FROM bdcorp.tbfuncionario WHERE matricula='$matricula1'";
$resultadoa = mysqli_query($conexao, $sqla) or die(mysqli_error($conexao));
$rowa = mysqli_fetch_array($resultadoa, MYSQLI_BOTH);
$nome = $rowa['nome'];

// Criar uma nova planilha
$spreadsheet = new Spreadsheet();
$sheet = $spreadsheet->getActiveSheet();
$sheet->setTitle('Desligamento');

// Definir cabeçalhos das colunas
$headers = [
    'Nome do Colaborador', 'Matrícula do Colaborador', 'Função', 'Centro de Custo', 'Data de admissão',
    'Data de desligamento pretendida', 'Tipo de desligamento solicitado', 'Motivo para justa causa',
    'Advertência?', 'Descrição advertência', 'Suspensão?', 'Descrição suspensão', 'Faltas?', 'Descrição faltas',
    'Má Conduta?', 'Descrição má conduta', 'Atestados médicos?', 'Descrição atestados médicos', 'Atrasos?',
    'Descrição atrasos', 'Produtividade?', 'Performance?', 'Descrição performance', 'Outros?', 'Descrição outros',
    'Quantidade de advertências', 'Quantidade de suspensões', 'Quantidade de faltas injustificadas',
    'Quantidade de atestados médicos', 'Quantidade de atrasos', 'Observações', 'Data da solicitação',
    'Nome do solicitante', 'Matrícula do solicitante', 'Cargo do solicitante', 'Aceito pelo Gerente?',
    'Tipo de desligamento editado gerente', 'Motivo para justa causa', 'Aceito pelo Diretor?',
    'Tipo de desligamento editado diretor', 'Motivo para justa causa', 'Aceito pelo CEO?',
    'Tipo de desligamento editado CEO', 'Motivo para justa causa'
];

// Adicionar cabeçalhos à planilha
$col = 'A';
foreach ($headers as $header) {
    $sheet->setCellValue($col . '1', $header);
    $col++;
}

// Consultar dados
$sql = "SELECT * FROM bdcorp.tbdesligamento WHERE matrsol='$matricula1' ORDER BY nomefunc";
$resultado = mysqli_query($conexao, $sql) or die(mysqli_error($conexao));

$rowNumber = 2;
while ($row = mysqli_fetch_assoc($resultado)) {
    // Converter os dados conforme necessário
    $row['datademissao'] = ($row['datademissao'] == '0000-00-00 00:00:00') ? '00/00/0000' : $row['datademissao'];

    // Convertendo os valores binários para 'Sim' ou 'Não'
    foreach (['advertencia', 'suspensao', 'faltas', 'maconduta', 'atestados', 'atrasos', 'produtividade', 'performance', 'outros'] as $field) {
        $row[$field] = ($row[$field] == '1') ? 'Sim' : 'Não';
    }

    // Adicionar dados à planilha
    $col = 'A';
    foreach ($row as $cell) {
        $sheet->setCellValue($col . $rowNumber, $cell);
        $col++;
    }
    $rowNumber++;
}

// Criar o arquivo Excel
$writer = new Xlsx($spreadsheet);
$filename = "rel-geral-desligamento-$nome.xlsx";

// Forçar download do arquivo Excel
header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header('Content-Disposition: attachment;filename="' . $filename . '"');
header('Cache-Control: max-age=0');

$writer->save('php://output');
exit;
?>
