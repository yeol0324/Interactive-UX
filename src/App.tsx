import { Suspense, useState, useTransition } from "react";
import LottiePage from "./animations/lottie/index.tsx";
import Layout from "./Layout.tsx";
import { Route, Routes, useNavigate } from "react-router-dom";

export default function App() {
  const navigate = useNavigate();
  return (
    <Suspense fallback={<BigSpinner />}>
      <Layout isPending={true}>
        <Routes>
          <Route
            path="/"
            element={
              <div>
                this is interactive-ux project
                <button onClick={() => navigate("/lottie")}>lottie</button>
              </div>
            }
          />
          <Route path="/lottie" element={<LottiePage />} />
        </Routes>
      </Layout>
    </Suspense>
  );
}

function BigSpinner() {
  return <h2>🌀 Loading...</h2>;
}
