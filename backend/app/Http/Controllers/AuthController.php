<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Tymon\JWTAuth\Facades\JWTAuth;


class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->only('password', 'usuario');

        $start = microtime(true);

        $user = User::where('usuario', $request->usuario)
            ->leftJoin('bdffa.tbfuncionario as f', 'tbusuario.matricula', '=', 'f.matricula')
            ->leftJoin('bdcompra.tbgestores_material as gm', 'gm.matricula', '=', 'f.matricula')
            ->select('tbusuario.*', 'f.*', 'gm.matricula as is_gestor_material')
            ->first();

        $queryTime = microtime(true) - $start;
        \Log::info("Login query time: {$queryTime}s", ['usuario' => $request->usuario]);


        // Verificar se é gestor de material
        $material = !is_null($user) && !is_null($user->is_gestor_material);

        if ($user && $user->compras == 0) {
            return response()->json(['message' => 'Você não tem acesso a esse sistema'], 401);
        }

        if ($user && $user->senha === $request->password) {
            // Senha correta
            $token = JWTAuth::fromUser($user);

            // Retornar o token JWT
            return response()->json([
                'message' => 'Login bem-sucedido',
                'token' => $token,
                'nome' => $user->nome,
                'centroDeCusto' => $user->ccusto,
                'matricula' => $user->matricula,
                'nivel_acesso' => $user->compras,
                'codfilial' => $user->codfilial,
                'material' => $material,
            ], 200);
        } else {
            // Senha incorreta ou usuário não encontrado
            return response()->json(['message' => 'Credenciais inválidas'], 400);
        }
    }

    public function logout()
    {
        auth()->logout();

        return response()->json(['mensagem' => 'Logout efetuado com sucesso']);
    }

    public function me()
    {
        return response()->json(auth()->user());
    }
}
