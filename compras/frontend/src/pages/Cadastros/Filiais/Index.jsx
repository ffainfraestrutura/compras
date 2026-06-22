import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Modal,
  Tooltip,
  Typography,
} from "@mui/material";
import { FiEye, FiFile, FiFilter, FiPlus, FiTrash } from "react-icons/fi";
import { useState } from "react";
import ExportExcel from "../../../components/Button/ExportExcel/ExportExcel";
import useFiliais from "../../../hooks/useFiliais";
import DataGrid from "../../../components/DataGrid/DataGrid";
import { useNavigate } from "react-router-dom";

function Index() {
  const navigate = useNavigate();
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  
  // Usando apenas o hook
  const { filiais, loading: loadingFiliais, error } = useFiliais();

  const handleNew = () => {
    navigate("./Cadastro");
  };

  const handleDelete = (row) => {
    // Implementar lógica de exclusão aqui
    console.log("Excluindo:", row);
  };

  const handleView = (row) => {
    navigate(`./Visualizar/${row.id || row.idtbfilial}`);
  };

  // Funções de modal (assumindo que você tem um sistema de modal global)
  const openModal = (config) => {
    // Implementar abertura de modal
    console.log("Abrir modal:", config);
  };

  const closeModal = () => {
    // Implementar fechamento de modal
    console.log("Fechar modal");
  };

  // Processando os dados do hook para adicionar as ações
  const dataWithActions = filiais?.map((item) => ({
    ...item,
    Ações: (
      <Box display="flex" height={"100%"} alignItems="center" gap={1}>
        <Tooltip title="Visualizar">
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleView(item)}
            sx={{
              backgroundColor: "rgba(25, 118, 210, 0.1)",
              "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.2)" },
              transition: "background-color 0.3s ease",
            }}
            aria-label="Visualizar"
          >
            <FiEye />
          </IconButton>
        </Tooltip>
        <Tooltip title="Excluir">
          <IconButton
            size="small"
            color="error"
            onClick={() =>
              openModal({
                title: "Confirmar Exclusão",
                children: (
                  <>
                    <p>Deseja realmente excluir a filial?</p>
                    <Box
                      sx={{
                        border: "1px solid #ddd",
                        borderRadius: 2,
                        backgroundColor: "#f9f9f9",
                        padding: 2,
                        marginTop: 1,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        width: "100%",
                      }}
                    >
                      <Typography variant="body1" fontWeight="medium">
                        {item.codigo || item.id} - {item.nome || item.descricao || "Filial"}
                      </Typography>
                    </Box>
                  </>
                ),
                buttons: (
                  <>
                    <Button onClick={closeModal}>Cancelar</Button>
                    <Button
                      variant="contained"
                      onClick={() => {
                        handleDelete(item);
                        closeModal();
                      }}
                    >
                      Confirmar
                    </Button>
                  </>
                ),
              })
            }
            sx={{
              backgroundColor: "rgba(211, 47, 47, 0.1)",
              "&:hover": { backgroundColor: "rgba(211, 47, 47, 0.2)" },
              transition: "background-color 0.3s ease",
            }}
            aria-label="Excluir"
          >
            <FiTrash />
          </IconButton>
        </Tooltip>
      </Box>
    ),
  })) || [];

  return (
    <>
      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h5" component="h2">
              Gerenciar Filiais
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <ExportExcel />
              <Button
                variant="contained"
                onClick={handleNew}
                startIcon={<FiPlus />}
              >
                Adicionar
              </Button>
            </Box>
          </Box>
          <DataGrid
            data={dataWithActions}
            loading={loadingFiliais}
            error={error}
            hiddenIndexes={[4, 5, 6, 7, 8, 11, 12, 14]}
            initialPageSize={10}
          />
        </CardContent>
      </Card>
    </>
  );
}

export default Index;