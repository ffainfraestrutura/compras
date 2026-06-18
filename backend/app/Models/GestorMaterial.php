<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GestorMaterial extends Model
{
    protected $connection = 'DBCompra';

    protected $table = 'tbgestores_material';

    public $timestamps = false;

    protected $fillable = ['matricula', 'ids_gestao_material'];

    protected $casts = [
        'ids_gestao_material' => 'array',
    ];
}
