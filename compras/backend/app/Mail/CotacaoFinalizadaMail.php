<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class CotacaoFinalizadaMail extends Mailable
{
    use Queueable, SerializesModels;

    public $dados;

    public function __construct($dados)
    {
        $this->dados = $dados;
    }

    public function build()
    {
        return $this->subject('Cotação Finalizada - Código: ' . $this->dados['cod_compra'])
                    ->view('emails.cotacao_finalizada')
                    ->with('dados', $this->dados);
    }
}