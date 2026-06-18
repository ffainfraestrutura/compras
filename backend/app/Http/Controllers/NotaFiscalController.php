<?php

namespace App\Http\Controllers;

use App\Models\NotaFiscalModel;
use App\Models\ItemNotaModel;
use App\Models\MaterialModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class NotaFiscalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = DB::table('bdcompra.tbnotas_fiscais as nf')
                ->select(
                    'nf.numero',
                    'nf.serie',
                    'func.nome',
                    DB::raw("forn.razao_social AS razao_social"),
                    DB::raw("DATE_FORMAT(nf.data_emissao, '%d/%m/%Y') AS data_emissao"),
                    DB::raw("DATE_FORMAT(nf.data_entrada, '%d/%m/%Y') AS data_entrada"),
                    DB::raw("CONCAT('R$ ', FORMAT(nf.valor_total, 2, 'pt_BR')) AS valor_total"),
                    'nf.status',
                    'nf.tipo_entrada',
                    'nf.anexo',
                    'nf.obs',
                    'nf.id'
                )
                ->join('bdffa.tbfuncionario as func', 'func.matricula', '=', 'nf.matricula')
                ->join('bdcompra.tbfornecedor as forn', 'forn.id', '=', 'nf.fornecedor_id')
                ->orderBy('nf.created_at', 'desc');

            if ($request->filled('numero')) {
                $query->where('nf.numero', 'like', "%{$request->numero}%");
            }

            if ($request->filled('status')) {
                $query->where('nf.status', $request->status);
            }

            return response()->json([
                'success' => true,
                'data' => $request->filled('per_page')
                    ? $query->paginate($request->per_page)
                    : $query->get()
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        DB::beginTransaction();

        try {
            \Log::info('Iniciando store de Nota Fiscal', ['request_data' => $request->except(['anexo', 'itens'])]);

            $validator = Validator::make($request->all(), [
                'numero' => 'required|string|max:50',
                'serie' => 'nullable|string|max:20',
                'fornecedor_id' => 'required|integer',
                'data_emissao' => 'required|date',
                'data_entrada' => 'required|date|after_or_equal:data_emissao',
                'matricula' => 'required|string',
                'itens' => 'required|array|min:1',
                'itens.*.codigo_material' => 'required|string',
                'itens.*.quantidade' => 'required|numeric|min:0.001',
                'itens.*.valor_unitario' => 'required|numeric|min:0',
                'itens.*.unid' => 'nullable|string|max:10',
                'anexo' => 'required|file|mimes:pdf|max:5120', // ALTERADO: obrigatório
            ]);

            if ($validator->fails()) {
                \Log::warning('Validação falhou', ['errors' => $validator->errors()->toArray()]);
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $notaExistente = NotaFiscalModel::where('numero', $request->numero)
                ->where('serie', $request->serie)
                ->first();

            if ($notaExistente) {
                \Log::warning('Nota fiscal já existe', ['numero' => $request->numero, 'serie' => $request->serie]);
                return response()->json([
                    'success' => false,
                    'error' => 'Nota fiscal já cadastrada'
                ], 409);
            }

            $caminhoAnexo = null;

            // VERIFICAÇÃO DO ANEXO - CORRIGIDA
            if (!$request->hasFile('anexo')) {
                \Log::error('Nenhum arquivo anexo recebido na requisição');
                return response()->json([
                    'success' => false,
                    'error' => 'O anexo é obrigatório'
                ], 422);
            }

            $anexo = $request->file('anexo');

            // Validações adicionais
            if (!$anexo->isValid()) {
                \Log::error('Arquivo anexo inválido', [
                    'error_code' => $anexo->getError(),
                    'error_message' => $anexo->getErrorMessage()
                ]);
                return response()->json([
                    'success' => false,
                    'error' => 'Arquivo inválido: ' . $anexo->getErrorMessage()
                ], 422);
            }

            if ($anexo->getSize() > 5 * 1024 * 1024) {
                \Log::error('Arquivo anexo muito grande', ['size' => $anexo->getSize()]);
                return response()->json([
                    'success' => false,
                    'error' => 'O arquivo deve ter no máximo 5MB'
                ], 422);
            }

            if ($anexo->getMimeType() !== 'application/pdf') {
                \Log::error('Arquivo anexo não é PDF', ['mime_type' => $anexo->getMimeType()]);
                return response()->json([
                    'success' => false,
                    'error' => 'Apenas arquivos PDF são permitidos'
                ], 422);
            }

            try {
                \Log::info('Processando upload do anexo', [
                    'file_name' => $anexo->getClientOriginalName(),
                    'file_size' => $anexo->getSize(),
                    'file_mime' => $anexo->getMimeType(),
                ]);

                // Cria estrutura de pasta no public/notas-fiscais
                $pasta = 'notas-fiscais/' . date('Y/m');
                $publicPath = public_path($pasta);

                // Cria a pasta se não existir
                if (!file_exists($publicPath)) {
                    mkdir($publicPath, 0777, true);
                }

                // Gera nome único para o arquivo
                $nomeArquivo = 'nf_' . $request->numero . '_' . time() . '_' . uniqid() . '.pdf';

                // Move o arquivo para a pasta public/notas-fiscais
                $anexo->move($publicPath, $nomeArquivo);

                // Caminho relativo para salvar no banco
                $caminhoAnexo = $pasta . '/' . $nomeArquivo;

                \Log::info('Arquivo salvo com sucesso', [
                    'caminho' => $caminhoAnexo,
                    'caminho_completo' => public_path($caminhoAnexo)
                ]);

            } catch (\Throwable $e) {
                \Log::error('Erro no upload do anexo', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);

                // NÃO CONTINUA - lança exceção
                throw new \Exception("Falha no upload do anexo: " . $e->getMessage());
            }

            \Log::info('Criando registro da nota fiscal', [
                'numero' => $request->numero,
                'fornecedor_id' => $request->fornecedor_id,
                'tem_anexo' => !is_null($caminhoAnexo)
            ]);

            $nota = NotaFiscalModel::create([
                'numero' => $request->numero,
                'serie' => $request->serie,
                'fornecedor_id' => $request->fornecedor_id,
                'data_emissao' => $request->data_emissao,
                'data_entrada' => $request->data_entrada,
                'status' => 'pendente',
                'tipo_entrada' => 'manual',
                'anexo' => $caminhoAnexo,
                'obs' => $request->obs,
                'matricula' => $request->matricula,
                'valor_total' => 0
            ]);

            \Log::info('Nota fiscal criada', ['nota_id' => $nota->id]);

            $valorTotal = 0;

            foreach ($request->itens as $index => $item) {
                \Log::info('Processando item ' . ($index + 1), [
                    'codigo_material' => $item['codigo_material'] ?? 'n/a',
                    'quantidade' => $item['quantidade'] ?? 0,
                    'valor_unitario' => $item['valor_unitario'] ?? 0,
                ]);

                $material = MaterialModel::where('codmat', $item['codigo_material'])->first();

                if (!$material) {
                    \Log::error('Material não encontrado', ['codigo' => $item['codigo_material']]);
                    throw new \Exception("Material {$item['codigo_material']} não encontrado");
                }

                $totalItem = $item['quantidade'] * $item['valor_unitario'];

                ItemNotaModel::create([
                    'nota_fiscal_id' => $nota->id,
                    'codigo_material' => $item['codigo_material'],
                    'descricao' => $item['descricao'] ?? $material->descricao,
                    'quantidade' => $item['quantidade'],
                    'unid' => $item['unid'] ?? $material->unidade_medida,
                    'valor_unitario' => $item['valor_unitario'],
                    'valor_total' => $totalItem,
                    'numero_lote' => $item['numero_lote'] ?? null,
                    'obs' => $item['obs'] ?? null
                ]);

                $valorTotal += $totalItem;
            }

            $nota->update(['valor_total' => $valorTotal]);

            \Log::info('Valor total calculado', ['valor_total' => $valorTotal]);

            DB::commit();

            \Log::info('Nota fiscal criada com sucesso', [
                'nota_id' => $nota->id,
                'valor_total' => $valorTotal,
                'anexo' => $caminhoAnexo
            ]);

            // Retorna URL completa para acessar o arquivo
            $anexoUrl = $caminhoAnexo ? url($caminhoAnexo) : null;

            return response()->json([
                'success' => true,
                'message' => 'Nota fiscal criada com sucesso',
                'data' => [
                    'nota' => $nota,
                    'anexo_url' => $anexoUrl
                ]
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();

            \Log::error('Erro ao salvar NF', [
                'erro' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->except(['anexo', 'itens'])
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Erro interno: ' . $e->getMessage()
            ], 500);
        }
    }
    public function show(int $id): JsonResponse
    {
        try {
            \Log::info('Buscando nota fiscal ID: ' . $id);

            // Buscar a nota com todos os relacionamentos necessários
            $nota = NotaFiscalModel::find($id);

            if (!$nota) {
                \Log::warning('Nota fiscal não encontrada: ' . $id);
                return response()->json([
                    'success' => false,
                    'error' => 'Nota fiscal não encontrada'
                ], 404);
            }

            // Log para debug
            \Log::info('Nota encontrada:', [
                'id' => $nota->id,
                'numero' => $nota->numero,
                'itens_count' => $nota->itens ? count($nota->itens) : 0,
                'has_itens' => !empty($nota->itens),
                'itens' => $nota->itens ? $nota->itens->toArray() : []
            ]);

            // Se não trouxer itens pelo relacionamento, buscar manualmente
            if (!$nota->itens || $nota->itens->isEmpty()) {
                \Log::warning('Itens não carregados pelo relacionamento, buscando manualmente');
                $itens = ItemNotaModel::where('nota_fiscal_id', $id)->get();
                $nota->setRelation('itens', $itens);

                \Log::info('Itens buscados manualmente:', [
                    'count' => $itens->count(),
                    'itens' => $itens->toArray()
                ]);
            }

            // Garantir que os campos sejam strings para o frontend
            $nota->numero = (string) $nota->numero;
            $nota->serie = $nota->serie ? (string) $nota->serie : '';

            // Formatar os dados para o frontend
            $data = [
                'id' => $nota->id,
                'numero' => $nota->numero,
                'serie' => $nota->serie,
                'fornecedor_id' => $nota->fornecedor_id,
                'data_emissao' => $nota->data_emissao,
                'data_entrada' => $nota->data_entrada,
                'status' => $nota->status,
                'tipo_entrada' => $nota->tipo_entrada,
                'anexo' => $nota->anexo,
                'obs' => $nota->obs,
                'matricula' => $nota->matricula,
                'valor_total' => $nota->valor_total,
                'created_at' => $nota->created_at,
                'updated_at' => $nota->updated_at,
                'fornecedor' => $nota->fornecedor ? [
                    'id' => $nota->fornecedor->id,
                    'nome_fantasia' => $nota->fornecedor->nome_fantasia,
                    'razao_social' => $nota->fornecedor->razao_social
                ] : null,
                'itens' => $nota->itens ? $nota->itens->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'codigo_material' => $item->codigo_material,
                        'descricao' => $item->descricao,
                        'quantidade' => (float) $item->quantidade,
                        'unid' => $item->unid,
                        'valor_unitario' => (float) $item->valor_unitario,
                        'valor_total' => (float) $item->valor_total,
                        'numero_lote' => $item->numero_lote,
                        'obs' => $item->obs,
                        'nota_fiscal_id' => $item->nota_fiscal_id
                    ];
                })->toArray() : []
            ];

            \Log::info('Dados formatados para resposta:', [
                'numero' => $data['numero'],
                'itens_count' => count($data['itens']),
                'has_fornecedor' => !empty($data['fornecedor'])
            ]);

            return response()->json([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Throwable $e) {
            \Log::error('Erro ao buscar nota fiscal', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Erro ao buscar nota fiscal: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $nota = NotaFiscalModel::findOrFail($id);
            $nota->update(['status' => 'cancelada']);

            return response()->json([
                'success' => true,
                'message' => 'Nota fiscal cancelada'
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        DB::beginTransaction();

        try {
            \Log::info('Iniciando update de Nota Fiscal', [
                'id' => $id,
                'request_data' => $request->except(['anexo', 'itens'])
            ]);

            $validator = Validator::make($request->all(), [
                'numero' => 'required|string|max:50',
                'serie' => 'nullable|string|max:20',
                'fornecedor_id' => 'required|integer',
                'data_emissao' => 'required|date',
                'data_entrada' => 'required|date|after_or_equal:data_emissao',
                'matricula' => 'required|string',
                'itens' => 'required|array|min:1',
                'itens.*.codigo_material' => 'required|string',
                'itens.*.quantidade' => 'required|numeric|min:0.001',
                'itens.*.valor_unitario' => 'required|numeric|min:0',
                'itens.*.unid' => 'nullable|string|max:10',
                'anexo' => 'nullable|file|mimes:pdf|max:5120', // Agora nullable para edição
            ]);

            if ($validator->fails()) {
                \Log::warning('Validação falhou', ['errors' => $validator->errors()->toArray()]);
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $nota = NotaFiscalModel::findOrFail($id);

            // Verificar se nota pode ser editada (não cancelada)
            if ($nota->status === 'cancelada') {
                return response()->json([
                    'success' => false,
                    'error' => 'Nota fiscal cancelada não pode ser editada'
                ], 400);
            }

            // Verificar se número/série já existe (excluindo a própria nota)
            $notaExistente = NotaFiscalModel::where('numero', $request->numero)
                ->where('serie', $request->serie)
                ->where('id', '!=', $id)
                ->first();

            if ($notaExistente) {
                \Log::warning('Nota fiscal já existe', ['numero' => $request->numero, 'serie' => $request->serie]);
                return response()->json([
                    'success' => false,
                    'error' => 'Já existe outra nota fiscal com este número e série'
                ], 409);
            }

            $caminhoAnexo = $nota->anexo; // Mantém o anexo existente

            if ($request->hasFile('anexo')) {
                try {
                    $anexo = $request->file('anexo');

                    \Log::info('Processando upload do novo anexo', [
                        'file_name' => $anexo->getClientOriginalName(),
                        'file_size' => $anexo->getSize(),
                        'file_mime' => $anexo->getMimeType(),
                    ]);

                    // Remove arquivo antigo se existir
                    if ($caminhoAnexo && file_exists(public_path($caminhoAnexo))) {
                        unlink(public_path($caminhoAnexo));
                        \Log::info('Arquivo antigo removido', ['caminho' => $caminhoAnexo]);
                    }

                    // Cria estrutura de pasta no public/notas-fiscais
                    $pasta = 'notas-fiscais/' . date('Y/m');
                    $publicPath = public_path($pasta);

                    // Cria a pasta se não existir
                    if (!file_exists($publicPath)) {
                        mkdir($publicPath, 0777, true);
                    }

                    // Gera nome único para o arquivo
                    $nomeArquivo = 'nf_' . $request->numero . '_' . time() . '_' . uniqid() . '.pdf';

                    // Move o arquivo para a pasta public/notas-fiscais
                    $anexo->move($publicPath, $nomeArquivo);

                    // Caminho relativo para salvar no banco
                    $caminhoAnexo = $pasta . '/' . $nomeArquivo;

                    \Log::info('Novo arquivo salvo com sucesso', [
                        'caminho' => $caminhoAnexo,
                        'caminho_completo' => public_path($caminhoAnexo)
                    ]);

                } catch (\Throwable $e) {
                    \Log::error('Erro no upload do anexo', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);

                    throw new \Exception("Falha no upload do anexo: " . $e->getMessage());
                }
            }

            \Log::info('Atualizando registro da nota fiscal', [
                'nota_id' => $nota->id,
                'tem_anexo' => !is_null($caminhoAnexo)
            ]);

            // Atualizar dados principais
            $nota->update([
                'numero' => $request->numero,
                'serie' => $request->serie,
                'fornecedor_id' => $request->fornecedor_id,
                'data_emissao' => $request->data_emissao,
                'data_entrada' => $request->data_entrada,
                'anexo' => $caminhoAnexo,
                'obs' => $request->obs,
                'matricula' => $request->matricula,
            ]);

            // Remover itens antigos
            ItemNotaModel::where('nota_fiscal_id', $nota->id)->delete();
            \Log::info('Itens antigos removidos');

            $valorTotal = 0;

            // Adicionar novos itens
            foreach ($request->itens as $index => $item) {
                \Log::info('Processando item ' . ($index + 1), [
                    'codigo_material' => $item['codigo_material'] ?? 'n/a',
                    'quantidade' => $item['quantidade'] ?? 0,
                    'valor_unitario' => $item['valor_unitario'] ?? 0,
                ]);

                $material = MaterialModel::where('codmat', $item['codigo_material'])->first();

                if (!$material) {
                    \Log::error('Material não encontrado', ['codigo' => $item['codigo_material']]);
                    throw new \Exception("Material {$item['codigo_material']} não encontrado");
                }

                $totalItem = $item['quantidade'] * $item['valor_unitario'];

                ItemNotaModel::create([
                    'nota_fiscal_id' => $nota->id,
                    'codigo_material' => $item['codigo_material'],
                    'descricao' => $item['descricao'] ?? $material->descricao,
                    'quantidade' => $item['quantidade'],
                    'unid' => $item['unid'] ?? $material->unidade_medida,
                    'valor_unitario' => $item['valor_unitario'],
                    'valor_total' => $totalItem,
                    'numero_lote' => $item['numero_lote'] ?? null,
                    'obs' => $item['obs'] ?? null
                ]);

                $valorTotal += $totalItem;
            }

            $nota->update(['valor_total' => $valorTotal]);

            \Log::info('Valor total atualizado', ['valor_total' => $valorTotal]);

            DB::commit();

            \Log::info('Nota fiscal atualizada com sucesso', [
                'nota_id' => $nota->id,
                'valor_total' => $valorTotal,
                'anexo' => $caminhoAnexo
            ]);

            // Retorna URL completa para acessar o arquivo
            $anexoUrl = $caminhoAnexo ? url($caminhoAnexo) : null;

            return response()->json([
                'success' => true,
                'message' => 'Nota fiscal atualizada com sucesso',
                'data' => [
                    'nota' => $nota->fresh([]),
                    'anexo_url' => $anexoUrl
                ]
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();

            \Log::error('Erro ao atualizar NF', [
                'erro' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->except(['anexo', 'itens'])
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Erro interno: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getAnexo(int $id): JsonResponse
    {
        try {
            $nota = NotaFiscalModel::findOrFail($id);

            if (!$nota->anexo) {
                return response()->json([
                    'success' => false,
                    'error' => 'Nota fiscal não possui anexo'
                ], 404);
            }

            $caminhoCompleto = public_path($nota->anexo);

            if (!file_exists($caminhoCompleto)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Arquivo não encontrado no servidor'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'anexo_url' => url($nota->anexo),
                    'anexo_path' => $nota->anexo,
                    'nota_numero' => $nota->numero
                ]
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
