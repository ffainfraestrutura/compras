<?php

namespace App\Http\Controllers;

use App\Models\FornecedoresModel;
use App\Models\SolCompraModel;
use App\Jobs\EnviarCotacaoEmailJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FornecedoresController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        try {
            $query = FornecedoresModel::select(
                'id',
                'razao_social',
                'nome_fantasia',
                'cnpj',
                'inscricao_estadual',
                'telefone',
                'email',
                'site',
                'endereco',
                'cidade',
                'estado',
                'cep',
                'nome_contato',
                'telefone_contato',
                'email_contato',
                'categoria',
                'ativo',
                'data_cadastro',
                'observacoes'
            )->orderBy('nome_fantasia');

            $fornecedores = $query->get();

            return response()->json($fornecedores, 200);

        } catch (\Exception $e) {
            Log::error('Erro na busca de fornecedores: ' . $e->getMessage());
            return response()->json(['error' => 'Erro interno do servidor'], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $token = $request->header('Authorization');

            if (!$token) {
                return response()->json(['error' => 'Token não fornecido'], 401);
            }

            $validated = $request->validate([
                'razao_social' => 'required|string|max:255',
                'nome_fantasia' => 'required|string|max:255',
                'cnpj' => 'required|string|max:20',
                'inscricao_estadual' => 'required|string|max:50',
                'telefone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'site' => 'nullable|string|max:255',
                'endereco' => 'nullable|string|max:255',
                'cidade' => 'nullable|string|max:100',
                'estado' => 'nullable|string|max:50',
                'cep' => 'required|string|max:20',
                'nome_contato' => 'nullable|string|max:100',
                'telefone_contato' => 'nullable|string|max:20',
                'email_contato' => 'nullable|email|max:255',
                'categoria' => 'nullable|string|max:100',
                'ativo' => 'required|boolean',
                'observacoes' => 'nullable|string',
            ]);

            $validated['data_cadastro'] = now();

            $fornecedor = FornecedoresModel::create($validated);

            return response()->json($fornecedor, 201);

        } catch (\Exception $e) {
            Log::error('Erro ao criar fornecedor: ' . $e->getMessage());
            return response()->json(['error' => 'Erro ao criar fornecedor.', 'message' => $e->getMessage()], 400);
        }
    }

    /**
     * Display the specified resource.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show($id): JsonResponse
    {
        if (!$id) {
            return response()->json(['error' => 'ID do fornecedor não fornecido'], 400);
        }

        $fornecedor = FornecedoresModel::find($id);

        if (!$fornecedor) {
            return response()->json(['error' => 'Fornecedor não encontrado'], 404);
        }

        return response()->json($fornecedor, 200);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $token = $request->header('Authorization');

            if (!$token) {
                return response()->json(['error' => 'Token não fornecido'], 401);
            }

            if (!$id) {
                return response()->json(['error' => 'ID do fornecedor não fornecido'], 400);
            }

            $fornecedor = FornecedoresModel::find($id);

            if (!$fornecedor) {
                return response()->json(['error' => 'Fornecedor não encontrado'], 404);
            }

            $campos = [
                'razao_social',
                'nome_fantasia',
                'cnpj',
                'inscricao_estadual',
                'telefone',
                'email',
                'site',
                'endereco',
                'cidade',
                'estado',
                'cep',
                'nome_contato',
                'telefone_contato',
                'email_contato',
                'categoria',
                'ativo',
                'observacoes'
            ];

            foreach ($campos as $campo) {
                if ($request->has($campo)) {
                    $fornecedor->$campo = $request->input($campo);
                }
            }

            $fornecedor->save();

            return response()->json($fornecedor, 200);

        } catch (\Exception $e) {
            Log::error('Erro ao atualizar fornecedor: ' . $e->getMessage());
            return response()->json(['error' => 'Erro ao atualizar fornecedor'], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        try {
            $token = $request->header('Authorization');

            if (!$token) {
                return response()->json(['error' => 'Token não fornecido'], 401);
            }

            if (!$id) {
                return response()->json(['error' => 'ID do fornecedor não fornecido'], 400);
            }

            $fornecedor = FornecedoresModel::find($id);

            if (!$fornecedor) {
                return response()->json(['error' => 'Fornecedor não encontrado'], 404);
            }

            $fornecedor->delete();

            return response()->json($fornecedor, 200);

        } catch (\Exception $e) {
            Log::error('Erro ao deletar fornecedor: ' . $e->getMessage());
            return response()->json(['error' => 'Erro ao deletar fornecedor'], 500);
        }
    }

    /**
     * Get recommended suppliers for a purchase
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function fornecedores_recomendados(Request $request): JsonResponse
    {
        try {
            $codCompra = $request->input('cod_compra');

            if (!$codCompra) {
                return response()->json(['error' => 'cod_compra é obrigatório'], 400);
            }

            // Buscar fornecedores completos que já forneceram materiais para esta compra
            $fornecedores = DB::table('bdcompra.tbsol_compra as sc')
                ->join('bdcompra.tbmateriais_cotados as mc', 'sc.cod_material', '=', 'mc.cod_material')
                ->join('bdcompra.tbfornecedor as f', 'f.id', '=', 'mc.fornecedor_id')
                ->select('f.*')
                ->where('sc.cod_compra', $codCompra)
                ->groupBy('f.id', 'f.razao_social', 'f.nome_fantasia', 'f.cnpj', 'f.inscricao_estadual', 
                         'f.telefone', 'f.email', 'f.site', 'f.endereco', 'f.cidade', 'f.estado', 
                         'f.cep', 'f.nome_contato', 'f.telefone_contato', 'f.email_contato', 
                         'f.categoria', 'f.ativo', 'f.data_cadastro', 'f.observacoes')
                ->orderBy('f.nome_fantasia')
                ->get();

            return response()->json($fornecedores, 200);

        } catch (\Exception $e) {
            Log::error('Erro ao buscar fornecedores recomendados: ' . $e->getMessage());
            return response()->json(['error' => 'Erro interno do servidor'], 500);
        }
    }

    /**
     * Send quotation emails to selected suppliers (ASYNCHRONOUS)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function enviarCotacao(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'cod_compra' => 'required|string',
                'fornecedores' => 'required|array',
                'fornecedores.*.id' => 'required|integer',
                'fornecedores.*.nome' => 'required|string'
            ]);

            $codCompra = $request->cod_compra;
            $fornecedoresSelecionados = $request->fornecedores;

            // Buscar dados da compra
            $compra = SolCompraModel::where('cod_compra', $codCompra)->first();

            if (!$compra) {
                return response()->json([
                    'success' => false,
                    'message' => 'Compra não encontrada'
                ], 404);
            }

            $emailsEnviados = [];
            $emailsFalharam = [];
            $jobsDispatched = 0;

            foreach ($fornecedoresSelecionados as $fornecedorData) {
                // Buscar fornecedor pelo ID usando o Model diretamente
                $fornecedor = FornecedoresModel::find($fornecedorData['id']);

                if (!$fornecedor) {
                    $emailsFalharam[] = [
                        'nome' => $fornecedorData['nome'],
                        'motivo' => 'Fornecedor não encontrado no sistema'
                    ];
                    continue;
                }

                // Priorizar email_contato, depois email
                $emailDestino = $fornecedor->email_contato ?? $fornecedor->email;
                
                // Email de teste (mantido como solicitado)
                // $emailDestino = 'desenvolvimento@ffainfraestrutura.com.br';

                if (empty($emailDestino)) {
                    $emailsFalharam[] = [
                        'nome' => $fornecedor->nome_fantasia ?? $fornecedorData['nome'],
                        'motivo' => 'Nenhum e-mail cadastrado (email_contato e email estão vazios)'
                    ];
                    continue;
                }

                // Gerar link único para o fornecedor
                $cnpj = preg_replace('/[^0-9]/', '', $fornecedor->cnpj ?? '');
                $link = "https://ffasip.ddns.net:4545/compras/public_route/{$codCompra}/{$cnpj}";
                $dataLimite = now()->addDays(5)->format('d/m/Y');
                $fornecedorNome = $fornecedor->nome_fantasia ?? $fornecedorData['nome'];

                // Disparar job assíncrono para enviar o e-mail
                try {
                    EnviarCotacaoEmailJob::dispatch(
                        $emailDestino,
                        $fornecedorNome,
                        $codCompra,
                        $link,
                        $dataLimite
                    )->onQueue('emails'); // Enviar para fila específica de emails

                    $jobsDispatched++;
                    
                    $emailsEnviados[] = [
                        'nome' => $fornecedorNome,
                        'email' => $emailDestino,
                        'status' => 'Fila de envio - Processando assíncronamente'
                    ];

                    // Registrar que a cotação foi enviada para a fila
                    $this->registrarEnvioCotacao($codCompra, $fornecedor->id, $emailDestino, 'queued');

                } catch (\Exception $e) {
                    Log::error("Erro ao disparar job para {$emailDestino}: " . $e->getMessage());
                    $emailsFalharam[] = [
                        'nome' => $fornecedorNome,
                        'email' => $emailDestino,
                        'motivo' => 'Erro ao adicionar na fila de envio: ' . $e->getMessage()
                    ];
                }
            }

            $response = [
                'success' => true,
                'message' => "Processo de envio concluído. {$jobsDispatched} e-mail(s) adicionado(s) à fila.",
                'enviados' => $emailsEnviados,
                'falhas' => $emailsFalharam,
                'total_dispatched' => $jobsDispatched
            ];

            // Se todos falharam, retornar erro
            if (count($emailsEnviados) === 0) {
                $response['success'] = false;
                $response['message'] = 'Nenhum e-mail foi adicionado à fila. Verifique os cadastros dos fornecedores.';
            }

            return response()->json($response);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro de validação',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erro ao processar envio de cotações: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro interno ao processar envio: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Register quotation sending in log table
     *
     * @param string $codCompra
     * @param int $fornecedorId
     * @param string $email
     * @param string $status
     * @return void
     */
    private function registrarEnvioCotacao($codCompra, $fornecedorId, $email, $status = 'queued'): void
    {
        try {
            // Verificar se a tabela existe, se não, criar
            if (!\Schema::hasTable('cotacoes_enviadas')) {
                \Schema::create('cotacoes_enviadas', function ($table) {
                    $table->id();
                    $table->string('cod_compra');
                    $table->integer('fornecedor_id');
                    $table->string('email_enviado_para');
                    $table->string('status')->default('queued');
                    $table->timestamp('data_envio');
                    $table->timestamps();
                });
            }
            
            // Registrar em uma tabela de logs de envio
            \DB::table('cotacoes_enviadas')->insert([
                'cod_compra' => $codCompra,
                'fornecedor_id' => $fornecedorId,
                'email_enviado_para' => $email,
                'status' => $status,
                'data_envio' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao registrar envio de cotação: ' . $e->getMessage());
        }
    }
}