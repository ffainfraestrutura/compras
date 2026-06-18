<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FornecedoresModel extends Model
{
    protected $connection = 'DBCompra';
    protected $table = 'tbfornecedor';
    public $timestamps = false;

    protected $fillable = [
        'idtbfornecedores', 
        'razao_social', 
        'nome_fantasia', 
        'cnpj', 
        'inscricao_estadual', 
        'telefone', 
        'email', 
        'site', 
        'endereco', 
        'cidade', 
        'estado', 
        'cep', 
        'nome_contato', 
        'telefone_contato', 
        'email_contato', 
        'categoria', 
        'ativo', 
        'data_cadastro', 
        'observacoes'
    ];
}
