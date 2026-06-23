<<<<<<< HEAD
import{r as e,a as u}from"./index.js";function i(){const[o,a]=e.useState([]),[n,t]=e.useState(!1),[c,f]=e.useState(!1),r="https://ffasip.ddns.net:4545/compras/backend/public/api/fornecedores";return e.useEffect(()=>{t(!0),u.get(r).then(s=>a(s.data)).catch(s=>{console.error(s),f(!0)}).finally(()=>t(!1))},[r]),{fornecedores:o,loading:n,error:c}}export{i as u};
=======
import{r as e,a as f}from"./index.js";function i(){const[s,a]=e.useState([]),[c,o]=e.useState(!1),[n,u]=e.useState(!1),r="https://compras.painel-telecom.com/backend/public/api/fornecedores";return e.useEffect(()=>{o(!0),f.get(r).then(t=>a(t.data)).catch(t=>{console.error(t),u(!0)}).finally(()=>o(!1))},[r]),{fornecedores:s,loading:c,error:n}}export{i as u};
>>>>>>> a407070151f2236f6c2396cb7b70326c51b418c0
