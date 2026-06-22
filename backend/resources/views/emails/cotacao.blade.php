<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Cotacao de Compra</title>
</head>

<body style="font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Olá {{ $fornecedor_nome }}!</h2>

        <p>Estamos realizando um processo de compra e gostaríamos de solicitar a sua cotação.</p>

        <p>Por favor, acesse o link abaixo para visualizar os itens e enviar sua proposta:</p>

        <p style="margin: 30px 0;">
            <a href="{{ $link }}" style="background-color: #007bff; 
                      color: white; 
                      padding: 12px 24px; 
                      text-decoration: none; 
                      border-radius: 5px;
                      display: inline-block;">
                Acessar Cotação
            </a>
        </p>

        <!-- <p><strong>Prazo para envio da proposta:</strong> {{ $data_limite }}</p> -->

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

        <p style="color: #666; font-size: 12px;">
            Este é um e-mail automático, por favor não responda.<br>
            <!-- Em caso de dúvidas, entre em contato com o setor de compras. -->
        </p>
    </div>
</body>

</html>