<?php
$hoje = date('Y-m-d');
$sql = "SELECT * FROM bdcorp.tbusuario WHERE usuario= '$matricula1'";
$resultado = mysqli_query($conexao, $sql) or die(mysqli_error($conexao));
while ($row = mysqli_fetch_array($resultado, MYSQLI_BOTH)) {

    $nome = $row['nome'];
    $usuario = $row['usuario'];
    $Tipo_Perfilviagem = $row['viagem'];
}
?>
<nav class="sb-topnav navbar navbar-expand navbar-dark bg-dark">
    <!-- Navbar Brand-->
    <a class="navbar-brand ps-3" href="#"><img class="imgicon mr-mn" src="./src/images/logoredonda.png" width="45" height="45"></a>
    <!-- Sidebar Toggle-->
    <button class="btn btn-link btn-sm order-1 order-lg-0 me-4 me-lg-0" id="sidebarToggle" href="#!"><i class="fas fa-bars"></i></button>
    <div class="d-none d-md-inline-block form-inline ms-auto me-0 me-md-3 my-2 my-md-0">
    </div>
    <!-- Navbar-->
    <ul class="navbar-nav ms-auto ms-md-0 me-3 me-lg-4">
        <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" id="navbarDropdown" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false"><i class="fas fa-user fa-fw"></i></a>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                <li><a class="dropdown-item" href="./index.php">Logout</a></li>
                <!-- <li><a class="dropdown-item" href="./altsenha.php">Alterar senha</a></li> -->
            </ul>
        </li>
    </ul>
</nav>

