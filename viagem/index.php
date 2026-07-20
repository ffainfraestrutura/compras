<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <meta name="description" content="FFA" />
    <meta name="author" content="FFA" />
    <link rel="icon" type="image/png" href="src/images/favicon.png" />
    <title>Viagem | Portal FFA</title>
    <link href="https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css" rel="stylesheet" />
    <link href="src/css/styles.css" rel="stylesheet" />
    <script src="https://use.fontawesome.com/releases/v6.1.0/js/all.js" crossorigin="anonymous"></script>
</head>
<style>
    .back-container {
        position: fixed;
        top: 30px;
        right: 20px;
        border-radius: 5px;
    }

    .back-container a {
        font-size: 12px;
    }
</style>

<body class="bg-light">
    <div id="layoutAuthentication">
        <div id="layoutAuthentication_content">
            <main>
                <div class="container">
                    <div class="row justify-content-center">
                        <div class="col-lg-5">
                            <div class="card shadow-lg border-0 rounded-lg mt-5">
                                <div class="card-header bg-white center-image"><img src="src/images/logoredonda.png"
                                        width="125" height="125"></div>
                                <div class="card-body">
                                    <form method="post" action="./control/logincontrole.php">
                                        <div class="form-floating mb-3">
                                            <input class="form-control" name='login' id="inputEmail" type="text"
                                                placeholder="Usuário" required />
                                            <label for="inputEmail">Matrícula</label>
                                        </div>
                                        <div class="form-floating mb-3">
                                            <input class="form-control" name='pass' id="inputPassword" type="password"
                                                placeholder="Senha" />
                                            <label for="inputPassword">Senha</label>
                                        </div>
                                        <div class="d-grid mt-4 mb-0">
                                            <button class="btn btn-primary btn-block" type="submit">Entrar</button>
                                        </div>
                                    </form>

                                    <div class="d-grid mt-4 mb-0">
                                        <a href="./recsenha.php"> <button class="btn btn-primary"
                                                style="width: 100%;">Recuperar Senha</button></a>
                                    </div>
                                    <div class="d-grid mt-3 mb-0">
                                        <a href="https://ffasip.ddns.net:4545/portaisffa/telainicial.php"> <button class="btn btn-secondary"
                                                style="width: 100%; background: #003d99; border: none;">Portais FFA</button></a>
                                    </div>
                                </div>
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