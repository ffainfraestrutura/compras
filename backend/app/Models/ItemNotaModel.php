<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemNotaModel extends Model
{
    protected $connection = 'DBCompra';
    protected $table = 'tbitens_nota';
    protected $primaryKey = 'id';
    
    protected $fillable = [
        'nota_fiscal_id', 'material_id', 'codigo_material', 'descricao',
        'quantidade', 'unidade_medida', 'valor_unitario', 'valor_total',
        'valor_desconto', 'cfop', 'ncm', 'cst', 'numero_lote',
        'data_validade', 'local_armazenamento_id', 'observacoes'
    ];

    protected $casts = [
        'quantidade' => 'decimal:3',
        'valor_unitario' => 'decimal:4',
        'valor_total' => 'decimal:2',
        'valor_desconto' => 'decimal:2',
        'data_validade' => 'date',
    ];

}