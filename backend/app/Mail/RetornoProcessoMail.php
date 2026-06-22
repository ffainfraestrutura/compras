<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class RetornoProcessoMail extends Mailable
{
    use Queueable, SerializesModels;

    public $solicitacoes;
    public $origem;
    public $setorDestino;
    public $justificativa;
    public $status;

    public function __construct($solicitacoes, $origem, $setorDestino, $justificativa = null, $status = 'retornado')
    {
        $this->solicitacoes = $solicitacoes;
        $this->origem = $origem;
        $this->setorDestino = $setorDestino;
        $this->justificativa = $justificativa;
        $this->status = $status;
    }

    public function build()
    {
        $primeiraSolicitacao = $this->solicitacoes[0];
        $assunto = "Processo Retornado - Código: {$primeiraSolicitacao->cod_compra}";

        return $this->subject($assunto)
                    ->view('emails.retorno_processo')
                    ->with([
                        'solicitacoes' => $this->solicitacoes,
                        'origem' => $this->origem,
                        'setorDestino' => $this->setorDestino,
                        'justificativa' => $this->justificativa,
                        'status' => $this->status
                    ]);
    }
}