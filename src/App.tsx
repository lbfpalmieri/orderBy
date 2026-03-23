import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import AppShell from "@/components/AppShell";
import Produtos from "@/pages/Produtos";
import Loja from "@/pages/Loja";
import Fabrica from "@/pages/Fabrica";
import Acesso from "@/pages/Acesso";
import RequireAdmin from "@/components/RequireAdmin";
import Historico from "@/pages/Historico";

export default function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/acesso" element={<Acesso />} />
          <Route
            path="/produtos"
            element={
              <RequireAdmin>
                <Produtos />
              </RequireAdmin>
            }
          />
          <Route path="/loja" element={<Loja />} />
          <Route path="/historico" element={<Historico />} />
          <Route
            path="/fabrica"
            element={
              <RequireAdmin>
                <Fabrica />
              </RequireAdmin>
            }
          />
        </Routes>
      </AppShell>
    </Router>
  );
}
