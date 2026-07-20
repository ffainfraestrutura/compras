<?php
echo '
                    <div class="modal fade" id="modalHotel" tabindex="-1" aria-labelledby="modalHotelLabel" aria-hidden="true">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title" id="modalHotelLabel"></h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                                </div>
                                <div class="modal-body">
                                    <form id="formMotivos" method="post" action="./control/modal/processa_HotelModal.php">
                                        <div class="mb-1">
                                            <label for="nome_hotel" class="form-label">Hotel</label>
                                            <input type="text" class="form-control" id="nome_hotel" name="nome_hotel" required>
                                        </div>
                                        <div class="mb-1">
                                            <label for="endereco_hotel" class="form-label">Endereço do Hotel</label>
                                            <input type="text" class="form-control" id="endereco_hotel" name="endereco_hotel" required>
                                        </div>
                                        <div class="mb-1">
                                            <label for="cidade_hotel" class="form-label">Cidade do Hotel</label>
                                            <input type="text" class="form-control" id="cidade_hotel" name="cidade_hotel" required>
                                        </div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                                            <!-- <button type="button" class="btn btn-primary">Salvar mudanças</button> -->
                                            <button type="submit" class="btn btn-primary">Enviar</button>
                                        </div>
                                        <!-- <button type="submit" class="btn btn-primary">Enviar</button> -->
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>';
