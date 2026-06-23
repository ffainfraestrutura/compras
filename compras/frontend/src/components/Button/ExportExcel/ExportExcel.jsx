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
      
      // Verificar e extrair os dados corretamente
      let data = response.data;
      
      // Se for objeto com propriedade data (comum em APIs paginadas)
      if (data && data.data && Array.isArray(data.data)) {
        data = data.data;
      } 
      // Se for objeto com propriedade dados (padrão brasileiro)
      else if (data && data.dados && Array.isArray(data.dados)) {
        data = data.dados;
      }
      // Se for objeto com propriedade results (Django REST)
      else if (data && data.results && Array.isArray(data.results)) {
        data = data.results;
      }
      // Se for objeto com propriedade items (padrão comum)
      else if (data && data.items && Array.isArray(data.items)) {
        data = data.items;
      }
      // Se for array diretamente
      else if (Array.isArray(data)) {
        data = data;
      }
      // Se for objeto único
      else if (data && typeof data === 'object' && !Array.isArray(data)) {
        data = [data];
      }
      // Se não for array e nem objeto, tenta converter
      else {
        console.error("Formato de dados não reconhecido:", data);
        throw new Error("Formato de dados inválido para exportação");
      }
      
      // Verificar se há dados
      if (!data || data.length === 0) {
        throw new Error("Não há dados para exportar");
      }
      
      // Aplicar transformação se fornecida
      if (transformData) {
        data = transformData(data);
      }
      
      // Garantir que data é um array
      if (!Array.isArray(data)) {
        throw new Error("Dados transformados não são um array");
      }
      
      // Mapear os dados conforme os headers fornecidos
      const worksheetData = data.map(item => {
        const row = {};
        headers.forEach(header => {
          if (typeof header.key === 'function') {
            row[header.label] = header.key(item);
          } else {
            // Acessar propriedade aninhada (ex: 'user.name')
            const value = header.key.split('.').reduce((obj, key) => {
              return obj && obj[key] !== undefined ? obj[key] : '';
            }, item);
            row[header.label] = value;
          }
        });
        return row;
      });
      
      // Criar worksheet
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      
      // Ajustar largura das colunas
      const colWidths = headers.map(header => ({
        wch: Math.max(header.label.length, 20)
      }));
      worksheet['!cols'] = colWidths;
      
      // Criar workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
      
      // Exportar arquivo
      const date = new Date().toISOString().slice(0,19).replace(/:/g, '-');
      XLSX.writeFile(workbook, `${filename}_${date}.xlsx`);
      
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