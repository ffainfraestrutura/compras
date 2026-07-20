<?php 
date_default_timezone_set('America/Sao_Paulo');
session_start();
include "./conecta.php";

$usuariof = $_SESSION['usuario'];
$matricula1 = $_SESSION['matricula'];
$tipo = $_SESSION['tipo'];
$tipo_enquete = $_SESSION['tipo_enquete'];

if ($usuariof == null) {
    echo "<script language='javascript' type='text/javascript'>alert('Você deve logar para ter acesso');window.location=\"index.php\"</script>";
}
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório Geral</title>
    <link href="./src/css/styles.css" rel="stylesheet"/>
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css">

</head>
<style>
    /* Estilo geral para garantir que o layout ocupe toda a altura */
    html,
    body {
        height: 100%;
        margin: 0;
    }

    /* Flexbox para a área principal, garantindo que o conteúdo ocupe a altura disponível */
    #layoutSidenav_content {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    /* Main vai crescer para ocupar o restante do espaço */
    main {
        flex-grow: 1;
    }
</style>
<body class="sb-nav-fixed">
<?php include "./menu.php"; ?>

<div id="layoutSidenav_content">
        <header>
            <h1 class="h1 pt-3 pb-2 col-11 text-center">Relatório Geral</h1>
        </header>
        <main style="width: 100%;" class="mb-2">
            <div class="container-fluid px-4 col-sm-12">
            <table id="example" class="display" style="width:100%">
                <thead>
                    <tr>
                        <th></th> <!-- Coluna para o ícone de detalhe -->
                        <th>Nome</th>
                        <th>Posição</th>
                        <th>Escritório</th>
                        <th>Idade</th>
                        <th>Data de início</th>
                        <th>Salário</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="dt-control"></td>
                        <td>Tiger Nixon</td>
                        <td>System Architect</td>
                        <td>Edinburgh</td>
                        <td>61</td>
                        <td>2011/04/25</td>
                        <td>$320,800</td>
                    </tr>
                </tbody>
            </table>
            </div>
        </main>
    </div>
    <script src="./src/js/scripts.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous"></script>
    <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>

        <!-- Script -->
        <script>
    $(document).ready(function() {
        // Função para renderizar as linhas de detalhe
        function format(rowData) {
            return `
                <table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">
                    <tr>
                        <td>Nome Completo:</td>
                        <td>${rowData[1]}</td>
                    </tr>
                    <tr>
                        <td>Posição:</td>
                        <td>${rowData[2]}</td>
                    </tr>
                    <tr>
                        <td>Escritório:</td>
                        <td>${rowData[3]}</td>
                    </tr>
                    <tr>
                        <td>Idade:</td>
                        <td>${rowData[4]}</td>
                    </tr>
                </table>
            `;
        }

        // Inicializando o DataTables
        var table = $('#example').DataTable({
            columnDefs: [{
                orderable: false,
                className: 'dt-control',
                targets: 0
            }],
            order: [[1, 'asc']]
        });

        // Evento de clique no ícone de detalhe
        $('#example tbody').on('click', 'td.dt-control', function() {
            var tr = $(this).closest('tr');
            var row = table.row(tr);

            if (row.child.isShown()) {
                row.child.hide();
                tr.removeClass('shown');
            } else {
                row.child(format(row.data())).show();
                tr.addClass('shown');
            }
        });
    });
    </script>
</body>
</html>