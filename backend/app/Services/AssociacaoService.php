<?php
namespace App\Services;

use Illuminate\Support\Facades\DB;
use Exception;

class AssociacaoService
{
    /**
     * Método chamado pelo Controller no getDados
     */
    public function buscarDadosPendentes($filtros)
    {
        return [
            'pedidos' => $this->getPedidosComJoins($filtros),
            'notas' => $this->getNotasComJoins($filtros)
        ];
    }

    /**
     * Busca Pedidos + Cotações + Fornecedor + Descrição Material (Tabela 1 e 2)
     * Utiliza Query Builder com Joins para alta performance.
     */
    private function getPedidosComJoins($filtros)
    {
        // Query Principal: Busca tbsol_compra e cruza com materiais_cotados
        $query = DB::connection('DBCompra')->table('tbsol_compra as sol')
            // JOIN com as Cotações para pegar preços e fornecedores
            // A chave é composta: mesmo código de cotação E mesmo material
            ->join('tbmateriais_cotados as mc', function ($join) {
                $join->on('sol.cod_cotacao', '=', 'mc.cod_cotacao')
                    ->on('sol.cod_material', '=', 'mc.cod_material');
            })
            // JOIN com Fornecedor da cotação para pegar Razão Social e CNPJ
            ->join('tbfornecedor as f', 'mc.fornecedor_id', '=', 'f.id')

            // LEFT JOIN com Tabela de Materiais 1
            ->leftJoin('tb_material as m1', 'sol.cod_material', '=', 'm1.codmat')
            // LEFT JOIN com Tabela de Materiais 2 (caso não ache na 1)
            ->leftJoin('tbmaterial_aniel as m2', 'sol.cod_material', '=', 'm2.codmat')

            // Filtros básicos de status
            ->where('sol.finalizado', '=', '1')
            ->whereNull('sol.entregue') // Apenas pedidos abertos
            ->where('sol.visivel', '1')

            // Seleção de Campos
            ->select(
                'sol.id as pedido_id',
                'sol.cod_compra',
                'sol.cod_material as sku',
                'sol.quantidade',

                // COALESCE: Se m1.descricao for null, pega m2.descricao
                DB::raw('COALESCE(m1.descricao, m2.descricao, "Material Sem Descrição") as produto_desc'),

                // Dados da Cotação Específica (serão agrupados abaixo)
                'mc.id as cota_id',
                'mc.preco',
                'f.razao_social as fornecedor_nome',
                'f.cnpj as fornecedor_cnpj'
            );

        // Filtro de Busca (Search Bar do Front)
        if (!empty($filtros['search'])) {
            $term = $filtros['search'];
            $query->where(function ($q) use ($term) {
                $q->where('sol.cod_compra', 'like', "%{$term}%")
                    ->orWhere('f.razao_social', 'like', "%{$term}%")
                    ->orWhere('sol.cod_material', 'like', "%{$term}%");
            });
        }

        // Executa a query. O resultado virá "achatado" (várias linhas para o mesmo pedido se tiver várias cotações)
        $resultFlat = $query->get();

        // Agrupa pelo ID do Pedido para montar a estrutura hierárquica (Pedido -> Lista de Cotações)
        return $resultFlat->groupBy('pedido_id')->map(function ($grupo) {
            // Pega a primeira linha para dados comuns do pedido
            $first = $grupo->first();

            // Lógica de Vencedor: O menor preço do grupo
            $vencedor = $grupo->sortBy('preco')->first();

            // Formata a lista de cotações para o frontend expandir
            $cotacoes = $grupo->map(function ($row) use ($vencedor) {
                return [
                    'fornecedor' => $row->fornecedor_nome,
                    'preco' => (float) $row->preco,
                    'vencedor' => ($row->cota_id === $vencedor->cota_id) // Flag para o front pintar de verde
                ];
            })->values(); // Resetar índices do array

            return [
                'id' => $first->pedido_id,
                'codigo_compra' => $first->cod_compra,
                'fornecedor_nome' => $vencedor->fornecedor_nome, // Nome do vencedor
                'fornecedor_cnpj' => $vencedor->fornecedor_cnpj, // CNPJ do vencedor (usado para validação)
                'produto' => $first->produto_desc,
                'sku' => $first->sku,
                'qtd' => (float) $first->quantidade,
                'valor_unitario' => (float) $vencedor->preco,
                'cotacoes' => $cotacoes
            ];
        })->values(); // Retorna como array indexado para JSON
    }

