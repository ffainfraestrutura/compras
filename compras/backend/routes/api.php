<?php

use App\Http\Controllers\AjudaController;
use App\Http\Controllers\AssociacaoController;
use App\Http\Controllers\CentroCustoController;
use App\Http\Controllers\CotacaoController;
use App\Http\Controllers\FilialController;
use App\Http\Controllers\ForgotPasswordController;
use App\Http\Controllers\FornecedoresController;
use App\Http\Controllers\GestorMaterialController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\NotaFiscalController;
use App\Http\Controllers\RegisterController;
use App\Http\Controllers\SolCompraController;
use App\Http\Controllers\UploadsController;
use App\Http\Controllers\UnidadeController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RelatorioController;



// ============================================================================
// =========================Rotas de Autenticação==============================
// ============================================================================
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [RegisterController::class, 'register']);
Route::post('/forgotpassword', [ForgotPasswordController::class, 'updatePassword']);
Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
});
Route::get('/verify-token', function () {
    try {
        $user = JWTAuth::parseToken()->authenticate();

        return response()->json([
            'status' => 'valid',
            'user' => $user
        ], 200);

    } catch (\Exception $e) {
        return response()->json([
            'status' => 'invalid',
            'message' => $e->getMessage()
        ], 401);
    }
});


// ============================================================================
// =========================Rotas de Cadastos==================================
// ============================================================================
Route::apiResource('/filiais', FilialController::class);
Route::get('/ccusto', [SolCompraController::class, 'list_ccusto']);
Route::apiResource('/materiais', MaterialController::class);
Route::apiResource('/fornecedores', FornecedoresController::class);
Route::get('/fornecedores_recomendados', [FornecedoresController::class, 'fornecedores_recomendados']);
Route::apiResource('/centrocusto', CentroCustoController::class);
Route::apiResource('/unidades', UnidadeController::class);
Route::get('/usuarios', [UserController::class, 'index']);
Route::put('/usuario/{matricula}', [UserController::class, 'update']);
Route::put('/usuario/{matricula}/centros', [GestorMaterialController::class, 'update']);



