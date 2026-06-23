<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Mail\CotacaoFinalizadaMail;
use App\Models\SolCompraModel;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Log;

class CotacaoController extends Controller
{
    /**
     * Display a listing of the resource - COTAÇÃO POR COMPRA
     * Agora filtra materiais que NÃO foram cotados individualmente
     */
    public function index(Request $request, $cod_compra)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $user = auth('api')->user();

        if (!$user) {
            return response()->json(['error' => 'Usuário não autenticado'], 401);
        }

        // PRIMEIRA TENTATIVA: Buscar por cod_compra
        $todosMateriais = DB::connection('DBCompra')->table('tbsol_compra')
            ->where('cod_compra', $cod_compra)
            ->get(['cod_material', 'cod_cotacao', 'tipo_cotacao', 'cod_compra']);

        $codCotacaoAgrupado = null;

        // SEGUNDA TENTATIVA: Se não encontrou, busca por cod_cotacao (caso de agrupado)
        if ($todosMateriais->isEmpty()) {
            $todosMateriais = DB::connection('DBCompra')->table('tbsol_compra')
                ->where('cod_cotacao', $cod_compra)
                ->get(['cod_material', 'cod_cotacao', 'tipo_cotacao', 'cod_compra']);
        }

        // Se ainda está vazio, retorna array vazio
        if ($todosMateriais->isEmpty()) {
            return response()->json([]);
        }

        // ✅ CORREÇÃO: Checar agrupamento INDEPENDENTE do caminho percorrido
        $primeiro = $todosMateriais->first();
        $tiposCotacao = ['AGRUPADA', 'agrupado'];

        if (in_array($primeiro->tipo_cotacao, $tiposCotacao)) {
            // Usa o cod_cotacao do registro como referência de agrupamento
            $codCotacaoAgrupado = $primeiro->cod_cotacao ?? $cod_compra;
        }

        $isAgrupado = !is_null($codCotacaoAgrupado);

        // Verificar se todos os materiais já foram cotados
        $todosCotadosPorMaterial = true;
        foreach ($todosMateriais as $material) {
            if (is_null($material->cod_cotacao) || !str_starts_with($material->cod_cotacao, 'MAT')) {
                $todosCotadosPorMaterial = false;
                break;
            }
        }

        if ($todosCotadosPorMaterial) {
            return response()->json([]);
        }

        // Query base com unionAll
        $query = DB::connection('DBCompra')->table('tbsol_compra as sol')
            ->joinSub(
                DB::connection('DBCompra')->table('tb_material as mat1')
                    ->select('codmat', 'descricao', 'unid')
                    ->unionAll(
                        DB::connection('DBCompra')->table('tbmaterial_aniel as mat2')
                            ->select('codmat', 'descricao', 'unid')
                    ),
                'mat',
                function ($join) {
                    $join->on('mat.codmat', '=', 'sol.cod_material');
                }
            )
            ->select(
                'sol.cod_compra',
                'sol.cod_material',
                'sol.quantidade',
                'mat.descricao',
                'mat.unid',
                'sol.tipo_cotacao',
                'sol.cod_cotacao'
            )
            ->where(function ($q) use ($cod_compra) {
                $q->where('sol.cod_compra', $cod_compra)
                    ->orWhere('sol.cod_cotacao', $cod_compra);
            })
            ->where(function ($q) {
                $q->whereNull('sol.cod_cotacao')
                    ->orWhere('sol.cod_cotacao', 'not like', 'MAT%');
            });

        // Aplicar filtros por etapa do usuário
        switch ($user->compras) {
            case 2:
                $query->where(function ($q) {
                    $q->whereNull('sol.aceite_material')
                        ->orWhere('sol.status', '=', '2');
                });
                break;
            case 3:
                $query->where(function ($q) {
                    $q->where(function ($sub) {
                        $sub->whereNotNull('sol.aceite_material')
                            ->where('sol.aceite_material', '!=', '0')
                            ->whereNull('sol.aceite_compra');
                    })
                        ->orWhere('sol.finalizado', '=', '1')
                        ->orWhere('sol.status', '=', '3');
                });
                break;
            case 4:
            case 5:
            case 6:
                $query->where(function ($q) {
                    $q->where(function ($sub) {
                        $sub->whereNotNull('sol.aceite_compra')
                            ->where('sol.aceite_compra', '!=', '0')
                            ->whereNull('sol.aceite_diretor');
                    })
                        ->orWhere('sol.status', '=', '4');
                });
                break;
        }

        $solicitacao = $query->get();

        // ✅ Agrupamento por mesmo código de material (independente de tipo_cotacao)
        $solicitacao = $this->agruparPorMesmoMaterial($solicitacao);

        // ✅ Agrupamento por cotação agrupada (se aplicável)
        if ($isAgrupado) {
            $solicitacao = $this->agruparItensPorMaterial($solicitacao, $codCotacaoAgrupado);
        }

