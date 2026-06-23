<?php

namespace App\Http\Controllers;

use App\Models\DocumentoCompra;
use App\Models\SolCompraModel;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Log;
use PhpOffice\PhpSpreadsheet\IOFactory;


class UploadsController extends Controller
{
    /**
     * Upload de documentos da compra
     */
    public function upload(Request $request)
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

            // Validar os dados
            $validator = Validator::make($request->all(), [
                'cod_compra' => 'required|string',
                'arquivo_1' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png',
                'arquivo_2' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png',
            ]);

            if ($validator->fails()) {

                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verificar se pelo menos um arquivo foi enviado
            if (!$request->hasFile('arquivo_1') && !$request->hasFile('arquivo_2')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nenhum arquivo foi enviado.'
                ], 400);
            }

            $uploadedFiles = [];
            $matricula = $user->matricula;

            // Processar arquivo 1
            if ($request->hasFile('arquivo_1')) {
                $file = $request->file('arquivo_1');


                $result = $this->processarUpload($file, $request->cod_compra, 1, $matricula);
                if ($result) {
                    $uploadedFiles[] = $result;
                }
            }

            // Processar arquivo 2
            if ($request->hasFile('arquivo_2')) {
                $file = $request->file('arquivo_2');


                $result = $this->processarUpload($file, $request->cod_compra, 2, $matricula);
                if ($result) {
                    $uploadedFiles[] = $result;
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Documentos enviados com sucesso!',
                'data' => $uploadedFiles
            ], 200);

        } catch (\Exception $e) {
            // Log detalhado do erro


            return response()->json([
                'success' => false,
                'message' => 'Erro ao fazer upload: ' . $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    public function listar($codCompra)
    {
        try {
            $documentos = DB::connection('DBCompra')
                ->table('documentos_compras')
                ->where('cod_compra', $codCompra)
                ->orderBy('ordem')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $documentos
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao listar documentos: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erro: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download de documento
     */
    public function download($id)
    {
        try {
            $documento = DB::connection('DBCompra')
                ->table('documentos_compras')
                ->where('id', $id)
                ->first();

            if (!$documento) {
                return response()->json([
                    'success' => false,
                    'message' => 'Documento não encontrado'
                ], 404);
            }

            $caminhoCompleto = public_path($documento->caminho);

            if (!file_exists($caminhoCompleto)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Arquivo não encontrado no servidor'
                ], 404);
            }

            return response()->download($caminhoCompleto, $documento->nome_original);

        } catch (\Exception $e) {
            Log::error('Erro ao baixar documento: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erro: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Excluir documento
     */
    public function destroy($id)
    {
        try {
            $documento = DB::connection('DBCompra')
                ->table('documentos_compras')
                ->where('id', $id)
                ->first();

            if (!$documento) {
                return response()->json([
                    'success' => false,
                    'message' => 'Documento não encontrado'
                ], 404);
            }

            // Deletar arquivo físico
            $caminhoCompleto = public_path($documento->caminho);
            if (file_exists($caminhoCompleto)) {
                unlink($caminhoCompleto);
            }

            // Deletar registro do banco
            DB::connection('DBCompra')
                ->table('documentos_compras')
                ->where('id', $id)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Documento excluído com sucesso'
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao excluir documento: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erro: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Processar o upload do arquivo
     */
    private function processarUpload($file, $codCompra, $ordem, $matricula)
    {
        try {
            // Criar pasta se não existir
            $pasta = public_path("documentos_compras/{$codCompra}");
            if (!file_exists($pasta)) {
                if (!mkdir($pasta, 0755, true)) {
                    throw new \Exception("Não foi possível criar a pasta: {$pasta}");
                }
            }

            // Verificar permissões da pasta
            if (!is_writable($pasta)) {
                throw new \Exception("Pasta sem permissão de escrita: {$pasta}");
            }

            // Criar nome único para o arquivo
            $nomeOriginal = $file->getClientOriginalName();
            $extensao = $file->getClientOriginalExtension();
            $nomeArquivo = time() . '_' . $ordem . '_' . uniqid() . '.' . $extensao;

            // Caminho completo do arquivo
            $caminhoCompleto = "documentos_compras/{$codCompra}/{$nomeArquivo}";


            // Mover arquivo para a pasta
            $file->move($pasta, $nomeArquivo);

            // Verificar se o arquivo foi movido com sucesso
            if (!file_exists($pasta . '/' . $nomeArquivo)) {
                throw new \Exception("Falha ao mover o arquivo");
            }

            // Salvar no banco de dados
            $documento = DocumentoCompra::create([
                'cod_compra' => $codCompra,
                'nome_original' => $nomeOriginal,
                'nome_arquivo' => $nomeArquivo,
                'caminho' => $caminhoCompleto,
                'tamanho' => $file->getSize(),
                'extensao' => $extensao,
                'ordem' => $ordem,
                'matricula_upload' => $matricula,
                'data_upload' => now()
            ]);


            return [
                'id' => $documento->id,
                'nome_original' => $nomeOriginal,
                'caminho' => $caminhoCompleto,
                'ordem' => $ordem
            ];

        } catch (\Exception $e) {
            throw $e;
        }
    }

    public function importar_compra(Request $request)
    {
        try {
            // Validação do token
            $token = $request->header('Authorization');
            if (!$token) {
                return response()->json(['error' => 'Token não fornecido'], 401);
            }

            // Validação do arquivo
            $request->validate([
                'file' => 'required|file|mimes:xlsx,xls|max:10240'
            ]);

            $solicitante = $request->input('solicitante') ?? auth()->user()->matricula ?? 'sistema';

            // Processa o arquivo Excel
            $file = $request->file('file');
            $filePath = $file->getPathname();

            // Lê o arquivo Excel
            $data = $this->readExcelFile($filePath, $file->getClientOriginalExtension());

            if (empty($data) || count($data) < 2) {
                return response()->json([
                    'status' => 'erro',
                    'message' => 'Arquivo vazio ou formato inválido'
                ], 422);
            }

            // Pega o cabeçalho (primeira linha)
            $header = array_shift($data);

            // Log para debug
            Log::info('Cabeçalho da planilha:', ['header' => $header]);

            // Mapeia os índices das colunas
            $indices = $this->mapColumns($header);

            // Log para debug
            Log::info('Índices mapeados:', ['indices' => $indices]);

            if (!$this->validateColumns($indices)) {
                return response()->json([
                    'status' => 'erro',
                    'message' => 'A planilha deve conter as colunas: Código do Material, Quantidade, Filial, Justificativa',
                    'cabeçalho_encontrado' => $header,
                    'mapeamento' => $indices
                ], 400);
            }

            $dadosPorFilial = [];
            $justificativaGlobal = null;
            $erros = [];
            $totalItensProcessados = 0;

            // Processa cada linha
            foreach ($data as $linhaNum => $row) {
                // Pula linhas vazias
                if (empty(array_filter($row))) {
                    continue;
                }

                $codigoMaterial = trim($row[$indices['codigo']] ?? '');
                $quantidade = trim($row[$indices['quantidade']] ?? '');
                $filialNome = trim($row[$indices['filial']] ?? '');
                $justificativa = trim($row[$indices['justificativa']] ?? '');

                // Validações básicas
                if (empty($codigoMaterial)) {
                    $erros[] = "Linha " . ($linhaNum + 2) . ": Código do material não informado";
                    continue;
                }

                if (empty($quantidade) || !is_numeric($quantidade) || $quantidade <= 0) {
                    $erros[] = "Linha " . ($linhaNum + 2) . ": Quantidade inválida para o material {$codigoMaterial}";
                    continue;
                }

                if (empty($filialNome)) {
                    $erros[] = "Linha " . ($linhaNum + 2) . ": Filial não informada para o material {$codigoMaterial}";
                    continue;
                }

                // Captura a primeira justificativa não vazia
                if ($justificativaGlobal === null && !empty($justificativa)) {
                    $justificativaGlobal = $justificativa;
                }

                // Verifica se o material existe
                $material = DB::connection('DBCompra')->selectOne("
                    SELECT codmat, descricao, unid, centrocusto 
                    FROM bdcompra.tb_material 
                    WHERE codmat = ?
                ", [$codigoMaterial]);

                if (!$material) {
                    $material = DB::connection('DBCompra')->selectOne("
                        SELECT codmat, descricao, unid, centrocusto 
                        FROM bdcompra.tbmaterial_aniel 
                        WHERE codmat = ?
                    ", [$codigoMaterial]);
                    if (!$material) {
                        $erros[] = "Linha " . ($linhaNum + 2) . ": Material com código {$codigoMaterial} não encontrado";
                        continue;
                    }
                }

                // Verifica se a filial existe
                $filial = DB::connection('DBCompra')->selectOne("
                    SELECT idtbfilial, descricao 
                    FROM bdcorp.tbfilial 
                    WHERE idtbfilial = ?
                ", [$filialNome]);

                if (!$filial) {
                    $erros[] = "Linha " . ($linhaNum + 2) . ": Filial {$filialNome} não encontrada";
                    continue;
                }

                // Agrupa por filial
                $chaveFilial = $filial->idtbfilial;

                if (!isset($dadosPorFilial[$chaveFilial])) {
                    $dadosPorFilial[$chaveFilial] = [
                        'filial' => $filial,
                        'itens' => []
                    ];
                }

                $dadosPorFilial[$chaveFilial]['itens'][] = [
                    'material' => $material,
                    'quantidade' => (int) $quantidade,
                    'linha' => $linhaNum + 2
                ];

                $totalItensProcessados++;
            }

            // Se houver erros, retorna sem criar nada
            if (!empty($erros)) {
                return response()->json([
                    'status' => 'erro',
                    'message' => $erros,
                    'errors' => $erros
                ], 422);
            }

            // Se não encontrou justificativa em nenhuma linha
            if ($justificativaGlobal === null) {
                return response()->json([
                    'status' => 'erro',
                    'message' => 'Nenhuma justificativa encontrada na planilha'
                ], 422);
            }

            // Cria as compras agrupadas por filial
            DB::connection('DBCompra')->beginTransaction();

            try {
                $comprasCriadas = [];

                foreach ($dadosPorFilial as $filialId => $dados) {
                    // Gera código único para a compra
                    $codigoCompra = $this->gerarCodigoCompra();

                    Log::info('=== CRIANDO NOVA COMPRA VIA IMPORT ===', [
                        'codigo_compra' => $codigoCompra,
                        'filial' => $dados['filial']->descricao,
                        'total_itens' => count($dados['itens'])
                    ]);

                    // Cria as solicitações individuais
                    $solicitacoesCriadas = [];

                    foreach ($dados['itens'] as $item) {
                        $solicitacaoData = [
                            'cod_material' => $item['material']->codmat,
                            'solicitante' => $solicitante,
                            'quantidade' => $item['quantidade'],
                            'cod_compra' => $codigoCompra,
                            'justificativa_solicitante' => $justificativaGlobal,
                            'filial_id' => $filialId,
                            'data_solicitacao' => now()
                        ];

                        $solicitacao = SolCompraModel::create($solicitacaoData);

                        Log::info('Solicitação criada:', [
                            'id' => $solicitacao->id,
                            'cod_material' => $item['material']->codmat
                        ]);

                        $solicitacoesCriadas[] = $solicitacao;

                        // Envia notificação
                        $centroCustoAlvo = $item['material']->centrocusto ?? 3;
                        $this->enviarNotificacaoSolicitacao($solicitacao, $centroCustoAlvo);
                    }

                    $comprasCriadas[] = [
                        'codigo_compra' => $codigoCompra,
                        'filial' => $dados['filial']->descricao,
                        'filial_id' => $filialId,
                        'total_itens' => count($dados['itens']),
                        'solicitacoes' => $solicitacoesCriadas
                    ];
                }

                DB::connection('DBCompra')->commit();

                return response()->json([
                    'status' => 'sucesso',
                    'message' => 'Importação realizada com sucesso',
                    'compras' => $comprasCriadas,
                    'total_compras' => count($comprasCriadas),
                    'total_itens' => $totalItensProcessados
                ], 201);

            } catch (Exception $e) {
                DB::connection('DBCompra')->rollBack();
                Log::error('Erro ao criar compras:', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                throw $e;
            }

        } catch (Exception $e) {
            Log::error('Erro na importação:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'erro',
                'error' => 'Erro ao processar o arquivo',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lê arquivo Excel
     */
    private function readExcelFile($filePath, $extension)
    {
        if ($extension === 'xlsx') {
            return $this->readXlsxFile($filePath);
        } else if ($extension === 'xls') {
            // Tenta usar o PhpSpreadsheet se disponível
            if (class_exists(IOFactory::class)) {
                try {
                    $spreadsheet = IOFactory::load($filePath);
                    $worksheet = $spreadsheet->getActiveSheet();
                    return $worksheet->toArray();
                } catch (Exception $e) {
                    Log::warning('PhpSpreadsheet falhou, usando método alternativo: ' . $e->getMessage());
                }
            }
            throw new Exception('Para arquivos .xls, por favor converta para .xlsx antes do upload ou instale o PhpSpreadsheet');
        }

        throw new Exception('Formato de arquivo não suportado');
    }

    /**
     * Lê arquivo XLSX (XML-based)
     */
    private function readXlsxFile($filePath)
    {
        $zip = new \ZipArchive();
        $data = [];

        if ($zip->open($filePath) === true) {
            $xml = $zip->getFromName('xl/worksheets/sheet1.xml');
            $sharedStrings = $this->getSharedStrings($zip);
            $zip->close();

            if ($xml) {
                $xml = simplexml_load_string($xml);
                $rows = $xml->sheetData->row;

                foreach ($rows as $row) {
                    $rowData = [];
                    $cellIndex = 0;

                    foreach ($row->c as $cell) {
                        // Pega o valor da célula
                        $value = $this->getCellValue($cell, $sharedStrings);

                        // Pega o índice da coluna
                        $colIndex = $this->getColumnIndex((string) $cell['r']);

                        // Preenche células vazias até chegar no índice correto
                        while ($cellIndex < $colIndex) {
                            $rowData[] = '';
                            $cellIndex++;
                        }

                        $rowData[] = $value;
                        $cellIndex++;
                    }

                    if (!empty(array_filter($rowData))) {
                        $data[] = $rowData;
                    }
                }
            }
        }

        // Log para debug
        if (!empty($data)) {
            Log::info('Primeira linha (cabeçalho):', ['header' => $data[0] ?? 'vazio']);
        }

        return $data;
    }

    /**
     * Obtém strings compartilhadas do Excel
     */
    private function getSharedStrings($zip)
    {
        $sharedStrings = [];
        $stringsXml = $zip->getFromName('xl/sharedStrings.xml');

        if ($stringsXml) {
            $xml = simplexml_load_string($stringsXml);
            foreach ($xml->si as $si) {
                $sharedStrings[] = (string) $si->t;
            }
        }

        return $sharedStrings;
    }

    /**
     * Obtém o valor da célula
     */
    private function getCellValue($cell, $sharedStrings)
    {
        $value = '';

        if ($cell->v) {
            if ($cell['t'] == 's') {
                // String compartilhada
                $index = (int) $cell->v;
                $value = $sharedStrings[$index] ?? '';
            } else {
                $value = (string) $cell->v;
            }
        }

        return $value;
    }

    /**
     * Converte referência da célula (ex: A1) para índice da coluna
     */
    private function getColumnIndex($cellRef)
    {
        preg_match('/([A-Z]+)/', $cellRef, $matches);
        $columnLetters = $matches[1] ?? 'A';

        $index = 0;
        $length = strlen($columnLetters);
        for ($i = 0; $i < $length; $i++) {
            $index = $index * 26 + (ord($columnLetters[$i]) - ord('A') + 1);
        }

        return $index - 1;
    }

    /**
     * Mapeia as colunas do cabeçalho - VERSÃO CORRIGIDA
     */
    private function mapColumns($header)
    {
        $indices = [];

        foreach ($header as $index => $coluna) {
            $colunaOriginal = $coluna;
            $coluna = trim($coluna);
            $colunaLower = strtolower($coluna);

            Log::info("Analisando coluna {$index}: '{$colunaOriginal}'");

            // Verifica se é coluna de código do material
            if (
                strpos($colunaLower, 'codigo') !== false ||
                strpos($colunaLower, 'código') !== false ||
                strpos($colunaLower, 'cod') !== false ||
                strpos($colunaLower, 'material') !== false
            ) {
                $indices['codigo'] = $index;
                Log::info("  -> Identificado como CÓDIGO");
            }

            // Verifica se é coluna de quantidade
            if (
                strpos($colunaLower, 'quantidade') !== false ||
                strpos($colunaLower, 'qtd') !== false ||
                strpos($colunaLower, 'qtde') !== false
            ) {
                $indices['quantidade'] = $index;
                Log::info("  -> Identificado como QUANTIDADE");
            }

            // Verifica se é coluna de filial
            if (
                strpos($colunaLower, 'filial') !== false ||
                strpos($colunaLower, 'unidade') !== false ||
                strpos($colunaLower, 'fil') !== false
            ) {
                $indices['filial'] = $index;
                Log::info("  -> Identificado como FILIAL");
            }

            // Verifica se é coluna de justificativa
            if (
                strpos($colunaLower, 'justificativa') !== false ||
                strpos($colunaLower, 'just') !== false ||
                strpos($colunaLower, 'motivo') !== false
            ) {
                $indices['justificativa'] = $index;
                Log::info("  -> Identificado como JUSTIFICATIVA");
            }
        }

        // Fallback: se não encontrou pelos nomes, assume a ordem padrão
        if (!isset($indices['codigo']) && count($header) >= 1) {
            $indices['codigo'] = 0;
            Log::info("Fallback: coluna 0 como CÓDIGO");
        }

        if (!isset($indices['quantidade']) && count($header) >= 2) {
            $indices['quantidade'] = 1;
            Log::info("Fallback: coluna 1 como QUANTIDADE");
        }

        if (!isset($indices['filial']) && count($header) >= 3) {
            $indices['filial'] = 2;
            Log::info("Fallback: coluna 2 como FILIAL");
        }

        if (!isset($indices['justificativa']) && count($header) >= 4) {
            $indices['justificativa'] = 3;
            Log::info("Fallback: coluna 3 como JUSTIFICATIVA");
        }

        return $indices;
    }

    /**
     * Valida se todas as colunas necessárias foram encontradas
     */
    private function validateColumns($indices)
    {
        $required = ['codigo', 'quantidade', 'filial', 'justificativa'];

        foreach ($required as $field) {
            if (!isset($indices[$field])) {
                Log::error("Campo não encontrado: {$field}");
                return false;
            }
        }

        return true;
    }

    /**
     * Envia notificação de solicitação
     */
    private function enviarNotificacaoSolicitacao($solicitacao, $centroCustoAlvo)
    {
        try {
            Log::info('=== PROCESSANDO NOTIFICAÇÃO ===', [
                'solicitacao_id' => $solicitacao->id
            ]);

            $emails = [];

            // Verifica se o solicitante está na tabela de aprovação
            $cadeia = DB::connection('DBCompra')->selectOne("
                SELECT * FROM bdcorp.tbcadeia_aprovacao 
                WHERE matricula = ?
            ", [$solicitacao->solicitante]);

            if ($cadeia) {
                // Busca gestores
                $usuariosCompras = DB::connection('DBCompra')->select("
                    SELECT u.email, u.matricula
                    FROM bdcorp.tbusuario u
                    JOIN bdcompra.tbgestores_material gm ON gm.matricula = u.matricula
                    WHERE u.compras = 2
                    AND JSON_CONTAINS(gm.ids_gestao_material, ?)
                ", [json_encode($centroCustoAlvo)]);

                foreach ($usuariosCompras as $usuario) {
                    if (!empty($usuario->email) && $usuario->matricula != $solicitacao->solicitante) {
                        $emails[] = $usuario->email;
                    }
                }
            } else {
                // Busca gerente
                $gerente = DB::connection('DBCompra')->selectOne("
                    SELECT ug.email AS email_gerente
                    FROM bdcorp.tbusuario u
                    LEFT JOIN bdcorp.tbcoord c ON c.matricula = u.matricula
                    LEFT JOIN bdcorp.tbgerente g ON g.idtbgerente = c.idtbgerente
                    LEFT JOIN bdcorp.tbusuario ug ON ug.matricula = g.matricula
                    WHERE u.matricula = ?
                ", [$solicitacao->solicitante]);

                if ($gerente && !empty($gerente->email_gerente)) {
                    $emails[] = $gerente->email_gerente;
                }
            }

            // Remove duplicatas
            $listaEmailsUnicos = array_values(array_unique(array_filter($emails)));

            if (!empty($listaEmailsUnicos)) {
                Mail::to($listaEmailsUnicos)->send(new NovaSolicitacaoMail($solicitacao));
                Log::info('Email enviado para solicitação ID: ' . $solicitacao->id);
            }

        } catch (Exception $e) {
            Log::error('Erro ao enviar email:', [
                'error' => $e->getMessage(),
                'solicitacao_id' => $solicitacao->id
            ]);
        }
    }

    /**
     * Gera código único para a compra
     */
    private function gerarCodigoCompra()
    {
        $timestamp = time();
        $codigoCompra = strtoupper(base_convert($timestamp, 10, 36));

        // Garante unicidade
        while (SolCompraModel::where('cod_compra', $codigoCompra)->exists()) {
            // Se houver conflito, adiciona um caractere aleatório no final
            $codigoCompra = strtoupper(base_convert($timestamp, 10, 36)) . substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 1);
        }

        return $codigoCompra;
    }

    public function downloadModelo()
    {
        try {
            $caminhoArquivo = storage_path('./backend/public/modelos/modelo_importacao_compras.xlsx');

            if (!file_exists($caminhoArquivo)) {
                return response()->json([
                    'status' => 'erro',
                    'message' => 'Arquivo modelo não encontrado'
                ], 404);
            }

            return response()->download($caminhoArquivo, 'modelo_importacao_compras.xlsx', [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ]);

        } catch (Exception $e) {
            Log::error('Erro ao baixar modelo:', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'erro',
                'message' => 'Erro ao baixar arquivo modelo'
            ], 500);
        }
    }

    /**
     * Upload de múltiplos documentos (NOVO - até 3 arquivos, 20MB cada)
     */
    public function uploadMultiplo(Request $request)
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

            // Validar os dados - máximo 3 arquivos, 20MB cada
            $validator = Validator::make($request->all(), [
                'cod_compra' => 'required|string',
                'files' => 'required|array|max:3',
                'files.*' => 'file|max:20480|mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verificar se pelo menos um arquivo foi enviado
            if (!$request->hasFile('files')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nenhum arquivo foi enviado.'
                ], 400);
            }

            $uploadedFiles = [];
            $errors = [];
            $matricula = $user->matricula;
            $files = $request->file('files');

            // Processar múltiplos arquivos
            foreach ($files as $index => $file) {
                try {
                    $result = $this->processarUploadMultiplo($file, $request->cod_compra, $index + 1, $matricula);
                    if ($result) {
                        $uploadedFiles[] = $result;
                    }
                } catch (\Exception $e) {
                    $errors[] = [
                        'file' => $file->getClientOriginalName(),
                        'error' => $e->getMessage()
                    ];
                }
            }

            return response()->json([
                'success' => count($uploadedFiles) > 0,
                'message' => count($uploadedFiles) . ' arquivo(s) enviado(s) com sucesso!',
                'data' => $uploadedFiles,
                'errors' => $errors
            ], count($uploadedFiles) > 0 ? 200 : 400);

        } catch (\Exception $e) {
            Log::error('Erro no upload múltiplo: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erro ao fazer upload: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Processar o upload de múltiplos arquivos (NOVO)
     */
    private function processarUploadMultiplo($file, $codCompra, $ordem, $matricula)
    {
        try {
            // Criar pasta se não existir
            $pasta = public_path("documentos_compras/{$codCompra}");
            if (!file_exists($pasta)) {
                if (!mkdir($pasta, 0755, true)) {
                    throw new \Exception("Não foi possível criar a pasta: {$pasta}");
                }
            }

            // Verificar permissões da pasta
            if (!is_writable($pasta)) {
                throw new \Exception("Pasta sem permissão de escrita: {$pasta}");
            }

            // Criar nome único para o arquivo com hash
            $nomeOriginal = $file->getClientOriginalName();
            $extensao = $file->getClientOriginalExtension();
            $nomeHash = md5(uniqid() . microtime() . rand(1000, 9999) . $nomeOriginal) . '.' . $extensao;
            $nomeArquivo = $nomeHash;

            // Caminho completo do arquivo
            $caminhoCompleto = "documentos_compras/{$codCompra}/{$nomeArquivo}";
            // $tamanhoArquivo = $file->getSize();

            // Mover arquivo para a pasta
            $file->move($pasta, $nomeArquivo);

            // Verificar se o arquivo foi movido com sucesso
            if (!file_exists($pasta . '/' . $nomeArquivo)) {
                throw new \Exception("Falha ao mover o arquivo");
            }

            // Salvar no banco de dados
            $documento = DocumentoCompra::create([
                'cod_compra' => $codCompra,
                'nome_original' => $nomeOriginal,
                'nome_arquivo' => $nomeArquivo,
                'nome_hash' => $nomeHash,
                'caminho' => $caminhoCompleto,
                'tamanho' => 0,
                'extensao' => $extensao,
                'ordem' => $ordem,
                'matricula_upload' => $matricula,
                'data_upload' => now()
            ]);

            return [
                'id' => $documento->id,
                'nome_original' => $nomeOriginal,
                'nome_hash' => $nomeHash,
                'caminho' => $caminhoCompleto,
                'ordem' => $ordem,
                'tamanho' => $file->getSize(),
                'extensao' => $extensao
            ];

        } catch (\Exception $e) {
            throw $e;
        }
    }

    /**
     * Listar documentos por código da compra (NOVO - com informações completas)
     */
    public function listarDocumentos($codCompra)
    {
        try {
            $documentos = DB::connection('DBCompra')
                ->table('documentos_compras')
                ->where('cod_compra', $codCompra)
                ->orderBy('ordem')
                ->orderBy('created_at', 'desc')
                ->get();

            // Adicionar URL para download
            foreach ($documentos as $documento) {
                $documento->url_download = url("/api/uploads/download/{$documento->id}");
            }

            return response()->json([
                'success' => true,
                'data' => $documentos,
                'total' => count($documentos)
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao listar documentos: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erro: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Excluir documento (NOVO - com suporte para hash)
     */
    public function destroyDocumento($id)
    {
        try {
            $documento = DB::connection('DBCompra')
                ->table('documentos_compras')
                ->where('id', $id)
                ->first();

            if (!$documento) {
                return response()->json([
                    'success' => false,
                    'message' => 'Documento não encontrado'
                ], 404);
            }

            // Deletar arquivo físico
            $caminhoCompleto = public_path($documento->caminho);
            if (file_exists($caminhoCompleto)) {
                unlink($caminhoCompleto);
            }

            // Deletar registro do banco
            DB::connection('DBCompra')
                ->table('documentos_compras')
                ->where('id', $id)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Documento excluído com sucesso'
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao excluir documento: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erro: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Excluir TODOS os documentos de uma compra (NOVO)
     */
    public function destroyDocumentosByCompra($codCompra)
    {
        try {
            $documentos = DB::connection('DBCompra')
                ->table('documentos_compras')
                ->where('cod_compra', $codCompra)
                ->get();

            if ($documentos->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nenhum documento encontrado para esta compra'
                ], 404);
            }

            $deletados = 0;
            foreach ($documentos as $documento) {
                // Deletar arquivo físico
                $caminhoCompleto = public_path($documento->caminho);
                if (file_exists($caminhoCompleto)) {
                    unlink($caminhoCompleto);
                }
                $deletados++;
            }

            // Deletar registros do banco
            DB::connection('DBCompra')
                ->table('documentos_compras')
                ->where('cod_compra', $codCompra)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => "{$deletados} documento(s) excluído(s) com sucesso"
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao excluir documentos da compra: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erro: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download de documento por hash (NOVO)
     */
    public function downloadByHash($hash)
    {
        try {
            $documento = DB::connection('DBCompra')
                ->table('documentos_compras')
                ->where('nome_hash', $hash)
                ->first();

            if (!$documento) {
                return response()->json([
                    'success' => false,
                    'message' => 'Documento não encontrado'
                ], 404);
            }

            $caminhoCompleto = public_path($documento->caminho);

            if (!file_exists($caminhoCompleto)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Arquivo não encontrado no servidor'
                ], 404);
            }

            return response()->download($caminhoCompleto, $documento->nome_original);

        } catch (\Exception $e) {
            Log::error('Erro ao baixar documento por hash: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erro: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verificar limites de upload para uma compra (NOVO)
     */
    public function verificarLimitesUpload($codCompra)
    {
        try {
            $totalDocumentos = DB::connection('DBCompra')
                ->table('documentos_compras')
                ->where('cod_compra', $codCompra)
                ->count();

            $totalTamanho = DB::connection('DBCompra')
                ->table('documentos_compras')
                ->where('cod_compra', $codCompra)
                ->sum('tamanho');

            $limiteMaximoArquivos = 3;
            $limiteMaximoTamanho = 60 * 1024 * 1024; // 60MB total (3 arquivos x 20MB)

            return response()->json([
                'success' => true,
                'data' => [
                    'cod_compra' => $codCompra,
                    'documentos_atuais' => $totalDocumentos,
                    'limite_maximo_arquivos' => $limiteMaximoArquivos,
                    'pode_adicionar' => $totalDocumentos < $limiteMaximoArquivos,
                    'arquivos_restantes' => max(0, $limiteMaximoArquivos - $totalDocumentos),
                    'tamanho_total_atual' => $totalTamanho,
                    'tamanho_total_formatado' => $this->formatarBytes($totalTamanho),
                    'limite_maximo_tamanho' => $limiteMaximoTamanho,
                    'limite_maximo_tamanho_formatado' => $this->formatarBytes($limiteMaximoTamanho)
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao verificar limites: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erro: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Formatar bytes para formato legível (NOVO - Helper)
     */
    private function formatarBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);

        $bytes /= pow(1024, $pow);

        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}