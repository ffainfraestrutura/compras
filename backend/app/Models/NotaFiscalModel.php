<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotaFiscalModel extends Model
{
    protected $connection = 'DBCompra';
    protected $table = 'tbnotas_fiscais';
    protected $primaryKey = 'id';
    
    protected $fillable = [
        'numero', 'serie', 'tipo', 'modelo', 'fornecedor_id',
        'data_emissao', 'data_entrada', 'valor_total', 'chave_acesso',
        'status', 'tipo_entrada', 'anexo', 'obs', 'matricula'
    ];

    protected $casts = [
        'data_emissao' => 'date',
        'data_entrada' => 'date',
        'valor_total' => 'decimal:2',
    ];
    
    // REMOVA completamente a linha abaixo se existir:
    // protected $dates = ['deleted_at']; // ← REMOVA ESTA LINHA
    
    // Em vez disso, defina apenas as colunas de timestamp que você tem:
    protected $dates = ['data_emissao', 'data_entrada', 'created_at', 'updated_at'];
    
    // Ou melhor, NÃO use $dates, use apenas $casts:
    // protected $dates = []; // ← Ou deixe vazio
    
    protected $appends = ['anexo_url'];
    
    // IMPORTANTE: Forçar não usar soft deletes
    const DELETED_AT = null;



    public function getAnexoUrlAttribute()
    {
        if (!$this->anexo) {
            return null;
        }
        return url($this->anexo);
    }
}