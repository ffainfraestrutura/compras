<?php
     echo "
     <div class='modal fade' id='modalDetalhes$id' tabindex='-1' aria-labelledby='exampleModalLabel' aria-hidden='true' enctype='multipart/form-data'>
        <div class='modal-dialog modal-dialog-centered'>
           <div class='modal-content'>
             <div class='modal-header'>
             <h5 class='modal-title' id='modalDetalhesLabel$id'>Detalhes da Viagem</h5>
             <button type='button' class='btn-sm btn-close' data-bs-dismiss='modal' aria-label='Fechar'></button>
             </div>
             <div class='modal-body' style='font-size: 13px;'>
                 <p><strong>Nome:</strong> $nome</p>
                 <p><strong>CPF:</strong> $cpf</p>
                 <p><strong>Data de Nascimento:</strong> $dtnascFormatada</p>
                 <p><strong>Data de Ida:</strong> $dataini</p>
                 <p><strong>Data de Volta:</strong> $datafim</p>
                 <p><strong>Origem:</strong> $origem</p>
                 <p><strong>Destino:</strong> $destino</p>
                 <p><strong>Motivo da Viagem:</strong> $motivo</p>
                 <p><strong>Observação Viagem:</strong> $motivo_obs</p>
                 <p><strong>Adiantamento:</strong> $adiantamento_option</p>
                 <p><strong>Valor Adiantamento:</strong> R$$valor_adiantamento</p>
                 <p><strong>Tipo de Pix:</strong> $option_pix</p>
                 <p><strong>Pix: </strong> $chave_pix</p>
                 <p><strong>Aprovado pelo Gerente: </strong> $data_formatadaGerente</p>
                 <p><strong>Aprovado pelo Diretor: </strong> $data_formatadaDiretor</p>
                 <p><strong>Aprovado pelo COO/CFO: </strong> $data_formatadacoo</p>
                 <hr>
                 <h5>Passagem de Ida:</h5>
                 <p><strong>Passagem:</strong> $passagemTextoIda</p>
                 <p><strong>Empresa:</strong> $empresa_ida</p>
                 <p><strong>N° da Passagem:</strong> $nr_reserva_ida</p>
                 <p><strong>Local de Origem:</strong> $embarque_ida</p>
                 <p><strong>Horário da Viagem:</strong> $horario_voo_ida</p>
                 <p><strong>Local de Destino:</strong> $desembarque_ida</p>
                 <p><strong>Valor da Ida:</strong>R$$valor_ida</p>
                 <hr>
                 <h5>Passagem de Volta:</h5>
                 <p><strong>Passagem:</strong> $passagemTextoVolta </p>
                 <p><strong>Empresa:</strong> $empresa_volta</p>
                 <p><strong>N° da Passagem:</strong> $nr_reserva_volta </p>
                 <p><strong>Local de Origem:</strong> $embarque_volta</p>
                 <p><strong>Horário da Viagem</strong> $horario_voo_volta</p>
                 <p><strong>Local de Destino:</strong> $desembarque_volta</p>
                 <p><strong>Valor da Volta:</strong>R$$valor_passagem_volta</p>
                 <hr>
                 <p><strong>Hospedagem:</strong> $hospedagemTexto</p>
                 <p><strong>Hotel:</strong> $hotel</p>
                 <p><strong> Valor Hospedagem:</strong>R$$valor_diaria</p>
                 <hr>
                 <p><strong>Dados do Solicitante:</strong></p>
                 <p><strong>Solicitante:</strong> $nome_sol</p>
                 <p><strong>Cargo:</strong> $cargo_sol</p>
             </div>
               <div class='modal-footer'>
              <form method='post' action='./control/processar_finalizacao.php'>
               <button class='btn btn-success' type='submit' name='aceite_do_diretor' value='4'>Finalizar</button>
               <button type='button' class='btn btn-secondary' data-bs-dismiss='modal'>Fechar</button>
               <input type='hidden' id='idtbsolviagem' name='idtbsolviagem' value='$id'>
              </form>
           </div>
         </div>
       </div>
     </div>";
