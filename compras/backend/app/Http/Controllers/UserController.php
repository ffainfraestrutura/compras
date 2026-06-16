<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function index()
    {
        $users = DB::select("
            SELECT DISTINCT
                f.matricula,
                f.nome AS nome,
                f.ccusto AS ccusto,
                u.compras
            FROM bdffa.tbfuncionario f
            LEFT JOIN bdfrota.tbusuario u 
                ON f.matricula = u.matricula
            WHERE f.status = 'ATIVO'
            AND f.nome NOT LIKE 'TERC.%'
            AND u.nome IS NOT NULL;
        ");

        return response()->json($users);
    }

    public function update(Request $request, $matricula)
    {
        try {
            $request->validate([
                'compras' => 'required|integer|between:0,7'
            ]);

            $usuario = User::where('matricula', $matricula)->first();

            if (!$usuario) {
                return response()->json(['error' => 'Usuário não encontrado'], 404);
            }

            // Busca dados do funcionário na tabela tbfuncionario
            $funcionario = DB::connection('mysql')->table('tbfuncionario')
                ->where('matricula', $matricula)
                ->first();

            if (!$funcionario) {
                return response()->json(['error' => 'Funcionário não encontrado na tabela tbfuncionario'], 404);
            }

            // Atualiza o nível do usuário
            $usuario->update([
                'compras' => $request->compras
            ]);

            // Remove registros existentes do usuário na tabela tbcadeia_aprovacao
            DB::connection('mysql')->table('tbcadeia_aprovacao')
                ->where('matricula', $matricula)
                ->delete();

            if ($request->compras == 7) {

                // Determina o grupo_ccusto baseado no centro de custo original
                $grupoCcusto = $this->mapearGrupoCcusto($funcionario->ccusto);

                $dadosInsercao = [
                    'matricula' => $matricula,
                    'nome_responsavel' => $funcionario->nome,
                    'grupo_ccusto' => $grupoCcusto,
                    'nivel' => 1,
                ];

                // Insere novo registro
                DB::connection('mysql')->table('tbcadeia_aprovacao')->insert($dadosInsercao);
            }


            return response()->json([
                'message' => 'Hierarquia atualizada com sucesso',
                'usuario' => [
                    'nome' => $usuario->nome,
                    'matricula' => $usuario->matricula,
                    'compras' => $usuario->compras
                ],
                'ccusto_original' => $funcionario->ccusto,
                'grupo_ccusto_mapeado' => $request->compras >= 4 ? $this->mapearGrupoCcusto($funcionario->ccusto) : null
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao atualizar hierarquia',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mapeia o centro de custo baseado no conteúdo
     */
    private function mapearGrupoCcusto($ccustoOriginal)
    {
        if (empty($ccustoOriginal)) {
            return 'ADMINISTRATIVO'; // Valor padrão se estiver vazio
        }

        $ccustoUpper = strtoupper(trim($ccustoOriginal));

        if (strpos($ccustoUpper, 'LOGISTICA') !== false) {
            return 'LOGISTICA';
        }

        if (strpos($ccustoUpper, 'CLARO') !== false) {
            return 'CLARO';
        }

        if (strpos($ccustoUpper, 'IHS') !== false) {
            return 'IHS';
        }

        if (strpos($ccustoUpper, 'SESMT') !== false) {
            return 'SESMT';
        }

        if (strpos($ccustoUpper, 'FROTA') !== false) {
            return 'FROTA';
        }

        if (!empty($ccustoOriginal)) {
            return $ccustoOriginal; // Valor padrão se estiver vazio
        }

        // Para qualquer outro centro de custo, retorna o valor original
        return $ccustoOriginal;
    }

    public function updateCentros(Request $request, $matricula)
    {
        $request->validate([
            'centros' => 'array',
            'centros.*' => 'integer|exists:centrocusto,id',
        ]);

        $usuario = User::where('matricula', $matricula)->firstOrFail();
        $usuario->centros = $request->centros; // array de ids
        $usuario->save();

        return response()->json([
            'success' => true,
            'usuario' => $usuario,
        ]);
    }
}
