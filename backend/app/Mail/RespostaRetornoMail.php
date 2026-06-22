<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class RespostaRetornoMail extends Mailable
{
    use Queueable, SerializesModels;

    public $solicitacoes;
    public $respondedor;
    public $solicitanteOriginal;
    public $setorOrigem;
    public $resposta;
    public $justificativaOriginal;

    public function __construct($solicitacoes, $respondedor, $solicitanteOriginal, $setorOrigem, $resposta, $justificativaOriginal)
    {
        $this->solicitacoes = $solicitacoes;
        $this->respondedor = $respondedor;
        $this->solicitanteOriginal = $solicitanteOriginal;
        $this->setorOrigem = $setorOrigem;
        $this->resposta = $resposta;
        $this->justificativaOriginal = $justificativaOriginal;
    }

    public function build()
    {
        $primeiraSolicitacao = $this->solicitacoes[0];
        $assunto = "Resposta ao seu retorno - Código: {$primeiraSolicitacao->cod_compra}";

        return $this->subject($assunto)
                    ->view('emails.resposta_retorno')
                    ->with([
                        'solicitacoes' => $this->solicitacoes,
                        'respondedor' => $this->respondedor,
                        'solicitanteOriginal' => $this->solicitanteOriginal,
                        'setorOrigem' => $this->setorOrigem,
                        'resposta' => $this->resposta,
                        'justificativaOriginal' => $this->justificativaOriginal
                    ]);
    }
}