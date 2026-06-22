<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NovaSolicitacaoMail extends Mailable
{
    use Queueable, SerializesModels;

    public $solicitacao;  // Mude o nome para ficar claro que é uma única

    public function __construct($solicitacao)
    {
        $this->solicitacao = $solicitacao;  // Agora recebe UM objeto
    }

    public function build()
    {
        // Não precisa mais de count()
        $assunto = "Nova Solicitação de Compra - {$this->solicitacao->cod_material}";

        return $this->subject($assunto)
                    ->view('emails.nova_solicitacao')
                    ->with(['solicitacao' => $this->solicitacao]);  // Passa uma única
    }
}