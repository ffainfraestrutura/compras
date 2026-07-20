<?php
/* 
- Falta ajustar no banco 
- Confirmar se está chegando no banco 
- Falta colocar na tela dela
*/
echo "
<div class='modal fade' id='modalExcluir$id' tabindex='-1' aria-labelledby='modalExcluirLabel$id' aria-hidden='true'>
    <div class='modal-dialog'>
        <div class='modal-content'>
            <div class='modal-header'>
                <h5 class='modal-title' id='modalExcluirLabel$id'>Confirmar Exclusão</h5>
                <button type='button' class='btn-close' data-bs-dismiss='modal' aria-label='Close'></button>
            </div>
            <div class='modal-body'>
                <form method='post' action='./control/modal/processa_exclusao_registro.php'>
                    <p>Tem certeza de que deseja excluir este item?</p>
                     <textarea name='motivo_exclusao' class='border border-black p-1 rounded-md' id='motivo_exclusao' cols='50' rows='3'
                      maxlength='255'
                      placeholder='Por favor, insira uma Justificativa referente a exclusão da viagem.'
                      required></textarea>
                    <input type='hidden' name='idtbsolviagem' value='$id'>
                    <div class='modal-footer'>
                    <button type='submit' class='btn btn-danger'>Excluir</button>
                    <button type='button' class='btn btn-secondary' data-bs-dismiss='modal'>Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>";
?>
