<div class='modal fade' id='modalConcluir<?php echo $id; ?>' tabindex='-1' aria-hidden='true'>
    <div class='modal-dialog modal-dialog-centered modal-xl'>
        <div class='modal-content'>
            <form method='post' action='./control/processar_viagem.php' enctype='multipart/form-data'>
                <div class='modal-header bg-primary text-white'>
                    <h5 class='modal-title'><i class='fas fa-plane'></i> Finalizar Viagem - <?php echo htmlspecialchars($nome); ?></h5>
                    <button type='button' class='btn-close btn-close-white' data-bs-dismiss='modal' aria-label='Close'></button>
                </div>

                <div class='modal-body'>
                    <!-- Passagem Ida -->
                    <div class='card mb-4'>
                        <div class='card-header bg-light'>
                            <h5 class='mb-0'><i class='fas fa-plane-departure me-2'></i>Passagem da Ida</h5>
                        </div>
                        <div class='card-body'>
                            <div class='row g-3'>
                                <div class='col-md-6'>
                                    <div class='input-group'>
                                        <select class='form-select select2' name='idempresa_ida' id='idempresa_ida_<?php echo $id; ?>' >
                                            <option value=''>Selecione a Empresa...</option>
                                            <?php
                                            $sqlEmpresa = "SELECT id_empresa, nome_empresa FROM bdviagem.tbempresas";
                                            $resultadoEmpresa = mysqli_query($conexao, $sqlEmpresa);
                                            while ($row = mysqli_fetch_assoc($resultadoEmpresa)): ?>
                                                <option value='<?= $row['id_empresa'] ?>' <?= $row['id_empresa'] == $idempresa_ida ? 'selected' : '' ?>>
                                                    <?= htmlspecialchars($row['nome_empresa']) ?>
                                                </option>
                                            <?php endwhile; ?>
                                        </select>
                                        <button type='button' class='btn btn-outline-secondary' data-bs-toggle='modal' data-bs-target='#modalEmpresa'>
                                            <i class='fas fa-plus'></i>
                                        </button>
                                    </div>
                                </div>

                                <div class='col-md-6'>
                                    <input type='number' class='form-control' name='nr_reserva_ida' id='nr_reserva_ida_<?php echo $id; ?>' placeholder='Número da Reserva' value='<?= htmlspecialchars($nr_reserva_ida) ?>'>
                                </div>

                                <div class='col-md-6'>
                                    <div class='input-group'>
                                        <select class='form-select select2' name='idembarque_ida' id='idembarque_ida_<?php echo $id; ?>' >
                                            <option value=''>Local de Embarque...</option>
                                            <?php
                                            $sqlLocal = "SELECT idlocal_viagem, nome_do_aeroporto, cidade FROM bdviagem.tblocalviagem";
                                            $resultadoLocal = mysqli_query($conexao, $sqlLocal);
                                            while ($row = mysqli_fetch_assoc($resultadoLocal)): ?>
                                                <option value='<?= $row['idlocal_viagem'] ?>' <?= $row['idlocal_viagem'] == $idembarque_ida ? 'selected' : '' ?>>
                                                    <?= htmlspecialchars($row['nome_do_aeroporto'] . ' - ' . $row['cidade']) ?>
                                                </option>
                                            <?php endwhile; ?>
                                        </select>
                                        <button type='button' class='btn btn-outline-secondary' data-bs-toggle='modal' data-bs-target='#modalAeroporto'>
                                            <i class='fas fa-plus'></i>
                                        </button>
                                    </div>
                                </div>

                                <div class='col-md-6'>
                                    <select class='form-select select2' name='iddesembarque_ida' id='iddesembarque_ida_<?php echo $id; ?>' >
                                        <option value=''>Local de Desembarque...</option>
                                        <?php
                                        mysqli_data_seek($resultadoLocal, 0);
                                        while ($row = mysqli_fetch_assoc($resultadoLocal)): ?>
                                            <option value='<?= $row['idlocal_viagem'] ?>' <?= $row['idlocal_viagem'] == $iddesembarque_ida ? 'selected' : '' ?>>
                                                <?= htmlspecialchars($row['nome_do_aeroporto'] . ' - ' . $row['cidade']) ?>
                                            </option>
                                        <?php endwhile; ?>
                                    </select>
                                </div>

                                <div class='col-md-4'>
                                    <input type='time' class='form-control' name='horario_voo_ida' id='horario_voo_ida_<?php echo $id; ?>' value='<?= htmlspecialchars($horario_voo_ida) ?>'>
                                </div>

                                <div class='col-md-4'>
                                    <div class='input-group'>
                                        <span class='input-group-text'>R$</span>
                                        <input type='text' class='form-control' name='valor_ida' id='valor_ida_<?php echo $id; ?>' placeholder='Valor' value='<?= htmlspecialchars($valor_ida) ?>'>
                                    </div>
                                </div>

                                <!-- <div class='col-md-4'>
                                    <input type='file' class='form-control' name='img_passagem_ida' id='img_passagem_ida_<?php echo $id; ?>' accept='.pdf'>
                                </div> -->
                            </div>
                        </div>
                    </div>

                    <!-- Passagem Volta -->
                    <div class='card mb-4'>
                        <div class='card-header bg-light'>
                            <h5 class='mb-0'><i class='fas fa-plane-arrival me-2'></i>Passagem da Volta</h5>
                        </div>
                        <div class='card-body'>
                            <div class='row g-3'>
                                <div class='col-md-6'>
                                    <select class='form-select select2' name='idempresa_volta' id='idempresa_volta_<?php echo $id; ?>'>
                                        <option value=''>Selecione a Empresa...</option>
                                        <?php
                                        mysqli_data_seek($resultadoEmpresa, 0);
                                        while ($row = mysqli_fetch_assoc($resultadoEmpresa)): ?>
                                            <option value='<?= $row['id_empresa'] ?>' <?= $row['id_empresa'] == $idempresa_volta ? 'selected' : '' ?>>
                                                <?= htmlspecialchars($row['nome_empresa']) ?>
                                            </option>
                                        <?php endwhile; ?>
                                    </select>
                                </div>

                                <div class='col-md-6'>
                                    <input type='number' class='form-control' name='nr_reserva_volta' id='nr_reserva_volta_<?php echo $id; ?>' placeholder='Número da Reserva' value='<?= htmlspecialchars($nr_reserva_volta) ?>'>
                                </div>

                                <div class='col-md-6'>
                                    <select class='form-select select2' name='idembarque_volta' id='idembarque_volta_<?php echo $id; ?>'>
                                        <option value=''>Local de Embarque...</option>
                                        <?php
                                        mysqli_data_seek($resultadoLocal, 0);
                                        while ($row = mysqli_fetch_assoc($resultadoLocal)): ?>
                                            <option value='<?= $row['idlocal_viagem'] ?>' <?= $row['idlocal_viagem'] == $idembarque_volta ? 'selected' : '' ?>>
                                                <?= htmlspecialchars($row['nome_do_aeroporto'] . ' - ' . $row['cidade']) ?>
                                            </option>
                                        <?php endwhile; ?>
                                    </select>
                                </div>

                                <div class='col-md-6'>
                                    <select class='form-select select2' name='iddesembarque_volta' id='iddesembarque_volta_<?php echo $id; ?>'>
                                        <option value=''>Local de Desembarque...</option>
                                        <?php
                                        mysqli_data_seek($resultadoLocal, 0);
                                        while ($row = mysqli_fetch_assoc($resultadoLocal)): ?>
                                            <option value='<?= $row['idlocal_viagem'] ?>' <?= $row['idlocal_viagem'] == $iddesembarque_volta ? 'selected' : '' ?>>
                                                <?= htmlspecialchars($row['nome_do_aeroporto'] . ' - ' . $row['cidade']) ?>
                                            </option>
                                        <?php endwhile; ?>
                                    </select>
                                </div>

                                <div class='col-md-4'>
                                    <input type='time' class='form-control' name='horario_voo_volta' id='horario_voo_volta_<?php echo $id; ?>' value='<?= htmlspecialchars($horario_voo_volta) ?>'>
                                </div>

                                <div class='col-md-4'>
                                    <div class='input-group'>
                                        <span class='input-group-text'>R$</span>
                                        <input type='text' class='form-control' name='valor_passagem_volta' id='valor_passagem_volta_<?php echo $id; ?>' placeholder='Valor' value='<?= htmlspecialchars($valor_passagem_volta) ?>'>
                                    </div>
                                </div>

                                <!-- <div class='col-md-4'>
                                    <input type='file' class='form-control' name='img_passagem_volta' id='img_passagem_volta_<?php echo $id; ?>' accept='.pdf'>
                                </div> -->
                            </div>
                        </div>
                    </div>

                    <!-- Hospedagem -->
                    <div class='card mb-4'>
                        <div class='card-header bg-light'>
                            <h5 class='mb-0'><i class='fas fa-hotel me-2'></i>Hospedagem</h5>
                        </div>
                        <div class='card-body'>
                            <div class='row g-3'>
                                <div class='col-md-8'>
                                    <div class='input-group'>
                                        <select class='form-select select2' name='idhotel' id='idhotel_<?php echo $id; ?>'>
                                            <option value=''>Selecione o Hotel...</option>
                                            <?php
                                            $sqlHotel = "SELECT idhotel, nome_hotel, endereco_hotel, cidade_hotel FROM bdviagem.tbhoteis";
                                            $resultadoHotel = mysqli_query($conexao, $sqlHotel);
                                            while ($row = mysqli_fetch_assoc($resultadoHotel)): ?>
                                                <option value='<?= $row['idhotel'] ?>' <?= $row['idhotel'] == $idhotel ? 'selected' : '' ?>>
                                                    <?= htmlspecialchars($row['nome_hotel'] . ' - ' . $row['cidade_hotel']) ?>
                                                </option>
                                            <?php endwhile; ?>
                                        </select>
                                        <button type='button' class='btn btn-outline-secondary' data-bs-toggle='modal' data-bs-target='#modalHotel'>
                                            <i class='fas fa-plus'></i>
                                        </button>
                                    </div>
                                </div>

                                <div class='col-md-4'>
                                    <div class='input-group'>
                                        <span class='input-group-text'>R$</span>
                                        <input type='text' class='form-control' name='valor_diaria' id='valor_diaria_<?php echo $id; ?>' placeholder='Valor da Diária' value='<?= htmlspecialchars($valor_diaria) ?>'>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <input type='hidden' name='idtbsolviagem' id='idtbsolviagem_<?php echo $id; ?>' value='<?= htmlspecialchars($id) ?>'>
                </div>

                <div class='modal-footer'>
                    <button type='submit' class='btn btn-success'><i class='fas fa-save me-2'></i>Salvar Alterações</button>
                    <button type='button' class='btn btn-secondary' data-bs-dismiss='modal'><i class='fas fa-times me-2'></i>Fechar</button>
                </div>
            </form>
        </div>
    </div>
</div>