// ============================================================================
// =========================Sistema de Compras=================================
// ============================================================================
Route::post('/solcompra', [SolCompraController::class, 'store']);
Route::get('/aprovarcompra', [SolCompraController::class, 'index']);
Route::get('/aprovarcompra2', [SolCompraController::class, 'index2']);
Route::get('/aprovarcompraadm', [SolCompraController::class, 'index_adm']);
Route::get('/finalizadas', [SolCompraController::class, 'finalizadas']);
Route::get('/materiais_comprados', [SolCompraController::class, 'materiais_comprados']);
Route::put('/marcar_entregue', [SolCompraController::class, 'marcar_entregue']);
Route::put('/finalizar', [SolCompraController::class, 'finalizar']);
Route::get('/aprovarcompra/agrupado_material', [SolCompraController::class, 'solicitacoesCodMaterial']);
Route::put('/aprovarcompra', [SolCompraController::class, 'update']);
Route::put('/aprovarcompra_gerente_material', [SolCompraController::class, 'update_gerente_material']);
Route::get('/itens_agrupados', [SolCompraController::class, 'itens_agrupados']);
Route::get('/aprovarcompra/detalhescompra/{cod_compra}', [SolCompraController::class, 'show']);
Route::get('/relatoriogeral/detalhescompra/{cod_compra}', [SolCompraController::class, 'detalhes_solicitacao']);
Route::put('/aprovarcompra/detalhescompra/', [SolCompraController::class, 'update_produto']);
Route::get('minhassolicitacoes', [SolCompraController::class, 'minhas_solicitacoes']);
Route::put('/retornarprocesso', [SolCompraController::class, 'retornar_processo']);
Route::get('/retornos/{cod_compra}', [SolCompraController::class, 'listar_retorno']);
Route::put('/finalizarretorno', [SolCompraController::class, 'finalizar_retorno']);
Route::get('/cotacaoCompra/{cod_compra}', [CotacaoController::class, 'index']);
Route::get('/todassolicitacoes', [SolCompraController::class, 'todas_solicitacoes']);
Route::get('/solicitacoesequipe', [SolCompraController::class, 'solicitacoes_equipe']);
Route::get('/cotacaoMaterial/{cod_material}', [CotacaoController::class, 'cotacaoCodMaterial']);
Route::post('/cotacaoMaterial/{cod_material}', [CotacaoController::class, 'storeMaterial']);
Route::post('/cotacaoMaterial/{cod_material}/salvar', [CotacaoController::class, 'storeMaterialDraft']);
Route::get('/historico/{cod_compra}', [SolCompraController::class, 'historico_solicitacao']);
Route::post('/cotacaoCompra/{cod_compra}', [CotacaoController::class, 'store']); // Salvar cotação
Route::post('/cotacao/{cod_compra}/finalizar', [CotacaoController::class, 'finalizarCotacao']); // Finalizar processo  
Route::get('/cotacao/{cod_compra}/existentes', [CotacaoController::class, 'getCotacoesExistentes']); // Buscar cotações existentes 
Route::get('/cotacaoMaterial/{cod_material}/existentes', [CotacaoController::class, 'getCotacoesMaterial']);
Route::post('/cotacaoMaterial/{cod_material}/reativar', [CotacaoController::class, 'reativarCotacaoMaterial']);
Route::get('/cotacao/{cod_cotacao}', [CotacaoController::class, 'getCotacoes']);
Route::get('/detalhes/material/{cod_material}', [SolCompraController::class, 'detalhesMaterial']);
Route::get('/solicitacoesentregues', [SolCompraController::class, 'solicitacoes_entregues']);
Route::get('/associacao/dados', [AssociacaoController::class, 'getDados']);
Route::post('/associacao/confirmar', [AssociacaoController::class, 'confirmar']);
Route::post('/associacoes/pendentes', [AssociacaoController::class, 'buscarAssociacoesPendentesAvaliacao']);
Route::get('/materiais-unificados', [SolCompraController::class, 'listarMateriaisUnificados']);
Route::post('/associacoes/finalizar', [AssociacaoController::class, 'finalizar']);
Route::get('/aprovarcompra_gerente_material', [SolCompraController::class, 'listar_gerencia']);
Route::post('/upload/documentos', [UploadsController::class, 'upload']);
Route::post('/upload/materiais', [UploadsController::class, 'importar_compra']);
Route::get('/download-modelo', [UploadsController::class, 'downloadModelo']);
Route::get('/documentos/listar/{codCompra}', [UploadsController::class, 'listar']);
Route::get('/documentos/download/{id}', [UploadsController::class, 'download']);
Route::delete('/documentos/{id}', [UploadsController::class, 'destroy']);
Route::post('/enviar/material', [SolCompraController::class, 'enviar_material']);
Route::post('/itens_agrupados_adm', [SolCompraController::class, 'itens_agrupados_adm']);
Route::put('/solicitacoes/{cod_compra}/cancelar', [SolCompraController::class, 'cancelar_compra']);
Route::post('/agrupar-cotacoes', [CotacaoController::class, 'agruparCotacoes']);
Route::get('/checar-material', [SolCompraController::class, 'checar_material']);
Route::delete('/aprovarcompra/detalhescompra/{id}', [SolCompraController::class, 'destroy_item']);
Route::post('/aprovarcompra/detalhescompra/lista', [SolCompraController::class, 'adicionar_itens']);
Route::post('/aprovarcompra/detalhescompra', [SolCompraController::class, 'adicionar_item']);
Route::put('/aprovarcompra/detalhescompra', [SolCompraController::class, 'update_produto']);
Route::post('/checar-material-marcar', [SolCompraController::class, 'marcarComoChecado']);
Route::post('/enviar-cotacao-fornecedores', [FornecedoresController::class, 'enviarCotacao']);

// =================== Upload =====================
Route::post('uploads/multiplo', [UploadsController::class, 'uploadMultiplo']);
Route::get('uploads/listar/{codCompra}', [UploadsController::class, 'listarDocumentos']);
Route::delete('uploads/documento/{id}', [UploadsController::class, 'destroyDocumento']);
Route::delete('uploads/compra/{codCompra}', [UploadsController::class, 'destroyDocumentosByCompra']);
Route::get('uploads/download/hash/{hash}', [UploadsController::class, 'downloadByHash']);
Route::get('uploads/limites/{codCompra}', [UploadsController::class, 'verificarLimitesUpload']);

// =================== Relatorios =====================
Route::get('/relatorio/relatorio-geral', [RelatorioController::class,'relatorioGeral']);




Route::prefix('notasfiscais')->group(function () {
    Route::get('/', [NotaFiscalController::class, 'index']);
    Route::post('/', [NotaFiscalController::class, 'store']);
    Route::get('/{id}', [NotaFiscalController::class, 'show']);
    Route::put('/{id}', [NotaFiscalController::class, 'update']);
    Route::delete('/{id}', [NotaFiscalController::class, 'destroy']);

    // Rotas adicionais
    Route::patch('/{id}/status', [NotaFiscalController::class, 'updateStatus']);
    Route::get('/relatorio/geral', [NotaFiscalController::class, 'relatorio']);
});

Route::prefix('ajuda')->group(function () {
    Route::get('/modulos', [AjudaController::class, 'index']);
    Route::get('/modulos/{id}', [AjudaController::class, 'show']);

    // Se quiser permitir criar módulos sem autenticação (opcional)
    Route::post('/modulos', [AjudaController::class, 'store']);
});


// =================== Rotas Publicas =====================
Route::get('/public-index-cotacao/{cod_compra}/{cnpj}', [CotacaoController::class,'publicIndex']);