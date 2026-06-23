<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Response;

class RelatorioController extends Controller
{
    private function baseQuery(): \Illuminate\Database\Query\Builder
    {
        return DB::connection('DBCompra')->table('tbsol_compra as sc')
            ->join('bdcorp.tbfuncionario as f',
                'sc.solicitante', '=', 'f.matricula')

            ->leftJoin('bdcorp.tbfuncionario as gerente',
                'sc.matricula_gerente', '=', 'gerente.matricula')

            ->leftJoin('bdcorp.tbfuncionario as material',
                'sc.matricula_material', '=', 'material.matricula')

            ->leftJoin('bdcorp.tbfuncionario as compras',
                'sc.matricula_compra', '=', 'compras.matricula')

            ->leftJoin('bdcorp.tbfuncionario as diretor',
                'sc.matricula_diretor', '=', 'diretor.matricula')

            ->leftJoin('bdcorp.tbfilial as fil',
                'sc.filial_id', '=', 'fil.idtbfilial')

            // Dois JOINs diretos no lugar do UNION ALL
            ->leftJoin('tb_material as m1',
                'sc.cod_material', '=', 'm1.codmat')

            ->leftJoin('tbmaterial_aniel as m2', function ($join) {
                $join->on('sc.cod_material', '=', 'm2.codmat')
                     ->whereNull('m1.codmat');
            })

            // JOIN com preço aprovado por cotação + material
            ->leftJoin('tbmateriais_cotados as mc', function ($join) {
                $join->on('mc.cod_cotacao', '=', 'sc.cod_cotacao')
                     ->on('mc.cod_material', '=', 'sc.cod_material')
                     ->where('mc.status', '=', 'Aprovado');
            })

            ->orderByDesc('sc.cod_compra');
    }

    public function relatorioGeral(Request $request)
    {
        $data = $this->baseQuery()
            ->select([
                'sc.cod_compra',
                DB::raw("DATE_FORMAT(sc.data_solicitacao, '%d/%m/%Y') as data_solicitacao"),
                'f.nome as solicitante',
                DB::raw('COALESCE(m1.descricao, m2.descricao) AS descricao'),
                'sc.justificativa_solicitante as justificativa',
                'sc.aceite_gerente',
                'gerente.nome as gerente_nome',
                'sc.justificativa_gerente',
                'sc.aceite_material',
                'material.nome as material_nome',
                'sc.justificativa_material',
                'sc.aceite_compra',
                'compras.nome as compras_nome',
                'sc.justificativa_compra',
                'sc.aceite_diretor',
                'diretor.nome as diretor_nome',
                'sc.justificativa_diretor',
                'sc.finalizado',
                'sc.entregue',
                'sc.status',
                'fil.descricao as filial',
                'sc.ccusto',
                'mc.preco as preco_unitario',
                DB::raw('mc.preco * sc.quantidade AS preco_total'),
            ])
            ->get();

        return response()->json($data, 200);
    }

    public function relatorioGeralExport()
    {
        $filename = "relatorio_solicitacoes_" . date('Y-m-d_His') . ".csv";

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        $callback = function () {
            $handle = fopen('php://output', 'w');

            // BOM para acentos no Excel
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($handle, [
                'Cód. Compra', 'Solicitação', 'Solicitante', 'Material',
                'Justificativa', 'Aceite Gerente', 'Gerente', 'Justificativa Gerente',
                'Aceite Gestor Material', 'Gestor Material', 'Justificativa Material',
                'Aceite Compra', 'Comprador', 'Justificativa Compra',
                'Aceite Diretor', 'Diretor', 'Justificativa Diretor',
                'Finalizado', 'Entregue', 'Status', 'Filial', 'Centro de Custo',
                'Preço Unitário', 'Preço Total',
            ]);

            $this->baseQuery()
                ->select([
                    'sc.cod_compra',
                    DB::raw("DATE_FORMAT(sc.data_solicitacao, '%d/%m/%Y') as data_solicitacao"),
                    'f.nome as solicitante',
                    DB::raw('COALESCE(m1.descricao, m2.descricao) AS descricao'),
                    'sc.justificativa_solicitante as justificativa',
                    'sc.aceite_gerente',
                    'gerente.nome as gerente_nome',
                    'sc.justificativa_gerente',
                    'sc.aceite_material',
                    'material.nome as material_nome',
                    'sc.justificativa_material',
                    'sc.aceite_compra',
                    'compras.nome as compras_nome',
                    'sc.justificativa_compra',
                    'sc.aceite_diretor',
                    'diretor.nome as diretor_nome',
                    'sc.justificativa_diretor',
                    'sc.finalizado',
                    'sc.entregue',
                    'sc.status',
                    'fil.descricao as filial',
                    'sc.ccusto',
                    'mc.preco as preco_unitario',
                    DB::raw('mc.preco * sc.quantidade AS preco_total'),
                ])
                ->chunk(1000, function ($items) use ($handle) {
                    foreach ($items as $item) {
                        fputcsv($handle, [
                            $item->cod_compra,
                            $item->data_solicitacao,
                            $item->solicitante,
                            $item->descricao,
                            $item->justificativa,
                            $item->aceite_gerente == 1 ? 'Sim' : 'Não',
                            $item->gerente_nome,
                            $item->justificativa_gerente,
                            $item->aceite_material == 1 ? 'Sim' : 'Não',
                            $item->material_nome,
                            $item->justificativa_material,
                            $item->aceite_compra == 1 ? 'Sim' : 'Não',
                            $item->compras_nome,
                            $item->justificativa_compra,
                            $item->aceite_diretor == 1 ? 'Sim' : 'Não',
                            $item->diretor_nome,
                            $item->justificativa_diretor,
                            $item->finalizado == 1 ? 'Sim' : 'Não',
                            $item->entregue == 1 ? 'Sim' : 'Não',
                            $this->getStatusText($item),
                            $item->filial,
                            $item->ccusto,
                            $item->preco_unitario,
                            $item->preco_total,
                        ]);
                    }
                });

            fclose($handle);
        };

        return Response::stream($callback, 200, $headers);
    }

    private function getStatusText($item): string
    {
        if ($item->status == 0)         return 'Cancelado';
        if ($item->entregue == 1)        return 'Material Recebido';
        if ($item->finalizado == 1)      return 'Material Comprado';
        if ($item->aceite_diretor == 1)  return 'Aprovado pela Diretoria';
        if ($item->aceite_gerente === 0) return 'Reprovado - Gerente';
        if ($item->aceite_material === 0)return 'Reprovado - Gestor Material';
        if ($item->aceite_compra === 0)  return 'Reprovado - Compras';
        if ($item->aceite_diretor == 0)  return 'Reprovado - Diretoria';
        if ($item->aceite_gerente === null)  return 'Aguardando Gerente';
        if ($item->aceite_material === null) return 'Aguardando Gestor Material';
        if ($item->aceite_compra === null)   return 'Aguardando Cotação';
        if ($item->aceite_diretor === null)  return 'Aguardando Diretoria';
        return 'Aguardando';
    }
}