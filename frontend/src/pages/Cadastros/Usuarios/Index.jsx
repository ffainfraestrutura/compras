import React, { useState, useEffect } from "react";
import {
  Grid,
  Paper,
  Box,
  Typography,
  TextField,
  CircularProgress,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { Users, UserCheck, ShoppingCart, Crown, Move, Search } from "lucide-react";
import axios from "axios";
import CustomSnackbar from "../../../components/SnackBar/SnackBar";

const HierarchyManager = () => {
  const API_BASE = import.meta.env.VITE_API_URL;

  const levelMap = {
    0: "sem-acesso",
    1: "coordenador",
    2: "gestor-material",
    3: "compras",
    4: "gerente",
    5: "diretor",
    6: "cfo",
    7: "gerente_hierarquico"
  };

  const reverseLevelMap = {
    "sem-acesso": 0,
    "coordenador": 1,
    "gestor-material": 2,
    "compras": 3,
    "gerente": 4,
    "diretor": 5,
    "cfo": 6,
    "gerente_hierarquico": 7
  };

  const hierarchyLevels = [
    { id: "sem-acesso", title: "Sem Acesso", icon: Users, color: "#f5f3f3ff" },
    { id: "coordenador", title: "Coordenador", icon: UserCheck, color: "#f5f3f3ff" },
    { id: "gerente_hierarquico", title: "Gerente", icon: UserCheck, color: "#f5f3f3ff" },
    { id: "gestor-material", title: "Gestor de Material", icon: UserCheck, color: "#f5f3f3ff" },
    { id: "compras", title: "Setor de Compras", icon: ShoppingCart, color: "#f5f3f3ff" },
    { id: "gerente", title: "Gerente Administrativo", icon: Users, color: "#f5f3f3ff" },
    { id: "diretor", title: "Diretor Administrativo", icon: Crown, color: "#f5f3f3ff" },
    { id: "cfo", title: "CFO", icon: Crown, color: "#f5f3f3ff" },
  ];

  const [employees, setEmployees] = useState({
    "sem-acesso": [],
    "coordenador": [],
    "gerente_hierarquico": [],
    "gestor-material": [],
    "compras": [],
    "gerente": [],
    "diretor": [],
    "cfo": [],
  });

  const [searchTerms, setSearchTerms] = useState({
    "sem-acesso": "",
    "coordenador": "",
    "gerente_hierarquico": "",
    "gestor-material": "",
    "compras": "",
    "gerente": "",
    "diretor": "",
    "cfo": "",
  });

  const [draggedItem, setDraggedItem] = useState(null);
  const [loading, setLoading] = useState(true);

  // estados do modal
  const [openModal, setOpenModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // estados no seu componente principal
  const [associatedList, setAssociatedList] = useState([]);
  const [notAssociatedList, setNotAssociatedList] = useState([]);
  const [leftChecked, setLeftChecked] = useState([]);
  const [rightChecked, setRightChecked] = useState([]);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // abrir modal + buscar centros de custo
  const handleOpenModal = async (emp) => {
    setSelectedEmployee(emp);
    setOpenModal(true);

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_BASE}/centrocusto`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // supondo que o funcionário tem um campo centros vinculados (ex: emp.centros)
      const associados = data.filter((cc) => emp.centros?.includes(cc.id));
      const naoAssociados = data.filter((cc) => !emp.centros?.includes(cc.id));

      setAssociatedList(associados);
      setNotAssociatedList(naoAssociados);
    } catch (error) {
      console.error("Erro ao buscar centros de custo:", error);
    }
  };

  // marcar itens selecionados
  const handleToggle = (value, side) => () => {
    if (side === "left") {
      setLeftChecked((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
    } else {
      setRightChecked((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
    }
  };

  // mover para associados
  const handleMoveRight = () => {
    setAssociatedList((prev) => [...prev, ...leftChecked]);
    setNotAssociatedList((prev) => prev.filter((item) => !leftChecked.includes(item)));
    setLeftChecked([]);
  };

  // mover para não associados
  const handleMoveLeft = () => {
    setNotAssociatedList((prev) => [...prev, ...rightChecked]);
    setAssociatedList((prev) => prev.filter((item) => !rightChecked.includes(item)));
    setRightChecked([]);
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };


  // salvar alterações no backend
  const handleSaveAssociations = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE}/usuario/${selectedEmployee.matricula}/centros`,
        { centros: associatedList.map((c) => c.id) },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      handleCloseModal();
      showSnackbar("Gestão de material atualizada com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar associações:", error);
    }
  };

  // função para renderizar a lista
  const customList = (title, items, checked, side) => (
    <Paper sx={{ width: 250, height: 300, overflow: "auto", borderRadius: 2, p: 1 }}>
      <Typography variant="subtitle2" fontWeight="bold" align="center" gutterBottom>
        {title}
      </Typography>
      {items.map((item) => (
        <Box
          key={item.id}
          onClick={handleToggle(item, side)}
          sx={{
            p: 1,
            cursor: "pointer",
            borderRadius: 1,
            backgroundColor: checked.includes(item) ? "primary.light" : "transparent",
            color: checked.includes(item) ? "white" : "inherit",
            mb: 0.5,
            "&:hover": { backgroundColor: "action.hover" },
          }}
        >
          <Typography variant="body2">{item.descricao}</Typography>
        </Box>
      ))}
    </Paper>
  );


  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_BASE}/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const grouped = {
        "sem-acesso": [],
        "coordenador": [],
        "gestor-material": [],
        "compras": [],
        "gerente": [],
        "diretor": [],
        "cfo": [],
        "gerente_hierarquico": [],
      };

      data.forEach((emp) => {
        const comprasLevel = emp.compras !== null && emp.compras !== undefined ? emp.compras : 0;
        const level = levelMap[comprasLevel] || "sem-acesso";
        grouped[level].push(emp);
      });

      setEmployees(grouped);
    } catch (err) {
      console.error("Erro ao carregar funcionários:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDragStart = (e, employee, sourceLevel) => {
    setDraggedItem({ employee, sourceLevel });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetLevel) => {
    e.preventDefault();
    if (!draggedItem) return;

    const { employee, sourceLevel } = draggedItem;
    if (sourceLevel === targetLevel) {
      setDraggedItem(null);
      return;
    }

    const novoNivel = reverseLevelMap[targetLevel];
    const matricula = employee.matricula;

    const updatedEmployee = { ...employee, compras: novoNivel };

    setEmployees((prev) => ({
      ...prev,
      [sourceLevel]: prev[sourceLevel].filter((emp) => emp.matricula !== employee.matricula),
      [targetLevel]: [...prev[targetLevel], updatedEmployee],
    }));

    setDraggedItem(null);

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE}/usuario/${matricula}`,
        { compras: novoNivel },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Erro ao atualizar hierarquia:", error);

      setEmployees((prev) => ({
        ...prev,
        [targetLevel]: prev[targetLevel].filter((emp) => emp.matricula !== employee.matricula),
        [sourceLevel]: [...prev[sourceLevel], employee],
      }));
    }
  };

  const filteredEmployees = (levelId) => {
    const term = (searchTerms[levelId] || "").toLowerCase().trim();

    return (employees[levelId] || []).filter((emp) => {
      if (!emp || !emp.nome || !emp.ccusto || !emp.matricula) return false;

      const nome = emp.nome.toLowerCase();
      const matricula = emp.matricula.toLowerCase();
      const ccusto = emp.ccusto.toLowerCase();

      if (!term) return true;

      return nome.includes(term) || matricula.includes(term) || ccusto.includes(term);
    });
  };

  // const handleOpenModal = (emp) => {
  //   setSelectedEmployee(emp);
  //   setOpenModal(true);
  // };

  const handleCloseModal = () => {
    setSelectedEmployee(null);
    setOpenModal(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Gerenciar Hierarquia
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Arraste os funcionários entre os níveis para alterar suas permissões
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {hierarchyLevels.map((level) => (
          <Grid item xs={12} sm={6} md={3} key={level.id}>
            <Paper
              sx={{
                p: 2,
                height: 360,
                width: 270,
                display: "flex",
                flexDirection: "column",
                borderRadius: 3,
                boxShadow: 2,
                backgroundColor: level.color,
                transition: "all 0.3s ease",
                "&:hover": { boxShadow: 4 },
              }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, level.id)}
            >
              <Box display="flex" alignItems="center" mb={2}>
                <level.icon size={20} style={{ marginRight: 8 }} />
                <Typography fontWeight="bold">{level.title}</Typography>
                <Typography
                  variant="body2"
                  ml="auto"
                  sx={{
                    backgroundColor: "white",
                    px: 1,
                    borderRadius: 1,
                    fontWeight: "bold",
                    boxShadow: 1,
                  }}
                >
                  {filteredEmployees(level.id).length}
                </Typography>
              </Box>

              <TextField
                placeholder={`Buscar em ${level.title}`}
                size="small"
                fullWidth
                value={searchTerms[level.id] || ""}
                onChange={(e) =>
                  setSearchTerms((prev) => ({ ...prev, [level.id]: e.target.value }))
                }
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} />
                    </InputAdornment>
                  ),
                }}
              />

              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  maxHeight: 380,
                  pr: 1,
                  "&::-webkit-scrollbar": { width: 6 },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#bbb",
                    borderRadius: 3,
                  },
                }}
              >
                {filteredEmployees(level.id).map((emp) => (
                  <Paper
                    key={emp.matricula}
                    draggable
                    onDragStart={(e) => handleDragStart(e, emp, level.id)}
                    onDoubleClick={() => handleOpenModal(emp)} // 👈 aqui abre o modal
                    sx={{
                      p: 1.5,
                      mb: 1,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "grab",
                      borderRadius: 2,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: "white",
                        transform: "scale(1.02)",
                        boxShadow: 2,
                      },
                    }}
                  >
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight="medium">
                        {emp.nome || "Não informado"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {emp.ccusto ? `${emp.ccusto} - ` : ""} {emp.matricula || "Não informado"}
                      </Typography>
                    </Box>
                    <Move size={16} style={{ opacity: 0.6 }} />
                  </Paper>
                ))}

                {filteredEmployees(level.id).length === 0 && (
                  <Box textAlign="center" color="text.secondary" mt={3}>
                    <Users size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <Typography variant="body2">
                      {searchTerms[level.id]
                        ? "Nenhum funcionário encontrado"
                        : "Nenhum funcionário"}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Modal de funcionário */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            fontWeight: "bold",
            textAlign: "center",
            bgcolor: "primary.main",
            color: "white",
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
        >
          Gestões do Funcionário
        </DialogTitle>

        <DialogContent dividers sx={{ minHeight: 420 }}>
          {selectedEmployee && (
            <Box mb={3} textAlign="center">
              <Typography variant="h6">{selectedEmployee.nome}</Typography>
              <Typography variant="body2" color="text.secondary">
                Matrícula: {selectedEmployee.matricula}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Modifique a gestão de material do colaborador
              </Typography>
            </Box>
          )}

          <Grid container spacing={2} justifyContent="center" alignItems="center">
            {/* Lista não associados */}
            <Grid item>
              {customList("Não Associados", notAssociatedList, leftChecked, "left")}
            </Grid>

            {/* Botões */}
            <Grid item>
              <Grid container direction="column" alignItems="center">
                <Button
                  sx={{ my: 0.5 }}
                  variant="outlined"
                  size="small"
                  onClick={handleMoveRight}
                  disabled={leftChecked.length === 0}
                >
                  &gt;
                </Button>
                <Button
                  sx={{ my: 0.5 }}
                  variant="outlined"
                  size="small"
                  onClick={handleMoveLeft}
                  disabled={rightChecked.length === 0}
                >
                  &lt;
                </Button>
              </Grid>
            </Grid>

            {/* Lista associados */}
            <Grid item>
              {customList("Associados", associatedList, rightChecked, "right")}
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center" }}>
          <Button onClick={handleCloseModal} color="error" variant="outlined">
            Fechar
          </Button>
          <Button onClick={handleSaveAssociations} color="primary" variant="contained">
            Salvar Alterações
          </Button>
        </DialogActions>
      </Dialog>
      <CustomSnackbar
        open={snackbarOpen}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default HierarchyManager;
