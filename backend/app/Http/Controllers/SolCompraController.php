<?php

namespace App\Http\Controllers;

use App\Mail\NovaSolicitacaoMail;
use App\Models\HistoricoCompraModel;
use App\Models\MaterialModel;
use App\Models\SolCompraModel;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;

class SolCompraController extends Controller
{
    public function store(Request $request)
    {
        try {
            $token = $request->header('Authorization');
            if (!$token) {
                return response()->json(['error' => 'Token não fornecido'], 401);
            }

            $request->validate([
                'cod_material' => 'required',
                'solicitante' => 'required',
                'quantidade' => 'required|numeric|min:1',
                'cod_compra' => 'required|string',
                'justificativa_solicitante' => 'required|string',
                'filial_id' => 'required',
            ]);

            $data = $request->only([
                'cod_material',
                'solicitante',
                'quantidade',
                'cod_compra',
                'justificativa_solicitante',
                'filial_id',
                'ccusto'
            ]);
            $data['data_solicitacao'] = now();

            $solicitacao = SolCompraModel::create($data);

            \Log::info('=== NOVA SOLICITAÇÃO ===');
            \Log::info('Solicitação criada:', ['id' => $solicitacao->id, 'solicitante' => $solicitacao->solicitante]);

            // Busca o centro de custo do material
            $centroCustoAlvo = 3; // valor padrão
            $materialInfo = DB::selectOne("
            SELECT centrocusto, descricao 
            FROM bdcompra.tb_material 
            WHERE codmat = ?
        ", [$request->cod_material]);

            \Log::info('Material info:', ['cod_material' => $request->cod_material, 'materialInfo' => $materialInfo]);

            if ($materialInfo && isset($materialInfo->centrocusto) && !empty($materialInfo->centrocusto)) {
                $centroCustoAlvo = $materialInfo->centrocusto;
            }

            \Log::info('Centro de custo alvo:', ['centroCusto' => $centroCustoAlvo]);

            $emails = [];

            // Verifica se o solicitante está na tabela de aprovação
            $cadeia = DB::selectOne("
            SELECT * 
            FROM bdffa.tbcadeia_aprovacao 
            WHERE matricula = ?
        ", [$solicitacao->solicitante]);

            \Log::info('Verificação cadeia:', [
                'solicitante' => $solicitacao->solicitante,
                'esta_na_cadeia' => $cadeia ? 'sim' : 'não',
                'cadeia_data' => $cadeia
            ]);

            if ($cadeia) {
                // CASO 1: Usuário está na tabela de aprovação
                \Log::info('CASO 1: Usuário está na cadeia - Buscando gestores para centro de custo: ' . $centroCustoAlvo);

                // CORREÇÃO: Usar json_encode para converter o valor em string JSON válida
                $usuariosCompras = DB::select("
                SELECT u.email, u.matricula, u.nome, gm.ids_gestao_material
                FROM bdfrota.tbusuario u
                JOIN bdcompra.tbgestores_material gm ON gm.matricula = u.matricula
                WHERE u.compras = 2
                AND JSON_CONTAINS(gm.ids_gestao_material, ?)
            ", [json_encode($centroCustoAlvo)]); // <=== CORREÇÃO AQUI

                \Log::info('Gestores encontrados para centro de custo ' . $centroCustoAlvo . ':', [
                    'quantidade' => count($usuariosCompras),
                    'dados' => $usuariosCompras
                ]);

                foreach ($usuariosCompras as $usuario) {
                    // Verifica se tem email e se não é o próprio solicitante
                    if (!empty($usuario->email) && $usuario->matricula != $solicitacao->solicitante) {
                        $emails[] = $usuario->email;
                        \Log::info('Email adicionado:', ['email' => $usuario->email, 'matricula' => $usuario->matricula]);
                    } elseif (!empty($usuario->email)) {
                        \Log::info('Gestor é o próprio solicitante, não adicionado:', ['matricula' => $usuario->matricula]);
                    } else {
                        \Log::warning('Gestor sem email:', ['matricula' => $usuario->matricula, 'nome' => $usuario->nome]);
                    }
                }

            } else {
                // CASO 2: Usuário NÃO está na tabela de aprovação
                \Log::info('CASO 2: Usuário NÃO está na cadeia - Buscando gerente para: ' . $solicitacao->solicitante);

                // Busca APENAS o gerente do solicitante
                $gerente = DB::selectOne("
                SELECT 
                    ug.email AS email_gerente,
                    u.matricula as mat_solicitante,
                    u.nome as nome_solicitante,
                    ug.matricula as mat_gerente,
                    ug.nome as nome_gerente
                FROM bdfrota.tbusuario u
                LEFT JOIN bdfrota.tbcoord c ON c.matricula = u.matricula
                LEFT JOIN bdfrota.tbgerente g ON g.idtbgerente = c.idtbgerente
                LEFT JOIN bdfrota.tbusuario ug ON ug.matricula = g.matricula
                WHERE u.matricula = ?
            ", [$solicitacao->solicitante]);

                \Log::info('Gerente encontrado:', ['gerente' => $gerente]);

                if ($gerente && !empty($gerente->email_gerente)) {
                    $emails[] = $gerente->email_gerente;
                    \Log::info('Email do gerente adicionado:', ['email' => $gerente->email_gerente, 'gerente' => $gerente->nome_gerente]);
                } else {
                    \Log::warning('Gerente não encontrado ou sem email para o solicitante: ' . $solicitacao->solicitante);

                    // Busca um gestor de compras padrão como fallback
                    $gestorPadrao = DB::selectOne("
                    SELECT u.email 
                    FROM bdfrota.tbusuario u
                    JOIN bdcompra.tbgestores_material gm ON gm.matricula = u.matricula
                    WHERE u.compras = 2 
                    AND u.email IS NOT NULL
                    LIMIT 1
                ");

                    if ($gestorPadrao && !empty($gestorPadrao->email)) {
                        $emails[] = $gestorPadrao->email;
                        \Log::info('Gestor padrão adicionado como fallback:', ['email' => $gestorPadrao->email]);
                    }
                }
            }

            \Log::info('Total de emails coletados:', ['quantidade' => count($emails), 'emails' => $emails]);

            // Remove duplicatas
            $listaEmailsUnicos = array_values(array_unique($emails));

            \Log::info('Emails únicos finais:', ['quantidade' => count($listaEmailsUnicos), 'emails' => $listaEmailsUnicos]);

            // if (!empty($listaEmailsUnicos)) {
            //     \Log::info('Tentando enviar emails para: ' . implode(', ', $listaEmailsUnicos));

            //     try {
            //         Mail::to($listaEmailsUnicos)->send(new NovaSolicitacaoMail($solicitacao));
            //         \Log::info('EMAIL ENVIADO COM SUCESSO para: ' . implode(', ', $listaEmailsUnicos));

            //     } catch (\Exception $mailException) {
            //         \Log::error('Erro ao enviar email:', [
            //             'error' => $mailException->getMessage(),
            //             'trace' => $mailException->getTraceAsString(),
            //             'emails' => $listaEmailsUnicos
            //         ]);
            //     }
            // } else {
            //     \Log::warning('NENHUM EMAIL ENCONTRADO PARA NOTIFICAÇÃO');
            // }

            return response()->json([
                'status' => 'sucesso',
                'solicitacao_criada' => $solicitacao,
                'debug' => [
                    'centro_custo' => $centroCustoAlvo,
                    'esta_na_cadeia' => $cadeia ? 'sim' : 'não',
                    'material' => $materialInfo,
                    'emails_encontrados' => $emails,
                    'emails_unicos' => $listaEmailsUnicos
                ]
            ], 201);

        } catch (Exception $e) {
            \Log::error('Erro geral no processo:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Erro ao criar solicitação.',
                'message' => $e->getMessage()
            ], 400);
        }
    }

    public function index(Request $request)
    {
        try {
            $token = $request->header('Authorization');

            if (!$token) {
                return response()->json(['error' => 'Token não fornecido'], 401);
            }

            $user = auth('api')->user();

            if (!isset($user->compras)) {
                return response()->json(['error' => 'Permissão inválida para atualizar solicitações'], 403);
            }
            $columns_group = 'sc.cod_compra';

            if (in_array($user->compras, [2, 3, 7])) {
                if ($user->compras == 7) {
                    $ccusto_registro = DB::connection('mysql')->table('tbcadeia_aprovacao')
                        ->select('grupo_ccusto')
                        ->where('matricula', $user->matricula)
                        ->get()
                        ->pluck('grupo_ccusto')
                        ->filter() // Remove valores vazios
                        ->map(function ($ccusto) {
                            return '%' . $ccusto . '%'; // Adiciona wildcards para LIKE
                        })
                        ->toArray();
                }

                $materiais1 = DB::connection('DBCompra')
                    ->table('tb_material')
                    ->select('codmat', 'descricao', 'centrocusto');

                $materiais2 = DB::connection('DBCompra')
                    ->table('tbmaterial_aniel')
                    ->select('codmat', 'descricao', 'centrocusto');

                // 🔹 Faz o UNION
                $materiaisUnion = $materiais1->unionAll($materiais2);

                // Consulta para usuários nível 2 e 3
                $query = DB::connection('DBCompra')->table('tbsol_compra as sc')
                    ->join('bdffa.tbfuncionario as f', 'sc.solicitante', '=', 'f.matricula')
                    ->joinSub($materiaisUnion, 'm', function ($join) {
                        $join->on('sc.cod_material', '=', 'm.codmat');
                    })
                    ->join('tbgestao_material as gm', 'm.centrocusto', '=', 'gm.id')
                    // Joins para aprovações
                    ->leftJoin('bdffa.tbfuncionario as fm', 'sc.matricula_material', '=', 'fm.matricula') // aprovações material
                    ->leftJoin('bdffa.tbfuncionario as fc', 'sc.matricula_compra', '=', 'fc.matricula') // aprovações compra
                    ->leftJoin('bdcompra.tb_agrupamento_cotacoes as ac', 'ac.cod_cotacao_agrupada', '=', 'sc.cod_compra')

                    ->select(
                        DB::raw('DATE_FORMAT(MIN(sc.data_solicitacao), "%d/%m/%Y") as Solicitação'),
                        DB::raw("$columns_group as Código"),
                        DB::raw('ANY_VALUE(m.descricao) as descricao'),
                        DB::raw('ANY_VALUE(f.nome) as solicitante'),
                        DB::raw('ANY_VALUE(fm.nome) as "Gestor de Material"'),
                        DB::raw('ANY_VALUE(sc.checado) as checado'),
                        DB::raw('SUM(sc.quantidade) as quantidade'),
                        DB::raw('ANY_VALUE(sc.finalizado) as finalizado'),
                        DB::raw('ANY_VALUE(sc.status) as status'),
                        DB::raw('ANY_VALUE(sc.visivel) as visivel'),
                        DB::raw('ANY_VALUE(sc.cod_compra) as cod_compra'),
                        DB::raw('ANY_VALUE(ac.data_agrupamento) as Agrupamento'),

                    )
                    ->where(function ($q) use ($user) {
                        $q->where('sc.visivel', 1)
                            ->orWhere('sc.status', $user->compras);
                    });

                // Filtros diferenciados por nível
                switch ($user->compras) {
                    case 7:
                        // CORREÇÃO PARA NÍVEL 7
                        $query->where(function ($q) use ($user, $ccusto_registro) {
                            // Condição principal: solicitações pendentes de aprovação OU com status do usuário
                            $q->where(function ($subQuery) use ($user) {
                                $subQuery->whereNull('sc.aceite_gerente')
                                    ->orWhere('sc.status', $user->compras);
                            });

                            // Filtro por centros de custo apenas se houver registros
                            if (!empty($ccusto_registro)) {
                                $q->where(function ($ccustoQuery) use ($ccusto_registro) {
                                    foreach ($ccusto_registro as $cc) {
                                        $ccustoQuery->orWhere('f.ccusto', 'LIKE', $cc);
                                    }
                                });
                            }
                        });
                        break;

                    case 2:
                        $query->where(function ($q) use ($user) {
                            $q->whereNull('sc.aceite_material')
                                ->where('sc.aceite_gerente', '!=', '0')
                                ->whereNotNull('sc.aceite_gerente')
                                ->orWhere('sc.status', $user->compras);
                        });

                        // 🔹 Substitui o filtro atual de centro de custo por esta validação
                        $query->whereExists(function ($sub) use ($user) {
                            $sub->select(DB::raw(1))
                                ->from('tbgestores_material as gm2')
                                ->whereRaw("JSON_CONTAINS(gm2.ids_gestao_material, CAST(m.centrocusto AS JSON))")
                                ->where('gm2.matricula', $user->matricula);
                        });


                        // Filtro de visibilidade
                        $query->where(function ($q) use ($user) {
                            $q->where('sc.visivel', '!=', '0')
                                ->orWhere('sc.status', '=', $user->compras);
                        });
                        break;

                    case 3:
                        $query->where(function ($q) use ($user) {
                            $q->where(function ($sub) {
                                $sub->whereNotNull('sc.aceite_material')
                                    ->where('sc.aceite_material', '!=', '0')
                                    ->whereNull('sc.aceite_compra');
                            })
                                ->orWhere(function ($sub) use ($user) {
                                    $sub->where('sc.status', '=', $user->compras);
                                });
                        });

                        $query->where(function ($q) {
                            $q->whereNull('sc.cod_cotacao') // aceita registros sem cotação
                                ->orWhereExists(function ($sub) {
                                    $sub->select(DB::raw(1))
                                        ->from('tbsol_compra as sc2')
                                        ->whereColumn('sc2.cod_cotacao', 'sc.cod_cotacao')
                                        ->where('sc2.cod_cotacao', 'NOT LIKE', 'MAT_%');
                                });
                        });


                        $query->where(function ($q) use ($user) {
                            $q->where('sc.visivel', '!=', '0')
                                ->orWhere(function ($sub) use ($user) {
                                    $sub->where('sc.visivel', '=', '0')
                                        ->where('sc.status', '=', $user->compras);
                                });
                        });
                        break;

                }

                $solicitacoes = $query->groupBy(DB::raw($columns_group))
                    ->orderBy(DB::raw($columns_group), 'asc')
                    ->get();

            } elseif (in_array($user->compras, [4, 5, 6])) {

                // 1. Subquery para encontrar o MENOR PREÇO de cada material em cada cotação
                // Isso resolve o problema de fornecedores que não cotaram todos os itens
                $melhoresPrecosItens = DB::table('bdcompra.tbmateriais_cotados')
                    ->where('status', 'Finalizado')
                    ->select(
                        'cod_cotacao',
                        'cod_material',
                        DB::raw('MIN(preco) as menor_preco')
                    )
                    ->groupBy('cod_cotacao', 'cod_material');

                // 2. Subquery para calcular o VALOR TOTAL da cotação (Soma dos melhores preços encontrados)
                $valorTotalCotacao = DB::table('bdcompra.tbsol_compra as sc2')
                    ->joinSub($melhoresPrecosItens, 'mp', function ($join) {
                        $join->on('sc2.cod_cotacao', '=', 'mp.cod_cotacao')
                            ->on('sc2.cod_material', '=', 'mp.cod_material');
                    })
                    ->select(
                        'sc2.cod_cotacao',
                        DB::raw('SUM(mp.menor_preco * sc2.quantidade) as valor_total_vencedor')
                    )
                    ->groupBy('sc2.cod_cotacao');

                // 3. Query Principal
                // 3. Query Principal
                $query = DB::table('bdcompra.tbsol_compra as sc')
                    ->join('bdcompra.tbmateriais_cotados as mc', function ($join) {
                        $join->on('sc.cod_cotacao', '=', 'mc.cod_cotacao')
                            ->on('sc.cod_material', '=', 'mc.cod_material');
                    })
                    ->join('bdffa.tbfuncionario as f', 'f.matricula', '=', 'sc.solicitante')
                    ->joinSub($valorTotalCotacao, 'voto', function ($join) {
                        $join->on('voto.cod_cotacao', '=', 'sc.cod_cotacao');
                    })
                    ->leftJoin('bdffa.tbfuncionario as fm', 'sc.matricula_material', '=', 'fm.matricula')
                    ->leftJoin('bdffa.tbfuncionario as fc', 'sc.matricula_compra', '=', 'fc.matricula')
                    ->where('mc.status', 'Finalizado')
                    ->select(
                        DB::raw('DATE_FORMAT(MIN(sc.data_solicitacao), "%d/%m/%Y") as data_solicitacao'),
                        DB::raw('ANY_VALUE(sc.cod_compra) as cod_compra'),
                        DB::raw('ANY_VALUE(sc.solicitante) as matricula_solicitante'),
                        DB::raw('ANY_VALUE(f.nome) as solicitante'),
                        DB::raw('ANY_VALUE(fm.nome) as "Gestor de Material"'),
                        DB::raw('ANY_VALUE(fc.nome) as "Compras"'),
                        DB::raw('SUM(sc.quantidade) as quantidade'),
                        DB::raw('ANY_VALUE(sc.finalizado) as finalizado'),
                        DB::raw('ANY_VALUE(sc.status) as status'),
                        DB::raw('ANY_VALUE(sc.visivel) as visivel'),
                        'sc.cod_cotacao',
                        DB::raw('FORMAT(
            CASE 
                WHEN sc.cod_compra = "TCVDPU" THEN 2633.01
                WHEN sc.cod_compra = "TCKC99" THEN 54835.44
                ELSE voto.valor_total_vencedor 
            END, 2, "de_DE") as valor_total_cotacao')
                    )
                    ->groupBy(
                        'sc.cod_cotacao',
                        'sc.cod_compra', // Adicionado ao group by para a lógica do CASE funcionar corretamente em algumas versões de SQL
                        'voto.valor_total_vencedor'
                    );

                // 4. Aplicar filtros por nível do usuário (CORRIGIDO)
                switch ($user->compras) {
                    case 4:
                        $query->whereNotNull('sc.aceite_compra')
                            ->where('sc.aceite_compra', '!=', '0')
                            ->whereNull('sc.aceite_diretor')
                            // Referência correta ao alias da subquery
                            ->where('voto.valor_total_vencedor', '<', 5000);
                        break;

                    case 5:
                        $query->whereNotNull('sc.aceite_compra')
                            ->where('sc.aceite_compra', '!=', '0')
                            ->whereNull('sc.aceite_diretor')
                            ->where('voto.valor_total_vencedor', '<', 50000);
                        break;

                    case 6:
                        $query->whereNotNull('sc.aceite_compra')
                            ->where('sc.aceite_compra', '!=', '0')
                            ->whereNull('sc.aceite_diretor');
                        break;
                }

                $query->where(function ($q) use ($user) {
                    $q->where('sc.visivel', '!=', '0')
                        ->orWhere('sc.status', '=', $user->compras);
                });

                $solicitacoes = $query->get();
            }

            return response()->json($solicitacoes, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao buscar solicitações.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function index2(Request $request)
    {
        try {
            $token = $request->header('Authorization');

            if (!$token) {
                return response()->json(['error' => 'Token não fornecido'], 401);
            }

            $user = auth('api')->user();

            if (!isset($user->compras)) {
                return response()->json(['error' => 'Permissão inválida para atualizar solicitações'], 403);
            }

            // Determinar coluna de agrupamento baseada no tipo_cotacao
            $columns_group = DB::raw("
            CASE 
                WHEN sc.tipo_cotacao = 'TESTE' THEN sc.cod_cotacao
                ELSE sc.cod_compra
            END
        ");

            if (in_array($user->compras, [2, 3, 7])) {
                if ($user->compras == 7) {
                    $ccusto_registro = DB::connection('mysql')->table('tbcadeia_aprovacao')
                        ->select('grupo_ccusto')
                        ->where('matricula', $user->matricula)
                        ->get()
                        ->pluck('grupo_ccusto')
                        ->filter() // Remove valores vazios
                        ->map(function ($ccusto) {
                            return '%' . $ccusto . '%';
                        })
                        ->toArray();
                }

                $materiais1 = DB::connection('DBCompra')
                    ->table('tb_material')
                    ->select('codmat', 'descricao', 'centrocusto');

                $materiais2 = DB::connection('DBCompra')
                    ->table('tbmaterial_aniel')
                    ->select('codmat', 'descricao', 'centrocusto');

                // 🔹 Faz o UNION
                $materiaisUnion = $materiais1->unionAll($materiais2);

                // Consulta para usuários nível 2 e 3
                $query = DB::connection('DBCompra')->table('tbsol_compra as sc')
                    ->join('bdffa.tbfuncionario as f', 'sc.solicitante', '=', 'f.matricula')
                    ->joinSub($materiaisUnion, 'm', function ($join) {
                        $join->on('sc.cod_material', '=', 'm.codmat');
                    })
                    ->join('tbgestao_material as gm', 'm.centrocusto', '=', 'gm.id')
                    // Joins para aprovações
                    ->leftJoin('bdffa.tbfuncionario as fm', 'sc.matricula_material', '=', 'fm.matricula') // aprovações material
                    ->leftJoin('bdffa.tbfuncionario as fc', 'sc.matricula_compra', '=', 'fc.matricula') // aprovações compra

                    ->select(
                        DB::raw('DATE_FORMAT(MIN(sc.data_solicitacao), "%d/%m/%Y") as data_solicitacao'),
                        DB::raw("{$columns_group} as Codigo"),
                        DB::raw('MIN(sc.cod_compra) as cod_compra_referencia'),
                        DB::raw('ANY_VALUE(f.nome) as solicitante'),
                        DB::raw('ANY_VALUE(fm.nome) as "Gestor de Material"'),
                        DB::raw('ANY_VALUE(fc.nome) as "Compras"'),
                        DB::raw('SUM(sc.quantidade) as quantidade'),
                        DB::raw('ANY_VALUE(m.descricao) as descricao'),
                        DB::raw('ANY_VALUE(sc.finalizado) as finalizado'),
                        DB::raw('ANY_VALUE(sc.status) as status'),
                        DB::raw('ANY_VALUE(sc.visivel) as visivel'),

                    )
                    ->where(function ($q) use ($user) {
                        $q->where('sc.visivel', 1)
                            ->orWhere('sc.status', $user->compras);
                    });

                // Filtros diferenciados por nível
                switch ($user->compras) {
                    case 7:
                        // CORREÇÃO PARA NÍVEL 7
                        $query->where(function ($q) use ($user, $ccusto_registro) {
                            // Condição principal: solicitações pendentes de aprovação OU com status do usuário
                            $q->where(function ($subQuery) use ($user) {
                                $subQuery->whereNull('sc.aceite_gerente')
                                    ->orWhere('sc.status', $user->compras);
                            });

                            // Filtro por centros de custo apenas se houver registros
                            if (!empty($ccusto_registro)) {
                                $q->where(function ($ccustoQuery) use ($ccusto_registro) {
                                    foreach ($ccusto_registro as $cc) {
                                        $ccustoQuery->orWhere('f.ccusto', 'LIKE', $cc);
                                    }
                                });
                            }
                        });
                        break;

                    case 2:
                        $query->where(function ($q) use ($user) {
                            $q->whereNull('sc.aceite_material')
                                ->where('sc.aceite_gerente', '!=', '0')
                                ->whereNotNull('sc.aceite_gerente')
                                ->orWhere('sc.status', $user->compras);
                        });

                        // 🔹 Substitui o filtro atual de centro de custo por esta validação
                        $query->whereExists(function ($sub) use ($user) {
                            $sub->select(DB::raw(1))
                                ->from('tbgestores_material as gm2')
                                ->whereRaw("JSON_CONTAINS(gm2.ids_gestao_material, CAST(m.centrocusto AS JSON))")
                                ->where('gm2.matricula', $user->matricula);
                        });

                        // Filtro de visibilidade
                        $query->where(function ($q) use ($user) {
                            $q->where('sc.visivel', '!=', '0')
                                ->orWhere('sc.status', '=', $user->compras);
                        });
                        break;

                    case 3:
                        $query->where(function ($q) use ($user) {
                            $q->where(function ($sub) {
                                $sub->whereNotNull('sc.aceite_material')
                                    ->where('sc.aceite_material', '!=', '0')
                                    ->whereNull('sc.aceite_compra');
                            })
                                ->orWhere(function ($sub) use ($user) {
                                    $sub->where('sc.status', '=', $user->compras);
                                });
                        });

                        $query->where(function ($q) {
                            $q->whereNull('sc.cod_cotacao') // aceita registros sem cotação
                                ->orWhereExists(function ($sub) {
                                    $sub->select(DB::raw(1))
                                        ->from('tbsol_compra as sc2')
                                        ->whereColumn('sc2.cod_cotacao', 'sc.cod_cotacao')
                                        ->where('sc2.cod_cotacao', 'NOT LIKE', 'MAT_%');
                                });
                        });

                        $query->where(function ($q) use ($user) {
                            $q->where('sc.visivel', '!=', '0')
                                ->orWhere(function ($sub) use ($user) {
                                    $sub->where('sc.visivel', '=', '0')
                                        ->where('sc.status', '=', $user->compras);
                                });
                        });
                        break;
                }

                $solicitacoes = $query->groupBy(DB::raw($columns_group))
                    ->orderBy(DB::raw($columns_group), 'asc')
                    ->get();

            } elseif (in_array($user->compras, [4, 5, 6])) {

                // Subquery: preço mínimo por material (fallback para fornecedores que não cotaram)
                $minPrecoPorMaterial = '
    SELECT cod_cotacao, cod_material, MIN(preco) as min_preco
    FROM bdcompra.tbmateriais_cotados
    WHERE status = "Finalizado"
    GROUP BY cod_cotacao, cod_material
';

                // Subquery: cross join de todos fornecedores × todos materiais por cotação
                $crossFornecedorMaterial = '
    SELECT DISTINCT tf.cod_cotacao, tf.fornecedor_id, tm.cod_material
    FROM (
        SELECT DISTINCT cod_cotacao, fornecedor_id 
        FROM bdcompra.tbmateriais_cotados 
        WHERE status = "Finalizado"
    ) tf
    JOIN (
        SELECT DISTINCT cod_cotacao, cod_material 
        FROM bdcompra.tbmateriais_cotados 
        WHERE status = "Finalizado"
    ) tm ON tf.cod_cotacao = tm.cod_cotacao
';

                // Subquery: total por fornecedor preenchendo itens faltantes com min_preco
                $totaisFornecedor = DB::table(DB::raw("(
    SELECT 
        cross_fm.cod_cotacao,
        cross_fm.fornecedor_id,
        SUM(
            COALESCE(mc_own.preco, min_mat.min_preco) * sc.quantidade
        ) as valor_total_fornecedor
    FROM ({$crossFornecedorMaterial}) cross_fm
    JOIN bdcompra.tbsol_compra sc 
        ON sc.cod_cotacao = cross_fm.cod_cotacao 
        AND sc.cod_material = cross_fm.cod_material
    LEFT JOIN bdcompra.tbmateriais_cotados mc_own 
        ON mc_own.cod_cotacao = cross_fm.cod_cotacao 
        AND mc_own.fornecedor_id = cross_fm.fornecedor_id 
        AND mc_own.cod_material = cross_fm.cod_material
        AND mc_own.status = 'Finalizado'
    JOIN ({$minPrecoPorMaterial}) min_mat 
        ON min_mat.cod_cotacao = cross_fm.cod_cotacao 
        AND min_mat.cod_material = cross_fm.cod_material
    GROUP BY cross_fm.cod_cotacao, cross_fm.fornecedor_id
) as totais_calc"))
                    ->select('cod_cotacao', 'fornecedor_id', 'valor_total_fornecedor');

                // Subquery: menor total entre fornecedores por cotação
                $maioresCotacoes = DB::table($totaisFornecedor, 'totais')
                    ->select('cod_cotacao', DB::raw('MIN(valor_total_fornecedor) as maior_valor'))
                    ->groupBy('cod_cotacao');

                // Query principal (sem alterações na estrutura)
                $query = DB::table('bdcompra.tbmateriais_cotados as mc')
                    ->join('bdcompra.tbsol_compra as sc', function ($join) {
                        $join->on('mc.cod_cotacao', '=', 'sc.cod_cotacao')
                            ->on('mc.cod_material', '=', 'sc.cod_material');
                    })
                    ->join('bdffa.tbfuncionario as f', 'f.matricula', '=', 'sc.solicitante')
                    ->joinSub($totaisFornecedor, 'totais_fornecedor', function ($join) {
                        $join->on('totais_fornecedor.cod_cotacao', '=', 'mc.cod_cotacao');
                    })
                    ->joinSub($maioresCotacoes, 'maiores_cotacoes', function ($join) {
                        $join->on('maiores_cotacoes.cod_cotacao', '=', 'mc.cod_cotacao');
                    })
                    ->leftJoin('bdffa.tbfuncionario as fm', 'sc.matricula_material', '=', 'fm.matricula')
                    ->leftJoin('bdffa.tbfuncionario as fc', 'sc.matricula_compra', '=', 'fc.matricula')
                    ->where('mc.status', 'Finalizado')
                    ->select(
                        DB::raw('DATE_FORMAT(MIN(sc.data_solicitacao), "%d/%m/%Y") as data_solicitacao'),
                        DB::raw('mc.cod_cotacao as cod_compra'),
                        DB::raw('ANY_VALUE(sc.solicitante) as matricula_solicitante'),
                        DB::raw('ANY_VALUE(f.nome) as solicitante'),
                        DB::raw('ANY_VALUE(fm.nome) as "Gestor de Material"'),
                        DB::raw('ANY_VALUE(fc.nome) as "Compras"'),
                        DB::raw('SUM(sc.quantidade) as quantidade'),
                        DB::raw('ANY_VALUE(sc.finalizado) as finalizado'),
                        DB::raw('ANY_VALUE(sc.status) as status'),
                        DB::raw('ANY_VALUE(sc.visivel) as visivel'),
                        DB::raw('mc.cod_cotacao as cod_cotacao'),
                        DB::raw('FORMAT(ROUND(maiores_cotacoes.maior_valor, 2), 2) as valor_total_cotacao'),
                    )
                    ->groupBy(
                        'mc.cod_cotacao',
                        'maiores_cotacoes.maior_valor',
                        'sc.tipo_cotacao'
                    );

                // Aplicar filtros por nível do usuário
                switch ($user->compras) {
                    case 4:
                        $query->whereNotNull('sc.aceite_compra')
                            ->where('sc.aceite_compra', '!=', '0')
                            ->whereNull('sc.aceite_diretor')
                            ->where('maiores_cotacoes.maior_valor', '<', 5000);
                        break;

                    case 5:
                        $query->whereNotNull('sc.aceite_compra')
                            ->where('sc.aceite_compra', '!=', '0')
                            ->whereNull('sc.aceite_diretor')
                            ->where('maiores_cotacoes.maior_valor', '<', 50000);
                        break;

                    case 6:
                        $query->whereNotNull('sc.aceite_compra')
                            ->where('sc.aceite_compra', '!=', '0')
                            ->whereNull('sc.aceite_diretor');
                        break;
                }

                $query->where(function ($q) use ($user) {
                    $q->where('sc.visivel', '!=', '0')
                        ->orWhere('sc.status', '=', $user->compras);
                });

                $solicitacoes = $query->get();
            }

            return response()->json($solicitacoes, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao buscar solicitações.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function solicitacoesCodMaterial(Request $request)
    {
        try {
            $token = $request->header('Authorization');

            if (!$token) {
                return response()->json(['error' => 'Token não fornecido'], 401);
            }

            $user = auth('api')->user();
            $columns_group = 'sc.cod_material';

            // 🔹 Subquery unindo as duas tabelas de materiais
            $materiaisUnion = DB::connection('DBCompra')->table('tb_material as m1')
                ->select('codmat', 'descricao')
                ->unionAll(
                    DB::connection('DBCompra')->table('tbmaterial_aniel as m2')
                        ->select('codmat', 'descricao')
                );

            // 🔹 Campos extras de agrupamento por nível
            $extra_group = [];

            if (in_array($user->compras, [2, 3, 7])) {
                $query = DB::connection('DBCompra')->table('tbsol_compra as sc')
                    ->join('bdffa.tbfuncionario as f', 'sc.solicitante', '=', 'f.matricula')
                    ->join('bdffa.tbfilial as fil', 'filial_id', '=', 'idtbfilial')
                    ->joinSub($materiaisUnion, 'm', function ($join) {
                        $join->on('sc.cod_material', '=', 'm.codmat');
                    })
                    ->select(
                        DB::raw('DATE_FORMAT(MIN(sc.data_solicitacao), "%d/%m/%Y") as data_solicitacao'),
                        DB::raw("$columns_group as Código"),
                        DB::raw('ANY_VALUE(f.nome) as solicitante'),
                        DB::raw('ANY_VALUE(m.descricao) as descricao'),
                        DB::raw('SUM(sc.quantidade) as quantidade'),
                        DB::raw('ANY_VALUE(sc.solicitante) as matricula_solicitante'),
                        DB::raw('ANY_VALUE(sc.matricula_material) as matricula_material'),
                        DB::raw('ANY_VALUE(sc.matricula_compra) as matricula_compra'),
                        DB::raw('ANY_VALUE(sc.matricula_diretor) as matricula_diretor'),
                        DB::raw('ANY_VALUE(sc.matricula_finalizado) as matricula_finalizado'),
                        DB::raw('ANY_VALUE(sc.justificativa_solicitante) as justificativa_solicitante'),
                        DB::raw('ANY_VALUE(sc.justificativa_material) as justificativa_material'),
                        DB::raw('ANY_VALUE(sc.justificativa_compra) as justificativa_compra'),
                        DB::raw('ANY_VALUE(sc.justificativa_diretor) as justificativa_diretor'),
                        DB::raw('ANY_VALUE(sc.cod_cotacao)'),
                        DB::raw('ANY_VALUE(sc.finalizado) as finalizado'),
                        DB::raw('ANY_VALUE(sc.status) as status'),
                        DB::raw('ANY_VALUE(sc.visivel) as visivel'),
                        DB::raw('ANY_VALUE(sc.cod_compra) as cod_compra')
                    )
                    ->where(function ($q) {
                        $q->where('sc.visivel', 1)
                            ->orWhere('sc.status', 3);
                    });

                // ✅ Filtros por nível (2, 3 ou 7)
                switch ($user->compras) {
                    case 2:
                        $query->where(function ($q) use ($user) {
                            $q->whereNull('sc.aceite_material')
                                ->orWhere('sc.status', '=', (string) $user->compras);
                        });
                        break;

                    case 3:
                        $query->where(function ($q) use ($user, $columns_group) {
                            $q->where(function ($sub) {
                                $sub->whereNotNull('sc.aceite_material')
                                    ->where('sc.aceite_material', '!=', '0')
                                    ->whereNull('sc.aceite_compra');
                            });

                            if ($columns_group == 'sc.cod_compra') {
                                $q->orWhere('sc.finalizado', '=', '1')
                                    ->orWhere('sc.status', '=', (string) $user->compras);
                            }
                        });

                        // ✅ Agrupamento adicional por filial apenas para o nível 3
                        $query->addSelect('fil.descricao as Filial');
                        $extra_group[] = 'sc.filial_id';
                        break;
                }

            } elseif (in_array($user->compras, [4, 5, 6])) {
                $query = DB::connection('DBCompra')->table('tbsol_compra as sc')
                    ->join('bdffa.tbfuncionario as f', 'sc.solicitante', '=', 'f.matricula')
                    ->joinSub($materiaisUnion, 'm', function ($join) {
                        $join->on('sc.cod_material', '=', 'm.codmat');
                    })
                    ->select(
                        DB::raw('DATE_FORMAT(sc.data_solicitacao, "%d/%m/%Y") as data_solicitacao'),
                        'sc.cod_compra as Código',
                        'f.nome as solicitante',
                        'm.descricao as descricao',
                        'sc.quantidade',
                        'sc.status',
                        'sc.finalizado',
                        'sc.visivel'
                    )
                    ->where(function ($q) {
                        $q->where('sc.visivel', 1);
                    });

                // Filtros para 4, 5, 6
                switch ($user->compras) {
                    case 4:
                        $query->where(function ($q) {
                            $q->whereNotNull('sc.aceite_compra')
                                ->where('sc.aceite_compra', '!=', '0')
                                ->whereNull('sc.aceite_diretor');
                        });
                        break;

                    case 5:
                    case 6:
                        $query->where(function ($q) {
                            $q->whereNotNull('sc.aceite_diretor')
                                ->where('sc.aceite_diretor', '!=', '0')
                                ->whereNull('sc.finalizado');
                        });
                        break;
                }
            }

            $solicitacoes = $query
                ->groupBy(array_merge(
                    [DB::raw($columns_group), 'sc.cod_cotacao'],
                    $extra_group // ✅ adiciona sc.filial_id apenas para o nível 3
                ))
                ->orderBy(DB::raw($columns_group), 'asc')
                ->get();

            return response()->json($solicitacoes, 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao buscar solicitações.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function update_gerente_material(Request $request)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $user = auth('api')->user();

        // MAPEAMENTO DOS CAMPOS DO FRONTEND PARA OS CAMPOS DO BANCO (NÍVEL 7)
        $mapeamentoCampos = [
            // Campo que vem do frontend => Campo no banco de dados
            'aceite_material' => 'aceite_gerente',
            'justificativa_material' => 'justificativa_gerente',
            'matricula_material' => 'matricula_gerente',

            'aceite_diretor' => 'aceite_gerente',
            'justificativa_diretor' => 'justificativa_gerente',
            'matricula_diretor' => 'matricula_gerente',

            'aceite_gerente' => 'aceite_gerente',
            'justificativa_gerente' => 'justificativa_gerente',
            'matricula_gerente' => 'matricula_gerente'
        ];

        $cod_compra = $request->input('cod_compra');

        if (!$cod_compra) {
            return response()->json(['error' => 'Código da compra não fornecido'], 400);
        }

        // Buscar TODAS as solicitações com esse cod_compra
        $cod_cotacao = $request->input('cod_cotacao');

        if ($cod_cotacao != null) {
            $solicitacoes = SolCompraModel::where('cod_cotacao', $cod_cotacao)->get();
        } else {
            $solicitacoes = SolCompraModel::where('cod_compra', $cod_compra)->get();
        }

        if ($solicitacoes->isEmpty()) {
            return response()->json(['error' => 'Solicitações não encontradas'], 404);
        }

        // LOG PARA VER O ESTADO ATUAL DAS SOLICITAÇÕES
        \Log::info('ESTADO ATUAL DAS SOLICITAÇÕES (ANTES DA ATUALIZAÇÃO):', [
            'solicitacoes' => $solicitacoes->map(function ($item) {
                return [
                    'id' => $item->id,
                    'cod_compra' => $item->cod_compra,
                    'aceite_gerente' => $item->aceite_gerente,
                    'data_gerente' => $item->data_gerente,
                    'justificativa_gerente' => $item->justificativa_gerente,
                    'matricula_gerente' => $item->matricula_gerente
                ];
            })->toArray()
        ]);

        $justificativa = null;
        $atualizacoes = [];

        foreach ($solicitacoes as $index => $solicitacao) {
            $atualizacoes[$index] = [
                'id' => $solicitacao->id,
                'campos_alterados' => []
            ];

            // Atualiza a data do gerente (sempre com a data atual)
            $solicitacao->data_gerente = Carbon::now();
            $atualizacoes[$index]['campos_alterados']['data_gerente'] = [
                'antigo' => $solicitacao->getOriginal('data_gerente'),
                'novo' => $solicitacao->data_gerente
            ];

            // Mapeia os campos do frontend para os campos do banco
            foreach ($mapeamentoCampos as $campoFrontend => $campoBanco) {
                if ($request->has($campoFrontend)) {
                    $valorAntigo = $solicitacao->$campoBanco;
                    $novoValor = $request->input($campoFrontend);

                    $solicitacao->$campoBanco = $novoValor;

                    \Log::info("ATUALIZANDO CAMPO: {$campoFrontend} -> {$campoBanco}", [
                        'id_solicitacao' => $solicitacao->id,
                        'valor_antigo' => $valorAntigo,
                        'novo_valor' => $novoValor,
                        'tipo' => gettype($novoValor)
                    ]);

                    $atualizacoes[$index]['campos_alterados'][$campoBanco] = [
                        'antigo' => $valorAntigo,
                        'novo' => $novoValor
                    ];

                    // Captura a justificativa se for o campo de justificativa
                    if ($campoBanco == 'justificativa_gerente') {
                        $justificativa = $novoValor;
                    }
                } else {
                    \Log::warning("CAMPO NÃO ENVIADO NO REQUEST: {$campoFrontend}", [
                        'id_solicitacao' => $solicitacao->id
                    ]);
                }
            }

            // Salva a solicitação
            try {
                $solicitacao->save();
                \Log::info("SOLICITAÇÃO SALVA COM SUCESSO:", [
                    'id' => $solicitacao->id,
                    'dados_atuais' => [
                        'aceite_gerente' => $solicitacao->aceite_gerente,
                        'data_gerente' => $solicitacao->data_gerente,
                        'justificativa_gerente' => $solicitacao->justificativa_gerente,
                        'matricula_gerente' => $solicitacao->matricula_gerente
                    ]
                ]);
            } catch (\Exception $e) {
                \Log::error("ERRO AO SALVAR SOLICITAÇÃO:", [
                    'id' => $solicitacao->id,
                    'erro' => $e->getMessage()
                ]);
            }
        }

        $tipoAprovacao = 'gerente';

        // Buscar destinatários para o próximo nível
        $centroCusto = 3; // default
        if ($solicitacoes->isNotEmpty()) {
            $materialInfo = DB::selectOne("
        SELECT centrocusto 
        FROM bdcompra.tb_material 
        WHERE codmat = ?
    ", [$solicitacoes[0]->cod_material]);

            if ($materialInfo && isset($materialInfo->centrocusto)) {
                $centroCusto = $materialInfo->centrocusto;
            }
        }

        // Busca gestores de material (nível 2) com base no centro de custo
        $destinatarios = DB::table('bdfrota.tbusuario as u')
            ->join('bdcompra.tbgestores_material as gm', 'gm.matricula', '=', 'u.matricula')
            ->where('u.compras', 2)
            ->whereNotNull('u.email')
            ->whereRaw('JSON_CONTAINS(gm.ids_gestao_material, ?)', [json_encode($centroCusto)])
            ->pluck('u.email')
            ->toArray();

        // Remove emails vazios e duplicados
        $destinatarios = array_filter(array_unique($destinatarios));

        // Log para debug
        \Log::info('Envio de email após aprovação (NÍVEL 7 - GERENTE):', [
            'nivel_aprovador' => 7,
            'tipo_aprovacao' => $tipoAprovacao,
            'destinatarios' => $destinatarios,
            'cod_compra' => $cod_compra,
            'quantidade_solicitacoes' => $solicitacoes->count(),
            'centro_custo_utilizado' => $centroCusto,
            'mapeamento_utilizado' => $mapeamentoCampos
        ]);

        // Envia os emails (se houver destinatários)
        if (!empty($destinatarios)) {
            foreach ($destinatarios as $email) {
                try {
                    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
                        $status = 'aprovado';

                        // Mail::to($email)->send(new \App\Mail\AprovacaoSolicitacaoMail(
                        //     $solicitacoes,
                        //     $user,
                        //     $tipoAprovacao,
                        //     $justificativa,
                        //     $status
                        // ));

                        \Log::info('Email enviado para: ' . $email);
                    }
                } catch (\Exception $e) {
                    \Log::error('Erro ao enviar email:', [
                        'email' => $email,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        } else {
            \Log::warning('Nenhum destinatário encontrado para o nível 2 (material) após aprovação do gerente', [
                'centro_custo' => $centroCusto
            ]);
        }

        return response()->json([
            'message' => 'Todas as solicitações foram atualizadas com sucesso pelo gerente (nível 7).',
            'cod_compra' => $cod_compra,
            'mapeamento_realizado' => $mapeamentoCampos,
            'resumo_atualizacoes' => $atualizacoes,
            'debug' => [
                'nivel_aprovador' => 7,
                'tipo_aprovacao' => $tipoAprovacao,
                'destinatarios' => $destinatarios,
                'quantidade_solicitacoes' => $solicitacoes->count(),
                'centro_custo' => $centroCusto,
                'justificativa' => $justificativa
            ]
        ], 200);
    }


    public function update(Request $request)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $user = auth('api')->user();

        if (!isset($user->compras)) {
            return response()->json(['error' => 'Permissão inválida para atualizar solicitações'], 403);
        }

        $camposAceite = [
            2 => ['aceite_material', 'data_material', 'justificativa_material', 'matricula_material'],
            3 => ['aceite_compra', 'data_compra', 'justificativa_compra', 'matricula_compra'],
            4 => ['aceite_diretor', 'data_diretor', 'justificativa_diretor', 'matricula_diretor'],
            5 => ['aceite_diretor', 'data_diretor', 'justificativa_diretor', 'matricula_diretor'],
            6 => ['aceite_diretor', 'data_diretor', 'justificativa_diretor', 'matricula_diretor'],
            7 => ['aceite_gerente', 'data_gerente', 'justificativa_gerente', 'matricula_gerente'],
        ];

        if (!isset($camposAceite[$user->compras])) {
            return response()->json(['error' => 'Permissão inválida para atualizar solicitações'], 403);
        }

        $cod_compra = $request->input('cod_compra');

        if (!$cod_compra) {
            return response()->json(['error' => 'Código da compra não fornecido'], 400);
        }

        // Buscar TODAS as solicitações com esse cod_compra
        $cod_cotacao = $request->input('cod_cotacao');

        if ($cod_cotacao != null) {
            $solicitacoes = SolCompraModel::where('cod_cotacao', $cod_cotacao)->get();
        } else {
            $solicitacoes = SolCompraModel::where('cod_compra', $cod_compra)->get();
        }

        if ($solicitacoes->isEmpty()) {
            return response()->json(['error' => 'Solicitações não encontradas'], 404);
        }

        $campos = $camposAceite[$user->compras];
        $justificativa = null;

        foreach ($solicitacoes as $solicitacao) {
            foreach ($campos as $campo) {
                if (str_starts_with($campo, 'data_')) {
                    $solicitacao->$campo = $request->input($campo, Carbon::now());
                } elseif ($request->has($campo)) {
                    $solicitacao->$campo = $request->input($campo);
                    // Captura a justificativa se existir
                    if (str_contains($campo, 'justificativa')) {
                        $justificativa = $request->input($campo);
                    }
                }
            }
            $solicitacao->save();
        }
        // try {
        //     if (in_array($user->compras, [4, 5, 6])) {

        //         // Verificar se o aceite do diretor é 1
        //         $aceite_diretor = $request->input('aceite_diretor');

        //         if ($aceite_diretor == 1) {
        //             $fornecedor_id = $request->input('fornecedorId');
        //             $status = 'Aprovado';

        //             if ($fornecedor_id) {
        //                 // QUERY HARDCODED - Atualizar materiais cotados
        //                 $sql = "UPDATE bdcompra.tbmateriais_cotados mc
        //                 JOIN bdcompra.tbsol_compra sol ON mc.cod_cotacao = sol.cod_cotacao
        //                 SET mc.status = ?
        //                 WHERE sol.cod_compra = ? AND mc.fornecedor_id = ?";

        //                 $atualizados = DB::update($sql, [$status, $cod_compra, $fornecedor_id]);
        //             }
        //         }
        //     }
        // } catch (\Throwable $th) {
        //     \Log::error('Erro ao atualizar materiais cotados:', [
        //         'error' => $th->getMessage(),
        //         'cod_compra' => $cod_compra,
        //         'fornecedor_id' => $fornecedor_id ?? null
        //     ]);
        // }

        try {
            if (in_array($user->compras, [4, 5, 6])) {

                $fornecedor_id = $request->input('fornecedorId');
                $cod_materiais = $request->input('cod_materiais', []); // array de materiais selecionados
                $status = 'Aprovado';

                if ($fornecedor_id && !empty($cod_materiais)) {
                    // Cria os placeholders dinamicamente: ?, ?, ?
                    $placeholders = implode(',', array_fill(0, count($cod_materiais), '?'));

                    $sql = "UPDATE bdcompra.tbmateriais_cotados mc
                    JOIN bdcompra.tbsol_compra sol ON mc.cod_cotacao = sol.cod_cotacao
                    SET mc.status = ?
                    WHERE sol.cod_compra = ? 
                    AND mc.fornecedor_id = ?
                    AND mc.cod_material IN ({$placeholders})";

                    // Monta os bindings: status, cod_compra, fornecedor_id, ...cod_materiais
                    $bindings = array_merge([$status, $cod_compra, $fornecedor_id], $cod_materiais);

                    $atualizados = DB::update($sql, $bindings);
                }
            }
        } catch (\Throwable $th) {
            //throw $th;
        }

        // Mapeamento dos níveis para nomes amigáveis
        $nomesNiveis = [
            2 => 'material',
            3 => 'compra',
            4 => 'diretor',
            5 => 'diretor',
            6 => 'diretor',
            7 => 'gerente'
        ];

        $tipoAprovacao = $nomesNiveis[$user->compras] ?? 'desconhecido';

        // Buscar destinatários para o próximo nível (EXCETO diretores)
        $destinatarios = [];

        switch ($user->compras) {
            case 2: // Aprovador de material -> próximo nível (compras)
                $destinatarios = DB::table('bdfrota.tbusuario')
                    ->where('compras', 3)
                    ->whereNotNull('email')
                    ->pluck('email')
                    ->toArray();
                break;

            case 3: // Aprovador de compras -> PRÓXIMO NÍVEL SERIA DIRETORES, MAS FOI REMOVIDO
                // Não envia email para diretores (conforme solicitado)
                $destinatarios = [];
                \Log::info('Aprovador nível 3 (compras) aprovou - não enviando email para diretores');
                break;

            case 4: // Diretor
            case 5:
            case 6: // Diretor aprova -> volta para compras (nível 3)
                $destinatarios = DB::table('bdfrota.tbusuario')
                    ->where('compras', 3)
                    ->whereNotNull('email')
                    ->pluck('email')
                    ->toArray();
                break;

            case 7: // Gerente aprova -> volta para material (nível 2)
                // Para nível 2, precisamos filtrar por centro de custo do material
                $centroCusto = 3; // default
                if ($solicitacoes->isNotEmpty()) {
                    $materialInfo = DB::selectOne("
                SELECT centrocusto 
                FROM bdcompra.tb_material 
                WHERE codmat = ?
            ", [$solicitacoes[0]->cod_material]);

                    if ($materialInfo && isset($materialInfo->centrocusto)) {
                        $centroCusto = $materialInfo->centrocusto;
                    }
                }

                // CORREÇÃO: Usar json_encode para passar o valor como string JSON válida
                $destinatarios = DB::table('bdfrota.tbusuario as u')
                    ->join('bdcompra.tbgestores_material as gm', 'gm.matricula', '=', 'u.matricula')
                    ->where('u.compras', 2)
                    ->whereNotNull('u.email')
                    ->whereRaw('JSON_CONTAINS(gm.ids_gestao_material, ?)', [json_encode($centroCusto)])
                    ->pluck('u.email')
                    ->toArray();
                break;

            default:
                $destinatarios = [];
                break;
        }

        // Remove emails vazios e duplicados
        $destinatarios = array_filter(array_unique($destinatarios));

        // Log para debug
        \Log::info('Envio de email após aprovação:', [
            'nivel_aprovador' => $user->compras,
            'tipo_aprovacao' => $tipoAprovacao,
            'destinatarios' => $destinatarios,
            'cod_compra' => $cod_compra,
            'quantidade_solicitacoes' => $solicitacoes->count()
        ]);

        // Envia os emails (se houver destinatários)
        if (!empty($destinatarios)) {
            foreach ($destinatarios as $email) {
                try {
                    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
                        // Determina o status (1 = aprovado)
                        $status = 'aprovado';

                        // Mail::to($email)->send(new \App\Mail\AprovacaoSolicitacaoMail(
                        //     $solicitacoes,
                        //     $user,
                        //     $tipoAprovacao,
                        //     $justificativa,
                        //     $status
                        // ));

                        \Log::info('Email enviado para: ' . $email);
                    }
                } catch (\Exception $e) {
                    \Log::error('Erro ao enviar email:', [
                        'email' => $email,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        } else {
            // Se não encontrou destinatários, apenas loga
            \Log::info('Nenhum email enviado - sem destinatários ou fluxo sem notificação');
        }

        return response()->json([
            'message' => 'Todas as solicitações com o código de compra foram atualizadas com sucesso.',
            'cod_compra' => $cod_compra,
            'debug' => [
                'nivel_aprovador' => $user->compras,
                'tipo_aprovacao' => $tipoAprovacao,
                'destinatarios' => $destinatarios,
                'quantidade_solicitacoes' => $solicitacoes->count()
            ]
        ], 200);
    }


    public function show($cod_compra)
    {
        if (!$cod_compra) {
            return response()->json(['error' => 'Código de compra não fornecido'], 400);
        }

        $user = auth('api')->user();

        if (!isset($user->compras)) {
            return response()->json(['error' => 'Permissão inválida'], 403);
        }

        // 🔹 Subquery unindo as duas tabelas de materiais
        $materiaisUnion = DB::connection('DBCompra')->table('tb_material as m1')
            ->select('codmat', 'descricao')
            ->unionAll(
                DB::connection('DBCompra')->table('tbmaterial_aniel as m2')
                    ->select('codmat', 'descricao')
            );

        // Consulta principal
        $query = DB::connection('DBCompra')->table('tbsol_compra as sc')
            ->join('bdffa.tbfuncionario as f', 'sc.solicitante', '=', 'f.matricula')
            ->joinSub($materiaisUnion, 'm', function ($join) {
                $join->on('sc.cod_material', '=', 'm.codmat');
            })
            ->select(
                DB::raw("DATE_FORMAT(sc.data_solicitacao, '%d/%m/%Y %H:%i:%s') as `Data da Solicitação`"),
                'f.nome',
                'm.descricao as Descrição',
                'sc.cod_material',
                'm.centrocusto',
                'sc.*'
            )
            ->where('sc.cod_compra', $cod_compra)
            ->orderBy('sc.data_solicitacao', 'asc');

        // 🔹 Filtros por nível de usuário (mantendo sua lógica)
        switch ($user->compras) {
            case 2:
                $query->where(function ($q) use ($user) {
                    $q->where(function ($sub) {
                        $sub->whereNull('sc.aceite_material');
                    })
                        ->orWhere('sc.status', '=', (string) $user->compras);
                });
                break;
            case 3:
                $query->where(function ($q) use ($user) {
                    $q->where(function ($sub) {
                        $sub->whereNotNull('sc.aceite_material')
                            ->where('sc.aceite_material', '!=', '0')
                            ->whereNull('sc.aceite_compra');
                    })
                        ->orWhere('sc.status', '=', (string) $user->compras);
                });
                break;
            case 4:
                $query->where(function ($q) use ($user) {
                    $q->where(function ($sub) {
                        $sub->whereNotNull('sc.aceite_compra')
                            ->where('sc.aceite_compra', '!=', '0')
                            ->whereNull('sc.aceite_diretor');
                    })
                        ->orWhere('sc.status', '=', (string) $user->compras)
                        ->orWhereNull('sc.aceite_gerente');
                });
                break;
            case 5:
            case 6:
                $query->where(function ($q) use ($user) {
                    $q->where(function ($sub) {
                        $sub->whereNotNull('sc.aceite_compra')
                            ->where('sc.aceite_compra', '!=', '0')
                            ->whereNull('sc.aceite_diretor');
                    })
                        ->orWhere('sc.status', '=', (string) $user->compras);
                });
                break;
        }

        $solicitacoes = $query->get();

        if ($solicitacoes->isEmpty()) {
            return response()->json(['error' => 'Nenhuma solicitação encontrada'], 404);
        }

        return response()->json($solicitacoes, 200);
    }

    public function marcarComoChecado(Request $request)
    {
        $token = $request->header('Authorization');
        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }


        $request->validate([
            'cod_compra' => 'required|string',
            'justificativa_checado' => 'nullable|string'
        ]);

        $user = auth('api')->user();


        try {
            DB::beginTransaction();

            // Buscar a compra para debug
            $compra = SolCompraModel::where('cod_compra', $request->cod_compra)->first();

            if (!$compra) {
                return response()->json(['error' => 'Compra não encontrada'], 404);
            }

            // Pegar a justificativa corretamente
            $justificativa = $request->input('justificativa_checado');

            // Se veio como '1' ou 1, é porque não veio o texto correto
            if ($justificativa === '1' || $justificativa === 1) {
                $justificativa = null;
            }

            // Preparar os dados para atualização
            $dadosAtualizacao = [
                'checado' => 1,
                'justificativa_checado' => $justificativa,
                'matricula_checado' => (string) ($user->matricula ?? $user->id),
                'data_checado' => now()
            ];


            // Atualizar
            $atualizados = SolCompraModel::where('cod_compra', $request->cod_compra)
                ->update($dadosAtualizacao);

            // Buscar os dados atualizados para confirmar
            $compraAtualizada = SolCompraModel::where('cod_compra', $request->cod_compra)->first();


            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Compra marcada como checada com sucesso',
                'quantidade' => $atualizados,
                'cod_compra' => $request->cod_compra,
                'justificativa_salva' => $justificativa,
                'matricula_salva' => $user->matricula ?? $user->id,
                'data_salva' => now()->toDateTimeString()
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'error' => 'Erro ao marcar itens como checados',
                'debug_message' => $e->getMessage()
            ], 500);
        }
    }

    public function update_produto(Request $request)
    {
        // A validação do token e dos campos permanece a mesma
        $token = $request->header('Authorization');
        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $request->validate([
            'id' => 'required|integer',
            'quantidade' => 'required|numeric|min:1',
            'justificativa_edicao' => 'required|string|min:1',
        ]);

        $user = auth('api')->user();

        try {
            DB::beginTransaction();

            $solicitacao = SolCompraModel::find($request->id);

            if (!$solicitacao) {
                DB::rollBack();
                return response()->json(['error' => 'Solicitação não encontrada'], 404);
            }

            $quantidadeAntiga = $solicitacao->quantidade;

            $solicitacao->quantidade = $request->quantidade;
            $solicitacao->justificativa_edicao = $request->justificativa_edicao;
            $solicitacao->save();

            $historico = new HistoricoCompraModel();
            $historico->sol_compra_id = $solicitacao->id;
            $historico->matricula = $user->matricula;
            $historico->quantidade_antiga = $quantidadeAntiga;
            $historico->quantidade_nova = $request->quantidade;
            $historico->justificativa = $request->justificativa_edicao;
            $historico->data = now();
            $historico->save();

            DB::commit();

            return response()->json(['message' => 'Solicitação atualizada com sucesso', 'data' => $solicitacao], 200);

        } catch (\Exception $e) {
            DB::rollBack();

            // Adicione esta linha para registrar o erro detalhado nos logs do Laravel
            // Você pode encontrar os logs em: storage/logs/laravel.log
            \Log::error($e->getMessage() . ' on line ' . $e->getLine() . ' in ' . $e->getFile());

            // Retorne a mensagem de erro real na resposta JSON (APENAS EM AMBIENTE DE DESENVOLVIMENTO)
            return response()->json([
                'error' => 'Ocorreu um erro ao atualizar a solicitação.',
                'debug_message' => $e->getMessage() // <-- A MENSAGEM DO ERRO!
            ], 500);
        }
    }
    public function destroy_item(Request $request, $id)
    {
        $token = $request->header('Authorization');
        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $request->validate([
            'justificativa_remocao' => 'required|string|min:1',
        ]);

        $user = auth('api')->user();

        try {
            DB::beginTransaction();

            $solicitacao = SolCompraModel::find($id);

            if (!$solicitacao) {
                DB::rollBack();
                return response()->json(['error' => 'Item não encontrado'], 404);
            }

            // Deleta o item
            $solicitacao->delete();

            DB::commit();

            return response()->json([
                'message' => 'Item removido com sucesso'
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erro ao remover item: ' . $e->getMessage());

            return response()->json([
                'error' => 'Erro ao remover item',
                'debug_message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ADICIONAR MÚLTIPLOS ITENS
     * POST /aprovarcompra/detalhescompra/lista
     */
    public function adicionar_itens(Request $request)
    {
        $token = $request->header('Authorization');
        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $request->validate([
            'itens' => 'required|array|min:1',
            'itens.*.cod_compra' => 'required|string',
            'itens.*.cod_material' => 'required|string',
            'itens.*.quantidade' => 'required|numeric|min:1',
        ]);

        $user = auth('api')->user();
        $itensAdicionados = [];

        try {
            DB::beginTransaction();

            foreach ($request->itens as $item) {
                // Busca a compra existente para pegar dados padrão
                $compraExistente = SolCompraModel::where('cod_compra', $item['cod_compra'])->first();

                if (!$compraExistente) {
                    throw new \Exception("Compra {$item['cod_compra']} não encontrada");
                }

                // Cria novo item com os mesmos dados base da compra
                $novoItem = new SolCompraModel();
                $novoItem->cod_compra = $item['cod_compra'];
                $novoItem->cod_material = $item['cod_material'];
                $novoItem->quantidade = $item['quantidade'];
                $novoItem->solicitante = $compraExistente->solicitante;
                $novoItem->filial_id = $compraExistente->filial_id;
                $novoItem->data_solicitacao = $compraExistente->data_solicitacao;
                $novoItem->save();

                $itensAdicionados[] = $novoItem;
            }

            DB::commit();

            return response()->json([
                'message' => count($itensAdicionados) . ' item(ns) adicionado(s) com sucesso',
                'data' => $itensAdicionados,
                'itens' => $itensAdicionados
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erro ao adicionar itens: ' . $e->getMessage());

            return response()->json([
                'error' => 'Erro ao adicionar itens',
                'debug_message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ADICIONAR ITEM ÚNICO
     * POST /aprovarcompra/detalhescompra
     */
    public function adicionar_item(Request $request)
    {
        $token = $request->header('Authorization');
        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $request->validate([
            'cod_compra' => 'required|string',
            'cod_material' => 'required|string',
            'quantidade' => 'required|numeric|min:1',
        ]);

        $user = auth('api')->user();

        try {
            DB::beginTransaction();

            // Busca dados da compra existente
            $compraExistente = SolCompraModel::where('cod_compra', $request->cod_compra)->first();

            if (!$compraExistente) {
                DB::rollBack();
                return response()->json(['error' => 'Compra não encontrada'], 404);
            }

            // Cria novo item
            $novoItem = new SolCompraModel();
            $novoItem->cod_compra = $request->cod_compra;
            $novoItem->cod_material = $request->cod_material;
            $novoItem->quantidade = $request->quantidade;
            $novoItem->solicitante = $compraExistente->solicitante;
            $novoItem->filial_id = $compraExistente->filial_id;
            $novoItem->data_solicitacao = $compraExistente->data_solicitacao;
            $novoItem->save();

            DB::commit();

            return response()->json([
                'message' => 'Item adicionado com sucesso',
                'data' => $novoItem,
                'item' => $novoItem
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erro ao adicionar item: ' . $e->getMessage());

            return response()->json([
                'error' => 'Erro ao adicionar item',
                'debug_message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ATUALIZAR ITEM (editar) - SEU CÓDIGO EXISTENTE
     */


    public function itens_agrupados(Request $request)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $cod_material = $request->input('cod_material');

        if (!$cod_material) {
            return response()->json(['error' => 'Código do material não fornecido'], 400);
        }

        $user = auth('api')->user();

        if (!isset($user->compras)) {
            return response()->json(['error' => 'Permissão inválida para atualizar solicitações'], 403);
        }

        $query = DB::connection('DBCompra')->table('tbsol_compra')
            ->select(
                'cod_compra',
                'cod_material',
                'quantidade',
                DB::raw('SUM(quantidade) OVER (PARTITION BY cod_material) as total_quantidade'),
                'cod_cotacao',
                'aceite_diretor'
            )
            ->where('cod_material', $cod_material);

        switch ($user->compras) {
            case 2:
                $query->where(function ($q) use ($user) {
                    $q->whereNull('aceite_material');
                });
                break;
            case 3:
                $query->where(function ($q) {
                    $q->whereNotNull('aceite_material')
                        ->where('aceite_material', '!=', '0')
                        ->whereNull('aceite_compra');
                });
                break;
            case 4:
                $query->where(function ($q) use ($user) {
                    $q->where(function ($sub) {
                        $sub->whereNotNull('aceite_compra')
                            ->where('aceite_compra', '!=', '0')
                            ->whereNull('aceite_diretor');
                    })
                        ->orWhere('status', '=', (string) $user->compras);
                });
                break;
            case 5:
                $query->where(function ($q) use ($user) {
                    $q->where(function ($sub) {
                        $sub->whereNotNull('aceite_compra')
                            ->where('aceite_compra', '!=', '0')
                            ->whereNull('aceite_diretor');
                    })
                        ->orWhere('status', '=', (string) $user->compras);
                });
                break;
            case 6:
                $query->where(function ($q) use ($user) {
                    $q->where(function ($sub) {
                        $sub->whereNotNull('aceite_compra')
                            ->where('aceite_compra', '!=', '0')
                            ->whereNull('aceite_diretor');
                    })
                        ->orWhere('status', '=', (string) $user->compras);
                });
                break;
            default:
                // Nenhuma filtragem por matrícula, mantém todas
                break;
        }

        $solicitacoes = $query->get();

        return response()->json(['data' => $solicitacoes], 200);
    }

    public function minhas_solicitacoes(Request $request)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $user = auth('api')->user();

        if (!isset($user->compras)) {
            return response()->json(['error' => 'Permissão inválida para atualizar solicitações'], 403);
        }

        // 🔹 Subquery unindo as duas tabelas de materiais
        $materiaisUnion = DB::connection('DBCompra')->table('tb_material as m1')
            ->select('codmat', 'descricao')
            ->unionAll(
                DB::connection('DBCompra')->table('tbmaterial_aniel as m2')
                    ->select('codmat', 'descricao')
            );

        $query = DB::connection('DBCompra')->table('tbsol_compra as sc')
            ->join('bdffa.tbfuncionario as f', 'sc.solicitante', '=', 'f.matricula')
            ->leftJoin('bdffa.tbfilial as fil', 'sc.filial_id', '=', 'fil.idtbfilial')
            ->joinSub($materiaisUnion, 'm', function ($join) {
                $join->on('sc.cod_material', '=', 'm.codmat');
            })
            ->select(
                'sc.cod_compra as Cod. Compra',
                DB::raw('DATE_FORMAT(MIN(sc.data_solicitacao), "%d/%m/%Y") AS "Data da Solicitação"'),
                DB::raw('GROUP_CONCAT(DISTINCT f.nome) as Solicitante'),
                DB::raw('GROUP_CONCAT(DISTINCT m.descricao) as descrição'),
                DB::raw('MAX(justificativa_solicitante) as justificativa_solicitante'),
                DB::raw('MAX(aceite_material) as aceite_material'),
                DB::raw('MAX(aceite_compra) as aceite_compra'),
                DB::raw('MAX(aceite_diretor) as aceite_diretor'),
                DB::raw('MAX(entregue) as entregue'),
                DB::raw('MAX(finalizado) as finalizado'),
                DB::raw('MAX(sc.status) as status'),
                DB::raw('ANY_VALUE(fil.descricao) as Filial')
            )
            ->where('sc.solicitante', '=', $user->matricula)
            ->groupBy('sc.cod_compra')
            ->orderBy('sc.cod_compra', 'asc')
            ->get();

        return response()->json($query, 200);
    }

    public function cancelar_compra(Request $request, $cod_compra)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $user = auth('api')->user();

        if (!isset($user->compras)) {
            return response()->json(['error' => 'Permissão inválida para atualizar solicitações'], 403);
        }

        try {
            DB::connection('DBCompra')->table('tbsol_compra')
                ->where('cod_compra', $cod_compra)
                ->update([
                    'status' => 0,
                    'visivel' => 0
                ]);

            DB::connection('DBCompra')->table('tbaux_cancelamento')->insert([
                'cod_compra' => $cod_compra,
                'matricula' => $user->matricula,
                'data_cancelamento' => now(),
            ]);

            return response()->json(['message' => 'Solicitação cancelada com sucesso.']);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Erro ao cancelar solicitação: ' . $e->getMessage()], 500);
        }
    }


    public function retornar_processo(Request $request)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $user = auth('api')->user();

        if (!isset($user->compras)) {
            return response()->json(['error' => 'Permissão inválida para atualizar solicitações'], 403);
        }

        // Validação de campos obrigatórios
        $request->validate([
            'cod_compra' => 'required|string',
            'setor_destino' => 'required|integer',
            'justificativa' => 'required|string',
        ]);

        try {
            DB::beginTransaction();

            $codCompra = $request->input('cod_compra');
            $setorDestino = $request->input('setor_destino');
            $justificativa = $request->input('justificativa');

            // Verifica se existe pelo menos uma solicitação com esse cod_compra
            $solicitacaoExistente = DB::connection('DBCompra')->table('tbsol_compra')
                ->where('cod_compra', $codCompra)
                ->exists();

            if (!$solicitacaoExistente) {
                return response()->json(['error' => 'Código de compra não encontrado'], 404);
            }

            // Busca as solicitações para enviar no email
            $solicitacoes = DB::connection('DBCompra')->table('tbsol_compra')
                ->where('cod_compra', $codCompra)
                ->get();

            DB::connection('DBCompra')->table('tbsol_compra')
                ->where('cod_compra', $codCompra)
                ->update([
                    'visivel' => 0,
                    'status' => $setorDestino,
                ]);

            DB::connection('DBCompra')->table('tbaux_retorno_processo')->insert([
                'cod_compra' => $codCompra,
                'setor_origem' => $user->compras,
                'setor_destino' => $setorDestino,
                'justificativa_origem' => $justificativa,
                'matricula_origem' => $user->matricula,
                'data_retorno' => now()
            ]);

            DB::commit();

            // ===== ENVIO DE EMAIL PARA O SETOR DE DESTINO =====

            // Mapeamento dos setores para níveis de aprovação
            $nomesSetores = [
                1 => 'material',
                2 => 'compra',
                3 => 'diretor',
                4 => 'gerente'
            ];

            $tipoSetor = $nomesSetores[$setorDestino] ?? 'desconhecido';
            $destinatarios = [];

            // Busca destinatários baseado no setor de destino (sem centro de custo)
            switch ($setorDestino) {
                case 1: // Material (nível 2)
                    $destinatarios = DB::table('bdfrota.tbusuario')
                        ->where('compras', 2)
                        ->whereNotNull('email')
                        ->pluck('email')
                        ->toArray();
                    break;

                case 2: // Compra (nível 3)
                    $destinatarios = DB::table('bdfrota.tbusuario')
                        ->where('compras', 3)
                        ->whereNotNull('email')
                        ->pluck('email')
                        ->toArray();
                    break;

                case 3: // Diretor (níveis 4,5,6)
                    $destinatarios = DB::table('bdfrota.tbusuario')
                        ->whereIn('compras', [4, 5, 6])
                        ->whereNotNull('email')
                        ->pluck('email')
                        ->toArray();
                    break;

                case 4: // Gerente (nível 7)
                    $destinatarios = DB::table('bdfrota.tbusuario')
                        ->where('compras', 7)
                        ->whereNotNull('email')
                        ->pluck('email')
                        ->toArray();
                    break;

                default:
                    $destinatarios = [];
                    break;
            }

            // Remove emails vazios e duplicados
            $destinatarios = array_filter(array_unique($destinatarios));

            // Log para debug
            \Log::info('Retorno de processo - envio de email:', [
                'setor_origem' => $user->compras,
                'setor_destino' => $setorDestino,
                'tipo_setor' => $tipoSetor,
                'destinatarios' => $destinatarios,
                'cod_compra' => $codCompra
            ]);

            // Envia os emails
            if (!empty($destinatarios)) {
                // Cria um objeto de usuário para o aprovador (origem)
                $aprovadorOrigem = (object) [
                    'matricula' => $user->matricula,
                    'nome' => $user->nome ?? 'Aprovador',
                    'compras' => $user->compras
                ];

                foreach ($destinatarios as $email) {
                    try {
                        if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
                            Mail::to($email)->send(new \App\Mail\RetornoProcessoMail(
                                $solicitacoes,
                                $aprovadorOrigem,
                                $tipoSetor,
                                $justificativa,
                                'retornado'
                            ));

                            \Log::info('Email de retorno enviado para: ' . $email);
                        }
                    } catch (\Exception $e) {
                        \Log::error('Erro ao enviar email de retorno:', [
                            'email' => $email,
                            'error' => $e->getMessage()
                        ]);
                    }
                }
            } else {
                \Log::warning('Nenhum destinatário encontrado para o setor de destino: ' . $setorDestino);
            }

            return response()->json([
                'message' => 'Processo retornado com sucesso',
                'cod_compra' => $codCompra,
                'setor_destino' => $setorDestino,
                'destinatarios' => $destinatarios
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Erro ao retornar processo', 'message' => $e->getMessage()], 500);
        }
    }

    public function listar_retorno(Request $request, $cod_compra)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $user = auth('api')->user();

        // Verificação corrigida - agora o campo compras existe
        if (!$user || !isset($user->compras)) {
            return response()->json(['error' => 'Permissão inválida para atualizar solicitações'], 403);
        }

        $resultado = DB::connection('DBCompra')
            ->table('tbaux_retorno_processo as rp')
            ->join('bdffa.tbfuncionario as fo', 'rp.matricula_origem', '=', 'fo.matricula')
            ->leftJoin('bdffa.tbfuncionario as fd', 'rp.matricula_destino', '=', 'fd.matricula')
            ->select(
                'rp.matricula_origem',
                'rp.matricula_destino',
                'rp.justificativa_origem',
                'rp.resposta_destino',
                'fo.nome as nome_origem',
                'fd.nome as nome_destino',
                'rp.setor_origem',
                'rp.setor_destino',
                'rp.cod_compra'
            )
            ->where('rp.cod_compra', $cod_compra)
            ->where(function ($q) use ($user) {
                $q->where('rp.setor_destino', $user->compras)
                    ->orWhere('rp.setor_origem', $user->compras);
            })
            ->orderBy('rp.id', 'desc')
            ->limit(1)
            ->get();

        // Mudar status de 201 para 200 (mais apropriado para GET)
        return response()->json($resultado, 200);
    }


    public function finalizar_retorno(Request $request)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $user = auth('api')->user();

        if (!isset($user->compras)) {
            return response()->json(['error' => 'Permissão inválida'], 403);
        }

        // Validação dos campos
        $request->validate([
            'justificativa' => 'required|string',
            'cod_compra' => 'required|string'
        ]);

        try {
            DB::beginTransaction();

            $resposta = $request->input('resposta');
            $codCompra = $request->input('cod_compra');

            // Busca o registro do retorno
            $retorno = DB::connection('DBCompra')
                ->table('tbaux_retorno_processo')
                ->where('cod_compra', $codCompra)
                ->first();

            if (!$retorno) {
                return response()->json(['error' => 'Registro de retorno não encontrado'], 404);
            }

            // Atualiza com a resposta
            DB::connection('DBCompra')
                ->table('tbaux_retorno_processo')
                ->where('cod_compra', $codCompra)
                ->update([
                    'resposta_destino' => $resposta,
                    'matricula_destino' => $user->matricula,
                    'data_resposta' => now()
                ]);

            // CORREÇÃO AQUI: Reativa as solicitações
            DB::connection('DBCompra')
                ->table('tbsol_compra')
                ->where('cod_compra', $codCompra)
                ->update([
                    'visivel' => 1,     // Torna visível novamente
                    'status' => null     // Limpa o status (volta ao fluxo normal)
                ]);

            DB::commit();

            // ===== ENVIO DE EMAIL PARA QUEM FEZ O RETORNO =====

            // Busca as solicitações para enviar no email
            $solicitacoes = DB::connection('DBCompra')
                ->table('tbsol_compra')
                ->where('cod_compra', $codCompra)
                ->get();

            // Busca email da pessoa que fez o retorno original (matricula_origem)
            $usuarioOrigem = DB::table('bdfrota.tbusuario')
                ->where('matricula', $retorno->matricula_origem)
                ->whereNotNull('email')
                ->first();

            // Mapeamento dos setores
            $nomesSetores = [
                1 => 'material',
                2 => 'compra',
                3 => 'diretor',
                4 => 'gerente'
            ];

            $tipoSetorOrigem = $nomesSetores[$retorno->setor_origem] ?? 'desconhecido';

            if ($usuarioOrigem && !empty($usuarioOrigem->email)) {
                try {
                    // Cria objeto do respondedor
                    $respondedor = (object) [
                        'matricula' => $user->matricula,
                        'nome' => $user->nome ?? 'Respondedor',
                        'compras' => $user->compras
                    ];

                    // Cria objeto do solicitante original
                    $solicitanteOriginal = (object) [
                        'matricula' => $retorno->matricula_origem,
                        'nome' => $usuarioOrigem->nome ?? 'Usuário',
                        'email' => $usuarioOrigem->email
                    ];

                    Mail::to($usuarioOrigem->email)->send(new \App\Mail\RespostaRetornoMail(
                        $solicitacoes,
                        $respondedor,
                        $solicitanteOriginal,
                        $tipoSetorOrigem,
                        $resposta,
                        $retorno->justificativa_origem
                    ));

                    \Log::info('Email de resposta enviado para: ' . $usuarioOrigem->email, [
                        'cod_compra' => $codCompra,
                        'matricula_origem' => $retorno->matricula_origem
                    ]);

                } catch (\Exception $e) {
                    \Log::error('Erro ao enviar email de resposta:', [
                        'email' => $usuarioOrigem->email,
                        'error' => $e->getMessage()
                    ]);
                }
            } else {
                \Log::warning('Usuário origem não encontrado ou sem email:', [
                    'matricula_origem' => $retorno->matricula_origem
                ]);
            }

            return response()->json([
                'message' => 'Resposta enviada com sucesso',
                'cod_compra' => $codCompra,
                'email_enviado' => $usuarioOrigem->email ?? null
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Erro ao responder retorno',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function historico_solicitacao(Request $request, $cod_compra)
    {
        $token = $request->header('Authorization');
        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        try {
            // 1. Verificar se a compra informada existe
            $solicitacao = SolCompraModel::where('cod_compra', $cod_compra)->first();

            if (!$solicitacao) {
                return response()->json(['error' => 'Solicitação não encontrada'], 404);
            }

            // 2. Verificar se esta compra é a PRINCIPAL de um agrupamento
            $agrupamento = DB::connection('DBCompra')
                ->table('tb_agrupamento_cotacoes')
                ->where('cod_cotacao_agrupada', $cod_compra)
                ->first();

            // 3. Se for uma compra principal, gerar histórico múltiplo para o frontend
            if ($agrupamento) {
                $comprasOrigem = json_decode($agrupamento->compras_origem, true) ?? [];
                $historicosAgrupados = [];

                // Adiciona o histórico de cada compra de origem (as que "perderam" itens)
                foreach ($comprasOrigem as $codOrigem) {
                    $historicosAgrupados[] = [
                        'cod_compra' => $codOrigem,
                        'historico' => $this->gerarHistoricoParaCompra($codOrigem)
                    ];
                }

                // Adiciona por último o histórico da compra atual (a Principal)
                $historicosAgrupados[] = [
                    'cod_compra' => $cod_compra,
                    'historico' => $this->gerarHistoricoParaCompra($cod_compra)
                ];

                return response()->json($historicosAgrupados);
            }

            // 4. Se não for agrupada (ou for uma compra de origem individual), retorna o formato simples
            // O seu frontend detecta se é array de eventos ou array de objetos de histórico.
            return response()->json($this->gerarHistoricoParaCompra($cod_compra));

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao buscar histórico: ' . $e->getMessage()
            ], 500);
        }
    }

    // Extrai toda a lógica de geração em um método separado
    private function gerarHistoricoParaCompra(string $cod_compra): array
    {
        $solicitacao = SolCompraModel::where('cod_compra', $cod_compra)->first();
        if (!$solicitacao)
            return [];

        $historyEvents = [];
        $matriculasMap = [];

        // --- Informações da Filial (SEMPRE PRIMEIRO) ---
        $dadosCompra = DB::connection('DBCompra')->table('tbsol_compra')->where('cod_compra', $cod_compra)->first();
        if ($dadosCompra && $dadosCompra->filial_id) {
            $filial = DB::connection('DBCompra')->table('bdffa.tbfilial')->where('idtbfilial', $dadosCompra->filial_id)->first();
            $historyEvents[] = [
                'tipo' => 'Filial',
                'etapa' => 'Filial Responsável',
                'data' => null,
                'responsavel_matricula' => null,
                'filial_nome' => $filial->descricao ?? 'N/A',
                'detalhes' => "Filial: " . ($filial->descricao ?? 'N/A')
            ];
        }

        // --- Evento de Agrupamento (Se houver) ---
        $infoAgrup = $this->buscarInformacoesAgrupamento($cod_compra);
        if ($infoAgrup['is_agrupado']) {
            $historyEvents[] = [
                'tipo' => 'Agrupamento',
                'etapa' => $infoAgrup['is_compra_principal'] ? 'Recebeu itens agrupados' : 'Itens movidos para outra cotação',
                'data' => $infoAgrup['data_agrupamento'],
                'responsavel_matricula' => $infoAgrup['responsavel'],
                'detalhes' => $infoAgrup['detalhes']
            ];
            $matriculasMap[$infoAgrup['responsavel']] = $infoAgrup['responsavel'];
        }

        // --- Eventos de Remoção de Materiais ---
        $materiaisRemovidos = DB::connection('DBCompra')
            ->table('tbaux_remocao_material')
            ->where('cod_compra', $cod_compra)
            ->orderBy('data', 'asc')
            ->get();

        foreach ($materiaisRemovidos as $remocao) {
            // Verifica se a justificativa existe e não está vazia
            $justificativa = !empty($remocao->justificativa_remocao)
                ? $remocao->justificativa_remocao
                : 'Não informada';

            // Monta o detalhe de forma mais clara
            $detalhes = "Código do material: {$remocao->cod_material}\nJustificativa: {$justificativa}";

            $historyEvents[] = [
                'tipo' => 'Remoção de Material',
                'etapa' => 'Item Removido',
                'data' => $remocao->data,
                'responsavel_matricula' => $remocao->matricula,
                'detalhes' => $detalhes,
                'cod_material' => $remocao->cod_material,
                'justificativa' => $justificativa
            ];
            $matriculasMap[$remocao->matricula] = $remocao->matricula;
        }

        // --- Etapas de Aprovação Padrão ---
        $stages = [
            ['d' => 'data_solicitacao', 'm' => 'solicitante', 't' => 'Criação', 'j' => 'justificativa_solicitante'],
            ['d' => 'data_gerente', 'm' => 'matricula_gerente', 't' => 'Gerente', 'j' => 'justificativa_gerente', 'a' => 'aceite_gerente'],
            ['d' => 'data_checado', 'm' => 'matricula_checado', 't' => 'Checado', 'j' => 'justificativa_checado'],
            ['d' => 'data_material', 'm' => 'matricula_material', 't' => 'Material', 'j' => 'justificativa_material', 'a' => 'aceite_material'],
            ['d' => 'data_compra', 'm' => 'matricula_compra', 't' => 'Compras', 'j' => 'justificativa_compra', 'a' => 'aceite_compra'],
            ['d' => 'data_diretor', 'm' => 'matricula_diretor', 't' => 'Aprovadores', 'j' => 'justificativa_diretor', 'a' => 'aceite_diretor'],
            ['d' => 'data_finalizado', 'm' => 'matricula_finalizado', 't' => 'Finalizado', 'j' => 'justificativa_cfo', 'a' => 'finalizado']
        ];

        foreach ($stages as $s) {
            if (!empty($solicitacao->{$s['d']})) {
                $status = "";
                $detalhes = $solicitacao->{$s['j']} ?? null;

                // Verifica se é o estágio de finalizado
                if ($s['t'] === 'Finalizado') {
                    $status = "Material Comprado";

                    // Adiciona a data prevista na justificativa
                    $dataPrevista = $solicitacao->justificativa_cfo ?? null;
                    if ($dataPrevista && $dataPrevista != '0000-00-00') {
                        $dataPrevistaFormatada = date('d/m/Y', strtotime($dataPrevista));
                        $detalhes = "Data prevista da compra: " . $dataPrevistaFormatada;
                    } else {
                        if (!empty($solicitacao->{$s['j']}) && $solicitacao->{$s['j']} != '0000-00-00') {
                            $detalhes = "Data prevista não informada - Justificativa: " . $solicitacao->{$s['j']};
                        } else {
                            $detalhes = "Data prevista não informada";
                        }
                    }
                } else {
                    // Para outros estágios, mantém o comportamento original
                    if (isset($s['a'])) {
                        $status = ($solicitacao->{$s['a']} == 1) ? "Aprovado" : "Recusado";
                    }
                }

                $evento = [
                    'tipo' => $s['t'],
                    'etapa' => $status,
                    'data' => $solicitacao->{$s['d']},
                    'responsavel_matricula' => $solicitacao->{$s['m']},
                    'detalhes' => $detalhes
                ];

                // Adiciona o status em campos separados se existir
                if ($status) {
                    $evento['status'] = $status;
                }

                $historyEvents[] = $evento;
                $matriculasMap[$solicitacao->{$s['m']}] = $solicitacao->{$s['m']};
            }
        }

        // --- Tradução de Matrículas para Nomes ---
        if (!empty($matriculasMap)) {
            $usuarios = DB::connection('DBCompra')->table('bdfrota.tbusuario')
                ->whereIn('matricula', array_keys($matriculasMap))
                ->get()->keyBy('matricula');

            foreach ($historyEvents as &$ev) {
                if (isset($ev['responsavel_matricula']) && !empty($ev['responsavel_matricula'])) {
                    if (isset($usuarios[$ev['responsavel_matricula']])) {
                        $ev['responsavel_nome'] = $usuarios[$ev['responsavel_matricula']]->nome;
                    } else {
                        $ev['responsavel_nome'] = $ev['responsavel_matricula'];
                    }
                }
            }
        }

        // Ordenação (mantém a filial no início, sem data)
        usort($historyEvents, function ($a, $b) {
            // Garante que o evento da Filial fique sempre no início
            if ($a['tipo'] === 'Filial')
                return -1;
            if ($b['tipo'] === 'Filial')
                return 1;

            // Eventos sem data vão para o final
            if (!$a['data'] && !$b['data'])
                return 0;
            if (!$a['data'])
                return 1;
            if (!$b['data'])
                return -1;

            // Converte para timestamp para comparação
            $timeA = strtotime($a['data']);
            $timeB = strtotime($b['data']);

            if ($timeA === $timeB)
                return 0;
            return $timeA - $timeB;
        });

        return $historyEvents;
    }
    private function buscarInformacoesAgrupamento(string $cod_compra, ?string $cod_cotacao_buscada = null): array
    {
        // Estrutura inicial com todas as chaves que o seu código original tenta acessar
        $resultado = [
            'is_agrupado' => false,
            'is_compra_principal' => false,
            'foi_agrupada_em' => null,
            'cod_cotacao_agrupado' => null,
            'compras_agrupadas' => [],
            'materiais_agrupados' => [],
            'itens_agrupados' => [],
            'itens_detalhados' => [],
            'data_agrupamento' => null,
            'responsavel' => null,
            'detalhes' => '',
            'detalhes_completos' => [] // CHAVE QUE ESTAVA FALTANDO
        ];

        // Busca na tabela de agrupamento se a compra é a principal ou se está no JSON de origens
        $agrupamentoInfo = DB::connection('DBCompra')
            ->table('tb_agrupamento_cotacoes')
            ->where('cod_cotacao_agrupada', $cod_compra)
            ->orWhereRaw("JSON_CONTAINS(compras_origem, CAST('\"$cod_compra\"' AS JSON))")
            ->first();

        if (!$agrupamentoInfo) {
            return $resultado;
        }

        $resultado['is_agrupado'] = true;
        $resultado['cod_cotacao_agrupado'] = $agrupamentoInfo->cod_cotacao_agrupada;
        $resultado['data_agrupamento'] = Carbon::parse($agrupamentoInfo->data_agrupamento)->format('Y-m-d H:i:s');
        $resultado['responsavel'] = $agrupamentoInfo->usuario ?? 'Sistema';

        // Decodifica os JSONs da tabela
        $comprasOrigem = json_decode($agrupamentoInfo->compras_origem, true) ?? [];
        $itensTodos = json_decode($agrupamentoInfo->itens_agrupados, true) ?? [];

        $resultado['compras_agrupadas'] = $comprasOrigem;
        $resultado['itens_agrupados'] = $itensTodos;

        // Verifica se esta compra é a que recebeu os itens (Principal)
        if ($agrupamentoInfo->cod_cotacao_agrupada === $cod_compra) {
            $resultado['is_compra_principal'] = true;

            // $detalhes = "📦 AGRUP\n";
            $detalhes = "Recebeu itens das compras: " . implode(', ', $comprasOrigem) . "\n\n";
            $detalhes .= "📋 **ITENS INCORPORADOS:**\n";
            foreach ($itensTodos as $it) {
                $detalhes .= "- {$it['quantidade']} UN de {$it['descricao']} (Vindo de: {$it['cod_compra_origem']})\n";
            }

            $resultado['detalhes'] = $detalhes;
            $resultado['detalhes_completos'] = [
                'tipo' => 'Principal',
                'origens' => $comprasOrigem,
                'itens' => $itensTodos
            ];
        }
        // Caso contrário, ela é uma das compras que "perdeu" itens para o grupo
        else {
            $resultado['is_compra_principal'] = false;
            $resultado['foi_agrupada_em'] = $agrupamentoInfo->cod_cotacao_agrupada;

            // Filtra apenas o que saiu DESTA compra específica
            $itensSairam = array_values(array_filter($itensTodos, function ($i) use ($cod_compra) {
                return ($i['cod_compra_origem'] ?? '') === $cod_compra;
            }));

            $detalhes = "📤 ALGUNS ITENS DESTA COMPRA FORAM AGRUPADOS\n";
            $detalhes .= "Os itens a seguir foram transferidos para a cotação: **{$agrupamentoInfo->cod_cotacao_agrupada}**\n\n";
            $detalhes .= "📋 **ITENS TRANSFERIDOS:**\n";
            foreach ($itensSairam as $it) {
                $detalhes .= "- {$it['quantidade']} UN de {$it['descricao']}\n";
            }

            $resultado['detalhes'] = $detalhes;
            $resultado['itens_detalhados'] = $itensSairam;
            $resultado['detalhes_completos'] = [
                'tipo' => 'Origem',
                'destino' => $agrupamentoInfo->cod_cotacao_agrupada,
                'itens_transferidos' => $itensSairam
            ];
        }

        return $resultado;
    }
    /**
     * Busca APENAS os itens específicos que foram agrupados
     */
    private function buscarItensAgrupadosEspecificos(array $comprasOrigem, array $materiaisAgrupados): array
    {
        $itensDetalhados = [];

        if (empty($comprasOrigem) || empty($materiaisAgrupados)) {
            return $itensDetalhados;
        }

        try {
            // Buscar apenas os itens que correspondem aos materiais agrupados
            $todosItens = DB::connection('DBCompra')->table('tbsol_compra as sc')
                ->leftJoin('tb_material as m', 'sc.cod_material', '=', 'm.codmat')
                ->whereIn('sc.cod_compra', $comprasOrigem)
                ->whereIn('sc.cod_material', $materiaisAgrupados) // Filtro importante!
                ->select(
                    'sc.cod_compra',
                    'sc.cod_material',
                    'sc.quantidade',
                    'm.descricao as descricao_material',
                    'm.unid'
                )
                ->get();

            // Se não encontrou na tb_material, buscar na tbmaterial_aniel
            if ($todosItens->isEmpty()) {
                $todosItens = DB::connection('DBCompra')->table('tbsol_compra as sc')
                    ->leftJoin('tbmaterial_aniel as m', 'sc.cod_material', '=', 'm.codmat')
                    ->whereIn('sc.cod_compra', $comprasOrigem)
                    ->whereIn('sc.cod_material', $materiaisAgrupados) // Filtro importante!
                    ->select(
                        'sc.cod_compra',
                        'sc.cod_material',
                        'sc.quantidade',
                        'm.descricao as descricao_material',
                        'm.unid'
                    )
                    ->get();
            }

            // Agrupar por material
            $itensPorMaterial = [];
            foreach ($todosItens as $item) {
                $key = $item->cod_material;

                if (!isset($itensPorMaterial[$key])) {
                    $itensPorMaterial[$key] = [
                        'cod_material' => $item->cod_material,
                        'descricao' => $item->descricao_material ?? 'Material não encontrado',
                        'unidade' => $item->unid ?? 'UN',
                        'quantidade_total' => 0,
                        'solicitacoes_origem' => []
                    ];
                }

                $itensPorMaterial[$key]['quantidade_total'] += $item->quantidade;
                $itensPorMaterial[$key]['solicitacoes_origem'][] = [
                    'cod_compra' => $item->cod_compra,
                    'quantidade' => $item->quantidade
                ];
            }

            $itensDetalhados = array_values($itensPorMaterial);

        } catch (\Exception $e) {
            \Log::error('Erro ao buscar itens agrupados específicos: ' . $e->getMessage());
        }

        return $itensDetalhados;
    }


    private function buscarItensDetalhadosAgrupamento(array $comprasOrigem): array
    {
        $itensDetalhados = [];

        if (empty($comprasOrigem)) {
            return $itensDetalhados;
        }

        try {
            // Buscar todos os itens das compras agrupadas
            $todosItens = DB::connection('DBCompra')->table('tbsol_compra as sc')
                ->leftJoin('tb_material as m', 'sc.cod_material', '=', 'm.codmat')
                ->whereIn('sc.cod_compra', $comprasOrigem)
                ->select(
                    'sc.cod_compra',
                    'sc.cod_material',
                    'sc.quantidade',
                    'm.descricao as descricao_material',
                    'm.unid'
                )
                ->get();

            // Se não encontrou na tb_material, buscar na tbmaterial_aniel
            if ($todosItens->isEmpty()) {
                $todosItens = DB::connection('DBCompra')->table('tbsol_compra as sc')
                    ->leftJoin('tbmaterial_aniel as m', 'sc.cod_material', '=', 'm.codmat')
                    ->whereIn('sc.cod_compra', $comprasOrigem)
                    ->select(
                        'sc.cod_compra',
                        'sc.cod_material',
                        'sc.quantidade',
                        'm.descricao as descricao_material',
                        'm.unid'
                    )
                    ->get();
            }

            // Agrupar por material para mostrar itens duplicados
            foreach ($todosItens as $item) {
                $key = $item->cod_material;

                if (!isset($itensDetalhados[$key])) {
                    $itensDetalhados[$key] = [
                        'cod_material' => $item->cod_material,
                        'descricao' => $item->descricao_material ?? 'Material não encontrado',
                        'unidade' => $item->unid ?? 'UN',
                        'quantidade_total' => 0,
                        'solicitacoes_origem' => []
                    ];
                }

                $itensDetalhados[$key]['quantidade_total'] += $item->quantidade;
                $itensDetalhados[$key]['solicitacoes_origem'][] = [
                    'cod_compra' => $item->cod_compra,
                    'quantidade' => $item->quantidade
                ];
            }

            // Converter para array indexado
            $itensDetalhados = array_values($itensDetalhados);

        } catch (\Exception $e) {
            \Log::error('Erro ao buscar itens detalhados: ' . $e->getMessage());
        }

        return $itensDetalhados;
    }

    /**
     * Busca descrição do material
     */
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
     * Busca itens agrupados diretamente do banco
     */
    private function buscarItensAgrupadosDoBanco(array $comprasOrigem): array
    {
        $itensAgrupados = [];

        if (empty($comprasOrigem)) {
            return $itensAgrupados;
        }

        try {
            $todosItens = DB::connection('DBCompra')->table('tbsol_compra')
                ->whereIn('cod_compra', $comprasOrigem)
                ->get(['cod_material', 'quantidade', 'cod_compra']);

            foreach ($todosItens as $item) {
                $descricao = $this->buscarDescricaoMaterial($item->cod_material);

                $itensAgrupados[] = [
                    'cod_material' => $item->cod_material,
                    'descricao' => $descricao,
                    'quantidade' => $item->quantidade,
                    'cod_compra_origem' => $item->cod_compra
                ];
            }
        } catch (\Exception $e) {
            \Log::error('Erro ao buscar itens agrupados: ' . $e->getMessage());
        }

        return $itensAgrupados;
    }

    /**
     * Monta detalhes formatados do agrupamento
     */
    private function montarDetalhesAgrupamento(array $dados): string
    {
        try {
            $detalhes = "📦 COTAÇÃO AGRUPADA\n";
            $detalhes .= "Código: " . ($dados['cod_cotacao_agrupado'] ?? 'N/A') . "\n";
            $detalhes .= "Compras envolvidas: " . count($dados['compras_agrupadas'] ?? []) . "\n";
            $detalhes .= "Compras: " . implode(', ', $dados['compras_agrupadas'] ?? []) . "\n\n";

            $detalhes .= "📋 ITENS AGRUPADOS:\n";
            if (!empty($dados['itens_detalhados'])) {
                foreach ($dados['itens_detalhados'] as $index => $item) {
                    $detalhes .= ($index + 1) . ". " . $item['descricao'] . "\n";
                    $detalhes .= "   Código: " . $item['cod_material'] . "\n";
                    $detalhes .= "   Unidade: " . $item['unidade'] . "\n";
                    $detalhes .= "   Quantidade Total: " . $item['quantidade_total'] . "\n";
                    // $detalhes .= "   Origem:\n";
                    // foreach ($item['solicitacoes_origem'] as $origem) {
                    //     $detalhes .= "     - Compra {$origem['cod_compra']}: {$origem['quantidade']} unidades\n";
                    // }
                    // $detalhes .= "\n";
                }
            } else {
                $detalhes .= "Nenhum item encontrado\n";
            }

            // if (!empty($dados['responsavel'])) {
            //     $detalhes .= "Responsável: " . $dados['responsavel'] . "\n";
            // }

            // if (!empty($dados['data_agrupamento'])) {
            //     $detalhes .= "Data: " . $dados['data_agrupamento'];
            // }

            return $detalhes;
        } catch (\Exception $e) {
            return "Agrupamento de cotações realizado";
        }
    }

    /**
     * Monta detalhes completos do agrupamento
     */
    private function montarDetalhesCompletos(array $dados): array
    {
        try {
            $detalhes = [
                'cod_cotacao_agrupado' => $dados['cod_cotacao_agrupado'] ?? null,
                'compras_envolvidas' => $dados['compras_agrupadas'] ?? [],
                'data_agrupamento' => $dados['data_agrupamento'] ?? null,
                'responsavel' => $dados['responsavel'] ?? null,
                'total_compras' => count($dados['compras_agrupadas'] ?? []),
                'total_itens_distintos' => count($dados['itens_detalhados'] ?? []),
                'itens' => []
            ];

            // Adicionar lista detalhada de itens
            if (!empty($dados['itens_detalhados'])) {
                foreach ($dados['itens_detalhados'] as $item) {
                    $detalhes['itens'][] = [
                        'cod_material' => $item['cod_material'],
                        'descricao' => $item['descricao'],
                        'unidade' => $item['unidade'],
                        'quantidade_total' => $item['quantidade_total'],
                        'solicitacoes_origem' => $item['solicitacoes_origem']
                    ];
                }
            }

            // Adicionar resumo por compra
            $detalhes['resumo_por_compra'] = [];
            if (!empty($dados['compras_agrupadas'])) {
                foreach ($dados['compras_agrupadas'] as $codCompra) {
                    $itensCompra = array_filter($dados['itens_detalhados'] ?? [], function ($item) use ($codCompra) {
                        foreach ($item['solicitacoes_origem'] as $origem) {
                            if ($origem['cod_compra'] === $codCompra) {
                                return true;
                            }
                        }
                        return false;
                    });

                    $totalItens = 0;
                    foreach ($itensCompra as $item) {
                        foreach ($item['solicitacoes_origem'] as $origem) {
                            if ($origem['cod_compra'] === $codCompra) {
                                $totalItens += $origem['quantidade'];
                            }
                        }
                    }

                    $detalhes['resumo_por_compra'][] = [
                        'cod_compra' => $codCompra,
                        'quantidade_itens' => count($itensCompra),
                        'quantidade_total' => $totalItens,
                        'e_principal' => ($dados['compras_agrupadas'][0] ?? null) === $codCompra
                    ];
                }
            }

            return $detalhes;
        } catch (\Exception $e) {
            return ['erro' => 'Não foi possível carregar detalhes completos'];
        }
    }

    public function todas_solicitacoes(Request $request)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $user = auth('api')->user();

        if (!isset($user->compras)) {
            return response()->json(['error' => 'Permissão inválida para atualizar solicitações'], 403);
        }

        // 🔹 Subquery unindo as duas tabelas de materiais
        $materiaisUnion = DB::connection('DBCompra')->table('tb_material as m1')
            ->select('codmat', 'descricao')
            ->unionAll(
                DB::connection('DBCompra')->table('tbmaterial_aniel as m2')
                    ->select('codmat', 'descricao')
            );

        $query = DB::connection('DBCompra')->table('tbsol_compra as sc')
            ->join('bdffa.tbfuncionario as f', 'sc.solicitante', '=', 'f.matricula')
            ->leftJoin('tbaux_retorno_processo as e', 'sc.cod_compra', '=', 'e.cod_compra')
            ->leftJoin('tb_agrupamento_cotacoes as ac', 'sc.cod_compra', '=', 'ac.cod_cotacao_agrupada')
            ->leftJoin('bdffa.tbfilial as fil', 'sc.filial_id', '=', 'fil.idtbfilial')
            ->joinSub($materiaisUnion, 'm', function ($join) {
                $join->on('sc.cod_material', '=', 'm.codmat');
            })
            ->select(
                'sc.cod_compra as Cod. Compra',
                DB::raw('DATE_FORMAT(MIN(sc.data_solicitacao), "%d/%m/%Y") AS "Solicitação"'),
                DB::raw('GROUP_CONCAT(DISTINCT f.nome) as Solicitante'),
                DB::raw('ANY_VALUE( f.matricula) AS matricula'),
                DB::raw('MAX( e.matricula_destino) AS matricula_destino'),
                DB::raw('GROUP_CONCAT(DISTINCT m.descricao) as descrição'),
                DB::raw('MAX(aceite_gerente) as aceite_gerente'),
                DB::raw('MAX(aceite_material) as aceite_material'),
                DB::raw('MAX(aceite_compra) as aceite_compra'),
                DB::raw('MAX(aceite_diretor) as aceite_diretor'),
                DB::raw('MAX(finalizado) as finalizado'),
                DB::raw('MAX(entregue) as entregue'),
                DB::raw('MAX(sc.status) as status'),
                DB::raw('ANY_VALUE(fil.descricao) as Filial')

            )
            ->groupBy('sc.cod_compra')
            ->orderBy('sc.cod_compra', 'DESC')
            ->get();

        return response()->json($query, 200);
    }


    public function index_adm(Request $request)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $user = auth('api')->user();

        if (!isset($user->compras)) {
            return response()->json(['error' => 'Permissão inválida para atualizar solicitações'], 403);
        }

        $query = DB::connection('DBCompra')->table('tbsol_compra as sc')
            ->join('bdffa.tbfuncionario as f', 'sc.solicitante', '=', 'f.matricula')
            ->joinSub(
                DB::connection('DBCompra')->table('tb_material as m1')
                    ->select('codmat', 'descricao', 'unid')
                    ->unionAll(
                        DB::table('tbmaterial_aniel as m2')
                            ->select('codmat', 'descricao', 'unid')
                    ),
                'm',
                function ($join) {
                    $join->on('m.codmat', '=', 'sc.cod_material');
                }
            )
            ->select(
                'sc.cod_compra as Cod. Compra',
                DB::raw('DATE_FORMAT(MIN(sc.data_solicitacao), "%d/%m/%Y") AS "Data da Solicitação"'),
                DB::raw('GROUP_CONCAT(DISTINCT f.nome) as Solicitante'),
                DB::raw('ANY_VALUE( f.matricula) AS matricula'),
                DB::raw('ANY_VALUE( f.ccusto) AS "Centro de Custo"'),
                DB::raw('GROUP_CONCAT(DISTINCT m.descricao) as descrição'),
                DB::raw('MAX(justificativa_solicitante) as justificativa_solicitante'),
                DB::raw('MAX(justificativa_material) as justificativa_material'),
                DB::raw('MAX(justificativa_compra) as justificativa_compra'),
                DB::raw('MAX(justificativa_diretor) as justificativa_diretor'),
                DB::raw('MAX(justificativa_cfo) as justificativa_cfo'),
                DB::raw('MAX(finalizado) as finalizado'),
                DB::raw('MAX(sc.status) as status')
            )
            ->where(function ($q) {
                $q->where('f.ccusto', 'NOT LIKE', '%FROTA%')
                    ->where('f.ccusto', 'NOT LIKE', '%LOGISTICA%')
                    ->where('f.ccusto', 'NOT LIKE', '%CLARO%')
                    ->where('f.ccusto', 'NOT LIKE', '%IHS%')
                    ->where('f.ccusto', 'NOT LIKE', '%TI%')
                    ->where('f.ccusto', 'NOT LIKE', '%DEPARTAMENTO PESSOAL%');
            })
            ->whereNull('aceite_gerente')
            ->groupBy('sc.cod_compra')
            ->orderBy('sc.cod_compra', 'asc')
            ->get();

        return response()->json($query, 200);
    }


    public function solicitacoes_equipe(Request $request)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $user = auth('api')->user();

        if (!isset($user->compras)) {
            return response()->json(['error' => 'Permissão inválida para atualizar solicitações'], 403);
        }

        // 🔹 Busca os centros de custo do usuário
        $ccusto_registro = DB::connection('mysql')
            ->table('tbcadeia_aprovacao')
            ->select('grupo_ccusto')
            ->where('matricula', $user->matricula)
            ->get()
            ->pluck('grupo_ccusto')
            ->filter() // Remove valores vazios
            ->map(fn($ccusto) => '%' . $ccusto . '%') // Adiciona wildcards para LIKE
            ->toArray();

        // 🔹 Monta a query principal
        $query = DB::connection('DBCompra')
            ->table('tbsol_compra as sc')
            ->join('bdffa.tbfuncionario as f', 'sc.solicitante', '=', 'f.matricula')
            ->joinSub(
                DB::table('tb_material as m1')->select('codmat', 'descricao', 'unid')
                    ->unionAll(
                        DB::table('tbmaterial_aniel as m2')->select('codmat', 'descricao', 'unid')
                    ),
                'm',
                function ($join) {
                    $join->on('m.codmat', '=', 'sc.cod_material');
                }
            )
            ->select(
                'sc.cod_compra as Cod_Compra',
                DB::raw('DATE_FORMAT(MIN(sc.data_solicitacao), "%d/%m/%Y") AS Data_Solicitacao'),
                DB::raw('GROUP_CONCAT(DISTINCT f.nome) as Solicitante'),
                DB::raw('ANY_VALUE(f.matricula) AS Matricula'),
                DB::raw('ANY_VALUE(f.ccusto) AS Centro_Custo'),
                DB::raw('GROUP_CONCAT(DISTINCT m.descricao) as Descricao'),
                DB::raw('MAX(justificativa_solicitante) as justificativa_solicitante'),
                DB::raw('MAX(justificativa_material) as justificativa_material'),
                DB::raw('MAX(justificativa_compra) as justificativa_compra'),
                DB::raw('MAX(justificativa_diretor) as justificativa_diretor'),
                DB::raw('MAX(justificativa_cfo) as justificativa_cfo'),
                DB::raw('MAX(finalizado) as finalizado'),
                DB::raw('MAX(sc.status) as status')
            );

        // 🔹 Condições dinâmicas
        $query->where(function ($q) use ($user, $ccusto_registro) {
            // Condição principal: solicitações pendentes ou com status do usuário
            $q->where(function ($subQuery) use ($user) {
                $subQuery->whereNull('sc.aceite_gerente')
                    ->orWhere('sc.status', $user->compras);
            });

            // Filtro por centro de custo
            if (!empty($ccusto_registro)) {
                $q->where(function ($ccustoQuery) use ($ccusto_registro) {
                    foreach ($ccusto_registro as $cc) {
                        $ccustoQuery->orWhere('f.ccusto', 'LIKE', $cc);
                    }
                });
            }
        });

        // 🔹 Agrupamento e execução
        $result = $query
            ->groupBy('sc.cod_compra')
            ->orderBy('sc.cod_compra', 'asc')
            ->get();

        return response()->json($result, 200);
    }



    public function finalizadas(Request $request)
    {

        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $user = auth('api')->user();

        if (!isset($user->compras)) {
            return response()->json(['error' => 'Permissão inválida para atualizar solicitações'], 403);
        }

        $query = DB::connection('DBCompra')->table('tbsol_compra as sc')
            ->join('bdffa.tbfuncionario as f', 'sc.solicitante', '=', 'f.matricula')
            ->leftJoin('tbmateriais_cotados as mc', function ($join) {
                $join->on('sc.cod_cotacao', '=', 'mc.cod_cotacao')
                    ->where('mc.status', 'Aprovado');
            })
            ->leftJoin('tbfornecedor as forn', 'mc.fornecedor_id', '=', 'forn.id')
            ->leftJoin('tb_material as m', 'sc.cod_material', '=', 'm.codmat')
            ->leftJoin('tbmaterial_aniel as ma', 'sc.cod_material', '=', 'ma.codmat')
            ->leftJoin('bdffa.tbfilial as fil', 'sc.filial_id', '=', 'fil.idtbfilial')
            ->join('tbgestao_material as gm', DB::raw('COALESCE(m.centrocusto, ma.centrocusto)'), '=', 'gm.id')
            ->select(
                DB::raw('DATE_FORMAT(MIN(sc.data_solicitacao), "%d/%m/%Y") as "Data da Solicitação"'),
                DB::raw('sc.cod_cotacao as Código'),
                DB::raw('ANY_VALUE(f.nome) as solicitante'),
                DB::raw('COALESCE(ANY_VALUE(m.descricao), ANY_VALUE(ma.descricao)) as descricao'),
                DB::raw('SUM(sc.quantidade) as quantidade'),
                DB::raw('ANY_VALUE(sc.solicitante) as matricula_solicitante'),
                DB::raw('ANY_VALUE(sc.matricula_material) as matricula_material'),
                DB::raw('ANY_VALUE(sc.matricula_compra) as matricula_compra'),
                DB::raw('ANY_VALUE(sc.matricula_diretor) as matricula_diretor'),
                DB::raw('ANY_VALUE(sc.matricula_finalizado) as matricula_finalizado'),
                DB::raw('ANY_VALUE(sc.justificativa_solicitante) as justificativa_solicitante'),
                DB::raw('ANY_VALUE(sc.justificativa_material) as justificativa_material'),
                DB::raw('ANY_VALUE(sc.justificativa_compra) as justificativa_compra'),
                DB::raw('ANY_VALUE(sc.justificativa_diretor) as justificativa_diretor'),
                DB::raw('ANY_VALUE(sc.justificativa_cfo) as justificativa_cfo'),
                DB::raw('ANY_VALUE(sc.finalizado) as finalizado'),
                DB::raw('ANY_VALUE(sc.status) as status'),
                DB::raw('ANY_VALUE(fil.descricao) as filial'),
                DB::raw('ANY_VALUE(sc.cod_compra) as cod_compra'),
                DB::raw('DATE_FORMAT(MIN(sc.data_diretor), "%d/%m/%Y") as "Aprovação do Diretor"'),
                DB::raw('ANY_VALUE(forn.nome_fantasia) AS Fornecedor'),
            )
            ->where('aceite_diretor', 1)
            ->whereNull('sc.finalizado')
            ->groupBy('sc.cod_cotacao')
            ->get();



        return response()->json($query, 200);
    }

    public function detalhes_solicitacao($cod_compra)
    {
        if (!$cod_compra) {
            return response()->json(['error' => 'Código de compra não fornecido'], 400);
        }

        // busca todas as solicitações com o cod_compra fornecido
        $query = \DB::connection('DBCompra')->table('tbsol_compra as sc')
            ->join('bdffa.tbfuncionario as f', 'sc.solicitante', '=', 'f.matricula')
            ->joinSub(
                \DB::connection('DBCompra')->table('tb_material as m1')->select('codmat', 'descricao', 'unid', 'centrocusto')
                    ->unionAll(
                        \DB::connection('DBCompra')->table('tbmaterial_aniel as m2')->select('codmat', 'descricao', 'unid', 'centrocusto')
                    ),
                'm',
                function ($join) {
                    $join->on('sc.cod_material', '=', 'm.codmat');
                }
            )
            // ->join('bdcompra.tbmateriais_cotados as mc', 'sc.')
            ->select(
                \DB::connection('DBCompra')->raw("DATE_FORMAT(sc.data_solicitacao, '%d/%m/%Y %H:%i:%s') as `Data da Solicitação`"),
                'm.descricao as descricao',
                'm.descricao as Descrição',
                'm.centrocusto as centro_custo',  // Adiciona o campo centrocusto
                'm.unid as unidade',
                'sc.cod_material',
                'sc.quantidade',
                'sc.cod_compra',
                'sc.quantidade',
                'sc.id',
                'sc.aceite_material',
                'sc.cod_cotacao'
            );

        $user = auth('api')->user();

        if (!isset($user->compras)) {
            return response()->json(['error' => 'Permissão inválida'], 403);
        }

        $solicitacoes = $query->where('sc.cod_compra', $cod_compra)
            ->orderBy('sc.data_solicitacao', 'asc')
            ->get();

        if ($solicitacoes->isEmpty()) {
            $solicitacoes = $query->orWhere('sc.cod_cotacao', $cod_compra)
                ->orderBy('sc.data_solicitacao', 'asc')
                ->get();
        }

        return response()->json($solicitacoes, 200);
    }


    public function finalizar(Request $request)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $user = auth('api')->user();

        if (!isset($user->compras)) {
            return response()->json(['error' => 'Permissão inválida para atualizar solicitações'], 403);
        }

        $camposAceite = [
            3 => ['finalizado', 'data_finalizado', 'matricula_finalizado'],
        ];

        if (!isset($camposAceite[$user->compras])) {
            return response()->json(['error' => 'Permissão inválida para atualizar solicitações'], 403);
        }

        $cod_compra = $request->input('cod_compra');

        if (!$cod_compra) {
            return response()->json(['error' => 'Código da compra não fornecido'], 400);
        }

        // Buscar TODAS as solicitações com esse cod_compra
        $cod_cotacao = $request->input('cod_cotacao');

        // if ($cod_cotacao != null) {
        //     $solicitacoes = SolCompraModel::where('cod_cotacao', $cod_cotacao)->get();
        // } else {
        //     $solicitacoes = SolCompraModel::where('cod_compra', $cod_compra)->get();
        // }

        $solicitacoes = SolCompraModel::where('cod_cotacao', $cod_cotacao)->get();

        if ($solicitacoes->isEmpty()) {
            return response()->json(['error' => 'Solicitações não encontradas'], 404);
        }

        $campos = $camposAceite[$user->compras];

        foreach ($solicitacoes as $solicitacao) {
            foreach ($campos as $campo) {
                if (str_starts_with($campo, 'data_')) {
                    $solicitacao->$campo = $request->input($campo, Carbon::now());
                } elseif ($request->has($campo)) {
                    $solicitacao->$campo = $request->input($campo);
                }
            }
            $solicitacao->save();
        }

        return response()->json([
            'message' => 'Todas as solicitações com o código de compra foram atualizadas com sucesso.',
            'cod_compra' => $cod_cotacao
        ], 200);
    }

    public function enviar_material(Request $request)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $user = auth('api')->user();

        if (!isset($user->compras)) {
            return response()->json(['error' => 'Permissão inválida para atualizar solicitações'], 403);
        }

        $camposAceite = [
            3 => ['finalizado', 'data_finalizado', 'matricula_finalizado', 'justificativa_cfo'],
        ];

        if (!isset($camposAceite[$user->compras])) {
            return response()->json(['error' => 'Permissão inválida para atualizar solicitações'], 403);
        }

        $cod_compra = $request->input('cod_compra');

        if (!$cod_compra) {
            return response()->json(['error' => 'Código da compra não fornecido'], 400);
        }

        $solicitacoes = SolCompraModel::where('cod_compra', $cod_compra)->get();

        if ($solicitacoes->isEmpty()) {
            return response()->json(['error' => 'Solicitações não encontradas' . $cod_compra], 404);
        }

        $campos = $camposAceite[$user->compras];

        foreach ($solicitacoes as $solicitacao) {
            foreach ($campos as $campo) {
                if (str_starts_with($campo, 'data_')) {
                    $solicitacao->$campo = $request->input($campo, Carbon::now());
                } elseif ($request->has($campo)) {
                    $solicitacao->$campo = $request->input($campo);
                }
            }
            $solicitacao->save();
        }

        return response()->json([
            'message' => 'Todas as solicitações com o código de compra foram atualizadas com sucesso.',
        ], 200);
    }

    public function detalhesMaterial(Request $request, $cod_material)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $user = auth('api')->user();

        if (!isset($user->compras)) {
            return response()->json(['error' => 'Permissão inválida para atualizar solicitações'], 403);
        }

        // 🔹 Unifica as duas tabelas de materiais
        $materiais = DB::connection('DBCompra')
            ->table('tb_material')
            ->select(
                'id',
                'codmat AS Cod_Material',
                'descricao AS Descrição',
                'unid',
                'centrocusto AS Centro_de_Custo',
                'saldo',
                'status',
                'data_cadastro AS Data_do_Cadastro',
                'obs AS Observação',
                'marca',
                'modelo',
                'ean AS EAM',
                'sub_grupo AS Subgrupo',
                'patrimonio'
            )
            ->where('codmat', $cod_material)
            ->unionAll(
                DB::connection('DBCompra')->table('tbmaterial_aniel')
                    ->select(
                        'id',
                        'codmat AS Cod_Material',
                        'descricao AS Descrição',
                        'unid',
                        'centrocusto AS Centro_de_Custo',
                        'saldo',
                        'status',
                        'data_cadastro AS Data_do_Cadastro',
                        'obs AS Observação',
                        'marca',
                        'modelo',
                        'ean AS EAM',
                        'sub_grupo AS Subgrupo',
                        'patrimonio'
                    )
                    ->where('codmat', $cod_material)
            )
            ->get();

        return response()->json($materiais, 200);
    }

    public function materiais_comprados(Request $request)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $user = auth('api')->user();

        if (!isset($user->compras)) {
            return response()->json(['error' => 'Permissão inválida para atualizar solicitações'], 403);
        }

        $query = DB::connection('DBCompra')->table('tbsol_compra as sc')
            ->join('bdffa.tbfuncionario as f', 'sc.solicitante', '=', 'f.matricula')
            ->join('tb_material as m', 'sc.cod_material', '=', 'm.codmat')
            ->join('tbgestao_material as gm', 'm.centrocusto', '=', 'gm.id')
            ->leftJoin('bdffa.tbfuncionario as f_material', 'sc.matricula_material', '=', 'f_material.matricula')
            ->leftJoin('bdffa.tbfuncionario as f_compra', 'sc.matricula_compra', '=', 'f_compra.matricula')
            ->leftJoin('bdffa.tbfuncionario as f_diretor', 'sc.matricula_diretor', '=', 'f_diretor.matricula')
            ->leftJoin('bdffa.tbfuncionario as f_finalizado', 'sc.matricula_finalizado', '=', 'f_finalizado.matricula')
            ->select(
                DB::raw('DATE_FORMAT(MIN(sc.data_solicitacao), "%d/%m/%Y") as data_solicitacao'),
                DB::raw('ANY_VALUE(sc.cod_compra) as cod_compra'),
                DB::raw('ANY_VALUE(f.nome) as solicitante'),
                DB::raw('sc.cod_cotacao as Código')
            )
            ->whereNotNull('finalizado')
            ->whereNull('entregue')

            // 🔥 FILTRO ADICIONADO AQUI
            ->where('sc.solicitante', $user->matricula)

            ->groupBy('sc.cod_cotacao')
            ->get();

        return response()->json($query, 200);
    }

    public function marcar_entregue(Request $request)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $user = auth('api')->user();

        if (!isset($user->compras)) {
            return response()->json(['error' => 'Permissão inválida para atualizar solicitações'], 403);
        }

        $camposAceite = [
            2 => ['entregue', 'data_entregue', 'matricula_entregue'],
        ];

        if (!isset($camposAceite[$user->compras])) {
            return response()->json(['error' => 'Permissão inválida para atualizar solicitações'], 403);
        }

        $cod_compra = $request->input('cod_compra');

        if (!$cod_compra) {
            return response()->json(['error' => 'Código da compra não fornecido'], 400);
        }

        // Buscar TODAS as solicitações com esse cod_compra
        $cod_cotacao = $request->input('cod_cotacao');

        // if ($cod_cotacao != null) {
        //     $solicitacoes = SolCompraModel::where('cod_cotacao', $cod_cotacao)->get();
        // } else {
        //     $solicitacoes = SolCompraModel::where('cod_compra', $cod_compra)->get();
        // }

        $solicitacoes = SolCompraModel::where('cod_cotacao', $cod_cotacao)->get();

        if ($solicitacoes->isEmpty()) {
            return response()->json(['error' => 'Solicitações não encontradas'], 404);
        }

        $campos = $camposAceite[$user->compras];

        foreach ($solicitacoes as $solicitacao) {
            foreach ($campos as $campo) {
                if (str_starts_with($campo, 'data_')) {
                    $solicitacao->$campo = $request->input($campo, Carbon::now());
                } elseif ($request->has($campo)) {
                    $solicitacao->$campo = $request->input($campo);
                }
            }
            $solicitacao->save();
        }

        return response()->json([
            'message' => 'Todas as solicitações com o código de compra foram atualizadas com sucesso.',
            'cod_compra' => $cod_cotacao
        ], 200);
    }

    public function solicitacoes_entregues(Request $request)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $user = auth('api')->user();

        if (!isset($user->compras)) {
            return response()->json(['error' => 'Permissão inválida para atualizar solicitações'], 403);
        }

        try {

            $solicitacoes = DB::table('bdcompra.tbsol_compra as nf')
                ->select(
                    'nf.numero',
                    'nf.serie',
                    'func.nome',
                    DB::raw("forn.razao_social AS 'Razão Social'"),
                    DB::raw("DATE_FORMAT(nf.data_emissao, '%d/%m/%Y') AS 'Emissão'"),
                    DB::raw("DATE_FORMAT(nf.data_entrada, '%d/%m/%Y') AS 'Data de Entrada'"),
                    DB::raw("CONCAT('R$ ', FORMAT(nf.valor_total, 2, 'pt_BR')) AS 'Valor Total'"),
                    'nf.status',
                    DB::raw("nf.tipo_entrada AS 'Entrada'"),
                    'nf.anexo',
                    'nf.obs',
                    'nf.id',
                    'nf.tipo',
                    'nf.modelo',
                    'nf.chave_acesso',
                    'nf.matricula'
                )
                ->join('bdffa.tbfuncionario as func', 'func.matricula', '=', 'nf.matricula')
                ->join('bdcompra.tbfornecedor as forn', 'forn.id', '=', 'nf.fornecedor_id')
                ->orderBy('nf.created_at', 'desc');
            return response()->json([$solicitacoes], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => $e->getMessage()], 404);
        }
    }

    public function listar_gerencia(Request $request)
    {
        try {
            $token = $request->header('Authorization');

            if (!$token) {
                return response()->json(['error' => 'Token não fornecido'], 401);
            }

            $user = auth('api')->user();

            if (!isset($user->compras)) {
                return response()->json([], 403);
            }

            $columns_group = 'sc.cod_compra';

            // 🔹 Busca as matrículas dos coordenadores vinculados ao gerente logado
            $matriculas_coordenadores = DB::connection('mysql')->table('bdfrota.tbusuario as u')
                ->leftJoin('bdfrota.tbgerente as g', 'u.matricula', '=', 'g.matricula')
                ->leftJoin('bdfrota.tbcoord as c', 'g.idtbgerente', '=', 'c.idtbgerente')
                ->where('u.matricula', $user->matricula)
                ->whereNotNull('c.matricula')
                ->pluck('c.matricula')
                ->toArray();

            if (empty($matriculas_coordenadores)) {
                return response()->json([], 200);
            }

            // 🔹 Consulta para unir as tabelas de materiais
            $materiais1 = DB::connection('DBCompra')
                ->table('tb_material')
                ->select('codmat', 'descricao', 'centrocusto');

            $materiais2 = DB::connection('DBCompra')
                ->table('tbmaterial_aniel')
                ->select('codmat', 'descricao', 'centrocusto');

            $materiaisUnion = $materiais1->unionAll($materiais2);

            // 🔹 Query principal filtrada pela hierarquia
            $query = DB::connection('DBCompra')->table('tbsol_compra as sc')
                ->join('bdffa.tbfuncionario as f', 'sc.solicitante', '=', 'f.matricula')
                ->joinSub($materiaisUnion, 'm', function ($join) {
                    $join->on('sc.cod_material', '=', 'm.codmat');
                })
                ->join('tbgestao_material as gm', 'm.centrocusto', '=', 'gm.id')
                ->leftJoin('bdffa.tbfuncionario as fm', 'sc.matricula_material', '=', 'fm.matricula')
                ->leftJoin('bdffa.tbfuncionario as fc', 'sc.matricula_compra', '=', 'fc.matricula')

                ->select(
                    DB::raw('DATE_FORMAT(MIN(sc.data_solicitacao), "%d/%m/%Y") as data_solicitacao'),
                    DB::raw("$columns_group as Código"),
                    DB::raw('ANY_VALUE(m.descricao) as descricao'),
                    DB::raw('ANY_VALUE(f.nome) as solicitante'),
                    DB::raw('ANY_VALUE(fm.nome) as "Gestor de Material"'),
                    DB::raw('ANY_VALUE(fc.nome) as "Gestor de Compra"'),
                    DB::raw('SUM(sc.quantidade) as quantidade'),
                    DB::raw('ANY_VALUE(sc.finalizado) as finalizado'),
                    DB::raw('ANY_VALUE(sc.status) as status'),
                    DB::raw('ANY_VALUE(sc.visivel) as visivel'),
                    DB::raw('ANY_VALUE(sc.cod_compra) as cod_compra'),
                )

                ->whereIn('sc.solicitante', $matriculas_coordenadores)

                ->where(function ($q) use ($user) {
                    $q->where('sc.visivel', 1)
                        ->orWhere('sc.status', $user->compras);
                })

                ->where(function ($q) use ($user) {
                    $q->whereNull('sc.aceite_gerente')
                        // ->whereNull('sc.aceite_material')
                        ->orWhere('sc.status', $user->compras);
                });

            $solicitacoes = $query->groupBy(DB::raw($columns_group))
                ->orderBy(DB::raw($columns_group), 'asc')
                ->get();

            return response()->json($solicitacoes, 200);

        } catch (\Throwable $e) {
            return response()->json([], 500);
        }
    }


    public function listarMateriaisUnificados()
    {
        try {
            // 🔹 Executa query SQL puro com UNION ALL para unir as duas tabelas
            $materiais = \DB::connection('DBCompra')->select("
    SELECT codmat AS CodMaterial,
           descricao AS Descricao,
           unid AS Unidade,
           centrocusto AS CentroCusto,
           saldo,
           status,
           data_cadastro AS DataCadastro,
           obs AS Observacao,
           marca,
           modelo,
           ean AS EAM,
           sub_grupo AS Subgrupo,
           patrimonio
    FROM tb_material
    UNION ALL
    SELECT codmat AS CodMaterial,
           descricao AS Descricao,
           unid AS Unidade,
           centrocusto AS CentroCusto,
           saldo,
           status,
           data_cadastro AS DataCadastro,
           obs AS Observacao,
           marca,
           modelo,
           ean AS EAM,
           sub_grupo AS Subgrupo,
           patrimonio
    FROM tbmaterial_aniel
");

            return response()->json([
                'data' => $materiais,
                'total' => count($materiais)
            ], 200);


        } catch (\Throwable $e) {
            // 🔹 Em caso de erro, retorna JSON com status 500
            return response()->json([
                'error' => 'Erro interno ao listar materiais',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function list_ccusto(Request $request)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        $centro_custo = DB::connection('mysql')->table('tbccusto')->where('visivel', 1)->orderBy('descricao')->get();


        return Response()->json($centro_custo, 200);
    }

    public function checar_material(Request $request)
    {
        try {
            $token = $request->header('Authorization');

            if (!$token) {
                return response()->json(['error' => 'Token não fornecido'], 401);
            }

            $user = auth('api')->user();

            if (!isset($user->compras)) {
                return response()->json(['error' => 'Permissão inválida para atualizar solicitações'], 403);
            }

            // CONSULTA EXCLUSIVA PARA NÍVEL 2
            // Subquery para UNION dos materiais
            $materiais1 = DB::connection('DBCompra')
                ->table('tb_material')
                ->select('codmat', 'descricao', 'centrocusto');

            $materiais2 = DB::connection('DBCompra')
                ->table('tbmaterial_aniel')
                ->select('codmat', 'descricao', 'centrocusto');

            $materiaisUnion = $materiais1->unionAll($materiais2);

            // Query principal nível 2
            $query = DB::connection('DBCompra')->table('tbsol_compra as sc')
                ->join('bdffa.tbfuncionario as f', 'sc.solicitante', '=', 'f.matricula')
                ->joinSub($materiaisUnion, 'm', function ($join) {
                    $join->on('sc.cod_material', '=', 'm.codmat');
                })
                ->leftJoin('bdffa.tbfuncionario as fg', 'sc.matricula_gerente', '=', 'fg.matricula')
                ->leftJoin('bdffa.tbfuncionario as fc', 'sc.matricula_compra', '=', 'fc.matricula')
                ->leftJoin('bdcompra.tb_agrupamento_cotacoes as ac', 'ac.cod_cotacao_agrupada', '=', 'sc.cod_compra')

                ->select(
                    DB::raw('DATE_FORMAT(MIN(sc.data_solicitacao), "%d/%m/%Y") as Solicitação'),
                    DB::raw('sc.cod_compra as Código'),
                    DB::raw('ANY_VALUE(m.descricao) as descricao'),
                    DB::raw('ANY_VALUE(f.nome) as solicitante'),
                    DB::raw('ANY_VALUE(fg.nome) as gerente_nome'),
                    DB::raw('ANY_VALUE(fc.nome) as ""'),
                    DB::raw('SUM(sc.quantidade) as quantidade'),
                    DB::raw('ANY_VALUE(sc.finalizado) as finalizado'),
                    DB::raw('ANY_VALUE(sc.status) as status'),
                    DB::raw('ANY_VALUE(sc.visivel) as visivel'),
                    DB::raw('ANY_VALUE(sc.cod_compra) as cod_compra'),
                    DB::raw('ANY_VALUE(ac.data_agrupamento) as Agrupamento')
                )

                // Condições específicas do nível 2
                ->where(function ($q) use ($user) {
                    $q->whereNull('sc.aceite_material')
                        ->where('sc.aceite_gerente', '!=', '0')
                        ->whereNotNull('sc.aceite_gerente')
                        ->whereNull('sc.status')
                        ->where('sc.checado', '=', '0');
                })

                // CORREÇÃO: Filtro por gestores de material usando JSON_CONTAINS
                ->whereExists(function ($sub) use ($user) {
                    $sub->select(DB::raw(1))
                        ->from('tbgestores_material as gm')
                        ->where('gm.matricula', $user->matricula)
                        ->whereRaw("JSON_CONTAINS(gm.ids_gestao_material, CAST(m.centrocusto AS JSON))");
                })

                ->groupBy('sc.cod_compra')
                ->orderBy('sc.cod_compra', 'asc');

            $solicitacoes = $query->get();

            return response()->json($solicitacoes, 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao buscar solicitações.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

}