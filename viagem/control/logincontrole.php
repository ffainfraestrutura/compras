
<?php
date_default_timezone_set('America/Sao_Paulo');
include "../conectanovo.php";
session_start();

if (!$conexao) {
    die("Erro na conexão: " . mysqli_connect_error());
}

$usuariof = $_POST['login'];
$pass = $_POST['pass'];

// Consulta para verificar se o usuário existe
$sql = "SELECT usuario, senha, matricula, nome, viagem FROM bdcorp.tbusuario WHERE usuario = '$usuariof' AND senha = '$pass'";
$resultado = mysqli_query($conexao, $sql) or die(mysqli_error($conexao));

if (mysqli_num_rows($resultado) > 0) {
    // Usuário encontrado, obtém os dados do perfil
    $perfil = mysqli_fetch_assoc($resultado);
    
    // Armazena informações na sessão
    $_SESSION['usuario'] = $perfil['usuario'];
    $_SESSION['matricula'] = $perfil['matricula'];
    $_SESSION['nome'] = $perfil['nome'];
    $_SESSION['perfil'] = $perfil['viagem']; 

    // Verificação do tipo de perfil
    if (!in_array($perfil['viagem'], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])) {
        echo "<script>alert('Perfil de acesso não autorizado'); window.location.href='../index.php';</script>";
        exit; // Interrompe o script se o perfil não for autorizado
    }

    // Acesso especial por matrícula para tela centralizadora de viagens
    $matriculasAcessoEspecial = ['620027'];
    if (in_array((string) $perfil['matricula'], $matriculasAcessoEspecial, true) || in_array((string) $perfil['usuario'], $matriculasAcessoEspecial, true)) {
        header("Location: ../gestao_viagens_presidente.php");
        exit;
    }
    // Redirecionamento com base no tipo de perfil
    /* 
        =========================
             TIPOS DE PERFIL
        =========================

        Os perfis de usuário são categorizados da seguinte forma:

        1. **DIRETOR**
        - **ID:** 1 
        - **Nome:** 
            - Sérgio (Matrícula: 270907)

        2. **DIRETORES**
        - **ID:** 2 
        - **Nomes:**
            - José Eugênio de Paiva (Matrícula: 601002)
            - César Franco Júnior (Matrícula: 001126 )

        3. **GERENTE**
        - **ID:** 3 
        - **Nomes:**
            - FABIO (Matrícula: 601000)
            - PATRICIA VERDAN DE CARVALHO (Matrícula: 001938 )
            - MARCELO ALVES FONTES (Matrícula: 000052 )
            - THIAGO OLIVEIRA COSENDEY (Matrícula: 550015 )
            - IVAN SOARES DE MAGALHÃES (Matrícula: 004783 )

        4. **COORDENADOR**
        - **ID:** 4 
        - **Nomes:**
            - EUDES VINICIUS SANTOS PEREIRA (Matrícula:  550016)
            - EDUARDO HIDALGO GAROA (Matrícula: 004572 )
            - EMERSON THOMAZ MIRANDA (Matrícula: 050095 )

        5. **SUPERVISOR**
        - **ID:** 5 
        - **Nomes:**
            - COSME JULIASSE CIPULLI (Matrícula: 004240)
            - ALINE CHAVES DO NASCIMENTO (Matrícula: 003572)

        6. **ADM**
        - **ID:** 6
        - **Nomes:**
            - Mikael (Matrícula: 004313 )
        7. **DP**
        - **ID:** 7 
        - **Nomes:**
            - JULIANA (Matrícula: 002425)
        8. **Financeiro**
        - **ID:** 8 
        - **Nomes:**
            - Darlene (Matrícula: 000023)

        10. **PATRIMONIO**
        - **ID:** 10 
        - **Nomes:**
            - Francisco (Matrícula: 002920)
            - Gisele (Matrícula: 002428)
            - Henrique (Matrícula: 003708)

        11. ** Gerente Geral **
         - **ID:** 11 
        - **Nomes:**
            - CARLOS EDUARDO BARRETO DA SILVA (Matrícula: 003051)

        12. ** CLARO PATRICIA E MARCELO ALVES **
         - **ID:** 12 
        - **Nomes:**
            - PATRICIA VERDAN DE CARVALHO (Matrícula: 001938 )
            - MARCELO ALVES FONTES (Matrícula: 000052 )

        13. ** CLARO PATRICIA E MARCELO ALVES **
         - **ID:** 13 
         - **Nomes:**
            - José Luiz Cordobel (Matrícula: 583313)
            
        14. ** PERFIL CRIADO PELA SAIDA DO SANTAREM **
         - **ID:** 14 
         - **Nomes:**
            - LUANA CRISTINA SILVA GOMES (Matrícula: 003813)
        =========================
        FIM DOS TIPOS DE PERFIL
        =========================
    */

    switch ($perfil['viagem']) { 
        case 1:
            header("Location: ../historicodesolicitacaoTodos.php");
            break;
        case 2:
            header("Location: ../historicodesolicitacao.php");
            break;
        case 3:
            header("Location: ../historicodesolicitacao.php");
            break;
        case 4:
            header("Location: ../historicodesolicitacao.php");
            break;
        case 5:
            header("Location: ../historicodesolicitacao.php");
            break;
        case 6:
            header("Location: ../historicodesolicitacao.php");
            break;
        case 7:
            header("Location: ../teladp.php");
            break;
        case 8:
            header("Location: ../historicodesolicitacaoTodos.php");
            break;
        case 10:
            header("Location: ../historicodesolicitacaoTodos.php");
            break;
        case 11:
            header("Location: ../aprovacaodogerentegeral.php");
            break;
        case 12:
            header("Location: ../historicodesolicitacaoclaro.php");
            break;
        case 13:
            header("Location: ../aprovacaododiretor.php");
            break;
        case 14:
            header("Location: ../aprovacaodocoo.php");
            break;
        case 15:
            header("Location: ../aprovacaodocfo.php");
            break;
        default:
           echo "<script>
                    alert('Perfil não reconhecido! Redirecionando para a página principal.');
                    window.location.href = '/viagem/index.php';
                </script>";
    }
    exit; // Encerra o script após o redirecionamento
} else {
    // Usuário não encontrado ou senha incorreta
    echo "<script>alert('Usuário ou senha incorretos'); window.location.href='../index.php';</script>";
}
?>