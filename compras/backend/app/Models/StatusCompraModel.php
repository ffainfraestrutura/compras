<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StatusCompraModel extends Model
{
    use HasFactory;
    protected $connection = 'DBCompra';
    protected $table = 'tbaux_status';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'descricao',
        'visivel'
    ];
}
