<<<<<<< HEAD
import{r as s,a as f}from"./index.js";function u(){const[i,r]=s.useState([]),[o,t]=s.useState(!1),[n,c]=s.useState(!1),e="https://ffasip.ddns.net:4545/compras/backend/public/api/filiais";return s.useEffect(()=>{t(!0),f.get(e).then(a=>r(a.data)).catch(a=>{console.error("Erro ao buscar filiais:",a),c(!0)}).finally(()=>t(!1))},[e]),{filiais:i,loading:o,error:n}}export{u};
=======
import{r as a,a as n}from"./index.js";function f(){const[i,r]=a.useState([]),[o,s]=a.useState(!1),[c,l]=a.useState(!1),t="https://compras.painel-telecom.com/backend/public/api/filiais";return a.useEffect(()=>{s(!0),n.get(t).then(e=>r(e.data)).catch(e=>{console.error("Erro ao buscar filiais:",e),l(!0)}).finally(()=>s(!1))},[t]),{filiais:i,loading:o,error:c}}export{f as u};
>>>>>>> a407070151f2236f6c2396cb7b70326c51b418c0
