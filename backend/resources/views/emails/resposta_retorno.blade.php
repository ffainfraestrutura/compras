<!DOCTYPE html>
<html>

<head>
    <title>Resposta ao Retorno</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }

        .header {
            background-color: #17a2b8;
            color: white;
            padding: 20px;
            text-align: center;
        }

        .content {
            padding: 20px;
            background-color: #f8f9fa;
        }

        .info-box {
            background-color: white;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid #17a2b8;
        }

        .origem-box {
            background-color: #e9ecef;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }

        .resposta-box {
            background-color: #d4edda;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid #28a745;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            background-color: white;
        }

        th {
            background-color: #343a40;
            color: white;
            padding: 10px;
            text-align: left;
        }

        td {
            padding: 10px;
            border: 1px solid #dee2e6;
        }

        .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            text-align: center;
        }
    </style>
</head>

<body>
    <div class="header">
        <h2>📨 Resposta ao seu Retorno</h2>
        <p>Código da Compra: {{ $solicitacoes[0]->cod_compra }}</p>
    </div>

    <div class="content">
        <div class="origem-box">
            <h3>Seu Retorno</h3>
            <p><strong>Data do retorno:</strong> {{ \Carbon\Carbon::now()->subDays(1)->format('d/m/Y H:i') }}</p>
            <p><strong>Setor de origem:</strong> {{ $setorOrigem }}</p>
            <p><strong>Sua justificativa:</strong> {{ $justificativaOriginal }}</p>
        </div>

        <div class="resposta-box">
            <h3>Resposta Recebida</h3>
            <p><strong>Respondido por:</strong> {{ $respondedor->nome ?? $respondedor->matricula }}</p>
            <p><strong>Setor do respondedor:</strong> {{ $respondedor->compras }}</p>
            <p><strong>Data da resposta:</strong> {{ \Carbon\Carbon::now()->format('d/m/Y H:i') }}</p>
            <p><strong>Resposta:</strong> {{ $resposta }}</p>
        </div>

        <h3>Itens da Solicitação</h3>
        <table>
            <thead>
                <tr>
                    <th>Código Material</th>
                    <th>Quantidade</th>
                    <th>Solicitante</th>
                </tr>
            </thead>
            <tbody>
                @foreach($solicitacoes as $solicitacao)
                    <tr>
                        <td>{{ $solicitacao->cod_material }}</td>
                        <td>{{ $solicitacao->quantidade }}</td>
                        <td>{{ $solicitacao->solicitante }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>Atenciosamente,<br><strong>Sistema de Compras</strong></p>
        <p>Este é um email automático, por favor não responda.</p>
    </div>
</body>

</html>