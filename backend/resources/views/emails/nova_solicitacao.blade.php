<!DOCTYPE html>
<html>

<head>
    <title>Nova Solicitação de Compra</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }

        .header {
            background-color: #f8f9fa;
            padding: 20px;
            border-bottom: 2px solid #dee2e6;
        }

        .info-box {
            background-color: #e9ecef;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }

        th {
            background-color: #343a40;
            color: white;
            padding: 12px;
            text-align: left;
            border: 1px solid #454d55;
        }

        td {
            padding: 10px;
            border: 1px solid #dee2e6;
        }

        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
        }

        .status-pendente {
            color: #28a745;
            font-weight: bold;
        }
    </style>
</head>

<body>
    <div class="info-box">
        <p><strong>Solicitante:</strong> {{ $solicitacao->solicitante }}</p>
        <p><strong>Código da Compra:</strong> {{ $solicitacao->cod_compra }}</p>
        <p><strong>Data da Solicitação:</strong>
            @php
                $data = is_string($solicitacao->data_solicitacao)
                    ? \Carbon\Carbon::parse($solicitacao->data_solicitacao)
                    : $solicitacao->data_solicitacao;
            @endphp
            {{ $data->format('d/m/Y H:i') }}
        </p>
        <p><strong>Justificativa:</strong> {{ $solicitacao->justificativa_solicitante }}</p>
        <p><strong>Filial:</strong> {{ $solicitacao->filial_id }}</p>
    </div>

    <!-- Detalhes do material -->
    <div class="table-container">
        <h4>Detalhes do Material</h4>
        <table>
            <tr>
                <th>Código do Material</th>
                <td>{{ $solicitacao->cod_material }}</td>
            </tr>
            <tr>
                <th>Quantidade</th>
                <td>{{ $solicitacao->quantidade }}</td>
            </tr>
            <tr>
                <th>Status</th>
                <td><span class="status-pendente">● Pendente</span></td>
            </tr>
        </table>
    </div>

    <div class="footer">
        <p>Atenciosamente,<br><strong>Sistema de Compras</strong></p>
        <p style="font-size: 12px; color: #6c757d;">
            Este é um email automático, por favor não responda.
        </p>
    </div>
</body>

</html>