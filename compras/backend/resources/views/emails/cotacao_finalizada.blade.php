<!DOCTYPE html>
<html>

<head>
    <title>Cotação de Material</title>
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

        .table-container {
            margin: 20px 0;
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

        tr:nth-child(even) {
            background-color: #f8f9fa;
        }

        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
        }

        .info-box {
            background-color: #e9ecef;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
    </style>
</head>

<body>
    <div class="header">
        <h2>Cotação de Material Realizada</h2>
    </div>

    <!-- Informações da cotação -->
    <div class="info-box">
        <p><strong>Código da Cotação:</strong> {{ $dados['cod_cotacao'] }}</p>
        <p><strong>Data:</strong> {{ $dados['data_finalizacao'] }}</p>
        <p><strong>Quantidade de Itens:</strong> {{ $dados['quantidade_itens'] }}</p>
    </div>

    <!-- Tabela de materiais cotados -->
    <div class="table-container">
        <h4>Itens Cotados</h4>
        <table>
            <thead>
                <tr>
                    <th>Código Material</th>
                    <th>Quantidade</th>
                    <th>Data Solicitação</th>
                </tr>
            </thead>
            <tbody>
                @foreach($dados['materiais'] as $material)
                    <tr>
                        <td>{{ $material->cod_material }}</td>
                        <td>{{ $material->quantidade }}</td>
                        <td>
                            @php
                                $data = is_string($material->data_solicitacao)
                                    ? \Carbon\Carbon::parse($material->data_solicitacao)
                                    : $material->data_solicitacao;
                            @endphp
                            {{ $data->format('d/m/Y H:i') }}
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <p><strong>Total de itens cotados:</strong> {{ $dados['quantidade_itens'] }}</p>
    </div>

    <div class="footer">
        <p>Atenciosamente,<br><strong>Sistema de Compras</strong></p>
        <p style="font-size: 12px; color: #6c757d;">
            Este é um email automático, por favor não responda.
        </p>
    </div>
</body>

</html>