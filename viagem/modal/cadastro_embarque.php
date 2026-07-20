<?php
echo '
 <div class="modal fade" id="modalAeroporto" tabindex="-1" aria-labelledby="modalAeroportoLabel" aria-hidden="true">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title" id="modalAeroportoLabel">Cadastrar Local Viagem</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                                </div>
                                <div class="modal-body">
                                    <form id="formEmpresa" method="post" action="./control/modal/processa_AeroportoModal.php">
                                        <div class="mb-3">
                                            <label for="nome_do_aeroporto" class="form-label">Nome do Local Viagem </label>
                                            <input type="text" class="form-control" id="nome_do_aeroporto" name="nome_do_aeroporto" required>
                                            <label for="cidade">Cidade da Viagem (Abreviação)</label>
                                            <input type="text" class="form-control" id="cidade" name="cidade" required>
                                        </div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                                            <button type="submit" class="btn btn-primary">Enviar</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
</div>';
