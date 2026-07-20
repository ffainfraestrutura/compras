<div class="modal fade" id="modalDetalhes<?php echo $id; ?>" tabindex="-1" aria-labelledby="modalDetalhesLabel<?php echo $id; ?>" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
            <div class="modal-header bg-primary text-white">
                <h5 class="modal-title"><i class="fas fa-info-circle me-2"></i>Detalhes da Viagem - <?php echo htmlspecialchars($nome); ?></h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            
            <div class="modal-body">
                <div class="row">
                    <!-- Coluna 1 - Dados Pessoais e Viagem -->
                    <div class="col-md-6">
                        <div class="card mb-3">
                            <div class="card-header bg-light">
                                <h6 class="mb-0"><i class="fas fa-user me-2"></i>Dados Pessoais</h6>
                            </div>
                            <div class="card-body">
                                <ul class="list-group list-group-flush">
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">CPF:</span>
                                        <span><?php echo htmlspecialchars($cpf); ?></span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Data Nasc.:</span>
                                        <span><?php echo htmlspecialchars($dtnascFormatada); ?></span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div class="card mb-3">
                            <div class="card-header bg-light">
                                <h6 class="mb-0"><i class="fas fa-plane me-2"></i>Dados da Viagem</h6>
                            </div>
                            <div class="card-body">
                                <ul class="list-group list-group-flush">
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Data Ida:</span>
                                        <span><?php echo htmlspecialchars($dataini); ?></span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Data Volta:</span>
                                        <span><?php echo htmlspecialchars($datafim); ?></span>
                                    </li>
                                    <li class="list-group-item py-2">
                                        <span class="fw-bold">Origem:</span>
                                        <p><?php echo htmlspecialchars($origem); ?></p>
                                    </li>
                                    <li class="list-group-item py-2">
                                        <span class="fw-bold">Destino:</span>
                                        <p><?php echo htmlspecialchars($destino); ?></p>
                                    </li>
                                    <li class="list-group-item py-2">
                                        <span class="fw-bold">Motivo:</span>
                                        <p><?php echo htmlspecialchars($motivo); ?></p>
                                    </li>
                                    <li class="list-group-item py-2">
                                        <span class="fw-bold">Observações:</span>
                                        <p><?php echo htmlspecialchars($motivo_obs); ?></p>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- Coluna 2 - Financeiro e Aprovações -->
                    <div class="col-md-6">
                        <div class="card mb-3">
                            <div class="card-header bg-light">
                                <h6 class="mb-0"><i class="fas fa-money-bill-wave me-2"></i>Financeiro</h6>
                            </div>
                            <div class="card-body">
                                <ul class="list-group list-group-flush">
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Adiantamento:</span>
                                        <span><?php echo htmlspecialchars($adiantamento_option); ?></span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Valor:</span>
                                        <span>R$ <?php echo htmlspecialchars($valor_adiantamento); ?></span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Tipo PIX:</span>
                                        <span><?php echo htmlspecialchars($option_pix); ?></span>
                                    </li>
                                    <li class="list-group-item py-2">
                                        <span class="fw-bold">Chave PIX:</span>
                                        <p><?php echo htmlspecialchars($chave_pix); ?></p>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div class="card mb-3">
                            <div class="card-header bg-light">
                                <h6 class="mb-0"><i class="fas fa-check-circle me-2"></i>Aprovações</h6>
                            </div>
                            <div class="card-body">
                                <ul class="list-group list-group-flush">
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Gerente:</span>
                                        <span><?php echo htmlspecialchars($data_formatadaGerente); ?></span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Diretor:</span>
                                        <span><?php echo htmlspecialchars($data_formatadaDiretor); ?></span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">COO/CFO:</span>
                                        <span><?php echo htmlspecialchars($data_formatadacoo); ?></span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Passagens e Hospedagem -->
                <div class="row mt-3">
                    <div class="col-md-6">
                        <div class="card mb-3">
                            <div class="card-header bg-light">
                                <h6 class="mb-0"><i class="fas fa-plane-departure me-2"></i>Passagem de Ida</h6>
                            </div>
                            <div class="card-body">
                                <ul class="list-group list-group-flush">
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Status:</span>
                                        <span><?php echo htmlspecialchars($passagemTextoIda); ?></span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Empresa:</span>
                                        <span><?php echo htmlspecialchars($empresa_ida); ?></span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">N° Passagem:</span>
                                        <span><?php echo htmlspecialchars($nr_reserva_ida); ?></span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Origem:</span>
                                        <span><?php echo htmlspecialchars($embarque_ida); ?></span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Destino:</span>
                                        <span><?php echo htmlspecialchars($desembarque_ida); ?></span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Horário:</span>
                                        <span><?php echo htmlspecialchars($horario_voo_ida); ?></span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Valor:</span>
                                        <span>R$ <?php echo htmlspecialchars($valor_ida); ?></span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-6">
                        <div class="card mb-3">
                            <div class="card-header bg-light">
                                <h6 class="mb-0"><i class="fas fa-plane-arrival me-2"></i>Passagem de Volta</h6>
                            </div>
                            <div class="card-body">
                                <ul class="list-group list-group-flush">
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Status:</span>
                                        <span><?php echo htmlspecialchars($passagemTextoVolta); ?></span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Empresa:</span>
                                        <span><?php echo htmlspecialchars($empresa_volta); ?></span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">N° Passagem:</span>
                                        <span><?php echo htmlspecialchars($nr_reserva_volta); ?></span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Origem:</span>
                                        <span><?php echo htmlspecialchars($embarque_volta); ?></span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Destino:</span>
                                        <span><?php echo htmlspecialchars($desembarque_volta); ?></span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Horário:</span>
                                        <span><?php echo htmlspecialchars($horario_voo_volta); ?></span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Valor:</span>
                                        <span>R$ <?php echo htmlspecialchars($valor_passagem_volta); ?></span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row mt-3">
                    <div class="col-12">
                        <div class="card mb-3">
                            <div class="card-header bg-light">
                                <h6 class="mb-0"><i class="fas fa-hotel me-2"></i>Hospedagem</h6>
                            </div>
                            <div class="card-body">
                                <ul class="list-group list-group-flush">
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Status:</span>
                                        <span><?php echo htmlspecialchars($hospedagemTexto); ?></span>
                                    </li>
                                    <li class="list-group-item py-2">
                                        <span class="fw-bold">Hotel:</span>
                                        <p><?php echo htmlspecialchars($hotel); ?></p>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Valor Diária:</span>
                                        <span>R$ <?php echo htmlspecialchars($valor_diaria); ?></span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row mt-3">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header bg-light">
                                <h6 class="mb-0"><i class="fas fa-user-tie me-2"></i>Solicitante</h6>
                            </div>
                            <div class="card-body">
                                <ul class="list-group list-group-flush">
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Nome:</span>
                                        <span><?php echo htmlspecialchars($nome_sol); ?></span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center py-2">
                                        <span class="fw-bold">Cargo:</span>
                                        <span><?php echo htmlspecialchars($cargo_sol); ?></span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <form method="post" action="./control/processar_finalizacao.php" class="w-100">
                    <div class="d-flex justify-content-between w-100">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Fechar
                        </button>
                        <button class="btn btn-success" type="submit" name="aceite_do_diretor" value="4">
                            <i class="fas fa-check-circle me-2"></i>Finalizar
                        </button>
                    </div>
                    <input type="hidden" id="idtbsolviagem" name="idtbsolviagem" value="<?php echo $id; ?>">
                </form>
            </div>
        </div>
    </div>
</div>