<div id="layoutSidenav">
    <div id="layoutSidenav_nav">
        <nav class="sb-sidenav accordion sb-sidenav-dark" id="sidenavAccordion">
            <div class="sb-sidenav-menu">
                <div class="nav">
                    <?php
                    $menu = '';
                    $matriculasAcessoEspecial = ['620027', '601003'];
                    $matriculaLogada = (string) ($usuario ?? $matricula1);

                    if (in_array($matriculaLogada, $matriculasAcessoEspecial, true)) {
                        $menu = "
                        <a class='nav-link collapsed' href='#' data-bs-toggle='collapse' data-bs-target='#collapseLayouts' aria-expanded='false' aria-controls='collapseLayouts'>
                            <div class='sb-nav-link-icon'><i class='fas fa-fw fa-chart-area'></i></div>
                             Menu
                            <div class='sb-sidenav-collapse-arrow'><i class='fas fa-angle-down'></i></div>
                        </a>
                      <div class='collapse' id='collapseLayouts' aria-labelledby='headingOne' data-bs-parent='#sidenavAccordion'>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./gestao_viagens_presidente.php'>Gestão de Solicitações de Viagens</a>
                        </nav>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./historicodesolicitacaoTodos.php'>Histórico de Todas as Solicitações</a>
                        </nav>
                      </div>";
                    } elseif ($Tipo_Perfilviagem == '1') { // - Sérgio (Matrícula: 270907)
                        $menu = "
                        <a class='nav-link collapsed' href='#' data-bs-toggle='collapse' data-bs-target='#collapseLayouts' aria-expanded='false' aria-controls='collapseLayouts'>
                            <div class='sb-nav-link-icon'><i class='fas fa-fw fa-chart-area'></i></div>
                             Menu
                            <div class='sb-sidenav-collapse-arrow'><i class='fas fa-angle-down'></i></div>
                        </a>
                      <div class='collapse' id='collapseLayouts' aria-labelledby='headingOne' data-bs-parent='#sidenavAccordion'>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./historicodesolicitacaoTodos.php'>Historico de Todas as Solicitações</a>
                        </nav>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./historicodesolicitacao.php'>Historico de Solicitações</a>
                        </nav>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./aprovacaododiretor.php'>Aprovar Viagem</a>
                        </nav>
                      </div>";
                    } elseif ($Tipo_Perfilviagem == '14') {
                        $menu = "
                        <a class='nav-link collapsed' href='#' data-bs-toggle='collapse' data-bs-target='#collapseLayouts' aria-expanded='false' aria-controls='collapseLayouts'>
                            <div class='sb-nav-link-icon'><i class='fas fa-fw fa-chart-area'></i></div>
                             Menu
                            <div class='sb-sidenav-collapse-arrow'><i class='fas fa-angle-down'></i></div>
                        </a>
                      <div class='collapse' id='collapseLayouts' aria-labelledby='headingOne' data-bs-parent='#sidenavAccordion'>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./historicodesolicitacaoTodos.php'>Historico de Solicitações</a>
                        </nav>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./aprovacaodocoo.php'>Aprovar Viagem</a>
                        </nav>
                      </div>";
                      
                    } elseif ($Tipo_Perfilviagem == '15') {
                        $menu = "
                        <a class='nav-link collapsed' href='#' data-bs-toggle='collapse' data-bs-target='#collapseLayouts' aria-expanded='false' aria-controls='collapseLayouts'>
                            <div class='sb-nav-link-icon'><i class='fas fa-fw fa-chart-area'></i></div>
                             Menu
                            <div class='sb-sidenav-collapse-arrow'><i class='fas fa-angle-down'></i></div>
                        </a>
                      <div class='collapse' id='collapseLayouts' aria-labelledby='headingOne' data-bs-parent='#sidenavAccordion'>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./historicodesolicitacaoTodos.php'>Historico de Solicitações</a>
                        </nav>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./aprovacaodocfo.php'>Aprovar Viagem</a>
                        </nav>
                      </div>";
                      
                    }
                    
                    elseif ($usuario == '601004') { 
                        $menu = "
                       <a class='nav-link collapsed' href='#' data-bs-toggle='collapse' data-bs-target='#collapseLayouts' aria-expanded='false' aria-controls='collapseLayouts'>
                          <div class='sb-nav-link-icon'><i class='fas fa-fw fa-chart-area'></i></div>
                          Menu
                          <div class='sb-sidenav-collapse-arrow'><i class='fas fa-angle-down'></i></div>
                      </a>
                      <div class='collapse' id='collapseLayouts' aria-labelledby='headingOne' data-bs-parent='#sidenavAccordion'>
                         <nav class='sb-sidenav-menu-nested nav'>
                              <a class='nav-link' href='./historicodesolicitacao.php'>Viagens Solicitadas</a>
                          </nav>
                         <nav class='sb-sidenav-menu-nested nav'>
                              <a class='nav-link' href='./aprovacaododiretor.php'>Aprovar Viagem</a>
                          </nav>
                      </div>";
                    }elseif ($usuario == '002260') { // 
                        $menu = "
                       <a class='nav-link collapsed' href='#' data-bs-toggle='collapse' data-bs-target='#collapseLayouts' aria-expanded='false' aria-controls='collapseLayouts'>
                          <div class='sb-nav-link-icon'><i class='fas fa-fw fa-chart-area'></i></div>
                          Menu
                          <div class='sb-sidenav-collapse-arrow'><i class='fas fa-angle-down'></i></div>
                        </a>
                        <div class='collapse' id='collapseLayouts' aria-labelledby='headingOne' data-bs-parent='#sidenavAccordion'>
                            <nav class='sb-sidenav-menu-nested nav'>
                                <a class='nav-link' href='./adicionarcolaborador.php'>Adicionar Colaborador</a>
                            </nav>
                            <nav class='sb-sidenav-menu-nested nav'>
                                <a class='nav-link' href='./aprovacaocoordernador.php'>Aprovação do Gerente</a>
                            </nav>
                            <nav class='sb-sidenav-menu-nested nav'>
                                <a class='nav-link' href='./telainicialgerente.php'>Solicitação de Viagem </a>
                            </nav>
                            <nav class='sb-sidenav-menu-nested nav'>
                                <a class='nav-link' href='./historicodesolicitacao.php'>Historico de Solicitações</a>
                            </nav>
                            <nav class='sb-sidenav-menu-nested nav'>
                                <a class='nav-link' href='./historicodesolicitacaoTodos.php'>Historico de Todas Solicitações</a>
                            </nav>
                        </div>";
                    }elseif ($usuario == '003813') { // 
                        $menu = "
                       <a class='nav-link collapsed' href='#' data-bs-toggle='collapse' data-bs-target='#collapseLayouts' aria-expanded='false' aria-controls='collapseLayouts'>
                          <div class='sb-nav-link-icon'><i class='fas fa-fw fa-chart-area'></i></div>
                          Menu
                          <div class='sb-sidenav-collapse-arrow'><i class='fas fa-angle-down'></i></div>
                        </a>
                        <div class='collapse' id='collapseLayouts' aria-labelledby='headingOne' data-bs-parent='#sidenavAccordion'>
                            <nav class='sb-sidenav-menu-nested nav'>
                                <a class='nav-link' href='./adicionarcolaborador.php'>Adicionar Colaborador</a>
                            </nav>
                            <nav class='sb-sidenav-menu-nested nav'>
                                <a class='nav-link' href='./telainicialgerente.php'>Solicitação de Viagem </a>
                            </nav>
                            <nav class='sb-sidenav-menu-nested nav'>
                                <a class='nav-link' href='./historicodesolicitacao.php'>Historico de Solicitações</a>
                            </nav>
                        </div>";
                    }
                     elseif ($Tipo_Perfilviagem == '2') { // diretor
                        $menu = "
                       <a class='nav-link collapsed' href='#' data-bs-toggle='collapse' data-bs-target='#collapseLayouts' aria-expanded='false' aria-controls='collapseLayouts'>
                          <div class='sb-nav-link-icon'><i class='fas fa-fw fa-chart-area'></i></div>
                          Menu
                          <div class='sb-sidenav-collapse-arrow'><i class='fas fa-angle-down'></i></div>
                      </a>
                      <div class='collapse' id='collapseLayouts' aria-labelledby='headingOne' data-bs-parent='#sidenavAccordion'>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./aprovacaododiretor.php'>Aprovar Viagem</a>
                        </nav>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./historicodesolicitacao.php'>Viagens Solicitadas</a>
                        </nav>
                      </div>";
                    } elseif ($Tipo_Perfilviagem == '3') { // Gerente
                        $menu = "
                        <a class='nav-link collapsed' href='#' data-bs-toggle='collapse' data-bs-target='#collapseLayouts' aria-expanded='false' aria-controls='collapseLayouts'>
                          <div class='sb-nav-link-icon'><i class='fas fa-fw fa-chart-area'></i></div>
                          Menu
                          <div class='sb-sidenav-collapse-arrow'><i class='fas fa-angle-down'></i></div>
                        </a>
                        <div class='collapse' id='collapseLayouts' aria-labelledby='headingOne' data-bs-parent='#sidenavAccordion'>
                            <nav class='sb-sidenav-menu-nested nav'>
                                <a class='nav-link' href='./adicionarcolaborador.php'>Adicionar Colaborador</a>
                            </nav>
                            <nav class='sb-sidenav-menu-nested nav'>
                                <a class='nav-link' href='./aprovacaocoordernador.php'>Aprovação do Gerente</a>
                            </nav>
                            <nav class='sb-sidenav-menu-nested nav'>
                                <a class='nav-link' href='./telainicialgerente.php'>Solicitação de Viagem </a>
                            </nav>
                            <nav class='sb-sidenav-menu-nested nav'>
                                <a class='nav-link' href='./historicodesolicitacao.php'>Historico de Solicitações</a>
                            </nav>
                        </div>";
                    } elseif ($Tipo_Perfilviagem == '4') { // COORDENADOR
                        $menu = "
                        <a class='nav-link collapsed' href='#' data-bs-toggle='collapse' data-bs-target='#collapseLayouts' aria-expanded='false' aria-controls='collapseLayouts'>
                            <div class='sb-nav-link-icon'><i class='fas fa-fw fa-chart-area'></i></div>
                            Menu
                            <div class='sb-sidenav-collapse-arrow'><i class='fas fa-angle-down'></i></div>
                        </a>
                        <div class='collapse' id='collapseLayouts' aria-labelledby='headingOne' data-bs-parent='#sidenavAccordion'>
                     <nav class='sb-sidenav-menu-nested nav'>
                                <a class='nav-link' href='./adicionarcolaborador.php'>Adicionar Colaborador</a>
                            </nav>
                            <nav class='sb-sidenav-menu-nested nav'>
                                <a class='nav-link' href='./telainicialcoordenador.php'>Solicitação de Viagem </a>
                            </nav>
                            <nav class='sb-sidenav-menu-nested nav'>
                                <a class='nav-link' href='./historicodesolicitacao.php'>Historico de Solicitações</a>
                            </nav>
                        </div>";
                    } elseif ($Tipo_Perfilviagem == '5') { // Supervisor
                        $menu = "
                      <a class='nav-link collapsed' href='#' data-bs-toggle='collapse' data-bs-target='#collapseLayouts' aria-expanded='false' aria-controls='collapseLayouts'>
                          <div class='sb-nav-link-icon'><i class='fas fa-fw fa-chart-area'></i></div>
                          Menu
                          <div class='sb-sidenav-collapse-arrow'><i class='fas fa-angle-down'></i></div>
                      </a>
                      <div class='collapse' id='collapseLayouts' aria-labelledby='headingOne' data-bs-parent='#sidenavAccordion'>

                          <nav class='sb-sidenav-menu-nested nav'>
                                <a class='nav-link' href='./adicionarcolaborador.php'>Adicionar Colaborador</a>
                            </nav>
                            <nav class='sb-sidenav-menu-nested nav'>
                                <a class='nav-link' href='./telainicialcoordenador.php'>Solicitação de Viagem </a>
                            </nav>
                            <nav class='sb-sidenav-menu-nested nav'>
                                <a class='nav-link' href='./historicodesolicitacao.php'>Historico de Solicitações</a>
                            </nav>
                      </div>";
                    } elseif ($Tipo_Perfilviagem == '6') { // ADM
                        $menu = "
                      <a class='nav-link collapsed' href='#' data-bs-toggle='collapse' data-bs-target='#collapseLayouts' aria-expanded='false' aria-controls='collapseLayouts'>
                          <div class='sb-nav-link-icon'><i class='fas fa-fw fa-chart-area'></i></div>
                          Menu
                          <div class='sb-sidenav-collapse-arrow'><i class='fas fa-angle-down'></i></div>
                      </a>
                      <div class='collapse' id='collapseLayouts' aria-labelledby='headingOne' data-bs-parent='#sidenavAccordion'>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./teladp.php'>Solicitações Aprovadas</a>
                        </nav>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./historicodesolicitacaoTodos.php'>Historico de Solicitações</a>
                        </nav>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./relatoriogastos.php'>Gastos por Adiantamento</a>
                        </nav>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./historicoajuste.php'>Historico Ajuste</a>
                        </nav>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./relatoriogeral.php'>Relatorio Geral</a>
                        </nav>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./versolicitacao2.php'>Finalizar Viagem</a>
                        </nav>
                      </div>";
                    } elseif ($Tipo_Perfilviagem == '7') { // DP
                        $menu = "
                      <a class='nav-link collapsed' href='#' data-bs-toggle='collapse' data-bs-target='#collapseLayouts' aria-expanded='false' aria-controls='collapseLayouts'>
                          <div class='sb-nav-link-icon'><i class='fas fa-fw fa-chart-area'></i></div>
                          Menu
                          <div class='sb-sidenav-collapse-arrow'><i class='fas fa-angle-down'></i></div>
                      </a>
                      <div class='collapse' id='collapseLayouts' aria-labelledby='headingOne' data-bs-parent='#sidenavAccordion'>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./teladp.php'>Solicitações Aprovadas</a>
                        </nav>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./historicodesolicitacaoTodos.php'>Historico de Solicitações</a>
                        </nav>
                        <nav class='sb-sidenav-menu-nested nav'>
                                <a class='nav-link' href='./telainicialcoordenador.php'>Solicitação de Viagem </a>
                            </nav>
                      </div>";
                    } elseif ($Tipo_Perfilviagem == '8') { // FINANCEIRO
                        $menu = "
                      <a class='nav-link collapsed' href='#' data-bs-toggle='collapse' data-bs-target='#collapseLayouts' aria-expanded='false' aria-controls='collapseLayouts'>
                          <div class='sb-nav-link-icon'><i class='fas fa-fw fa-chart-area'></i></div>
                          Menu
                          <div class='sb-sidenav-collapse-arrow'><i class='fas fa-angle-down'></i></div>
                      </a>
                      <div class='collapse' id='collapseLayouts' aria-labelledby='headingOne' data-bs-parent='#sidenavAccordion'>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./adiantamentodeviagem.php'>Adiantamento de Viagem</a>
                        </nav>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./historicodesolicitacaoTodos.php'>Historico de Solicitações</a>
                        </nav>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./alimentacaopagamento.php'>Finalizar Pagamentos de Alimentação</a>
                        </nav>
                      </div>";
                    } elseif ($Tipo_Perfilviagem == '10') { // PATRIMONIO
                        $menu = "
                      <a class='nav-link collapsed' href='#' data-bs-toggle='collapse' data-bs-target='#collapseLayouts' aria-expanded='false' aria-controls='collapseLayouts'>
                          <div class='sb-nav-link-icon'><i class='fas fa-fw fa-chart-area'></i></div>
                          Menu
                          <div class='sb-sidenav-collapse-arrow'><i class='fas fa-angle-down'></i></div>
                      </a>
                      <div class='collapse' id='collapseLayouts' aria-labelledby='headingOne' data-bs-parent='#sidenavAccordion'>
                        <nav class='sb-sidenav-menu-nested nav'>
                                <a class='nav-link' href='./adicionarcolaborador.php'>Adicionar Colaborador</a>
                        </nav>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./telainicialcoordenador.php'>Solicitação de Viagem </a>
                        </nav> 
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./versolicitacao.php'>Aprovados pelo COO/CFO</a>
                        </nav>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./historicodesolicitacaoTodos.php'>Historico de Solicitações</a>
                        </nav>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./historicodeexcluidos.php'>Historico de Excluidos</a>
                        </nav>
                      </div>";
                    } elseif ($Tipo_Perfilviagem == '11') { // GERENTE GERAL CARLOS EDUARDO BARRETO 003051
                        $menu = "
                      <a class='nav-link collapsed' href='#' data-bs-toggle='collapse' data-bs-target='#collapseLayouts' aria-expanded='false' aria-controls='collapseLayouts'>
                          <div class='sb-nav-link-icon'><i class='fas fa-fw fa-chart-area'></i></div>
                          Menu
                          <div class='sb-sidenav-collapse-arrow'><i class='fas fa-angle-down'></i></div>
                      </a>
                      <div class='collapse' id='collapseLayouts' aria-labelledby='headingOne' data-bs-parent='#sidenavAccordion'>
                        <nav class='sb-sidenav-menu-nested nav'>
                                <a class='nav-link' href='./adicionarcolaborador.php'>Adicionar Colaborador</a>
                        </nav>  
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./aprovacaodogerentegeral.php'>Aprovados pelo Gerentes</a>
                        </nav>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./historicotodosclaro.php'>Historico de Solicitações</a>
                        </nav>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./telainicialgerenteclaro.php'>Solicitação de Viagem </a>
                        </nav>
                      </div>";
                    } elseif ($Tipo_Perfilviagem == '12') { // CLARO PATRICIA E MARCELO
                        $menu = "
                      <a class='nav-link collapsed' href='#' data-bs-toggle='collapse' data-bs-target='#collapseLayouts' aria-expanded='false' aria-controls='collapseLayouts'>
                          <div class='sb-nav-link-icon'><i class='fas fa-fw fa-chart-area'></i></div>
                          Menu
                          <div class='sb-sidenav-collapse-arrow'><i class='fas fa-angle-down'></i></div>
                      </a>
                      <div class='collapse' id='collapseLayouts' aria-labelledby='headingOne' data-bs-parent='#sidenavAccordion'>
                         <nav class='sb-sidenav-menu-nested nav'>
                                <a class='nav-link' href='./adicionarcolaborador.php'>Adicionar Colaborador</a>
                        </nav>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./telainicialgerente.php'>Solicitação de Viagem </a>
                        </nav>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./aprovacaodogerenteclaro.php'>Aprovar Solicitações</a>
                        </nav>
                        <nav class='sb-sidenav-menu-nested nav'>
                            <a class='nav-link' href='./historicodesolicitacaoclaro.php'>Historico de Solicitações</a>
                        </nav>
                      </div>";
                    } elseif ($Tipo_Perfilviagem == '13') { // 
                        $menu = "
                       <a class='nav-link collapsed' href='#' data-bs-toggle='collapse' data-bs-target='#collapseLayouts' aria-expanded='false' aria-controls='collapseLayouts'>
                          <div class='sb-nav-link-icon'><i class='fas fa-fw fa-chart-area'></i></div>
                          Menu
                          <div class='sb-sidenav-collapse-arrow'><i class='fas fa-angle-down'></i></div>
                      </a>
                      <div class='collapse' id='collapseLayouts' aria-labelledby='headingOne' data-bs-parent='#sidenavAccordion'>
                         <nav class='sb-sidenav-menu-nested nav'>
                              <a class='nav-link' href='./historicodesolicitacao.php'>Viagens Solicitadas</a>
                          </nav>
                         <nav class='sb-sidenav-menu-nested nav'>
                              <a class='nav-link' href='./aprovacaododiretor.php'>Aprovar Viagem</a>
                          </nav>
                      </div>";
                    }

                    echo $menu;
                    ?>
                </div>
            </div>
            <div class="sb-sidenav-footer">
                <div class="small">Usuário: <?php print "$nome"; ?></div>

                <!-- <div class="small">Cargo: <?php print "$cargo"; ?></div> -->

            </div>
        </nav>
    </div>
    <script src="https://use.fontawesome.com/releases/v6.1.0/js/all.js" crossorigin="anonymous"></script>