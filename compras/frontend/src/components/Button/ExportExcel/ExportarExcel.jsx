// components/Button/ExportExcel/ExportExcel.jsx
import { Button } from "@mui/material";
import { FiDownload } from "react-icons/fi";
import * as XLSX from "xlsx";
import axios from "axios";

export default function ExportExcel({ 
  headers,        // Array de objetos { label, key }
  endpoint,       // URL do endpoint para buscar os dados
  filename = "relatorio", 
  buttonText = "Exportar para Excel",
  variant = "contained",
  color = "primary",
  size = "medium",
  filters = {},   // Filtros adicionais para enviar na requisição
  transformData = (data) => data, // Função para transformar os dados antes de exportar
  disabled = false,
  onExportStart = () => {},
  onExportSuccess = () => {},
  onExportError = () => {}
}) {
  
  const handleExport = async () => {
    try {
      onExportStart();
      
      // Buscar dados do backend
      const token = localStorage.getItem("token");
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      
      let data = response.data;
      
      // Aplicar transformação se fornecida
      if (transformData) {
        data = transformData(data);
      }
      
      // Mapear os dados conforme os headers fornecidos
      const worksheetData = data.map(item => {
        const row = {};
        headers.forEach(header => {
          if (typeof header.key === 'function') {
            row[header.label] = header.key(item);
          } else {
            row[header.label] = item[header.key];
          }
        });
        return row;
      });
      
      // Criar worksheet
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      
      // Ajustar largura das colunas (opcional)
      const colWidths = headers.map(header => ({
        wch: Math.max(header.label.length, 15)
      }));
      worksheet['!cols'] = colWidths;
      
      // Criar workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
      
      // Exportar arquivo
      XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.xlsx`);
      
      onExportSuccess();
      
    } catch (error) {
      console.error("Erro ao exportar:", error);
      onExportError(error);
    }
  };
  
  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      onClick={handleExport}
      disabled={disabled}
      startIcon={<FiDownload />}
    >
      {buttonText}
    </Button>
  );
}