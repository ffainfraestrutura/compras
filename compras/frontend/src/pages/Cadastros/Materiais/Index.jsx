import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Link,
  Typography,
  Tooltip,
} from "@mui/material";
import { FiPlus, FiEye, FiEdit, FiTrash } from "react-icons/fi";
import { useState } from "react";
import ExportExcel from "../../../components/Button/ExportExcel/ExportExcel";
import CustomSnackbar from "../../../components/SnackBar/SnackBar";
import useMateriais from "../../../hooks/useMateriais";
import axios from "axios";
import DataGrid from "../../../components/DataGrid/DataGrid";
import { useModal } from "../../../context/ModalContext";
import { useNavigate } from "react-router-dom";

function Index() {
  const navigate = useNavigate();
  const { openModal, closeModal } = useModal();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const {
    dataMaterials,
    setDataMaterials,
    loading: loadingMateriais,
    error,
  } = useMateriais();
  const dataWithActions = dataMaterials.map((item) => ({
    ...item,
    Ações: (
      <Box display="flex" height={"100%"} alignItems="center" gap={1}>
        <Tooltip title="Visualizar">
          <IconButton
            size="small"
            color="primary"
            onClick={() => navigate(`./Visualizar/${item["CodMaterial"]}`)}
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
                    <p>Deseja realmente excluir o material?</p>
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
                        {item["CodMaterial"]} - {item["Descricao"]}
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
                        handleDelete(item["CodMaterial"]);
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
  }));

  const handleDelete = async (codmat) => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/materiais/${codmat}`,
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        }
      );

      const newDataMaterials = dataMaterials.filter(
        (item) => item["CodMaterial"] !== codmat
      );
      setDataMaterials(newDataMaterials);
      showSnackbar("Item deletado com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao deletar:", error);
      showSnackbar("Erro ao deletar item", "error");
    }
  };


  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const API_URL = import.meta.env.VITE_API_URL + "/materiais";

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
              Gerenciar materiais
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <ExportExcel
                data={dataMaterials.map(
                  ({ centro_custo, saldo, Subgrupo, patrimonio, ...resto }) => resto
                )}
                fileName="relatorio_materiais"
              />
              <Button
                className="ProfileButton-button"
                variant="contained"
                onClick={() => navigate("./Cadastro")}
                startIcon={<FiPlus />}
              >
                Adicionar
              </Button>
            </Box>
          </Box>
          <DataGrid
            data={dataWithActions || []}
            loading={loadingMateriais}
            error={error}
            hiddenIndexes={[4, 5, 6, 7, 8, 11, 12, 13]}
            initialPageSize={10}
          />
        </CardContent>
      </Card>
      <CustomSnackbar
        open={snackbarOpen}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </>
  );
}

export default Index;
