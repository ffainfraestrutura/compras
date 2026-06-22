<?php
// app/Models/DocumentoCompra.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentoCompra extends Model
{
    use HasFactory;

    /**
     * Nome da tabela no banco de dados
     */
    protected $table = 'documentos_compras';
    protected $connection = 'DBCompra';


    /**
     * Campos que podem ser preenchidos em massa
     */
    protected $fillable = [
        'cod_compra',
        'nome_original',
        'nome_arquivo',
        'caminho',
        'tamanho',
        'extensao',
        'ordem',
        'matricula_upload',
        'data_upload'
    ];

    /**
     * Campos que devem ser convertidos para tipos nativos
     */
    protected $casts = [
        'data_upload' => 'datetime',
        'tamanho' => 'integer',
        'ordem' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Relacionamento com o usuário que fez o upload
     * (assumindo que existe uma tabela de usuários com matricula)
     */
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'matricula_upload', 'matricula');
    }

    /**
     * Escopo para buscar documentos de uma compra específica
     */
    public function scopeDaCompra($query, $codCompra)
    {
        return $query->where('cod_compra', $codCompra);
    }

    /**
     * Escopo para ordenar por ordem
     */
    public function scopeOrdenado($query)
    {
        return $query->orderBy('ordem')->orderBy('created_at', 'desc');
    }

    /**
     * Retorna o caminho completo do arquivo no servidor
     */
    public function getCaminhoCompletoAttribute()
    {
        return public_path($this->caminho);
    }

    /**
     * Retorna o tamanho formatado (KB, MB, etc)
     */
    public function getTamanhoFormatadoAttribute()
    {
        $bytes = $this->tamanho;
        $unidades = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($unidades) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $unidades[$i];
    }

    /**
     * Retorna o ícone baseado na extensão
     */
    public function getIconeAttribute()
    {
        $extensao = strtolower($this->extensao);
        
        $icones = [
            'pdf' => '📄',
            'doc' => '📝',
            'docx' => '📝',
            'xls' => '📊',
            'xlsx' => '📊',
            'jpg' => '🖼️',
            'jpeg' => '🖼️',
            'png' => '🖼️'
        ];
        
        return $icones[$extensao] ?? '📁';
    }

    /**
     * Retorna se o arquivo existe no servidor
     */
    public function getExisteAttribute()
    {
        return file_exists($this->caminho_completo);
    }
}