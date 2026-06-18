<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ModuloAjuda;
use Illuminate\Http\Request;

class AjudaController extends Controller
{
    /**
     * Lista todos os módulos de ajuda
     */
    public function index(Request $request)
    {
        try {
            // Iniciar query com módulos ativos
            $query = ModuloAjuda::where('ativo', true);
            
            // Filtro por nível de acesso
            if ($request->has('nivel_acesso') && $request->nivel_acesso !== 'todos') {
                $query->where('nivel_acesso', $request->nivel_acesso);
            }
            
            // Filtro por título
            if ($request->has('titulo') && !empty($request->titulo)) {
                $query->where('titulo', 'like', '%' . $request->titulo . '%');
            }
            
            // Ordenar por ordem e título
            $modulos = $query->orderBy('ordem')->orderBy('titulo')->get();
            
            // Formatar resposta simples
            $dadosFormatados = $modulos->map(function($modulo) {
                return [
                    'id' => $modulo->id,
                    'titulo' => $modulo->titulo,
                    'descricao' => $modulo->descricao,
                    'url_pdf' => $modulo->url_pdf,
                    'nivel_acesso' => $modulo->nivel_acesso,
                    'ordem' => $modulo->ordem
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $dadosFormatados,
                'total' => $modulos->count()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar módulos de ajuda',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Exibe um módulo específico
     */
    public function show($id)
    {
        try {
            $modulo = ModuloAjuda::where('ativo', true)->find($id);
            
            if (!$modulo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Módulo de ajuda não encontrado'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $modulo->id,
                    'titulo' => $modulo->titulo,
                    'descricao' => $modulo->descricao,
                    'url_pdf' => $modulo->url_pdf,
                    'nivel_acesso' => $modulo->nivel_acesso,
                    'ordem' => $modulo->ordem
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar módulo de ajuda',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Cria um novo módulo (opcional - se quiser manter)
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'titulo' => 'required|string|max:200',
                'descricao' => 'required|string',
                'url_pdf' => 'nullable|url',
                'nivel_acesso' => 'required|integer|min:1|max:4',
                'ordem' => 'nullable|integer',
                'ativo' => 'nullable|boolean'
            ]);
            
            $modulo = ModuloAjuda::create([
                'titulo' => $request->titulo,
                'descricao' => $request->descricao,
                'url_pdf' => $request->url_pdf,
                'nivel_acesso' => $request->nivel_acesso,
                'ordem' => $request->ordem ?? 0,
                'ativo' => $request->ativo ?? true
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Módulo criado com sucesso',
                'data' => $modulo
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao criar módulo',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}