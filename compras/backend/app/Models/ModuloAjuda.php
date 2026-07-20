<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ModuloAjuda extends Model
{
    use HasFactory;

    protected $connection = 'DBCompra';
    protected $table = 'tbajuda';
    public $timestamps = false;


    protected $fillable = [
        'titulo',
        'descricao',
        'url_pdf',
        'nivel_acesso'
    ];

}