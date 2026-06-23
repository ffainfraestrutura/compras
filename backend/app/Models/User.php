<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    protected $connection = 'mysql';
    protected $table = 'bdcorp.tbusuario';
    protected $primaryKey = 'id_usuario';
    public $timestamps = false;

    // Campos que podem ser preenchidos em massa (ex: via create())
    protected $fillable = [
        'usuario',
        'senha',
        'matricula',
        'nome',
        'perfil',
        'email',
        'compras',
        // adicione outros campos conforme sua necessidade
    ];

    // Oculta esses campos na resposta JSON
    protected $hidden = [
        'senha',
        'emailpass',
    ];

    /**
     * Informa ao Laravel qual campo representa a senha
     */
    public function getAuthPassword()
    {
        return $this->senha;
    }

    /**
     * JWT - Identificador único do token
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * JWT - Claims adicionais (se quiser enviar mais dados no token)
     */
    public function getJWTCustomClaims()
    {
        return [];
    }
}
