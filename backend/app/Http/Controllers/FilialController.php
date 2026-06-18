<?php

namespace App\Http\Controllers;

use App\Models\FilialModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class FilialController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(): JsonResponse
    {
        $filial = FilialModel::all();

        return Response()->json($filial, 200);
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
                'CNPJ' => 'required|string|max:10',
                'endereco' => 'required|string|max:255',
                'numero' => 'numeric|min:0',
                'complemento' => 'string|max:50',
                'bairro' => 'nullable|string',
                'cidade' => 'nullable|string',
                'estado' => 'nullable|string',
                'cep' => 'nullable|string|max:50',
                'telefone' => 'nullable|string',
                'mail' => 'nullable|string',
                'telefone2' => 'nullable|string',
                'razsocial' => 'required|string|max:255'
            ]);

            // $validated['data_cadastro'] = now();
            // $validated['codmat'] = substr($validated['centrocusto'], 0, 3) . uniqid();


            $solicitacao = FilialModel::create($validated);

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

        $filial = FilialModel::find($id);

        if (!$filial) {
            return response()->json(['error' => 'Material não encontrada'], 404);
        }

        return response()->json($filial, 200);
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
    public function update(Request $request, $id): JsonResponse
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        if (!$id) {
            return response()->json(['error' => 'ID da solicitação não fornecido'], 400);
        }

        $material = FilialModel::find($id);

        if (!$material) {
            return response()->json(['error' => 'Material não encontrada'], 404);
        }

        $campos = [
            'descricao',
            'unid',
            'centrocusto',
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

        foreach ($campos as $campo) {
            if ($request->has($campo)) {
                $material->$campo = $request->input($campo);
            }
        }

        $material->save();

        return response()->json($material, 200);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['error' => 'Token não fornecido'], 401);
        }

        if (!$id) {
            return response()->json(['error' => 'ID da solicitação não fornecido'], 400);
        }

        $material = FilialModel::find($id);

        if (!$material) {
            return response()->json(['error' => 'Material não encontrada'], 404);
        }

        $material->delete();

        return response()->json($material, 200);
    }
}
