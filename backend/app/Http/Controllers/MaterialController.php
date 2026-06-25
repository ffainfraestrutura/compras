<?php

namespace App\Http\Controllers;

use App\Models\MaterialModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaterialController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(): JsonResponse
    {
        try {
            $gestaoDescricao = request()->query('gestaoDescricao');

            $columns = [
                'id',
                'codmat AS CodMaterial',
                'descricao AS Descricao',
                'unid AS Unidade',
                'centrocusto AS CentroCusto',
                'saldo',
                'status',
                'data_cadastro AS DataCadastro',
                'obs AS Observacao',
                'marca',
                'modelo',
                'ean AS EAM',
                'sub_grupo AS Subgrupo',
                'patrimonio',
            ];

            // 🔹 Roda as duas queries em paralelo usando Promises (via jobs/forks não é possível,
            //    mas podemos usar cached queries e lazy loading)
            $cacheKey = 'materiais_' . md5($gestaoDescricao ?? 'all');

            $material = \Cache::remember($cacheKey, now()->addMinutes(5), function () use ($columns, $gestaoDescricao) {

                $buildQuery = function (string $connection, string $table) use ($columns, $gestaoDescricao) {
                    $q = \DB::connection($connection)->table($table)->select($columns);
                    if (!empty($gestaoDescricao)) {
                        $q->where('centrocusto', '=', $gestaoDescricao);
                    }
                    return $q;
                };

                $query1 = $buildQuery('DBCompra', 'tbmaterial_aniel');
                $query2 = $buildQuery('DBCompra', 'tb_material');

                // Roda as duas ao mesmo tempo (sequencial mas sem overhead de union cross-db)
                $result1 = $query1->get();
                $result2 = $query2->get();

                // Merge em PHP — mais rápido que UNION cross-database
                return $result1->concat($result2)->values();
            });

            return response()->json($material, 200);

        } catch (\Exception $e) {
            \Log::error('Erro na busca de materiais: ' . $e->getMessage());
            return response()->json(['error' => 'Erro interno do servidor: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request): JsonResponse
    {
        try {

            $token = $request->header('Authorization');

            if (!$token) {
                return response()->json(['error' => 'Token não fornecido'], 401);
            }

            $validated = $request->validate([
                'descricao' => 'required|string|max:255',
                'unid' => 'required|string|max:10',
                'centrocusto' => 'required|numeric|max:255',
                'saldo' => 'numeric|min:0',
                'status' => 'numeric|max:50',
                'obs' => 'nullable|string',
                'marca' => 'nullable|string',
                'modelo' => 'nullable|string',
                'ean' => 'nullable|string|max:50',
                'sub_grupo' => 'nullable|string',
                'resp_material' => 'nullable|string',
                'patrimonio' => 'nullable|string'
            ]);

            $validated['data_cadastro'] = now();
            $validated['codmat'] = strtoupper(base_convert(time(), 10, 36));

            $solicitacao = MaterialModel::create($validated);

            return response()->json($solicitacao, 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Erro ao criar solicitação.', 'message' => $e->getMessage()], 400);
        }
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id): JsonResponse
    {
        if (!$id) {
            return response()->json(['error' => 'ID da solicitação não fornecido'], 400);
        }

        // 🔹 1️⃣ Busca primeiro na tabela principal (MaterialModel)
        $material = \DB::connection('DBCompra')
            ->table('tb_material as m')
            ->leftJoin('tbgestao_material as g', 'm.centrocusto', '=', 'g.id')
            ->select('m.*', 'g.descricao as centrocusto')
            ->where('m.codmat', $id)
            ->first();

        // 🔹 2️⃣ Se não encontrar, busca na tabela tbmaterial_aniel da conexão DBCompra
        if (!$material) {
            $material = \DB::connection('DBCompra')
                ->table('tbmaterial_aniel as m')
                ->leftJoin('tbgestao_material as g', 'm.centrocusto', '=', 'g.id')
                ->select('m.*', 'g.descricao as centrocusto')
                ->where('m.codmat', $id)
                ->first();
        }

        // 🔹 3️⃣ Se ainda assim não encontrar, retorna erro
        if (!$material) {
            return response()->json(['error' => 'Material não encontrado'], 404);
        }

        return response()->json($material, 200);
    }


    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $codmat): JsonResponse
    {
        $token = $request->header('Authorization');
        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        if (!$codmat) {
            return response()->json(['error' => 'Código do material não fornecido'], 400);
        }

        // 🔹 Buscar ID do centro de custo pelo nome (se enviado)
        $centroCustoNome = $request->input('centrocusto'); // pode vir nome ou id
        $centroCustoId = null;

        if ($centroCustoNome) {
            $centro = \DB::connection('DBCompra')
                ->table('tbgestao_material')
                ->where('descricao', $centroCustoNome)
                ->first();

            if ($centro) {
                $centroCustoId = $centro->id;
            } else {
                return response()->json(['error' => 'Centro de custo inválido'], 400);
            }
        }

        // 🔹 1️⃣ Buscar material na tabela principal
        $material = \DB::connection('DBCompra')
            ->table('tb_material')->where('codmat', $codmat)->first();
        $isEloquent = false;

        if ($material) {
            // Eloquent: usar MaterialModel se quiser save()
            $material = MaterialModel::find($material->id);
            $isEloquent = true;
        } else {
            // 🔹 2️⃣ Se não existir, buscar na tabela externa (DBCompra)
            $material = \DB::connection('DBCompra')
                ->table('tbmaterial_aniel')
                ->where('codmat', $codmat)
                ->first();

            if (!$material) {
                return response()->json(['error' => 'Material não encontrado'], 404);
            }
        }

        // 🔹 3️⃣ Atualizar campos
        $campos = [
            'descricao',
            'unid',
            'saldo',
            'status',
            'obs',
            'marca',
            'modelo',
            'ean',
            'sub_grupo',
            'resp_material',
            'patrimonio'
        ];

        $dadosAtualizar = [];
        foreach ($campos as $campo) {
            if ($request->has($campo)) {
                $dadosAtualizar[$campo] = $request->input($campo);
            }
        }

        // Se veio centrocusto, atualiza com o ID correto
        if ($centroCustoId) {
            $dadosAtualizar['centrocusto'] = $centroCustoId;
        }

        // 🔹 4️⃣ Salvar
        if ($isEloquent) {
            foreach ($dadosAtualizar as $campo => $valor) {
                $material->$campo = $valor;
            }
            $material->save();
        } else {
            \DB::connection('DBCompra')
                ->table('tbmaterial_aniel')
                ->where('codmat', $codmat)
                ->update($dadosAtualizar);
        }

        // 🔹 5️⃣ Retornar material atualizado
        $materialAtualizado = $isEloquent
            ? $material
            : \DB::connection('DBCompra')
                ->table('tbmaterial_aniel')
                ->where('codmat', $codmat)
                ->first();

        return response()->json($materialAtualizado, 200);
    }


    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, $codmat): JsonResponse
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        if (!$codmat) {
            return response()->json(['error' => 'Código do material não fornecido'], 400);
        }

        // 🔹 1️⃣ Tabela principal tb_material
        $material = MaterialModel::where('codmat', $codmat)->first();
        $isEloquent = false;

        if ($material) {
            $isEloquent = true;
        } else {
            // 🔹 2️⃣ Se não encontrar, tabela externa tbmaterial_aniel (DBCompra)
            $material = \DB::connection('DBCompra')
                ->table('tbmaterial_aniel')
                ->where('codmat', $codmat)
                ->first();

            if (!$material) {
                return response()->json(['error' => 'Material não encontrado'], 404);
            }
        }

        // 🔹 3️⃣ Deletar
        if ($isEloquent) {
            $material->delete();
        } else {
            \DB::connection('DBCompra')
                ->table('tbmaterial_aniel')
                ->where('codmat', $codmat)
                ->delete();
        }

        return response()->json(['message' => 'Material deletado com sucesso'], 200);
    }

}