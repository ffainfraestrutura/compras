<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class EnviarCotacaoEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $emailDestino;
    protected $fornecedorNome;
    protected $codCompra;
    protected $link;
    protected $dataLimite;

    /**
     * Create a new job instance.
     */
    public function __construct($emailDestino, $fornecedorNome, $codCompra, $link, $dataLimite)
    {
        $this->emailDestino = $emailDestino;
        $this->fornecedorNome = $fornecedorNome;
        $this->codCompra = $codCompra;
        $this->link = $link;
        $this->dataLimite = $dataLimite;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Mail::send('emails.cotacao', [
                'fornecedor_nome' => $this->fornecedorNome,
                'cod_compra' => $this->codCompra,
                'link' => $this->link,
                'data_limite' => $this->dataLimite
            ], function ($message) {
                $message->to($this->emailDestino)
                    ->subject("Cotação de Compra #{$this->codCompra}")
                    ->from(config('mail.from.address'), config('mail.from.name'));
            });
            
            Log::info("E-mail enviado com sucesso para: {$this->emailDestino}");
            
        } catch (\Exception $e) {
            Log::error("Erro ao enviar e-mail para {$this->emailDestino}: " . $e->getMessage());
            throw $e;
        }
    }
}