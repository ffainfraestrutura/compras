<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SolCompraModel extends Model
{
    use HasFactory;

    protected $connection = 'DBCompra';
    protected $table = 'tbsol_compra';
    public $timestamps = false;

    protected $fillable = [
        'tbtbsol_compra',
        'cod_material',
        'cod_compra',
        'filial_id',
        'solicitante',
        'data_solicitacao',
        'quantidade',
        'aceite_gestor_material',
        'justificativa_gestor_material',
        'data_aprovacao_material',
        'aceite_gerente',
        'justificativa_gerente',
        'data_aprovacao_gerente',
        'aceite_diretor',
        'justificativa_diretor',
        'data_aprovacao_diretor',
        'aceite_cfo',
        'justificativa_cfo',
        'data_aprovacao_cfo',
        'justificativa_solicitante',
        'cod_cotacao',
        'tipo_cotacao',
        'aceite_gerente',
        'matricula_gerente',
        'justificativa_gerente',
        'data_gerente',
        'ccusto',
        'justificativa_checado',
        'matricula_checado',
    ];  
}
