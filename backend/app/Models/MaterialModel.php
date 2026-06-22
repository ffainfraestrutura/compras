<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaterialModel extends Model
{
    protected $connection = 'DBCompra';
    protected $table = 'tb_material';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'codmat',
        'descricao',
        'unid',
        'valor',
        'centrocusto',
        'saldo',
        'localizacao',
        'status',
        'data_cadastro',
        'obs',
        'marca',
        'modelo',
        'ean',
        'sub_grupo',
        'resp_material',
        'patrimonio'
    ];

}
