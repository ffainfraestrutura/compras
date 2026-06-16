<!DOCTYPE html>
<html>

<head>
    <title>Atualização de Solicitação de Compra</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: {{ $status == 'reprovado' ? '#dc3545' : '#28a745' }};
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background-color: #f8f9fa;
            padding: 20px;
            border: 1px solid #dee2e6;
            border-top: none;
            border-radius: 0 0 5px 5px;
        }
        .info-box {
            background-color: white;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid {{ $status == 'reprovado' ? '#dc3545' : '#28a745' }};
        }
        .badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
            color: white;
            background-color: {{ $status == 'reprovado' ? '#dc3545' : '#28a745' }};
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            background-color: white;
        }
        th {
            background-color: #343a40;
            color: white;
            padding: 10px;
            text-align: left;
            font-size: 14px;
        }
        td {
            padding: 10px;
            border: 1px solid #dee2e6;
            font-size: 14px;
        }
        .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 12px;
            text-align: center;
        }
        .status-aprovado {
            color: #28a745;
            font-weight: bold;
        }
        .status-reprovado {
            color: #dc3545;
            font-weight: bold;
        }
        .status-pendente {
            color: #ffc107;
            font-weight: bold;
        }
        .justificativa {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 10px;
            margin: 10px 0;
            font-style: italic;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h2>
                @if($status == 'reprovado')
                    Solicitação Reprovada
                @else
                    Solicitação Aprovada
                @endif
            </h2>
            <p>Cçõdigo da Compra: {{ $solicitacoes[0]->cod_compra }}</p>
        </div>

        <div class="content">
            <!-- Informações do Aprovador -->
            <div class="info-box">
                <h3 style="margin-top: 0;">Informações da Aprovação</h3>
                <p><strong>Aprovador:</strong> {{ $aprovador->nome ?? $aprovador->matricula }}</p>
                <p><strong>Nível:</strong> {{ $nomeNivel }}</p>
                <p><strong>Data da Aprovação:</strong> {{ \Carbon\Carbon::now()->format('d/m/Y H:i') }}</p>
                <p><strong>Status:</strong> 
                    <span class="badge">
                        {{ $status == 'reprovado' ? 'REPROVADO' : 'APROVADO' }}
                    </span>
                </p>
            </div>

            @if($justificativa)
            <div class="justificativa">
                <strong>Justificativa:</strong>
                <p>{{ $justificativa }}</p>
            </div>
            @endif

            <!-- Informações do Solicitante -->
            <div class="info-box">
                <h3 style="margin-top: 0;">Informações do Solicitante</h3>
                <p><strong>Solicitante:</strong> {{ $solicitacoes[0]->solicitante }}</p>
                <p><strong>Data da Solicitaçãoo:</strong> 
                    @php
                        $data = is_string($solicitacoes[0]->data_solicitacao)
                            ? \Carbon\Carbon::parse($solicitacoes[0]->data_solicitacao)
                            : $solicitacoes[0]->data_solicitacao;
                    @endphp
                    {{ $data->format('d/m/Y H:i') }}
                </p>
                <p><strong>Justificativa do Solicitante:</strong> {{ $solicitacoes[0]->justificativa_solicitante }}</p>
            </div>

            <!-- Tabela de Itens -->
            <h3>Itens da Solicitaçãoo</h3>
            <table>
                <thead>
                    <tr>
                        <th>Código Material</th>
                        <th>Quantidade</th>
                        <th>Status Atual</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($solicitacoes as $solicitacao)
                    <tr>
                        <td>{{ $solicitacao->cod_material }}</td>
                        <td>{{ $solicitacao->quantidade }}</td>
                        <td>
                            @if($solicitacao->aceite_diretor == 1)
                                <span class="status-aprovado">? Aprovado</span>
                            @elseif($solicitacao->aceite_diretor == 2)
                                <span class="status-reprovado">? Reprovado</span>
                            @else
                                <span class="status-pendente">? Pendente</span>
                            @endif
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>

            <!-- Histçõrico de Aprovações -->
            <h3>Histórico de Aprovações</h3>
            <table>
                <thead>
                    <tr>
                        <th>Nível</th>
                        <th>Status</th>
                        <th>Data</th>
                        <th>Responsável</th>
                    </tr>
                </thead>
                <tbody>
                    @php
                        $solicitacao = $solicitacoes[0];
                    @endphp
                    
                    @if($solicitacao->aceite_material)
                    <tr>
                        <td>Material</td>
                        <td>
                            @if($solicitacao->aceite_material == 1)
                                <span class="status-aprovado">Aprovado</span>
                            @elseif($solicitacao->aceite_material == 2)
                                <span class="status-reprovado">Reprovado</span>
                            @endif
                        </td>
                        <td>{{ $solicitacao->data_material ? \Carbon\Carbon::parse($solicitacao->data_material)->format('d/m/Y H:i') : '-' }}</td>
                        <td>{{ $solicitacao->matricula_material ?? '-' }}</td>
                    </tr>
                    @endif

                    @if($solicitacao->aceite_compra)
                    <tr>
                        <td>Compras</td>
                        <td>
                            @if($solicitacao->aceite_compra == 1)
                                <span class="status-aprovado">Aprovado</span>
                            @elseif($solicitacao->aceite_compra == 2)
                                <span class="status-reprovado">Reprovado</span>
                            @endif
                        </td>
                        <td>{{ $solicitacao->data_compra ? \Carbon\Carbon::parse($solicitacao->data_compra)->format('d/m/Y H:i') : '-' }}</td>
                        <td>{{ $solicitacao->matricula_compra ?? '-' }}</td>
                    </tr>
                    @endif

                    @if($solicitacao->aceite_gerente)
                    <tr>
                        <td>Gerente</td>
                        <td>
                            @if($solicitacao->aceite_gerente == 1)
                                <span class="status-aprovado">Aprovado</span>
                            @elseif($solicitacao->aceite_gerente == 2)
                                <span class="status-reprovado">Reprovado</span>
                            @endif
                        </td>
                        <td>{{ $solicitacao->data_gerente ? \Carbon\Carbon::parse($solicitacao->data_gerente)->format('d/m/Y H:i') : '-' }}</td>
                        <td>{{ $solicitacao->matricula_gerente ?? '-' }}</td>
                    </tr>
                    @endif

                    @if($solicitacao->aceite_diretor)
                    <tr>
                        <td>Diretor</td>
                        <td>
                            @if($solicitacao->aceite_diretor == 1)
                                <span class="status-aprovado">Aprovado</span>
                            @elseif($solicitacao->aceite_diretor == 2)
                                <span class="status-reprovado">Reprovado</span>
                            @endif
                        </td>
                        <td>{{ $solicitacao->data_diretor ? \Carbon\Carbon::parse($solicitacao->data_diretor)->format('d/m/Y H:i') : '-' }}</td>
                        <td>{{ $solicitacao->matricula_diretor ?? '-' }}</td>
                    </tr>
                    @endif
                </tbody>
            </table>

            <p><strong>Total de itens:</strong> {{ count($solicitacoes) }}</p>
        </div>

        <div class="footer">
            <p>Atenciosamente,<br><strong>Sistema de Compras</strong></p>
            <p>Este é um email automático, por favor não responda.</p>
            <p>Para mais informações, acesse o sistema.</p>
        </div>
    </div>
</body>

</html>