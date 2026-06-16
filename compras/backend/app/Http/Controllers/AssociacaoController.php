<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\AssociacaoService;
use Illuminate\Support\Facades\DB;


class AssociacaoController extends Controller
{
    protected $service;

    public function __construct(AssociacaoService $service)
    {
        $this->service = $service;
    }

    public function getDados(Request $request)
    {
        try {
            $dados = $this->service->buscarDadosPendentes($request->all());
            return response()->json(['success' => true, 'data' => $dados]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function confirmar(Request $request)
    {
        $request->validate([
            'itens_conciliados' => 'required|array',
            'status_sugerido' => 'required|string|in:APROVADO,DIRETORIA,GESTOR',
            'ids_pedidos_compra' => 'required|array|min:1',
            'ids_notas_fiscais' => 'required|array|min:1',
            'flg_notificar_gestor' => 'boolean'
        ]);

        try {
            $resultado = $this->service->processarAssociacao($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Associação salva com sucesso!',
                'data' => [
                    'vinculo_id' => $resultado['vinculo_id'],
                    'status' => $resultado['status']
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao salvar associação: ' . $e->getMessage()
            ], 500);
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
            $nivelAcesso = $usuario->compras ?? 1; // Valor padrão 1 se não existir

            // Definir filtros baseados no nível de acesso
            $statusPermitidos = [];

            if ($nivelAcesso == 2) {
                // Nível 2: só pode ver pendencia_gestor
                $statusPermitidos = ['pendencia_gestor'];
            } elseif (in_array($nivelAcesso, [4, 5, 6])) {
                // Níveis 4, 5, 6: só podem ver aguardando_diretoria
                $statusPermitidos = ['aguardando_diretoria'];
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
                ->whereIn('av.status_compra', $statusPermitidos) // Aplica o filtro baseado no nível
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
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Erro ao buscar associações: ' . $e->getMessage()
            ], 500);
        }
    }

    public function finalizar(Request $request)
    {
        try {
            // Verificar autenticação
            if (!auth('api')->check()) {
                return response()->json(['error' => 'Não autenticado'], 401);
            }

            $grupoId = $request->grupo_id;

            if (!$grupoId) {
                return response()->json([
                    'success' => false,
                    'message' => 'ID do grupo é obrigatório'
                ], 422);
            }

            // Primeiro, buscar um registro do grupo para obter os ids_pedidos e ids_notas
            $registroGrupo = DB::connection('DBCompra')
                ->table('tb_associacao_vinculo')
                ->select('ids_pedidos', 'ids_notas')
                ->whereIn('status_compra', ['aguardando_diretoria', 'pendencia_gestor', 'em_analise'])
                ->where('status_compra', '!=', 'finalizado')
                ->get()
                ->first(function ($assoc) use ($grupoId) {
                    // Encontrar pelo grupo_id (md5 hash)
                    $chaveGrupo = md5($assoc->ids_pedidos . '|' . $assoc->ids_notas);
                    return $chaveGrupo === $grupoId;
                });

            if (!$registroGrupo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Grupo não encontrado ou já finalizado'
                ], 404);
            }

            // Atualizar TODOS os registros do grupo
            $atualizado = DB::connection('DBCompra')
                ->table('tb_associacao_vinculo')
                ->where('ids_pedidos', $registroGrupo->ids_pedidos)
                ->where('ids_notas', $registroGrupo->ids_notas)
                ->where('status_compra', '!=', 'finalizado')
                ->update([
                    'status_compra' => 'aprovado',
                    'updated_at' => now(),
                    'usuario_id' => auth('api')->id()
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Associação aprovada com sucesso!',
                'data' => [
                    'grupo_id' => $grupoId,
                    'ids_pedidos' => json_decode($registroGrupo->ids_pedidos),
                    'ids_notas' => json_decode($registroGrupo->ids_notas),
                    'registros_afetados' => $atualizado,
                    'status_compra' => 'aprovado'
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao finalizar associação: ' . $e->getMessage()
            ], 500);
        }

    }
}