    /**
     * Busca Notas Fiscais + Fornecedor + Itens da Nota (tbitens_nota)
     */
    private function getNotasComJoins($filtros)
    {
        $query = DB::connection('DBCompra')->table('tbnotas_fiscais as nf')
            ->join('tbfornecedor as f', 'nf.fornecedor_id', '=', 'f.id')
            // JOIN com a tabela de itens que você especificou
            ->join('tbitens_nota as it', 'nf.id', '=', 'it.nota_fiscal_id')

            ->where('nf.status', 'pendente') // Apenas notas não processadas

            ->select(
                'nf.id as nota_id',
                'nf.numero',
                'f.razao_social as fornecedor_nome',
                'f.cnpj as fornecedor_cnpj',

                // Dados do Item da Nota
                'it.codigo_material as item_sku', // Deve bater com o SKU do pedido
                'it.descricao as item_desc',
                'it.quantidade as item_qtd',
                'it.valor_unitario as item_valor'
            );

        if (!empty($filtros['search'])) {
            $term = $filtros['search'];
            $query->where(function ($q) use ($term) {
                $q->where('nf.numero', 'like', "%{$term}%")
                    ->orWhere('f.razao_social', 'like', "%{$term}%");
            });
        }

        $resultFlat = $query->get();

        // Agrupa por Nota Fiscal para aninhar os itens dentro do cabeçalho
        return $resultFlat->groupBy('nota_id')->map(function ($grupo) {
            $header = $grupo->first();

            $itens = $grupo->map(function ($row) {
                return [
                    'sku' => $row->item_sku,
                    'produto' => $row->item_desc,
                    'qtd' => (float) $row->item_qtd,
                    'valor_unitario' => (float) $row->item_valor
                ];
            })->values();

            return [
                'id' => $header->nota_id,
                'numero' => $header->numero,
                'fornecedor_nome' => $header->fornecedor_nome,
                'fornecedor_cnpj' => $header->fornecedor_cnpj, // Usado para validar com o pedido
                'itens' => $itens
            ];
        })->values();
    }

