<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HistoricoCompraModel extends Model
{
    protected $connection = 'DBCompra';
    protected $table = 'tbaux_edit';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'sol_compra_id',
        'cod_material',
        'quantidade_antiga',
        'quantidade_nova',
        'matricula',
        'justificativa'
    ];

}
