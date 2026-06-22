import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Stack,
  Divider,
} from "@mui/material";
import { FiAlertTriangle, FiCheckCircle, FiDownload, FiInfo } from "react-icons/fi";

const InstrucoesModal = ({ open, onClose, filiais }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      scroll="paper"
    >
      <DialogTitle sx={{ bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <FiInfo color="primary" />
          <Typography variant="h6">Instruções para Importação de Planilha</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Passo a passo */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              📋 Passo a Passo
            </Typography>
            <Stack spacing={1} sx={{ pl: 2 }}>
              <Typography variant="body2">1️⃣ Clique em "Baixar Modelo" para obter a planilha modelo</Typography>
              <Typography variant="body2">2️⃣ Preencha a planilha seguindo as orientações abaixo</Typography>
              <Typography variant="body2">3️⃣ Clique em "Importar Compra" e selecione o arquivo preenchido</Typography>
              <Typography variant="body2">4️⃣ Confirme os dados e finalize a solicitação</Typography>
            </Stack>
          </Box>

          <Divider />

          {/* Estrutura da planilha */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              📊 Estrutura da Planilha
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell><strong>Coluna</strong></TableCell>
                    <TableCell><strong>Nome</strong></TableCell>
                    <TableCell><strong>Descrição</strong></TableCell>
                    <TableCell><strong>Obrigatório</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>A</TableCell>
                    <TableCell>Código do Material</TableCell>
                    <TableCell>Código do material cadastrado no sistema</TableCell>
                    <TableCell><Chip label="Sim" size="small" color="error" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>B</TableCell>
                    <TableCell>Quantidade</TableCell>
                    <TableCell>Quantidade solicitada (apenas números positivos)</TableCell>
                    <TableCell><Chip label="Sim" size="small" color="error" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>C</TableCell>
                    <TableCell>Filial</TableCell>
                    <TableCell>Nome exato da filial (ver legenda abaixo)</TableCell>
                    <TableCell><Chip label="Sim" size="small" color="error" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>D</TableCell>
                    <TableCell>Justificativa</TableCell>
                    <TableCell>Motivo da solicitação (a primeira será usada para todas)</TableCell>
                    <TableCell><Chip label="Sim" size="small" color="error" /></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Divider />

          {/* Legenda das Filiais */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              🏢 Filiais Disponíveis
            </Typography>
            {filiais && filiais.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell><strong>Código</strong></TableCell>
                      <TableCell><strong>Nome da Filial</strong></TableCell>
                      {/* <TableCell><strong>Sigla</strong></TableCell> */}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filiais.map((filial) => (
                      <TableRow key={filial.idtbfilial || filial.id}>
                        <TableCell>{filial.idtbfilial || filial.id}</TableCell>
                        <TableCell>{filial.descricao || filial.nome}</TableCell>
                        {/* <TableCell>{filial.sigla || '-'}</TableCell> */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">Carregando lista de filiais...</Alert>
            )}
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                ⚠️ <strong>Importante:</strong> Utilize exatamente os IDs das filiais como listados acima.
              </Typography>
            </Alert>
          </Box>

          <Divider />

          {/* {/* Regras importantes
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              ⚠️ Regras Importantes
            </Typography>
            <Stack spacing={1}>
              <Alert severity="warning" icon={<FiAlertTriangle />}>
                <Typography variant="body2">
                  <strong>Justificativa:</strong> A primeira justificativa preenchida será utilizada para TODAS as linhas da planilha.
                </Typography>
              </Alert>
              <Alert severity="warning" icon={<FiAlertTriangle />}>
                <Typography variant="body2">
                  <strong>Agrupamento:</strong> Os itens serão agrupados por filial e centro de custo do material.
                  Itens com centros de custo diferentes na mesma filial gerarão compras separadas.
                </Typography>
              </Alert>
              <Alert severity="error" icon={<FiAlertTriangle />}>
                <Typography variant="body2">
                  <strong>Validação:</strong> Se alguma linha contiver erro (material não encontrado, filial inválida, etc.),
                  NENHUMA compra será criada e todos os erros serão listados.
                </Typography>
              </Alert>
              <Alert severity="success" icon={<FiCheckCircle />}>
                <Typography variant="body2">
                  <strong>Código da Compra:</strong> Será gerado automaticamente no formato baseado no timestamp.
                </Typography>
              </Alert>
            </Stack>
          </Box>

          <Divider /> */}

          {/* Exemplo */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              📝 Exemplo de Preenchimento
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell><strong>Código do Material</strong></TableCell>
                    <TableCell><strong>Quantidade</strong></TableCell>
                    <TableCell><strong>Filial</strong></TableCell>
                    <TableCell><strong>Justificativa</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
0155-0089-2</TableCell>
                    <TableCell>10</TableCell>
                    <TableCell>2</TableCell>
                    <TableCell>Reposição de estoque</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>0186-0022-0</TableCell>
                    <TableCell>5</TableCell>
                    <TableCell>2</TableCell>
                    <TableCell>Reposição de estoque</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
0186-0051-7</TableCell>
                    <TableCell>20</TableCell>
                    <TableCell>3</TableCell>
                    <TableCell>Reposição de estoque</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
        <Button onClick={onClose} variant="outlined">
          Fechar
        </Button>
        {/* <Button 
          onClick={onClose} 
          variant="contained" 
          startIcon={<FiDownload />}
        >
          Baixar Modelo
        </Button> */}
      </DialogActions>
    </Dialog>
  );
};

export default InstrucoesModal;