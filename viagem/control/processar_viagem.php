<?php
include "./conecta.php";
session_start();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $target_dir = "/var/www/html/viagem/uploads/"; // diretório onde os arquivos serão armazenados
    
    // Inicializa variáveis de imagem
    $img_passagem_ida = null;
    $img_passagem_volta = null;

    // Função para tratar o upload de arquivos
    function uploadFile($file, $target_dir) {
        if (isset($file) && $file["size"] > 0) {
            $target_file = $target_dir . basename($file["name"]);
            $uploadOk = 1;
            $imageFileType = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));
            
            // Verifica o tamanho do arquivo
            if ($file["size"] > 10000000) {
                echo "Desculpe, seu arquivo é muito grande.";
                $uploadOk = 0;
            }

            // Permite apenas alguns tipos de arquivos
            $allowed_extensions = array("jpg", "jpeg", "png", "gif", "pdf");
            if (!in_array($imageFileType, $allowed_extensions)) {
                echo "Desculpe, apenas arquivos JPG, JPEG, PNG, GIF e PDF são permitidos.";
                $uploadOk = 0;
            }
            
            // Tenta fazer o upload do arquivo se não houver erros
            if ($uploadOk == 1) {
                if (move_uploaded_file($file["tmp_name"], $target_file)) {
                    return basename($file["name"]);
                } else {
                    echo "Desculpe, houve um erro ao enviar seu arquivo.";
                    return null;
                }
            }
        }
        return null;
    }

    // Trata o upload dos arquivos
    if (isset($_FILES["img_passagem_ida"]) && $_FILES["img_passagem_ida"]["size"] > 0) {
        $img_passagem_ida = uploadFile($_FILES["img_passagem_ida"], $target_dir);
    }
    
    if (isset($_FILES["img_passagem_volta"]) && $_FILES["img_passagem_volta"]["size"] > 0) {
        $img_passagem_volta = uploadFile($_FILES["img_passagem_volta"], $target_dir);
    }

    // Captura os dados do formulário
    $idtbsolviagem = mysqli_real_escape_string($conexao, $_POST['idtbsolviagem']);
    
    // Função para tratar valores nulos para campos inteiros
    function getIntValue($value, $conexao) {
        if (isset($value) && $value !== '') {
            return mysqli_real_escape_string($conexao, $value);
        }
        return 'NULL';
    }
    
    // Função para tratar valores nulos para campos de texto
    function getTextValue($value, $conexao) {
        if (isset($value) && $value !== '') {
            return "'" . mysqli_real_escape_string($conexao, $value) . "'";
        }
        return 'NULL';
    }
    
    // Função para formatar valores monetários (converte vírgula para ponto)
    function formatMoneyValue($value, $conexao) {
        if (isset($value) && $value !== '') {
            // Remove pontos de milhar e substitui vírgula decimal por ponto
            $value = str_replace('.', '', $value); // Remove pontos de milhar
            $value = str_replace(',', '.', $value); // Substitui vírgula decimal por ponto
            return "'" . mysqli_real_escape_string($conexao, $value) . "'";
        }
        return 'NULL';
    }

    //PASSAGEM IDA - Tratamento para valores vazios
    $idembarque_ida = getIntValue($_POST['idembarque_ida'] ?? '', $conexao);
    $iddesembarque_ida = getIntValue($_POST['iddesembarque_ida'] ?? '', $conexao);
    $passagem_ida = getIntValue($_POST['passagem_ida'] ?? '', $conexao);
    $idempresa_ida = getIntValue($_POST['idempresa_ida'] ?? '', $conexao);
    $nr_reserva_ida = getTextValue($_POST['nr_reserva_ida'] ?? '', $conexao);
    $embarque_ida = getTextValue($_POST['embarque_ida'] ?? '', $conexao);
    $horario_voo_ida = getTextValue($_POST['horario_voo_ida'] ?? '', $conexao);
    $desembarque_ida = getTextValue($_POST['desembarque_ida'] ?? '', $conexao);
    $valor_ida = formatMoneyValue($_POST['valor_ida'] ?? '', $conexao); // Usando a nova função
    
    //PASSAGEM VOLTA - Tratamento para valores vazios
    $passagem_volta = getIntValue($_POST['passagem_volta'] ?? '', $conexao);
    $idembarque_volta = getIntValue($_POST['idembarque_volta'] ?? '', $conexao);
    $iddesembarque_volta = getIntValue($_POST['iddesembarque_volta'] ?? '', $conexao);
    $idempresa_volta = getIntValue($_POST['idempresa_volta'] ?? '', $conexao);
    $nr_reserva_volta = getTextValue($_POST['nr_reserva_volta'] ?? '', $conexao);
    $embarque_volta = getTextValue($_POST['embarque_volta'] ?? '', $conexao);
    $horario_voo_volta = getTextValue($_POST['horario_voo_volta'] ?? '', $conexao);
    $desembarque_volta = getTextValue($_POST['desembarque_volta'] ?? '', $conexao);
    $valor_passagem_volta = formatMoneyValue($_POST['valor_passagem_volta'] ?? '', $conexao); // Usando a nova função
    
    //HOTEL - Tratamento para valores vazios
    $idhotel = getIntValue($_POST['idhotel'] ?? '', $conexao);
    $hospedagem = getIntValue($_POST['hospedagem'] ?? '', $conexao);
    $nome_hotel = getTextValue($_POST['nome_hotel'] ?? '', $conexao);
    $endereco_hotel = getTextValue($_POST['endereco_hotel'] ?? '', $conexao);
    $valor_diaria = formatMoneyValue($_POST['valor_diaria'] ?? '', $conexao); // Usando a nova função

    // Monta a consulta SQL
    $sql = "UPDATE bdviagem.tbsolviagem SET
               idempresa_ida = $idempresa_ida,
               nr_reserva_ida = $nr_reserva_ida,
               embarque_ida = $embarque_ida,
               horario_voo_ida = $horario_voo_ida,
               desembarque_ida = $desembarque_ida,
               valor_ida = $valor_ida,
               idempresa_volta = $idempresa_volta,
               nr_reserva_volta = $nr_reserva_volta,
               embarque_volta = $embarque_volta,
               horario_voo_volta = $horario_voo_volta,
               desembarque_volta = $desembarque_volta,
               valor_passagem_volta = $valor_passagem_volta,
               nome_hotel = $nome_hotel,
               endereco_hotel = $endereco_hotel,
               valor_diaria = $valor_diaria,
               idhotel = $idhotel,
               idembarque_ida = $idembarque_ida,
               iddesembarque_ida = $iddesembarque_ida,
               idembarque_volta = $idembarque_volta,
               iddesembarque_volta = $iddesembarque_volta";

    // Inclui as imagens se estiverem definidas
    if ($img_passagem_ida) {
        $img_passagem_ida_escaped = "'" . mysqli_real_escape_string($conexao, $img_passagem_ida) . "'";
        $sql .= ", img_passagem_ida = $img_passagem_ida_escaped";
    }

    if ($img_passagem_volta) {
        $img_passagem_volta_escaped = "'" . mysqli_real_escape_string($conexao, $img_passagem_volta) . "'";
        $sql .= ", img_passagem_volta = $img_passagem_volta_escaped";
    }

    $sql .= " WHERE idtbsolviagem = '$idtbsolviagem'";

    // Para debug - agora você vai ver o valor formatado
    // echo $sql;
    // exit;

    // Executar a consulta SQL
    $resultado = mysqli_query($conexao, $sql);

    // Verificar se a consulta foi executada com sucesso e redirecionar
    if ($resultado) {
        echo "<script>alert('Detalhes da viagem atualizados com sucesso.'); window.location.href = '../versolicitacao.php';</script>";
    } else {
        echo "Erro ao atualizar detalhes da viagem: " . mysqli_error($conexao) . "<br>";
        echo "SQL: " . $sql; // Isso vai mostrar o SQL gerado para ajudar no debug
    }
} else {
    echo "Método de requisição inválido.";
}
?>