    /**
     * Processa a Associação (Chamado pelo Controller no método confirmar)
     */
    public function processarAssociacao($payload)
    {
        DB::beginTransaction();
        try {
            $statusFinal = $payload['status_sugerido'];
            $notificarGestor = $payload['flg_notificar_gestor'] ?? true;
            $usuarioId = auth('api')->user();
            $usuarioId = $usuarioId['matricula'];
            $now = now();

            // Mapeia o status do Front para o status do Banco de Dados
            $statusCompra = match ($statusFinal) {
                'DIRETORIA' => 'aguardando_diretoria',
                'GESTOR' => 'pendencia_gestor',
                'APROVADO' => 'finalizado',
                default => 'em_analise'
            };

            $insertData = [];

            foreach ($payload['itens_conciliados'] as $item) {
                $insertData[] = [
                    // Dados do item específico
                    'cod_material' => $item['sku'] ?? $item['cod_material'],
                    'qtd_ped' => $item['qtdPedido'] ?? 0,
                    'qtd_nf' => $item['qtdNota'] ?? 0,
                    'delta_qtd' => $item['deltaQtd'] ?? 0,
                    'delta_valor' => $item['deltaValor'] ?? 0,
                    'status_item' => $item['status'] ?? 'OK',

                    // Dados da associação (repetidos para cada item)
                    'status_associacao' => $statusFinal,
                    'status_compra' => $statusCompra,
                    'ids_pedidos' => json_encode($payload['ids_pedidos_compra']),
                    'ids_notas' => json_encode($payload['ids_notas_fiscais']),
                    'total_itens' => count($payload['itens_conciliados']),
                    'flg_notificar_gestor' => $notificarGestor ? 1 : 0,
                    'usuario_id' => $usuarioId,

                    // Timestamps
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            // 1. ATUALIZAR STATUS DOS PEDIDOS COMO ENTREGUES
            if (!empty($payload['ids_pedidos_compra'])) {
                DB::connection('DBCompra')
                    ->table('tbsol_compra')
                    ->whereIn('cod_compra', $payload['ids_pedidos_compra'])
                    ->update([
                        'entregue' => 1, // Marcar como entregue
                        'data_entregue' => $now
                    ]);
            }

            // 2. ATUALIZAR STATUS DAS NOTAS FISCAIS COMO RECEBIDAS
            if (!empty($payload['ids_notas_fiscais'])) {
                DB::connection('DBCompra')
                    ->table('tbnotas_fiscais')
                    ->whereIn('id', $payload['ids_notas_fiscais'])
                    ->update([
                        'status' => 'recebida', // Alterar status para recebida
                        'updated_at' => $now
                    ]);
            }

            // 3. SALVAR OS REGISTROS DE ASSOCIAÇÃO
            if (count($insertData) > 0) {
                DB::connection('DBCompra')->table('tb_associacao_vinculo')->insert($insertData);
            }

            // Recuperar o primeiro ID inserido para manter compatibilidade
            $primeiroId = DB::connection('DBCompra')
                ->table('tb_associacao_vinculo')
                ->where('usuario_id', $usuarioId)
                ->where('created_at', $now)
                ->orderBy('id', 'asc')
                ->value('id');

            DB::commit();

            // Retornando vinculo_id para manter compatibilidade com o código existente
            return [
                'vinculo_id' => $primeiroId, // Mantém a chave antiga para compatibilidade
                'associacao_ids' => range($primeiroId, $primeiroId + count($insertData) - 1), // Todos os IDs inseridos
                'total_itens_vinculados' => count($insertData),
                'pedidos_atualizados' => count($payload['ids_pedidos_compra'] ?? []),
                'notas_atualizadas' => count($payload['ids_notas_fiscais'] ?? []),
                'status' => $statusFinal
            ];

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function buscarAssociacoesPendentesAvaliacao()
    {
        try {
            // Verificar autenticação
            if (!auth('api')->check()) {
                return response()->json(['error' => 'Não autenticado'], 401);
            }

            // Obter usuário autenticado e seu nível
            $usuario = auth('api')->user();
            $nivelAcesso = $usuario->nivel_acesso ?? 1; // Valor padrão 1 se não existir

            // Definir filtros baseados no nível de acesso
            $statusPermitidos = [];

            if ($nivelAcesso == 2) {
                // Nível 2: só pode ver pendencia_gestor
                $statusPermitidos = ['pendencia_gestor'];
            } elseif (in_array($nivelAcesso, [4, 5, 6])) {
                // Níveis 4, 5, 6: só podem ver aguardando_diretoria
                $statusPermitidos = ['aguardando_diretoria'];
            } else {
                // Outros níveis (1, 3, 7, etc.) - manter comportamento original
                $statusPermitidos = ['aguardando_diretoria', 'pendencia_gestor', 'em_analise'];
            }

            // Primeiro, buscar todos os dados completos sem agrupar
            $todasAssociacoes = DB::connection('DBCompra')
                ->table('tb_associacao_vinculo as av')
                ->select(
                    'av.id',
                    'av.cod_material',
                    'av.qtd_ped',
                    'av.qtd_nf',
                    'av.delta_qtd',
                    'av.delta_valor',
                    'av.status_item',
                    'av.status_associacao',
                    'av.status_compra',
                    'av.ids_pedidos',
                    'av.ids_notas',
                    'av.total_itens',
                    'av.flg_notificar_gestor',
                    'av.usuario_id',
                    'av.created_at',
                    'av.updated_at'
                )
                ->whereIn('av.status_compra', $statusPermitidos)
                ->where('av.status_compra', '!=', 'finalizado')
                ->orderBy('av.created_at', 'desc')
                ->get();

            // Agrupar manualmente por ids_pedidos e ids_notas
            $grupos = [];

            foreach ($todasAssociacoes as $assoc) {
                // Criar chave única para o grupo
                $chaveGrupo = $assoc->ids_pedidos . '|' . $assoc->ids_notas;

                if (!isset($grupos[$chaveGrupo])) {
                    // Decodificar IDs
                    $idsPedidos = json_decode($assoc->ids_pedidos, true) ?? [];
                    $idsNotas = json_decode($assoc->ids_notas, true) ?? [];

                    // Criar novo grupo
                    $grupos[$chaveGrupo] = [
                        'grupo_id' => md5($chaveGrupo),
                        'ids_pedidos' => $idsPedidos,
                        'ids_notas' => $idsNotas,
                        'status_compra' => $assoc->status_compra,
                        'total_itens' => 0,
                        'diferenca_total' => 0,
                        'created_at' => $assoc->created_at,
                        'updated_at' => $assoc->updated_at,
                        'itens' => []
                    ];
                }

                // Adicionar item ao grupo
                $item = [
                    'id' => $assoc->id,
                    'cod_material' => $assoc->cod_material,
                    'qtd_ped' => $assoc->qtd_ped,
                    'qtd_nf' => $assoc->qtd_nf,
                    'delta_qtd' => $assoc->delta_qtd,
                    'delta_valor' => $assoc->delta_valor,
                    'status_item' => $assoc->status_item,
                    'status_associacao' => $assoc->status_associacao,
                    'flg_notificar_gestor' => $assoc->flg_notificar_gestor,
                    'usuario_id' => $assoc->usuario_id,
                    'created_at' => $assoc->created_at,
                    'updated_at' => $assoc->updated_at
                ];

                $grupos[$chaveGrupo]['itens'][] = $item;
                $grupos[$chaveGrupo]['total_itens']++;
                $grupos[$chaveGrupo]['diferenca_total'] += $assoc->delta_valor;

                // Atualizar data mais recente
                if ($assoc->updated_at > $grupos[$chaveGrupo]['updated_at']) {
                    $grupos[$chaveGrupo]['updated_at'] = $assoc->updated_at;
                }

                // Manter a data mais antiga de criação
                if ($assoc->created_at < $grupos[$chaveGrupo]['created_at']) {
                    $grupos[$chaveGrupo]['created_at'] = $assoc->created_at;
                }
            }

            // Converter para array e ordenar por data
            $resultados = array_values($grupos);
            usort($resultados, function ($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });

            return response()->json([
                'success' => true,
                'associacoes' => $resultados,
                'total_grupos' => count($resultados),
                'nivel_usuario' => $nivelAcesso,
                'status_permitidos' => $statusPermitidos
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Erro ao buscar associações: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Busca as gestões que o usuário gerencia
     */
    private function getGestoesUsuario($matricula)
    {
        if (!$matricula) {
            return [];
        }

        // Ajuste esta consulta conforme sua estrutura de tabela de gestores
        $gestoes = DB::connection('DBCompra')
            ->table('tb_gestores_material')
            ->where('matricula', $matricula) // ou outra coluna que relacione com o usuário
            ->pluck('ids_gestao_material')
            ->first();

        if ($gestoes) {
            return json_decode($gestoes, true) ?? [];
        }

        return [];
    }

    /**
     * Gera estatísticas das associações pendentes
     */
    private function gerarEstatisticasPendentes($associacoes)
    {
        $total = count($associacoes);

        if ($total === 0) {
            return [
                'total' => 0,
                'por_status_compra' => [],
                'por_status_item' => [],
                'por_gestao' => [],
                'total_valor_diferenca' => 0,
                'associacoes_fornecedor_errado' => 0,
            ];
        }

        $estatisticas = [
            'total' => $total,
            'por_status_compra' => [],
            'por_status_item' => [],
            'por_gestao' => [],
            'total_valor_diferenca' => 0,
            'associacoes_fornecedor_errado' => 0,
        ];

        foreach ($associacoes as $assoc) {
            // Por status_compra
            $statusCompra = $assoc['status_compra'] ?? 'DESCONHECIDO';
            if (!isset($estatisticas['por_status_compra'][$statusCompra])) {
                $estatisticas['por_status_compra'][$statusCompra] = 0;
            }
            $estatisticas['por_status_compra'][$statusCompra]++;

            // Por gestão
            $gestao = $assoc['gestao'] ?? 'Sem Gestão';
            if (!isset($estatisticas['por_gestao'][$gestao])) {
                $estatisticas['por_gestao'][$gestao] = 0;
            }
            $estatisticas['por_gestao'][$gestao]++;

            // Total diferença
            $estatisticas['total_valor_diferenca'] += $assoc['diferenca_total'] ?? 0;

            // Conta fornecedor errado
            if (!$assoc['fornecedor_match']) {
                $estatisticas['associacoes_fornecedor_errado']++;
            }

            // Por status_item (soma de todos os itens)
            foreach ($assoc['contadores'] ?? [] as $status => $quantidade) {
                if (strpos($status, 'itens_') === 0) {
                    $statusItem = str_replace('itens_', '', $status);
                    if (!isset($estatisticas['por_status_item'][$statusItem])) {
                        $estatisticas['por_status_item'][$statusItem] = 0;
                    }
                    $estatisticas['por_status_item'][$statusItem] += $quantidade;
                }
            }
        }

        return $estatisticas;
    }
}