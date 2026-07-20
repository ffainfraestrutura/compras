<?php
session_start();
$matricula = $_SESSION['matricula'];
$_SESSION['matricula'] = $matricula;
include"conecta.php";

//print $matricula;
?>
<!DOCTYPE html>
<html lang="pt-br">
    <head>
        <meta charset="utf-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="description" content="FFA" />
        <meta name="author" content="FFA" />
        <link rel="icon" type="image/png" href="src/images/favicon.png"/>
        <title>Portal FFA</title>
        <link href="https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css" rel="stylesheet" />
        <link href="src/css/styles.css" rel="stylesheet" />
        <script src="https://use.fontawesome.com/releases/v6.1.0/js/all.js" crossorigin="anonymous"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
          <script>
    errotexto = "";

    function valida_formulario(){
      var error = document.getElementById("error_msg"),
      senha = document.getElementById("inputPassword"),
      confirmarsenha = document.getElementById("confPassword");
      if(senha.value == ""){
        errotexto = "Digite uma senha";
      }else if(senha.value != confirmarsenha.value) {
        errotexto = "Senhas não coincidem";
      } else {
        errotexto = "";
      }

      if(errotexto == ""){
        document.getElementById("form_cadastro").submit();
      }else{
        error.textContent = errotexto;
      }
    }

  </script>
    </head>
    <body class="bg-light">
        <div id="layoutAuthentication">
            <div id="layoutAuthentication_content">
                <main>
                    <div class="container">
                        <div class="row justify-content-center">
                            <div class="col-lg-5">
                                <div class="card shadow-lg border-0 rounded-lg mt-5">
                                    <div class="card-header bg-white center-image"><img src="src/images/logoredonda.png" width="125" height="125"></div>
                                    <div class="card-body">
                                        <form method="post" action="./control/cadastrocontrole.php" id="form_cadastro">
                                            <div class="form-floating mb-3">
                                                <input class="form-control" name='pass' id="inputPassword" type="password" placeholder="Senha" required/>
                                                <label for="inputPassword">Senha</label>
                                            </div>
                                            <div class="form-floating mb-3">
                                                <input class="form-control" name='cpass' id="confPassword" type="password" placeholder="Confirmar Senha" required/>
                                                <label for="inputPassword"> Confirmar Senha</label>
                                            </div>          
                                            <div class="d-grid mt-4 mb-0" >
                                                <button type="button" class="btn btn-primary btn-block" onclick="valida_formulario()">Entrar</button>
                                            </div>
                                            <div class="text-danger" id="error_msg" style="  text-align: center;
                font-size: 17px;
                margin-bottom: 10px;
                font-style: italic;"></div>
                                        </form>
                                         </div> 
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <div id="layoutAuthentication_footer">
                <footer class="py-4 bg-light mt-auto">
                    <div class="container-fluid px-4">
                        <div class="d-flex align-items-center justify-content-between small">
                            <div class="text-muted">Copyright &copy; FFA Infraestrutura</div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
        <script src="src/js/simple-datatable.js" crossorigin="anonymous"></script>
        <script src="src/js/scripts.js"></script>
    </body>
</html>
