
<?php
echo "
                  <div class='modal fade' id='modalConcluir$id' tabindex='-1' aria-labelledby='modalConcluirsLabel$id' aria-hidden='true'>
                    <div class='modal-dialog modal-dialog-centered modal-xl'>
                      <div class='modal-content'>

                        <form method='post' action='./control/processar_viagem.php' enctype='multipart/form-data'> <!-- Formulário para enviar os dados -->
                          <div class='modal-header'>
                            <h5 class='modal-title' id='modalConcluirLabel$id'>Finalizar Viagem</h5>
                          </div>
                          <div class='modal-body' style='font-size: 13px;'>
                          <h5>Passagem da Ida:</h5>
                          <br>
                          <div class='mb-1'>
                          <label for='idempresa_ida' class='form-label'><strong>Empresa:</strong></label>
                          <select class='form-select-sm' name='idempresa_ida' id='idempresa_ida'>
                                        <option value=''>Selecione...</option>";
                                $sqlEmpresa  = "SELECT id_empresa, 
                                                            nome_empresa
                                                       FROM bdviagem.tbempresas;";
                                $resultadoEmpresa  = mysqli_query($conexao, $sqlEmpresa) or die(mysqli_error($conexao));

                                while ($rowEmpresa  = mysqli_fetch_array($resultadoEmpresa, MYSQLI_ASSOC)) {
                                    $idempresa_ida = $rowEmpresa['id_empresa'];
                                    $descEmpresa  = $rowEmpresa['nome_empresa'];
                                    echo "<option value='$idempresa_ida '>$descEmpresa</option>";
                                }
                                echo "  </select> <button type='button' class='btn btn-sm btn-primary abrir-modal' data-bs-toggle='modal' data-bs-target='#modalEmpresa''>+</button>
                        </div>
                          <p><strong>N° da Passagem Ida:</strong> <input type='number' name='nr_reserva_ida' id='nr_reserva_ida' value = '$nr_reserva_ida'> </p>
                         
                          <p><strong>Embarque:</strong>
                          <select class='form-select-sm' name='idembarque_ida' id='idembarque_ida'>
                                                        <option value=''>Selecione...</option>";
                                $sqlLocal  = "SELECT idlocal_viagem,
                                                                           nome_do_aeroporto, 
                                                                           cidade 
                                                                      FROM bdviagem.tblocalviagem;";
                                $resultadoLocal  = mysqli_query($conexao, $sqlLocal) or die(mysqli_error($conexao));
                                while ($rowEmpresa  = mysqli_fetch_array($resultadoLocal, MYSQLI_ASSOC)) {
                                    $idlocal_viagem = $rowEmpresa['idlocal_viagem'];
                                    $nome_do_aeroporto  = $rowEmpresa['nome_do_aeroporto'];
                                    $cidade  = $rowEmpresa['cidade'];
                                    echo "<option value='$idlocal_viagem '>$nome_do_aeroporto  - $cidade</option>";
                                }
                                echo "  </select> <button type='button' class='btn btn-sm btn-primary abrir-modal' data-bs-toggle='modal' data-bs-target='#modalAeroporto''>+</button>
                         
                          <p><strong>Horário da Viagem: </strong> <input type='time' name='horario_voo_ida' id='horario_voo_ida' value = '$horario_voo_ida'></p>
                          <p><strong>Desembarque: </strong>
                          <select class='form-select-sm' name='iddesembarque_ida' id='iddesembarque_ida'>
                                                        <option value=''>Selecione...</option>";
                                $sqlLocal  = "SELECT idlocal_viagem,
                                                                           nome_do_aeroporto, 
                                                                           cidade 
                                                                      FROM bdviagem.tblocalviagem;";
                                $resultadoLocal  = mysqli_query($conexao, $sqlLocal) or die(mysqli_error($conexao));
                                while ($rowEmpresa  = mysqli_fetch_array($resultadoLocal, MYSQLI_ASSOC)) {
                                    $idlocal_viagem = $rowEmpresa['idlocal_viagem'];
                                    $nome_do_aeroporto  = $rowEmpresa['nome_do_aeroporto'];
                                    $cidade  = $rowEmpresa['cidade'];
                                    echo "<option value='$idlocal_viagem '>$nome_do_aeroporto  - $cidade</option>";
                                }
                                echo "</select> 
                          <p><strong>Valor da Ida:</strong> <input type='text' name='valor_ida' id='valor_ida' value = '$valor_ida'</p>
                          <p><strong>Arquivo da Passagem de ida:</strong> <input type='file' name='img_passagem_ida' accept='.pdf' value = '$img_passagem_ida'></p>
                          <hr>
                          <h5>Passagem da Volta:</h5>
                          <br>
                          <label for='idempresa_volta' class='form-label'><strong>Empresa:  </strong></label>
                           <select class='form-select-sm' name='idempresa_volta' id='idempresa_volta'>
                                        <option value=''>Selecione...</option>";
                                $sqlEmpresa_Volta  = "SELECT id_empresa, 
                                                                     nome_empresa
                                                                FROM bdviagem.tbempresas;";
                                $resultadoEmpresa_volta  = mysqli_query($conexao, $sqlEmpresa_Volta) or die(mysqli_error($conexao));
                                while ($rowEmpresa  = mysqli_fetch_array($resultadoEmpresa_volta, MYSQLI_ASSOC)) {
                                    $idempresa_volta  = $rowEmpresa['id_empresa'];
                                    $descEmpresa  = $rowEmpresa['nome_empresa'];
                                    echo "<option value='$idempresa_volta '>$descEmpresa</option>";
                                }
                                echo "  </select> 
                          <p><strong>N° da Passagem Volta:</strong> <input type='number' name='nr_reserva_volta' id='nr_reserva_volta' value='$nr_reserva_volta'></p>
                          <p><strong>Embarque:</strong>
                           <select class='form-select-sm' name='idembarque_volta' id='idembarque_volta'>
                                                        <option value=''>Selecione...</option>";
                                $sqlLocal  = "SELECT idlocal_viagem,
                                                                           nome_do_aeroporto, 
                                                                           cidade 
                                                                      FROM bdviagem.tblocalviagem;";
                                $resultadoLocal  = mysqli_query($conexao, $sqlLocal) or die(mysqli_error($conexao));
                                while ($rowEmpresa  = mysqli_fetch_array($resultadoLocal, MYSQLI_ASSOC)) {
                                    $idlocal_viagem = $rowEmpresa['idlocal_viagem'];
                                    $nome_do_aeroporto  = $rowEmpresa['nome_do_aeroporto'];
                                    $cidade  = $rowEmpresa['cidade'];
                                    echo "<option value='$idlocal_viagem '>$nome_do_aeroporto  - $cidade</option>";
                                }
                                echo "</select>
                          <p><strong>Horário da Viagem:</strong> <input type='time' name='horario_voo_volta' id='horario_voo_volta' value = '$horario_voo_volta'></p>
                          <p><strong>Desembarque:</strong>
                                     <select class='form-select-sm' name='iddesembarque_volta' id='iddesembarque_volta'>
                                                        <option value=''>Selecione...</option>";
                                $sqlLocal  = "SELECT idlocal_viagem,
                                                                           nome_do_aeroporto, 
                                                                           cidade 
                                                                      FROM bdviagem.tblocalviagem;";
                                $resultadoLocal  = mysqli_query($conexao, $sqlLocal) or die(mysqli_error($conexao));
                                while ($rowEmpresa  = mysqli_fetch_array($resultadoLocal, MYSQLI_ASSOC)) {
                                    $idlocal_viagem = $rowEmpresa['idlocal_viagem'];
                                    $nome_do_aeroporto  = $rowEmpresa['nome_do_aeroporto'];
                                    $cidade  = $rowEmpresa['cidade'];
                                    echo "<option value='$idlocal_viagem '>$nome_do_aeroporto  - $cidade</option>";
                                }
                                echo "</select> 
                          <p><strong>Valor da Volta:</strong> <input type='text' name='valor_passagem_volta' id='valor_passagem_volta' value = '$valor_passagem_volta'></p>
                          <p><strong>Arquivo da Passagem de Volta:</strong> <input type='file' name='img_passagem_volta' accept='.pdf' value='$img_passagem_volta'></p>
                          <hr>
                          <div class = 'Hotel'>
                          <h5>Hospedagem Hotel:</h5>
                          <label for='idhotel' class='form-label'><strong>Hotel: <button type='button' class='btn btn-sm btn-primary abrir-modal' data-bs-toggle='modal' data-bs-target='#modalHotel''>+</button> </strong></label>
                           <select class='form-select-sm' name='idhotel' id='idhotel'>
                           <option value=''>Selecione...</option>";
                                $sqlHotel  = "SELECT idhotel, 
                                                nome_hotel, 
                                                endereco_hotel, 
                                                cidade_hotel 
                                           FROM bdviagem.tbhoteis;";
                                $resultadoHotel  = mysqli_query($conexao, $sqlHotel) or die(mysqli_error($conexao));
                                while ($rowHotel  = mysqli_fetch_array($resultadoHotel, MYSQLI_ASSOC)) {
                                    $idhotel  = $rowHotel['idhotel'];
                                    $nome_hotel  = $rowHotel['nome_hotel'];
                                    $endereco_hotel  = $rowHotel['endereco_hotel'];
                                    $cidade_hotel  = $rowHotel['cidade_hotel'];
                                    echo "<option value='$idhotel '>$nome_hotel - $endereco_hotel - $cidade_hotel</option>";
                                }
                                echo "</select>
                          <!--<p><strong>Nome do Hotel:</strong> <input type='text' name='nome_hotel' id='nome_hotel' value = '$nome_hotel'></p>
                          <p><strong>Endereço do Hotel:</strong> <input type='text' name='endereco_hotel' id='endereco_hotel' value = '$endereco_hotel'></p>-->
                          <br>
                          <br>
                          <p><strong>Valor da Diaria:</strong> <input type='text' name='valor_diaria' id='valor_diaria' value = '$valor_diaria'></p>
                          </div>
                          </div>
                          <div class='modal-footer'>
                           <button class='btn btn-success' type='submit'>Enviar</button>
                           <button type='button' class='btn btn-secondary' data-bs-dismiss='modal'>Fechar</button>
                         </div>
                          </div>
                          <input type='hidden' id='idtbsolviagem' name='idtbsolviagem' value='$id'>
                          </form>
                      </div>
                    </div>
                  </div>";