        return response()->json($solicitacao);
    }

    /**
     * Agrupa itens com o mesmo código de material, somando as quantidades
     * 
     * @param \Illuminate\Support\Collection $itens
     * @return \Illuminate\Support\Collection
     */
    private function agruparPorMesmoMaterial($itens)
    {
        return $itens->groupBy('cod_material')->map(function ($grupo) {
            $primeiro = $grupo->first();

            // Soma todas as quantidades dos itens com mesmo código de material
            $quantidadeTotal = $grupo->sum('quantidade');

            // Retorna um novo objeto com os dados consolidados
            return (object) [
                'cod_compra' => $primeiro->cod_compra,
                'cod_material' => $primeiro->cod_material,
                'quantidade' => $quantidadeTotal,
                'descricao' => $primeiro->descricao,
                'unid' => $primeiro->unid,
                'tipo_cotacao' => $primeiro->tipo_cotacao,
                'cod_cotacao' => $primeiro->cod_cotacao,
                // Adicione outros campos que possam existir no seu objeto
            ];
        })->values(); // Reindexa o array
    }

    /**
     * Agrupa itens do mesmo material em uma cotação agrupada
     */
    private function agruparItensPorMaterial($itens, $codCotacao)
    {
        $itensAgrupados = [];

        foreach ($itens as $item) {
            $codMaterial = $item->cod_material;

            // Se já existe este material no array, soma as quantidades
            if (isset($itensAgrupados[$codMaterial])) {
                $itensAgrupados[$codMaterial]->quantidade += $item->quantidade;

                // Adicionar informação de quais códigos de compra foram agrupados
                if (!isset($itensAgrupados[$codMaterial]->codigos_compra_origem)) {
                    $itensAgrupados[$codMaterial]->codigos_compra_origem = [];
                }
                $itensAgrupados[$codMaterial]->codigos_compra_origem[] = $item->cod_compra;

            } else {
                // Criar novo item agrupado
                $itemAgrupado = clone $item;
                $itemAgrupado->quantidade_original = $item->quantidade;
                $itemAgrupado->quantidade_total = $item->quantidade;
                $itemAgrupado->quantidade = $item->quantidade; // Manter compatibilidade
                $itemAgrupado->codigos_compra_origem = [$item->cod_compra];
                $itemAgrupado->is_agrupado = true;
                $itemAgrupado->total_itens_agrupados = 1;

                $itensAgrupados[$codMaterial] = $itemAgrupado;
            }
        }

        // Converter para array indexado numericamente
        $resultado = array_values($itensAgrupados);

        // Adicionar metadados do agrupamento
        foreach ($resultado as $item) {
            $item->total_itens_agrupados = count($item->codigos_compra_origem);
            $item->codigos_compra_origem = implode(', ', $item->codigos_compra_origem);
        }

        return $resultado;
    }

    /**
     * COTAÇÃO POR MATERIAL - Lista materiais disponíveis para cotação individual
     * Agora calcula quantidade restante após cotações por compra
     **/
    public function cotacaoCodMaterial(Request $request, $cod_material)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $user = auth('api')->user();

        if (!$user) {
            return response()->json(['error' => 'Usuário não autenticado'], 401);
        }

        $hasParams = count(request()->query()) > 0;
        $cod_cotacao = request()->query('cod_cotacao');

        // Buscar quantidade total solicitada
        $quantidadeTotalQuery = DB::table('bdcompra.tbsol_compra as sol')
            ->where('sol.cod_material', $cod_material)
            ->whereNull('aceite_compra');

        $quantidadeCotadaCompraQuery = DB::table('bdcompra.tbsol_compra as sol')
            ->where('sol.cod_material', $cod_material)
            ->where('sol.aceite_compra', 1)
            ->where('sol.tipo_cotacao', 'compra')
            ->whereNotNull('sol.data_compra');

        if ($hasParams && $cod_cotacao) {
            $quantidadeTotalQuery->where('cod_cotacao', $cod_cotacao);
            $quantidadeCotadaCompraQuery->where('cod_cotacao', $cod_cotacao);
        } else {
            $quantidadeTotalQuery->whereNull('cod_cotacao');
        }

        $quantidadeTotal = $quantidadeTotalQuery->sum('sol.quantidade');
        $quantidadeCotadaCompra = $quantidadeCotadaCompraQuery->sum('sol.quantidade');

        $quantidadeDisponivel = $quantidadeTotal;

        if ($quantidadeDisponivel <= 0) {
            $materialInfo = DB::table('bdcompra.tbsol_compra as sol')
                ->joinSub(
                    DB::table('bdcompra.tb_material as mat1')
                        ->select('codmat', 'descricao', 'unid')
                        ->unionAll(
                            DB::table('bdcompra.tbmaterial_aniel as mat2')
                                ->select('codmat', 'descricao', 'unid')
                        ),
                    'mat',
                    function ($join) {
                        $join->on('mat.codmat', '=', 'sol.cod_material');
                    }
                )
                ->where('sol.cod_material', $cod_material)
                ->selectRaw('
                    sol.cod_material AS cod_material,
                    ANY_VALUE(mat.descricao) AS descricao,
                    ANY_VALUE(mat.unid) AS unidade
                ')
                ->groupBy('sol.cod_material')
                ->first();

            if ($materialInfo) {
                return response()->json([
                    [
                        'cod_material' => $materialInfo->cod_material,
                        'descricao' => $materialInfo->descricao,
                        'unidade' => $materialInfo->unidade,
                        'quantidade_total' => 0
                    ]
                ]);
            } else {
                return response()->json([]);
            }
        }

        $query = DB::table('bdcompra.tbsol_compra as sol')
            ->joinSub(
                DB::table('bdcompra.tb_material as mat1')
                    ->select('codmat', 'descricao', 'unid')
                    ->unionAll(
                        DB::table('bdcompra.tbmaterial_aniel as mat2')
                            ->select('codmat', 'descricao', 'unid')
                    ),
                'mat',
                function ($join) {
                    $join->on('mat.codmat', '=', 'sol.cod_material');
                }
            )
            ->selectRaw('
                GROUP_CONCAT(DISTINCT sol.cod_compra) AS compras,
                sol.cod_material AS cod_material,
                ? AS quantidade_total,
                ANY_VALUE(mat.descricao) AS descricao,
                ANY_VALUE(mat.unid) AS unidade
            ', [$quantidadeDisponivel])
            ->where('sol.cod_material', $cod_material)
            ->where(function ($q) {
                $q->whereNull('sol.cod_cotacao')
                    ->orWhere('sol.cod_cotacao', 'not like', 'COMP%');
            });

        // Aplicar filtros por etapa do usuário
        switch ($user->compras) {
            case 2:
                $query->where(function ($q) {
                    $q->whereNull('sol.aceite_material');
                });
                break;
            case 3:
                $query->where(function ($q) {
                    $q->whereNotNull('sol.aceite_material')
                        ->where('sol.aceite_material', '!=', '0')
                        ->whereNull('sol.aceite_compra');
                });
                break;
            case 4:
                $query->where(function ($q) {
                    $q->where(function ($sub) {
                        $sub->whereNotNull('sol.aceite_compra')
                            ->where('sol.aceite_compra', '!=', '0')
                            ->whereNull('sol.aceite_diretor');
                    })
                        ->orWhere('sol.status', '=', '4');
                });
                break;
            case 5:
                $query->where(function ($q) {
                    $q->where(function ($sub) {
                        $sub->whereNotNull('sol.aceite_compra')
                            ->where('sol.aceite_compra', '!=', '0')
                            ->whereNull('sol.aceite_diretor');
                    })
                        ->orWhere('sol.status', '=', '5');
                });
                break;
            case 6:
                $query->where(function ($q) {
                    $q->where(function ($sub) {
                        $sub->whereNotNull('sol.aceite_compra')
                            ->where('sol.aceite_compra', '!=', '0')
                            ->whereNull('sol.aceite_diretor');
                    })
                        ->orWhere('sol.status', '=', '6');
                });
                break;
        }

        $solicitacao = $query->groupBy('sol.cod_material')->first();

        return response()->json($solicitacao ? [$solicitacao] : []);
    }



    /**
     * Salva cotação SEM avançar o processo - Para cotação por COMPRA
     */
    public function store(Request $request, $cod_compra)
    {
        $token = $request->header('Authorization');
        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        // ✅ Log para ver o que está chegando
        \Log::info('=== INICIANDO SALVAMENTO DE COTAÇÃO ===');
        \Log::info('Código Compra: ' . $cod_compra);

        // ✅ Decodifica as cotações
        $cotacoesJson = $request->input('cotacoes', '[]');
        $cotacoes = json_decode($cotacoesJson, true) ?? [];

        \Log::info('Cotações recebidas:', $cotacoes);
        \Log::info('Total de cotações: ' . count($cotacoes));

        if (empty($cotacoes)) {
            \Log::warning('Nenhuma cotação enviada');
            return response()->json(['error' => 'Nenhuma cotação enviada'], 400);
        }

        // ✅ Log de arquivos recebidos
        $arquivosRecebidos = $request->allFiles();
        \Log::info('Arquivos recebidos no request:', array_keys($arquivosRecebidos));

        $user = auth('api')->user();

        DB::beginTransaction();
        try {
            $solicitacao = SolCompraModel::where('cod_compra', $cod_compra)
                ->where('tipo_cotacao', 'compra')
                ->first();

            $codigo_cotacao = $solicitacao && $solicitacao->cod_cotacao
                ? $solicitacao->cod_cotacao
                : strtoupper(base_convert(time(), 10, 36));

            if (!$solicitacao || !$solicitacao->cod_cotacao) {
                SolCompraModel::where('cod_compra', $cod_compra)
                    ->whereNull('cod_cotacao')
                    ->update([
                        'cod_cotacao' => $codigo_cotacao,
                        'tipo_cotacao' => 'compra',
                        'editavel' => true
                    ]);
            }

            \Log::info('Código da cotação: ' . $codigo_cotacao);

            foreach ($cotacoes as $index => $item) {

                // ✅ Pega o arquivo existente se houver
                $arquivoUrl = $item['arquivo'] ?? null;

                // ✅ Gera a mesma chave que o frontend enviou
                $arquivoKey = "{$item['cod_material']}_{$item['fornecedor']}";
                \Log::info("Buscando arquivo para: {$arquivoKey}");

                // ✅ Verifica se tem arquivo novo
                $arquivoEnviado = null;
                $chavesPossiveis = [
                    "arquivos[{$arquivoKey}]",
                    "arquivos.{$arquivoKey}",
                    $arquivoKey
                ];

                foreach ($chavesPossiveis as $chave) {
                    if ($request->hasFile($chave)) {
                        $arquivoEnviado = $request->file($chave);
                        \Log::info("Arquivo encontrado com chave: {$chave} - " . $arquivoEnviado->getClientOriginalName());
                        break;
                    }
                }

                if ($arquivoEnviado && $arquivoEnviado->isValid()) {
                    \Log::info("Processando novo arquivo: " . $arquivoEnviado->getClientOriginalName());

                    // ✅ Deleta arquivo antigo se existir
                    if ($arquivoUrl) {
                        $oldPath = public_path('cotacoes/' . basename($arquivoUrl));
                        if (file_exists($oldPath)) {
                            unlink($oldPath);
                            \Log::info("Arquivo antigo deletado: {$oldPath}");
                        }
                    }

                    // ✅ Salva novo arquivo na pasta public/cotacoes
                    $filename = time() . '_' . uniqid() . '_' . $arquivoEnviado->getClientOriginalName();
                    $publicPath = public_path('cotacoes');

                    if (!file_exists($publicPath)) {
                        mkdir($publicPath, 0777, true);
                    }

                    $arquivoEnviado->move($publicPath, $filename);
                    $arquivoUrl = url('cotacoes/' . $filename);

                    \Log::info("Novo arquivo salvo em public: {$arquivoUrl}");
                } else {
                    \Log::info("Nenhum arquivo novo enviado. Mantendo arquivo existente: " . ($arquivoUrl ?? 'null'));
                }

                // ✅ Prepara dados para salvar no banco
                $cotacaoData = [
                    'preco' => $item['preco'] ?? 0,
                    'tipo_frete' => $item['tipoFrete'] ?? null,
                    'cond_pgto' => $item['condPgto'] ?? null,
                    'cond_entrega' => $item['condEntrega'] ?? null,
                    'ipi' => $item['ipi'] ?? 0,
                    'icms' => $item['icms'] ?? 0,
                    'valor_frete' => $item['valorFrete'] ?? 0,
                    'data' => now(),
                    'obs' => $item['obs'] ?? null,
                    'qtd_parcelas' => $item['qtdParcela'] ?? 1,
                    'visivel' => 0,
                    'tipo_cotacao' => 'compra',
                    'arquivo' => $arquivoUrl
                ];

                // ✅ Verifica se já existe cotação para este material e fornecedor
                $existeCotacao = DB::connection('DBCompra')
                    ->table('tbmateriais_cotados')
                    ->where('cod_cotacao', $codigo_cotacao)
                    ->where('cod_material', $item['cod_material'])
                    ->where('fornecedor_id', $item['fornecedor'])
                    ->first();

                if ($existeCotacao) {
                    DB::connection('DBCompra')
                        ->table('tbmateriais_cotados')
                        ->where('cod_cotacao', $codigo_cotacao)
                        ->where('cod_material', $item['cod_material'])
                        ->where('fornecedor_id', $item['fornecedor'])
                        ->update($cotacaoData);
                    \Log::info("Cotação atualizada para material: {$item['cod_material']}, fornecedor: {$item['fornecedor']}");
                } else {
                    $cotacaoData['cod_cotacao'] = $codigo_cotacao;
                    $cotacaoData['cod_material'] = $item['cod_material'] ?? null;
                    $cotacaoData['fornecedor_id'] = $item['fornecedor'] ?? null;

                    DB::connection('DBCompra')
                        ->table('tbmateriais_cotados')
                        ->insert($cotacaoData);
                    \Log::info("Nova cotação inserida para material: {$item['cod_material']}, fornecedor: {$item['fornecedor']}");
                }

                // ✅ Processa parcelas
                if (!empty($item['datasParcelas'])) {
                    $codMaterial = trim((string) $item['cod_material']);

                    foreach ($item['datasParcelas'] as $index => $dias) {
                        $parcela = $index + 1;

                        // Validar e converter o valor de dias
                        $diasInt = !empty($dias) ? (int) $dias : 0;

                        DB::connection('DBCompra')
                            ->table('tbaux_dias_parcelas')
                            ->updateOrInsert(
                                [
                                    'cod_cotacao' => $codigo_cotacao,
                                    'cod_material' => $codMaterial,
                                    'fornecedor_id' => $item['fornecedor'],
                                    'parcela' => $parcela
                                ],
                                ['dias' => $diasInt] // Usar o valor convertido
                            );
                    }

                    $qtdParcelasEnviadas = count($item['datasParcelas']);
                    DB::connection('DBCompra')
                        ->table('tbaux_dias_parcelas')
                        ->where('cod_cotacao', $codigo_cotacao)
                        ->where('cod_material', $codMaterial)
                        ->where('fornecedor_id', $item['fornecedor'])
                        ->where('parcela', '>', $qtdParcelasEnviadas)
                        ->delete();

                    \Log::info("Parcelas processadas: {$qtdParcelasEnviadas} para material: {$codMaterial}");
                }
            }

            DB::commit();
            \Log::info('=== COTAÇÃO SALVA COM SUCESSO ===');

            return response()->json([
                'success' => true,
                'message' => 'Cotação salva com sucesso!',
                'codigo_cotacao' => $codigo_cotacao,
                'total_cotacoes_salvas' => count($cotacoes)
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erro ao salvar cotação: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Erro ao salvar cotação', 'message' => $e->getMessage()], 500);
        }
    }


    /**
     * Avança o processo APENAS se todos os materiais tiverem pelo menos 3 fornecedores
     */
    public function finalizarCotacao(Request $request, $cod_compra)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $user = auth('api')->user();

        // Log de início do processo
        \Log::info('Iniciando finalização de cotação', [
            'cod_compra' => $cod_compra,
            'usuario' => $user->matricula ?? 'Não informado',
            'usuario_nome' => $user->nome ?? 'Não informado'
        ]);

        DB::beginTransaction();
        try {
            // Buscar todos os materiais da solicitação
            $materiais = SolCompraModel::where('cod_compra', $cod_compra)
                ->where('tipo_cotacao', 'compra')
                ->where('aceite_material', '!=', 0)
                ->get();

            if ($materiais->isEmpty()) {
                \Log::warning('Solicitação não encontrada', ['cod_compra' => $cod_compra]);
                return response()->json(['error' => 'Solicitação não encontrada'], 404);
            }

            \Log::info('Materiais encontrados', [
                'cod_compra' => $cod_compra,
                'quantidade_materiais' => $materiais->count(),
                'materiais' => $materiais->pluck('cod_material')->toArray()
            ]);

            // Buscar o cod_cotacao do primeiro material (todos têm o mesmo)
            $cod_cotacao = $materiais->first()->cod_cotacao;

            if (!$cod_cotacao) {
                \Log::warning('Nenhuma cotação encontrada', ['cod_compra' => $cod_compra]);
                return response()->json(['error' => 'Nenhuma cotação encontrada para esta solicitação'], 400);
            }

            \Log::info('Cotação encontrada', [
                'cod_compra' => $cod_compra,
                'cod_cotacao' => $cod_cotacao
            ]);

            $materiaisInsuficientes = [];

            // Otimizar: buscar todos os materiais de uma vez
            $materiaisCodigos = $materiais->pluck('cod_material')->toArray();

            // Buscar todos os fornecedores cotados para cada material (ANTES de atualizar o status)
            $fornecedoresPorMaterial = DB::connection('DBCompra')
                ->table('tbmateriais_cotados')
                ->select('cod_material', 'fornecedor_id', 'preco', 'status')
                ->where('cod_cotacao', $cod_cotacao)
                ->whereNull('status')  // Busca apenas os não finalizados
                ->whereIn('cod_material', $materiaisCodigos)
                ->whereNotNull('preco')
                ->where('preco', '>', 0)
                ->get()
                ->groupBy('cod_material');

            // --------------------------------------------------------------------
            // CALCULAR O MAIOR VALOR TOTAL DA COTAÇÃO (ANTES de atualizar)
            // --------------------------------------------------------------------

            // 1. Calcular o valor total por fornecedor
            $totaisPorFornecedor = DB::connection('DBCompra')
                ->table('tbmateriais_cotados as mc')
                ->join('bdcompra.tbsol_compra as sc', function ($join) use ($cod_cotacao) {
                    $join->on('mc.cod_cotacao', '=', 'sc.cod_cotacao')
                        ->on('mc.cod_material', '=', 'sc.cod_material')
                        ->where('mc.cod_cotacao', '=', $cod_cotacao);
                })
                ->whereNull('mc.status')
                ->whereNotNull('mc.preco')
                ->where('mc.preco', '>', 0)
                ->select(
                    'mc.fornecedor_id',
                    DB::raw('SUM(mc.preco * sc.quantidade) as valor_total')
                )
                ->groupBy('mc.fornecedor_id')
                ->get();

            \Log::info('Totais por fornecedor calculados', [
                'cod_cotacao' => $cod_cotacao,
                'fornecedores' => $totaisPorFornecedor->map(function ($item) {
                    return [
                        'fornecedor_id' => $item->fornecedor_id,
                        'valor_total' => $item->valor_total
                    ];
                })->toArray()
            ]);

            // 2. Encontrar o maior valor total entre os fornecedores
            $maiorValorTotal = $totaisPorFornecedor->max('valor_total') ?? 0;

            // 3. Determinar o nível com base no MAIOR VALOR TOTAL
            $nivelDestino = null;
            if ($maiorValorTotal <= 5000) {
                $nivelDestino = 4;
            } elseif ($maiorValorTotal <= 50000) {
                $nivelDestino = 5;
            } else {
                $nivelDestino = 6;
            }

            \Log::info('Nível de aprovação determinado', [
                'cod_compra' => $cod_compra,
                'maior_valor_total' => $maiorValorTotal,
                'nivel_destino' => $nivelDestino
            ]);

            // Verificar cada material
            foreach ($materiais as $material) {
                $fornecedoresMaterial = $fornecedoresPorMaterial[$material->cod_material] ?? collect();
                $countFornecedores = $fornecedoresMaterial->count();

                \Log::debug('Verificando material', [
                    'cod_compra' => $cod_compra,
                    'cod_material' => $material->cod_material,
                    'quantidade_fornecedores_encontrados' => $countFornecedores,
                    'fornecedores' => $fornecedoresMaterial->pluck('fornecedor_id')->toArray()
                ]);

                if ($countFornecedores < 3) {
                    $materiaisInsuficientes[] = $material->cod_material;
                    \Log::warning('Material com fornecedores insuficientes', [
                        'cod_compra' => $cod_compra,
                        'cod_material' => $material->cod_material,
                        'fornecedores_encontrados' => $countFornecedores
                    ]);
                }
            }

            if (!empty($materiaisInsuficientes)) {
                \Log::error('Materiais com menos de 3 fornecedores', [
                    'cod_compra' => $cod_compra,
                    'cod_cotacao' => $cod_cotacao,
                    'materiais_insuficientes' => $materiaisInsuficientes
                ]);

                return response()->json([
                    'error' => 'Materiais insuficientes',
                    'message' => 'Os seguintes materiais precisam ter pelo menos 3 fornecedores cotados: ' . implode(', ', $materiaisInsuficientes),
                    'materiais_insuficientes' => $materiaisInsuficientes
                ], 400);
            }

            // Preparar dados para atualização em batch
            $itensCotados = $materiaisCodigos;
            $now = now();
            $justificativa = 'Os materiais: ' . implode(', ', $itensCotados) . ' foram cotados e finalizados na data: ' . $now->format('d/m/Y H:i:s');
            $matriculaCompra = $user->matricula ?? 'Não informado';

            \Log::info('Atualizando registros', [
                'cod_compra' => $cod_compra,
                'cod_cotacao' => $cod_cotacao,
                'itens_cotados' => $itensCotados,
                'usuario' => $matriculaCompra
            ]);

            // Atualizar todas as solicitações
            SolCompraModel::where('cod_compra', $cod_compra)
                ->where('tipo_cotacao', 'compra')
                ->update([
                    'aceite_compra' => 1,
                    'data_compra' => $now,
                    'justificativa_compra' => $justificativa,
                    'matricula_compra' => $matriculaCompra,
                    'editavel' => false
                ]);

            // Atualizar status nas cotações
            DB::connection('DBCompra')->table('tbmateriais_cotados')
                ->where('cod_cotacao', $cod_cotacao)
                ->update([
                    'editavel' => false,
                    'status' => 'finalizado'
                ]);

            // Preparar dados para o email
            $dadosEmail = [
                'cod_compra' => $cod_compra,
                'cod_cotacao' => $cod_cotacao,
                'itens_cotados' => $itensCotados,
                'quantidade_itens' => count($itensCotados),
                'usuario_finalizador' => $user->nome ?? 'Não informado',
                'matricula_finalizador' => $matriculaCompra,
                'data_finalizacao' => $now->format('d/m/Y H:i:s'),
                'materiais' => $materiais,
                'maior_valor_total' => number_format($maiorValorTotal, 2, ',', '.'),
                'nivel_aprovacao' => $nivelDestino,
                'totais_por_fornecedor' => $totaisPorFornecedor,
                'valor_total' => number_format($maiorValorTotal, 2, ',', '.')
            ];

            // COMMIT - liberar transação
            DB::commit();

            \Log::info('Transação commitada com sucesso', [
                'cod_compra' => $cod_compra,
                'cod_cotacao' => $cod_cotacao
            ]);

            // --------------------------------------------------------------------
            // ENVIO DE EMAIL SÍNCRONO COM TRATAMENTO DE ERRO
            // --------------------------------------------------------------------

            // Buscar destinatários do nível calculado
            $destinatarios = DB::table('bdcorp.tbusuario')
                ->where('compras', $nivelDestino)
                ->whereNotNull('email')
                ->where('email', '!=', '')
                ->pluck('email')
                ->toArray();

            $destinatarios = array_values(array_unique($destinatarios));

            \Log::info('Destinatários encontrados', [
                'nivel' => $nivelDestino,
                'quantidade' => count($destinatarios),
                'emails' => $destinatarios
            ]);

            // Enviar email de forma síncrona com tratamento de erro
            $emailEnviado = false;
            $erroEmail = null;

            if (!empty($destinatarios)) {
                try {
                    // Envio síncrono (send em vez de queue)
                    Mail::to($destinatarios)->send(new CotacaoFinalizadaMail($dadosEmail));
                    $emailEnviado = true;

                    \Log::info('Email enviado com sucesso (síncrono)', [
                        'cod_compra' => $cod_compra,
                        'destinatarios' => count($destinatarios),
                        'nivel' => $nivelDestino
                    ]);
                } catch (\Exception $e) {
                    $erroEmail = $e->getMessage();

                    // Log do erro mas NÃO interrompe o fluxo
                    \Log::error('Falha ao enviar email (síncrono), mas cotação foi finalizada', [
                        'cod_compra' => $cod_compra,
                        'error' => $erroEmail,
                        'destinatarios' => $destinatarios,
                        'nivel' => $nivelDestino
                    ]);
                }
            } else {
                \Log::warning('Nenhum destinatário encontrado para o nível', [
                    'cod_compra' => $cod_compra,
                    'nivel' => $nivelDestino
                ]);
            }

            \Log::info('Cotação finalizada com sucesso', [
                'cod_compra' => $cod_compra,
                'cod_cotacao' => $cod_cotacao,
                'maior_valor_total' => $maiorValorTotal,
                'nivel_aprovacao' => $nivelDestino,
                'usuario' => $user->matricula,
                'email_enviado' => $emailEnviado
            ]);

            // Retorno com informação sobre o email
            $response = [
                'success' => true,
                'message' => 'Processo de cotação finalizado com sucesso!',
                'valor_total_cotacao' => number_format($maiorValorTotal, 2, ',', '.'),
                'nivel_aprovacao' => $nivelDestino,
                'quantidade_fornecedores' => $totaisPorFornecedor->count(),
                'email_enviado' => $emailEnviado
            ];

            if ($erroEmail) {
                $response['aviso_email'] = 'Cotação finalizada, mas houve erro ao enviar email: ' . $erroEmail;
            }

            return response()->json($response);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erro ao finalizar cotação: ' . $e->getMessage(), [
                'exception' => $e,
                'cod_compra' => $cod_compra,
                'user' => $user->matricula ?? 'Não informado',
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Erro ao finalizar cotação', 'message' => $e->getMessage()], 500);
        }
    }


    /**
     * Buscar cotações existentes usando cod_cotacao - Para cotação por COMPRA
     */
    public function getCotacoesExistentes($cod_compra)
    {
        try {
            // Buscar a solicitação para obter o cod_cotacao
            $solicitacao = SolCompraModel::where('cod_compra', $cod_compra)
                ->where('tipo_cotacao', 'compra')
                ->first();

            // Buscar materiais da solicitação
            $materiaisSolicitacao = DB::connection('DBCompra')
                ->table('tbsol_compra')
                ->where('cod_compra', $cod_compra)
                ->pluck('cod_material')
                ->toArray();

            // Sempre buscar dados históricos
            $dadosHistoricos = [];
            foreach ($materiaisSolicitacao as $cod_material) {
                $historicosMaterial = DB::connection('DBCompra')
                    ->table('tbmateriais_cotados')
                    ->where('cod_material', $cod_material)
                    ->where('status', 'finalizado')
                    ->selectRaw('
                    ? as cod_material,
                    AVG(preco) as media_historica,
                    AVG(CASE WHEN data >= DATE_SUB(NOW(), INTERVAL 6 MONTH) THEN preco END) as media_6_meses,
                    (SELECT preco FROM tbmateriais_cotados 
                     WHERE cod_material = ? AND status = "Aprovado" 
                     ORDER BY data DESC LIMIT 1) as ultima_compra
                ', [$cod_material, $cod_material])
                    ->first();

                if ($historicosMaterial) {
                    $dadosHistoricos[$cod_material] = [
                        'media_historica' => $historicosMaterial->media_historica,
                        'media_6_meses' => $historicosMaterial->media_6_meses,
                        'ultima_compra' => $historicosMaterial->ultima_compra
                    ];
                }
            }

            // Se não tem solicitação ou cod_cotacao, retorna só históricos
            if (!$solicitacao || !$solicitacao->cod_cotacao) {
                return response()->json([
                    'dados_historicos' => $dadosHistoricos,
                    'cotacoes' => []
                ]);
            }

            // Buscar cotações + informações adicionais
            $cotacoes = DB::connection('DBCompra')
                ->table('tbmateriais_cotados as mc')
                ->join('bdcompra.tbfornecedor as forn', 'mc.fornecedor_id', '=', 'forn.id')
                ->where('mc.cod_cotacao', $solicitacao->cod_cotacao)
                ->where('mc.tipo_cotacao', 'compra')
                ->select(
                    'mc.cod_cotacao',
                    'mc.cod_material',
                    'mc.fornecedor_id',
                    'mc.preco',
                    'mc.tipo_frete',
                    'mc.cond_pgto',
                    'mc.cond_entrega',
                    'mc.ipi',
                    'mc.icms',
                    'mc.valor_frete',
                    'mc.obs',
                    'mc.data',
                    'mc.editavel',
                    'forn.nome_fantasia',
                    'mc.qtd_parcelas',
                    'mc.arquivo',
                    DB::raw('(SELECT JSON_ARRAYAGG(JSON_OBJECT("parcela", parcela, "dias", dias)) 
                  FROM tbaux_dias_parcelas 
                  WHERE cod_cotacao = mc.cod_cotacao 
                  AND cod_material = mc.cod_material
                  AND fornecedor_id = mc.fornecedor_id
                  ORDER BY parcela ASC) AS datasParcelas')
                )
                ->get();

            // Retorna sempre os dados históricos + cotações (vazio ou com dados)
            return response()->json([
                'dados_historicos' => $dadosHistoricos,
                'cotacoes' => $cotacoes
            ]);

        } catch (\Exception $e) {
            \Log::error('Erro ao buscar cotações existentes: ' . $e->getMessage(), [
                'cod_compra' => $cod_compra,
                'exception' => $e
            ]);
            return response()->json([
                'error' => 'Erro ao buscar cotações',
                'message' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * Salva/Atualiza cotação para material específico
     */
    public function storeMaterial(Request $request, $cod_material)
    {
        if (!auth('api')->check()) {
            return response()->json(['error' => 'Unauthorized. Token not provided or invalid.'], 401);
        }

        $user = auth('api')->user();

        // ✅ Pega o cod_cotacao dos query params
        $cod_cotacao = $request->query('cotacaoCodigo');

        if (!$cod_cotacao) {
            return response()->json(['error' => 'Código de cotação não informado.'], 400);
        }

        $cotacoesJson = $request->input('cotacoes', '[]');
        $cotacoes = json_decode($cotacoesJson, true) ?? [];

        if (empty($cotacoes)) {
            return response()->json(['error' => 'Nenhuma cotação enviada.'], 400);
        }

        DB::beginTransaction();
        try {
            // ✅ Busca solicitação com o cod_cotacao ESPECÍFICO passado via query params
            $solicitacoesMaterial = SolCompraModel::where('cod_material', $cod_material)
                ->where('cod_cotacao', $cod_cotacao) // ✅ Filtra pelo cod_cotacao específico
                ->whereNotNull('aceite_material')
                ->where('aceite_material', '!=', '0')
                ->whereNull('aceite_compra')
                ->first();

            if (!$solicitacoesMaterial) {
                return response()->json([
                    'error' => 'Material não encontrado ou código de cotação não corresponde.',
                    'cod_cotacao_esperado' => $cod_cotacao
                ], 404);
            }

            foreach ($cotacoes as $item) {
                if (!isset($item['fornecedor']) || !isset($item['preco'])) {
                    DB::rollBack();
                    return response()->json(['error' => 'Dados de cotação incompletos para um item.'], 400);
                }

                // ✅ PROCESSAMENTO DE ARQUIVOS
                $arquivoUrl = $item['arquivo'] ?? null;
                $arquivoKey = "{$item['cod_material']}_{$item['fornecedor']}";

                $arquivoEnviado = null;
                $chavesPossiveis = [
                    "arquivos[{$arquivoKey}]",
                    "arquivos.{$arquivoKey}",
                    $arquivoKey
                ];

                foreach ($chavesPossiveis as $chave) {
                    if ($request->hasFile($chave)) {
                        $arquivoEnviado = $request->file($chave);
                        \Log::info("Arquivo encontrado com chave: {$chave} - " . $arquivoEnviado->getClientOriginalName());
                        break;
                    }
                }

                if ($arquivoEnviado && $arquivoEnviado->isValid()) {
                    // Deleta arquivo antigo
                    if ($arquivoUrl) {
                        $oldPath = public_path('cotacoes/' . basename($arquivoUrl));
                        if (file_exists($oldPath)) {
                            unlink($oldPath);
                            \Log::info("Arquivo antigo deletado: {$oldPath}");
                        }
                    }

                    // Salva novo arquivo
                    $filename = time() . '_' . uniqid() . '_' . $arquivoEnviado->getClientOriginalName();
                    $publicPath = public_path('cotacoes/');
                    if (!file_exists($publicPath)) {
                        mkdir($publicPath, 0777, true);
                    }
                    $arquivoEnviado->move($publicPath, $filename);
                    $arquivoUrl = url('cotacoes/' . $filename);

                    \Log::info("Novo arquivo salvo: {$arquivoUrl}");
                } else {
                    \Log::info("Nenhum arquivo novo enviado. Mantendo arquivo existente: " . ($arquivoUrl ?? 'null'));
                }

                // ✅ Atualiza/Insere SOMENTE cotações com o cod_cotacao específico
                DB::connection('DBCompra')->table('tbmateriais_cotados')
                    ->updateOrInsert(
                        [
                            'cod_material' => $item['cod_material'],
                            'fornecedor_id' => $item['fornecedor'],
                            'cod_cotacao' => $cod_cotacao, // ✅ Usa o cod_cotacao passado
                            'tipo_cotacao' => 'material'
                        ],
                        [
                            'preco' => $item['preco'],
                            'tipo_frete' => $item['tipoFrete'] ?? null,
                            'cond_pgto' => $item['condPgto'] ?? null,
                            'cond_entrega' => $item['condEntrega'] ?? null,
                            'ipi' => $item['ipi'] ?? 0,
                            'icms' => $item['icms'] ?? 0,
                            'valor_frete' => $item['valorFrete'] ?? 0,
                            'data' => now(),
                            'obs' => $item['obs'] ?? null,
                            'visivel' => 0,
                            'editavel' => true,
                            'status' => 'finalizado', // ✅ Marca como finalizado
                            'arquivo' => $arquivoUrl
                        ]
                    );

                // Tratar datasParcelas
                $parcelas = is_string($item['datasParcelas'])
                    ? json_decode($item['datasParcelas'], true)
                    : $item['datasParcelas'];

                if (is_array($parcelas)) {
                    $codMaterial = trim((string) $item['cod_material']);

                    DB::connection('DBCompra')
                        ->table('tbaux_dias_parcelas')
                        ->where('cod_cotacao', $cod_cotacao)
                        ->where('cod_material', $codMaterial)
                        ->where('fornecedor_id', $item['fornecedor'])
                        ->delete();

                    foreach ($parcelas as $index => $parcelaData) {
                        $dias = isset($parcelaData['dias']) ? (int) $parcelaData['dias'] : (int) $parcelaData;
                        $parcela = $index + 1;

                        DB::connection('DBCompra')
                            ->table('tbaux_dias_parcelas')
                            ->insert([
                                'cod_cotacao' => $cod_cotacao,
                                'cod_material' => $codMaterial,
                                'fornecedor_id' => $item['fornecedor'],
                                'parcela' => $parcela,
                                'dias' => $dias
                            ]);
                    }

                    DB::connection('DBCompra')
                        ->table('tbmateriais_cotados')
                        ->where('cod_cotacao', $cod_cotacao)
                        ->where('cod_material', $codMaterial)
                        ->where('fornecedor_id', $item['fornecedor'])
                        ->update(['qtd_parcelas' => count($parcelas)]);
                }
            }

            // ✅ Verificar quantidade de fornecedores SOMENTE para este cod_cotacao
            $countFornecedores = DB::connection('DBCompra')
                ->table('tbmateriais_cotados')
                ->where('cod_cotacao', $cod_cotacao)
                ->where('cod_material', $cod_material)
                ->where('tipo_cotacao', 'material')
                ->where('status', 'finalizado')
                ->whereNotNull('preco')
                ->where('preco', '>', 0)
                ->count();

            if ($countFornecedores >= 3) {
                // ✅ Finaliza SOMENTE solicitações com este cod_cotacao
                SolCompraModel::where('cod_material', $cod_material)
                    ->where('cod_cotacao', $cod_cotacao)
                    ->whereNotNull('aceite_material')
                    ->where('aceite_material', '!=', '0')
                    ->whereNull('aceite_compra')
                    ->update([
                        'aceite_compra' => 1,
                        'data_compra' => now(),
                        'justificativa_compra' => 'Material cotado - Data: ' . now(),
                        'matricula_compra' => $user->matricula ?? 'Não informado',
                        'tipo_cotacao' => 'material',
                        'editavel' => false
                    ]);

                // ✅ Trava edição SOMENTE das cotações com este cod_cotacao
                DB::connection('DBCompra')->table('tbmateriais_cotados')
                    ->where('cod_cotacao', $cod_cotacao)
                    ->where('cod_material', $cod_material)
                    ->where('tipo_cotacao', 'material')
                    ->update(['editavel' => false]);

                $message = 'Cotação de material finalizada automaticamente (3+ fornecedores).';
            } else {
                $message = "Cotação de material salva. Adicione mais fornecedores para finalizar (atual: {$countFornecedores}/3).";
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $message,
                'codigo_cotacao' => $cod_cotacao,
                'count_fornecedores' => $countFornecedores,
                'finalizada' => $countFornecedores >= 3
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Erro ao salvar cotação', 'message' => $e->getMessage()], 500);
        }
    }

    public function storeMaterialDraft(Request $request, $cod_material)
    {
        if (!auth('api')->check()) {
            return response()->json(['error' => 'Unauthorized. Token not provided or invalid.'], 401);
        }

        $user = auth('api')->user();


        $cotacoesJson = $request->input('cotacoes', '[]');
        $cotacoes = json_decode($cotacoesJson, true) ?? [];

        if (empty($cotacoes)) {
            return response()->json(['error' => 'Nenhuma cotação enviada.'], 400);
        }

        DB::beginTransaction();
        try {
            // Normaliza o cod_material
            $cod_material = trim($cod_material);

            $cod_cotacao = $request->query('cotacaoCodigo');

            // Se cod_cotacao não foi passado, gerar um novo
            if (!$cod_cotacao || $cod_cotacao === $cod_material) {
                $cod_cotacao = 'MAT_' . strtoupper(base_convert(time(), 10, 36));

                // Buscar todos os materiais do cod_material que ainda não têm cod_cotacao
                $materiaisSemCotacao = SolCompraModel::where('cod_material', $cod_material)
                    ->whereNotNull('aceite_material')
                    ->where('aceite_material', '!=', '0')
                    ->whereNull('aceite_compra')
                    ->whereNull('cod_cotacao')
                    ->whereNull('status')
                    ->get();

                // Atualiza todos os registros que ainda não têm cod_cotacao
                if (!$materiaisSemCotacao->isEmpty()) {
                    foreach ($materiaisSemCotacao as $solicitacao) {
                        $solicitacao->update([
                            'cod_cotacao' => $cod_cotacao,
                            'tipo_cotacao' => 'material',
                            'editavel' => true
                        ]);
                    }
                }
            }


            // Processa cada cotação enviada
            foreach ($cotacoes as $item) {
                if (!isset($item['fornecedor']) || !isset($item['preco'])) {
                    DB::rollBack();
                    return response()->json(['error' => 'Dados de cotação incompletos para um item.'], 400);
                }

                // PROCESSAMENTO DE ARQUIVOS
                $arquivoUrl = $item['arquivo'] ?? null;
                $arquivoKey = "{$item['cod_material']}_{$item['fornecedor']}";
                $arquivoEnviado = null;

                foreach (["arquivos[{$arquivoKey}]", "arquivos.{$arquivoKey}", $arquivoKey] as $chave) {
                    if ($request->hasFile($chave)) {
                        $arquivoEnviado = $request->file($chave);
                        break;
                    }
                }

                if ($arquivoEnviado && $arquivoEnviado->isValid()) {
                    if ($arquivoUrl) {
                        $oldPath = public_path('cotacoes/' . basename($arquivoUrl));
                        if (file_exists($oldPath))
                            unlink($oldPath);
                    }

                    $filename = time() . '_' . uniqid() . '_' . $arquivoEnviado->getClientOriginalName();
                    $publicPath = public_path('cotacoes');
                    if (!file_exists($publicPath))
                        mkdir($publicPath, 0777, true);
                    $arquivoEnviado->move($publicPath, $filename);
                    $arquivoUrl = url('cotacoes/' . $filename);
                }

                // Atualiza ou insere cotação na tabela externa
                DB::connection('DBCompra')->table('tbmateriais_cotados')
                    ->updateOrInsert(
                        [
                            'cod_material' => $item['cod_material'],
                            'fornecedor_id' => $item['fornecedor'],
                            'cod_cotacao' => $cod_cotacao,
                            'tipo_cotacao' => 'material'
                        ],
                        [
                            'preco' => $item['preco'],
                            'tipo_frete' => $item['tipoFrete'] ?? null,
                            'cond_pgto' => $item['condPgto'] ?? null,
                            'cond_entrega' => $item['condEntrega'] ?? null,
                            'ipi' => $item['ipi'] ?? 0,
                            'icms' => $item['icms'] ?? 0,
                            'valor_frete' => $item['valorFrete'] ?? 0,
                            'data' => now(),
                            'obs' => $item['obs'] ?? null,
                            'visivel' => 0,
                            'editavel' => true,
                            'status' => null,
                            'arquivo' => $arquivoUrl
                        ]
                    );

                // Tratar datasParcelas
                $parcelas = is_string($item['datasParcelas'])
                    ? json_decode($item['datasParcelas'], true)
                    : $item['datasParcelas'];

                if (is_array($parcelas)) {
                    $codMaterial = trim((string) $item['cod_material']);
                    DB::connection('DBCompra')
                        ->table('tbaux_dias_parcelas')
                        ->where('cod_cotacao', $cod_cotacao)
                        ->where('cod_material', $codMaterial)
                        ->where('fornecedor_id', $item['fornecedor'])
                        ->delete();

                    foreach ($parcelas as $index => $parcelaData) {
                        $dias = isset($parcelaData['dias']) ? (int) $parcelaData['dias'] : (int) $parcelaData;
                        $parcela = $index + 1;

                        DB::connection('DBCompra')
                            ->table('tbaux_dias_parcelas')
                            ->insert([
                                'cod_cotacao' => $cod_cotacao,
                                'cod_material' => $codMaterial,
                                'fornecedor_id' => $item['fornecedor'],
                                'parcela' => $parcela,
                                'dias' => $dias
                            ]);
                    }

                    DB::connection('DBCompra')
                        ->table('tbmateriais_cotados')
                        ->where('cod_cotacao', $cod_cotacao)
                        ->where('cod_material', $codMaterial)
                        ->where('fornecedor_id', $item['fornecedor'])
                        ->update(['qtd_parcelas' => count($parcelas)]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Cotação salva com sucesso.',
                'codigo_cotacao' => $cod_cotacao
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Erro ao salvar rascunho', 'message' => $e->getMessage()], 500);
        }
    }


    /**
     * Buscar cotações existentes para material específico - CORRIGIDO
     */
    public function getCotacoesMaterial(Request $request, $cod_material)
    {
        try {
            // Validação do parâmetro
            $cod_cotacao = $request->query('cod_cotacao');

            // Query principal simplificada
            $cotacoes = DB::connection('DBCompra')
                ->table('tbmateriais_cotados as mc')
                ->join('bdcompra.tbfornecedor as forn', 'mc.fornecedor_id', '=', 'forn.id')
                ->where('mc.cod_cotacao', '=', $cod_cotacao)
                ->where('mc.tipo_cotacao', 'material')
                ->whereNull('mc.status')
                ->select(
                    'mc.cod_cotacao',
                    'mc.cod_material',
                    'mc.fornecedor_id',
                    'mc.preco',
                    'mc.tipo_frete',
                    'mc.cond_pgto',
                    'mc.cond_entrega',
                    'mc.ipi',
                    'mc.icms',
                    'mc.valor_frete',
                    'mc.obs',
                    'mc.qtd_parcelas',
                    'mc.data',
                    'mc.editavel',
                    'forn.nome_fantasia',
                    'mc.arquivo',
                )
                ->get();

            // Busca dados históricos independentemente de encontrar cotações
            $dadosHistoricos = DB::connection('DBCompra')
                ->table('tbmateriais_cotados')
                ->where('cod_material', $cod_material) // Usa o parâmetro direto
                ->where('status', 'finalizado')
                ->selectRaw('
                AVG(preco) as media_historica,
                AVG(CASE WHEN data >= DATE_SUB(NOW(), INTERVAL 6 MONTH) THEN preco END) as media_6_meses,
                (SELECT preco FROM tbmateriais_cotados 
                 WHERE cod_material = ? AND status = "Aprovado" 
                 ORDER BY data DESC LIMIT 1) as ultima_compra
            ', [$cod_material])
                ->first();

            // Se não encontrou cotações, retorna apenas os dados históricos
            if ($cotacoes->isEmpty()) {
                return response()->json([
                    'dados_historicos' => [
                        'ultima_compra' => $dadosHistoricos->ultima_compra ?? null,
                        'media_historica' => $dadosHistoricos->media_historica ?? null,
                        'media_6_meses' => $dadosHistoricos->media_6_meses ?? null,
                    ],
                    'cotacoes' => []
                ]);
            }

            // Busca parcelas separadamente (apenas se houver cotações)
            $parcelasPorCotacao = [];
            foreach ($cotacoes as $cotacao) {
                $datasParcelas = DB::connection('DBCompra')
                    ->table('tbaux_dias_parcelas')
                    ->where('cod_cotacao', $cotacao->cod_cotacao)
                    ->where('cod_material', $cotacao->cod_material)
                    ->where('fornecedor_id', $cotacao->fornecedor_id)
                    ->orderBy('parcela', 'ASC')
                    ->get(['parcela', 'dias']);

                $parcelasPorCotacao[$cotacao->cod_cotacao] = $datasParcelas;
            }

            // Combina os dados
            $resultado = $cotacoes->map(function ($cotacao) use ($dadosHistoricos, $parcelasPorCotacao) {
                $cotacao->ultima_compra = $dadosHistoricos->ultima_compra ?? null;
                $cotacao->media_historica = $dadosHistoricos->media_historica ?? null;
                $cotacao->media_6_meses = $dadosHistoricos->media_6_meses ?? null;
                $cotacao->datasParcelas = $parcelasPorCotacao[$cotacao->cod_cotacao] ?? [];
                return $cotacao;
            });

            return response()->json($resultado);

        } catch (\Exception $e) {
            \Log::error('Erro ao buscar cotações do material: ' . $e->getMessage(), [
                'cod_material' => $cod_material,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Erro ao buscar cotações',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reativar cotação de material para edição - CORRIGIDO
     */
    public function reativarCotacaoMaterial(Request $request, $cod_material)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $user = auth('api')->user();

        if (!$user) {
            return response()->json(['error' => 'Usuário não autenticado'], 401);
        }

        DB::beginTransaction();
        try {
            // Buscar cotação de material existente
            $cotacaoMaterial = DB::connection('DBCompra')
                ->table('tbmateriais_cotados')
                ->where('cod_material', $cod_material)
                ->where('tipo_cotacao', 'material')
                ->first();

            if (!$cotacaoMaterial) {
                return response()->json(['error' => 'Cotação de material não encontrada'], 404);
            }

            // Reativar solicitação para edição
            SolCompraModel::where('cod_material', $cod_material)
                ->update([
                    'aceite_compra' => null,
                    'data_compra' => null,
                    'justificativa_compra' => null,
                    'editavel' => true
                ]);

            // Reativar cotações de material para edição
            DB::connection('DBCompra')->table('tbmateriais_cotados')
                ->where('cod_cotacao', $cotacaoMaterial->cod_cotacao)
                ->where('cod_material', $cod_material)
                ->where('tipo_cotacao', 'material')
                ->update(['editavel' => true]);

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Cotação de material reativada para edição com sucesso!'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erro ao reativar cotação: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['error' => 'Erro ao reativar cotação', 'message' => $e->getMessage()], 500);
        }
    }

    public function getCotacoes($cod_cotacao)
    {
        $tipo_cotacao = str_contains($cod_cotacao, 'MAT') ? 'material' : 'compra';
        try {
            $cotacoes = DB::connection('DBCompra')
                ->table('tbmateriais_cotados as mc')
                ->join('bdcompra.tbfornecedor as forn', 'mc.fornecedor_id', '=', 'forn.id')
                ->join('tbsol_compra as sc', function ($join) {
                    $join->on('mc.cod_cotacao', '=', 'sc.cod_cotacao')
                        ->on('mc.cod_material', '=', 'sc.cod_material');
                })
                ->joinSub(
                    DB::table('bdcompra.tb_material as mat1')
                        ->select('codmat', 'descricao', 'unid')
                        ->unionAll(
                            DB::table('bdcompra.tbmaterial_aniel as mat2')
                                ->select('codmat', 'descricao', 'unid')
                        ),
                    'mat',
                    function ($join) {
                        $join->on('mat.codmat', '=', 'sc.cod_material');
                    }
                )
                ->where('mc.cod_cotacao', $cod_cotacao)
                ->where('mc.tipo_cotacao', $tipo_cotacao)
                ->select(
                    'mc.cod_material',
                    DB::raw('MIN(mc.cod_cotacao) AS cod_cotacao'),
                    DB::raw('MIN(mc.fornecedor_id) AS fornecedor_id'),
                    DB::raw('MIN(mc.preco) AS preco'),
                    DB::raw('MIN(mc.tipo_frete) AS tipo_frete'),
                    DB::raw('MIN(mc.cond_pgto) AS cond_pgto'),
                    DB::raw('MIN(mc.cond_entrega) AS cond_entrega'),
                    DB::raw('MIN(mc.ipi) AS ipi'),
                    DB::raw('MIN(mc.icms) AS icms'),
                    DB::raw('MIN(mc.valor_frete) AS valor_frete'),
                    DB::raw('MIN(mc.obs) AS obs'),
                    DB::raw('MIN(mc.data) AS data'),
                    DB::raw('MIN(mc.editavel) AS editavel'),
                    DB::raw('MIN(mc.arquivo) AS arquivo'),
                    DB::raw('MIN(mc.status) AS status'),
                    DB::raw('MIN(mat.descricao) AS descricao'),
                    DB::raw('MIN(forn.nome_fantasia) AS nome_fantasia'),
                    DB::raw('SUM(sc.quantidade) AS quantidade'),
                    DB::raw('SUM(mc.preco * sc.quantidade + mc.valor_frete) AS total_cotacao'),
                    DB::raw('MIN((SELECT preco FROM tbmateriais_cotados 
        WHERE cod_material = mc.cod_material 
        AND status = "Aprovado"
        ORDER BY data DESC 
        LIMIT 1)) AS ultima_compra'),
                    DB::raw('MIN((SELECT AVG(preco) FROM tbmateriais_cotados 
        WHERE cod_material = mc.cod_material 
        AND status = "Aprovado")) AS media_historica'),
                    DB::raw('MIN((SELECT AVG(preco) FROM tbmateriais_cotados 
        WHERE cod_material = mc.cod_material 
        AND status = "Aprovado"
        AND data >= DATE_SUB(NOW(), INTERVAL 6 MONTH))) AS media_6_meses'),
                    DB::raw('MIN((SELECT JSON_ARRAYAGG(JSON_OBJECT("parcela", parcela, "dias", dias)) 
        FROM tbaux_dias_parcelas 
        WHERE cod_cotacao = mc.cod_cotacao 
        AND cod_material = mc.cod_material
        AND fornecedor_id = mc.fornecedor_id
        ORDER BY parcela ASC)) AS datasParcelas')
                )
                ->groupBy('mc.cod_material', 'fornecedor_id')
                ->get();

            return response()->json($cotacoes);

        } catch (\Exception $e) {
            \Log::error('Erro ao buscar cotações existentes: ' . $e->getMessage(), [
                'cod_compra' => $cod_cotacao,
                'exception' => $e
            ]);
            return response()->json(['error' => 'Erro ao buscar cotações', 'message' => $e->getMessage()], 500);
        }
    }

    public function agruparCotacoes(Request $request)
    {
        try {
            // Validação dos dados recebidos
            $request->validate([
                'codigos_compra' => 'required|array|min:2',
                'codigos_compra.*' => 'required|string',
                'codigos_material' => 'required|array|min:1',
                'codigos_material.*' => 'required|string',
            ]);

            $codigosCompra = $request->codigos_compra;
            $codigosMaterial = $request->codigos_material;

            // Iniciar transação
            DB::beginTransaction();

            // Gerar código único para a cotação agrupada
            $codCotacaoAgrupado = $this->gerarCodigoCotacao();

            $itensAtualizados = [];
            $itensAgrupadosLista = [];

            // Para cada código de compra, buscar os itens específicos que serão agrupados
            foreach ($codigosCompra as $codCompra) {
                // Buscar os itens específicos desta compra que foram selecionados
                $itensParaAtualizar = DB::connection('DBCompra')->table('tbsol_compra')
                    ->where('cod_compra', $codCompra)
                    ->whereIn('cod_material', $codigosMaterial)
                    ->get();

                foreach ($itensParaAtualizar as $item) {
                    // Buscar descrição do material
                    $descricao = $this->buscarDescricaoMaterial($item->cod_material);

                    // Adicionar item à lista de itens agrupados
                    $itensAgrupadosLista[] = [
                        'cod_compra_origem' => $codCompra,
                        'cod_material' => $item->cod_material,
                        'descricao' => $descricao,
                        'quantidade' => $item->quantidade,
                        'unidade' => $item->unid ?? 'UN'
                    ];

                    // Atualizar o item
                    DB::connection('DBCompra')->table('tbsol_compra')
                        ->where('id', $item->id)
                        ->update([
                            'cod_compra' => $codCotacaoAgrupado,
                            'editavel' => 1,
                        ]);

                    $itensAtualizados[] = [
                        'cod_compra' => $codCompra,
                        'cod_material' => $item->cod_material,
                        'quantidade' => $item->quantidade
                    ];
                }
            }

            // Verificar se algum item foi atualizado
            if (empty($itensAtualizados)) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Nenhum item válido encontrado para agrupar',
                    'verifique' => [
                        'codigos_compra' => $codigosCompra,
                        'codigos_material' => $codigosMaterial
                    ]
                ], 400);
            }

            // Criar um registro de agrupamento na tabela de histórico
            DB::connection('DBCompra')->table('tb_agrupamento_cotacoes')->insert([
                'cod_cotacao_agrupada' => $codCotacaoAgrupado,
                'compras_origem' => json_encode($codigosCompra),
                'materiais_origem' => json_encode($codigosMaterial),
                'itens_agrupados' => json_encode($itensAgrupadosLista), // Agora com os itens detalhados
                'data_agrupamento' => now(),
                'usuario' => auth('api')->user()->matricula ?? 'sistema',
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Itens agrupados com sucesso',
                'data' => [
                    'cod_cotacao' => $codCotacaoAgrupado,
                    'total_compras_envolvidas' => count($codigosCompra),
                    'total_materiais_agrupados' => count($itensAtualizados),
                    'itens_agrupados' => $itensAgrupadosLista,
                    'detalhes' => $itensAtualizados
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro de validação',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erro ao agrupar cotações: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erro ao agrupar cotações: ' . $e->getMessage()
            ], 500);
        }
    }

    private function buscarDescricaoMaterial(string $codMaterial): string
    {
        if (empty($codMaterial)) {
            return 'Material não informado';
        }

        try {
            $material = DB::connection('DBCompra')->table('tb_material')
                ->where('codmat', $codMaterial)
                ->first();

            if (!$material) {
                $material = DB::connection('DBCompra')->table('tbmaterial_aniel')
                    ->where('codmat', $codMaterial)
                    ->first();
            }

            return $material->descricao ?? 'Material não encontrado';
        } catch (\Exception $e) {
            return 'Erro ao buscar material';
        }
    }

    /**
     * Gera código único para a cotação
     * Formato: STRING ALEATÓRIA MAIÚSCULA (ex: "2X5K9M")
     */
    private function gerarCodigoCotacao()
    {
        do {
            // Gerar código único baseado no timestamp + random
            $codigo = strtoupper(base_convert(time() . rand(100, 999), 10, 36));

            // Verificar se o código já existe
            $existe = DB::connection('DBCompra')->table('tbsol_compra')
                ->where('cod_cotacao', $codigo)
                ->exists();

        } while ($existe); // Se existir, gera novamente

        return $codigo;
    }

    public function publicIndex($cod_compra, $cnpj)
    {
        // 1. Buscar fornecedor pelo CNPJ
        $fornecedor = DB::connection('DBCompra') // ou sua conexão de fornecedores
            ->table('tbfornecedor')
            ->whereRaw("REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '/', ''), '-', '') = ?", [$cnpj])
            ->first();

        if (!$fornecedor) {
            return response()->json(['error' => 'Fornecedor não encontrado'], 404);
        }

        $fornecedorId = $fornecedor->id;

        // 2. Buscar materiais (mesmo algoritmo do index, porém público e nível 3)
        $todosMateriais = DB::connection('DBCompra')->table('tbsol_compra')
            ->where('cod_compra', $cod_compra)
            ->get(['cod_material', 'cod_cotacao', 'tipo_cotacao', 'cod_compra']);

        $codCotacaoAgrupado = null;

        if ($todosMateriais->isEmpty()) {
            $todosMateriais = DB::connection('DBCompra')->table('tbsol_compra')
                ->where('cod_cotacao', $cod_compra)
                ->get(['cod_material', 'cod_cotacao', 'tipo_cotacao', 'cod_compra']);
        }

        if ($todosMateriais->isEmpty()) {
            return response()->json(['materiais' => [], 'cotacoes' => [], 'dados_historicos' => []]);
        }

        $primeiro = $todosMateriais->first();
        $tiposCotacao = ['AGRUPADA', 'agrupado'];
        if (in_array($primeiro->tipo_cotacao, $tiposCotacao)) {
            $codCotacaoAgrupado = $primeiro->cod_cotacao ?? $cod_compra;
        }
        $isAgrupado = !is_null($codCotacaoAgrupado);

        // Verificar se todos já foram cotados (com MAT...)
        $todosCotadosPorMaterial = true;
        foreach ($todosMateriais as $material) {
            if (is_null($material->cod_cotacao) || !str_starts_with($material->cod_cotacao, 'MAT')) {
                $todosCotadosPorMaterial = false;
                break;
            }
        }
        if ($todosCotadosPorMaterial) {
            return response()->json(['materiais' => [], 'cotacoes' => [], 'dados_historicos' => []]);
        }

        // Query dos materiais (nível 3 fixo)
        $query = DB::connection('DBCompra')->table('tbsol_compra as sol')
            ->joinSub(
                DB::connection('DBCompra')->table('tb_material as mat1')
                    ->select('codmat', 'descricao', 'unid')
                    ->unionAll(
                        DB::connection('DBCompra')->table('tbmaterial_aniel as mat2')
                            ->select('codmat', 'descricao', 'unid')
                    ),
                'mat',
                function ($join) {
                    $join->on('mat.codmat', '=', 'sol.cod_material');
                }
            )
            ->select(
                'sol.cod_compra',
                'sol.cod_material',
                'sol.quantidade',
                'mat.descricao',
                'mat.unid',
                'sol.tipo_cotacao',
                'sol.cod_cotacao'
            )
            ->where(function ($q) use ($cod_compra) {
                $q->where('sol.cod_compra', $cod_compra)
                    ->orWhere('sol.cod_cotacao', $cod_compra);
            })
            ->where(function ($q) {
                $q->whereNull('sol.cod_cotacao')
                    ->orWhere('sol.cod_cotacao', 'not like', 'MAT%');
            })
            // Filtro nível 3
            ->where(function ($q) {
                $q->where(function ($sub) {
                    $sub->whereNotNull('sol.aceite_material')
                        ->where('sol.aceite_material', '!=', '0')
                        ->whereNull('sol.aceite_compra');
                })
                    ->orWhere('sol.finalizado', '=', '1')
                    ->orWhere('sol.status', '=', '3');
            });

        $materiais = $query->get();

        // Agrupamentos (reuse os métodos do controller original ou mova-os para cá)
        $materiais = $this->agruparPorMesmoMaterial($materiais);
        if ($isAgrupado) {
            $materiais = $this->agruparItensPorMaterial($materiais, $codCotacaoAgrupado);
        }

        // 3. Buscar cotações existentes APENAS para este fornecedor
        $cotacoes = DB::connection('DBCompra')->table('tbsol_compra as sc')
            ->leftJoin('tbmateriais_cotados as mc', 'sc.cod_cotacao', '=', 'mc.cod_cotacao')
            ->where('cod_compra', $cod_compra)
            ->where('fornecedor_id', $fornecedorId)
            ->get()
            ->map(function ($cot) {
                return [
                    'cod_material' => $cot->cod_material,
                    'preco' => $cot->preco,
                    'tipo_frete' => $cot->tipo_frete,
                    'cond_pgto' => $cot->cond_pgto,
                    'cond_entrega' => $cot->cond_entrega,
                    'ipi' => $cot->ipi,
                    'icms' => $cot->icms,
                    'valor_frete' => $cot->valor_frete,
                    'obs' => $cot->obs,
                    'qtd_parcelas' => $cot->qtd_parcelas,
                    'arquivo' => $cot->arquivo,
                ];
            });

        // 4. Dados históricos (exemplo: você pode ter um método getDadosHistoricos)
        // Adapte conforme sua lógica original. Aqui um exemplo simples:
        $codigosMateriais = $materiais->pluck('cod_material')->unique();
        $dadosHistoricos = [];
        foreach ($codigosMateriais as $cod) {
            // Buscar última compra, média etc. (implemente conforme seu hook original)
            // Exemplo:
            $dadosHistoricos[$cod] = [
                'ultima_compra' => 0, // preencher com query real
                'media_historica' => 0,
                'media_6_meses' => 0,
            ];
        }
        // (Substitua por sua lógica real de obtenção de histórico)

        return response()->json([
            'materiais' => $materiais,
            'cotacoes' => $cotacoes,
            'dados_historicos' => $dadosHistoricos,
        ]);
    }



    public function create()
    {
    }
    public function show($id)
    {
    }
    public function edit($id)
    {
    }
    public function update(Request $request, $id)
    {
    }
    public function destroy($id)
    {
    }
}