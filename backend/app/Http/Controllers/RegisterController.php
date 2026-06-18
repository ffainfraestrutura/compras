<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;
use Tymon\JWTAuth\Facades\JWTAuth;

class RegisterController extends Controller
{
    public function register(Request $request)
    {
        $credentials = $request->only('matricula', 'password');

        if (empty($request->matricula) || empty($request->password)) {
            return response()->json(['message' => 'Erro na criação: matrícula ou senha vazia'], 400);
        }

        $usuarioExistente = DB::table('bdfrota.tbusuario')
            ->where('matricula', $request->matricula)
            ->exists();

        if ($usuarioExistente) {
            return response()->json(['message' => 'Usuário já cadastrado'], 409);
        }

        // Obtem a matricula do supervisor
        $request->matriculasup = DB::table('bdfrota.tbtecnico')
            ->where('matricula', $request->matricula)
            ->value('matriculasup');

        // Obtem o ID do supervisor
        $idtbsupervisor = DB::table('bdfrota.tbsupervisor')
            ->where('matricula', $request->matriculasup)
            ->value('idtbsupervisor');

        // Dados do funcionário
        $funcionario = DB::table('bdffa.tbfuncionario')
            ->select('nome', 'codempresa', 'codfilial')
            ->where('matricula', $request->matricula)
            ->first();

        if (!$funcionario) {
            return response()->json(['message' => 'Funcionário não encontrado'], 404);
        }

        $filial = '1';
        if ($funcionario->codempresa == '2') {
            $filial = '2';
        } elseif (in_array($funcionario->codfilial, ['10', '11'])) {
            $filial = '3';
        }

        // Define o perfil
        $perfil = 0;

        if (DB::table('bdfrota.tbsupervisor')->where('matricula', $request->matricula)->exists()) {
            $perfil = 1;
        }

        if (DB::table('bdfrota.tbcoord')->where('matricula', $request->matricula)->exists()) {
            $perfil = 2;
        }

        // Cria o usuário
        DB::table('bdfrota.tbusuario')->insert([
            'matricula' => $request->matricula,
            'usuario' => $request->matricula,
            'senha' => $request->password, // OU Hash::make($request->password) se quiser proteger
            'idtbsupervisor' => $idtbsupervisor,
            'nome' => $funcionario->nome,
            'perfil' => $perfil,
            'pacesso' => 1,
            'filial' => $filial,
        ]);

        // Cria token JWT (caso tenha model de usuário configurado)
        // $user = User::where('matricula', $request->matricula)->first();
        // $token = JWTAuth::fromUser($user);

        return response()->json([
            'message' => 'Usuário criado com sucesso',
            // 'token' => $token, // se JWT estiver ativo
        ], 201);
    }
}
