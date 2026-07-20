import { Button } from "@mui/material";
import { FiFilter } from "react-icons/fi";

function FilterButton() {
    return (
        <Button variant="outlined" startIcon={<FiFilter />}>Filtrar</Button>
    )
}


export default FilterButton;