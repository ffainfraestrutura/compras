<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;
use Tymon\JWTAuth\Facades\JWTAuth;

class ForgotPasswordController extends Controller
{
    public function updatePassword(Request $request)
    {
        $request->validate([
            'matricula' => 'required|string',
            'cpf' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('usuario', $request->matricula)->first();

        if (!$user) {
            return response()->json(['message' => 'Usuário não encontrado'], 404);
        }

        // Verifica se o CPF confere com o do funcionário
        $cpfValido = \DB::table('bdffa.tbfuncionario')
            ->where('matricula', $request->matricula)
            ->where('cpf', $request->cpf)
            ->exists();

        if (!$cpfValido) {
            return response()->json(['message' => 'CPF e matrícula divergentes'], 401);
        }

        // Atualiza a senha
        $user->senha = $request->password; // ou use: Hash::make($request->pass);
        $user->save();

        return response()->json(['message' => 'Senha alterada com sucesso'], 200);
    }
}
