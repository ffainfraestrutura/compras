<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AprovacaoSolicitacaoMail extends Mailable
{
    use Queueable, SerializesModels;

    public $solicitacoes;
    public $aprovador;
    public $tipoAprovacao;
    public $justificativa;
    public $status;

    public function __construct($solicitacoes, $aprovador, $tipoAprovacao, $justificativa = null, $status = 'aprovado')
    {
        $this->solicitacoes = $solicitacoes;
        $this->aprovador = $aprovador;
        $this->tipoAprovacao = $tipoAprovacao; // 'material', 'compra', 'diretor', 'gerente'
        $this->justificativa = $justificativa;
        $this->status = $status; // 'aprovado', 'reprovado', 'pendente'
    }

    public function build()
    {
        $primeiraSolicitacao = $this->solicitacoes[0];
        
        if ($this->status == 'reprovado') {
            $assunto = "Solicitação de Compra #{$primeiraSolicitacao->cod_compra} - REPROVADA";
        } else {
            $assunto = "Solicitação de Compra #{$primeiraSolicitacao->cod_compra} - Aprovada por " . $this->getNomeNivel();
        }

        return $this->subject($assunto)
                    ->view('emails.aprovacao_solicitacao')
                    ->with([
                        'solicitacoes' => $this->solicitacoes,
                        'aprovador' => $this->aprovador,
                        'tipoAprovacao' => $this->tipoAprovacao,
                        'justificativa' => $this->justificativa,
                        'status' => $this->status,
                        'nomeNivel' => $this->getNomeNivel()
                    ]);
    }

    private function getNomeNivel()
    {
        $nomes = [
            'material' => 'Aprovador de Material',
            'compra' => 'Aprovador de Compras',
            'diretor' => 'Diretor',
            'gerente' => 'Gerente'
        ];

        return $nomes[$this->tipoAprovacao] ?? 'Aprovador';
    }
}