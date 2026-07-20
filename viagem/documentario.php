<?php
/*
 * DOCUMENTAÇÃO COMENTADA DO CÓDIGO
 *
 * Este bloco de código implementa funcionalidades para gerenciar diferentes tipos de perfis de usuários dentro da aplicação.
 * Os perfis determinam quais ações ou áreas da aplicação o usuário tem acesso, garantindo que cada usuário 
 * visualize e interaja com os recursos apropriados de acordo com sua função.
 *
 * PERFIS DE USUÁRIO:
 * 
 * 1. **Sérgio Braga - Matrícula: "270907"**  
 * - Este perfil possui acessos diferenciados em relação aos demais diretores.  
 * - Tem permissão para visualizar todas as solicitações, sem restrições por diretor.  
 * - Pode aprovar ou reprovar quaisquer solicitações pendentes, inclusive aquelas pertencentes a outros diretores.  
 * - Ao acessar o sistema, é redirecionado automaticamente para a página `historicodesolicitacaoTodos.php`,  
 *   onde pode visualizar o histórico completo de todas as solicitações feitas no portal. 
 *
 * 2. **Gerente**: 
 * - Usuários com esse perfil têm permissões para gerenciar equipes, aprovar ou rejeitar solicitações e acompanhar o progresso das tarefas.
 * - Em nosso código, o gerente pode visualizar relatórios de desempenho, mas não tem acesso a configurações do sistema.
 * - A verificação do perfil é feita comparando o valor armazenado na variável `$perfil['gerente']`, garantindo que o usuário só acesse essas funcionalidades se for um gerente.
 *
 * 3. **Funcionário**: 
 * - Usuários com este perfil têm permissões limitadas apenas às suas próprias informações.
 * - Eles podem visualizar seus próprios dados de viagem, fazer solicitações e acompanhar o status de suas aprovações.
 * - A lógica do código assegura que os funcionários não consigam acessar informações de outros usuários ou modificar configurações do sistema.
 *
 * 4. **Diretor**: 
 * - Este perfil tem permissões mais elevadas que o gerente, podendo visualizar e aprovar decisões de mais alto nível.
 * - Os diretores podem interagir com relatórios agregados de todas as equipes, mas não têm controle sobre configurações de usuários.
 *
 * -------------------------------
 * FLUXO DO CÓDIGO:
 *
 * 1. **Autenticação do usuário**: 
 * - Antes de determinar a qual perfil um usuário pertence, o sistema faz a verificação das credenciais do usuário.
 * - Se a autenticação for bem-sucedida, o sistema irá carregar o perfil associado ao usuário, geralmente armazenado em uma variável de sessão.
 *
 * 2. **Verificação do perfil**:
 * - O código então verifica o tipo de perfil associado ao usuário e define os recursos que estarão acessíveis.
 * - Cada tipo de perfil tem uma lógica condicional separada para garantir que as permissões sejam corretamente atribuídas.
 * - A verificação de permissões pode ocorrer utilizando estruturas como: 
 *   `if ($_SESSION['perfil'] == 'administrador') { ... }` ou similar.
 *
 * 3. **Exibição de conteúdo condicional**:
 * - O conteúdo ou as opções exibidas ao usuário variam dependendo do perfil.
 * - Usuários com perfil de administrador terão acesso a links e opções de configuração que não estão disponíveis para gerentes ou funcionários.
 * - O código de exibição condicional é utilizado para garantir que o usuário só veja o que tem permissão para acessar.
 *
 * 4. **Segurança de acesso**:
 * - Além da verificação de perfil, é importante garantir que os dados que o usuário acessa estejam seguros.
 * - O código implementa verificações de segurança, como validação de entradas e proteção contra SQL Injection, 
 *   garantindo que os usuários não possam manipular informações sensíveis ou realizar ações não autorizadas.
 *
 * 5. **Logout e Redirecionamento**:
 * - Quando o usuário faz logout, o perfil associado é removido da sessão, garantindo que o próximo usuário a acessar o sistema 
 *   não tenha acesso não autorizado a informações privadas.
 * - A aplicação também redireciona automaticamente os usuários para páginas adequadas com base em seu perfil.
 *
 * -------------------------------
 * DICAS:
 *
 * - **Manter os perfis bem definidos**: 
 *   É importante que os perfis estejam bem definidos, para que a aplicação seja segura e fácil de manter.
 * 
 * - **Testar diferentes perfis**: 
 *   Ao implementar e testar o código, verifique se todos os perfis estão sendo tratados corretamente, 
 *   garantindo que um usuário com perfil de gerente, por exemplo, não consiga acessar áreas restritas a administradores.
 *
 * - **Seguir boas práticas de segurança**: 
 *   Certifique-se de sempre validar as permissões do usuário antes de exibir ou permitir acesso a qualquer funcionalidade sensível.
 *
 */
?>
