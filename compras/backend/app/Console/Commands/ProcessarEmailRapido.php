<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use App\Mail\CotacaoFinalizadaMail;

class ProcessarEmailRapido extends Command
{
    protected $signature = 'email:processar-rapido {arquivo}';
    protected $description = 'Processa email rapidamente em background';

    public function handle()
    {
        $arquivo = storage_path('app/' . $this->argument('arquivo'));
        
        if (!file_exists($arquivo)) {
            $this->error('Arquivo não encontrado: ' . $arquivo);
            return;
        }
        
        $data = json_decode(file_get_contents($arquivo), true);
        
        try {
            \Log::info('Iniciando envio de email em background...');
            
            // ?? ENVIO DIRETO - SEM QUEUE
            Mail::to('pedrolopesph0@gmail.com')
                ->bcc($data['destinatarios'])
                ->send(new CotacaoFinalizadaMail($data['dados']));
            
            \Log::info('? Email enviado com sucesso!');
            $this->info('Email enviado para ' . count($data['destinatarios']) . ' destinatários');
            
            // Remove arquivo temporário
            unlink($arquivo);
            
        } catch (\Exception $e) {
            \Log::error('? Erro ao enviar email: ' . $e->getMessage());
            $this->error('Erro: ' . $e->getMessage());
        }
    }
}