<?php
// Conecte-se ao banco de dados
include "../conecta.php";

if (!$conexao) {
    die('Não foi possível conectar ao banco de dados: ' . mysqli_connect_error());
}

$response = array('success' => false, 'message' => '');

if (isset($_POST['idmotivo'])) {
    $idMotivo = intval($_POST['idmotivo']);
    $sql = "DELETE FROM bdviagem.tbmotivo WHERE idtbmotivo = $idMotivo";

    if (mysqli_query($conexao, $sql)) {
        $response['success'] = true;
        $response['message'] = 'Motivo excluído com sucesso!';
    } else {
        $response['message'] = 'Erro ao excluir o motivo: ' . mysqli_error($conexao);
    }
} else {
    $response['message'] = 'ID do motivo não fornecido.';
}

mysqli_close($conexao);
echo json_encode($response);
?>
<?php
header('Content-Type: application/json');
$conexao = mysqli_connect('localhost', 'usuario', 'senha', 'bdviagem');

if (!$conexao) {
  echo json_encode(['success' => false, 'message' => 'Não foi possível conectar ao banco de dados.']);
  exit;
}

$idmotivo = $_POST['idmotivo'];

if ($idmotivo) {
  $sql = "DELETE FROM tbmotivo WHERE idtbmotivo = ?";
  $stmt = mysqli_prepare($conexao, $sql);
  mysqli_stmt_bind_param($stmt, 'i', $idmotivo);
  
  if (mysqli_stmt_execute($stmt)) {
    echo json_encode(['success' => true]);
  } else {
    echo json_encode(['success' => false, 'message' => 'Falha ao excluir o motivo.']);
  }
  
  mysqli_stmt_close($stmt);
} else {
  echo json_encode(['success' => false, 'message' => 'ID do motivo não fornecido.']);
}

mysqli_close($conexao);
?>
