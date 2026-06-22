<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FilialModel extends Model
{
    use HasFactory;

    protected $connection = 'DBPonto';
    protected $table = 'tbfilial';
    public $timestamps = false;
    protected $primaryKey = 'idtbfilial'; // 👈 define a PK correta



    protected $fillable = [
        'idtbfilial',
        'descricao',
        'CNPJ',
        'endereco',
        'numero',
        'complemento',
        'bairro',
        'cidade',
        'estado',
        'cep',
        'telefone',
        'mail',
        'telefone2',
        'razsocial',
        'visivel',
        'ciclo_banco',
        'dt_in_banco'
    ];

    protected $hidden = [
        'ciclo_banco',
        'dt_in_banco'
    ];
}
