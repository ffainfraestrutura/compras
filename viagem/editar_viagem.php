<?php
// editar_viagem.php
date_default_timezone_set('America/Sao_Paulo');
session_start();
include "./conecta.php";
header("Content-type: text/html; charset=utf-8");

// Verificação de segurança reforçada
if (!isset($_SESSION['usuario']) {
    header("Location: index.php?erro=acesso_negado");
    exit();
}

// Validação do ID
if (!isset($_GET['id']) {
    header("Location: historico_aprovados.php?erro=id_nao_fornecido");
    exit();
}

$id_viagem = filter_var($_GET['id'], FILTER_VALIDATE_INT);
if ($id_viagem === false || $id_viagem <= 0) {
    header("Location: historico_aprovados.php?erro=id_invalido");
    exit();
}

// Consulta preparada com JOINs para evitar múltiplas queries
$sql = "SELECT 
    sv.*,
    e_ida.nome_empresa AS empresa_ida_nome,
    e_volta.nome_empresa AS empresa_volta_nome,
    emb_ida.nome_do_aeroporto AS embarque_ida_nome, emb_ida.cidade AS embarque_ida_cidade,
    desemb_ida.nome_do_aeroporto AS desembarque_ida_nome, desemb_ida.cidade AS desembarque_ida_cidade,
    h.nome_hotel, h.endereco_hotel, h.cidade_hotel
FROM bdviagem.tbsolviagem sv
LEFT JOIN bdviagem.tbempresas e_ida ON sv.idempresa_ida = e_ida.id_empresa
LEFT JOIN bdviagem.tbempresas e_volta ON sv.idempresa_volta = e_volta.id_empresa
LEFT JOIN bdviagem.tblocalviagem emb_ida ON sv.idembarque_ida = emb_ida.idlocal_viagem
LEFT JOIN bdviagem.tblocalviagem desemb_ida ON sv.iddesembarque_ida = desemb_ida.idlocal_viagem
LEFT JOIN bdviagem.tbhoteis h ON sv.idhotel = h.idhotel
WHERE sv.idtbsolviagem = ?";

$stmt = mysqli_prepare($conexao, $sql);
mysqli_stmt_bind_param($stmt, 'i', $id_viagem);
mysqli_stmt_execute($stmt);
$resultado = mysqli_stmt_get_result($stmt);
$viagem = mysqli_fetch_assoc($resultado);

if (!$viagem) {
    header("Location: historico_aprovados.php?erro=viagem_nao_encontrada");
    exit();
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>Editar Viagem - <?= htmlspecialchars($viagem['nome']) ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/select2-bootstrap-5-theme@1.3.0/dist/select2-bootstrap-5-theme.min.css" rel="stylesheet">
    <link href="./src/css/styles.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css">
    <style>
        .card-header { background-color: #f8f9fa; }
        .required-field::after { content: " *"; color: red; }
        .form-section { margin-bottom: 2rem; }
        .nav-tabs .nav-link.active { font-weight: bold; }
    </style>
</head>
<body class="sb-nav-fixed">
    <?php include "./menu.php"; ?>
    
    <div id="layoutSidenav_content">
        <main>
            <div class="container-fluid px-4">
                <div class="d-flex justify-content-between align-items-center mt-4 mb-3">
                    <h1 class="h3 mb-0">
                        <i class="bi bi-pencil-square me-2"></i>Editar Viagem
                    </h1>
                    <a href="historico_aprovados.php" class="btn btn-outline-secondary">
                        <i class="bi bi-arrow-left me-1"></i> Voltar
                    </a>
                </div>
                
                <div class="card border-0 shadow-sm">
                    <div class="card-body">
                        <form method="post" action="./control/processar_viagem.php" enctype="multipart/form-data" id="formViagem">
                            <input type="hidden" name="idtbsolviagem" value="<?= $id_viagem ?>">
                            
                            <!-- Abas para organização -->
                            <ul class="nav nav-tabs mb-4" id="viagemTabs" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" id="dados-tab" data-bs-toggle="tab" data-bs-target="#dados" type="button" role="tab">
                                        <i class="bi bi-person me-1"></i> Dados Básicos
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="ida-tab" data-bs-toggle="tab" data-bs-target="#ida" type="button" role="tab">
                                        <i class="bi bi-airplane me-1"></i> Passagem Ida
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="volta-tab" data-bs-toggle="tab" data-bs-target="#volta" type="button" role="tab">
                                        <i class="bi bi-airplane-engines me-1"></i> Passagem Volta
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="hospedagem-tab" data-bs-toggle="tab" data-bs-target="#hospedagem" type="button" role="tab">
                                        <i class="bi bi-building me-1"></i> Hospedagem
                                    </button>
                                </li>
                            </ul>
                            
                            <div class="tab-content" id="viagemTabsContent">
                                <!-- Dados Básicos -->
                                <div class="tab-pane fade show active" id="dados" role="tabpanel">
                                    <div class="row g-3">
                                        <div class="col-md-6">
                                            <label class="form-label required-field">Nome do Viajante</label>
                                            <input type="text" class="form-control" name="nome" value="<?= htmlspecialchars($viagem['nome']) ?>" required>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label required-field">CPF</label>
                                            <input type="text" class="form-control cpf-mask" name="cpf" value="<?= htmlspecialchars($viagem['cpf']) ?>" required>
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label required-field">Data de Início</label>
                                            <input type="date" class="form-control" name="dataini" value="<?= htmlspecialchars($viagem['dataini']) ?>" required>
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label required-field">Data de Término</label>
                                            <input type="date" class="form-control" name="datafim" value="<?= htmlspecialchars($viagem['datafim']) ?>" required>
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label required-field">Motivo da Viagem</label>
                                            <select class="form-select select2-field" name="idmotivo" required>
                                                <option value="">Selecione...</option>
                                                <?php
                                                $sqlMotivo = "SELECT idtbmotivo, descricao FROM bdviagem.tbmotivo";
                                                $resultadoMotivo = mysqli_query($conexao, $sqlMotivo);
                                                while ($row = mysqli_fetch_assoc($resultadoMotivo)): ?>
                                                    <option value="<?= $row['idtbmotivo'] ?>" <?= $row['idtbmotivo'] == $viagem['idmotivo'] ? 'selected' : '' ?>>
                                                        <?= htmlspecialchars($row['descricao']) ?>
                                                    </option>
                                                <?php endwhile; ?>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Passagem Ida -->
                                <div class="tab-pane fade" id="ida" role="tabpanel">
                                    <div class="row g-3">
                                        <div class="col-md-6">
                                            <label class="form-label">Empresa</label>
                                            <select class="form-select select2-field" name="idempresa_ida">
                                                <option value="">Selecione...</option>
                                                <?php
                                                $sqlEmpresa = "SELECT id_empresa, nome_empresa FROM bdviagem.tbempresas";
                                                $resultadoEmpresa = mysqli_query($conexao, $sqlEmpresa);
                                                while ($row = mysqli_fetch_assoc($resultadoEmpresa)): ?>
                                                    <option value="<?= $row['id_empresa'] ?>" <?= $row['id_empresa'] == $viagem['idempresa_ida'] ? 'selected' : '' ?>>
                                                        <?= htmlspecialchars($row['nome_empresa']) ?>
                                                    </option>
                                                <?php endwhile; ?>
                                            </select>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">Número da Reserva</label>
                                            <input type="text" class="form-control" name="nr_reserva_ida" value="<?= htmlspecialchars($viagem['nr_reserva_ida']) ?>">
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">Local de Embarque</label>
                                            <select class="form-select select2-field" name="idembarque_ida">
                                                <option value="">Selecione...</option>
                                                <?php
                                                $sqlLocal = "SELECT idlocal_viagem, nome_do_aeroporto, cidade FROM bdviagem.tblocalviagem";
                                                $resultadoLocal = mysqli_query($conexao, $sqlLocal);
                                                while ($row = mysqli_fetch_assoc($resultadoLocal)): ?>
                                                    <option value="<?= $row['idlocal_viagem'] ?>" <?= $row['idlocal_viagem'] == $viagem['idembarque_ida'] ? 'selected' : '' ?>>
                                                        <?= htmlspecialchars($row['nome_do_aeroporto'] . ' - ' . $row['cidade']) ?>
                                                    </option>
                                                <?php endwhile; ?>
                                            </select>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">Local de Desembarque</label>
                                            <select class="form-select select2-field" name="iddesembarque_ida">
                                                <option value="">Selecione...</option>
                                                <?php
                                                $resultadoLocal = mysqli_query($conexao, $sqlLocal);
                                                mysqli_data_seek($resultadoLocal, 0); // Reinicia o ponteiro do resultado
                                                while ($row = mysqli_fetch_assoc($resultadoLocal)): ?>
                                                    <option value="<?= $row['idlocal_viagem'] ?>" <?= $row['idlocal_viagem'] == $viagem['iddesembarque_ida'] ? 'selected' : '' ?>>
                                                        <?= htmlspecialchars($row['nome_do_aeroporto'] . ' - ' . $row['cidade']) ?>
                                                    </option>
                                                <?php endwhile; ?>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Adicione aqui as abas para Passagem Volta e Hospedagem seguindo o mesmo padrão -->
                                
                            </div>
                            
                            <div class="d-flex justify-content-between mt-4 border-top pt-3">
                                <button type="button" class="btn btn-outline-secondary" onclick="history.back()">
                                    <i class="bi bi-x-circle me-1"></i> Cancelar
                                </button>
                                <div>
                                    <button type="reset" class="btn btn-warning me-2">
                                        <i class="bi bi-arrow-counterclockwise me-1"></i> Limpar
                                    </button>
                                    <button type="submit" class="btn btn-success">
                                        <i class="bi bi-check-circle me-1"></i> Salvar Alterações
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Scripts -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.mask/1.14.16/jquery.mask.min.js"></script>
    
    <script>
        $(document).ready(function() {
            // Inicializa Select2
            $('.select2-field').select2({
                theme: 'bootstrap-5',
                width: '100%',
                language: 'pt-BR',
                placeholder: 'Selecione uma opção',
                allowClear: true
            });
            
            // Máscaras para campos
            $('.cpf-mask').mask('000.000.000-00');
            
            // Validação do formulário
            $('#formViagem').on('submit', function(e) {
                let isValid = true;
                $('.required-field').each(function() {
                    const field = $(this).closest('.form-group').find('input, select, textarea');
                    if (!field.val()) {
                        isValid = false;
                        field.addClass('is-invalid');
                    } else {
                        field.removeClass('is-invalid');
                    }
                });
                
                if (!isValid) {
                    e.preventDefault();
                    alert('Por favor, preencha todos os campos obrigatórios.');
                    $('#dados-tab').tab('show'); // Mostra a primeira aba com erros
                }
            });
            
            // Alternar entre abas e salvar o estado
            $('a[data-bs-toggle="tab"]').on('shown.bs.tab', function(e) {
                localStorage.setItem('lastTab', $(e.target).attr('href'));
            });
            
            const lastTab = localStorage.getItem('lastTab');
            if (lastTab) {
                $('[href="' + lastTab + '"]').tab('show');
            }
        });
    </script>
</body>
</html>