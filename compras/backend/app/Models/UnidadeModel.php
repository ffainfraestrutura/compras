<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UnidadeModel extends Model
{
    protected $connection = 'DBCompra';
    protected $table = 'tbunidades';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'descricao',
    ];
}
