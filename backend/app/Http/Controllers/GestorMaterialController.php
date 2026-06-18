<?php

namespace App\Http\Controllers;

use App\Models\GestorMaterial;
use Illuminate\Http\Request;

class GestorMaterialController extends Controller
{
    // Buscar os centros já associados
    public function show($matricula)
    {
        $gestor = GestorMaterial::where('matricula', $matricula)->first();

        if (!$gestor) {
            return response()->json([
                'matricula' => $matricula,
                'ids_gestao_material' => [],
            ]);
        }

        return response()->json($gestor);
    }

    // Atualizar ou criar centros
    public function update(Request $request, $matricula)
    {
        $request->validate([
            'centros' => 'array',
            'centros.*' => 'integer',
        ]);

        $gestor = GestorMaterial::updateOrCreate(
            ['matricula' => $matricula],
            ['ids_gestao_material' => $request->centros]
        );

        return response()->json([
            'success' => true,
            'gestor' => $gestor,
        ]);
    }
}
