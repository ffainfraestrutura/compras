<!DOCTYPE html>
<html>

<head>
    <title>Processo Retornado</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }

        .header {
            color: #333;
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
            border-left: 4px solid #ffc107;
        }

        .justificativa {
            background-color: #fff3cd;
            padding: 10px;
            margin: 10px 0;
            font-style: italic;
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
        <h2>🔄 Processo Retornado</h2>
        <p>Código da Compra: {{ $solicitacoes[0]->cod_compra }}</p>
    </div>

    <div class="content">
        <div class="info-box">
            <h3>Informações do Retorno</h3>
            <p><strong>Retornado por:</strong> {{ $origem->nome ?? $origem->matricula }}</p>
            <p><strong>Setor de Destino:</strong> {{ $setorDestino }}</p>
            <p><strong>Data do Retorno:</strong> {{ \Carbon\Carbon::now()->format('d/m/Y H:i') }}</p>
        </div>

        @if($justificativa)
            <div class="justificativa">
                <strong>Justificativa do Retorno:</strong>
                <p>{{ $justificativa }}</p>
            </div>
        @endif

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