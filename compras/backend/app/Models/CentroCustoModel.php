<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CentroCustoModel extends Model
{

    protected $connection = 'DBCompra';
    protected $table = 'tbgestao_material';
    public $timestamps = false;
    protected $fillable = [
        'id',
        'descricao',
        'status',
    ];
}
